import { useState, useEffect, useRef } from 'react';
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
  
  const isInitialMount = useRef(true);

  const handleParseAndLoad = async (text) => {
    setRawInput(text);
    setError(null);
    setIsLoading(true);

    try {
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const parsedVenues = lines.map((line, index) => {
        const parts = line.trim().split(/\s+/);
        let url = '';
        let price = '';
        let location = '';

        if (parts.length > 0) {
          const possibleUrl = parts[parts.length - 1];
          // http 포함되어있는지 유연하게 체크
          if (possibleUrl.includes('http')) {
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

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for Render cold starts
      
      let endpoint = `${API_URL}/api/scrape`;
      if (API_URL.endsWith('/')) {
         endpoint = `${API_URL}api/scrape`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedVenues),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`서버 응답 에러 (상태 코드: ${response.status}). 백엔드 연결을 다시 확인해주세요.`);
      }

      const data = await response.json();
      setVenues(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('서버 응답 시간이 초과되었습니다 (60초). 백엔드 주소(VITE_API_URL)가 올바른지 확인해 주세요.');
      } else {
         setError(err.message || '데이터를 가져오는 중 오류가 발생했습니다. VITE_API_URL이 제대로 설정되었는지 확인하세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      const params = new URLSearchParams(window.location.search);
      const sharedData = params.get('data');

      if (sharedData) {
        try {
          const decoded = decodeURIComponent(atob(sharedData));
          setRawInput(decoded);
          // Set a small delay before triggering fetch automatically to ensure state settles
          setTimeout(() => handleParseAndLoad(decoded), 200);
          return;
        } catch (e) {
          console.error('Invalid share link format');
        }
      }

      // Fallback to localStorage if no share link
      const savedVenues = localStorage.getItem('venueData');
      const savedRawInput = localStorage.getItem('venueRawInput');
      
      if (savedVenues) {
        try { setVenues(JSON.parse(savedVenues)); } catch (e) {}
      }
      if (savedRawInput) {
        setRawInput(savedRawInput);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInitialMount.current && venues.length > 0) {
      localStorage.setItem('venueData', JSON.stringify(venues));
      localStorage.setItem('venueRawInput', rawInput);
    }
  }, [venues, rawInput]);

  const handleShare = () => {
    if (!rawInput.trim()) {
      alert('공유할 데이터가 없습니다.');
      return;
    }
    try {
      // Create base64 encoded payload
      const encoded = btoa(encodeURIComponent(rawInput));
      const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
      
      navigator.clipboard.writeText(url).then(() => {
        alert('🎉 공유 링크가 클립보드에 복사되었습니다!\n동료에게 붙여넣기(Ctrl+V)해서 보내면 지금 화면의 카드들을 똑같이 볼 수 있습니다.');
      }).catch(() => {
        prompt('아래 링크를 복사(Ctrl+C)해서 동료에게 공유해주세요:', url);
      });
    } catch(e) {
      alert('링크 생성 중 오류가 발생했습니다.');
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
          <div className="error-message" style={{ color: 'var(--error-color)', padding: '1.5rem', backgroundColor: '#ffe6e6', borderRadius: '8px', border: '1px solid var(--error-color)', marginTop: '1rem', lineHeight: '1.6' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🚨 데이터 파싱 실패!</p>
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state" style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
               Loading venue details and extracting images...<br/>
               <span style={{ fontSize: '0.9rem', color: '#888' }}>(Render 무료 서버가 잠에서 깨어나는 중입니다. 첫 로딩은 최대 1분까지 소요될 수 있으니 조금만 기다려주세요 ☕)</span>
            </p>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : (
          <>
            {(venues.length > 0 || searchQuery) && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <SearchBar query={searchQuery} setQuery={setSearchQuery} />
                </div>
                {venues.length > 0 && (
                  <button onClick={handleShare} className="btn btn-primary" style={{ backgroundColor: '#4c6ef5', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    결과물 링크 공유하기
                  </button>
                )}
              </div>
            )}
            {venues.length > 0 && <VenueGrid venues={filteredVenues} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
