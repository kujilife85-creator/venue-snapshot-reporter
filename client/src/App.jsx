import { useState, useEffect } from 'react';
import './App.css';
import InputForm from './components/InputForm';
import SearchBar from './components/SearchBar';
import VenueGrid from './components/VenueGrid';

function App() {
  const [venues, setVenues] = useState([]);
  const [rawInput, setRawInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedVenues = localStorage.getItem('venueData');
    const savedRawInput = localStorage.getItem('venueRawInput');
    
    if (savedVenues) {
      try {
        setVenues(JSON.parse(savedVenues));
      } catch (e) {
        console.error('Failed to parse saved venues');
      }
    }
    if (savedRawInput) {
      setRawInput(savedRawInput);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('venueData', JSON.stringify(venues));
    localStorage.setItem('venueRawInput', rawInput);
  }, [venues, rawInput]);

  const handleParseAndLoad = async (text) => {
    setRawInput(text);
    setError(null);
    setIsLoading(true);

    try {
      // Line-by-line parsing
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const parsedVenues = lines.map((line, index) => {
        // Simple logic: split by space, assume last is URL, second to last is price, rest is location
        const parts = line.trim().split(/\s+/);
        
        let url = '';
        let price = '';
        let location = '';

        if (parts.length > 0) {
          const possibleUrl = parts[parts.length - 1];
          if (possibleUrl.startsWith('http')) {
            url = possibleUrl;
            parts.pop();
          }
        }
        
        if (parts.length > 0) {
          price = parts[parts.length - 1];
          parts.pop();
        }

        location = parts.join(' ');

        return { id: index, location, price, url };
      });

      // Call API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedVenues),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data from the server.');
      }

      const data = await response.json();
      setVenues(data);
    } catch (err) {
      setError(err.message || 'An error occurred while parsing and fetching.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVenues = venues.filter(venue => {
    const query = searchQuery.toLowerCase();
    const locationMatch = venue.location && venue.location.toLowerCase().includes(query);
    const priceMatch = venue.price && venue.price.toLowerCase().includes(query);
    return locationMatch || priceMatch;
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Venue Snapshot Reporter</h1>
        <p>Effortlessly extract and view venue details</p>
      </header>
      
      <main className="main-content">
        <InputForm onSubmit={handleParseAndLoad} initialValue={rawInput} isLoading={isLoading} />
        
        {error && (
          <div className="error-message" style={{ color: 'var(--error-color)', padding: '1rem', backgroundColor: '#ffe6e6', borderRadius: '8px', border: '1px solid var(--error-color)' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="loading-state" style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading venue details and extracting images...</p>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : (
          <>
            {(venues.length > 0 || searchQuery) && (
              <SearchBar query={searchQuery} setQuery={setSearchQuery} />
            )}
            {venues.length > 0 && <VenueGrid venues={filteredVenues} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
