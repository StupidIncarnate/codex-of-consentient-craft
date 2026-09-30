import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { AgentIdStub } from '@dungeonmaster/shared/contracts/agent-id/agent-id.stub';
import type { PathSegmentStub } from '@dungeonmaster/shared/contracts/path-segment/path-segment.stub';
import type { SubagentMetaStub } from '../../../contracts/subagent-meta/subagent-meta.stub';

type AbsoluteFilePath = string;
type FilePath = string;
type ContentText = string;
type AgentId = ReturnType<typeof AgentIdStub>;
type PathSegment = ReturnType<typeof PathSegmentStub>;
type SubagentMeta = ReturnType<typeof SubagentMetaStub>;

// One entry to place under a session's subagents dir. `kind: 'valid'` covers a well-formed
// `.meta.json` (with or without a matching transcript); the other kinds model the ways a real
// directory can hold a file the broker must not treat as a usable sub-agent row.
type RosterFixtureAgent =
  | { kind: 'valid'; agentId: AgentId; meta: SubagentMeta; transcriptJsonl?: ContentText }
  | { kind: 'malformedMetaJson'; agentId: AgentId; rawMetaText: ContentText }
  | { kind: 'invalidMeta'; agentId: AgentId; rawMeta: unknown }
  | { kind: 'strayFile'; fileName: PathSegment };

const SUBAGENTS_DIR_NAME = 'subagents';
const JSONL_SUFFIX = '.jsonl';
const META_SUFFIX = '.meta.json';

export const subagentRosterLoadBrokerProxy = (): {
  setupRoster: (params: {
    sessionFilePath: AbsoluteFilePath;
    agents: readonly RosterFixtureAgent[];
  }) => void;
  setupNoSubagentsDir: (params: { sessionFilePath: AbsoluteFilePath }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readdirProxy = readdirEntriesSyncProxy();
  const readFileProxy = readFileSyncProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. The broker's own join() calls run for real off the caller's
  // sessionFilePath and agent ids, so the real join runs for real rather than being staged.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  const subagentsDirFor = ({ sessionFilePath }: { sessionFilePath: AbsoluteFilePath }): FilePath =>
    `${sessionFilePath.slice(0, -JSONL_SUFFIX.length)}/${SUBAGENTS_DIR_NAME}`;

  return {
    setupRoster: ({
      sessionFilePath,
      agents,
    }: {
      sessionFilePath: AbsoluteFilePath;
      agents: readonly RosterFixtureAgent[];
    }): void => {
      const subagentsDir = subagentsDirFor({ sessionFilePath });
      existsProxy.returns({ path: subagentsDir, exists: true });

      const entries = agents.map((agent) => {
        if (agent.kind === 'strayFile') {
          return { name: agent.fileName, kind: 'file' as const };
        }

        const metaFileName = `${agent.agentId}${META_SUFFIX}`;
        const metaFilePath = `${subagentsDir}/${metaFileName}`;

        if (agent.kind === 'malformedMetaJson') {
          readFileProxy.returns({ path: metaFilePath, contents: agent.rawMetaText });
          return { name: metaFileName, kind: 'file' as const };
        }

        if (agent.kind === 'invalidMeta') {
          readFileProxy.returns({
            path: metaFilePath,
            contents: JSON.stringify(agent.rawMeta),
          });
          return { name: metaFileName, kind: 'file' as const };
        }

        readFileProxy.returns({
          path: metaFilePath,
          contents: JSON.stringify(agent.meta),
        });

        // Every valid agent's transcript check is staged exactly, true or false — a valid agent
        // with no transcriptJsonl models "meta exists, transcript file does not", never a path the
        // broker asks about with no answer staged.
        const transcriptFilePath = `${subagentsDir}/${agent.agentId}${JSONL_SUFFIX}`;
        existsProxy.returns({
          path: transcriptFilePath,
          exists: agent.transcriptJsonl !== undefined,
        });
        if (agent.transcriptJsonl !== undefined) {
          readFileProxy.returns({ path: transcriptFilePath, contents: agent.transcriptJsonl });
        }

        return { name: metaFileName, kind: 'file' as const };
      });

      readdirProxy.returns({ path: subagentsDir, entries });
    },

    setupNoSubagentsDir: ({ sessionFilePath }: { sessionFilePath: AbsoluteFilePath }): void => {
      const subagentsDir = subagentsDirFor({ sessionFilePath });
      existsProxy.returns({ path: subagentsDir, exists: false });
    },
  };
};
