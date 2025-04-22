// src/components/RefundPolicy.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Policy.css';

const RefundPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Refund and Cancellation Policy</h1>
      <p>
        At RajanBusinessReports.in, we strive to ensure you are satisfied with your purchase of our detailed reports. This Refund and Cancellation Policy outlines the terms under which refunds or cancellations are processed for reports purchased on our platform. Please read this policy carefully before making a purchase.
      </p>

      <h2>1. Eligibility for Refunds</h2>
      <p>We offer refunds under the following circumstances:</p>
      <ul>
        <li>
          <strong>Non-Delivery of Report:</strong> If the report you purchased is not generated or delivered due to a technical issue on our end, you are eligible for a full refund.
        </li>
        <li>
          <strong>Incorrect Report Generated:</strong> If the report does not match the filters or criteria you selected due to an error in our system, you may request a refund or a corrected report.
        </li>
        <li>
          <strong>Duplicate Transactions:</strong> If you are charged multiple times for the same report due to a payment error, we will refund the duplicate charges.
        </li>
      </ul>
      <p>Refunds will not be issued for:</p>
      <ul>
        <li>User errors, such as selecting incorrect filters or misunderstanding the report’s scope.</li>
        <li>Dissatisfaction with the report’s content if it meets the specified criteria and is delivered as promised.</li>
        <li>Purchases made more than 7 days ago, unless required by law.</li>
      </ul>

      <h2>2. Cancellation of Purchase</h2>
      <ul>
        <li>Once a report is generated and made available for viewing, the purchase cannot be cancelled, as the service is considered fulfilled.</li>
        <li>
          If you wish to cancel a transaction before the report is generated (e.g., during payment processing), please contact us immediately at{' '}
          <a href="mailto:support@rajanbusinessIdeas.com">support@rajanbusinessIdeas.com</a>. We will review the request and process a refund if the report has not been generated.
        </li>
      </ul>

      <h2>3. Refund Process</h2>
      <p>To request a refund:</p>
      <ul>
        <li>
          Contact us at <a href="mailto:support@rajanbusinessIdeas.com">support@rajanbusinessIdeas.com</a> or +91 9014794288 within 24 hours of the purchase.
        </li>
        <li>Provide your order ID, email used for the purchase, and a brief description of the issue.</li>
        <li>Our team will review your request within 2-3 business days and notify you of the outcome.</li>
      </ul>
      <p>
        Approved refunds will be processed to the original payment method used for the transaction. Refunds typically take 5-7 business days to reflect in your account, depending on your bank or payment provider’s processing times.
      </p>

      <h2>4. Chargebacks</h2>
      <p>
        If you initiate a chargeback with your bank or payment provider without first contacting us, we reserve the right to investigate the claim. Unjustified chargebacks may result in restricted access to our platform.
      </p>

      <h2>5. Contact Us</h2>
      <p>For any questions or assistance with refunds or cancellations, please reach out to us:</p>
      <ul>
        <li>
          <strong>Email:</strong> <a href="mailto:support@rajanbusinessIdeas.com">support@rajanbusinessIdeas.com</a>
        </li>
        <li>
          <strong>Phone:</strong> +91 9014794288
        </li>
        <li>
          <strong>Support Hours:</strong> Monday to Friday, 9 AM to 6 PM IST
        </li>
      </ul>
      <p>We reserve the right to update this policy at any time. Changes will be posted on this page with an updated effective date.</p>

      <p>
        <strong>Last Updated:</strong> April 14, 2025
      </p>
    </div>
  );
};

export default RefundPolicy;
