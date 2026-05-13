import React, { useState, useEffect } from 'react';
import './Footer.css';
import facebook from '../assets/facebook.svg';
import twitter from '../assets/twitter.svg';
import linkedin from '../assets/linkedin.svg';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [mobileOpen, setMobileOpen] = useState({
    know: true,
    money: false,
    help: false,
    connect: false,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSection = (section) => {
    if (!isMobile) return;

    setMobileOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const services = [
    'Sell on our Business Ideas Page',
    'Sell on our Field Reports Page',
    'RB Ideas Global Selling',
    'Become an Affiliate',
    'Fulfilment by RB Ideas',
    'Advertise Your Products',
    'RB Ideas Pay',
  ];

  return (
    <div className="row footer">

      {/* BRAND BLOCK */}
      <div className="footer-brand-mobile">
        <div className="footer-brand-logo">
          Rajan<br />Business<br />Reports
        </div>

        <div className="footer-brand-content">
          <h3>Rajan Business Reports</h3>
          <p>
            Trusted business insights for entrepreneurs,
            investors and decision makers.
          </p>
        </div>
      </div>

      <div className="row">

        {/* GET TO KNOW */}
        <div className="col-md-2 col-sm-6 col-12 footer-section">
          <div
            className={`footer-mobile-header ${mobileOpen.know ? 'open' : ''}`}
            onClick={() => toggleSection('know')}
          >
            <p className="footer-head">👥 Get to Know Us</p>

            {isMobile && (
              <span className="footer-toggle-icon">
                {mobileOpen.know ? '−' : '+'}
              </span>
            )}
          </div>

          {(!isMobile || mobileOpen.know) && (
            <ul className="footer-links">
              <li>
                <Link
                  to="/about"
                  style={{ color: 'white' }}
                  onClick={() => window.scrollTo(0, 0)}
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  to="/careers"
                  style={{ color: 'white' }}
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Careers
                </Link>
              </li>
            </ul>
          )}
        </div>

        {/* MAKE MONEY */}
        <div className="col-md-3 col-sm-6 col-12 footer-section">

          <div
            className={`footer-mobile-header ${mobileOpen.money ? 'open' : ''}`}
            onClick={() => toggleSection('money')}
          >
            <p className="footer-head">💼 Make Money with Us</p>

            {isMobile && (
              <span className="footer-toggle-icon">
                {mobileOpen.money ? '−' : '+'}
              </span>
            )}
          </div>

          {(!isMobile || mobileOpen.money) && (
            <ul className="footer-links">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/partner"
                    state={{ service }}
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* HELP */}
        <div className="col-md-3 col-sm-6 col-12 footer-section">

          <div
            className={`footer-mobile-header ${mobileOpen.help ? 'open' : ''}`}
            onClick={() => toggleSection('help')}
          >
            <p className="footer-head">🛠 Let Us Help You</p>

            {isMobile && (
              <span className="footer-toggle-icon">
                {mobileOpen.help ? '−' : '+'}
              </span>
            )}
          </div>

          {(!isMobile || mobileOpen.help) && (
            <ul className="footer-links">

              <li>
                <Link
                  to="/profile"
                  style={{ color: 'white' }}
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Your Account
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  style={{ color: 'white' }}
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Help
                </Link>
              </li>

            </ul>
          )}
        </div>

        {/* CONNECT */}
        <div className="col-md-4 col-sm-6 col-12 footer-section">

          <div
            className={`footer-mobile-header ${mobileOpen.connect ? 'open' : ''}`}
            onClick={() => toggleSection('connect')}
          >
            <p className="footer-head">🌐 Connect with Us</p>

            {isMobile && (
              <span className="footer-toggle-icon">
                {mobileOpen.connect ? '−' : '+'}
              </span>
            )}
          </div>

          {(!isMobile || mobileOpen.connect) && (
            <>
              <ul className="footer-links footer-contact-links">
                <li>
                  <Link
                    to="/contact"
                    style={{ color: 'white' }}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    Contact us
                  </Link>
                </li>
              </ul>

              {/* SOCIAL */}
              <div className="social-media mb-4 footer-social-mobile">

                <a href="https://www.facebook.com/RajanBusinessIdeas">
                  <img
                    src={facebook}
                    style={{ cursor: 'pointer' }}
                    alt="Facebook"
                  />
                </a>

                <a href="">
                  <img
                    src={twitter}
                    style={{ cursor: 'pointer' }}
                    alt="Twitter"
                  />
                </a>

                <a href="https://www.linkedin.com/in/rajan-business-ideas-24351811a/?originalSubdomain=in">
                  <img
                    src={linkedin}
                    style={{ cursor: 'pointer' }}
                    alt="LinkedIn"
                  />
                </a>

              </div>

              {/* NOTIFY */}
              <div className="footer-notify-box">

                <p className="footer-notify-title">
                  Need a custom report or industry insight?
                </p>

                <p className="footer-notify-sub">
                  Get notified when relevant reports and opportunities are added.
                </p>

                <form className="footer-notify-form">

                  <input
                    placeholder="Enter your email"
                    className="footer-email"
                  />

                  <button className="notify-btn">
                    Notify Me
                  </button>

                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM */}
      <div className="row footer-bottom-mobile">

        <div className="col-md-5 col-sm-4 col-12 footer-copyright">
          <p>© 2026 Rajan Business Reports Pvt. Ltd.</p>
        </div>

        <div className="col-md-7 col-sm-8 col-12 footer-policy-links">

          <Link
            to="/terms"
            onClick={() => window.scrollTo(0, 0)}
          >
            Terms & Conditions
          </Link>

          <Link
            to="/refund-policy"
            onClick={() => window.scrollTo(0, 0)}
          >
            Refund Policy
          </Link>

          <Link
            to="/privacy-policy"
            onClick={() => window.scrollTo(0, 0)}
          >
            Privacy Policy
          </Link>

        </div>
      </div>
    </div>
  );
};

export default Footer;
