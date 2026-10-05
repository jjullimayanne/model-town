import { useEffect, useState } from 'react';

const query = '(pointer: coarse)';

/** True on phones/tablets (finger as the main pointer), so the UI can talk about taps instead of keys. */
export function useTouch() {
  const [touch, setTouch] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    const on = () => setTouch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return touch;
}
