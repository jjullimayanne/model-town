import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { TownScene } from './scenes/TownScene';

/** Mounts the Phaser town once; all further communication goes through the EventBus. */
export function PhaserGame() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      backgroundColor: '#bfe6f5',
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      render: { antialias: true, roundPixels: false },
      scene: [TownScene],
    });
    // Debug handle for the browser console, like __game/__bus in main.tsx: __phaser.scene.getScene('Town')
    if (import.meta.env.DEV) Object.assign(window, { __phaser: game });
    return () => game.destroy(true);
  }, []);

  return <div ref={host} className="absolute inset-0" />;
}
