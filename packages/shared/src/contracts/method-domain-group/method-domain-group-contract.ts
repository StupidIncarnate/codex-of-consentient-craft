/**
 * PURPOSE: Defines the MethodDomainGroup structure for grouping public API method names
 * by domain in the programmatic-service project-map headline renderer
 *
 * USAGE:
 * methodDomainGroupContract.parse({
 *   domain: 'Guilds',
 *   methods: ['listGuilds', 'addGuild'],
 * });
 * // Returns validated MethodDomainGroup
 *
 * WHEN-TO-USE: namespaceMethodsGroupByDomainTransformer return type and project-map headline rendering
 */

import { z } from '#gateway/npm/zod';

export const methodDomainGroupContract = z.object({
  domain: z.string().brand<'MethodDomainGroupDomain'>(),
  methods: z.array(z.string().brand<'MethodDomainGroupMethods'>()),
});

export type MethodDomainGroup = z.infer<typeof methodDomainGroupContract>;
