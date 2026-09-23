import { forwardRef } from 'react';

const SearchInput = forwardRef(function SearchInput({ wrapStyle, ...rest }, ref) {
  return (
    <div className="search-input-wrap" style={wrapStyle}>
      <svg className="search-input-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input ref={ref} type="text" {...rest} />
    </div>
  );
});

export default SearchInput;
