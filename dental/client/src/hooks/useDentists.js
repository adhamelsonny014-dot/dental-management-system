import { useEffect, useState } from "react";
import api from "../utils/api";

/** Dentists from /api/staff (used by booking, notes, plans, prescriptions, invoices). */
const useDentists = ({ activeOnly = false } = {}) => {
  const [dentists, setDentists] = useState([]);

  useEffect(() => {
    const query = activeOnly ? "/staff?role=dentist&active=true" : "/staff?role=dentist";
    api
      .get(query)
      .then((r) => setDentists(r.data))
      .catch(() => {});
  }, [activeOnly]);

  return dentists;
};

export default useDentists;
