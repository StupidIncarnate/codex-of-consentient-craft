import { sessionDefaultsCreatorTransformer } from './session-defaults-creator-transformer';

describe('sessionDefaultsCreatorTransformer', () => {
  describe('settings block', () => {
    it('VALID: {no arguments} => returns the four root keys dungeonmaster init writes', () => {
      const result = sessionDefaultsCreatorTransformer();

      expect(result).toStrictEqual({
        crossSessionInbound: 'refuse',
        promptCacheTtl: '1h',
        subagentPromptCacheTtl: '1h',
        env: { CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet' },
      });
    });

    it('VALID: {no arguments} => holds a dispatched sub-agent cache open for an hour', () => {
      const { subagentPromptCacheTtl } = sessionDefaultsCreatorTransformer();

      expect(subagentPromptCacheTtl).toBe('1h');
    });

    it('VALID: {no arguments} => carries no hooks block, so it never disturbs the hook merge', () => {
      const { hooks } = sessionDefaultsCreatorTransformer();

      expect(hooks).toBe(undefined);
    });

    it('VALID: {no arguments} => carries no permissions block, which @dungeonmaster/mcp owns', () => {
      const { permissions } = sessionDefaultsCreatorTransformer();

      expect(permissions).toBe(undefined);
    });
  });
});
