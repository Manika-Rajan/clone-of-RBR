import React, { useState } from "react";
import "./SearchBox.css";

// Map keywords to filter categories
const keywordMappings = {
  ceramics: { type: "industry", value: "Ceramics" },
  healthcare: { type: "industry", value: "Healthcare" },
  retail: { type: "industry", value: "Retail" },

  delhi: { type: "city", value: "Delhi" },
  mumbai: { type: "city", value: "Mumbai" },
  bangalore: { type: "city", value: "Bangalore" },

  hospitals: { type: "market", value: "Hospitals" },
  ecommerce: { type: "market", value: "E-Commerce" },

  amazon: { type: "competitors", value: "Amazon" },
  apollo: { type: "competitors", value: "Apollo Hospitals" },

  cost: { type: "pain", value: "High Cost" },
  supply: { type: "pain", value: "Supply Chain Issues" },
};

export default function SearchBox({ onFiltersDetected }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const updateSuggestions = (input) => {
    const tokens = input.toLowerCase().split(/\s+/);
    const matched = [];

    tokens.forEach((token) => {
      if (keywordMappings[token]) {
        const { type, value } = keywordMappings[token];
        matched.push(`${value} (${type})`);
      }
    });

    setSuggestions(matched);
  };

  const handleSearch = () => {
    const tokens = query.toLowerCase().split(/\s+/);
    const detectedFilters = {
      industry: [],
      city: [],
      market: [],
      competitors: [],
      pain: [],
    };

    tokens.forEach((token) => {
      if (keywordMappings[token]) {
        const { type, value } = keywordMappings[token];
        detectedFilters[type].push(value);
      }
    });

    onFiltersDetected(detectedFilters);
    setSuggestions([]);
  };

  return (
    <div className="searchbox-container">
      <input
        type="text"
        placeholder="What market report are you looking for?"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          updateSuggestions(e.target.value);
        }}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="searchbox-input"
      />
      <button onClick={handleSearch} className="searchbox-btn">
        Search
      </button>

      {suggestions.length > 0 && (
        <ul className="searchbox-suggestions">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => {
                setQuery(query + " " + s.split(" ")[0]);
                setSuggestions([]);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
