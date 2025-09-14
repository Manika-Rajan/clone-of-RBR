import React, { useContext, useEffect, useState } from 'react';
import Filters from './Filters';
import PriceCard from './PriceCard';
import './Reports.css';
import india from '../assets/india.png';
import Navbar from './Navbar';
import wrong from '../assets/wrong.svg';
import HeadingAfter from './HeadingAfter';
import HeadingBefore from './HeadingBefore';
import vector from '../assets/vector.svg';
import black from '../assets/black.svg';
import { useNavigate } from 'react-router-dom';
import { Store } from '../Store';


const placeholderExamples = [
  "How much demand is there for paper cups in Hyderabad?",
  "List of raw material suppliers for car manufacturing",
  "Top-selling ceramic products in Delhi",
  "Demand for LED lights in Bangalore and Mumbai"
];



const Reports = () => {
  const navigate = useNavigate();
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { totalPrice } = state;

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");


  const [generate, setGenerate] = useState(false);
  const [select_industry, setSelect_industry] = useState([]);
  const [select_city, setSelect_city] = useState([]);
  const [select_market, setSelect_market] = useState([]);
  const [select_pain, setSelect_pain] = useState([]);
  const [select_competitors, setSelect_competitors] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [country, setCountry] = useState(false);
  const [industry, setIndustry] = useState(false);
  const [city, setCity] = useState(false);
  const [market, setMarket] = useState(false);
  const [competitors, setCompetitors] = useState(false);
  const [painpoints, setPainpoints] = useState(false);
  const [expandIndustry, setExpandIndustry] = useState(false);
  const [expandCity, setExpandCity] = useState(false);
  const [expandMarket, setExpandMarket] = useState(false);
  const [expandCompetitors, setExpandCompetitors] = useState(false);
  const [expandPain, setExpandPain] = useState(false);
  const [popup, setPopup] = useState(true);
  const [noSearch, setNoSearch] = useState(false);
  const [nogenerate, setNoGenerate] = useState(false);
  const [price, setPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastReportId, setLastReportId] = useState(0); // Track the last used ID 
  const [placeholder, setPlaceholder] = useState(placeholderExamples[0]);
  
  useEffect(() => {
    const filters = {
      industry: select_industry,
      city: select_city,
      competitors: select_competitors,
      market: select_market,
      pain_points: select_pain
    };
    setSelectedFilters(filters);
    console.log('Updated selectedFilters:', filters);


    const hasFilters =
      select_industry.length > 0 ||
      select_city.length > 0 ||
      select_market.length > 0 ||
      select_pain.length > 0 ||
      select_competitors.length > 0;
    setGenerate(hasFilters);
  }, [select_industry, select_city, select_competitors, select_market, select_pain]);

    useEffect(() => {
      const interval = setInterval(() => {
        setPlaceholder((prev) => {
          let nextIndex = placeholderExamples.indexOf(prev) + 1;
          if (nextIndex >= placeholderExamples.length) nextIndex = 0;
          return placeholderExamples[nextIndex];
        });
      }, 5000); // change every 5 seconds
    
      return () => clearInterval(interval);
    }, []);

  
  const generateReport = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, '0')}${(
        now.getMonth() + 1
      ).toString().padStart(2, '0')}${now.getFullYear()}${now
        .getHours()
        .toString()
        .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

      const nextReportId = `RBR${(lastReportId + 1).toString().padStart(4, '0')}`;
      setLastReportId(lastReportId + 1); // Increment for next use

      const payload = {
        filters: selectedFilters,
        folderId: 'rbrfinalfiles',
        timestamp: timestamp,
        reportId: nextReportId // Include the new report ID
      };
      console.log('Generate Report triggered - Sending payload to Lambda:', payload);

      const response = await fetch(
        'https://ypoucxtxgh.execute-api.ap-south-1.amazonaws.com/default/RBR_report_create_from_filters_received',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://www.rajanbusinessreports.in'
          },
          body: JSON.stringify(payload)
        }
      ).catch((err) => {
        throw new Error(`Fetch failed: ${err.message}`);
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response for report generation:', data);

      if (!data.file_key) {
        throw new Error('No file_key returned in API response');
      }

      const fileKey = data.file_key;
      console.log('Navigating to /report-display with fileKey:', fileKey, 'and reportId:', nextReportId);
      navigate('/report-display', { state: { fileKey, reportId: nextReportId } });
    } catch (error) {
      console.error('Error generating report:', error.message, error.stack);
      const errorMessage = error.response ? await error.response.text() : error.message;
      console.error('Error details:', errorMessage);
      alert(`Failed to generate report: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateIndustry = (value, checked) => {
    console.log('Industry update:', { value, checked });
    setNoSearch(false);
    if (checked) {
      setSelect_industry((prev) => [...prev, value]);
      calculatePrice(400);
    } else {
      setSelect_industry((prevState) => prevState.filter((prevItem) => prevItem !== value));
      removePrice(400);
    }
  };

  const removeIndustry = (value) => {
    setSelect_industry((prevState) => prevState.filter((prevItem) => prevItem !== value));
    removePrice(400);
  };

  const updateCity = (value, checked) => {
    console.log('City update:', { value, checked });
    setNoSearch(false);
    if (checked) {
      setSelect_city((prev) => [...prev, value]);
      calculatePrice(500);
    } else {
      setSelect_city((prevState) => prevState.filter((prevItem) => prevItem !== value));
      removePrice(500);
    }
  };

  const removeCity = (value) => {
    setSelect_city((prevState) => prevState.filter((prevItem) => prevItem !== value));
    removePrice(500);
  };

  const updateCompetitors = (value, checked) => {
    console.log('Competitors update:', { value, checked });
    setNoSearch(false);
    if (checked) {
      setSelect_competitors((prev) => [...prev, value]);
      calculatePrice(572);
    } else {
      setSelect_competitors((prevState) => prevState.filter((prevItem) => prevItem !== value));
      removePrice(572);
    }
  };

  const removeCompetitors = (value) => {
    setSelect_competitors((prevState) => prevState.filter((prevItem) => prevItem !== value));
    removePrice(572);
  };

  const updateMarket = (value, checked) => {
    console.log('Market update:', { value, checked });
    setNoSearch(false);
    if (checked) {
      setSelect_market((prev) => [...prev, value]);
      calculatePrice(572);
    } else {
      setSelect_market((prevState) => prevState.filter((prevItem) => prevItem !== value));
      removePrice(572);
    }
  };

  const removeMarket = (value) => {
    setSelect_market((prevState) => prevState.filter((prevItem) => prevItem !== value));
    removePrice(572);
  };

  const updatePain = (value, checked) => {
    console.log('Pain points update:', { value, checked });
    setNoSearch(false);
    if (checked) {
      setSelect_pain((prev) => [...prev, value]);
      calculatePrice(500);
    } else {
      setSelect_pain((prevState) => prevState.filter((prevItem) => prevItem !== value));
      removePrice(500);
    }
  };

  const removePain = (value) => {
    setSelect_pain((prevState) => prevState.filter((prevItem) => prevItem !== value));
    removePrice(500);
  };

  const handleClear = () => {
    setSelect_city([]);
    setSelect_competitors([]);
    setSelect_industry([]);
    setSelect_market([]);
    setSelect_pain([]);
    setPrice(0);
    cxtDispatch({ type: 'SET_PRICE', payload: 0 });
    window.location.reload();
  };

  const calculatePrice = (value) => {
    setPrice((prev) => {
      const newPrice = prev + value;
      cxtDispatch({ type: 'SET_PRICE', payload: newPrice });
      return newPrice;
    });
  };

  const removePrice = (value) => {
    setPrice((prev) => {
      const newPrice = prev - value;
      cxtDispatch({ type: 'SET_PRICE', payload: newPrice });
      return newPrice;
    });
  };

  const handleSearch = async (query) => {
   const trimmed = query.trim();

      if (!trimmed) {
        alert("Please enter text to search.");
        return;
      }

      setSearchLoading(true);
      setSearchMessage(""); // reset before new search
  
    try {
      console.log("Sending search query:", trimmed);
  
      const payload = {
        search_query: trimmed,
        user: {
              name: state.userInfo?.name || "Unknown",
              email: state.userInfo?.email || "",
              phone: state.userInfo?.phone || "", // ✅ include phone here
              userId: state.userInfo?.userId || state.userInfo?.phone || ""
            }
      };
  
      const response = await fetch(
        "https://ypoucxtxgh.execute-api.ap-south-1.amazonaws.com/default/search-log",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed with status ${response.status}, body: ${errorText}`);
      }
  
      const data = await response.json();
      console.log("Search log API response:", data);

      // ✅ professional confirmation message
      setSearchMessage(
          "⚠️ We’re sorry, the specific data you requested isn’t available right now. Our research team has logged your query, and fresh insights will be added within the next 72 hours. Please revisit soon—we’ll make sure it’s worth your while."
        );
  
      // (Optional) parse query into filters like before
        if (trimmed.toLowerCase().includes("ceramic")) setSelect_industry(["Ceramics"]);
        if (trimmed.toLowerCase().includes("steel")) setSelect_industry(["Steel"]);
        if (trimmed.toLowerCase().includes("india")) setSelect_city(["India"]);
        if (trimmed.toLowerCase().includes("delhi")) setSelect_city(["Delhi"]);
      setNoSearch(false);
  
    } catch (err) {
      console.error("Error logging search:", err);
      setSearchMessage("⚠️ Something went wrong while processing your request. Please try again later.");
      } finally {
        setSearchLoading(false);
      }
  };


  return (
    <>
      <Navbar reports />
          <div className="search-hero">
            <h2 className="search-hero-heading">All Your Market Questions, Answered Instantly</h2>
            <p className="search-hero-sub">
            From suppliers to sales trends, uncover data that powers smarter business decisions — no waiting, no guesswork.
            </p>
            <p className="example-text">e.g., {placeholder}</p>
            <div className="search-hero-bar">
              <input
                type="text"
                placeholder={placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = e.target.value.trim().toLowerCase();
                    if (!query) {
                      alert("Please enter text to search");
                      return;
                    }
                    handleSearch(query);
                  }
                }}
              />
              <button
                onClick={() => {
                  const query = document.querySelector('.search-hero-bar input').value.trim().toLowerCase();
                  if (!query) {
                    alert("Please enter text to search");
                    return;
                  }
                  handleSearch(query);
                }}
              >
                <svg className="search-icon" viewBox="0 0 24 24">
                  <path d="M10,2A8,8 0 1,0 18,10A8,8 0 0,0 10,2M22,22L17,17" />
                </svg>
                Search
              </button>
              
              {/* Popup overlay for loader */}
              {searchLoading && (
                <div className="popup-overlay">
                  <div className="popup-box">
                    <svg className="spinner" viewBox="0 0 50 50">
                      <circle
                        className="path"
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        strokeWidth="5"
                      />
                    </svg>
                    <p>Fetching your request...</p>
                  </div>
                </div>
              )}
              
              {/* Popup overlay for response */}
              {!searchLoading && searchMessage && (
                <div className="popup-overlay">
                  <div className="popup-box enhanced">
                    <div className="popup-header">
                      <svg
                        className="popup-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3>Important Update</h3>
                    </div>
                    <div className="popup-body">
                      <p>{searchMessage}</p>
                    </div>
                    <div className="popup-footer">
                      <button
                        className="close-btn fancy"
                        onClick={() => setSearchMessage("")}
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div> {/* ✅ closes .search-hero */}
      
      {popup && (
        <div className="nav-popup row">
          <div className="col-md-11 col-sm-10 col-10">
            <p className="container">
              Use the Promo code "<strong>RBideas 25</strong>" to get an instant 25% discount during the purchase. Valid till 31st August 2026
            </p>
          </div>
          <div className="col-md-1 col-sm-1 col-1 icon" style={{ fontSize: '20px' }}>
            <img src={wrong} alt="" style={{ cursor: 'pointer' }} onClick={() => setPopup(false)} />
          </div>
        </div>
      )}

      <div className="report row">
        <div className="col-md-4 col-sm-10 col-11 filters">
          <Filters
            updateIndustry={updateIndustry}
            updateCity={updateCity}
            updateCompetitors={updateCompetitors}
            updateMarket={updateMarket}
            updatePain={updatePain}
            country={country}
            setCountry={setCountry}
            city={city}
            setCity={setCity}
            industry={industry}
            setIndustry={setIndustry}
            competitors={competitors}
            setCompetitors={setCompetitors}
            market={market}
            setMarket={setMarket}
            painpoints={painpoints}
            setPainpoints={setPainpoints}
            handleClear={handleClear}
            select_city={select_city}
            select_competitors={select_competitors}
            select_industry={select_industry}
            select_market={select_market}
            select_pain={select_pain}
            noSearch={noSearch}
            setNoSearch={setNoSearch}
            nogenerate={nogenerate}
            setNoGenerate={setNoGenerate}
          />
        </div>
        <div className="col-md-8 col-sm-11 col-11">
          <div className="row personalized-report">
            <div className="col-md-10 personalized-report-left">{generate ? <HeadingAfter /> : <HeadingBefore />}</div>
            <div
              className="col-md-2 col-sm-2 col-2 personalized-report-right ms-auto"
              style={{ textAlign: 'center', justifyContent: 'flex-end' }}
            >
              <img src={india} alt="" />
              <span>India</span>
            </div>
          </div>
          <div className="row" style={{ margin: 'auto' }}>
            <div className="col-md-8 col-sm-11 col-11">
              {generate ? (
                <p className="after-head">based on the following selections</p>
              ) : (
                <p className="before-head">Select the filters for your requirement and we do the rest</p>
              )}
              <div className="all-filters">
                <div className="one-filter">
                  <div
                    className="heading"
                    onClick={() => {
                      setIndustry(!industry);
                      setCountry(false);
                      setCity(false);
                      setCompetitors(false);
                      setMarket(false);
                      setPainpoints(false);
                    }}
                    style={{ cursor: 'pointer', fontFamily: 'Baskerville Old Face' }}
                  >
                    Industry&nbsp;
                    {select_industry.length ? (
                      <span className="text-primary">({select_industry.length})</span>
                    ) : (
                      <span className="text-muted">({select_industry.length})</span>
                    )}
                  </div>
                  <div className="all-select-filters">
                    {expandIndustry
                      ? select_industry &&
                        select_industry.map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removeIndustry(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))
                      : select_industry &&
                        select_industry.slice(0, 2).map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removeIndustry(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))}
                    {select_industry.length > 2 && (
                      <p
                        className="text-primary"
                        style={{ textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => setExpandIndustry(!expandIndustry)}
                      >
                        <u>+{select_industry.length - 2} more</u>
                      </p>
                    )}
                  </div>
                </div>

                <div className="one-filter">
                  <div
                    className="heading"
                    onClick={() => {
                      setCity(!city);
                      setCountry(false);
                      setCompetitors(false);
                      setMarket(false);
                      setPainpoints(false);
                      setIndustry(false);
                    }}
                    style={{ cursor: 'pointer', fontFamily: 'Baskerville Old Face' }}
                  >
                    City&nbsp;
                    {select_city.length ? (
                      <span className="text-primary">({select_city.length})</span>
                    ) : (
                      <span className="text-muted">({select_city.length})</span>
                    )}
                  </div>
                  <div className="all-select-filters">
                    {expandCity
                      ? select_city &&
                        select_city.map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removeCity(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))
                      : select_city &&
                        select_city.slice(0, 2).map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removeCity(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))}
                    {select_city.length > 2 && (
                      <p
                        className="text-primary"
                        style={{ textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => setExpandCity(!expandCity)}
                      >
                        <u>+{select_city.length - 2} more</u>
                      </p>
                    )}
                  </div>
                </div>

                <div className="one-filter">
                  <div
                    className="heading"
                    onClick={() => {
                      setCompetitors(!competitors);
                      setCity(false);
                      setCountry(false);
                      setMarket(false);
                      setPainpoints(false);
                      setIndustry(false);
                    }}
                    style={{ cursor: 'pointer', fontFamily: 'Baskerville Old Face' }}
                  >
                    List of Competitors&nbsp;
                    {select_competitors.length ? (
                      <span className="text-primary">({select_competitors.length})</span>
                    ) : (
                      <span className="text-muted">({select_competitors.length})</span>
                    )}
                  </div>
                  <div className="all-select-filters">
                    {expandCompetitors
                      ? select_competitors &&
                        select_competitors.map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removeCompetitors(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))
                      : select_competitors &&
                        select_competitors.slice(0, 2).map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removeCompetitors(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))}
                    {select_competitors.length > 2 && (
                      <p
                        className="text-primary"
                        style={{ textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => setExpandCompetitors(!expandCompetitors)}
                      >
                        <u>+{select_competitors.length - 2} more</u>
                      </p>
                    )}
                  </div>
                </div>

                <div className="one-filter">
                  <div
                    className="heading"
                    onClick={() => {
                      setMarket(!market);
                      setCity(false);
                      setCountry(false);
                      setCompetitors(false);
                      setPainpoints(false);
                      setIndustry(false);
                    }}
                    style={{ cursor: 'pointer', fontFamily: 'Baskerville Old Face' }}
                  >
                    Market Segment&nbsp;
                    {select_market.length ? (
                      <span className="text-primary">({select_market.length})</span>
                    ) : (
                      <span className="text-muted">({select_market.length})</span>
                    )}
                  </div>
                  <div className="all-select-filters">
                    {expandMarket
                      ? select_market &&
                        select_market.map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removeMarket(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))
                      : select_market &&
                        select_market.slice(0, 2).map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removeMarket(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))}
                    {select_market.length > 2 && (
                      <p
                        className="text-primary"
                        style={{ textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => setExpandMarket(!expandMarket)}
                      >
                        <u>+{select_market.length - 2} more</u>
                      </p>
                    )}
                  </div>
                </div>

                <div className="one-filter">
                  <div
                    className="heading"
                    onClick={() => {
                      setPainpoints(!painpoints);
                      setCity(false);
                      setCountry(false);
                      setCompetitors(false);
                      setMarket(false);
                      setIndustry(false);
                    }}
                    style={{ cursor: 'pointer', fontFamily: 'Baskerville Old Face' }}
                  >
                    Pain Points&nbsp;
                    {select_pain.length ? (
                      <span className="text-primary">({select_pain.length})</span>
                    ) : (
                      <span className="text-muted">({select_pain.length})</span>
                    )}
                  </div>
                  <div className="all-select-filters">
                    {expandPain
                      ? select_pain &&
                        select_pain.map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removePain(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))
                      : select_pain &&
                        select_pain.slice(0, 2).map((value, index) => (
                          <div key={index}>
                            <div className="filter-button">
                              <div>{value}</div>
                              <div
                                onClick={() => removePain(value)}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  paddingTop: '4px',
                                  height: '16px',
                                  width: '16px',
                                  marginLeft: '8px',
                                }}
                              >
                                X
                              </div>
                            </div>
                          </div>
                        ))}
                    {select_pain.length > 2 && (
                      <p
                        className="text-primary"
                        style={{ textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => setExpandPain(!expandPain)}
                      >
                        <u>+{select_pain.length - 2} more</u>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-11 col-11" style={{ margin: 'auto' }}>
              <PriceCard price={price} />
            </div>
            <div className="col-md-1 col-sm-1 col-1"></div>
          </div>
          <div className="row">
            <div className="col-md-8 col-sm-12 col-12 mt-4" style={{ alignItems: 'center' }}>
              {select_industry.length === 0 &&
              select_city.length === 0 &&
              select_market.length === 0 &&
              select_pain.length === 0 &&
              select_competitors.length === 0 ? (
                <button
                  className="generate-btn"
                  style={{ background: 'white', color: 'black' }}
                  onClick={() => setNoGenerate(true)}
                >
                  <div className="black-img">
                    <img src={black} alt="" />
                  </div>
                  <div>GENERATE REPORT</div>
                </button>
              ) : (
                <button
                  className="generate-btn"
                  style={{ background: '#0263c7', color: 'white' }}
                  onClick={generateReport}
                  disabled={isLoading}
                >
                  <div className="white-img">
                    <img src={vector} alt="" />
                  </div>
                  <div>{isLoading ? 'Generating...' : 'GENERATE REPORT'}</div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
