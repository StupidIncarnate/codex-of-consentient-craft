/**
 * PURPOSE: One booted lane's whole surface — its spec name, its claimed ports, its throwaway home and
 * repo-local evidence paths, the process groups `kill` signals, and (optionally) a live
 * `BrowserSession`. The data members are a schema, `laneBootBroker` parses them where it builds the
 * lane, and the two log-reader functions Zod cannot check are added through a TypeScript
 * intersection. `browser` is what makes a browserless spec REPRESENTABLE rather than a bug waiting in an adapter: a
 * `dungeonmaster-api` instance boots its servers and no Chromium, so its `LaneSession.browser` is
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
 * // lane.browser is null on a browserless spec and a live BrowserSession on 'dungeonmaster-stack'
 */

import { z } from '#gateway/npm/zod';

import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../browser-session/browser-session-contract';
import { fileDescriptorContract } from '../file-descriptor/file-descriptor-contract';
import { portPairContract } from '../port-pair/port-pair-contract';
import { processGroupIdContract } from '../process-group-id/process-group-id-contract';
import type { ServerLogByteCount } from '../server-log-byte-count/server-log-byte-count-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const laneSessionContract = z
  .object({
    specName: specNameContract,
    ports: portPairContract,
    homePath: absoluteFilePathContract,
    evidencePath: absoluteFilePathContract,
    baseUrl: contentTextContract,
    apiBaseUrl: contentTextContract,
    pgids: z.array(processGroupIdContract).readonly(),
    // `z.custom`, not a nested schema: the value is a live session closed over a browser, and the
    // check passes the same reference through so its functions survive the parse.
    browser: z.custom<BrowserSession | null>(
      (value: unknown) => value === null || typeof value === 'object',
    ),
    logFds: z.array(fileDescriptorContract).readonly(),
  })
  .brand<'LaneSession'>();

export type LaneSession = z.infer<typeof laneSessionContract> & {
  readServerLogSince: ({ fromByte }: { fromByte: number }) => readonly ContentText[];
  serverLogLength: () => ServerLogByteCount;
};
