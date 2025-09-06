import React, { useState, useEffect } from 'react';
import './Partner.css';
import { useLocation } from 'react-router-dom';

const Partner = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    service: location.state?.service || '',
    name: '',
    mobile: '',
    countryCode: '+91',
    email: '',
    companyEmail: '',
    summary: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const services = [
    'Sell on our Business Ideas Page',
    'Sell on our Field Reports Page',
    'RB Ideas Global Selling',
    'Become an Affiliate',
    'Fulfilment by RB Ideas',
    'Advertise Your Products',
    'RB Ideas Pay',
  ];

  useEffect(() => {
    if (location.state?.service) {
      setFormData((prev) => ({ ...prev, service: location.state.service }));
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.service || !formData.name || !formData.email || !formData.mobile) {
      setError('Please fill all required fields');
      setSuccess('');
      return;
    }
    console.log('Partner form submitted:', formData);
    setError('');
    setSuccess('Your partnership request has been submitted!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="partner-page">
      <div className="hero-section text-center">
        <h1>Partner with RB Ideas</h1>
        <p className="lead">Join our ecosystem and grow your business with us!</p>
      </div>
      <div className="container partner-container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-12">
            <h3 className="section-title">Partnership Application</h3>
            <form onSubmit={handleSubmit} className="partner-form">
              <div className={`form-group mb-3 ${formData.service ? 'has-value' : ''}`}>
                <select
                  className="form-select"
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  required
                  aria-label="Select a service"
                >
                  <option value="" disabled>Select a service</option>
                  {services.map((service) => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
                <label htmlFor="service" className="form-label">Service *</label>
              </div>
              <div className="form-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  required
                  aria-label="Name"
                />
                <label htmlFor="name" className="form-label">Name *</label>
              </div>
              <div className={`form-group mb-3 ${formData.mobile ? 'has-value' : ''}`}>
                <div className="input-group">
                  <select
                    className="form-select w-auto"
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleInputChange}
                    aria-label="Country code"
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+1">+1 (Canada)</option>
                    <option value="+61">+61</option>
                  </select>
                  <input
                    type="text"
                    className="form-control"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    maxLength={15}
                    placeholder="Enter mobile number"
                    required
                    aria-label="Mobile number"
                  />
                  <label htmlFor="mobile" className="form-label mobile-label">Mobile Number *</label>
                </div>
              </div>
              <div className="form-group mb-3">
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  aria-label="Email"
                />
                <label htmlFor="email" className="form-label">Email *</label>
              </div>
              <div className="form-group mb-3">
                <input
                  type="email"
                  className="form-control"
                  id="companyEmail"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  placeholder="Enter company email"
                  aria-label="Company email"
                />
                <label htmlFor="companyEmail" className="form-label">Company Email (Optional)</label>
              </div>
              <div className="form-group mb-3">
                <textarea
                  className="form-control"
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Provide a brief summary"
                  aria-label="Summary"
                />
                <label htmlFor="summary" className="form-label">Summary (Optional)</label>
              </div>
              {error && <p className="text-danger animate-error">{error}</p>}
              {success && <p className="text-success animate-success">{success}</p>}
              <button type="submit" className="btn btn-primary w-100 submit-btn">Submit Application</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partner;

