import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './PDFViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ fileUrl, onClose }) => {
  return (
    <div className="pdf-modal" onContextMenu={(e) => e.preventDefault()}>
      <div className="pdf-overlay" />
      <div className="pdf-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <Document file={fileUrl}>
          <Page pageNumber={1} />
          {/* Add logic to paginate if needed */}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
