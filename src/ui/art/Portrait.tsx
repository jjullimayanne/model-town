import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import { useMemo } from 'react';

/**
 * Character portraits rendered locally with DiceBear "Adventurer"
 * (art by Lisa Wischofsky, CC BY 4.0 — credited in README).
 */
export interface PortraitSpec {
  hair: string;
  hairColor: string;
  skinColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  bg: string;
  glasses?: string;
  earrings?: string;
  features?: ('mustache' | 'blush' | 'freckles' | 'birthmark')[];
}

type AdventurerOptions = Parameters<typeof createAvatar<typeof adventurer>>[1];

export function Portrait({ spec, size = 48, className = '' }: { spec: PortraitSpec; size?: number; className?: string }) {
  const uri = useMemo(() => {
    const opts = {
      seed: spec.hair + spec.skinColor,
      hair: [spec.hair],
      hairColor: [spec.hairColor],
      skinColor: [spec.skinColor],
      eyes: [spec.eyes],
      eyebrows: [spec.eyebrows],
      mouth: [spec.mouth],
      glasses: spec.glasses ? [spec.glasses] : undefined,
      glassesProbability: spec.glasses ? 100 : 0,
      earrings: spec.earrings ? [spec.earrings] : undefined,
      earringsProbability: spec.earrings ? 100 : 0,
      features: spec.features,
      featuresProbability: spec.features?.length ? 100 : 0,
      backgroundColor: [spec.bg],
      radius: 50,
    } as AdventurerOptions;
    return createAvatar(adventurer, opts).toDataUri();
  }, [spec]);
  return (
    <img
      src={uri}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={`shrink-0 rounded-full ring-3 ring-bark/15 bg-white ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
