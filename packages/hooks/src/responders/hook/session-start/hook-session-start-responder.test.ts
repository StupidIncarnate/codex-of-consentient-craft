import { HookSessionStartResponder } from './hook-session-start-responder';
import { HookSessionStartResponderProxy } from './hook-session-start-responder.proxy';
import { SessionStartHookStub } from '../../../contracts/session-start-hook-data/session-start-hook-data.stub';

describe('HookSessionStartResponder', () => {
  describe('New Session', () => {
    it('VALID: {isNew: true} => returns {shouldOutput: true, content: architecture overview}', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub({ cwd: '/test/project' });

      proxy.setupIsNewSession({ isNew: true });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/\[NEW SESSION\]/u);
      expect(result.content).toMatch(/<questmaestro-architecture>/u);
      expect(result.content).toMatch(/# Architecture Overview/u);
      expect(result.content).toMatch(/Use MCP tools/u);
    });

    it('VALID: {isNew: true} => includes folder types table', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();

      proxy.setupIsNewSession({ isNew: true });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/## Folder Types/u);
      expect(result.content).toMatch(/\| Folder \| Purpose \| Depth \| When to Use \|/u);
    });
  });

  describe('Resumed Session', () => {
    it('VALID: {isNew: false, ALWAYS_LOAD: undefined} => returns {shouldOutput: false}', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();

      proxy.setupIsNewSession({ isNew: false });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldOutput: false,
      });
    });

    it('VALID: {isNew: false, ALWAYS_LOAD: "true"} => returns {shouldOutput: true, content: with RESUMED SESSION}', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub({ cwd: '/test/project' });
      process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS = 'true';

      proxy.setupIsNewSession({ isNew: false });

      const result = await HookSessionStartResponder({ input: hookData });

      delete process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS;

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/\[RESUMED SESSION\]/u);
      expect(result.content).toMatch(/# Architecture Overview/u);
    });
  });

  describe('Environment Variables', () => {
    it('VALID: {isNew: false, ALWAYS_LOAD: "true"} => loads architecture', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();
      process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS = 'true';

      proxy.setupIsNewSession({ isNew: false });

      const result = await HookSessionStartResponder({ input: hookData });

      delete process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS;

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/# Architecture Overview/u);
    });

    it('VALID: {isNew: false, ALWAYS_LOAD: "false"} => returns {shouldOutput: false}', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();
      process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS = 'false';

      proxy.setupIsNewSession({ isNew: false });

      const result = await HookSessionStartResponder({ input: hookData });

      delete process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS;

      expect(result).toStrictEqual({
        shouldOutput: false,
      });
    });
  });

  describe('Architecture Content Output', () => {
    it('VALID: output includes XML tags and MCP instructions', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();

      proxy.setupIsNewSession({ isNew: true });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/<questmaestro-architecture>/u);
      expect(result.content).toMatch(/<\/questmaestro-architecture>/u);
      expect(result.content).toMatch(/# Architecture Overview/u);
      expect(result.content).toMatch(
        /Use MCP tools \(get-folder-detail, get-syntax-rules, get-testing-patterns\)/u,
      );
    });

    it('VALID: output includes critical rules section', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();

      proxy.setupIsNewSession({ isNew: true });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/## Critical Rules Summary/u);
      expect(result.content).toMatch(/Never do these things/u);
    });
  });
});
