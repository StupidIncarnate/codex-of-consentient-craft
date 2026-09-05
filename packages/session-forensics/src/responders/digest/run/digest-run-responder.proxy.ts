import { AbsoluteFilePathStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import type {
  SessionIdStub,
  AgentIdStub,
  QuestIdStub,
  ContentTextStub,
} from '@dungeonmaster/shared/contracts';
import { transcriptLoadBrokerProxy } from '../../../brokers/transcript/load/transcript-load-broker.proxy';
import { transcriptResolveBrokerProxy } from '../../../brokers/transcript/resolve/transcript-resolve-broker.proxy';
import { subagentRosterLoadBrokerProxy } from '../../../brokers/subagent/roster-load/subagent-roster-load-broker.proxy';
import { questLoadBrokerProxy } from '../../../brokers/quest/load/quest-load-broker.proxy';
import { SubagentMetaStub } from '../../../contracts/subagent-meta/subagent-meta.stub';

type SessionId = ReturnType<typeof SessionIdStub>;
type AgentId = ReturnType<typeof AgentIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type ContentText = ReturnType<typeof ContentTextStub>;

// Mirrors the private constants transcript-resolve-broker.proxy.ts / transcript-load-broker.proxy.ts
// stage their search around — DigestRunResponder calls transcriptResolveBroker a SECOND time,
// independent of transcriptLoadBroker's own internal call, to locate the sub-agent roster
// directory, so this proxy has to predict the exact absolute session file path the real brokers
// hand back in order to address the roster mock at the right path.
const PROJECT_DIR = PathSegmentStub({ value: 'test-project' });
const HOME_DIR = AbsoluteFilePathStub({ value: '/home/user' });
const PROJECTS_ROOT = `${HOME_DIR}/.claude/projects`;

export const DigestRunResponderProxy = (): {
  setupSession: (params: { target: SessionId; contents: ContentText }) => void;
  setupSessionWithSubagents: (params: {
    target: SessionId;
    contents: ContentText;
    agents: readonly { agentId: AgentId; transcriptContents?: ContentText }[];
  }) => void;
  setupNoTranscript: () => void;
  setupQuest: (params: { questId: QuestId; questJson: unknown }) => void;
  setupMissingQuest: () => void;
} => {
  const loadProxy = transcriptLoadBrokerProxy();
  // Not driven directly — DigestRunResponder's own second transcriptResolveBroker call runs
  // against the SAME underlying fs mocks transcriptLoadBrokerProxy already stages above (mocks
  // are shared by function identity, not by proxy instance). Instantiated only to satisfy
  // enforce-proxy-child-creation for the broker digest-run-responder.ts imports directly.
  transcriptResolveBrokerProxy();
  const rosterProxy = subagentRosterLoadBrokerProxy();
  const questProxy = questLoadBrokerProxy();

  const sessionFilePathFor = ({
    target,
  }: {
    target: SessionId;
  }): ReturnType<typeof AbsoluteFilePathStub> =>
    AbsoluteFilePathStub({ value: `${PROJECTS_ROOT}/${PROJECT_DIR}/${target}.jsonl` });

  return {
    setupSession: ({ target, contents }: { target: SessionId; contents: ContentText }): void => {
      loadProxy.setupTranscript({ target, projectDir: PROJECT_DIR, contents });
      rosterProxy.setupRoster({ sessionFilePath: sessionFilePathFor({ target }), agents: [] });
    },
    setupSessionWithSubagents: ({
      target,
      contents,
      agents,
    }: {
      target: SessionId;
      contents: ContentText;
      agents: readonly { agentId: AgentId; transcriptContents?: ContentText }[];
    }): void => {
      loadProxy.setupTranscript({ target, projectDir: PROJECT_DIR, contents });
      rosterProxy.setupRoster({
        sessionFilePath: sessionFilePathFor({ target }),
        agents: agents.map((agent) =>
          agent.transcriptContents === undefined
            ? { kind: 'valid' as const, agentId: agent.agentId, meta: SubagentMetaStub() }
            : {
                kind: 'valid' as const,
                agentId: agent.agentId,
                meta: SubagentMetaStub(),
                transcriptJsonl: agent.transcriptContents,
              },
        ),
      });
    },
    setupNoTranscript: (): void => {
      loadProxy.setupMissing();
    },
    setupQuest: ({ questId, questJson }: { questId: QuestId; questJson: unknown }): void => {
      questProxy.setupQuest({ questId, questJson });
    },
    setupMissingQuest: (): void => {
      questProxy.setupMissingQuest();
    },
  };
};
