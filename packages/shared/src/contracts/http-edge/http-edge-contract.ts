/**
 * PURPOSE: Defines the HttpEdge structure linking a server-registered HTTP route to its
 * matching web broker fetch call, resolved to literal (method, urlPattern) pairs
 *
 * USAGE:
 * httpEdgeContract.parse({
 *   method: 'GET',
 *   urlPattern: '/api/quests',
 *   serverFlowFile: '/repo/packages/server/src/flows/quest/quest-flow.ts',
 *   serverResponderFile: null,
 *   webBrokerFile: '/repo/packages/web/src/brokers/quest/list/quest-list-broker.ts',
 *   paired: true,
 * });
 * // Returns validated HttpEdge
 *
 * WHEN-TO-USE: Building the HTTP-edges layer for the project-map EDGES footer
 */

import { z } from '#gateway/npm/zod';

export const httpEdgeContract = z.object({
  method: z.string().brand<'HttpEdgeMethod'>(),
  urlPattern: z.string().brand<'HttpEdgeUrlPattern'>(),
  serverFlowFile: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'HttpEdgeServerFlowFile'>().nullable(),
  serverResponderFile: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'HttpEdgeServerResponderFile'>().nullable(),
  webBrokerFile: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'HttpEdgeWebBrokerFile'>().nullable(),
  paired: z.boolean(),
}).brand<'HttpEdge'>();

export type HttpEdge = z.infer<typeof httpEdgeContract>;
