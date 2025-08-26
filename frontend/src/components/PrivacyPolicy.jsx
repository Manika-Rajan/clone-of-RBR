import React from 'react';
import './Policy.css';

const PrivacyPolicy = () => {
  return (
    <div className="policy-container">
      <h1 className="policy-title">Privacy Policy</h1>
      <p className="policy-text">
        At RajanBusinessReports.in, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and share your data when you use our website RajanBusinessReports.in to generate and purchase reports. By using our services, you agree to the terms outlined in this policy.
      </p>

      <h2 className="policy-subtitle">1. Information We Collect</h2>
      <p className="policy-text">We collect the following types of information:</p>
      <ul className="policy-list">
        <li><strong>Personal Information:</strong> When you create an account, purchase a report, or contact us, we may collect your name, email address, phone number, billing address, and payment details (processed securely via Razorpay).</li>
        <li><strong>Report-Related Data:</strong> Information about the filters you select and the reports you generate to provide the requested services.</li>
        <li><strong>Usage Data:</strong> Details about how you interact with our website, such as IP address, browser type, pages visited, and timestamps, collected through cookies and similar technologies.</li>
        <li><strong>Payment Information:</strong> Payment details (e.g., card or UPI information) are securely handled by our payment gateway provider, Razorpay, and we do not store sensitive payment data on our servers.</li>
      </ul>

      <h2 className="policy-subtitle">2. How We Use Your Information</h2>
      <p className="policy-text">We use your data to:</p>
      <ul className="policy-list">
        <li>Process your report requests and deliver the generated reports.</li>
        <li>Handle payments, refunds, and cancellations through Razorpay’s secure platform.</li>
        <li>Communicate with you about your account, purchases, or support queries.</li>
        <li>Improve our website and services by analyzing usage patterns.</li>
        <li>Comply with legal obligations, such as tax reporting or KYC (Know Your Customer) requirements.</li>
      </ul>

      <h2 className="policy-subtitle">3. How We Share Your Information</h2>
      <p className="policy-text">We do not sell or rent your personal information. We may share your data with:</p>
      <ul className="policy-list">
        <li><strong>Razorpay:</strong> To process payments, refunds, or cancellations securely. Razorpay’s handling of your data is governed by their <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</li>
        <li><strong>Service Providers:</strong> Third-party vendors (e.g., hosting or analytics providers) who assist us in operating our website, bound by confidentiality agreements.</li>
        <li><strong>Legal Authorities:</strong> If required by law or to protect our rights, we may disclose your information to comply with legal processes.</li>
      </ul>

      <h2 className="policy-subtitle">4. Data Security</h2>
      <p className="policy-text">We implement industry-standard security measures, including encryption and secure servers, to protect your data. However, no online platform is 100% secure, and we encourage you to safeguard your account credentials.</p>

      <h2 className="policy-subtitle">5. Cookies and Tracking</h2>
      <p className="policy-text">We use cookies to enhance your experience, such as remembering your preferences and analyzing website performance. You can manage cookie preferences through your browser settings, but disabling cookies may limit some features.</p>

      <h2 className="policy-subtitle">6. Your Rights</h2>
      <p className="policy-text">Depending on applicable laws, you may have the right to:</p>
      <ul className="policy-list">
        <li>Access or correct your personal information.</li>
        <li>Request deletion of your data (subject to legal retention requirements).</li>
        <li>Opt out of marketing communications.</li>
      </ul>
      <p className="policy-text">To exercise these rights, contact us at <a href="mailto:support@rajanbusinessIdeas.com">support@rajanbusinessIdeas.com</a>.</p>

      <h2 className="policy-subtitle">7. Data Retention</h2>
      <p className="policy-text">We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy or comply with legal requirements. For example, transaction data may be kept for 5 years for tax purposes.</p>

      <h2 className="policy-subtitle">8. Third-Party Links</h2>
      <p className="policy-text">Our website may contain links to third-party sites (e.g., Razorpay). We are not responsible for their privacy practices, and we encourage you to review their policies.</p>

      <h2 className="policy-subtitle">9. International Users</h2>
      <p className="policy-text">Our services are hosted in India. If you access our website from outside India, your data may be transferred to and processed in India, subject to applicable laws.</p>

      <h2 className="policy-subtitle">10. Updates to This Policy</h2>
      <p className="policy-text">We may update this Privacy Policy to reflect changes in our practices or legal requirements. Updates will be posted on this page with a revised effective date.</p>

      <h2 className="policy-subtitle">11. Contact Us</h2>
      <p className="policy-text">For questions or concerns about this Privacy Policy, please contact:</p>
      <ul className="policy-list">
        <li><strong>Email:</strong> <a href="mailto:support@rajanbusinessIdeas.com">support@rajanbusinessIdeas.com</a></li>
        <li><strong>Phone:</strong> +91 9014794288</li>
        <li><strong>Address:</strong> Street number 14, Nagarjuna Nagar, Tarnaka, Secunderabad, Telangana</li>
      </ul>

      <p className="policy-text"><strong>Last Updated:</strong> April 14, 2025</p>
    </div>
  );
};

export default PrivacyPolicy;
