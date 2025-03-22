import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './PDFViewer.css';


const PDFViewer = ({ fileUrl }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div style={{ height: '90vh', width: '100%' }}>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <Viewer
          fileUrl={fileUrl}
          plugins={[defaultLayoutPluginInstance]}
        />
      </Worker>
    </div>
  );
};

export default PDFViewer;
