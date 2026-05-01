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

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const httpEdgeContract = z.object({
  method: contentTextContract,
  urlPattern: contentTextContract,
  serverFlowFile: absoluteFilePathContract.nullable(),
  serverResponderFile: absoluteFilePathContract.nullable(),
  webBrokerFile: absoluteFilePathContract.nullable(),
  paired: z.boolean(),
});

export type HttpEdge = z.infer<typeof httpEdgeContract>;
