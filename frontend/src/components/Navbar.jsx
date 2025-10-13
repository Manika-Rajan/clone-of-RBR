import React, { useContext, useState, useEffect } from "react";
import logo from "../assets/logo.svg";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import Login from "./Login";
import { Modal, ModalBody } from "reactstrap";
import { Store } from "../Store";
import avatar from "../assets/avatar.svg";

// If you aren't already importing bootstrap JS bundle somewhere (e.g. index.js), add:
// import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Navbar = (props) => {
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
        {/* Use navbar-light bg-light so toggler + links are visible */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
          <div className="container-fluid">
            {/* Left block: logo + title */}
            <div className="d-flex align-items-center">
              <Link to="/" className="navbar-brand d-flex align-items-center">
                <img
                  src={logo}
                  alt="Logo"
                  style={{ width: 60, height: 60 }}
                  className="me-2"
                />
                <span className="fw-semibold">Rajan Business Report Services</span>
              </Link>
              <small className="text-muted ms-2 d-none d-md-inline">
                A product by Rajan Business Ideas
              </small>
            </div>

            {/* Collapser */}
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

            {/* Right side items */}
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-4 mt-3 mt-lg-0">
                {/* Use NavLink so active route is styled */}
                <li className="nav-item">
                  <NavLink
                    to="/about"
                    className={({ isActive }) =>
                      "nav-link" + (isActive || props.about ? " active" : "")
                    }
                  >
                    About
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      "nav-link" + (isActive || props.reports ? " active" : "")
                    }
                  >
                    Reports
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink
                    to="/contact"
                    className={({ isActive }) =>
                      "nav-link" + (isActive || props.contact ? " active" : "")
                    }
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
                        className="rounded-circle me-2"
                        alt="User Avatar"
                        style={{ width: 32, height: 32 }}
                      />
                      <span className="text-nowrap">{name?.trim() || "User"}</span>
                    </button>

                    {dropdownOpen && (
                      <ul
                        className="dropdown-menu dropdown-menu-end show"
                        style={{ position: "absolute", zIndex: 2000 }}
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
