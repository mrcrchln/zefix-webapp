// src/App.js - Fixed version
import React, { useState } from 'react';
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import './index.css';

function App() {
  const [companyName, setCompanyName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkCompany = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Call your Firebase Function
      const checkCompanyFunction = httpsCallable(functions, 'checkCompany');
      const response = await checkCompanyFunction({ companyName: companyName.trim() });
      
      console.log('Full response:', response.data); // Debug log
      setResult(response.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to check company');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely render values
  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Zefix Company Checker
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name (e.g., Sygnum, AstraZeneca)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && checkCompany()}
              />
            </div>
            
            <button
              onClick={checkCompany}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Checking...' : 'Check Company'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 border rounded-md">
              <h3 className="font-semibold text-lg mb-2">
                {result.found ? '✅ Company Found' : '❌ Company Not Found'}
              </h3>
              
              <p className="text-gray-600 mb-2">
                Searched for: <span className="font-medium">{result.companyName}</span>
              </p>
              
              {result.found && result.data && result.data.length > 0 && (
                <div className="space-y-3">
                  {result.data.map((company, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <p><strong>Official Name:</strong> {renderValue(company.name)}</p>
                      <p><strong>UID:</strong> {renderValue(company.uid)}</p>
                      <p><strong>Canton:</strong> {renderValue(company.legalSeat)}</p>
                      <p><strong>Legal Form:</strong> {renderValue(company.legalForm)}</p>
                      <p><strong>Status:</strong> {renderValue(company.status)}</p>
                      {company.address && (
                        <p><strong>Address:</strong> {renderValue(company.address)}</p>
                      )}
                      
                      {/* Debug: Show all available fields */}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-500">
                          Show all data
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(company, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;