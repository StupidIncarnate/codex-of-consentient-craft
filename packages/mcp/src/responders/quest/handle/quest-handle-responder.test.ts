import { ToolNameStub } from '../../../contracts/tool-name/tool-name.stub';
import { ErrorMessageStub } from '../../../contracts/error-message/error-message.stub';
import {
  ContentTextStub,
  DesignDecisionStub,
  FlowNodeStub,
  FlowStub,
  GetQuestResultStub,
  GuildIdStub,
  ModifyQuestResultStub,
  OperationItemStub,
  OrchestrationStatusStub,
  ProcessIdStub,
  QuestCommentStub,
  QuestContractEntryStub,
  QuestIdStub,
  QuestListItemStub,
  QuestStub,
  QuestSummaryFlowStub,
  QuestSummaryStub,
  QuestSummaryTrackCountsStub,
  QuestWorkItemIdStub,
  ToolingRequirementStub,
  UrlSlugStub,
} from '@dungeonmaster/shared/contracts';
import { questToTextDisplayTransformer } from '@dungeonmaster/shared/transformers';
import { QuestHandleResponderProxy } from './quest-handle-responder.proxy';

const JSON_INDENT_SPACES = 2;
// Named list, not a hardcoded it.each array in isolation — every value questStageContract
// currently accepts (spec/planning/implementation), used to prove the comment strip applies
// under every stage filter, not just the default unfiltered read.
const GET_QUEST_STAGE_FILTERS = ['spec', 'planning', 'implementation'] as const;
const COMMENT_TEXT_ONE = 'First reviewer note about the login node';
const COMMENT_TEXT_TWO = 'Second reviewer note about the auth check';
const COMMENT_TEXT_THREE = 'Third reviewer note about the dashboard redirect';
const COMMENT_ID_ONE = 'a1a2a3a4-58cc-4372-a567-0e02b2c3d479';
const COMMENT_ID_TWO = 'b1b2b3b4-58cc-4372-a567-0e02b2c3d479';
const COMMENT_ID_THREE = 'c1c2c3c4-58cc-4372-a567-0e02b2c3d479';
const TEXT_FORMAT_SENTINEL_COMMENT = 'SENTINEL_TEXT_MUST_NOT_APPEAR_IN_RENDERED_QUEST_TEXT';

describe('QuestHandleResponder', () => {
  describe('get-quest', () => {
    it('VALID: {questId} => returns quest data with comments key stripped', async () => {
      const proxy = QuestHandleResponderProxy();
      const quest = QuestStub();
      const questResult = GetQuestResultStub({ quest });
      // quest.comments defaults to [] via QuestStub — delete it AFTER building questResult above,
      // so the deletion only shapes what we expect back, never what fed the mock.
      Reflect.deleteProperty(quest, 'comments');
      proxy.setupGetQuestReturns({ questId: 'test-quest-id', result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', format: 'json' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, quest }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {questId, stage} => returns filtered quest data with comments key stripped', async () => {
      const proxy = QuestHandleResponderProxy();
      const quest = QuestStub();
      const questResult = GetQuestResultStub({ quest });
      Reflect.deleteProperty(quest, 'comments');
      proxy.setupGetQuestReturns({ questId: 'test-quest-id', result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', stage: 'spec', format: 'json' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, quest }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {unsuccessful result} => returns isError true with comments key stripped', async () => {
      const proxy = QuestHandleResponderProxy();
      const quest = QuestStub();
      const questResult = GetQuestResultStub({ success: false, quest });
      Reflect.deleteProperty(quest, 'comments');
      proxy.setupGetQuestReturns({ questId: 'test-quest-id', result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, quest }, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });

    it('VALID: {format: json, quest with 3 comments} => strips the comments key and leaks none of the comment text', async () => {
      const proxy = QuestHandleResponderProxy();
      const quest = QuestStub({
        comments: [
          QuestCommentStub({ id: COMMENT_ID_ONE, text: COMMENT_TEXT_ONE }),
          QuestCommentStub({ id: COMMENT_ID_TWO, text: COMMENT_TEXT_TWO }),
          QuestCommentStub({ id: COMMENT_ID_THREE, text: COMMENT_TEXT_THREE }),
        ],
      });
      const questResult = GetQuestResultStub({ quest });
      Reflect.deleteProperty(quest, 'comments');
      proxy.setupGetQuestReturns({ questId: 'test-quest-id', result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', format: 'json' },
      });

      // The exact-string match below is the proof of absence: if any of the three comment
      // strings (or the "comments" key itself) leaked into the response, this string would be
      // longer than the expected text and the assertion would fail — there is no expected
      // substring left for a leak to hide behind.
      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, quest }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it.each(GET_QUEST_STAGE_FILTERS)(
      'VALID: {format: json, stage: %s, quest with 3 comments} => strips comments under every stage filter',
      async (stage) => {
        const proxy = QuestHandleResponderProxy();
        const quest = QuestStub({
          comments: [
            QuestCommentStub({ id: COMMENT_ID_ONE, text: COMMENT_TEXT_ONE }),
            QuestCommentStub({ id: COMMENT_ID_TWO, text: COMMENT_TEXT_TWO }),
            QuestCommentStub({ id: COMMENT_ID_THREE, text: COMMENT_TEXT_THREE }),
          ],
        });
        const questResult = GetQuestResultStub({ quest });
        Reflect.deleteProperty(quest, 'comments');
        proxy.setupGetQuestReturns({ questId: 'test-quest-id', result: questResult });

        const result = await proxy.callResponder({
          tool: ToolNameStub({ value: 'get-quest' }),
          args: { questId: 'test-quest-id', format: 'json', stage },
        });

        expect(result).toStrictEqual({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, quest }, null, JSON_INDENT_SPACES),
            },
          ],
        });
      },
    );

    it('VALID: {format: text, unsuccessful result} => falls through to the JSON strip branch instead of rendering text', async () => {
      const proxy = QuestHandleResponderProxy();
      const quest = QuestStub();
      const questResult = GetQuestResultStub({ success: false, quest });
      Reflect.deleteProperty(quest, 'comments');
      proxy.setupGetQuestReturns({ questId: 'test-quest-id', result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', format: 'text' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, quest }, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });

    it('VALID: {format: text, quest with a sentinel comment} => rendered text never contains the comment text', async () => {
      const proxy = QuestHandleResponderProxy();
      const quest = QuestStub({
        comments: [QuestCommentStub({ text: TEXT_FORMAT_SENTINEL_COMMENT })],
      });
      const questResult = GetQuestResultStub({ quest });
      proxy.setupGetQuestReturns({ questId: 'test-quest-id', result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', format: 'text' },
      });

      // questToTextDisplayTransformer has no comments section, so the real renderer's own output
      // (computed directly here, not mocked) is already proof the sentinel never appears — an
      // exact match against it leaves no room for the sentinel to have leaked in anywhere.
      const expectedText = questToTextDisplayTransformer({ quest });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: expectedText }],
      });
    });

    it('VALID: {format: json, quest with non-empty designDecisions/toolingRequirements/contracts/operations plus a comment} => flows, designDecisions, contracts, toolingRequirements and operations pass through unchanged', async () => {
      const proxy = QuestHandleResponderProxy();
      // Every non-comment section below is populated with a REAL entry (not the empty-array
      // QuestStub default) — an over-strip that drops or empties one of these sections entirely,
      // not just comments, produces a shorter/different payload than an empty-array fixture could
      // ever distinguish from the correct one.
      const node = FlowNodeStub({ id: 'start' as never, label: 'Start' as never });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node], edges: [] });
      const designDecision = DesignDecisionStub({ relatedNodeIds: ['start'] as never });
      const toolingRequirement = ToolingRequirementStub();
      const contractEntry = QuestContractEntryStub({ nodeId: 'start' as never });
      const operation = OperationItemStub({
        id: '00000000-0000-4000-8000-0000000000e2' as never,
        role: 'codeweaver',
        text: 'build core',
        status: 'pending',
        locked: false,
      });
      const quest = QuestStub({
        flows: [flow],
        designDecisions: [designDecision],
        toolingRequirements: [toolingRequirement],
        contracts: [contractEntry],
        operations: [operation],
        comments: [QuestCommentStub()],
      });
      const questResult = GetQuestResultStub({ quest });
      Reflect.deleteProperty(quest, 'comments');
      proxy.setupGetQuestReturns({ questId: 'test-quest-id', result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', format: 'json' },
      });

      // quest here (comments already deleted above) still carries its original flows,
      // designDecisions, contracts, toolingRequirements and operations untouched — the exact
      // match proves the strip cost the agent nothing beyond the comments key.
      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, quest }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetQuestThrows({ questId: 'test-quest-id', error: new Error('Quest not found') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Quest not found' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('modify-quest', () => {
    it('VALID: {questId, input} => returns modify result', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id', status: 'approved' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(modifyResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {unsuccessful result} => returns isError true', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub({ success: false });
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(modifyResult, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });

    it('EDGE: {workItems in args} => strips workItems before passing to adapter', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          title: 'Keep This',
          workItems: [{ id: 'sneaky-item', status: 'complete' }],
        },
      });

      const passedInput = proxy.getLastModifyInput({ questId: 'test-quest-id' });

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
        title: 'Keep This',
      });
    });

    it('EDGE: {wardResults in args} => strips wardResults before passing to adapter', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          wardResults: [{ id: 'sneaky-result' }],
        },
      });

      const passedInput = proxy.getLastModifyInput({ questId: 'test-quest-id' });

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
      });
    });

    it('EDGE: {pausedAtStatus in args} => strips pausedAtStatus before passing to adapter', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          pausedAtStatus: 'in_progress',
        },
      });

      const passedInput = proxy.getLastModifyInput({ questId: 'test-quest-id' });

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
      });
    });

    it('EDGE: {designPort in args} => strips designPort before passing to adapter', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          designPort: 5173,
        },
      });

      const passedInput = proxy.getLastModifyInput({ questId: 'test-quest-id' });

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
      });
    });

    it('EDGE: {comments in args} => strips comments before passing to adapter, and still succeeds', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          comments: [
            {
              id: 'sneaky-comment-id',
              flowId: 'login-flow',
              nodeId: 'start',
              text: 'An agent should not be able to write this',
              createdAt: '2024-01-15T10:00:00.000Z',
            },
          ],
        },
      });

      const passedInput = proxy.getLastModifyInput({ questId: 'test-quest-id' });

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
      });
      // The strip happens before validation runs: an agent that tries to write comments gets the
      // ordinary success payload back, never a validation error or a failedChecks entry naming
      // comments — there is nothing here for it to chase.
      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(modifyResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('EDGE: {comments in args, edit shape {id, text}} => strips comments before passing to adapter, and still succeeds', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          comments: [
            {
              id: 'sneaky-comment-id',
              text: 'An agent should not be able to edit this',
            },
          ],
        },
      });

      const passedInput = proxy.getLastModifyInput({ questId: 'test-quest-id' });

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
      });
      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(modifyResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('EDGE: {comments in args, delete shape {id, _delete: true}} => strips comments before passing to adapter, and still succeeds', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          comments: [
            {
              id: 'sneaky-comment-id',
              _delete: true,
            },
          ],
        },
      });

      const passedInput = proxy.getLastModifyInput({ questId: 'test-quest-id' });

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
      });
      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(modifyResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('EDGE: {planningNotes in args} => passes planningNotes through sanitization unchanged', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          planningNotes: {
            blightReports: [
              {
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                workItemId: '9c4e1a2b-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
                minion: 'security',
                status: 'active',
                findings: [],
                createdAt: '2024-01-15T10:00:00.000Z',
                reviewedOn: [],
              },
            ],
          },
          workItems: [{ id: 'sneaky-item', status: 'complete' }],
        },
      });

      const passedInput = proxy.getLastModifyInput({ questId: 'test-quest-id' });

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
        planningNotes: {
          blightReports: [
            {
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              workItemId: '9c4e1a2b-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
              minion: 'security',
              status: 'active',
              findings: [],
              createdAt: '2024-01-15T10:00:00.000Z',
              reviewedOn: [],
            },
          ],
        },
      });
    });

    it('VALID: {failedChecks present} => prepends human-readable block above JSON payload', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub({
        success: false,
        error: 'Save invariants failed' as never,
        failedChecks: [
          {
            name: 'Flow ID Uniqueness' as never,
            passed: false,
            details: "Duplicate flow ids: 'user-login'" as never,
          },
        ] as never,
      });
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      const expectedJson = JSON.stringify(modifyResult, null, JSON_INDENT_SPACES);
      const expectedText = `Structural validation failed:\n- [FAIL] Flow ID Uniqueness: Duplicate flow ids: 'user-login'\n\n${expectedJson}`;

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: expectedText,
          },
        ],
        isError: true,
      });
    });

    it('VALID: {failedChecks absent} => returns just the JSON payload with no header', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub({
        success: false,
        error: 'Some unrelated failure' as never,
      });
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(modifyResult, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });

    it('VALID: {multi-check failure} => lists all checks in order above the JSON payload', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub({
        success: false,
        error: 'Completeness checks failed' as never,
        failedChecks: [
          {
            name: 'No Orphan Flow Nodes' as never,
            passed: false,
            details: "Orphan node 'extra' in flow 'login'" as never,
          },
          {
            name: 'Decision Node Branching' as never,
            passed: false,
            details: "Decision 'check-auth' has 1 outgoing edge (need >=2)" as never,
          },
          {
            name: 'Observable Descriptions' as never,
            passed: false,
            details: "Observable 'obs-1' missing description" as never,
          },
        ] as never,
      });
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      const expectedJson = JSON.stringify(modifyResult, null, JSON_INDENT_SPACES);
      const expectedText = [
        'Structural validation failed:',
        "- [FAIL] No Orphan Flow Nodes: Orphan node 'extra' in flow 'login'",
        "- [FAIL] Decision Node Branching: Decision 'check-auth' has 1 outgoing edge (need >=2)",
        "- [FAIL] Observable Descriptions: Observable 'obs-1' missing description",
        '',
        expectedJson,
      ].join('\n');

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: expectedText,
          },
        ],
        isError: true,
      });
    });

    it('VALID: {all failedChecks passed=true} => uses success header with [INFO] tags', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub({
        success: true,
        failedChecks: [
          {
            name: 'Plan Review Report' as never,
            passed: true,
            details: 'Plan review reported warnings (non-blocking): missing edge label' as never,
          },
        ] as never,
      });
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      const expectedJson = JSON.stringify(modifyResult, null, JSON_INDENT_SPACES);
      const expectedText = `Transition succeeded with non-blocking warnings:\n- [INFO] Plan Review Report: Plan review reported warnings (non-blocking): missing edge label\n\n${expectedJson}`;

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: expectedText,
          },
        ],
      });
    });

    it('VALID: {mixed passed and failed checks} => uses failure header with [FAIL] and [INFO] tags per check', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub({
        success: false,
        error: 'Validation failed' as never,
        failedChecks: [
          {
            name: 'Plan Review Report' as never,
            passed: true,
            details: 'non-blocking warnings' as never,
          },
          {
            name: 'Step Coverage' as never,
            passed: false,
            details: 'Observable obs-1 unsatisfied' as never,
          },
        ] as never,
      });
      proxy.setupModifyQuestReturns({ questId: 'test-quest-id', result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      const expectedJson = JSON.stringify(modifyResult, null, JSON_INDENT_SPACES);
      const expectedText = [
        'Structural validation failed:',
        '- [INFO] Plan Review Report: non-blocking warnings',
        '- [FAIL] Step Coverage: Observable obs-1 unsatisfied',
        '',
        expectedJson,
      ].join('\n');

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: expectedText,
          },
        ],
        isError: true,
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupModifyQuestThrows({ questId: 'test-quest-id', error: new Error('Modify failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Modify failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('start-quest', () => {
    it('VALID: {questId} => returns processId', async () => {
      const proxy = QuestHandleResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub();
      proxy.setupStartQuestReturns({ questId, processId });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'start-quest' }),
        args: { questId: 'add-auth' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, processId }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupStartQuestThrows({
        questId: QuestIdStub({ value: 'add-auth' }),
        error: new Error('Start failed'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'start-quest' }),
        args: { questId: 'add-auth' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Start failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', async () => {
      const proxy = QuestHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'start-quest' }),
          args: { questId: 'add-auth', guild: 'test' },
        }),
      ).rejects.toThrow(/Unrecognized key/u);
    });
  });

  describe('get-quest-status', () => {
    it('VALID: {processId} => returns status', async () => {
      const proxy = QuestHandleResponderProxy();
      const status = OrchestrationStatusStub({
        processId: 'proc-12345',
        questId: 'add-auth',
        phase: 'codeweaver',
      });
      proxy.setupGetQuestStatusReturns({ processId: 'proc-12345', status });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-status' }),
        args: { processId: 'proc-12345' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, status }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('ERROR: {process not found} => returns Process not found error', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetQuestStatusThrows({
        processId: 'proc-12345',
        error: new Error('Process not found: proc-12345'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-status' }),
        args: { processId: 'proc-12345' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Process not found: proc-12345' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('list-quests', () => {
    it('VALID: {guildId} => returns quests list', async () => {
      const proxy = QuestHandleResponderProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const quests = [QuestListItemStub()];
      proxy.setupListQuestsReturns({ guildId, quests });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'list-quests' }),
        args: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, quests }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupListQuestsThrows({
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        error: new Error('List failed'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'list-quests' }),
        args: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'List failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('list-guilds', () => {
    it('VALID: {} => returns guilds list', async () => {
      const proxy = QuestHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'list-guilds' }),
        args: {},
      });

      // No setupListGuildsReturns call — the underlying adapter proxy's own default (no guilds
      // registered) resolves an empty array, which is what a real "no guilds yet" state returns.
      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, guilds: [] }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupListGuildsThrows({ error: new Error('Guilds failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'list-guilds' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Guilds failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('get-quest-planning-notes', () => {
    it('VALID: {questId} => returns wrapped default planning-notes as JSON', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetPlanningNotesReturns({
        questId: 'test-quest-id',
        result: {
          success: true,
          data: { blightReports: [], qaLedger: [], blightLedger: [], questNotes: [] },
        },
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-planning-notes' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                data: { blightReports: [], qaLedger: [], blightLedger: [], questNotes: [] },
              },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
      });
    });

    it('VALID: {questId, section: "blight"} => forwards section and returns blightReports', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetPlanningNotesReturns({
        questId: 'test-quest-id',
        result: { success: true, data: [] },
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-planning-notes' }),
        args: { questId: 'test-quest-id', section: 'blight' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, data: [] }, null, JSON_INDENT_SPACES),
          },
        ],
      });
      expect(proxy.getLastGetPlanningNotesInput({ questId: 'test-quest-id' })).toStrictEqual({
        questId: 'test-quest-id',
        section: 'blight',
      });
    });

    it('INVALID: {questId, invalid section} => throws validation error', async () => {
      const proxy = QuestHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-quest-planning-notes' }),
          args: { questId: 'test-quest-id', section: 'bogus' },
        }),
      ).rejects.toThrow(/Invalid enum value/u);
    });

    it('VALID: {unsuccessful result} => returns isError true', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetPlanningNotesReturns({
        questId: 'test-quest-id',
        result: { success: false, error: ErrorMessageStub({ value: 'Quest not found' }) },
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-planning-notes' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Quest not found' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetPlanningNotesThrows({
        questId: 'test-quest-id',
        error: new Error('Notes unavailable'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-planning-notes' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Notes unavailable' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('get-blight-checklist', () => {
    it('VALID: {questId} => dispatches to the blight layer responder and returns rendered text VERBATIM with newlines intact', async () => {
      const proxy = QuestHandleResponderProxy();
      const multiLineChecklist = ContentTextStub({
        value: '# BLIGHT CHECKLIST\nUnits: 2\n[ ] a-file:security:x\n[x] b-file:perf:reviewed',
      });
      proxy.setupGetBlightChecklistReturns({
        questId: 'test-quest-id',
        result: { success: true, data: multiLineChecklist },
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-blight-checklist' }),
        args: { questId: 'test-quest-id' },
      });

      // The exact match below is the proof: had the responder JSON.stringify()'d this payload,
      // every '\n' would come back as the two characters '\\n' and this assertion would fail —
      // there is no looser check that could hide that regression.
      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: '# BLIGHT CHECKLIST\nUnits: 2\n[ ] a-file:security:x\n[x] b-file:perf:reviewed',
          },
        ],
      });
    });

    it('VALID: {questId} => forwards questId to the blight layer responder', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetBlightChecklistReturns({
        questId: 'test-quest-id',
        result: { success: true, data: ContentTextStub({ value: '# BLIGHT CHECKLIST' }) },
      });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-blight-checklist' }),
        args: { questId: 'test-quest-id' },
      });

      expect(proxy.getLastGetBlightChecklistInput({ questId: 'test-quest-id' })).toStrictEqual({
        questId: 'test-quest-id',
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetBlightChecklistThrows({
        questId: 'test-quest-id',
        error: new Error('Quest not found'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-blight-checklist' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Quest not found' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('reset-flow-signoffs', () => {
    it('VALID: {questId, workItemId, flowId, reason} => dispatches to the reset layer responder and returns the report VERBATIM', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupResetFlowSignoffsReturns({
        questId: 'test-quest-id',
        flowId: 'login-flow',
        result: {
          success: true,
          data: ContentTextStub({
            value:
              'Siegemaster walk reset for flow login-flow.\nCleared 4 siegemasterSignoff value(s).',
          }),
        },
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'reset-flow-signoffs' }),
        args: {
          questId: 'test-quest-id',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: 'Fixed the redirect guard the walk exposed.',
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: 'Siegemaster walk reset for flow login-flow.\nCleared 4 siegemasterSignoff value(s).',
          },
        ],
      });
    });

    it('VALID: {all four fields} => forwards every one to the reset layer responder', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupResetFlowSignoffsReturns({
        questId: 'test-quest-id',
        flowId: 'login-flow',
        result: { success: true, data: ContentTextStub({ value: 'ok' }) },
      });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'reset-flow-signoffs' }),
        args: {
          questId: 'test-quest-id',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: 'Fixed the redirect guard the walk exposed.',
        },
      });

      expect(
        proxy.getLastResetFlowSignoffsInput({ questId: 'test-quest-id', flowId: 'login-flow' }),
      ).toStrictEqual({
        questId: 'test-quest-id',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
        reason: 'Fixed the redirect guard the walk exposed.',
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupResetFlowSignoffsThrows({
        questId: 'test-quest-id',
        flowId: 'login-flow',
        error: new Error('Quest not found'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'reset-flow-signoffs' }),
        args: {
          questId: 'test-quest-id',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: 'Fixed the redirect guard the walk exposed.',
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Quest not found' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('get-quest-summary', () => {
    it('VALID: {questId} => dispatches to the summary layer responder and returns the RENDERED text', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetQuestSummaryReturns({
        questId: 'test-quest-id',
        summary: QuestSummaryStub({
          questId: 'test-quest-id',
          flows: [
            QuestSummaryFlowStub({
              id: 'login-flow',
              name: 'Login Flow',
              flowType: 'runtime',
              tracks: [
                QuestSummaryTrackCountsStub({
                  id: 'flowrider',
                  confirmed: 9,
                  unconfirmable: 2,
                  outstanding: 4,
                }),
              ],
            }),
          ],
          midQuestObservables: [],
          unconfirmable: [],
          noteGroups: [],
        }),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-summary' }),
        args: { questId: 'test-quest-id' },
      });
      const lines = String(result.content[0]?.text).split('\n');

      expect({
        isError: result.isError,
        title: lines[0],
        trackRow: lines.find((line) => line.startsWith('    flowrider:')),
      }).toStrictEqual({
        isError: undefined,
        title: '# QUEST SUMMARY — `test-quest-id`',
        trackRow: '    flowrider: confirmed 9 / unconfirmable 2 / outstanding 4',
      });
    });

    it('VALID: {questId} => forwards it to the summary layer responder', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetQuestSummaryReturns({
        questId: 'test-quest-id',
        summary: QuestSummaryStub({ questId: 'test-quest-id' }),
      });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-summary' }),
        args: { questId: 'test-quest-id' },
      });

      expect(proxy.getLastGetQuestSummaryInput({ questId: 'test-quest-id' })).toStrictEqual({
        questId: 'test-quest-id',
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetQuestSummaryThrows({
        questId: 'test-quest-id',
        error: new Error('Quest not found'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-summary' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Quest not found' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('create-quest', () => {
    it('VALID: {userRequest} => returns { questId, guildSlug } JSON', async () => {
      const proxy = QuestHandleResponderProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guildSlug = UrlSlugStub({ value: 'my-guild' });
      proxy.setupCreateQuestReturns({ userRequest: 'Build the login flow', questId, guildSlug });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'create-quest' }),
        args: { userRequest: 'Build the login flow' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ questId, guildSlug }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {userRequest, questType: "bug-hunt"} => returns { questId, guildSlug } JSON', async () => {
      const proxy = QuestHandleResponderProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guildSlug = UrlSlugStub({ value: 'my-guild' });
      proxy.setupCreateQuestReturns({
        userRequest: 'The tool result is not rendering',
        questId,
        guildSlug,
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'create-quest' }),
        args: { userRequest: 'The tool result is not rendering', questType: 'bug-hunt' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ questId, guildSlug }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {userRequest} with a resolvable Claude Code session on disk => forwards the resolved sessionId to the create-quest adapter', async () => {
      const proxy = QuestHandleResponderProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guildSlug = UrlSlugStub({ value: 'my-guild' });
      proxy.setupSessionResolved({
        entries: [{ name: 'resolved-session-abc.jsonl', mtimeMs: 1000 }],
      });
      proxy.setupCreateQuestReturns({ userRequest: 'Build the login flow', questId, guildSlug });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'create-quest' }),
        args: { userRequest: 'Build the login flow' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ questId, guildSlug }, null, JSON_INDENT_SPACES),
          },
        ],
      });
      expect(proxy.getLastCreateQuestInput()).toStrictEqual({
        userRequest: 'Build the login flow',
        sessionId: 'resolved-session-abc',
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupCreateQuestThrows({
        userRequest: 'Build the login flow',
        error: new Error('No guild available'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'create-quest' }),
        args: { userRequest: 'Build the login flow' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'No guild available' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('get-next-step', () => {
    it('VALID: {} => returns NextStep JSON', async () => {
      const proxy = QuestHandleResponderProxy();
      const step = proxy.buildIdleNextStep();
      proxy.setupGetNextStepReturns({ step });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-next-step' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(step, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetNextStepThrows({ error: new Error('Scan failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-next-step' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Scan failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('run-ward', () => {
    it('VALID: {questId, workItemId, mode} => returns QuestRunWardResult JSON', async () => {
      const proxy = QuestHandleResponderProxy();
      const wardResult = proxy.buildRunWardResult();
      proxy.setupRunWardReturns({
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        result: wardResult,
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'run-ward' }),
        args: {
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
          mode: 'changed',
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(wardResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('INVALID: {mode: "partial"} => throws validation error', async () => {
      const proxy = QuestHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'run-ward' }),
          args: {
            questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
            workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
            mode: 'partial',
          },
        }),
      ).rejects.toThrow(/Invalid enum value/u);
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupRunWardThrows({
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        error: new Error('Ward died'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'run-ward' }),
        args: {
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
          mode: 'full',
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: 'Ward died' }, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });
  });

  describe('run-riftcarver', () => {
    it('VALID: {questId, workItemId} => returns QuestRunRiftcarverResult JSON', async () => {
      const proxy = QuestHandleResponderProxy();
      const riftcarverResult = proxy.buildRunRiftcarverResult();
      proxy.setupRunRiftcarverReturns({
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        result: riftcarverResult,
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'run-riftcarver' }),
        args: {
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(riftcarverResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('INVALID: {mode: "changed"} => throws validation error (riftcarver takes no mode)', async () => {
      const proxy = QuestHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'run-riftcarver' }),
          args: {
            questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
            workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
            mode: 'changed',
          },
        }),
      ).rejects.toThrow(/Unrecognized key/u);
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupRunRiftcarverThrows({
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        error: new Error('git worktree add failed'),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'run-riftcarver' }),
        args: {
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'git worktree add failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('get-server-config', () => {
    it('VALID: {} => returns { baseUrl, port } JSON', async () => {
      const proxy = QuestHandleResponderProxy();
      const config = proxy.buildServerConfig();
      proxy.setupGetServerConfigReturns({ result: config });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-server-config' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { baseUrl: config.baseUrl, port: config.port },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetServerConfigThrows({ error: new Error('Config unavailable') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-server-config' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Config unavailable' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('unknown tool', () => {
    it('ERROR: {tool: unknown-tool} => throws unknown tool error', async () => {
      const proxy = QuestHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'unknown-tool' }),
          args: {},
        }),
      ).rejects.toThrow(/Unknown quest tool/u);
    });
  });
});
