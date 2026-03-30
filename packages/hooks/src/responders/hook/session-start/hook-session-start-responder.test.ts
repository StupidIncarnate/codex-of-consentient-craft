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

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^[\s\S]*<dungeonmaster-architecture>[\s\S]*\[NEW SESSION\][\s\S]*# Architecture Overview[\s\S]*Use MCP tools[\s\S]*$/su,
        ),
      });
    });

    it('VALID: {isNew: true} => includes folder types table', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();

      proxy.setupIsNewSession({ isNew: true });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^[\s\S]*## Folder Types[\s\S]*\| Folder \| Purpose \| Depth \| When to Use \|[\s\S]*$/su,
        ),
      });
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
      process.env.DUNGEONMASTER_ALWAYS_LOAD_STANDARDS = 'true';

      proxy.setupIsNewSession({ isNew: false });

      const result = await HookSessionStartResponder({ input: hookData });

      delete process.env.DUNGEONMASTER_ALWAYS_LOAD_STANDARDS;

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^[\s\S]*\[RESUMED SESSION\][\s\S]*# Architecture Overview[\s\S]*$/su,
        ),
      });
    });
  });

  describe('Environment Variables', () => {
    it('VALID: {isNew: false, ALWAYS_LOAD: "true"} => loads architecture', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();
      process.env.DUNGEONMASTER_ALWAYS_LOAD_STANDARDS = 'true';

      proxy.setupIsNewSession({ isNew: false });

      const result = await HookSessionStartResponder({ input: hookData });

      delete process.env.DUNGEONMASTER_ALWAYS_LOAD_STANDARDS;

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(/^[\s\S]*# Architecture Overview[\s\S]*$/su),
      });
    });

    it('VALID: {isNew: false, ALWAYS_LOAD: "false"} => returns {shouldOutput: false}', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();
      process.env.DUNGEONMASTER_ALWAYS_LOAD_STANDARDS = 'false';

      proxy.setupIsNewSession({ isNew: false });

      const result = await HookSessionStartResponder({ input: hookData });

      delete process.env.DUNGEONMASTER_ALWAYS_LOAD_STANDARDS;

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

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^[\s\S]*<dungeonmaster-architecture>[\s\S]*# Architecture Overview[\s\S]*Use MCP tools \(get-folder-detail, get-syntax-rules, get-testing-patterns\)[\s\S]*<\/dungeonmaster-architecture>[\s\S]*$/su,
        ),
      });
    });

    it('VALID: output includes critical rules section', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();

      proxy.setupIsNewSession({ isNew: true });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^[\s\S]*## Critical Rules Summary[\s\S]*Never do these things[\s\S]*$/su,
        ),
      });
    });
  });
});
