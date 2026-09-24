import { Outlet } from "react-router-dom";
import AmbientBackground from "./AmbientBackground";
import PublicNavbar from "./PublicNavbar";

const PublicLayout = () => (
  <div className="relative min-h-screen bg-clinic-cream text-clinic-ink font-sans antialiased">
    <AmbientBackground />
    <div className="relative z-[1]">
      <PublicNavbar />
      <main className="pt-[4.25rem]">
        <Outlet />
      </main>
    </div>
  </div>
);

export default PublicLayout;
