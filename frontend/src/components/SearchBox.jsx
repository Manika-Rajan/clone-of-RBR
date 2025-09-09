import React, { useState } from "react";
import "./SearchBox.css";

const keywordMappings = {
  // Industries
  ceramics: { type: "industry", value: "Ceramics" },
  healthcare: { type: "industry", value: "Healthcare" },
  retail: { type: "industry", value: "Retail" },

  // Cities
  delhi: { type: "city", value: "Delhi" },
  mumbai: { type: "city", value: "Mumbai" },
  bangalore: { type: "city", value: "Bangalore" },

  // Markets
  hospitals: { type: "market", value: "Hospitals" },
  ecommerce: { type: "market", value: "E-Commerce" },

  // Competitors
  amazon: { type: "competitors", value: "Amazon" },
  apollo: { type: "competitors", value: "Apollo Hospitals" },

  // Pain points
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
    <div className="searchbox-hero">
      <h2 className="searchbox-heading">
        What market report are you looking for?
      </h2>
      <div className="searchbox-container">
        <input
          type="text"
          placeholder="e.g. Full market data for Ceramics industry in Delhi"
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
      </div>

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
