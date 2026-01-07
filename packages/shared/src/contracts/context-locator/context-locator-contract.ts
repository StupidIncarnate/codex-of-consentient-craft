/**
 * PURPOSE: Defines the locator structure for Context environments
 *
 * USAGE:
 * contextLocatorContract.parse({page: '/admin/users', section: '#permissions'});
 * // Returns: ContextLocator object
 */

import { z } from 'zod';

export const contextLocatorContract = z.object({
  page: z.string().brand<'PagePath'>().optional(),
  section: z.string().brand<'SectionSelector'>().optional(),
});

export type ContextLocator = z.infer<typeof contextLocatorContract>;
