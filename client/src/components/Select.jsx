function Select({ children, wrapStyle, ...rest }) {
  return (
    <div className="select-wrap" style={wrapStyle}>
      <select {...rest}>{children}</select>
      <svg className="select-chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default Select;
