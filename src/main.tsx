import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

if (import.meta.env.DEV) {
  // Debug handles for the browser console: __game.getState(), __bus.emit('building:enter', { id: 'mllab' })
  Promise.all([import('./store/gameStore'), import('./bridge/EventBus')]).then(([s, b]) => {
    Object.assign(window, { __game: s.useGame, __bus: b.EventBus });
  });
}
