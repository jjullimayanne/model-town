import { LocalEngine } from './localEngine';
import { RemoteEngine } from './remoteEngine';
import type { MLEngine } from './types';

export * from './types';

/** Set VITE_ML_BACKEND_URL to switch the whole game to a real Python backend. */
const backend = import.meta.env.VITE_ML_BACKEND_URL as string | undefined;

export const engine: MLEngine = backend ? new RemoteEngine(backend) : new LocalEngine();
