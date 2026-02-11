import { AgentRoleStub } from '../../contracts/agent-role/agent-role.stub';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { lawbringerPromptStatics } from '../../statics/lawbringer-prompt/lawbringer-prompt-statics';
import { pathseekerPromptStatics } from '../../statics/pathseeker-prompt/pathseeker-prompt-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { roleToPromptTemplateTransformer } from './role-to-prompt-template-transformer';

describe('roleToPromptTemplateTransformer', () => {
  describe('valid roles', () => {
    it('VALID: {role: codeweaver} => returns codeweaver prompt template', () => {
      const role = AgentRoleStub({ value: 'codeweaver' });

      const result = roleToPromptTemplateTransformer({ role });

      expect(result).toBe(codeweaverPromptStatics.prompt.template);
    });

    it('VALID: {role: pathseeker} => returns pathseeker prompt template', () => {
      const role = AgentRoleStub({ value: 'pathseeker' });

      const result = roleToPromptTemplateTransformer({ role });

      expect(result).toBe(pathseekerPromptStatics.prompt.template);
    });

    it('VALID: {role: siegemaster} => returns siegemaster prompt template', () => {
      const role = AgentRoleStub({ value: 'siegemaster' });

      const result = roleToPromptTemplateTransformer({ role });

      expect(result).toBe(siegemasterPromptStatics.prompt.template);
    });

    it('VALID: {role: lawbringer} => returns lawbringer prompt template', () => {
      const role = AgentRoleStub({ value: 'lawbringer' });

      const result = roleToPromptTemplateTransformer({ role });

      expect(result).toBe(lawbringerPromptStatics.prompt.template);
    });

    it('VALID: {role: spiritmender} => returns spiritmender prompt template', () => {
      const role = AgentRoleStub({ value: 'spiritmender' });

      const result = roleToPromptTemplateTransformer({ role });

      expect(result).toBe(spiritmenderPromptStatics.prompt.template);
    });
  });
});
