/** Deterministic PRNG (mulberry32) so every dataset / split / model is reproducible. */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normal(rng: Rng, mean = 0, std = 1): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function uniform(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
