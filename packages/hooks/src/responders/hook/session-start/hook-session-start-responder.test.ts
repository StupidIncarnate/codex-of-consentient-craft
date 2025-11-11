import { HookSessionStartResponder } from './hook-session-start-responder';
import { HookSessionStartResponderProxy } from './hook-session-start-responder.proxy';
import { SessionStartHookStub } from '../../../contracts/session-start-hook-data/session-start-hook-data.stub';

describe('HookSessionStartResponder', () => {
  describe('New Session', () => {
    it('VALID: {isNew: true, standardsContent: "content"} => returns {shouldOutput: true, content: formatted}', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub({ cwd: '/test/project' });
      const standardsContent = '# Project Standards\n\nFollow these guidelines...';

      proxy.setupIsNewSession({ isNew: true });
      proxy.setupStandardsLoad({ content: standardsContent });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/\[NEW SESSION\]/u);
      expect(result.content).toMatch(/<questmaestro-standards>/u);
      expect(result.content).toMatch(/# Project Standards\n\nFollow these guidelines\.\.\./u);
      expect(result.content).toMatch(
        /Please refer to these standards when writing, reviewing, or suggesting code changes/u,
      );
    });

    it('EMPTY: {isNew: true, standardsContent: ""} => returns {shouldOutput: false}', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();

      proxy.setupIsNewSession({ isNew: true });
      proxy.setupStandardsLoad({ content: '' });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldOutput: false,
      });
    });

    it('EMPTY: {isNew: true, standardsContent: "   \\n\\t  "} => returns {shouldOutput: false}', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();

      proxy.setupIsNewSession({ isNew: true });
      proxy.setupStandardsLoad({ content: '   \n\t  ' });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldOutput: false,
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

    it('VALID: {isNew: false, ALWAYS_LOAD: "true", standardsContent: "content"} => returns {shouldOutput: true, content: formatted with RESUMED SESSION}', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub({ cwd: '/test/project' });
      process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS = 'true';
      const standardsContent = '# Standards content';

      proxy.setupIsNewSession({ isNew: false });
      proxy.setupStandardsLoad({ content: standardsContent });

      const result = await HookSessionStartResponder({ input: hookData });

      delete process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS;

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/\[RESUMED SESSION\]/u);
      expect(result.content).toMatch(/# Standards content/u);
    });
  });

  describe('Environment Variables', () => {
    it('VALID: {isNew: false, ALWAYS_LOAD: "true"} => loads standards', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();
      process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS = 'true';
      const standardsContent = '# Test standards';

      proxy.setupIsNewSession({ isNew: false });
      proxy.setupStandardsLoad({ content: standardsContent });

      const result = await HookSessionStartResponder({ input: hookData });

      delete process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS;

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/# Test standards/u);
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

  describe('Standards Content Output', () => {
    it('VALID: output includes XML tags and instructions', async () => {
      const proxy = HookSessionStartResponderProxy();
      const hookData = SessionStartHookStub();
      const standardsContent = 'Test content';

      proxy.setupIsNewSession({ isNew: true });
      proxy.setupStandardsLoad({ content: standardsContent });

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/<questmaestro-standards>/u);
      expect(result.content).toMatch(/<\/questmaestro-standards>/u);
      expect(result.content).toMatch(/Test content/u);
      expect(result.content).toMatch(
        /Please refer to these standards when writing, reviewing, or suggesting code changes/u,
      );
    });
  });
});
