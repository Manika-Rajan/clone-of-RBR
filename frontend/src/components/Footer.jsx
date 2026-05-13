import React, { useEffect, useState } from "react";
import "./Footer.css";
import facebook from "../assets/facebook.svg";
import twitter from "../assets/twitter.svg";
import linkedin from "../assets/linkedin.svg";
import { Link } from "react-router-dom";

const Footer = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [openSection, setOpenSection] = useState("know");

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const services = [
    "Sell on our Business Ideas Page",
    "Sell on our Field Reports Page",
    "RB Ideas Global Selling",
    "Become an Affiliate",
    "Fulfilment by RB Ideas",
    "Advertise Your Products",
    "RB Ideas Pay",
  ];

  const toggle = (section) => {
    if (!isMobile) return;
    setOpenSection((prev) => (prev === section ? "" : section));
  };

  const show = (section) => !isMobile || openSection === section;
  const top = () => window.scrollTo(0, 0);

  return (
    <footer className="footer rbr-footer">
      <div className="rbr-footer-grid">
        <div className="rbr-footer-col">
          <button className="rbr-footer-heading" onClick={() => toggle("know")}>
            <span>{isMobile ? "👥 " : ""}Get to Know Us</span>
            {isMobile && <b>{openSection === "know" ? "−" : "+"}</b>}
          </button>

          {show("know") && (
            <ul className="rbr-footer-links">
              <li><Link to="/about" onClick={top}>About Us</Link></li>
              <li><Link to="/careers" onClick={top}>Careers</Link></li>
            </ul>
          )}
        </div>

        <div className="rbr-footer-col">
          <button className="rbr-footer-heading" onClick={() => toggle("money")}>
            <span>{isMobile ? "💼 " : ""}Make Money with Us</span>
            {isMobile && <b>{openSection === "money" ? "−" : "+"}</b>}
          </button>

          {show("money") && (
            <ul className="rbr-footer-links">
              {services.map((service) => (
                <li key={service}>
                  <Link to="/partner" state={{ service }} onClick={top}>
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rbr-footer-col">
          <button className="rbr-footer-heading" onClick={() => toggle("help")}>
            <span>{isMobile ? "🛠 " : ""}Let Us Help You</span>
            {isMobile && <b>{openSection === "help" ? "−" : "+"}</b>}
          </button>

          {show("help") && (
            <ul className="rbr-footer-links">
              <li><Link to="/profile" onClick={top}>Your Account</Link></li>
              <li><Link to="/contact" onClick={top}>Help</Link></li>
            </ul>
          )}
        </div>

        <div className="rbr-footer-col">
          <button className="rbr-footer-heading" onClick={() => toggle("connect")}>
            <span>{isMobile ? "🌐 " : ""}Connect with Us</span>
            {isMobile && <b>{openSection === "connect" ? "−" : "+"}</b>}
          </button>

          {show("connect") && (
            <>
              <ul className="rbr-footer-links">
                <li><Link to="/contact" onClick={top}>Contact us</Link></li>
              </ul>

              <div className="rbr-social">
                <a href="https://www.facebook.com/RajanBusinessIdeas" target="_blank" rel="noreferrer">
                  <img src={facebook} alt="Facebook" />
                </a>
                <a href="#" aria-label="Twitter">
                  <img src={twitter} alt="Twitter" />
                </a>
                <a href="https://www.linkedin.com/in/rajan-business-ideas-24351811a/?originalSubdomain=in" target="_blank" rel="noreferrer">
                  <img src={linkedin} alt="LinkedIn" />
                </a>
              </div>

              <div className="rbr-notify">
                <p className="rbr-notify-title">Need a custom report or industry insight?</p>
                <p className="rbr-notify-sub">
                  Get notified when relevant reports and opportunities are added.
                </p>
                <form>
                  <input placeholder="Enter your email" />
                  <button type="submit">Notify Me</button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rbr-footer-bottom">
        <p>© 2026 Rajan Business Reports Pvt. Ltd.</p>
        <div>
          <Link to="/terms" onClick={top}>Terms & Conditions</Link>
          <Link to="/refund-policy" onClick={top}>Refund Policy</Link>
          <Link to="/privacy-policy" onClick={top}>Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
