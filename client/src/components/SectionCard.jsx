import { Link } from 'react-router-dom';

function SectionCard({ to, title, art: Art }) {
  return (
    <Link to={to} className="section-card">
      <span className="section-card-art">
        <Art />
      </span>
      <span className="section-card-label">{title}</span>
    </Link>
  );
}

export default SectionCard;
