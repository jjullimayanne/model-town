import { useEffect, useState } from 'react';
import { NEON_RECOLOR, recolorPixels, type CharacterSheet } from '../../game/textures';

const cache = new Map<CharacterSheet, Promise<string>>();

/** The same neon recolour the Phaser town applies, as a data URL for plain HTML. */
function neonSheet(sheet: CharacterSheet): Promise<string> {
  let p = cache.get(sheet);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}assets/kenney-toon/character_${sheet}_sheet.png`)
      .then((r) => r.blob())
      .then((b) => createImageBitmap(b))
      .then((bm) => {
        const c = document.createElement('canvas');
        c.width = bm.width;
        c.height = bm.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(bm, 0, 0);
        const px = ctx.getImageData(0, 0, c.width, c.height);
        recolorPixels(px.data, NEON_RECOLOR[sheet]);
        ctx.putImageData(px, 0, 0);
        return c.toDataURL();
      });
    cache.set(sheet, p);
  }
  return p;
}

/** One 96×128 frame of a Kenney "Toon Characters" sheet (CC0), recoloured to neon, with a glow. */
export function NeonCharacter({ sheet, frame = [0, 0], height = 128, flip = false, glow = '#8fb8de66', className = '' }: {
  sheet: CharacterSheet; frame?: [number, number]; height?: number; flip?: boolean; glow?: string; className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    neonSheet(sheet).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [sheet]);
  const s = height / 128;
  return (
    <div
      className={className}
      style={{
        width: 96 * s,
        height: 128 * s,
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundPosition: `${-frame[0] * 96 * s}px ${-frame[1] * 128 * s}px`,
        backgroundSize: `${864 * s}px ${640 * s}px`,
        transform: flip ? 'scaleX(-1)' : undefined,
        filter: `drop-shadow(0 0 6px ${glow})`,
      }}
    />
  );
}
