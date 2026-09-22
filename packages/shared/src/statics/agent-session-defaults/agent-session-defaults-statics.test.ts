import { agentSessionDefaultsStatics } from './agent-session-defaults-statics';

// The two values a settings file is allowed to carry for crossSessionInbound. Claude Code treats
// the key as tighten-only from a settings file, so 'accept' is rejected from one and must never
// appear here.
const TIGHTENING_INBOUND_VALUES = new Set(['refuse', 'hold']);

describe('agentSessionDefaultsStatics', () => {
  describe('settings', () => {
    it('VALID: {agentSessionDefaultsStatics} => exposes exactly the four session settings keys plus the subagent model env', () => {
      expect(agentSessionDefaultsStatics).toStrictEqual({
        settings: {
          crossSessionInbound: 'refuse',
          promptCacheTtl: '1h',
          subagentPromptCacheTtl: '1h',
          promptSuggestionEnabled: false,
        },
        env: {
          CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet',
        },
      });
    });

    it('VALID: {settings.subagentPromptCacheTtl} => holds the cache open past the five minutes a dispatched sub-agent runs for', () => {
      const { subagentPromptCacheTtl } = agentSessionDefaultsStatics.settings;

      expect(subagentPromptCacheTtl).toBe('1h');
    });

    it('VALID: {settings.promptCacheTtl} => pins the main conversation to the same window', () => {
      const { promptCacheTtl } = agentSessionDefaultsStatics.settings;

      expect(promptCacheTtl).toBe('1h');
    });

    it('VALID: {settings.promptSuggestionEnabled} => switches off the predicted next prompt an orchestrated session never reads', () => {
      const { promptSuggestionEnabled } = agentSessionDefaultsStatics.settings;

      expect(promptSuggestionEnabled).toBe(false);
    });

    it('VALID: {settings.crossSessionInbound} => picks a value a settings file may tighten to', () => {
      const { crossSessionInbound } = agentSessionDefaultsStatics.settings;

      expect(TIGHTENING_INBOUND_VALUES.has(crossSessionInbound)).toBe(true);
    });
  });

  describe('env', () => {
    it('VALID: {env} => names the only lever there is for the default sub-agent model', () => {
      const { env } = agentSessionDefaultsStatics;

      expect(env).toStrictEqual({ CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet' });
    });
  });
});
