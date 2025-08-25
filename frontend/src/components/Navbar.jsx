import React, { useContext, useState, useEffect } from 'react';
import logo from '../assets/logo.svg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Login from './Login';
import { Modal, ModalBody } from "reactstrap";
import { Store } from '../Store';
import avatar from '../assets/avatar.svg';

const Navbar = (props) => {
  const [openModel, setOpenModel] = useState(false);
  const [login, setLogin] = useState(true);
  const [otp, sendOtp] = useState(false);
  const [verify, setVerify] = useState(false);
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { name, isLogin } = state.userInfo;   // ✅ already correct
  console.log("Navbar - isLogin:", isLogin);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Force re-render when login state or name changes
  useEffect(() => {
    console.log("Navbar rerendered - isLogin:", isLogin, "name:", name);
  }, [isLogin, name]);   // added `name` here

  const hideNavbar = location.pathname === "/report-display";

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    cxtDispatch({ type: "LOGOUT" });
    setDropdownOpen(false);
    navigate('/');
  };

  const resetModal = () => {
    console.log("🔄 Resetting modal...");
    setLogin(true);
    sendOtp(false);
    setVerify(false);
  };

  if (hideNavbar) {
    return null;
  }

  return (
    <>
      <div className='header'>
        <nav className="navbar navbar-expand-lg bg-light fixed-top">
          <div className="container-fluid">
            <div className="nav-left">
              <div className="logo">
                <Link to="/" className="navbar-brand">
                  <img src={logo} alt="" style={{ width: "60px", height: "60px" }} />
                </Link>
              </div>
              <div className="text">
                <p className='nav-title'>Rajan Business Report Services</p>
                <p className='text-desc' style={{ marginTop: "-20px" }}>A product by Rajan Business Ideas</p>
              </div>
            </div>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item" style={{ marginRight: "80px" }}>
                  <Link to="/about" className="nav-link" aria-current="page">About</Link>
                  <div className={props.about ? "active" : ""}></div>
                </li>
                <li className="nav-item" style={{ marginRight: "80px" }}>
                  <Link to="/" className="nav-link">Reports</Link>
                  <div className={props.reports ? "active" : ""}></div>
                </li>
                <li className="nav-item" style={{ marginRight: "80px" }}>
                  <Link to="/contact" className="nav-link">Contact</Link>
                  <div className={props.contact ? "active" : ""}></div>
                </li>
                {isLogin ? (
                  <li className="nav-item dropdown">
                    <div className="dropdown-toggle user-menu" onClick={toggleDropdown}>
                      <img src={avatar} className="avatar" alt="User Avatar" />
                      {/* ✅ Instantly show updated name */}
                      <span className="user-name">{name?.trim() || "User"}</span>
                    </div>
                    {dropdownOpen && (
                      <ul className="dropdown-menu show">
                        <li>
                          <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                            My Profile
                          </Link>
                        </li>
                        <li>
                          <button className="dropdown-item logout-btn" onClick={handleLogout}>
                            Logout
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                ) : (
                  <li className="nav-item">
                    <button className="nav-link login-btn" onClick={() => {
                      resetModal();
                      setOpenModel(true);
                    }}>LOGIN</button>
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
        style={{ maxWidth: '650px', width: '100%', marginTop: '15%' }}
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
