import { useEffect, useState } from "react";
import api from "../utils/api";

/** Clinic settings (name, address, currency…) for printable documents. */
const useClinic = () => {
  const [clinic, setClinic] = useState(null);

  useEffect(() => {
    api
      .get("/clinic")
      .then((r) => setClinic(r.data))
      .catch(() => {});
  }, []);

  return clinic;
};

export default useClinic;
