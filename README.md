# DentalCare — Dental Management System

A full-stack web application for managing a dental clinic. Built with the MERN stack (MongoDB, Express, React, Node.js).

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Pages & modules](#pages--modules)
- [Data models](#data-models)
- [Roles & permissions](#roles--permissions)
- [Key design decisions](#key-design-decisions)

---

## Features

**Patient management** — searchable patient list with full profiles, medical history, allergies, medications, emergency contacts, and document tabs.

**Appointment calendar** — FullCalendar-powered day/week/month view per dentist, drag-and-drop booking, 6 appointment statuses, per-dentist color coding.

**Waiting room** — real-time today's queue with one-click status flow (Scheduled → Confirmed → In Progress → Completed), auto-refresh every 60 seconds.

**Staff management** — add dentists and staff with roles, specializations, per-day schedules, and calendar colors.

**32-tooth dental chart** — interactive SVG chart with 10 condition types (healthy, cavity, filled, crown, missing, implant, root canal, bridge, veneer, extraction-needed) and per-surface annotations.

**SOAP clinical notes** — structured Subjective/Objective/Assessment/Plan notes linked to appointments, with procedure tagging, vitals, and follow-up dates.

**Treatment plans** — multi-procedure plans with cost estimates, per-procedure status tracking, discount and approval workflow.

**Prescriptions** — printable prescriptions with medication name, dosage, frequency, duration, and dispensing tracking.

**Invoices & payments** — full billing lifecycle from draft → sent → partial → paid, auto-populate from treatment plans, printable invoice PDF, payment recording (cash/card/bank-transfer/insurance/cheque), payment reversal.

**Notifications** — in-app, email, and SMS notification records with appointment reminder auto-generation.

**Reports & analytics** — 8 charts powered by Recharts: monthly revenue, appointment trends, type distribution, patient growth, revenue by dentist, payment methods, and top procedures. All charts respond to a configurable date range.

---

## Tech stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | ≥ 18 | Runtime |
| Express | ^4.21 | HTTP server & routing |
| Mongoose | ^8.13 | MongoDB ODM |
| bcryptjs | ^2.4 | Password hashing |
| jsonwebtoken | ^9.0 | JWT authentication |
| dotenv | ^16.4 | Environment variables |
| cors | ^2.8 | Cross-origin requests |
| nodemon | ^3.1 | Dev auto-restart |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| React | ^19.0 | UI framework |
| Vite | ^6.2 | Build tool & dev server |
| React Router DOM | ^7.4 | Client-side routing |
| Axios | ^1.8 | HTTP client with interceptors |
| Tailwind CSS | ^3.4 | Utility-first styling |
| FullCalendar | ^6.1 | Appointment calendar |
| Recharts | ^2.12 | Analytics charts |
| react-hot-toast | ^2.4 | Toast notifications |

---

## Project structure

```
dental/
├── server/
│   ├── Controllers/
│   │   ├── auth.js
│   │   ├── clinic.js
│   │   ├── patient.js
│   │   ├── staff.js
│   │   ├── appointment.js
│   │   ├── notification.js
│   │   ├── dentalChart.js
│   │   ├── clinicalNote.js
│   │   ├── treatmentPlan.js
│   │   ├── prescription.js
│   │   ├── invoice.js
│   │   ├── payment.js
│   │   └── reports.js
│   ├── Models/
│   │   ├── User.js
│   │   ├── Clinic.js
│   │   ├── Patient.js
│   │   ├── Staff.js
│   │   ├── Appointment.js
│   │   ├── Notification.js
│   │   ├── DentalChart.js
│   │   ├── ClinicalNote.js
│   │   ├── TreatmentPlan.js
│   │   ├── Prescription.js
│   │   ├── Invoice.js
│   │   └── Payment.js
│   ├── Routers/
│   │   └── (one file per controller)
│   ├── middleware/
│   │   └── auth.js          # JWT protect + requireRole
│   ├── database.js
│   ├── index.js
│   ├── .env
│   └── package.json
│
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Settings.jsx
    │   │   ├── PatientList.jsx
    │   │   ├── PatientProfile.jsx
    │   │   ├── AddEditPatient.jsx
    │   │   ├── StaffManagement.jsx
    │   │   ├── AppointmentCalendar.jsx
    │   │   ├── WaitingRoom.jsx
    │   │   ├── Notifications.jsx
    │   │   ├── DentalChart.jsx
    │   │   ├── ClinicalNotes.jsx
    │   │   ├── TreatmentPlan.jsx
    │   │   ├── Prescriptions.jsx
    │   │   ├── Invoices.jsx
    │   │   ├── Payments.jsx
    │   │   └── Reports.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── AppLayout.jsx
    │   │   ├── PrivateRoute.jsx
    │   │   ├── PageHeader.jsx
    │   │   ├── ConfirmModal.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── PatientTable.jsx
    │   │   ├── PatientForm.jsx
    │   │   ├── TagInput.jsx
    │   │   ├── BookAppointmentModal.jsx
    │   │   ├── AppointmentDetailModal.jsx
    │   │   ├── ToothSVG.jsx
    │   │   ├── ToothConditionPanel.jsx
    │   │   └── SOAPForm.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── utils/
    │   │   └── api.js         # Axios instance with JWT interceptor
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Getting started

### Prerequisites

- Node.js 18 or higher
- MongoDB (local or Atlas)
- npm

### 1. Clone / extract the project

```bash
unzip dental_session8.zip
cd dental
```

### 2. Set up the server

```bash
cd server
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env .env.local
```

Edit `.env` — see [Environment variables](#environment-variables) below.

```bash
npm run dev       # starts on http://localhost:4000
```

### 3. Set up the client

```bash
cd ../client
npm install
npm run dev       # starts on http://localhost:5173
```

### 4. Create your first admin account

Visit `http://localhost:5173/register` and create an account with role **admin**.

Or POST directly:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Ahmed Hassan","email":"admin@clinic.com","password":"password123","role":"admin"}'
```

---

## Environment variables

Create a `.env` file inside `server/`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/dental_management
JWT_SECRET=your_super_secret_key_change_this_in_production
CLIENT_URL=http://localhost:5173
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `MONGO_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret for signing JWT tokens — **change this** | — |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |

---

## API reference

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Create user account |
| POST | `/login` | No | Get JWT token |
| GET | `/me` | Yes | Get current user |

### Clinic — `/api/clinic`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Get clinic settings |
| PUT | `/` | Admin | Update clinic settings |

### Patients — `/api/patients`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?search=&page=&limit=&status=` | Yes | List patients (paginated, searchable) |
| GET | `/:id` | Yes | Get single patient |
| POST | `/` | Yes | Create patient |
| PUT | `/:id` | Yes | Update patient |
| DELETE | `/:id` | Admin/Dentist | Delete patient |

### Staff — `/api/staff`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?role=&active=` | Yes | List staff |
| GET | `/:id` | Yes | Get staff member |
| POST | `/` | Admin | Add staff member |
| PUT | `/:id` | Admin | Update staff member |
| DELETE | `/:id` | Admin | Remove staff member |

### Appointments — `/api/appointments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?dentist=&patient=&start=&end=&today=true` | Yes | List appointments |
| GET | `/:id` | Yes | Get appointment |
| POST | `/` | Yes | Book appointment |
| PUT | `/:id` | Yes | Update appointment |
| PATCH | `/:id/status` | Yes | Update status only |
| DELETE | `/:id` | Yes | Delete appointment |

### Dental chart — `/api/dental-chart`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:patientId` | Yes | Get chart (auto-creates if missing) |
| PATCH | `/:patientId/tooth` | Yes | Update single tooth |
| PATCH | `/:patientId/notes` | Yes | Update chart notes |

### Clinical notes — `/api/clinical-notes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?patient=&appointment=&page=&limit=` | Yes | List notes |
| GET | `/:id` | Yes | Get note |
| POST | `/` | Yes | Create SOAP note |
| PUT | `/:id` | Yes | Update note |
| DELETE | `/:id` | Yes | Delete note |

### Treatment plans — `/api/treatment-plans`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?patient=&status=` | Yes | List plans |
| GET | `/:id` | Yes | Get plan |
| POST | `/` | Yes | Create plan |
| PUT | `/:id` | Yes | Update plan |
| PATCH | `/:id/status` | Yes | Update plan status |
| PATCH | `/:id/procedure/:procId` | Yes | Update single procedure |
| DELETE | `/:id` | Yes | Delete plan |

### Prescriptions — `/api/prescriptions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?patient=&page=&limit=` | Yes | List prescriptions |
| GET | `/:id` | Yes | Get prescription |
| POST | `/` | Yes | Create prescription |
| PUT | `/:id` | Yes | Update prescription |
| PATCH | `/:id/dispense` | Yes | Mark as dispensed |
| DELETE | `/:id` | Yes | Delete prescription |

### Invoices — `/api/invoices`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?patient=&status=&page=&limit=` | Yes | List invoices |
| GET | `/:id` | Yes | Get invoice with payments |
| POST | `/` | Yes | Create invoice manually |
| POST | `/from-plan/:planId` | Yes | Auto-create from treatment plan |
| PUT | `/:id` | Yes | Update invoice |
| PATCH | `/:id/status` | Yes | Update status |
| DELETE | `/:id` | Yes | Delete invoice + payments |

### Payments — `/api/payments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?patient=&invoice=&page=&limit=` | Yes | List payments |
| POST | `/` | Yes | Record payment (auto-syncs invoice status) |
| DELETE | `/:id` | Yes | Reverse payment (auto-syncs invoice status) |

### Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?status=&channel=&page=&limit=` | Yes | List notifications |
| GET | `/unread-count` | Yes | Get unread badge count |
| POST | `/` | Yes | Create notification |
| POST | `/send-reminder/:appointmentId` | Yes | Auto-send appointment reminder |
| PATCH | `/:id/read` | Yes | Mark as read |
| PATCH | `/mark-all-read` | Yes | Mark all as read |
| DELETE | `/:id` | Yes | Delete notification |

### Reports — `/api/reports`

All report endpoints accept `?start=YYYY-MM-DD&end=YYYY-MM-DD`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/overview` | Yes | 12 KPI numbers |
| GET | `/revenue-by-month` | Yes | Monthly revenue vs invoiced |
| GET | `/appointments-by-month` | Yes | Appointments by status per month |
| GET | `/appointments-by-type` | Yes | Pie distribution by type |
| GET | `/patients-growth` | Yes | New patients + cumulative total |
| GET | `/revenue-by-dentist` | Yes | Revenue per practitioner |
| GET | `/payment-methods` | Yes | Breakdown by payment method |
| GET | `/top-procedures` | Yes | Top 10 invoice line items |

---

## Pages & modules

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Split-panel sign-in with clinic branding |
| Register | `/register` | Account creation with role selection |
| Dashboard | `/dashboard` | Live KPIs, today's appointments, quick actions |
| Settings | `/settings` | Clinic info, working hours, currency |
| Patient list | `/patients` | Searchable, filterable, paginated table |
| Patient profile | `/patients/:id` | Tabs: overview, medical history, documents |
| Add/Edit patient | `/patients/new` or `/:id/edit` | Full registration form with tag inputs |
| Staff | `/staff` | Card grid with drawer editor and schedule |
| Appointments | `/appointments` | FullCalendar with booking + detail modals |
| Waiting room | `/waiting-room` | Today's queue with status action buttons |
| Notifications | `/notifications` | History log with compose modal |
| Dental chart | `/dental-chart/:patientId` | 32-tooth SVG with condition panel |
| Clinical notes | `/clinical-notes/:patientId` | SOAP notes with expandable history |
| Treatment plan | `/treatment-plan/:patientId` | Procedure table with cost estimates |
| Prescriptions | `/prescriptions/:patientId` | Rx list with printable view |
| Invoices | `/invoices` | Global invoice table with payment modal |
| Payments | `/payments` | Payment history with reversal guard |
| Reports | `/reports` | 8 Recharts analytics with date range |

---

## Data models

### User
Fields: `name`, `email`, `password` (hashed), `role` (admin / dentist / receptionist / assistant), `isActive`, `lastLogin`

### Patient
Fields: `firstName`, `lastName`, `dateOfBirth`, `gender`, `phone`, `email`, `address`, `emergencyContact`, `bloodType`, `allergies[]`, `medications[]`, `conditions[]`, `medicalNotes`, `patientNumber` (auto P00001), `status`

### Staff
Fields: `firstName`, `lastName`, `role`, `specialization`, `phone`, `email`, `color` (hex, for calendar), `schedule[]` (per-day open/start/end), `isActive`

### Appointment
Fields: `patient` (ref), `dentist` (ref), `startTime`, `endTime`, `status` (scheduled / confirmed / in-progress / completed / cancelled / no-show), `type` (checkup / cleaning / filling / extraction / root-canal / crown / whitening / orthodontics / consultation / other), `reason`, `notes`

### DentalChart
Fields: `patient` (ref, unique), `teeth[32]` (each: number, condition, surfaces[], notes), `notes`, `lastUpdatedBy`

Tooth conditions: `healthy` / `cavity` / `filled` / `crown` / `missing` / `implant` / `root-canal` / `bridge` / `veneer` / `extraction-needed`

### ClinicalNote
Fields: `patient` (ref), `appointment` (ref), `dentist` (ref), `visitDate`, `subjective`, `objective`, `assessment`, `plan`, `procedures[]`, `vitals` (BP, pulse, temp), `followUpDate`

### TreatmentPlan
Fields: `patient` (ref), `dentist` (ref), `title`, `status` (draft / proposed / approved / in-progress / completed / cancelled), `procedures[]` (each: name, tooth, surface, quantity, unitCost, status), `discount`, `discountType` (flat / percent), `approvedAt`, `approvedBy`

Virtuals: `subtotal`, `grandTotal`

### Prescription
Fields: `patient` (ref), `dentist` (ref), `prescriptionNumber` (auto RX-YYYYMMDD-0001), `issueDate`, `medications[]` (name, dosage, frequency, duration, instructions, quantity), `diagnosis`, `isDispensed`

### Invoice
Fields: `patient` (ref), `dentist` (ref), `invoiceNumber` (auto INV-YYYY-0001), `issueDate`, `dueDate`, `status` (draft / sent / partial / paid / overdue / cancelled), `lineItems[]` (description, tooth, quantity, unitPrice), `discount`, `discountType`, `taxRate`, `insuranceCoverage`, `insuranceProvider`

Virtuals: `subtotal`, `discountAmount`, `taxAmount`, `grandTotal`, `amountDue`

### Payment
Fields: `invoice` (ref), `patient` (ref), `amount`, `method` (cash / card / bank-transfer / insurance / cheque / other), `paymentDate`, `reference`, `receiptNumber` (auto RCP-YYYYMMDD-0001)

### Notification
Fields: `type`, `channel` (email / sms / in-app), `recipient` (patientId or userId, name, contact), `subject`, `body`, `status` (pending / sent / failed / read), `appointment` (ref)

---

## Roles & permissions

| Action | Admin | Dentist | Receptionist | Assistant |
|--------|-------|---------|--------------|-----------|
| View patients | ✅ | ✅ | ✅ | ✅ |
| Create/edit patients | ✅ | ✅ | ✅ | ✅ |
| Delete patients | ✅ | ✅ | ❌ | ❌ |
| Manage staff | ✅ | ❌ | ❌ | ❌ |
| Book appointments | ✅ | ✅ | ✅ | ✅ |
| Clinical notes & charts | ✅ | ✅ | ❌ | ✅ |
| Invoices & payments | ✅ | ✅ | ✅ | ❌ |
| Clinic settings | ✅ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ | ✅ |

Permissions are enforced via the `requireRole(...roles)` middleware on protected routes.

---

## Key design decisions

**Singleton clinic document** — There is exactly one `Clinic` document in the database. `GET /api/clinic` creates it automatically on first access, so no manual seeding is needed.

**Auto-generated numbers** — Patient numbers (`P00001`), invoice numbers (`INV-2025-0001`), prescription numbers (`RX-20250515-0001`), and receipt numbers are all generated in Mongoose `pre("save")` hooks, not in the frontend.

**Invoice status sync** — Invoice status (sent / partial / paid) is recalculated automatically every time a payment is created or reversed, via the `syncStatus()` helper called inside the payment controller. You never set payment status manually.

**DentalChart auto-creation** — The first `GET /api/dental-chart/:patientId` call creates a fresh 32-tooth chart initialised to "healthy" if one doesn't exist yet. No explicit chart creation endpoint is needed.

**JWT interceptor** — All Axios requests automatically attach the stored token via a request interceptor in `src/utils/api.js`. A 401 response automatically clears the token and redirects to `/login`.

**FullCalendar date range fetch** — The appointment calendar calls `fetchAppointments` inside FullCalendar's `datesSet` callback, so appointments are re-fetched every time the user navigates to a new date range. No stale data.

**Reports run in parallel** — All 8 report API calls are fired simultaneously with `Promise.allSettled`, so a slow aggregation on one chart never blocks the others from rendering.

---

## Building for production

```bash
# Build the client
cd client
npm run build
# Output is in client/dist/

# Serve the API (use PM2 or similar in production)
cd ../server
node index.js
```

For production, set `NODE_ENV=production` and use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server/index.js --name dental-api
pm2 save
```

---

## What's not included (future work)

- **Insurance claims** — tracking submission and approval with insurers
- **Lab orders** — crown/mold order tracking with external labs
- **Patient portal** — patient-facing login to view appointments and invoices
- **File uploads** — X-ray and document storage (requires cloud storage like S3)
- **Email/SMS sending** — notification system stores records but does not actually send (requires Twilio / SendGrid integration)
- **Recurring appointments** — booking multiple appointments in a series
