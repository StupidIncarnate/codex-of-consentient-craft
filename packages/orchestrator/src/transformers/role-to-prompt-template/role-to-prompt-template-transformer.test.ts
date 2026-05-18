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

    it('VALID: {role: pathseeker} => returns pathseeker prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'pathseeker' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: pathseeker-surface} => returns pathseeker-surface prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'pathseeker-surface' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: pathseeker-dedup} => returns pathseeker-dedup prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'pathseeker-dedup' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: pathseeker-assertion-correctness} => returns pathseeker-assertion-correctness prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'pathseeker-assertion-correctness' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: pathseeker-walk} => returns pathseeker-walk prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'pathseeker-walk' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: siegemaster} => returns siegemaster prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'siegemaster' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: lawbringer} => returns lawbringer prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'lawbringer' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: spiritmender} => returns spiritmender prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'spiritmender' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('VALID: {role: blightwarden} => returns blightwarden prompt template', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'blightwarden' }),
      });

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
