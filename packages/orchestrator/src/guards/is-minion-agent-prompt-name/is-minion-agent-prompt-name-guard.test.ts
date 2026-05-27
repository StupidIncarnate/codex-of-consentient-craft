import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { isMinionAgentPromptNameGuard } from './is-minion-agent-prompt-name-guard';

describe('isMinionAgentPromptNameGuard', () => {
  describe('minion names', () => {
    it('VALID: {agentName: "chaoswhisperer-gap-minion"} => returns true', () => {
      expect(
        isMinionAgentPromptNameGuard({
          agentName: AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' }),
        }),
      ).toBe(true);
    });

    it('VALID: {agentName: "blightwarden-security-minion"} => returns true', () => {
      expect(
        isMinionAgentPromptNameGuard({
          agentName: AgentPromptNameStub({ value: 'blightwarden-security-minion' }),
        }),
      ).toBe(true);
    });

    it('VALID: {agentName: "blightwarden-dedup-minion"} => returns true', () => {
      expect(
        isMinionAgentPromptNameGuard({
          agentName: AgentPromptNameStub({ value: 'blightwarden-dedup-minion' }),
        }),
      ).toBe(true);
    });

    it('VALID: {agentName: "blightwarden-perf-minion"} => returns true', () => {
      expect(
        isMinionAgentPromptNameGuard({
          agentName: AgentPromptNameStub({ value: 'blightwarden-perf-minion' }),
        }),
      ).toBe(true);
    });

    it('VALID: {agentName: "blightwarden-integrity-minion"} => returns true', () => {
      expect(
        isMinionAgentPromptNameGuard({
          agentName: AgentPromptNameStub({ value: 'blightwarden-integrity-minion' }),
        }),
      ).toBe(true);
    });

    it('VALID: {agentName: "blightwarden-dead-code-minion"} => returns true', () => {
      expect(
        isMinionAgentPromptNameGuard({
          agentName: AgentPromptNameStub({ value: 'blightwarden-dead-code-minion' }),
        }),
      ).toBe(true);
    });
  });

  describe('role names', () => {
    it('VALID: {agentName: "pathseeker-surface"} => returns false', () => {
      expect(
        isMinionAgentPromptNameGuard({
          agentName: AgentPromptNameStub({ value: 'pathseeker-surface' }),
        }),
      ).toBe(false);
    });

    it('VALID: {agentName: "codeweaver"} => returns false', () => {
      expect(
        isMinionAgentPromptNameGuard({
          agentName: AgentPromptNameStub({ value: 'codeweaver' }),
        }),
      ).toBe(false);
    });

    it('VALID: {agentName: "blightwarden"} => returns false (parent, not minion)', () => {
      expect(
        isMinionAgentPromptNameGuard({
          agentName: AgentPromptNameStub({ value: 'blightwarden' }),
        }),
      ).toBe(false);
    });
  });

  describe('absent', () => {
    it('EMPTY: {agentName: undefined} => returns false', () => {
      expect(isMinionAgentPromptNameGuard({})).toBe(false);
    });
  });
});
