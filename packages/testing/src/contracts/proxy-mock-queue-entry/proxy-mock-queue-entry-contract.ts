/**
 * PURPOSE: Validates one entry on proxyMockCollectorMiddleware's own work queue — a file still to
 * visit, paired with the export names its own importer asked for (`null` means unconstrained: visit
 * in full). Exists so the queue's element type comes from a contract rather than a local ad-hoc type.
 *
 * USAGE:
 * proxyMockQueueEntryContract.parse({filePath: '/repo/a.proxy.ts', requestedNames: ['aProxy']});
 * // Returns a validated ProxyMockQueueEntry
 */

import { z } from '#gateway/npm/zod';
import { filePathContract } from '../file-path/file-path-contract';
import { identifierNameContract } from '../identifier-name/identifier-name-contract';

export const proxyMockQueueEntryContract = z.object({
  filePath: filePathContract,
  requestedNames: z.array(identifierNameContract).nullable(),
});

export type ProxyMockQueueEntry = z.infer<typeof proxyMockQueueEntryContract>;
