/**
 * PURPOSE: Defines a single react-router-dom &lt;Route&gt; entry extracted from a flow source — its
 * path attribute (or null for layout routes) and the JSX element symbol it renders
 *
 * USAGE:
 * routeMetadataContract.parse({
 *   path: '/:guildSlug/quest',
 *   responderSymbol: 'AppQuestChatResponder',
 * });
 * // Returns validated RouteMetadata
 *
 * WHEN-TO-USE: Project-map boot-tree rendering for flows that compose React Router routes
 */

import { z } from '#gateway/npm/zod';

export const routeMetadataContract = z
  .object({
    path: z.string().brand<'RouteMetadataPath'>().nullable(),
    responderSymbol: z.string().brand<'RouteMetadataResponderSymbol'>(),
  })
  .brand<'RouteMetadata'>();

export type RouteMetadata = z.infer<typeof routeMetadataContract>;
