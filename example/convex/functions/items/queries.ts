import * as z from 'zod';
import { publicQuery } from '../../lib/crpc';

export const list = publicQuery
  .output(z.array(z.string()))
  .query(async () => ['item1', 'item2']);

export const get = publicQuery
  .input(z.object({ id: z.string() }))
  .output(z.string().nullable())
  .query(async ({ input }) => input.id);
