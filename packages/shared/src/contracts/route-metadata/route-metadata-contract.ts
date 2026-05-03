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

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const routeMetadataContract = z.object({
  path: contentTextContract.nullable(),
  responderSymbol: contentTextContract,
});

export type RouteMetadata = z.infer<typeof routeMetadataContract>;
