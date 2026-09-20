/**
 * PURPOSE: The on-disk shape a driver process writes beside its instance's evidence the moment it
 * tears its OWN lane down on purpose — the idle timeout firing with no `run` received — so `status`
 * can report that fact rather than inventing an RSS/OOM narrative for a death the tool scheduled
 * itself (siegelense-tooling.md's "the crash a walker must NOT mistake for a defect": a self-reap is
 * a tool event, never an app defect). `reason` is a plain, present-tense sentence naming what
 * happened, never a claim about WHY the caller went quiet — `likelyCauseLayerBroker` reads it as a
 * fact the driver recorded about itself, not an inference. `atMs` exists for the same reason
 * `bootFailureMarkerContract`'s own `atMs` does: it tells a reader inspecting the file directly
 * whether it is stale, left over from an earlier lane the same evidence directory outlived.
 *
 * USAGE:
 * shutdownReasonContract.parse({
 *   reason: 'reaped by idle timeout after 900s with no run received',
 *   atMs: 1700000000000,
 * });
 * // Returns a validated ShutdownReason
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';

export const shutdownReasonContract = z.object({
  reason: contentTextContract,
  atMs: epochMsContract,
});

export type ShutdownReason = z.infer<typeof shutdownReasonContract>;
