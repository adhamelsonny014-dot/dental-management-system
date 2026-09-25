// API tests: run with `npm test` (starts a temporary in-memory MongoDB).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
delete process.env.SMTP_HOST;

const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const User = require("../Models/User");
const Staff = require("../Models/Staff");
const Appointment = require("../Models/Appointment");
const Invoice = require("../Models/Invoice");
const { seedFeaturedDoctors } = require("../seed/featuredDoctors");

let mongo;
const tokens = {};
let dentistStaff;
let otherDentistStaff;

const api = (role) => ({
  get: (url) => request(app).get(url).set("Authorization", `Bearer ${tokens[role]}`),
  post: (url, body) => request(app).post(url).set("Authorization", `Bearer ${tokens[role]}`).send(body),
  put: (url, body) => request(app).put(url).set("Authorization", `Bearer ${tokens[role]}`).send(body),
  patch: (url, body) => request(app).patch(url).set("Authorization", `Bearer ${tokens[role]}`).send(body),
  delete: (url) => request(app).delete(url).set("Authorization", `Bearer ${tokens[role]}`),
});

// Next Monday as YYYY-MM-DD (dentists work Mondays 09:00–18:00 by default)
const nextMonday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const createUser = async (role, email) => {
  await User.create({ name: `Test ${role}`, email, password: "password123", role });
  const res = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  assert.equal(res.status, 200, `login for ${role}`);
  return res.body.token;
};

const newPatient = async (role = "admin", body = {}) => {
  const res = await api(role).post("/api/patients", { firstName: "Test", lastName: "Patient", ...body });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
};

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  tokens.admin = await createUser("admin", "admin@test.com");
  tokens.reception = await createUser("receptionist", "reception@test.com");
  tokens.dentist = await createUser("dentist", "dentist@test.com");
  tokens.assistant = await createUser("assistant", "assistant@test.com");

  const dentistUser = await User.findOne({ email: "dentist@test.com" });
  dentistStaff = await Staff.create({
    firstName: "Mona",
    lastName: "Adel",
    role: "dentist",
    email: "dentist@test.com",
    userId: dentistUser._id,
  });
  otherDentistStaff = await Staff.create({ firstName: "Karim", lastName: "Nabil", role: "dentist" });
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

describe("auth", () => {
  test("wrong password returns 401 with a message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "nope" });
    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Invalid email or password");
  });

  test("public staff sign-up no longer exists", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "x", email: "x@x.com", password: "123456" });
    assert.equal(res.status, 404);
  });

  test("/me returns the logged-in user without the password", async () => {
    const res = await api("admin").get("/api/auth/me");
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, "admin@test.com");
    assert.equal(res.body.user.password, undefined);
  });

  test("admin can manage login accounts; others cannot", async () => {
    const created = await api("admin").post("/api/auth/admin/create-account", {
      name: "New Staff",
      email: "new@test.com",
      password: "secret123",
      role: "receptionist",
    });
    assert.equal(created.status, 201);
    const list = await api("admin").get("/api/auth/admin/accounts");
    assert.ok(list.body.some((u) => u.email === "new@test.com"));
    assert.equal((await api("reception").get("/api/auth/admin/accounts")).status, 403);
  });

  test("NoSQL operator injection in the body is stripped", async () => {
    // {$gt:""} must not match the first user and bypass the password check
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: { $gt: "" }, password: { $gt: "" } });
    assert.equal(res.status, 400);
  });

  test("NoSQL operator injection in query params is stripped", async () => {
    // ?status[$ne]=x would otherwise widen the filter
    const res = await api("admin").get("/api/patients?status[$ne]=nonexistent");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.patients));
  });
});

describe("error handling", () => {
  test("malformed id returns 400, not 500", async () => {
    const res = await api("admin").get("/api/patients/not-an-id");
    assert.equal(res.status, 400);
  });

  test("unknown API route returns a JSON 404", async () => {
    const res = await api("admin").get("/api/does-not-exist");
    assert.equal(res.status, 404);
    assert.match(res.body.message, /Route not found/);
  });

  test("validation errors return 400", async () => {
    const patient = await newPatient();
    const res = await api("admin").post("/api/appointments", {
      patient: patient._id,
      dentist: dentistStaff._id,
      startTime: "2030-01-07T10:00:00",
      endTime: "2030-01-07T10:30:00",
      type: "not-a-type",
    });
    assert.equal(res.status, 400);
  });
});

describe("roles and access", () => {
  test("only clinicians can write clinical notes", async () => {
    const patient = await newPatient();
    const note = { patient: patient._id, subjective: "Toothache" };
    assert.equal((await api("reception").post("/api/clinical-notes", note)).status, 403);
    assert.equal((await api("assistant").post("/api/clinical-notes", note)).status, 403);
    assert.equal((await api("dentist").post("/api/clinical-notes", note)).status, 201);
    // everyone on staff can still read them
    assert.equal((await api("reception").get(`/api/clinical-notes?patient=${patient._id}`)).status, 200);
  });

  test("only admins can delete patients; reports are admin/reception only", async () => {
    const patient = await newPatient();
    assert.equal((await api("dentist").delete(`/api/patients/${patient._id}`)).status, 403);
    assert.equal((await api("dentist").get("/api/reports/overview")).status, 403);
    assert.equal((await api("reception").get("/api/reports/overview")).status, 200);
  });

  test("dentists can only open their own patients", async () => {
    const others = await newPatient("admin");
    const mine = await newPatient("dentist");
    assert.equal((await api("dentist").get(`/api/patients/${others._id}`)).status, 403);
    assert.equal((await api("dentist").get(`/api/patients/${mine._id}`)).status, 200);
  });

  test("public staff list hides emails and phone numbers", async () => {
    const res = await request(app).get("/api/public/staff");
    assert.equal(res.status, 200);
    assert.ok(res.body.length > 0);
    for (const s of res.body) {
      assert.equal(s.email, undefined);
      assert.equal(s.phone, undefined);
    }
  });
});

describe("patients", () => {
  test("server-managed fields in the request are ignored", async () => {
    const patient = await newPatient("admin", { patientNumber: "HACKED" });
    assert.notEqual(patient.patientNumber, "HACKED");
    assert.match(patient.patientNumber, /^P\d{5}$/);
  });

  test("numbers are never reused after a deletion", async () => {
    const a = await newPatient();
    const b = await newPatient();
    assert.equal((await api("admin").delete(`/api/patients/${a._id}`)).status, 200);
    const c = await newPatient(); // used to fail with a duplicate key
    assert.notEqual(c.patientNumber, b.patientNumber);
    assert.ok(Number(c.patientNumber.slice(1)) > Number(b.patientNumber.slice(1)));
  });

  test("deleting a patient deletes their records", async () => {
    const patient = await newPatient();
    await Appointment.create({
      patient: patient._id,
      dentist: dentistStaff._id,
      startTime: new Date("2030-01-07T10:00:00"),
      endTime: new Date("2030-01-07T10:30:00"),
    });
    await Invoice.create({ patient: patient._id, lineItems: [{ description: "X", unitPrice: 10 }] });
    await api("admin").delete(`/api/patients/${patient._id}`);
    assert.equal(await Appointment.countDocuments({ patient: patient._id }), 0);
    assert.equal(await Invoice.countDocuments({ patient: patient._id }), 0);
  });
});

describe("billing and reports", () => {
  let invoice;

  test("payments can be recorded and listed", async () => {
    const patient = await newPatient();
    const inv = await api("reception").post("/api/invoices", {
      patient: patient._id,
      status: "sent",
      lineItems: [{ description: "Crown", quantity: 1, unitPrice: 1000 }],
    });
    assert.equal(inv.status, 201);
    invoice = inv.body;

    const pay = await api("reception").post("/api/payments", {
      invoice: invoice._id,
      amount: 400,
      method: "cash",
      patient: new mongoose.Types.ObjectId(),
    });
    assert.equal(pay.status, 201, JSON.stringify(pay.body));
    assert.equal(String(pay.body.patient._id), String(patient._id)); // taken from the invoice

    const list = await api("reception").get(`/api/payments?invoice=${invoice._id}`);
    assert.equal(list.status, 200);
    assert.equal(list.body.payments[0].invoice.grandTotal, 1000);
  });

  test("invoice status follows payments and edits", async () => {
    let inv = await api("reception").get(`/api/invoices/${invoice._id}`);
    assert.equal(inv.body.status, "partial");

    await api("reception").post("/api/payments", { invoice: invoice._id, amount: 600, method: "card" });
    inv = await api("reception").get(`/api/invoices/${invoice._id}`);
    assert.equal(inv.body.status, "paid");

    // adding an item after full payment makes it partial again
    const edited = await api("reception").put(`/api/invoices/${invoice._id}`, {
      lineItems: [
        { description: "Crown", quantity: 1, unitPrice: 1000 },
        { description: "X-ray", quantity: 1, unitPrice: 200 },
      ],
    });
    assert.equal(edited.body.status, "partial");
  });

  test("invalid invoice status is rejected", async () => {
    const res = await api("reception").patch(`/api/invoices/${invoice._id}/status`, { status: "banana" });
    assert.equal(res.status, 400);
  });

  test("reports include invoiced totals (not 0)", async () => {
    const res = await api("admin").get("/api/reports/overview");
    assert.equal(res.status, 200);
    assert.ok(res.body.totalInvoiced >= 1200, `totalInvoiced = ${res.body.totalInvoiced}`);
  });
});

describe("website bookings", () => {
  const date = nextMonday();

  const book = async (serviceType, preferredTime = "") => {
    const res = await request(app)
      .post("/api/public/book")
      .send({
        name: "Sara Ali",
        email: `sara+${Math.random()}@test.com`,
        phone: "0100",
        serviceType,
        preferredDate: date,
        preferredTime,
      });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.bookingId;
  };

  const approve = async (id) => {
    assert.equal(
      (await api("reception").patch(`/api/booking-requests/${id}/assign`, { dentistId: dentistStaff._id }))
        .status,
      200,
    );
    assert.equal(
      (await api("reception").patch(`/api/booking-requests/${id}/send-to-doctor`, {})).status,
      200,
    );
    assert.equal(
      (await api("dentist").patch(`/api/booking-requests/${id}/doctor-response`, { approved: true })).status,
      200,
    );
  };

  test("every service category can be booked and confirmed", async () => {
    for (const [i, service] of ["filling", "cosmetic", "gum", "retainers"].entries()) {
      const id = await book(service, `${10 + i}:00`);
      await approve(id);
      const res = await api("reception").patch(`/api/booking-requests/${id}/confirm-patient`, {});
      assert.equal(res.status, 200, `${service}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.appointment.type, service);
    }
  });

  test("'any time' bookings need a time before going to the doctor", async () => {
    const id = await book("checkup");
    await api("reception").patch(`/api/booking-requests/${id}/assign`, { dentistId: dentistStaff._id });
    const early = await api("reception").patch(`/api/booking-requests/${id}/send-to-doctor`, {});
    assert.equal(early.status, 400);

    const scheduled = await api("reception").patch(`/api/booking-requests/${id}/schedule`, {
      date,
      slotStart: "15:00",
    });
    assert.equal(scheduled.status, 200, JSON.stringify(scheduled.body));
    assert.equal(
      (await api("reception").patch(`/api/booking-requests/${id}/send-to-doctor`, {})).status,
      200,
    );
  });

  test("times outside working hours are rejected", async () => {
    const id = await book("checkup");
    await api("reception").patch(`/api/booking-requests/${id}/assign`, { dentistId: dentistStaff._id });
    const res = await api("reception").patch(`/api/booking-requests/${id}/schedule`, {
      date,
      slotStart: "20:00",
    });
    assert.equal(res.status, 409);
  });

  test("confirming a clashing booking is refused (no double-booking)", async () => {
    const id = await book("checkup", "10:00"); // 10:00 already taken by the filling above
    await approve(id);
    const res = await api("reception").patch(`/api/booking-requests/${id}/confirm-patient`, {});
    assert.equal(res.status, 409);
  });

  test("a dentist can't answer another doctor's booking", async () => {
    const id = await book("checkup", "16:00");
    await api("reception").patch(`/api/booking-requests/${id}/assign`, { dentistId: otherDentistStaff._id });
    await api("reception").patch(`/api/booking-requests/${id}/send-to-doctor`, {});
    const res = await api("dentist").patch(`/api/booking-requests/${id}/doctor-response`, { approved: true });
    assert.equal(res.status, 403);
  });

  test("cancelling a confirmed booking also cancels the appointment", async () => {
    const id = await book("checkup", "17:00");
    await approve(id);
    const confirmed = await api("reception").patch(`/api/booking-requests/${id}/confirm-patient`, {});
    assert.equal(confirmed.status, 200);
    const cancelled = await api("reception").patch(`/api/booking-requests/${id}/cancel`, {});
    assert.equal(cancelled.status, 200);
    const appt = await Appointment.findById(confirmed.body.appointment._id);
    assert.equal(appt.status, "cancelled");
  });
});

describe("notifications", () => {
  test("messages are not marked 'sent' unless they were delivered", async () => {
    const sms = await api("reception").post("/api/notifications", {
      channel: "sms",
      body: "Hello",
      recipient: { name: "Sara", contact: "0100" },
    });
    assert.equal(sms.status, 201);
    assert.equal(sms.body.status, "failed");

    const email = await api("reception").post("/api/notifications", {
      channel: "email",
      body: "Hello",
      recipient: { name: "Sara", contact: "sara@test.com" },
    });
    assert.equal(email.body.status, "pending"); // SMTP not configured in tests
  });

  test("users can't mark someone else's notification as read", async () => {
    const dentistUser = await User.findOne({ email: "dentist@test.com" });
    const Notification = require("../Models/Notification");
    const n = await Notification.create({ body: "For the dentist", recipient: { userId: dentistUser._id } });
    assert.equal((await api("reception").patch(`/api/notifications/${n._id}/read`)).status, 403);
    assert.equal((await api("dentist").patch(`/api/notifications/${n._id}/read`)).status, 200);
  });
});

describe("staff and seed data", () => {
  test("new staff logins get a random temporary password", async () => {
    const staff = await api("admin").post("/api/staff", {
      firstName: "Rana",
      lastName: "Hany",
      role: "receptionist",
      email: "rana@test.com",
    });
    assert.equal(staff.status, 201);
    const res = await api("admin").post(`/api/staff/${staff.body._id}/create-account`, {});
    assert.equal(res.status, 201);
    assert.equal(res.body.login.role, "receptionist");
    assert.ok(res.body.login.tempPassword && res.body.login.tempPassword !== "Doctor123!");
    const user = await User.findOne({ email: "rana@test.com" });
    assert.equal(user.name, "Rana Hany"); // no "Dr." for non-dentists
  });

  test("demo doctors are created once and never overwritten", async () => {
    await seedFeaturedDoctors();
    const tala = await Staff.findOne({ slug: "tala-el-serysy" });
    assert.ok(tala && tala.userId);
    tala.headline = "Edited by admin";
    await tala.save();
    await seedFeaturedDoctors();
    assert.equal((await Staff.findOne({ slug: "tala-el-serysy" })).headline, "Edited by admin");
  });
});
