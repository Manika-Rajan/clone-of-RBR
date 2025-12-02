import React, { useState } from 'react';
import './Career.css';
import { useStore } from '../Store';
import { Link } from 'react-router-dom';

const Career = () => {
  const { state } = useStore();
  const [formData, setFormData] = useState({
    firstName: state.userInfo.name ? state.userInfo.name.split(' ')[0] || '' : '',
    lastName: state.userInfo.name ? state.userInfo.name.split(' ')[1] || '' : '',
    gender: '',
    country: 'India',
    experience: '',
    email: state.userInfo.email || '',
    mobile: state.userInfo.phone ? state.userInfo.phone.replace('+91', '') : '',
    countryCode: '+91',
    resume: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const jobsByRegion = [
    {
      region: 'Asia',
      jobs: [
        { title: 'Software Engineer', location: 'Bangalore, India', id: 'asia-1' },
        { title: 'Product Manager', location: 'Mumbai, India', id: 'asia-2' },
      ],
    },
    {
      region: 'North America',
      jobs: [
        { title: 'Data Scientist', location: 'San Francisco, CA', id: 'na-1' },
        { title: 'UX Designer', location: 'New York, NY', id: 'na-2' },
      ],
    },
    {
      region: 'Europe',
      jobs: [],
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      setFormData({ ...formData, resume: file });
      setError('');
    } else {
      setError('Please upload a valid .doc, .docx, or .pdf file');
      setFormData({ ...formData, resume: null });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobile || !formData.resume) {
      setError('Please fill all required fields and upload a resume');
      setSuccess('');
      return;
    }
    console.log('Form submitted:', {
      ...formData,
      resume: formData.resume ? formData.resume.name : null,
    });
    setError('');
    setSuccess('Application submitted successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="career-page">
      <div className="hero-section text-center">
        <h1>Join Rajan Business Ideas</h1>
        <p className="lead">Explore exciting career opportunities and grow with us!</p>
      </div>
      <div className="container career-container">
        <div className="row">
          <div className="col-md-6 col-12 mb-4">
            <h3 className="section-title">Job Openings by Region</h3>
            {jobsByRegion.map((region) => (
              <div key={region.region} className="region-section">
                <h4 className="region-title">{region.region}</h4>
                {region.jobs.length > 0 ? (
                  <div className="job-list">
                    {region.jobs.map((job) => (
                      <div key={job.id} className="job-card">
                        <div className="job-info">
                          <h5>{job.title}</h5>
                          <p>{job.location}</p>
                        </div>
                        <Link to="/commingSoon" className="btn btn-outline-primary btn-sm">View Details</Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-jobs">No openings currently available in {region.region}.</p>
                )}
              </div>
            ))}
          </div>
          <div className="col-md-6 col-12">
            <h3 className="section-title">Apply Now</h3>
            <form onSubmit={handleSubmit} className="resume-form">
              <div className={`form-group mb-3 ${formData.firstName ? 'has-value' : ''}`}>
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter first name"
                  aria-label="First Name"
                />
                <label htmlFor="firstName" className="form-label">First Name *</label>
              </div>
              <div className={`form-group mb-3 ${formData.lastName ? 'has-value' : ''}`}>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter last name"
                  aria-label="Last Name"
                />
                <label htmlFor="lastName" className="form-label">Last Name *</label>
              </div>
              <div className={`form-group mb-3 ${formData.gender ? 'has-value' : ''}`}>
                <select
                  className="form-select"
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  aria-label="Gender"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <label htmlFor="gender" className="form-label">Gender</label>
              </div>
              <div className={`form-group mb-3 ${formData.country ? 'has-value' : ''}`}>
                <select
                  className="form-select"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  aria-label="Country"
                >
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                  <option value="Other">Other</option>
                </select>
                <label htmlFor="country" className="form-label">Country *</label>
              </div>
              <div className={`form-group mb-3 ${formData.experience ? 'has-value' : ''}`}>
                <select
                  className="form-select"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                  aria-label="Experience"
                >
                  <option value="">Select Experience</option>
                  {[...Array(21).keys()].map((year) => (
                    <option key={year} value={year}>{year} {year === 1 ? 'year' : 'years'}</option>
                  ))}
                </select>
                <label htmlFor="experience" className="form-label">Experience (Years) *</label>
              </div>
              <div className={`form-group mb-3 ${formData.email ? 'has-value' : ''}`}>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email"
                  aria-label="Email"
                />
                <label htmlFor="email" className="form-label">Email ID *</label>
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
                    required
                    placeholder="Enter mobile number"
                    aria-label="Mobile Number"
                  />
                  <label htmlFor="mobile" className="form-label mobile-label">Mobile Number *</label>
                </div>
              </div>
              <div className="form-group mb-3">
                <input
                  type="file"
                  className="form-control"
                  id="resume"
                  name="resume"
                  accept=".doc,.docx,application/pdf"
                  onChange={handleFileChange}
                  required
                  aria-label="Resume"
                />
                <label htmlFor="resume" className="form-label">Upload Resume (.doc, .docx, .pdf) *</label>
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

export default Career;
