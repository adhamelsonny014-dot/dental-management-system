import axios from "axios";

const publicApi = axios.create({ baseURL: "/api/public" });

export const fetchClinic = () => publicApi.get("/clinic").then((r) => r.data);
export const fetchStaff = () => publicApi.get("/staff").then((r) => r.data);
export const submitContact = (data) => publicApi.post("/contact", data).then((r) => r.data);
export const submitBooking = (data) => publicApi.post("/book", data).then((r) => r.data);
export const submitDirectBooking = (data) => publicApi.post("/book/direct", data).then((r) => r.data);
export const fetchFeaturedDoctors = () => publicApi.get("/featured-doctors").then((r) => r.data);
export const fetchSlots = (dentistId, date) =>
  publicApi.get(`/slots/${dentistId}`, { params: { date } }).then((r) => r.data);
export const registerPatient = (data) => publicApi.post("/register-patient", data).then((r) => r.data);

export default publicApi;
