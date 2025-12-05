// Navbar.jsx
import React, { useContext, useState, useEffect } from "react";
import logo from "../assets/logo.svg";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import Login from "./Login";
import { Modal, ModalBody } from "reactstrap";
import { Store } from "../Store";
import avatar from "../assets/avatar.svg";
import "./Navbar.css";

const Navbar = () => {
  const [openModel, setOpenModel] = useState(false);
  const [login, setLogin] = useState(true);
  const [otp, sendOtp] = useState(false);
  const [verify, setVerify] = useState(false);
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const userInfo = state?.userInfo || {};
  const { name = "", isLogin = false } = userInfo;

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 🔹 React-controlled mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Navbar rerendered - isLogin:", isLogin, "name:", name);
  }, [isLogin, name]);

  // Close menus whenever route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const hideNavbar = location.pathname === "/report-display";

  const toggleDropdown = () => setDropdownOpen((v) => !v);

  const handleLogout = () => {
    cxtDispatch?.({ type: "LOGOUT" });
    setDropdownOpen(false);
    setIsMenuOpen(false);
    navigate("/");
  };

  const resetModal = () => {
    setLogin(true);
    sendOtp(false);
    setVerify(false);
  };

  const handleNavClick = () => {
    // When clicking any nav link on mobile, close the mobile menu
    setIsMenuOpen(false);
  };

  if (hideNavbar) return null;

  // Reusable nav items (so desktop & mobile stay in sync)
  const NavItems = () => (
    <>
      <li className="nav-item me-md-4">
        <NavLink
          to="/about"
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          onClick={handleNavClick}
        >
          About
        </NavLink>
      </li>

      <li className="nav-item me-md-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          onClick={handleNavClick}
        >
          Reports
        </NavLink>
      </li>

      <li className="nav-item me-md-4">
        <NavLink
          to="/contact"
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          onClick={handleNavClick}
        >
          Contact
        </NavLink>
      </li>
    </>
  );

  const AuthBlock = ({ isMobile = false }) =>
    isLogin ? (
      <li className="nav-item dropdown">
        <button
          className={
            "btn btn-link nav-link d-flex align-items-center p-0" +
            (isMobile ? " w-100 justify-content-start px-3 py-2" : "")
          }
          onClick={() => setDropdownOpen((v) => !v)}
          aria-expanded={dropdownOpen ? "true" : "false"}
        >
          <img
            src={avatar}
            alt="User"
            className="rounded-circle me-2"
            style={{ width: 32, height: 32 }}
          />
          <span className="text-nowrap">{name?.trim() || "User"}</span>
        </button>
        {/* Desktop dropdown (positioned near avatar). On mobile we list links below instead */}
        {dropdownOpen && !isMobile && (
          <ul
            className="dropdown-menu dropdown-menu-end show"
            style={{ position: "absolute" }}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <li>
              <Link
                to="/profile"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  setIsMenuOpen(false);
                }}
              >
                My Profile
              </Link>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        )}
      </li>
    ) : (
      <li className="nav-item">
        <button
          className={"btn btn-primary" + (isMobile ? " w-100 mt-2" : "")}
          onClick={() => {
            resetModal();
            setOpenModel(true);
            setIsMenuOpen(false);
          }}
        >
          LOGIN
        </button>
      </li>
    );

  return (
    <>
      <div className="header">
        <nav className="navbar navbar-expand-md navbar-light bg-light fixed-top rbr-navbar">
          <div className="container-fluid">
            {/* Brand */}
            <Link
              to="/"
              className="navbar-brand d-flex align-items-center"
              onClick={() => {
                setIsMenuOpen(false);
                setDropdownOpen(false);
              }}
            >
              <img
                src={logo}
                alt="Logo"
                style={{ width: 48, height: 48 }}
                className="me-2"
              />
              <div className="d-flex flex-column">
                <span className="fw-semibold">
                  Rajan Business Report Services
                </span>
                <small className="text-muted d-none d-lg-block">
                  A product by Rajan Business Ideas
                </small>
              </div>
            </Link>

            {/* Toggler – purely React, Bootstrap JS not required */}
            <button
              className="navbar-toggler"
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-controls="rbr-navbar-desktop"
              aria-expanded={isMenuOpen ? "true" : "false"}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon" />
            </button>

            {/* DESKTOP NAV (≥ md) – normal Bootstrap collapse, always visible on md+ */}
            <div
              id="rbr-navbar-desktop"
              className="collapse navbar-collapse d-none d-md-flex"
            >
              <ul className="navbar-nav ms-auto align-items-md-center mt-3 mt-md-0">
                <NavItems />
                <AuthBlock />
              </ul>
            </div>
          </div>
        </nav>

        {/* MOBILE NAV ( < md ) – our own overlay menu */}
        <div
          className={
            "rbr-mobile-menu d-md-none" + (isMenuOpen ? " rbr-mobile-menu-open" : "")
          }
        >
          <ul className="navbar-nav flex-column w-100 px-2 pt-2 pb-3">
            <NavItems />
            {/* On mobile, show Profile + Logout as full-width list items instead of tiny dropdown */}
            {isLogin ? (
              <>
                <li className="nav-item mt-2">
                  <Link
                    to="/profile"
                    className="nav-link rbr-mobile-link"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setDropdownOpen(false);
                    }}
                  >
                    My Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <button
                    className="nav-link rbr-mobile-link text-start"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <AuthBlock isMobile />
            )}
          </ul>
        </div>
      </div>

      <Modal
        isOpen={openModel}
        toggle={() => {
          setOpenModel(!openModel);
          resetModal();
        }}
        size="lg"
        style={{ maxWidth: "650px", width: "100%", marginTop: "15%" }}
      >
        <ModalBody>
          {login && (
            <Login
              onClose={() => {
                setOpenModel(false);
                resetModal();
              }}
            />
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default Navbar;
