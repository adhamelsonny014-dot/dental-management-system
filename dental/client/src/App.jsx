import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import AppLayout from "./components/AppLayout";

import Login                from "./pages/Login";
import Register              from "./pages/Register";
import Dashboard             from "./pages/Dashboard";
import Settings              from "./pages/Settings";
import PatientList           from "./pages/PatientList";
import PatientProfile        from "./pages/PatientProfile";
import AddEditPatient        from "./pages/AddEditPatient";
import StaffManagement       from "./pages/StaffManagement";
import AppointmentCalendar   from "./pages/AppointmentCalendar";
import WaitingRoom           from "./pages/WaitingRoom";
import Notifications         from "./pages/Notifications";
import DentalChart           from "./pages/DentalChart";
import ClinicalNotes         from "./pages/ClinicalNotes";
import TreatmentPlan         from "./pages/TreatmentPlan";
import Prescriptions         from "./pages/Prescriptions";
import Invoices              from "./pages/Invoices";
import Payments              from "./pages/Payments";
import Reports               from "./pages/Reports";
import PublicLayout          from "./components/public/PublicLayout";
import Home                  from "./pages/public/Home";
import About                 from "./pages/public/About";
import Services              from "./pages/public/Services";
import Doctors               from "./pages/public/Doctors";
import Contact               from "./pages/public/Contact";
import Book                  from "./pages/public/Book";
import PatientRegister       from "./pages/public/PatientRegister";
import BookingRequests       from "./pages/BookingRequests";
import DoctorAccounts        from "./pages/DoctorAccounts";

const App = () => {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/book" element={<Book />} />
          <Route path="/register-patient" element={<PatientRegister />} />
        </Route>

        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — wrapped in sidebar layout */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/dashboard"         element={<Dashboard />} />
          <Route path="/patients"           element={<PatientList />} />
          <Route path="/patients/new"       element={<AddEditPatient />} />
          <Route path="/patients/:id"       element={<PatientProfile />} />
          <Route path="/patients/:id/edit"  element={<AddEditPatient />} />
          <Route path="/appointments" element={<AppointmentCalendar />} />
          <Route path="/booking-requests" element={<BookingRequests />} />
          <Route path="/staff"        element={<StaffManagement />} />
          <Route path="/waiting-room"  element={<WaitingRoom />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/dental-chart/:patientId"    element={<DentalChart />} />
          <Route path="/clinical-notes/:patientId"  element={<ClinicalNotes />} />
          <Route path="/treatment-plan/:patientId"  element={<TreatmentPlan />} />
          <Route path="/prescriptions/:patientId"   element={<Prescriptions />} />
          <Route path="/invoices"     element={<Invoices />} />
          <Route path="/payments"     element={<Payments />} />
          <Route path="/reports"      element={<Reports />} />
          <Route path="/settings"          element={<Settings />} />
          <Route path="/doctor-accounts"   element={<DoctorAccounts />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
