import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Hero from './components/Hero';
import FileUpload from './components/FileUpload';
import PaymentSuccess from './components/PaymentSuccess';
import Footer from './components/Footer';
import Download from './pages/Download';

function HomePage() {
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleUploadSuccess = (fileData) => {
    setUploadedFile(fileData);
    // With x402 protocol, payment is already completed at upload time
  };

  return (
    <>
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <Hero />
        
        <div className="mt-12">
          {!uploadedFile ? (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          ) : (
            <PaymentSuccess 
              fileData={uploadedFile} 
              onRetryPayment={null} // No retry needed, payment is done at upload
            />
          )}
        </div>
      </main>
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/download/:shareLink" element={<Download />} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;
