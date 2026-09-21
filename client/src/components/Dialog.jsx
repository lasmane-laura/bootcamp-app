import { useEffect, useRef } from 'react';

function Dialog({ children, onClose, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();

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
};

export default Dialog;
