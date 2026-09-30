/**
 * PURPOSE: `transcriptResolveBroker` walks every project directory under the same Claude projects
 * root every production reader resolves — `locationsClaudeProjectsRootFindBroker()` — so a flow
 * integration test cannot mock its way to a populated transcript the way a broker's own unit test
 * does. It has to write one under that real resolved root, in a uniquely-named project directory
 * nothing else will ever read, and delete that directory again once the test has read what it
 * wrote. This harness is the one place that does it.
 *
 * USAGE:
 * const harness = claudeTranscriptHarness(); // created at describe scope
 * await harness.writeSession({
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   content: '{"type":"assistant"}',
 * });
 * // ...run the flow, capture its result...
 * // afterEach removes every project directory this harness instance created — the ts-jest AST
 * // transformer wires it automatically because it is a named property on the returned object, so
 * // no test calls it directly
 */
import { ensureDirSync, rmSync, writeFileSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { locationsClaudeProjectsRootFindBroker } from '@dungeonmaster/shared/brokers';
import type { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import type { AgentIdStub } from '@dungeonmaster/shared/contracts/agent-id/agent-id.stub';
import { pid } from '#gateway/node/process';

type SessionId = ReturnType<typeof SessionIdStub>;
type AgentId = ReturnType<typeof AgentIdStub>;
type ContentText = string;

const PROJECT_DIR_PREFIX = 'session-forensics-flow-integration-test-';
const SUBAGENTS_DIR_NAME = 'subagents';
const META_SUFFIX = '.meta.json';
const JSONL_SUFFIX = '.jsonl';

export const claudeTranscriptHarness = (): {
  writeSession: (params: {
    sessionId: SessionId;
    content: ContentText;
    subagentIds?: readonly AgentId[];
  }) => Promise<void>;
  afterEach: () => void;
} => {
  const projectDirs: string[] = [];

  return {
    // Every write below is synchronous (ensureDirSync/writeFileSync) — `async` here exists only to
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
      const projectDir = join(
        locationsClaudeProjectsRootFindBroker(),
        `${PROJECT_DIR_PREFIX}${String(pid)}-${String(Date.now())}-${Math.random().toString(36).slice(2)}`,
      );
      ensureDirSync(projectDir);
      writeFileSync(join(projectDir, `${sessionId}${JSONL_SUFFIX}`), content);

      if (subagentIds.length > 0) {
        const subagentsDir = join(projectDir, sessionId, SUBAGENTS_DIR_NAME);
        ensureDirSync(subagentsDir);
        for (const agentId of subagentIds) {
          writeFileSync(
            join(subagentsDir, `${agentId}${META_SUFFIX}`),
            JSON.stringify({
              agentType: 'general-purpose',
              description: 'claude-transcript harness fixture',
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
