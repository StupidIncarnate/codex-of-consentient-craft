/**
 * PURPOSE: Prepares a throwaway home directory shaped like this repo's own file-backed hydration
 * target, and reads back what a plan wrote to it. Reach for this in any integration test that hands
 * a plan to a file-backed `run(plan, target)` — once the runner exists — instead of navigating
 * `installTestbedCreateBroker`'s temp dir by hand: every method here answers a question about what
 * landed on disk rather than handing back a path a test would have to read itself.
 *
 * USAGE:
 * const harness = fileTargetHarness();
 * // harness.beforeEach / harness.afterEach are auto-wired by the ts-jest harness transformer
 * const target = harness.target();                             // { home: AbsoluteFilePath }
 * harness.readJson({ relativePath: 'guilds/g1/quest.json' });   // what a plan wrote, or null
 */
import { chmodSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FileContentStub } from '@dungeonmaster/testing';
import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { HydrationTarget } from '../../../src/contracts/hydration-target/hydration-target-contract';

type FileContent = ReturnType<typeof FileContentStub>;

export type FileTarget = HydrationTarget & { home: AbsoluteFilePath };

interface FileTargetHarness {
  beforeEach: () => void;
  afterEach: () => void;
  target: () => FileTarget;
  absolutePath: ({ relativePath }: { relativePath: string }) => AbsoluteFilePath;
  read: ({ relativePath }: { relativePath: string }) => FileContent | null;
  readJson: ({ relativePath }: { relativePath: string }) => unknown;
  denyWrites: ({ relativePath }: { relativePath: string }) => void;
}

export const fileTargetHarness = (): FileTargetHarness => {
  let testbed: ReturnType<typeof installTestbedCreateBroker> | null = null;
  const deniedPaths: AbsoluteFilePath[] = [];

  return {
    beforeEach: (): void => {
      testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'hydration-runner' }),
      });
      deniedPaths.length = 0;
    },

    afterEach: (): void => {
      if (testbed === null) {
        throw new Error('fileTargetHarness.afterEach: called before beforeEach ran');
      }
      const activeTestbed = testbed;
      // A permission restore that throws must not skip cleanup — the whole point of a throwaway
      // home is that the caller can always throw it away. `finally` guarantees cleanup runs even
      // when a `chmodSync` in the loop fails, and lets that failure keep propagating rather than
      // swallowing it.
      try {
        for (const deniedPath of deniedPaths) {
          chmodSync(deniedPath, 0o700);
        }
      } finally {
        deniedPaths.length = 0;
        activeTestbed.cleanup();
      }
    },

    target: (): FileTarget => {
      if (testbed === null) {
        throw new Error('fileTargetHarness.target: called before beforeEach ran');
      }
      return { home: AbsoluteFilePathStub({ value: testbed.guildPath }) };
    },

    absolutePath: ({ relativePath }: { relativePath: string }): AbsoluteFilePath => {
      if (testbed === null) {
        throw new Error('fileTargetHarness.absolutePath: called before beforeEach ran');
      }
      return AbsoluteFilePathStub({ value: join(testbed.guildPath, relativePath) });
    },

    read: ({ relativePath }: { relativePath: string }): FileContent | null => {
      if (testbed === null) {
        throw new Error('fileTargetHarness.read: called before beforeEach ran');
      }
      return testbed.readFile({ relativePath: RelativePathStub({ value: relativePath }) });
    },

    readJson: ({ relativePath }: { relativePath: string }): unknown => {
      if (testbed === null) {
        throw new Error('fileTargetHarness.readJson: called before beforeEach ran');
      }
      const content = testbed.readFile({ relativePath: RelativePathStub({ value: relativePath }) });
      return content === null ? null : (JSON.parse(content) as unknown);
    },

    denyWrites: ({ relativePath }: { relativePath: string }): void => {
      if (testbed === null) {
        throw new Error('fileTargetHarness.denyWrites: called before beforeEach ran');
      }
      const deniedDir = join(testbed.guildPath, relativePath);
      mkdirSync(deniedDir, { recursive: true });
      chmodSync(deniedDir, 0o500);
      deniedPaths.push(AbsoluteFilePathStub({ value: deniedDir }));

      const probePath = join(deniedDir, '.file-target-harness-probe');
      let deniedTookEffect = false;
      try {
        writeFileSync(probePath, '');
      } catch {
        deniedTookEffect = true;
      }
      if (!deniedTookEffect) {
        unlinkSync(probePath);
        chmodSync(deniedDir, 0o700);
        throw new Error(
          `fileTargetHarness.denyWrites: chmod 0o500 did not deny writes to "${deniedDir}" (running as root?)`,
        );
      }
    },
  };
};
