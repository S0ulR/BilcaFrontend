import { useRef, useState } from "react";
import API from "../services/api";

export const useGeocoder = (countryCode = "AR") => {
  const [suggestions, setSuggestions] = useState([]);
  const timeoutRef = useRef(null);

  const normalizeResults = (payload) => {
    // Caso A: backend devuelve array directo
    if (Array.isArray(payload)) return payload;

    // Caso B: backend devuelve { results: [...] }
    if (payload && Array.isArray(payload.results)) return payload.results;

    // Caso C: backend devuelve { data: [...] }
    if (payload && Array.isArray(payload.data)) return payload.data;

    return [];
  };

  const search = (query) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await API.get("/geocode/search", {
          params: { q: query.trim(), country: countryCode },
        });

        const list = normalizeResults(res.data);
        setSuggestions(list.slice(0, 6));
      } catch (err) {
        // Esto te va a decir la verdad en consola (CORS/401/500/etc)
        console.error("useGeocoder search error:", err?.response || err);
        setSuggestions([]);
      }
    }, 400);
  };

  const clear = () => setSuggestions([]);

  return { suggestions, search, clear };
};
