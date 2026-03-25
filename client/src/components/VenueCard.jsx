import './VenueCard.css';

function VenueCard({ venue }) {
  return (
    <div className="venue-card">
      <a href={venue.url} target="_blank" rel="noopener noreferrer" className="venue-image-container" style={{ display: 'block', textDecoration: 'none' }}>
        {venue.imageUrl ? (
          <img src={venue.imageUrl} alt={venue.location} className="venue-image" />
        ) : (
          <div className="venue-image-placeholder">
            {venue.error ? 'Image not found' : 'No image available'}
          </div>
        )}
      </a>
      <div className="venue-details">
        <h3 className="venue-location">{venue.location || 'Unknown Location'}</h3>
        <p className="venue-price">{venue.price || 'Price not specified'}</p>
        <a href={venue.url} target="_blank" rel="noopener noreferrer" className="venue-link">
          View Venue →
        </a>
      </div>
    </div>
  );
}

export default VenueCard;
