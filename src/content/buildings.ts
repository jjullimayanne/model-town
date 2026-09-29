export type BuildingId =
  | 'cityhall'
  | 'datacenter'
  | 'cleaning'
  | 'mllab'
  | 'evaluation'
  | 'deploy'
  | 'monitoring';

import type { PortraitSpec } from '../ui/art/Portrait';

/** Someone who talks to the player: every building's host, plus guests. Names live in the i18n dictionaries. */
export type HostId = BuildingId | 'otto';

export interface BuildingDef {
  id: BuildingId;
  /** Grid footprint (top-left tile + size). */
  tile: { x: number; y: number; w: number; h: number };
  /** Walkable tile right in front of the door. */
  door: { x: number; y: number };
  wall: number;
  roof: number;
  accent: string;
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'cityhall',
    tile: { x: 4, y: 11, w: 4, h: 3 }, door: { x: 6, y: 14 },
    wall: 0x3b4063, roof: 0xd9a0b4, accent: '#9c6479',
  },
  {
    id: 'datacenter',
    tile: { x: 4, y: 4, w: 3, h: 3 }, door: { x: 5, y: 7 },
    wall: 0x3b4063, roof: 0x8fb8de, accent: '#4f7599',
  },
  {
    id: 'cleaning',
    tile: { x: 5, y: 19, w: 3, h: 3 }, door: { x: 6, y: 22 },
    wall: 0x3b4063, roof: 0x9cc5a1, accent: '#5b8a6a',
  },
  {
    id: 'mllab',
    tile: { x: 18, y: 4, w: 3, h: 3 }, door: { x: 19, y: 7 },
    wall: 0x3b4063, roof: 0xa99bd6, accent: '#6f64a0',
  },
  {
    id: 'evaluation',
    tile: { x: 21, y: 11, w: 3, h: 3 }, door: { x: 22, y: 14 },
    wall: 0x3b4063, roof: 0xf2c46d, accent: '#a3843c',
  },
  {
    id: 'deploy',
    tile: { x: 18, y: 19, w: 3, h: 3 }, door: { x: 19, y: 22 },
    wall: 0x3b4063, roof: 0xe8a87c, accent: '#a8704d',
  },
  {
    id: 'monitoring',
    tile: { x: 23, y: 18, w: 3, h: 3 }, door: { x: 24, y: 21 },
    wall: 0x3b4063, roof: 0x7fb3c4, accent: '#4f8594',
  },
];

export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<BuildingId, BuildingDef>;


export const PORTRAITS: Record<HostId, PortraitSpec> = {
  cityhall: { hair: 'long16', hairColor: '592454', skinColor: '763900', eyes: 'variant04', eyebrows: 'variant10', mouth: 'variant23', earrings: 'variant03', bg: '4a3f55' },
  datacenter: { hair: 'long03', hairColor: '85c2c6', skinColor: 'f2d3b1', eyes: 'variant12', eyebrows: 'variant03', mouth: 'variant26', glasses: 'variant01', bg: '354a63' },
  cleaning: { hair: 'short14', hairColor: 'afafaf', skinColor: '9e5622', eyes: 'variant09', eyebrows: 'variant07', mouth: 'variant09', features: ['mustache'], bg: '3a5048' },
  mllab: { hair: 'long22', hairColor: 'ff5fa8', skinColor: 'ecad80', eyes: 'variant16', eyebrows: 'variant13', mouth: 'variant20', glasses: 'variant04', bg: '443f63' },
  evaluation: { hair: 'short19', hairColor: '85c2c6', skinColor: 'f2d3b1', eyes: 'variant21', eyebrows: 'variant02', mouth: 'variant28', glasses: 'variant02', bg: '5a4d35' },
  deploy: { hair: 'short05', hairColor: '3eac2c', skinColor: '763900', eyes: 'variant18', eyebrows: 'variant11', mouth: 'variant17', bg: '5a4238' },
  monitoring: { hair: 'long10', hairColor: 'dba3be', skinColor: 'f2d3b1', eyes: 'variant24', eyebrows: 'variant05', mouth: 'variant24', features: ['freckles'], bg: '35505a' },
  otto: { hair: 'short03', hairColor: 'cb6820', skinColor: 'ecad80', eyes: 'variant02', eyebrows: 'variant14', mouth: 'variant30', features: ['mustache'], bg: '5a4238' },
};
