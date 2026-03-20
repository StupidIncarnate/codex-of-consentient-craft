/**
 * PURPOSE: Defines the internal handle entry structure for registerMock stack-based dispatch
 *
 * USAGE:
 * const entry: MockHandleEntry = { callerPath, baseImpl: null, onceQueue: [], calls: [] };
 * // Tracks per-proxy mock state for stack-based routing
 */

import { z } from 'zod';

import { mockCallerPathContract } from '../mock-caller-path/mock-caller-path-contract';

export const mockHandleEntryContract = z.object({
  callerPath: mockCallerPathContract,
  baseImpl: z.function().nullable(),
  onceQueue: z.array(z.function()),
  calls: z.array(z.array(z.unknown())),
});

export type MockHandleEntry = z.infer<typeof mockHandleEntryContract>;
