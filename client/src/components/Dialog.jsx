import { useEffect, useRef } from 'react';

function Dialog({ children, onClose, style, ariaLabel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();

    // Every dialog in this app renders a heading as its first line ("New bug",
    // "Edit suite", the test case title, ...). Derive aria-labelledby from it
    // automatically so every modal gets an accessible name with no per-call-site
    // changes, instead of leaving screen readers announcing a bare "dialog".
    const heading = dialog.querySelector('h1, h2');
    if (ariaLabel) {
      dialog.setAttribute('aria-label', ariaLabel);
    } else if (heading) {
      if (!heading.id) heading.id = `dialog-heading-${Math.random().toString(36).slice(2, 9)}`;
      dialog.setAttribute('aria-labelledby', heading.id);
    }

    function handleClose() {
      onClose();
    }

    function handleClick(e) {
      if (e.target === dialog) {
        dialog.close();
      }
    }

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('click', handleClick);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  return (
    <dialog ref={ref} style={{ ...baseStyle, ...style }}>
      {children}
    </dialog>
  );
}

const baseStyle = {
  border: 'none',
  borderRadius: '8px',
  padding: '1.5rem',
  width: '480px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  background: 'var(--bg)',
  color: 'var(--text)',
};

export default Dialog;
