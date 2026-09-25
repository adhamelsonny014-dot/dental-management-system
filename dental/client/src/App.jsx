import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import AppLayout from "./components/AppLayout";

import PublicLayout from "./components/public/PublicLayout";

// Pages are loaded on demand, so the public site doesn't download the
// calendar/charts code used by the staff portal.
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const PatientList = lazy(() => import("./pages/PatientList"));
const PatientProfile = lazy(() => import("./pages/PatientProfile"));
const AddEditPatient = lazy(() => import("./pages/AddEditPatient"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const AppointmentCalendar = lazy(() => import("./pages/AppointmentCalendar"));
const WaitingRoom = lazy(() => import("./pages/WaitingRoom"));
const Notifications = lazy(() => import("./pages/Notifications"));
const DentalChart = lazy(() => import("./pages/DentalChart"));
const ClinicalNotes = lazy(() => import("./pages/ClinicalNotes"));
const TreatmentPlan = lazy(() => import("./pages/TreatmentPlan"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Payments = lazy(() => import("./pages/Payments"));
const Reports = lazy(() => import("./pages/Reports"));
const Home = lazy(() => import("./pages/public/Home"));
const About = lazy(() => import("./pages/public/About"));
const Services = lazy(() => import("./pages/public/Services"));
const Doctors = lazy(() => import("./pages/public/Doctors"));
const Contact = lazy(() => import("./pages/public/Contact"));
const Book = lazy(() => import("./pages/public/Book"));
const PatientRegister = lazy(() => import("./pages/public/PatientRegister"));
const BookingRequests = lazy(() => import("./pages/BookingRequests"));
const DoctorAccounts = lazy(() => import("./pages/DoctorAccounts"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<PageLoader />}>
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

          <Route path="/login" element={<Login />} />

          {/* Protected — wrapped in sidebar layout */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/new" element={<AddEditPatient />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/patients/:id/edit" element={<AddEditPatient />} />
            <Route path="/appointments" element={<AppointmentCalendar />} />
            <Route path="/booking-requests" element={<BookingRequests />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/dental-chart/:patientId" element={<DentalChart />} />
            <Route path="/clinical-notes/:patientId" element={<ClinicalNotes />} />
            <Route path="/treatment-plan/:patientId" element={<TreatmentPlan />} />
            <Route path="/prescriptions/:patientId" element={<Prescriptions />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/doctor-accounts" element={<DoctorAccounts />} />
          </Route>

          {/* Unknown URLs go back to the home page instead of rendering a blank screen */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
};

export default App;
