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
import { operationsLedgerRenderStatics } from '../../statics/operations-ledger-render/operations-ledger-render-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
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
// (e0210063): a 21-item ledger rendering to 6,444 characters, seven flows, five affected packages,
// and a 1,530-character user request — 8,658 characters of $ARGUMENTS in total. A budget measured
// on a bare template would pass while the served prompt overflows, because the ledger is spliced in
// at dispatch time and grows with every `pt N` continuation the relay appends.
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
// pending behind it. Two or three retries on a real quest reach this shape, and at relay scale it
// overflows the MCP verbatim budget unless the render is bounded.
const PATHOLOGICAL_COMPLETE_COUNT = 34;
const PATHOLOGICAL_OWN_INDEX = 34;
const PATHOLOGICAL_PENDING_COUNT = 5;
const LEDGER_ITEM_TEXT = 'core: config load+validate adapter';
const ELISION_NOTICE_PLURAL =
  "... 24 earlier complete operation items elided to fit the prompt budget — call get-quest({ questId, stage: 'implementation' }) for the full ledger.";
const ELISION_NOTICE_SINGULAR =
  "... 1 earlier complete operation item elided to fit the prompt budget — call get-quest({ questId, stage: 'implementation' }) for the full ledger.";

// Every minion an operator summons. They own no work item and are served by
// `agentPromptGetBroker`'s minion branch, which passes no workItemId at all; reaching THIS
// transformer means a caller echoed its parent's id, and the branch below still serves them their
// own prompt with the minimal substitution. Derived by subtracting the one minion outside that set
// rather than listed, so a fourth operator role's reviewer arrives here covered.
const OPERATOR_MINION_NAMES = agentPromptClassificationStatics.minionNames.filter(
  (minionName) => minionName !== 'chaoswhisperer-gap-minion',
);

type SignoffTrackRole = keyof typeof signoffTrackEligibilityStatics.byTrack;

// Every role the eligibility statics defines a denominator for. Its item IS its scope — the
// completion gate measures that item against a computed set — so both scope blocks read it as
// accountability rather than as a reading order. Derived here, never listed: a track added to the
// statics and forgotten in a hand-written role list is told its one flow is "a starting point, NOT
// a boundary" while its gate measures it on exactly that flow.
const SIGNOFF_TRACK_ROLES = Object.keys(
  signoffTrackEligibilityStatics.byTrack,
) as SignoffTrackRole[];

// How an operator's `packageNames` narrow its denominator. Every track reads `intersection`: it has
// no seam item, so telling one to disown its glue units tells it to skip exactly what its gate then
// refuses it for. Derived rather than listed, so a track declaring a different rule fails this
// matrix instead of silently being served the wrong sentence.
// Read through a `Set<string>` rather than compared to the literal: every declared `packageScope`
// is `'intersection'` today, so a direct comparison is an always-true condition lint rejects — and
// hard-coding the role list instead is the staleness this derivation exists to prevent.
const INTERSECTION_PACKAGE_SCOPES = new Set(['intersection'].map(String));
const INTERSECTION_TRACK_ROLES = SIGNOFF_TRACK_ROLES.filter((role) =>
  INTERSECTION_PACKAGE_SCOPES.has(signoffTrackEligibilityStatics.byTrack[role].packageScope),
);

// The spec-pointer line each operator gets for an item declaring `web` and no flow. Codeweaver is
// the only role handed a `packageName`, and the only one whose contracts can live off its flows —
// so its call is the foundation view, while the other two are told there is no slice to take.
const INTERSECTION_POINTER_CALL_BY_ROLE = new Map([
  [
    'codeweaver',
    "  get-quest({ questId: 'my-quest', packageName: 'web' })   <- every contract your package owns, across every flow",
  ],
  [
    'flowrider',
    "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
  ],
  [
    'siegemaster',
    "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
  ],
]);

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
        '',
        'Operations ledger (in order):',
        '1. [ ] [codeweaver] core: config load+validate adapter  <-- YOUR OPERATION ITEM',
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
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
        '',
        'Operations ledger (in order):',
        `1. [ ] [codeweaver] ${dollarText}  <-- YOUR OPERATION ITEM`,
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      // split/join, never String.replace(string, string) — building the expectation with the very
      // bug under test would corrupt it identically and pass vacuously.
      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
    });

    it('VALID: {operation with flowIds} => renders the flows the item lands on, flagged as its unit of accountability', () => {
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
        '',
        'Operations ledger (in order):',
        '1. [ ] [codeweaver] web: the queue bar and send  <-- YOUR OPERATION ITEM',
        '',
        'Your flows: #send-queued-comment-batch, #view-persisted-comments',
        '(YOUR unit of accountability — every flow listed here, and no unit a sibling item owns. Not a starting point: work them, delegating where the work is wider than one session.)',
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', flowId: 'send-queued-comment-batch' })",
        "  get-quest({ questId: 'my-quest', flowId: 'view-persisted-comments' })",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
    });

    it('EDGE: {operation with empty flowIds} => omits the flows block entirely rather than printing an empty one', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-8881-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-8881-4222-9333-444444444444' });
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
      const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'codeweaver' }),
      });

      // No flows block between the ledger and the trailing user request.
      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [codeweaver] shared: the comment data model',
        '',
        'Operations ledger (in order):',
        '1. [ ] [codeweaver] shared: the comment data model  <-- YOUR OPERATION ITEM',
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
    });

    it('VALID: {codeweaver operation with packageNames} => renders the list as its coverage slice', () => {
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
        '',
        'Operations ledger (in order):',
        '1. [ ] [codeweaver] shared: the comment data model  <-- YOUR OPERATION ITEM',
        '',
        'Your packages: shared, server',
        '(YOUR coverage slice — you own every verification unit whose owning NODE tags ANY of these packages, a unit spanning two of them included: your track has no seam item, so a glue unit is yours and nobody else claims it. Read these packages first.)',
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', packageName: 'shared' })   <- every contract your package owns, across every flow",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
    });

    // A role with NO sign-off track gets the OTHER wording: a reading order rather than a coverage
    // slice, and one that names the search tools, because its own prompt tells it to search.
    // `spiritmender` and `warpgate` are the only roles that reach this branch —
    // `signoffTrackEligibilityStatics.byTrack`'s keys are exactly the operator roles.
    it('VALID: {spiritmender operation with packageNames} => renders the list as a reading order, flagged as not a boundary', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-8884-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-8884-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'spiritmender',
        text: 'fix ward failures',
        status: 'pending',
        packageNames: ['shared', 'server'],
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
        '',
        'Operations ledger (in order):',
        '1. [ ] [spiritmender] fix ward failures  <-- YOUR OPERATION ITEM',
        '',
        'Packages your operation item lands in: shared, server',
        '(Read these packages BEFORE you search — point get-project-map and discover at them instead of guessing. NOT a boundary: touch another package if the work needs it.)',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(
        spiritmenderPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      );
    });

    // A wording that told a session a unit spanning two of its packages is somebody else's would be
    // false and expensive: no track has a seam item, `qaUnitsInPackageScopeTransformer` keeps every
    // glue unit in the item's denominator, and the completion gate then refuses the item for
    // skipping exactly what this block told it to skip.
    it.each(INTERSECTION_TRACK_ROLES)(
      'VALID: {role: %s, operation with packageNames} => renders the list as an INTERSECTION slice, keeping the glue units rather than disowning them',
      (role) => {
        const questId = QuestIdStub({ value: 'my-quest' });
        const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-8886-4222-9333-444444444444' });
        const operationId = OperationItemIdStub({ value: 'bbbbbbbb-8886-4222-9333-444444444444' });
        const operation = OperationItemStub({
          id: operationId,
          role,
          text: 'walk the flow',
          status: 'pending',
          packageNames: ['web'],
        });
        const workItem = WorkItemStub({
          id: workItemId,
          role,
          relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
        });
        const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

        const result = workItemToPromptTransformer({
          quest,
          workItem,
          agentName: AgentPromptNameStub({ value: role }),
        });

        const expectedArgs = [
          `Quest ID: ${String(questId)}`,
          `Work Item ID: ${String(workItemId)}`,
          `Operation Item ID: ${String(operationId)}`,
          `Your operation item: [${role}] walk the flow`,
          '',
          'Operations ledger (in order):',
          `1. [ ] [${role}] walk the flow  <-- YOUR OPERATION ITEM`,
          '',
          'Your packages: web',
          '(YOUR coverage slice — you own every verification unit whose owning NODE tags ANY of these packages, a unit spanning two of them included: your track has no seam item, so a glue unit is yours and nobody else claims it. Read these packages first.)',
          '',
          'Your spec is NOT in this block. Fetch it one flow at a time:',
          String(INTERSECTION_POINTER_CALL_BY_ROLE.get(role)),
          'Each call returns that flow whole — every node, every edge with its branch label, every',
          'observable, the contracts and design decisions that govern it, and the sign-offs already',
          'recorded. Make the call for a flow BEFORE you work it.',
          '',
          'Original user request (the intent behind the flows):',
          'Add authentication to the application',
        ].join('\n');

        expect(result.prompt).toBe(
          agentNameToPromptTransformer({ agent: AgentPromptNameStub({ value: role }) })
            .prompt.split('$ARGUMENTS')
            .join(expectedArgs),
        );
      },
    );

    // THE REAL CODEWEAVER SHAPE: ONE flow and one package — the (package, flow) cell the
    // implementation fan-out mints. So the pointer block is exactly TWO calls: the flow slice, and
    // the foundation call behind it. Every call is spelled out with the ids already substituted,
    // because a session left to compose the call itself composes
    // `get-quest({ questId, stage: 'spec' })` — the whole-quest render this pointer exists to avoid.
    // The foundation call rides last: a contract routes by PATH, so a package can own one anchored
    // to a node on a flow it does not tag, and no per-flow call would ever reach it.
    it('VALID: {role: codeweaver, one flow and one package} => spells out the flow call plus the foundation call', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-7777-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-7777-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'codeweaver',
        text: 'Codeweaver: build this slice — package: web · flow: send-queued-comment-batch',
        status: 'in_progress',
        flowIds: ['send-queued-comment-batch'],
        packageNames: ['web'],
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
        'Your operation item: [codeweaver] Codeweaver: build this slice — package: web · flow: send-queued-comment-batch',
        '',
        'Operations ledger (in order):',
        '1. [>] [codeweaver] Codeweaver: build this slice — package: web · flow: send-queued-comment-batch  <-- YOUR OPERATION ITEM',
        '',
        'Your flows: #send-queued-comment-batch',
        '(YOUR unit of accountability — every flow listed here, and no unit a sibling item owns. Not a starting point: work them, delegating where the work is wider than one session.)',
        '',
        'Your packages: web',
        '(YOUR coverage slice — you own every verification unit whose owning NODE tags ANY of these packages, a unit spanning two of them included: your track has no seam item, so a glue unit is yours and nobody else claims it. Read these packages first.)',
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', flowId: 'send-queued-comment-batch', packageName: 'web' })",
        "  get-quest({ questId: 'my-quest', packageName: 'web' })   <- every contract your package owns, across every flow",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.replace('$ARGUMENTS', expectedArgs));
    });

    it('EDGE: {operation with empty packageNames} => omits the packages block entirely', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-8884-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'bbbbbbbb-8884-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'codeweaver',
        text: 'shared: the comment data model',
        status: 'pending',
        packageNames: [],
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
        '',
        'Operations ledger (in order):',
        '1. [ ] [codeweaver] shared: the comment data model  <-- YOUR OPERATION ITEM',
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
    });

    it('VALID: {quest with packagesAffected entries} => renders each entry with its changeType and packageType', () => {
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
        '',
        'Operations ledger (in order):',
        '1. [ ] [codeweaver] shared: the comment data model  <-- YOUR OPERATION ITEM',
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Packages affected (whole quest): web (edit, frontend-react), queue-runner (new, programmatic-service)',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
    });

    // Every operator holds an item whose flow list IS its scope rather than a reading order — but
    // none is handed the seams here: a flowrider item is a package slice and the glue units belong
    // to the seam item, so a caveat claiming them would contradict the prompt this block is
    // substituted into.
    describe('flow scoping for the sign-off-track operators', () => {
      it.each(SIGNOFF_TRACK_ROLES)(
        'VALID: {role: %s, operation carrying several flowIds} => names them as the unit of accountability, claiming no sibling item’s units',
        (role) => {
          const questId = QuestIdStub({ value: 'my-quest' });
          const workItemId = QuestWorkItemIdStub({ value: 'cccccccc-9999-4222-9333-444444444444' });
          const operationId = OperationItemIdStub({
            value: 'dddddddd-9999-4222-9333-444444444444',
          });
          const operation = OperationItemStub({
            id: operationId,
            role,
            text: 'verify every quest flow',
            status: 'in_progress',
            flowIds: ['send-queued-comment-batch', 'view-persisted-comments'],
          });
          const workItem = WorkItemStub({
            id: workItemId,
            role,
            relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
          });
          const quest = QuestStub({ id: questId, operations: [operation], workItems: [workItem] });

          const result = workItemToPromptTransformer({
            quest,
            workItem,
            agentName: AgentPromptNameStub({ value: role }),
          });

          const expectedArgs = [
            `Quest ID: ${String(questId)}`,
            `Work Item ID: ${String(workItemId)}`,
            `Operation Item ID: ${String(operationId)}`,
            `Your operation item: [${role}] verify every quest flow`,
            '',
            'Operations ledger (in order):',
            `1. [>] [${role}] verify every quest flow  <-- YOUR OPERATION ITEM`,
            '',
            'Your flows: #send-queued-comment-batch, #view-persisted-comments',
            '(YOUR unit of accountability — every flow listed here, and no unit a sibling item owns. Not a starting point: work them, delegating where the work is wider than one session.)',
            '',
            'Your spec is NOT in this block. Fetch it one flow at a time:',
            "  get-quest({ questId: 'my-quest', flowId: 'send-queued-comment-batch' })",
            "  get-quest({ questId: 'my-quest', flowId: 'view-persisted-comments' })",
            'Each call returns that flow whole — every node, every edge with its branch label, every',
            'observable, the contracts and design decisions that govern it, and the sign-offs already',
            'recorded. Make the call for a flow BEFORE you work it.',
            '',
            'Original user request (the intent behind the flows):',
            'Add authentication to the application',
          ].join('\n');

          expect(result.prompt).toBe(
            agentNameToPromptTransformer({
              agent: AgentPromptNameStub({ value: role }),
            }).prompt.replace('$ARGUMENTS', expectedArgs),
          );
        },
      );
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
          'Operations ledger (in order):',
          '1. [>] [warpgate] Warpgate: merge the quest branch home into the base branch  <-- YOUR OPERATION ITEM',
          '',
          'Base branch: main',
          '',
          'Original user request (the intent behind the flows):',
          'Add authentication to the application',
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
          '',
          'Operations ledger (in order):',
          '1. [>] [warpgate] Warpgate: merge the quest branch home into the base branch  <-- YOUR OPERATION ITEM',
          '',
          'Original user request (the intent behind the flows):',
          'Add authentication to the application',
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
          '',
          'Operations ledger (in order):',
          '1. [ ] [codeweaver] core: config load+validate adapter  <-- YOUR OPERATION ITEM',
          '',
          'Your spec is NOT in this block. Fetch it one flow at a time:',
          "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
          'Each call returns that flow whole — every node, every edge with its branch label, every',
          'observable, the contracts and design decisions that govern it, and the sign-offs already',
          'recorded. Make the call for a flow BEFORE you work it.',
          '',
          'Original user request (the intent behind the flows):',
          'Add authentication to the application',
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
          'Operations ledger (in order):',
          '1. [>] [siegemaster] manual-QA every quest flow  <-- YOUR OPERATION ITEM',
          '',
          'Your spec is NOT in this block. Fetch it one flow at a time:',
          "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
          'Each call returns that flow whole — every node, every edge with its branch label, every',
          'observable, the contracts and design decisions that govern it, and the sign-offs already',
          'recorded. Make the call for a flow BEFORE you work it.',
          '',
          'Dev Server Command: npm run dev',
          'Dev Server URL: http://localhost:3000',
          '',
          'Original user request (the intent behind the flows):',
          'Add authentication to the application',
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
          '',
          'Operations ledger (in order):',
          '1. [>] [flowrider] author the flow-perspective test suites  <-- YOUR OPERATION ITEM',
          '',
          'Your spec is NOT in this block. Fetch it one flow at a time:',
          "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
          'Each call returns that flow whole — every node, every edge with its branch label, every',
          'observable, the contracts and design decisions that govern it, and the sign-offs already',
          'recorded. Make the call for a flow BEFORE you work it.',
          '',
          'Original user request (the intent behind the flows):',
          'Add authentication to the application',
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
        'Operations ledger (in order):',
        '1. [>] [spiritmender] fix ward failures  <-- YOUR OPERATION ITEM',
        '',
        'Failed ward result: cccccccc-8888-4222-9333-444444444444 (mode: changed, runId: run-123)',
        'Ward detail blob: <questFolder>/ward-results/cccccccc-8888-4222-9333-444444444444.json',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
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
        'Operations ledger (in order):',
        '1. [>] [spiritmender] fix ward failures  <-- YOUR OPERATION ITEM',
        '',
        'Failed ward result: ffffffff-9999-4222-9333-444444444444 (mode: full)',
        'Ward detail blob: <questFolder>/ward-results/ffffffff-9999-4222-9333-444444444444.json',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
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
        '',
        'Operations ledger (in order):',
        '1. [>] [spiritmender] fix ward failures  <-- YOUR OPERATION ITEM',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
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
        '',
        'Operations ledger (in order):',
        '1. [>] [spiritmender] fix ward failures  <-- YOUR OPERATION ITEM',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
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

  describe('bounded operations-ledger render', () => {
    it('EDGE: {ledger of exactly maxRenderedItems items} => renders every line and emits no elision notice', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-4444-4222-9333-444444444444' });
      const ownOperationId = OperationItemIdStub({
        value: `aaaaaaaa-4444-4222-9333-4444444444${String(operationsLedgerRenderStatics.maxRenderedItems - 1).padStart(2, '0')}`,
      });
      const operations = [
        ...Array.from(
          { length: operationsLedgerRenderStatics.maxRenderedItems - 1 },
          (_unused, index) =>
            OperationItemStub({
              id: OperationItemIdStub({
                value: `aaaaaaaa-4444-4222-9333-4444444444${String(index).padStart(2, '0')}`,
              }),
              role: 'codeweaver',
              text: LEDGER_ITEM_TEXT,
              status: 'complete',
            }),
        ),
        OperationItemStub({
          id: ownOperationId,
          role: 'codeweaver',
          text: LEDGER_ITEM_TEXT,
          status: 'in_progress',
        }),
      ];
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(ownOperationId)}` })],
      });
      const quest = QuestStub({ id: questId, operations, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'codeweaver' }),
      });

      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(ownOperationId)}`,
        `Your operation item: [codeweaver] ${LEDGER_ITEM_TEXT}`,
        '',
        'Operations ledger (in order):',
        ...Array.from(
          { length: 15 },
          (_unused, offset) => `${String(1 + offset)}. [x] [codeweaver] ${LEDGER_ITEM_TEXT}`,
        ),
        `16. [>] [codeweaver] ${LEDGER_ITEM_TEXT}  <-- YOUR OPERATION ITEM`,
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
    });

    it('EDGE: {ledger one item over maxRenderedItems} => elides the single oldest complete item and names it in the singular', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-5555-4222-9333-444444444444' });
      const ownOperationId = OperationItemIdStub({
        value: `aaaaaaaa-5555-4222-9333-4444444444${String(operationsLedgerRenderStatics.maxRenderedItems).padStart(2, '0')}`,
      });
      const operations = [
        ...Array.from(
          { length: operationsLedgerRenderStatics.maxRenderedItems },
          (_unused, index) =>
            OperationItemStub({
              id: OperationItemIdStub({
                value: `aaaaaaaa-5555-4222-9333-4444444444${String(index).padStart(2, '0')}`,
              }),
              role: 'codeweaver',
              text: LEDGER_ITEM_TEXT,
              status: 'complete',
            }),
        ),
        OperationItemStub({
          id: ownOperationId,
          role: 'codeweaver',
          text: LEDGER_ITEM_TEXT,
          status: 'in_progress',
        }),
      ];
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(ownOperationId)}` })],
      });
      const quest = QuestStub({ id: questId, operations, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'codeweaver' }),
      });

      // The notice stands where item 1 was; the surviving lines keep their original 1-based
      // positions, so the numbering opens at 2 and the gap is visible.
      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(ownOperationId)}`,
        `Your operation item: [codeweaver] ${LEDGER_ITEM_TEXT}`,
        '',
        'Operations ledger (in order):',
        ELISION_NOTICE_SINGULAR,
        ...Array.from(
          { length: 15 },
          (_unused, offset) => `${String(2 + offset)}. [x] [codeweaver] ${LEDGER_ITEM_TEXT}`,
        ),
        `17. [>] [codeweaver] ${LEDGER_ITEM_TEXT}  <-- YOUR OPERATION ITEM`,
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
    });

    it('VALID: {40-item pt-chain ledger} => elides the oldest complete run only, keeping the own item and every non-complete item', () => {
      const questId = QuestIdStub({ value: 'my-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'aaaaaaaa-6161-4222-9333-444444444444' });
      const ownOperationId = OperationItemIdStub({
        value: `bbbbbbbb-6161-4222-9333-4444444444${String(PATHOLOGICAL_OWN_INDEX).padStart(2, '0')}`,
      });
      const operations = [
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
        OperationItemStub({
          id: ownOperationId,
          role: 'codeweaver',
          text: LEDGER_ITEM_TEXT,
          status: 'in_progress',
        }),
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
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(ownOperationId)}` })],
      });
      const quest = QuestStub({ id: questId, operations, workItems: [workItem] });

      const result = workItemToPromptTransformer({
        quest,
        workItem,
        agentName: AgentPromptNameStub({ value: 'codeweaver' }),
      });

      // 34 elidable complete items, 6 that are never elidable (the in-flight own item plus five
      // pending), so 16 - 6 = 10 recent complete items survive and the oldest 24 are elided.
      const expectedArgs = [
        `Quest ID: ${String(questId)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(ownOperationId)}`,
        `Your operation item: [codeweaver] ${LEDGER_ITEM_TEXT}`,
        '',
        'Operations ledger (in order):',
        ELISION_NOTICE_PLURAL,
        ...Array.from(
          { length: 10 },
          (_unused, offset) => `${String(25 + offset)}. [x] [codeweaver] ${LEDGER_ITEM_TEXT}`,
        ),
        `35. [>] [codeweaver] ${LEDGER_ITEM_TEXT}  <-- YOUR OPERATION ITEM`,
        ...Array.from(
          { length: PATHOLOGICAL_PENDING_COUNT },
          (_unused, offset) => `${String(36 + offset)}. [ ] [codeweaver] ${LEDGER_ITEM_TEXT}`,
        ),
        '',
        'Your spec is NOT in this block. Fetch it one flow at a time:',
        "  get-quest({ questId: 'my-quest', stage: 'spec' })   <- this item names no flow, so there is no slice to take",
        'Each call returns that flow whole — every node, every edge with its branch label, every',
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
        'recorded. Make the call for a flow BEFORE you work it.',
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result.prompt).toBe(CODEWEAVER_TEMPLATE.split('$ARGUMENTS').join(expectedArgs));
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
