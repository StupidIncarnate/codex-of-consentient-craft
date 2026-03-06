/**
 * PURPOSE: Defines the branded kebab-case type for Observable identifiers
 *
 * USAGE:
 * observableIdContract.parse('login-redirects-to-dashboard');
 * // Returns: ObservableId branded string
 */

import { z } from 'zod';

export const observableIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'ObservableId'>();

export type ObservableId = z.infer<typeof observableIdContract>;
