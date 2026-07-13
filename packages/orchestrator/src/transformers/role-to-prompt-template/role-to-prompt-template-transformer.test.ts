import { AgentRoleStub } from '../../contracts/agent-role/agent-role.stub';
import { roleToPromptTemplateTransformer } from './role-to-prompt-template-transformer';

describe('roleToPromptTemplateTransformer', () => {
  describe('returns prompt template for each role', () => {
    it('VALID: {role: codeweaver} => returns codeweaver prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: spiritmender} => returns spiritmender prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'spiritmender' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: lawbringer} => returns lawbringer prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'lawbringer' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: flowrider} => returns flowrider prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'flowrider' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: siegemaster} => returns siegemaster prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'siegemaster' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: blightwarden-security-minion} => returns blightwarden security minion prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'blightwarden-security-minion' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: blightwarden-dedup-minion} => returns blightwarden dedup minion prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'blightwarden-dedup-minion' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: blightwarden-perf-minion} => returns blightwarden perf minion prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'blightwarden-perf-minion' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: blightwarden-integrity-minion} => returns blightwarden integrity minion prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'blightwarden-integrity-minion' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: blightwarden-dead-code-minion} => returns blightwarden dead code minion prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'blightwarden-dead-code-minion' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: blightwarden} => returns blightwarden prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'blightwarden' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: pesteater} => returns pesteater prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'pesteater' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('pathseeker family is not a valid agent role', () => {
    it.each([
      'pathseeker',
      'pathseeker-surface',
      'pathseeker-dedup',
      'pathseeker-assertion-correctness',
    ])('INVALID: {role: "%s"} => throws parsing the role', (value) => {
      expect(() => {
        AgentRoleStub({ value: value as never });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
