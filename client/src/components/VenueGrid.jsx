import VenueCard from './VenueCard';
import './VenueGrid.css';

function VenueGrid({ venues }) {
  if (!venues || venues.length === 0) {
    return (
      <div className="empty-state">
        <p>No venues to display. Try parsing some text above.</p>
      </div>
    );
  }

  return (
    <div className="venue-grid">
      {venues.map((venue, index) => (
        <VenueCard key={venue.id || index} venue={venue} />
      ))}
    </div>
  );
}

export default VenueGrid;
