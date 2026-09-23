import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHORTCUTS } from '../shortcuts';
import QuickSearchModal from './QuickSearchModal';
import HelpModal from './HelpModal';

const CHORD_TIMEOUT_MS = 1000;

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

function stepMatches(step, event) {
  const key = event.key.toLowerCase();
  if (key !== step.key.toLowerCase()) return false;
  const modPressed = event.metaKey || event.ctrlKey;
  return step.mod ? modPressed : !modPressed;
}

function KeyboardShortcuts({ children }) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const bufferRef = useRef([]);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    const actionsById = {
      'quick-search': () => setSearchOpen(true),
      'go-bugs': () => navigate('/bugs'),
      'go-test-cases': () => navigate('/test-cases'),
      'go-runs': () => navigate('/test-runs'),
      'go-dashboard': () => navigate('/dashboard'),
      help: () => setHelpOpen(true),
    };

    function handleKeyDown(e) {
      if (isTypingTarget(document.activeElement)) return;
      if (document.querySelector('dialog[open]')) return;

      bufferRef.current = [...bufferRef.current, e].slice(-2);
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        bufferRef.current = [];
      }, CHORD_TIMEOUT_MS);

      for (const shortcut of SHORTCUTS) {
        const tail = bufferRef.current.slice(-shortcut.keys.length);
        if (tail.length !== shortcut.keys.length) continue;
        if (tail.every((event, i) => stepMatches(shortcut.keys[i], event))) {
          e.preventDefault();
          bufferRef.current = [];
          clearTimeout(clearTimerRef.current);
          actionsById[shortcut.id]?.();
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(clearTimerRef.current);
    };
  }, [navigate]);

  return (
    <>
      {children}
      {searchOpen && <QuickSearchModal onClose={() => setSearchOpen(false)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}

export default KeyboardShortcuts;
