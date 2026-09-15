/**
 * PURPOSE: The operations a walk drives against a live page, described structurally so an adapter can
 * hand one back without this package ever importing Playwright — contracts/ may import only `statics`,
 * `errors`, `contracts` and `zod`, never an npm package, so the `Page`/`Browser` types
 * `adapters/playwright/session/` closes over never leave that folder. A Zod object schema cannot
 * express a function, so the data half stays an empty `z.object({})` and every operation is added
 * through a TypeScript intersection instead — the same shape `eslintContextContract`
 * (`packages/eslint-plugin/src/contracts/eslint-context/`) already uses for ESLint's own
 * `RuleContext`, and the sanctioned pattern here for a behavioural type rather than a payload one.
 * `LaneSession.browser` holds this type or `null`: a browserless spec boots no Chromium at all, so its
 * lane session carries no `BrowserSession` rather than one backed by nothing, and the browser-step
 * guard reads that `null` to reject a `look`/`click`/`hold` by naming the spec instead of returning an
 * empty reading (siegelense-tooling.md line 1623).
 *
 * USAGE:
 * const session: BrowserSession = await playwrightSessionAdapter({ baseUrl, evidencePath });
 * const count = await session.countMatches({ target: '[data-testid="PIXEL_BTN"]' });
 * // Every page read or write goes through here; nothing above adapters/playwright/session/ ever
 * // touches a Playwright Page
 */

import { z } from 'zod';

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { StepCandidate } from '../step-candidate/step-candidate-contract';

export const browserSessionContract = z.object({});

const _matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
export type MatchCount = z.infer<typeof _matchCountContract>;

const _bufferLineCountContract = z.number().int().nonnegative().brand<'BufferLineCount'>();
type BufferLineCount = z.infer<typeof _bufferLineCountContract>;

export interface BufferLengths {
  consoleLines: BufferLineCount;
  networkLines: BufferLineCount;
  websocketLines: BufferLineCount;
}

export type BrowserSession = z.infer<typeof browserSessionContract> & {
  goto: ({ url }: { url: string }) => Promise<void>;
  countMatches: ({ target, within }: { target: string; within?: string }) => Promise<MatchCount>;
  describeMatches: ({
    target,
    within,
  }: {
    target: string;
    within?: string;
  }) => Promise<readonly StepCandidate[]>;
  nearestNames: ({ target }: { target: string }) => Promise<readonly ContentText[]>;
  clickMatch: ({
    target,
    within,
    timeoutMs,
  }: {
    target: string;
    within?: string;
    timeoutMs: number;
  }) => Promise<void>;
  fillMatch: ({
    target,
    within,
    value,
    timeoutMs,
  }: {
    target: string;
    within?: string;
    value: string;
    timeoutMs: number;
  }) => Promise<void>;
  waitForMatch: ({
    target,
    within,
    state,
    timeoutMs,
  }: {
    target: string;
    within?: string;
    state: string;
    timeoutMs: number;
  }) => Promise<void>;
  capture: ({ filePath }: { filePath: string }) => Promise<void>;
  evaluateSource: ({ source }: { source: string }) => Promise<ContentText>;
  // Armed once at boot and never cleared (siegelense-tooling.md line 1635) — a run records where it
  // started via `bufferLengths()` and reads forward from there with `fromIndex`, so its own index
  // counts only ITS window rather than every run's running total.
  readConsoleSince: ({ fromIndex }: { fromIndex: number }) => readonly ContentText[];
  readNetworkSince: ({ fromIndex }: { fromIndex: number }) => readonly ContentText[];
  readWebsocketSince: ({ fromIndex }: { fromIndex: number }) => readonly ContentText[];
  bufferLengths: () => BufferLengths;
  close: () => Promise<void>;
};
