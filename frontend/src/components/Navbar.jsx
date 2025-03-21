import React, { useContext, useState, useEffect } from 'react'
import logo from '../assets/logo.svg'
import { Link } from 'react-router-dom'
import Login from './Login'
import {Modal,ModalBody,ModalHeader} from "reactstrap"
import Otp from './Otp'
import EmailVerify from './EmailVerify'
import { Store } from '../Store'
import avatar from '../assets/avatar.svg'
import { useNavigate } from 'react-router-dom';

const Navbar = (props) => {

  const [openModel,setOpenModel]=useState(false)
  const [login,setLogin]=useState(true)
  const [otp,sendOtp]=useState(false)
  const [verify,setVerify]=useState(false)
  const [logout,setLogout]=useState(false)
  const {state,dispatch:cxtDispatch}=useContext(Store);
  const { name, isLoggedIn } = state;
  console.log("Navbar - isLoggedIn:", isLoggedIn);

  useEffect(() => {
  console.log("Navbar rerendered - isLoggedIn:", isLoggedIn);
                  }, [isLoggedIn]);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    cxtDispatch({ type: "LOGOUT" }); // Clear user state
    setDropdownOpen(false);
    navigate('/'); // Redirect to homepage
  };

  const resetModal = () => {
    console.log("🔄 Resetting modal...");
    setLogin(true)
    sendOtp(false)
    setVerify(false)
  }

  return (
    <>
    <div className='header'>
      <nav className="navbar navbar-expand-lg bg-light fixed-top">
  <div className="container-fluid">
    <div className="nav-left">
     <div className="logo">
     <Link to="/" className="navbar-brand" >
      <img src={logo} alt="" style={{width:"60px",height:"60px"}} />
     </Link>
     </div>
     <div className="text">
        <p className='nav-title' >Rajan Business Report Services</p>
        <p className='text-desc' style={{marginTop:"-20px"}}>A product by Rajan Business Ideas</p>
     </div>
    </div>
    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="collapse navbar-collapse" id="navbarSupportedContent">
    
      <ul className="navbar-nav ms-auto">
        <li className="nav-item" style={{marginRight:"80px"}}>
          <Link to="/about" className="nav-link" aria-current="page" href="#">About</Link>
          <div className={props.about?"active":""} ></div>
        </li>
        <li className="nav-item"
        style={{marginRight:"80px"}}>
          <Link to="/" className="nav-link" href="#">Reports</Link>
          <div className={props.reports?"active":""} ></div>

        </li>
        <li className="nav-item"
        style={{marginRight:"80px"}}>
          <Link to="/contact" className="nav-link" >Contact</Link>
    
          <div className={props.contact?"active":""} ></div>
        </li>
        
        {/* User Profile Dropdown */}
        
                {isLoggedIn ? (
                  <li className="nav-item dropdown">
                    <div className="dropdown-toggle user-menu" onClick={toggleDropdown}>
                      <img src={avatar} className="avatar" alt="User Avatar" />
                      <span className="user-name">{name || "User"}</span>
                    </div>

                    {dropdownOpen && (
                      <ul className="dropdown-menu show">
                        <li>
                          <button className="profile-button">My Profile</button>
                          <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                            My Profile
                          </Link>
                        </li>
                        {/* <button className="login-button">Login</button> */}
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
   
      {/* Login Modal */}
      <Modal isOpen={openModel} toggle={() => {
                        setOpenModel(!openModel);
                        resetModal();
                        }} size="lg" style={{ maxWidth: '650px', width: '100%', marginTop: '15%' }}>
        <ModalBody>
          {login && (
              <Login
                sendOtp={sendOtp}
                setVerify={setVerify}
                setLogin={setLogin}
                onClose={() => {
                      setOpenModel(false);
                      resetModal();
                      }} // ✅ this closes the modal
              />
            )}
          {otp && <Otp sendOtp={sendOtp} setVerify={setVerify} setLogin={setLogin} />}
          {verify && <EmailVerify sendOtp={sendOtp} setLogin={setLogin} setVerify={setVerify} />}
        </ModalBody>
      </Modal>
     
    </>
  )
}

export default Navbar
