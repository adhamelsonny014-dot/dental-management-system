import { Outlet } from "react-router-dom";
import AmbientBackground from "./AmbientBackground";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

const PublicLayout = () => (
  <div className="relative min-h-screen bg-clinic-cream text-clinic-ink font-sans antialiased">
    <AmbientBackground />
    <div className="relative z-[1]">
      <PublicNavbar />
      <main className="pt-[4.25rem]">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  </div>
);

export default PublicLayout;
