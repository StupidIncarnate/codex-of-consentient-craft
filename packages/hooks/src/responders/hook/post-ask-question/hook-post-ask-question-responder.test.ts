import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts';
import { PostToolUseHookStub } from '../../../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { HookPostAskQuestionResponder } from './hook-post-ask-question-responder';
import { HookPostAskQuestionResponderProxy } from './hook-post-ask-question-responder.proxy';

describe('HookPostAskQuestionResponder', () => {
  describe('non-AskUserQuestion tool', () => {
    it('VALID: {tool_name: Write} => returns exitCode 0 without calling any server', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      const stub = PostToolUseHookStub({ tool_name: 'Write' as never });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchedBody()).toBe(undefined);
    });
  });

  describe('happy path — single-select', () => {
    it('VALID: {AskUserQuestion, single answer, header present} => PATCHes design decision with header-derived id', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setNowMs({ value: 999 });
      proxy.setupHappyPath({ questId: 'quest-abc-123' });

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
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which naming style do you prefer?': 'Smart title case' },
        } as never,
        session_id: 'session-xyz' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchUrl()).toBe(
        'http://dungeonmaster.localhost:3737/api/quests/quest-abc-123',
      );
      expect(proxy.getPatchedBody()).toStrictEqual({
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
      proxy.setupHappyPath({ questId: 'quest-multi' });

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
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which packages are affected?': ['hooks', 'shared'] },
        } as never,
        session_id: 'session-multi' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchedBody()).toStrictEqual({
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
      proxy.setupHappyPath({ questId: 'quest-noheader' });

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
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'What is the primary goal?': 'Performance' },
        } as never,
        session_id: 'session-noheader' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchedBody()).toStrictEqual({
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
      proxy.setupHappyPath({ questId: 'quest-other' });

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
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: {
          questions: questionInput.questions,
          answers: {
            'Which naming style do you prefer?': 'Something totally custom the user typed',
          },
        } as never,
        session_id: 'session-other' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchedBody()).toStrictEqual({
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
      proxy.setupQuestNotFound();

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        } as never,
        session_id: 'no-session' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchedBody()).toBe(undefined);
    });
  });

  describe('server unreachable (connection-level failure)', () => {
    it('VALID: {fetch throws TypeError} => silent no-op exitCode 0 and no PATCH', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setupServerUnreachable();

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        } as never,
        session_id: 'session-down' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
      expect(proxy.getPatchedBody()).toBe(undefined);
    });
  });

  describe('server 5xx on lookup', () => {
    it('ERROR: {server returns 500} => returns exitCode 2 with status-based stderr and no PATCH', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setupServer5xx({ status: 500, bodyText: '{"error":"Boom"}' });

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        } as never,
        session_id: 'session-broken-server' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({
        stdout: '',
        stderr:
          'quest lookup failed at http://dungeonmaster.localhost:3737/api/quests/by-session/session-broken-server: status 500',
        exitCode: 2,
      });
      expect(proxy.getPatchedBody()).toBe(undefined);
    });
  });

  describe('lookup returns malformed JSON shape', () => {
    it('ERROR: {200 with missing questId field} => returns exitCode 2 with Zod-shape stderr', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setupInvalidResponseShape();

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        } as never,
        session_id: 'session-bad-shape' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: expect.stringMatching(
          /^quest lookup at http:\/\/dungeonmaster\.localhost:3737\/api\/quests\/by-session\/session-bad-shape returned invalid shape: .+$/su,
        ),
        exitCode: 2,
      });
      expect(proxy.getPatchedBody()).toBe(undefined);
    });
  });

  describe('PATCH fails', () => {
    it('ERROR: {PATCH network error} => returns exitCode 2 with PATCH failure message', async () => {
      const proxy = HookPostAskQuestionResponderProxy();
      proxy.setupPatchFails({ error: new Error('connection reset') });

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: {
          questions: questionInput.questions,
          answers: { 'Which option do you prefer?': 'Option A' },
        } as never,
        session_id: 'session-patch-fail' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: 'PATCH /api/quests/q-1 failed: connection reset',
        exitCode: 2,
      });
    });
  });

  describe('malformed tool_response (missing answers field)', () => {
    it('ERROR: {tool_response missing answers} => returns exitCode 2 with shape diagnostic and no PATCH', async () => {
      const proxy = HookPostAskQuestionResponderProxy();

      const questionInput = AskUserQuestionStub();

      const stub = PostToolUseHookStub({
        tool_name: 'AskUserQuestion' as never,
        tool_input: questionInput as never,
        tool_response: { questions: questionInput.questions } as never,
        session_id: 'session-no-answers' as never,
      });

      const result = await HookPostAskQuestionResponder({ inputData: JSON.stringify(stub) });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: 'invalid AskUserQuestion tool_response shape (see stderr above)',
        exitCode: 2,
      });
      expect(proxy.getPatchedBody()).toBe(undefined);
    });
  });
});
