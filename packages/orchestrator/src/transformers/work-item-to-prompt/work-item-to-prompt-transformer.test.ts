import {
  BaseBranchNameStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestPackageEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WardResultStub,
  WardRunIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { mcpToolResultStatics, workItemRoleStatics } from '@dungeonmaster/shared/statics';

import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { agentNameToPromptTransformer } from '../agent-name-to-prompt/agent-name-to-prompt-transformer';
import { DevCommandStub } from '../../contracts/dev-command/dev-command.stub';
import { DevServerUrlStub } from '../../contracts/dev-server-url/dev-server-url.stub';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';
import { workItemToPromptTransformer } from './work-item-to-prompt-transformer';

// Each operation-owning role has its OWN prompt file, and the relay path resolves it through
// `roleToPromptTemplateTransformer`. There is no shared template and no placeholder left to
// substitute beyond `$ARGUMENTS`: what tells a codeweaver dispatch from a siegemaster one is the
// whole document, not one interpolated block. Each is read LIVE off its statics here — a copied
// excerpt would drift the moment a prompt is edited, and every assertion below compares the entire
// served string.
const CODEWEAVER_TEMPLATE = codeweaverPromptStatics.prompt.template;
const FLOWRIDER_TEMPLATE = flowriderPromptStatics.prompt.template;
const SIEGEMASTER_TEMPLATE = siegemasterPromptStatics.prompt.template;

// Fixture scale for the MCP tool-result budget below, calibrated against a real dogfood quest
// (e0210063): a 21-item ledger, seven flows, five affected packages, and a 1,530-character user
// request. NONE of that reaches the served block any more — which is exactly what these fixtures
// now prove. A budget measured against a quest carrying none of it would pass while a real quest
// overflowed, so the fixtures stay at relay scale.
const BUDGET_OPERATION_COUNT = 21;
const BUDGET_OPERATION_TEXT =
  'orchestrator: thread the operation ledger through the dispatch scan'.padEnd(
    280,
    ' and the rest',
  );
const BUDGET_FLOW_IDS = [
  'send-queued-comment-batch',
  'comment-on-diagram-box',
  'view-persisted-comments',
  'dispatch-resumes-retained-session',
  'quest-chat-reconnect',
  'execution-panel-floor-view',
  'queue-page-play-pause',
];
const BUDGET_PACKAGES_AFFECTED = ['orchestrator', 'server', 'web', 'mcp', 'shared'].map((name) =>
  QuestPackageEntryStub({ name, location: `./packages/${name}` }),
);
const BUDGET_USER_REQUEST =
  'Let a reviewer leave comments on a flow-diagram box and send them as one batch.'.padEnd(
    1530,
    ' Keep the queue visible while the batch is in flight.',
  );

// A pathological pt-chain ledger: 34 settled scopes (the authored relay plus every `pt N`
// continuation it accumulated), the 35th in flight — the dispatched agent's own — and five still
// pending behind it. Two or three retries on a real quest reach this shape. The ledger was the one
// term in the served block that grew without bound, which is why the block no longer carries it at
// all; this shape is what proves the growth is gone rather than merely bounded.
const PATHOLOGICAL_COMPLETE_COUNT = 34;
const PATHOLOGICAL_OWN_INDEX = 34;
const PATHOLOGICAL_PENDING_COUNT = 5;
const LEDGER_ITEM_TEXT = 'core: config load+validate adapter';

// Every minion an operator summons. They own no work item and are served by
// `agentPromptGetBroker`'s minion branch, which passes no workItemId at all; reaching THIS
// transformer means a caller echoed its parent's id, and the branch below still serves them their
// own prompt with the minimal substitution. Derived by subtracting the one minion outside that set
// rather than listed, so a fourth operator role's reviewer arrives here covered.
const OPERATOR_MINION_NAMES = agentPromptClassificationStatics.minionNames.filter(
  (minionName) => minionName !== 'chaoswhisperer-gap-minion',
);

describe('workItemToPromptTransformer', () => {
  describe('minion path (agent name is not a WorkItemRole)', () => {
    it('VALID: {agent: chaoswhisperer-gap-minion} => substitutes Quest ID + Work Item ID', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId });
      const quest = QuestStub({ id: questId, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' }),
      });

      const expectedArgs = `Quest ID: ${String(questId)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        chaoswhispererGapMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {agent: chaoswhisperer-gap-minion, workItem.role: siegemaster} => minimal substitution regardless of workItem.role', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'siegemaster' });
      const quest = QuestStub({ id: questId, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' }),
      });

      const expectedArgs = `Quest ID: ${String(questId)}\nWork Item ID: ${String(workItemId)}`;

      expect(result.prompt).toBe(
        chaoswhispererGapMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    // Every minion carries its OWN prompt — its parent's subject matter is baked into the file, so
    // there is no placeholder left for this transformer to be missing a value for. A caller that
    // echoes its parent's workItemId therefore gets the same minimal substitution
    // `chaoswhisperer-gap-minion` gets, into the minion's own prompt. Derived from `minionNames`, so
    // a prompt added there is asserted the day it is added.
    it.each(OPERATOR_MINION_NAMES)(
      'VALID: {agent: %s, workItemId echoed} => substitutes Quest ID + Work Item ID into that minion’s own prompt',
      (minionName) => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-7777-4222-9333-444444444444' });
        const workItem = WorkItemStub({ id: workItemId, role: 'siegemaster' });
        const quest = QuestStub({ id: questId, workItems: [workItem] });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: minionName }),
        });

        const expectedArgs = `Quest ID: ${String(questId)}\nWork Item ID: ${String(workItemId)}`;

        expect(result.prompt).toBe(
          agentNameToPromptTransformer({
            agent: AgentPromptNameStub({ value: minionName }),
          }).prompt.replace('$ARGUMENTS', expectedArgs),
        );
      },
    );
  });

  describe('command roles (run by the dispatcher, never served by get-agent-prompt)', () => {
    // Derived from the command tuple rather than listing roles here: a hardcoded case list is what
    // let a new command role reach agentNameToPromptTransformer and die on an agent name that was
    // never meant to exist.
    it.each(workItemRoleStatics.command)(
      'ERROR: {workItem.role: %s} => throws naming that role as command-dispatched',
      (role) => {
        const workItem = WorkItemStub({ role });
        const quest = QuestStub({ workItems: [workItem] });

        expect(() =>
          workItemToPromptTransformer({
            quest,
            workItem,
            agentName: AgentPromptNameStub({ value: 'codeweaver' }),
          }),
        ).toThrow(
          new RegExp(
            `${role} work items are dispatched as commands by the orchestrator, not via get-agent-prompt`,
            'u',
          ),
        );
      },
    );
  });

  describe('chat roles (chaoswhisperer/glyphsmith are not served by get-agent-prompt)', () => {
    it('ERROR: {workItem.role: chaoswhisperer} => throws not-served-by-get-agent-prompt error', () => {
      const workItem = WorkItemStub({ role: 'chaoswhisperer' });
      const quest = QuestStub({ workItems: [workItem] });

      expect(() =>
        workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        }),
      ).toThrow(/role chaoswhisperer is not served by get-agent-prompt/u);
    });

    it('ERROR: {workItem.role: glyphsmith} => throws not-served-by-get-agent-prompt error', () => {
      const workItem = WorkItemStub({ role: 'glyphsmith' });
      const quest = QuestStub({ workItems: [workItem] });

      expect(() =>
        workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        }),
      ).toThrow(/role glyphsmith is not served by get-agent-prompt/u);
    });
  });

  describe('operation-context substitution (relay path)', () => {
    it('VALID: {role: codeweaver, one linked operation} => substitutes exact operation-relay $ARGUMENTS', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-2222-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-2222-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'codeweaver',
        text: 'core: config load+validate adapter',
        status: 'pending',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'codeweaver' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [codeweaver] core: config load+validate adapter',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.replace('$ARGUMENTS', expectedArgs));
    });

    it('VALID: {operation text containing $` and $& sequences} => substitutes them verbatim instead of expanding them against the match', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-9999-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-9999-4222-9333-444444444444' });
      // A `$` sequence is ordinary prose in an operation scope (shell vars, quoting rules). Under a
      // string replacement `` $` `` expands to everything before the match — splicing the entire
      // preceding prompt in — and `$&` expands to the matched `$ARGUMENTS` token itself.
      const dollarText = "cli: handle $`backtick`, $& and $' quoting in the arg parser";
      const operation = OperationItemStub({
        id: operationId,
        role: 'codeweaver',
        text: dollarText,
        status: 'pending',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'codeweaver' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        `Your operation item: [codeweaver] ${dollarText}`,
      ].join('\n');

      // split/join, never String.replace(string, string) — building the expectation with the very
      // bug under test would corrupt it identically and pass vacuously.
      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
    });

    // WHAT THE BLOCK WITHHOLDS, and why each line is a test rather than a comment. Every field
    // below reached the served prompt once, and every one of them is fetchable — the flow through
    // `get-quest({ questId, flowId })`, the contracts through the `packageName` call beside it, the
    // units through `get-qa-checklist`. What is NOT fetchable stays, and has its own tests further
    // down: the dev server, the base branch, and the failed ward blob.
    //
    // Each case pins the WHOLE substitution rather than asserting an absence, because an assertion
    // that some string is missing passes just as well when the render broke entirely.
    describe('quest content the block withholds', () => {
      it('VALID: {operation carrying two flowIds} => renders the four id lines and no flows block', () => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-8888-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({ value: 'bbbbbbbb-8888-4222-9333-444444444444' });
        const operation = OperationItemStub({
          id: operationId,
          role: 'codeweaver',
          text: 'web: the queue bar and send',
          status: 'pending',
          flowIds: ['send-queued-comment-batch', 'view-persisted-comments'],
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: 'codeweaver',
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(operationId)}`,
          'Your operation item: [codeweaver] web: the queue bar and send',
        ].join('\n');

        expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
      });

      it('VALID: {operation carrying packageNames} => renders the four id lines and no packages block', () => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-8882-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({ value: 'bbbbbbbb-8882-4222-9333-444444444444' });
        const operation = OperationItemStub({
          id: operationId,
          role: 'codeweaver',
          text: 'shared: the comment data model',
          status: 'pending',
          packageNames: ['shared', 'server'],
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: 'codeweaver',
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(operationId)}`,
          'Your operation item: [codeweaver] shared: the comment data model',
        ].join('\n');

        expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
      });

      it('VALID: {quest carrying packagesAffected entries} => renders the four id lines and no packages-affected line', () => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-8885-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({ value: 'bbbbbbbb-8885-4222-9333-444444444444' });
        const operation = OperationItemStub({
          id: operationId,
          role: 'codeweaver',
          text: 'shared: the comment data model',
          status: 'pending',
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: 'codeweaver',
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({
          id: questId,
          operations: [operation],
          workItems: [workItem],
          packagesAffected: [
            QuestPackageEntryStub({
              name: 'web',
              location: './packages/web',
              changeType: 'edit',
              packageType: 'frontend-react',
            }),
            QuestPackageEntryStub({
              name: 'queue-runner',
              location: './packages/queue-runner',
              changeType: 'new',
              packageType: 'programmatic-service',
              usedBy: ['orchestrator'],
            }),
          ],
        });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(operationId)}`,
          'Your operation item: [codeweaver] shared: the comment data model',
        ].join('\n');

        expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
      });

      // The ledger was the one term that grew without bound — every `partial` outcome appends a
      // `pt N` continuation — and a block that outgrew `mcpToolResultStatics.maxVerbatimChars` was
      // spilled to a file, leaving the session holding a path instead of its gates and numbered
      // rules. A 40-item ledger substituting BYTE-IDENTICALLY to a 1-item one is what proves the
      // growth is gone rather than merely bounded.
      it('VALID: {40-item pt-chain ledger} => substitutes byte-identically to a single-item ledger', () => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-6161-4222-9333-444444444444' });
        const ownOperationId = OperationItemIdStub({
          value: `bbbbbbbb-6161-4222-9333-4444444444${String(PATHOLOGICAL_OWN_INDEX).padStart(2, '0')}`,
        });
        const ownOperation = OperationItemStub({
          id: ownOperationId,
          role: 'codeweaver',
          text: LEDGER_ITEM_TEXT,
          status: 'in_progress',
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: 'codeweaver',
          relatedDataItems: [
            RelatedDataItemStub({ value: `operations/${String(ownOperationId)}` }),
          ],
        });
        const longLedger = [
          ...Array.from({ length: PATHOLOGICAL_COMPLETE_COUNT }, (_unused, index) =>
            OperationItemStub({
              id: OperationItemIdStub({
                value: `bbbbbbbb-6161-4222-9333-4444444444${String(index).padStart(2, '0')}`,
              }),
              role: 'codeweaver',
              text: LEDGER_ITEM_TEXT,
              status: 'complete',
            }),
          ),
          ownOperation,
          ...Array.from({ length: PATHOLOGICAL_PENDING_COUNT }, (_unused, offset) =>
            OperationItemStub({
              id: OperationItemIdStub({
                value: `bbbbbbbb-6161-4222-9333-4444444444${String(PATHOLOGICAL_OWN_INDEX + 1 + offset).padStart(2, '0')}`,
              }),
              role: 'codeweaver',
              text: LEDGER_ITEM_TEXT,
              status: 'pending',
            }),
          ),
        ];

        const long = workItemToPromptTransformer({
          quest: QuestStub({ id: questId, operations: longLedger, workItems: [workItem] }),
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        });
        const short = workItemToPromptTransformer({
          quest: QuestStub({ id: questId, operations: [ownOperation], workItems: [workItem] }),
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(ownOperationId)}`,
          `Your operation item: [codeweaver] ${LEDGER_ITEM_TEXT}`,
        ].join('\n');

        expect({ long: String(long.prompt), short: String(short.prompt) }).toStrictEqual({
          long: CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs),
          short: CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs),
        });
      });
    });

    describe('base branch pass-through is warpgate-only', () => {
      // The warpgate prompt template promises "the baseBranch recorded ON THE QUEST in your
      // Operation Context below" (warpgate-prompt-statics.ts) — this is the half of that promise
      // that must actually render the value, or the agent has nothing to read without an extra
      // get-quest call the prompt never tells it to make.
      it('VALID: {role: warpgate, quest carries baseBranch} => appends a Base branch line naming it', () => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-3131-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({ value: 'bbbbbbbb-3131-4222-9333-444444444444' });
        const baseBranch = BaseBranchNameStub({ value: 'main' });
        const operation = OperationItemStub({
          id: operationId,
          role: 'warpgate',
          text: 'Warpgate: merge the quest branch home into the base branch',
          status: 'in_progress',
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: 'warpgate',
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({
          id: questId,
          operations: [operation],
          workItems: [workItem],
          baseBranch,
        });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'warpgate' }),
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(operationId)}`,
          'Your operation item: [warpgate] Warpgate: merge the quest branch home into the base branch',
          '',
          'Base branch: main',
        ].join('\n');

        expect(result.prompt).toBe(
          warpgatePromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
        );
      });

      it('EDGE: {role: warpgate, quest carries no baseBranch} => omits the Base branch line entirely rather than printing "undefined"', () => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'cccccccc-3131-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({ value: 'dddddddd-3131-4222-9333-444444444444' });
        const operation = OperationItemStub({
          id: operationId,
          role: 'warpgate',
          text: 'Warpgate: merge the quest branch home into the base branch',
          status: 'in_progress',
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: 'warpgate',
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'warpgate' }),
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(operationId)}`,
          'Your operation item: [warpgate] Warpgate: merge the quest branch home into the base branch',
        ].join('\n');

        expect(result.prompt).toBe(
          warpgatePromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
        );
      });

      // Every other relay role must NOT get the base-branch line — proves the block is gated on
      // the role, not simply on the presence of quest.baseBranch.
      it('EDGE: {role: codeweaver, quest carries baseBranch} => omits the Base branch line (warpgate-only, not universal)', () => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'eeeeeeee-3131-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({ value: 'ffffffff-3131-4222-9333-444444444444' });
        const baseBranch = BaseBranchNameStub({ value: 'main' });
        const operation = OperationItemStub({
          id: operationId,
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
          status: 'pending',
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: 'codeweaver',
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({
          id: questId,
          operations: [operation],
          workItems: [workItem],
          baseBranch,
        });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(operationId)}`,
          'Your operation item: [codeweaver] core: config load+validate adapter',
        ].join('\n');

        expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.replace('$ARGUMENTS', expectedArgs));
      });
    });

    describe('dev-server pass-through is siegemaster-only', () => {
      it('VALID: {role: siegemaster, devServer provided} => appends Dev Server Command + Dev Server URL lines', () => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'eeeeeeee-4444-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({
          value: 'ffffffff-4444-4222-9333-444444444444',
        });
        const operation = OperationItemStub({
          id: operationId,
          role: 'siegemaster',
          text: 'manual-QA every quest flow',
          status: 'in_progress',
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: 'siegemaster',
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({
          id: questId,
          operations: [operation],
          workItems: [workItem],
        });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'siegemaster' }),
          devServer: {
            devCommand: DevCommandStub({ value: 'npm run dev' }),
            devServerUrl: DevServerUrlStub({ value: 'http://localhost:3000' }),
          },
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(operationId)}`,
          'Your operation item: [siegemaster] manual-QA every quest flow',
          '',
          'Dev Server Command: npm run dev',
          'Dev Server URL: http://localhost:3000',
        ].join('\n');

        expect(result.prompt).toBe(SIEGEMASTER_TEMPLATE.replace('$ARGUMENTS', expectedArgs));
      });

      // Flowrider never starts a server — Playwright's own `webServer` config owns the one its e2e
      // run needs, and its tests navigate baseURL-relative. Even handed a resolved devServer, the
      // transformer must not append the lines: they would invite a minion to author a `webServer`
      // block into the shared Playwright config, which races when bundles run in parallel.
      it('EDGE: {role: flowrider, devServer provided} => still omits Dev Server Command/URL lines', () => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-5555-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({ value: 'bbbbbbbb-5555-4222-9333-444444444444' });
        const operation = OperationItemStub({
          id: operationId,
          role: 'flowrider',
          text: 'author the flow-perspective test suites',
          status: 'in_progress',
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role: 'flowrider',
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: 'flowrider' }),
          devServer: {
            devCommand: DevCommandStub({ value: 'npm run dev' }),
            devServerUrl: DevServerUrlStub({ value: 'http://localhost:3000' }),
          },
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(operationId)}`,
          'Your operation item: [flowrider] author the flow-perspective test suites',
        ].join('\n');

        expect(result.prompt).toBe(FLOWRIDER_TEMPLATE.replace('$ARGUMENTS', expectedArgs));
      });
    });

    it('VALID: {role: spiritmender, latest wardResult failed with runId} => appends Failed ward result + Ward detail blob lines', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-8888-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-8888-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'spiritmender',
        text: 'fix ward failures',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const wardResult = WardResultStub({
        id: 'cccccccc-8888-4222-9333-444444444444',
        exitCode: 1,
        wardMode: 'changed',
        runId: WardRunIdStub({ value: 'run-123' }),
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'spiritmender' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [spiritmender] fix ward failures',
        '',
        'Failed ward result: cccccccc-8888-4222-9333-444444444444 (mode: changed, runId: run-123)',
        'Ward detail blob: <questFolder>/ward-results/cccccccc-8888-4222-9333-444444444444.json',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('VALID: {role: spiritmender, multiple wardResults, latest failed has no runId} => uses the latest failed entry and omits the runId segment', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-9999-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-9999-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'spiritmender',
        text: 'fix ward failures',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const wardResultPassing = WardResultStub({
        id: 'dddddddd-9999-4222-9333-444444444444',
        exitCode: 0,
      });
      const wardResultFailedWithRunId = WardResultStub({
        id: 'eeeeeeee-9999-4222-9333-444444444444',
        exitCode: 1,
        wardMode: 'changed',
        runId: WardRunIdStub({ value: 'run-earlier' }),
      });
      const wardResultFailedNoRunId = WardResultStub({
        id: 'ffffffff-9999-4222-9333-444444444444',
        exitCode: 1,
        wardMode: 'full',
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
        wardResults: [wardResultPassing, wardResultFailedWithRunId, wardResultFailedNoRunId],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'spiritmender' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [spiritmender] fix ward failures',
        '',
        'Failed ward result: ffffffff-9999-4222-9333-444444444444 (mode: full)',
        'Ward detail blob: <questFolder>/ward-results/ffffffff-9999-4222-9333-444444444444.json',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('EDGE: {role: spiritmender, wardResults empty} => omits Failed ward result lines', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-1010-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-1010-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'spiritmender',
        text: 'fix ward failures',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
        wardResults: [],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'spiritmender' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [spiritmender] fix ward failures',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    it('EDGE: {role: spiritmender, all wardResults exitCode 0} => omits Failed ward result lines', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-1212-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-1212-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'spiritmender',
        text: 'fix ward failures',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const wardResultPassing = WardResultStub({
        id: 'cccccccc-1212-4222-9333-444444444444',
        exitCode: 0,
      });
      const quest = QuestStub({
        id: questId,
        operations: [operation],
        workItems: [workItem],
        wardResults: [wardResultPassing],
      });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'spiritmender' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [spiritmender] fix ward failures',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    describe('missing operations reference', () => {
      it('EDGE: {role: codeweaver, empty relatedDataItems} => throws no-resolvable-operations-ref error', () => {
        const workItem = WorkItemStub({ role: 'codeweaver', relatedDataItems: [] });
        const quest = QuestStub({ workItems: [workItem] });

        expect(() =>
          workItemToPromptTransformer({
            quest,
            workItem,
            agentName: AgentPromptNameStub({ value: 'codeweaver' }),
          }),
        ).toThrow(/has no resolvable operations\/<id> reference/u);
      });

      it('ERROR: {role: codeweaver, relatedDataItems references an operation absent from quest.operations} => throws no-resolvable-operations-ref error', () => {
        const workItem = WorkItemStub({
          role: 'codeweaver',
          relatedDataItems: [
            RelatedDataItemStub({ value: 'operations/aaaaaaaa-1313-4222-9333-444444444444' }),
          ],
        });
        const quest = QuestStub({ operations: [], workItems: [workItem] });

        expect(() =>
          workItemToPromptTransformer({
            quest,
            workItem,
            agentName: AgentPromptNameStub({ value: 'codeweaver' }),
          }),
        ).toThrow(/has no resolvable operations\/<id> reference/u);
      });
    });
  });

  describe('errors', () => {
    it('ERROR: {agent: unknown name} => throws ZodError', () => {
      const workItem = WorkItemStub();
      const quest = QuestStub({ workItems: [workItem] });

      expect(() =>
        workItemToPromptTransformer({
          quest,
          workItem,
          agentName: 'unknown-agent',
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });

  // The tool table near the top of every operator prompt is EXHAUSTIVE, and the whole design rests
  // on it: a session that searches source runs out of room mid-loop and starts hand-coding the
  // remainder. Measuring a prompt ALONE cannot catch a breach, because the `$ARGUMENTS` block this
  // transformer builds is spliced in below it — and that block is the part an agent acts on first.
  //
  describe('MCP tool-result budget', () => {
    it.each(agentPromptClassificationStatics.roleNames)(
      'VALID: {agent: %s, relay-scale quest} => served MCP block stays within the verbatim budget',
      (agentName) => {
        const operations = Array.from({ length: BUDGET_OPERATION_COUNT }, (_unused, index) =>
          OperationItemStub({
            id: OperationItemIdStub({
              value: `aaaaaaaa-2222-4222-9333-4444444444${String(index).padStart(2, '0')}`,
            }),
            role: agentName,
            text: BUDGET_OPERATION_TEXT,
            status: 'pending',
            flowIds: BUDGET_FLOW_IDS,
          }),
        );
        const workItem = WorkItemStub({
          id: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4222-9333-444444444444' }),
          role: agentName,
          relatedDataItems: [
            RelatedDataItemStub({ value: `operations/${String(operations[0]?.id)}` }),
          ],
        });
        const quest = QuestStub({
          operations,
          workItems: [workItem],
          packagesAffected: BUDGET_PACKAGES_AFFECTED,
          userRequest: BUDGET_USER_REQUEST,
          wardResults: [
            WardResultStub({
              runId: WardRunIdStub({ value: '1785341050718-63d2' }),
              exitCode: 1,
              wardMode: 'changed',
            }),
          ],
        });

        const { model, name } = agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: agentName }),
        });
        const { prompt } = workItemToPromptTransformer({
          quest,
          workItem,
          agentName,
          devServer: {
            devCommand: DevCommandStub({ value: 'npm run dev' }),
            devServerUrl: DevServerUrlStub({ value: 'http://localhost:3737' }),
          },
        });

        const servedBlock = JSON.stringify(
          { name, model, prompt },
          null,
          mcpToolResultStatics.jsonIndentSpaces,
        );

        expect(servedBlock.length).toBeLessThanOrEqual(mcpToolResultStatics.maxVerbatimChars);
      },
    );

    // The ledger is the one term in the served block that grows without bound: a quest that takes
    // two or three retries accumulates `pt N` continuations until the block overflows and the MCP
    // layer spills it to a file, leaving the agent holding a path instead of its gates and rules.
    it.each(agentPromptClassificationStatics.roleNames)(
      'VALID: {agent: %s, relay-scale quest with a 40-item pt-chain ledger} => served MCP block stays within the verbatim budget',
      (agentName) => {
        const ownOperationId = OperationItemIdStub({
          value: `cccccccc-3333-4222-9333-4444444444${String(PATHOLOGICAL_OWN_INDEX).padStart(2, '0')}`,
        });
        const operations = [
          ...Array.from({ length: PATHOLOGICAL_COMPLETE_COUNT }, (_unused, index) =>
            OperationItemStub({
              id: OperationItemIdStub({
                value: `cccccccc-3333-4222-9333-4444444444${String(index).padStart(2, '0')}`,
              }),
              role: agentName,
              text: BUDGET_OPERATION_TEXT,
              status: 'complete',
              flowIds: BUDGET_FLOW_IDS,
            }),
          ),
          OperationItemStub({
            id: ownOperationId,
            role: agentName,
            text: BUDGET_OPERATION_TEXT,
            status: 'in_progress',
            flowIds: BUDGET_FLOW_IDS,
          }),
          ...Array.from({ length: PATHOLOGICAL_PENDING_COUNT }, (_unused, offset) =>
            OperationItemStub({
              id: OperationItemIdStub({
                value: `cccccccc-3333-4222-9333-4444444444${String(PATHOLOGICAL_OWN_INDEX + 1 + offset).padStart(2, '0')}`,
              }),
              role: agentName,
              text: BUDGET_OPERATION_TEXT,
              status: 'pending',
              flowIds: BUDGET_FLOW_IDS,
            }),
          ),
        ];
        const workItem = WorkItemStub({
          id: QuestWorkItemIdStub({ value: 'dddddddd-3333-4222-9333-444444444444' }),
          role: agentName,
          relatedDataItems: [
            RelatedDataItemStub({ value: `operations/${String(ownOperationId)}` }),
          ],
        });
        const quest = QuestStub({
          operations,
          workItems: [workItem],
          packagesAffected: BUDGET_PACKAGES_AFFECTED,
          userRequest: BUDGET_USER_REQUEST,
          wardResults: [
            WardResultStub({
              runId: WardRunIdStub({ value: '1785341050718-63d2' }),
              exitCode: 1,
              wardMode: 'changed',
            }),
          ],
        });

        const { model, name } = agentNameToPromptTransformer({
          agent: AgentPromptNameStub({ value: agentName }),
        });
        const { prompt } = workItemToPromptTransformer({
          quest,
          workItem,
          agentName,
          devServer: {
            devCommand: DevCommandStub({ value: 'npm run dev' }),
            devServerUrl: DevServerUrlStub({ value: 'http://localhost:3737' }),
          },
        });

        const servedBlock = JSON.stringify(
          { name, model, prompt },
          null,
          mcpToolResultStatics.jsonIndentSpaces,
        );

        expect(servedBlock.length).toBeLessThanOrEqual(mcpToolResultStatics.maxVerbatimChars);
      },
    );

    // The generic minions never reach this transformer — their budget is measured against the
    // minion-fetch shape in agent-name-to-prompt-transformer.test.ts.
    it('VALID: {agent: chaoswhisperer-gap-minion, no work item of its own} => served MCP block stays within the verbatim budget', () => {
      const agentName = 'chaoswhisperer-gap-minion';
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'cccccccc-2222-4222-9333-444444444444' }),
        role: 'codeweaver',
      });
      const quest = QuestStub({ workItems: [workItem] });

      const { model, name } = agentNameToPromptTransformer({
        agent: AgentPromptNameStub({ value: agentName }),
      });
      const { prompt } = workItemToPromptTransformer({ quest, workItem, agentName });

      const servedBlock = JSON.stringify(
        { name, model, prompt },
        null,
        mcpToolResultStatics.jsonIndentSpaces,
      );

      expect(servedBlock.length).toBeLessThanOrEqual(mcpToolResultStatics.maxVerbatimChars);
    });
  });
});
