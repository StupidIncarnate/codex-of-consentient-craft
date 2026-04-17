import { ToolNameStub } from '../../../contracts/tool-name/tool-name.stub';
import { ErrorMessageStub } from '../../../contracts/error-message/error-message.stub';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts';
import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts';
import { QuestHandleResponderProxy } from './quest-handle-responder.proxy';

const JSON_INDENT_SPACES = 2;

describe('QuestHandleResponder', () => {
  describe('get-quest', () => {
    it('VALID: {questId} => returns quest data', async () => {
      const proxy = QuestHandleResponderProxy();
      const questResult = GetQuestResultStub();
      proxy.setupGetQuestReturns({ result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', format: 'json' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(questResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {questId, stage} => returns filtered quest data', async () => {
      const proxy = QuestHandleResponderProxy();
      const questResult = GetQuestResultStub();
      proxy.setupGetQuestReturns({ result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', stage: 'spec', format: 'json' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(questResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {unsuccessful result} => returns isError true', async () => {
      const proxy = QuestHandleResponderProxy();
      const questResult = GetQuestResultStub({ success: false });
      proxy.setupGetQuestReturns({ result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(questResult, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetQuestThrows({ error: new Error('Quest not found') });

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
      proxy.setupModifyQuestReturns({ result: modifyResult });

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
      proxy.setupModifyQuestReturns({ result: modifyResult });

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
      proxy.setupModifyQuestReturns({ result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          title: 'Keep This',
          workItems: [{ id: 'sneaky-item', status: 'complete' }],
        },
      });

      const passedInput = proxy.getLastModifyInput();

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
        title: 'Keep This',
      });
    });

    it('EDGE: {wardResults in args} => strips wardResults before passing to adapter', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          wardResults: [{ id: 'sneaky-result' }],
        },
      });

      const passedInput = proxy.getLastModifyInput();

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
      });
    });

    it('EDGE: {designPort in args} => strips designPort before passing to adapter', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          designPort: 5173,
        },
      });

      const passedInput = proxy.getLastModifyInput();

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
      });
    });

    it('EDGE: {planningNotes in args} => passes planningNotes through sanitization unchanged', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          planningNotes: {
            scopeClassification: {
              size: 'medium',
              slicing: 'Slice A',
              rationale: 'Two surfaces',
              classifiedAt: '2024-01-15T10:00:00.000Z',
            },
          },
          workItems: [{ id: 'sneaky-item', status: 'complete' }],
        },
      });

      const passedInput = proxy.getLastModifyInput();

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
        planningNotes: {
          scopeClassification: {
            size: 'medium',
            slicing: 'Slice A',
            rationale: 'Two surfaces',
            classifiedAt: '2024-01-15T10:00:00.000Z',
          },
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
      proxy.setupModifyQuestReturns({ result: modifyResult });

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
      proxy.setupModifyQuestReturns({ result: modifyResult });

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
      proxy.setupModifyQuestReturns({ result: modifyResult });

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
      proxy.setupModifyQuestReturns({ result: modifyResult });

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
      proxy.setupModifyQuestReturns({ result: modifyResult });

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
      proxy.setupModifyQuestThrows({ error: new Error('Modify failed') });

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

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'start-quest' }),
        args: { questId: 'add-auth' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupStartQuestThrows({ error: new Error('Start failed') });

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

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-status' }),
        args: { processId: 'proc-12345' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetQuestStatusThrows({ error: new Error('Status failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-status' }),
        args: { processId: 'proc-12345' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Status failed' },
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

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'list-quests' }),
        args: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupListQuestsThrows({ error: new Error('List failed') });

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

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
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

  describe('get-planning-notes', () => {
    it('VALID: {questId} => returns wrapped default planning-notes as JSON', async () => {
      const proxy = QuestHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-planning-notes' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: true, data: { surfaceReports: [], blightReports: [] } },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
      });
    });

    it('VALID: {questId, section: "surface"} => forwards section and returns surfaceReports', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetPlanningNotesReturns({
        result: { success: true, data: [] },
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-planning-notes' }),
        args: { questId: 'test-quest-id', section: 'surface' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, data: [] }, null, JSON_INDENT_SPACES),
          },
        ],
      });
      expect(proxy.getLastGetPlanningNotesInput()).toStrictEqual({
        questId: 'test-quest-id',
        section: 'surface',
      });
    });

    it('INVALID: {questId, invalid section} => throws validation error', async () => {
      const proxy = QuestHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-planning-notes' }),
          args: { questId: 'test-quest-id', section: 'bogus' },
        }),
      ).rejects.toThrow(/Invalid enum value/u);
    });

    it('VALID: {unsuccessful result} => returns isError true', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetPlanningNotesReturns({
        result: { success: false, error: ErrorMessageStub({ value: 'Quest not found' }) },
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-planning-notes' }),
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
      proxy.setupGetPlanningNotesThrows({ error: new Error('Notes unavailable') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-planning-notes' }),
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
