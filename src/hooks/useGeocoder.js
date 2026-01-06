import { useRef, useState } from "react";
import API from "../services/api";

export const useGeocoder = (countryCode = "AR") => {
  const [suggestions, setSuggestions] = useState([]);
  const timeoutRef = useRef(null);

  const search = (query) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await API.get("/geocode/search", {
          params: { q: query, country: countryCode },
        });
        setSuggestions(res.data.slice(0, 6));
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  const clear = () => setSuggestions([]);

  return {
    suggestions,
    search,
    clear,
  };
};

