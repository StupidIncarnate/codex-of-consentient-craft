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
  });
});
