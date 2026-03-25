import { useState } from 'react';
import './InputForm.css';

function InputForm({ onSubmit, initialValue, isLoading }) {
  const [text, setText] = useState(initialValue || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
    }
  };

  return (
    <div className="input-form-container">
      <h2>Add Venues</h2>
      <p className="input-helper">
        Paste text containing venue info (e.g., 연희동 66,000원 https://hourplace.co.kr/place/56488). One venue per line.
      </p>
      <form onSubmit={handleSubmit}>
        <textarea
          className="venue-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste venue text here..."
          rows={6}
        />
        <button type="submit" className="btn btn-primary submit-btn" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Parse & Load Images'}
        </button>
      </form>
    </div>
  );
}

export default InputForm;
