import type { BuildingId } from '../buildings';

export interface MissionStep<S extends string = string> {
  id: S;
  objective: string;
  building: BuildingId;
  xp: number;
}

export interface MissionDef<S extends string = string> {
  id: string;
  title: string;
  client: string;
  summary: string;
  steps: MissionStep<S>[];
  reward: { xp: number; coins: number };
}
