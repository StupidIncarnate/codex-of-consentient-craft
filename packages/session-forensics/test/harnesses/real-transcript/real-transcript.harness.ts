/**
 * PURPOSE: `transcriptResolveBroker` always resolves against the REAL `os.homedir()` — deliberately,
 * so a forensic read never depends on `DUNGEONMASTER_HOME` — and Node's own `os.homedir()` cannot be
 * redirected from inside a running jest process (`process.env.HOME` never reaches the environ libuv
 * already read; see `packages/testing/src/jest.setup-home.js`'s header for the measurement). A flow
 * integration test therefore cannot mock its way to a populated transcript the way a broker's own
 * unit test does — it has to write one under the real `~/.claude/projects/`, in a uniquely-named
 * project directory nothing else will ever read, and delete that directory again once the test has
 * read what it wrote. This harness is the one place that does it.
 *
 * USAGE:
 * const harness = realTranscriptHarness(); // created at describe scope
 * await harness.writeSession({
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   content: ContentTextStub({ value: '{"type":"assistant"}' }),
 * });
 * // ...run the flow, capture its result...
 * // afterEach removes every project directory this harness instance created — the ts-jest AST
 * // transformer wires it automatically because it is a named property on the returned object, so
 * // no test calls it directly
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type {
  SessionIdStub,
  AgentIdStub,
  ContentTextStub,
  AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

type SessionId = ReturnType<typeof SessionIdStub>;
type AgentId = ReturnType<typeof AgentIdStub>;
type ContentText = ReturnType<typeof ContentTextStub>;

const PROJECT_DIR_PREFIX = 'session-forensics-flow-integration-test-';
const SUBAGENTS_DIR_NAME = 'subagents';
const META_SUFFIX = '.meta.json';
const JSONL_SUFFIX = '.jsonl';

export const realTranscriptHarness = (): {
  writeSession: (params: {
    sessionId: SessionId;
    content: ContentText;
    subagentIds?: readonly AgentId[];
  }) => Promise<void>;
  afterEach: () => void;
} => {
  const projectDirs: AbsoluteFilePath[] = [];

  return {
    // Every write below is synchronous (mkdirSync/writeFileSync) — `async` here exists only to
    // satisfy `ban-sync-seeding-methods`'s Promise-returning rule for harness seeding methods, not
    // because anything inside awaits.
    writeSession: async ({
      sessionId,
      content,
      subagentIds = [],
    }: {
      sessionId: SessionId;
      content: ContentText;
      subagentIds?: readonly AgentId[];
    }): Promise<void> => {
      const projectDir = absoluteFilePathContract.parse(
        join(
          homedir(),
          '.claude',
          'projects',
          `${PROJECT_DIR_PREFIX}${String(process.pid)}-${String(Date.now())}-${Math.random().toString(36).slice(2)}`,
        ),
      );
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, `${sessionId}${JSONL_SUFFIX}`), content);

      if (subagentIds.length > 0) {
        const subagentsDir = join(projectDir, sessionId, SUBAGENTS_DIR_NAME);
        mkdirSync(subagentsDir, { recursive: true });
        for (const agentId of subagentIds) {
          writeFileSync(
            join(subagentsDir, `${agentId}${META_SUFFIX}`),
            JSON.stringify({
              agentType: 'general-purpose',
              description: 'real-transcript harness fixture',
              toolUseId: `toolu_${agentId}`,
              spawnDepth: 1,
            }),
          );
        }
      }

      projectDirs.push(projectDir);
      return Promise.resolve();
    },
    afterEach: (): void => {
      for (const projectDir of projectDirs) {
        rmSync(projectDir, { recursive: true, force: true });
      }
      projectDirs.length = 0;
    },
  };
};
