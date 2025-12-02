// RBR/frontend/src/components/Career.jsx
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
    role: '',
    resume: null,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const jobsByRegion = [
    {
      region: 'India (Asia)',
      jobs: [
        {
          title: 'Business Research Analyst – Rajan Business Reports',
          location: 'Remote / Bangalore, India',
          id: 'asia-1',
        },
        {
          title: 'Market Research Intern – Rajan Business Reports',
          location: 'Remote, India',
          id: 'asia-2',
        },
        {
          title: 'Full-Stack Engineer – RBR Platform',
          location: 'Remote / Bangalore, India',
          id: 'asia-3',
        },
      ],
    },
    {
      region: 'North America',
      jobs: [
        {
          title: 'Growth & Partnerships (Part-time / Remote)',
          location: 'Remote – North America',
          id: 'na-1',
        },
      ],
    },
    {
      region: 'Europe',
      jobs: [],
    },
  ];

  const flatJobOptions = jobsByRegion.flatMap((region) =>
    region.jobs.map((job) => ({
      id: job.id,
      label: `${job.title} – ${job.location}`,
    }))
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (
      file &&
      [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type)
    ) {
      setFormData((prev) => ({ ...prev, resume: file }));
      setError('');
    } else {
      setError('Please upload a valid .doc, .docx, or .pdf file');
      setFormData((prev) => ({ ...prev, resume: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.mobile ||
      !formData.experience ||
      !formData.role ||
      !formData.resume
    ) {
      setError('Please fill all required fields (marked with *) and upload your resume.');
      setSuccess('');
      return;
    }

    // 🔹 Placeholder: integrate with your backend / API / Lambda here
    console.log('Career form submitted:', {
      ...formData,
      resume: formData.resume ? formData.resume.name : null,
    });

    setError('');
    setSuccess('Thank you! Your application has been submitted. Our team will get back to you if there is a fit.');
    setTimeout(() => setSuccess(''), 4000);
  };

  return (
    <div className="career-page">
      <div className="hero-section text-center">
        <h1>Careers at Rajan Business Ideas</h1>
        <p className="lead">
          Help us build data-driven business reports for entrepreneurs, founders, and decision makers across the world.
        </p>
        <div className="hero-badges">
          <span className="hero-badge">High-impact work</span>
          <span className="hero-badge">Remote-friendly</span>
          <span className="hero-badge">Entrepreneurial culture</span>
        </div>
      </div>

      <div className="container career-container">
        <div className="row">
          {/* LEFT: Openings + Why work with us */}
          <div className="col-md-6 col-12 mb-4">
            <h3 className="section-title">Job Openings</h3>
            <p className="section-subtitle">
              We are a small, fast-moving team. If you don’t find a perfect role below, you can still send us a general
              application using the form.
            </p>

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
                        <Link to="/commingSoon" className="btn btn-outline-primary btn-sm">
                          View Details
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-jobs">
                    No active openings currently in {region.region}. You can still apply using the form – we keep
                    promising profiles in our talent pool.
                  </p>
                )}
              </div>
            ))}

            <div className="life-at-card">
              <h4>Life at Rajan Business Ideas</h4>
              <ul>
                <li>Work directly on real products like Rajan Business Reports used by entrepreneurs and CXOs.</li>
                <li>Ownership from Day 1 – your ideas can directly shape our dashboards, reports, and products.</li>
                <li>Remote-friendly with flexible hours (we care about outcomes, not just time online).</li>
                <li>Lean, learning-focused environment – perfect for builders, analysts, and problem-solvers.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: Application form */}
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
                <label htmlFor="firstName" className="form-label">
                  First Name *
                </label>
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
                <label htmlFor="lastName" className="form-label">
                  Last Name *
                </label>
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
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <label htmlFor="gender" className="form-label">
                  Gender
                </label>
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
                <label htmlFor="country" className="form-label">
                  Country *
                </label>
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
                    <option key={year} value={year}>
                      {year} {year === 1 ? 'year' : 'years'}
                    </option>
                  ))}
                  <option value="20+">20+ years</option>
                </select>
                <label htmlFor="experience" className="form-label">
                  Experience (Years) *
                </label>
              </div>

              <div className={`form-group mb-3 ${formData.role ? 'has-value' : ''}`}>
                <select
                  className="form-select"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  aria-label="Position / Role"
                >
                  <option value="">Select Position / Role</option>
                  {flatJobOptions.map((job) => (
                    <option key={job.id} value={job.label}>
                      {job.label}
                    </option>
                  ))}
                  <option value="General Application / Future Opportunities">
                    General Application / Future Opportunities
                  </option>
                </select>
                <label htmlFor="role" className="form-label">
                  Position / Role *
                </label>
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
                <label htmlFor="email" className="form-label">
                  Email ID *
                </label>
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
                    <option value="+1">+1 (USA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+1-CA">+1 (Canada)</option>
                    <option value="+61">+61 (Australia)</option>
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
                  <label htmlFor="mobile" className="form-label mobile-label">
                    Mobile Number *
                  </label>
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
                <label htmlFor="resume" className="form-label">
                  Upload Resume (.doc, .docx, .pdf) *
                </label>
              </div>

              {error && <p className="text-danger animate-error small mt-1">{error}</p>}
              {success && <p className="text-success animate-success small mt-1">{success}</p>}

              <button type="submit" className="btn btn-primary w-100 submit-btn mt-3">
                Submit Application
              </button>

              <p className="form-note">
                By submitting this form, you agree that we may contact you on email / WhatsApp for opportunities at
                Rajan Business Ideas.
              </p>
            </form>
          </div>
        </div>

        {/* How we hire */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="hiring-section">
              <h3 className="section-title">How We Hire</h3>
              <div className="hiring-steps">
                <div className="hiring-step">
                  <span className="step-number">1</span>
                  <h4>Application Review</h4>
                  <p>We go through your profile, resume, and experience to see if there is a potential fit.</p>
                </div>
                <div className="hiring-step">
                  <span className="step-number">2</span>
                  <h4>Short Assignment / Case</h4>
                  <p>
                    For many roles (especially research / product / engineering), we give a short, practical task
                    related to real RBR work.
                  </p>
                </div>
                <div className="hiring-step">
                  <span className="step-number">3</span>
                  <h4>Discussion with Founder</h4>
                  <p>You will have a conversation around your approach, goals, and how you like to work.</p>
                </div>
                <div className="hiring-step">
                  <span className="step-number">4</span>
                  <h4>Offer & Onboarding</h4>
                  <p>If there is a mutual fit, we move quickly with an offer and a structured onboarding plan.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="row mt-4 mb-5">
          <div className="col-12">
            <div className="faq-section">
              <h3 className="section-title">Frequently Asked Questions</h3>
              <div className="faq-item">
                <h4>Do you offer remote roles?</h4>
                <p>
                  Yes. Many of our roles are remote-friendly, especially for candidates based in India. Some positions
                  might require occasional in-person collaboration in Bangalore.
                </p>
              </div>
              <div className="faq-item">
                <h4>I don’t see a perfect role listed. Can I still apply?</h4>
                <p>
                  Absolutely. Select “General Application / Future Opportunities” in the form and tell us where you can
                  add the most value. We regularly look at our talent pool when new roles open up.
                </p>
              </div>
              <div className="faq-item">
                <h4>Who will see my application?</h4>
                <p>
                  Your application goes directly to the core Rajan Business Ideas team. We review each serious profile
                  carefully and respond if there is a match.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
