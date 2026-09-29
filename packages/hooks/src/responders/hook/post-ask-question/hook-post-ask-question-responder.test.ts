import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts';
import { PostToolUseHookStub } from '../../../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { HookPostAskQuestionResponder } from './hook-post-ask-question-responder';
import { HookPostAskQuestionResponderProxy } from './hook-post-ask-question-responder.proxy';

describe('HookPostAskQuestionResponder', () => {
  describe('non-AskUserQuestion tool', () => {
    it('VALID: {tool_name: Write} => returns exitCode 0 without calling any server', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      const stub = PostToolUseHookStub({ tool_name: 'Write' });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getLookupUrls({ sessionId: stub.session_id })).toStrictEqual([]);
    });
  });

  describe('happy path — single-select', () => {
    it('VALID: {AskUserQuestion, single answer, header present} => PATCHes design decision with header-derived id', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setNowMs({ value: 999 });
      proxy.setupHappyPath({ sessionId: 'session-xyz', questId: 'quest-abc-123' });

      const questionInput = AskUserQuestionStub({
        questions: [
          {
            question: 'Which naming style do you prefer?',
            header: 'Naming Style',
            options: [{ label: 'Smart title case', description: 'Capitalize important words' }],
            multiSelect: false,
          },
        ],
      });

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which naming style do you prefer?': 'Smart title case' },
        },
        session_id: 'session-xyz',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchUrl({ questId: 'quest-abc-123' })).toBe(
        'http://dungeonmaster.localhost:3737/api/quests/quest-abc-123',
      );
      expect(proxy.getPatchedBody({ questId: 'quest-abc-123' })).toStrictEqual({
        designDecisions: [
          {
            id: 'naming-style-999',
            title: 'Which naming style do you prefer?',
            rationale: 'Smart title case',
            relatedNodeIds: [],
          },
        ],
      });
    });
  });

  describe('happy path — multi-select', () => {
    it('VALID: {AskUserQuestion, multi-select answers} => joins answers with ", "', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setNowMs({ value: 42 });
      proxy.setupHappyPath({ sessionId: 'session-multi', questId: 'quest-multi' });

      const questionInput = AskUserQuestionStub({
        questions: [
          {
            question: 'Which packages are affected?',
            header: 'Packages',
            options: [
              { label: 'hooks', description: 'Hooks package' },
              { label: 'shared', description: 'Shared package' },
            ],
            multiSelect: true,
          },
        ],
      });

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which packages are affected?': ['hooks', 'shared'] },
        },
        session_id: 'session-multi',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchedBody({ questId: 'quest-multi' })).toStrictEqual({
        designDecisions: [
          {
            id: 'packages-42',
            title: 'Which packages are affected?',
            rationale: 'hooks, shared',
            relatedNodeIds: [],
          },
        ],
      });
    });
  });

  describe('happy path — empty header falls back to question text', () => {
    it('VALID: {AskUserQuestion, empty header} => uses question text for id slug', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setNowMs({ value: 7 });
      proxy.setupHappyPath({ sessionId: 'session-noheader', questId: 'quest-noheader' });

      const questionInput = AskUserQuestionStub({
        questions: [
          {
            question: 'What is the primary goal?',
            header: '',
            options: [{ label: 'Performance', description: 'Optimize for speed' }],
            multiSelect: false,
          },
        ],
      });

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'What is the primary goal?': 'Performance' },
        },
        session_id: 'session-noheader',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchedBody({ questId: 'quest-noheader' })).toStrictEqual({
        designDecisions: [
          {
            id: 'what-is-the-primary-goal-7',
            title: 'What is the primary goal?',
            rationale: 'Performance',
            relatedNodeIds: [],
          },
        ],
      });
    });
  });

  describe('happy path — free-form Other answer', () => {
    it('VALID: {AskUserQuestion, verbatim free-form answer} => persists literal answer in rationale', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setNowMs({ value: 1 });
      proxy.setupHappyPath({ sessionId: 'session-other', questId: 'quest-other' });

      const questionInput = AskUserQuestionStub({
        questions: [
          {
            question: 'Which naming style do you prefer?',
            header: 'Naming Style',
            options: [{ label: 'Smart title case', description: 'Capitalize important words' }],
            multiSelect: false,
          },
        ],
      });

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: {
          questions: questionInput.questions,
          answers: {
            'Which naming style do you prefer?': 'Something totally custom the user typed',
          },
        },
        session_id: 'session-other',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchedBody({ questId: 'quest-other' })).toStrictEqual({
        designDecisions: [
          {
            id: 'naming-style-1',
            title: 'Which naming style do you prefer?',
            rationale: 'Something totally custom the user typed',
            relatedNodeIds: [],
          },
        ],
      });
    });
  });

  describe('not a Chaos session (404)', () => {
    it('VALID: {server returns 404 for session} => silent no-op exitCode 0 and no PATCH', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setupQuestNotFound({ sessionId: 'no-session' });

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        },
        session_id: 'no-session',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getLookupUrls({ sessionId: 'no-session' })).toStrictEqual([
        `http://dungeonmaster.localhost:3737/api/quests/by-session/no-session`,
      ]);
    });
  });

  describe('server unreachable (connection-level failure)', () => {
    it('VALID: {fetch throws TypeError} => silent no-op exitCode 0 and no PATCH', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setupServerUnreachable({ sessionId: 'session-down' });

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        },
        session_id: 'session-down',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getLookupUrls({ sessionId: 'session-down' })).toStrictEqual([
        `http://dungeonmaster.localhost:3737/api/quests/by-session/session-down`,
      ]);
    });
  });

  describe('server 5xx on lookup', () => {
    it('ERROR: {server returns 500} => returns exitCode 2 with status-based stderr and no PATCH', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setupServer5xx({
        sessionId: 'session-broken-server',
        status: 500,
        bodyText: '{"error":"Boom"}',
      });

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        },
        session_id: 'session-broken-server',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({
        stdout: '',
        stderr:
          'quest lookup failed at http://dungeonmaster.localhost:3737/api/quests/by-session/session-broken-server: status 500',
        exitCode: 2,
      });
      expect(proxy.getStderrText()).toBe(
        '[post-ask-question] quest lookup failed at http://dungeonmaster.localhost:3737/api/quests/by-session/session-broken-server: status 500\n',
      );
      expect(proxy.getLookupUrls({ sessionId: 'session-broken-server' })).toStrictEqual([
        `http://dungeonmaster.localhost:3737/api/quests/by-session/session-broken-server`,
      ]);
    });
  });

  describe('lookup returns malformed JSON shape', () => {
    it('ERROR: {200 with missing questId field} => returns exitCode 2 with Zod-shape stderr', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setupInvalidResponseShape({ sessionId: 'session-bad-shape' });

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        },
        session_id: 'session-bad-shape',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: expect.stringMatching(
          /^quest lookup at http:\/\/dungeonmaster\.localhost:3737\/api\/quests\/by-session\/session-bad-shape returned invalid shape: .+$/su,
        ),
        exitCode: 2,
      });
      expect(proxy.getLookupUrls({ sessionId: 'session-bad-shape' })).toStrictEqual([
        `http://dungeonmaster.localhost:3737/api/quests/by-session/session-bad-shape`,
      ]);
    });
  });

  describe('PATCH fails', () => {
    it('ERROR: {PATCH network error} => returns exitCode 2 with PATCH failure message', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setNowMs({ value: 5 });
      proxy.setupPatchFails({ sessionId: 'session-patch-fail', questId: 'q-1' });

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        },
        session_id: 'session-patch-fail',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: 'PATCH /api/quests/q-1 failed: connect ECONNREFUSED 127.0.0.1:4000',
        exitCode: 2,
      });
      expect(proxy.getStderrText()).toBe(
        '[post-ask-question] PATCH /api/quests/q-1 failed: connect ECONNREFUSED 127.0.0.1:4000\n',
      );
    });
  });

  describe('malformed tool_response (missing answers field)', () => {
    it('ERROR: {tool_response missing answers} => returns exitCode 2 with shape diagnostic and no PATCH', async () => {
      const proxy = HookPostAskQuestionResponderProxy();

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion',
        tool_input: questionInput,
        tool_response: { questions: questionInput.questions },
        session_id: 'session-no-answers',
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: 'invalid AskUserQuestion tool_response shape (see stderr above)',
        exitCode: 2,
      });
      expect(proxy.getLookupUrls({ sessionId: stub.session_id })).toStrictEqual([]);
    });
  });
});
