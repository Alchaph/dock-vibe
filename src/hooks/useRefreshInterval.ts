import { useState, useEffect } from 'react';

export function useRefreshInterval(): number {
  const [interval, setInterval_] = useState(() => {
    const saved = localStorage.getItem('refreshInterval');
    return saved ? Number(saved) * 1000 : 5000;
  });

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('refreshInterval');
      setInterval_(saved ? Number(saved) * 1000 : 5000);
    };
    window.addEventListener('storage', handler);
    // Also listen for custom event from Settings component
    window.addEventListener('refreshIntervalChanged', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('refreshIntervalChanged', handler);
    };
  }, []);

  return interval;
}
