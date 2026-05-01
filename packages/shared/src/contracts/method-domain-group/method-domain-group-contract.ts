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

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const methodDomainGroupContract = z.object({
  domain: contentTextContract,
  methods: z.array(contentTextContract),
});

export type MethodDomainGroup = z.infer<typeof methodDomainGroupContract>;
