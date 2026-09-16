/**
 * PURPOSE: The seven HTTP methods a `results` query's `where: { method }` filters a `network` row
 * by. Reach for this over ContentText (`@dungeonmaster/shared/contracts`) whenever the value must
 * be one of the closed set of verbs an exchange can carry, never an arbitrary string a typo could
 * slip past unnoticed.
 *
 * USAGE:
 * httpMethodContract.parse('POST');
 * // Returns a branded HttpMethod
 */

import { z } from 'zod';

export const httpMethodContract = z
  .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
  .brand<'HttpMethod'>();

export type HttpMethod = z.infer<typeof httpMethodContract>;
