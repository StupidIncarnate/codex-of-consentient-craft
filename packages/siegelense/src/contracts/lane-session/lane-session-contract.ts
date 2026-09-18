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
 * (siegelense-tooling.md line 1623). `logFds` carries the raw OS descriptors `lane-boot-broker` opened
 * for each process's stdout/stderr redirect — a fd is meaningless once re-derived from a path, so
 * teardown can only close what boot hands it here. `ServerLogByteCount` lives in its own
 * `server-log-byte-count-contract.ts` rather than a brand declared inline in this file, because the
 * value is constructed inside a `brokers/` file, which may not import `zod` to brand a number itself.
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
import type { FileDescriptor } from '../file-descriptor/file-descriptor-contract';
import type { PortPair } from '../port-pair/port-pair-contract';
import type { ProcessGroupId } from '../process-group-id/process-group-id-contract';
import type { ServerLogByteCount } from '../server-log-byte-count/server-log-byte-count-contract';
import type { SpecName } from '../spec-name/spec-name-contract';

export const laneSessionContract = z.object({});

export type LaneSession = z.infer<typeof laneSessionContract> & {
  specName: SpecName;
  ports: PortPair;
  homePath: AbsoluteFilePath;
  evidencePath: AbsoluteFilePath;
  baseUrl: ContentText;
  apiBaseUrl: ContentText;
  pgids: readonly ProcessGroupId[];
  browser: BrowserSession | null;
  logFds: readonly FileDescriptor[];
  readServerLogSince: ({ fromByte }: { fromByte: number }) => readonly ContentText[];
  serverLogLength: () => ServerLogByteCount;
};
