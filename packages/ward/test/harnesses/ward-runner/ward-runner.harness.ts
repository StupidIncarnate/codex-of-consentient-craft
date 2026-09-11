/**
 * PURPOSE: Resolves the built ward bin for the "the build produced a runnable binary" assertion in
 * start-ward.integration.test.ts. Deliberately grades `dist/`, unlike every check ward itself runs.
 *
 * A memory-ceiling probe used to live here: it spawned a real full-repo `--only lint` sweep, walked
 * the descendant pid tree and asserted the max single-process RSS. It is gone, and what replaced it
 * is not another test. A ceiling measured on ONE machine says nothing about the 8GB laptop where
 * running out of memory actually matters, and the probe cost about 130s on every integration run to
 * say it. Ward now reads the exit code and signal of each check it already spawns and reports the
 * death itself — `isOutOfMemoryFailureGuard` and `outOfMemoryReportTransformer`, printed under an
 * `out of memory` heading — so the report happens on the machine that ran out, and costs nothing on
 * a healthy run.
 *
 * USAGE:
 * const harness = wardRunnerHarness();
 * expect(harness.wardBinExists()).toBe(true);
 */
import { existsSync } from 'fs';
import * as path from 'path';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

const REPO_ROOT = FilePathStub({
  value: path.resolve(__dirname, '../../../../..'),
});
const WARD_BIN = FilePathStub({
  value: path.resolve(String(REPO_ROOT), 'packages/ward/dist/src/startup/start-ward.js'),
});

export const wardRunnerHarness = (): {
  wardBinExists: () => boolean;
  repoRoot: FilePath;
  wardBin: FilePath;
} => ({
  wardBinExists: (): boolean => existsSync(String(WARD_BIN)),
  repoRoot: REPO_ROOT,
  wardBin: WARD_BIN,
});
