/**
 * PURPOSE: One booted lane's whole surface — its spec name, its claimed ports, its throwaway home and
 * repo-local evidence paths, the process groups `kill` signals, and (optionally) a live
 * `BrowserSession` — described the same structural way as `browserSessionContract` and for the same
 * reason: whatever broker closes over the child processes and the Playwright browser a lane owns
 * cannot hand back an npm-package type, and contracts/ cannot import one to describe it either. The
 * data half stays an empty `z.object({})` and every field is added through a TypeScript intersection.
 * `browser` is what makes a browserless spec REPRESENTABLE rather than a bug waiting in an adapter: a
 * `dungeonmaster-headless` instance boots its servers and no Chromium, so its `LaneSession.browser` is
 * `null` by construction rather than a `BrowserSession` some caller forgot to close, and the guard that
 * rejects a browser step against it reads this field instead of probing a live page for one
 * (siegelense-tooling.md line 1623).
 *
 * USAGE:
 * const lane: LaneSession = await laneBootBroker({ spec: LaneSpecStub({ browser: false }) });
 * if (lane.browser === null) {
 *   throw new BrowserStepUnsupportedError({ verb: 'click', specName: lane.specName });
 * }
 * // lane.browser is null on a browserless spec and a live BrowserSession on 'dungeonmaster-web'
 */

import { z } from 'zod';

import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../browser-session/browser-session-contract';
import type { PortPair } from '../port-pair/port-pair-contract';
import type { ProcessGroupId } from '../process-group-id/process-group-id-contract';
import type { SpecName } from '../spec-name/spec-name-contract';

export const laneSessionContract = z.object({});

const _serverLogByteCountContract = z.number().int().nonnegative().brand<'ServerLogByteCount'>();
type ServerLogByteCount = z.infer<typeof _serverLogByteCountContract>;

export type LaneSession = z.infer<typeof laneSessionContract> & {
  specName: SpecName;
  ports: PortPair;
  homePath: AbsoluteFilePath;
  evidencePath: AbsoluteFilePath;
  baseUrl: ContentText;
  pgids: readonly ProcessGroupId[];
  browser: BrowserSession | null;
  readServerLogSince: ({ fromByte }: { fromByte: number }) => readonly ContentText[];
  serverLogLength: () => ServerLogByteCount;
};
