import { useEffect, useState } from "react";
import api from "../utils/api";

/** Loads one patient by id (used in the header of the per-patient pages). */
const usePatient = (patientId) => {
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    api
      .get(`/patients/${patientId}`)
      .then((r) => setPatient(r.data))
      .catch(() => {});
  }, [patientId]);

  return patient;
};

export default usePatient;
