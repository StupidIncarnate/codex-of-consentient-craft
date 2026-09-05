import type { Dirent } from 'fs';
import {
  fsExistsSyncAdapterProxy,
  fsReaddirWithTypesAdapterProxy,
  fsReadFileSyncAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  ContentTextStub,
} from '@dungeonmaster/shared/contracts';
import type { AgentIdStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import type { SubagentMetaStub } from '../../../contracts/subagent-meta/subagent-meta.stub';

type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;
type ContentText = ReturnType<typeof ContentTextStub>;
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

const makeFileDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const subagentRosterLoadBrokerProxy = (): {
  setupRoster: (params: {
    sessionFilePath: AbsoluteFilePath;
    agents: readonly RosterFixtureAgent[];
  }) => void;
  setupNoSubagentsDir: (params: { sessionFilePath: AbsoluteFilePath }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const readFileProxy = fsReadFileSyncAdapterProxy();
  // The broker's own pathJoinAdapter calls run for real (the shared proxy's default is a
  // requireActual passthrough) — this child proxy exists only to satisfy
  // enforce-proxy-child-creation; every path this proxy cares about is staged directly through
  // the exists/readdir/readFile mocks below instead.
  pathJoinAdapterProxy();

  const subagentsDirFor = ({
    sessionFilePath,
  }: {
    sessionFilePath: AbsoluteFilePath;
  }): AbsoluteFilePath =>
    AbsoluteFilePathStub({
      value: `${sessionFilePath.slice(0, -JSONL_SUFFIX.length)}/${SUBAGENTS_DIR_NAME}`,
    });

  return {
    setupRoster: ({
      sessionFilePath,
      agents,
    }: {
      sessionFilePath: AbsoluteFilePath;
      agents: readonly RosterFixtureAgent[];
    }): void => {
      const subagentsDir = subagentsDirFor({ sessionFilePath });
      existsProxy.returns({ filePath: FilePathStub({ value: subagentsDir }), result: true });

      const direntNames = agents.map((agent) => {
        if (agent.kind === 'strayFile') {
          return agent.fileName;
        }

        const metaFileName = `${agent.agentId}${META_SUFFIX}`;
        const metaFilePath = AbsoluteFilePathStub({ value: `${subagentsDir}/${metaFileName}` });

        if (agent.kind === 'malformedMetaJson') {
          readFileProxy.returns({ filePath: metaFilePath, content: agent.rawMetaText });
          return metaFileName;
        }

        if (agent.kind === 'invalidMeta') {
          readFileProxy.returns({
            filePath: metaFilePath,
            content: ContentTextStub({ value: JSON.stringify(agent.rawMeta) }),
          });
          return metaFileName;
        }

        readFileProxy.returns({
          filePath: metaFilePath,
          content: ContentTextStub({ value: JSON.stringify(agent.meta) }),
        });

        if (agent.transcriptJsonl !== undefined) {
          const transcriptFilePath = AbsoluteFilePathStub({
            value: `${subagentsDir}/${agent.agentId}${JSONL_SUFFIX}`,
          });
          existsProxy.returns({
            filePath: FilePathStub({ value: transcriptFilePath }),
            result: true,
          });
          readFileProxy.returns({ filePath: transcriptFilePath, content: agent.transcriptJsonl });
        }

        return metaFileName;
      });

      readdirProxy.returns({
        dirPath: subagentsDir,
        entries: direntNames.map((name) => makeFileDirent({ name })),
      });
    },

    setupNoSubagentsDir: ({ sessionFilePath }: { sessionFilePath: AbsoluteFilePath }): void => {
      const subagentsDir = subagentsDirFor({ sessionFilePath });
      existsProxy.returns({ filePath: FilePathStub({ value: subagentsDir }), result: false });
    },
  };
};
