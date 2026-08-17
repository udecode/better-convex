/**
 * Health Check Endpoint
 */

import * as z from 'zod';
import { publicRoute } from '../lib/crpc';

// GET /api/health - Simple health check (no input)
export const health = publicRoute
  .get('/api/health')
  .output(z.object({ status: z.string(), timestamp: z.number() }))
  .query(async () => ({ status: 'ok', timestamp: Date.now() }));
