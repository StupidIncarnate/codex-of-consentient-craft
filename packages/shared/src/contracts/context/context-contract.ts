/**
 * PURPOSE: Defines the Context structure for reusable environments (WHERE in BDD)
 *
 * USAGE:
 * contextContract.parse({id: 'f47ac10b-...', name: 'Admin Page', description: 'User admin section', locator: {page: '/admin'}});
 * // Returns: Context object
 */

import { z } from 'zod';

import { contextIdContract } from '../context-id/context-id-contract';
import { contextLocatorContract } from '../context-locator/context-locator-contract';

export const contextContract = z.object({
  id: contextIdContract,
  name: z.string().min(1).brand<'ContextName'>(),
  description: z.string().brand<'ContextDescription'>(),
  locator: contextLocatorContract,
});

export type Context = z.infer<typeof contextContract>;
