// Navbar.jsx
import React, { useContext, useState, useEffect } from "react";
import logo from "../assets/logo.svg";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import Login from "./Login";
import { Modal, ModalBody } from "reactstrap";
import { Store } from "../Store";
import avatar from "../assets/avatar.svg";
import './Navbar.css';

const Navbar = () => {
  const [openModel, setOpenModel] = useState(false);
  const [login, setLogin] = useState(true);
  const [otp, sendOtp] = useState(false);
  const [verify, setVerify] = useState(false);
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const userInfo = state?.userInfo || {};
  const { name = "", isLogin = false } = userInfo;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Navbar rerendered - isLogin:", isLogin, "name:", name);
  }, [isLogin, name]);

  const hideNavbar = location.pathname === "/report-display";
  const toggleDropdown = () => setDropdownOpen((v) => !v);

  const handleLogout = () => {
    cxtDispatch?.({ type: "LOGOUT" });
    setDropdownOpen(false);
    navigate("/");
  };

  const resetModal = () => {
    setLogin(true);
    sendOtp(false);
    setVerify(false);
  };

  if (hideNavbar) return null;

  return (
    <>
      <div className="header">
        <nav className="navbar navbar-expand-md navbar-light bg-light fixed-top">
          <div className="container-fluid">
            {/* Brand */}
            <Link to="/" className="navbar-brand d-flex align-items-center">
              <img
                src={logo}
                alt="Logo"
                style={{ width: 48, height: 48 }}
                className="me-2"
              />
              <div className="d-flex flex-column">
                <span className="fw-semibold">Rajan Business Report Services</span>
                <small className="text-muted d-none d-lg-block">
                  A product by Rajan Business Ideas
                </small>
              </div>
            </Link>

            {/* Toggler */}
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon" />
            </button>

            {/* Collapsible content */}
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto align-items-md-center mt-3 mt-md-0">
                <li className="nav-item me-md-4">
                  <NavLink
                    to="/about"
                    className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                  >
                    About
                  </NavLink>
                </li>

                <li className="nav-item me-md-4">
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                  >
                    Reports
                  </NavLink>
                </li>

                <li className="nav-item me-md-4">
                  <NavLink
                    to="/contact"
                    className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                  >
                    Contact
                  </NavLink>
                </li>

                {isLogin ? (
                  <li className="nav-item dropdown">
                    <button
                      className="btn btn-link nav-link d-flex align-items-center p-0"
                      onClick={toggleDropdown}
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
                    {dropdownOpen && (
                      <ul
                        className="dropdown-menu dropdown-menu-end show"
                        style={{ position: "absolute" }}
                        onMouseLeave={() => setDropdownOpen(false)}
                      >
                        <li>
                          <Link
                            to="/profile"
                            className="dropdown-item"
                            onClick={() => setDropdownOpen(false)}
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
                      className="btn btn-primary"
                      onClick={() => {
                        resetModal();
                        setOpenModel(true);
                      }}
                    >
                      LOGIN
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </nav>
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
