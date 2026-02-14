import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { AgentRoleStub } from '../../contracts/agent-role/agent-role.stub';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { lawbringerPromptStatics } from '../../statics/lawbringer-prompt/lawbringer-prompt-statics';
import { pathseekerPromptStatics } from '../../statics/pathseeker-prompt/pathseeker-prompt-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { resolveServerUrlTransformer } from '../resolve-server-url/resolve-server-url-transformer';
import { roleToPromptTemplateTransformer } from './role-to-prompt-template-transformer';

describe('roleToPromptTemplateTransformer', () => {
  describe('valid roles', () => {
    it('VALID: {role: codeweaver} => returns codeweaver prompt template with resolved URL', () => {
      const role = AgentRoleStub({ value: 'codeweaver' });

      const result = roleToPromptTemplateTransformer({ role });

      const expected = resolveServerUrlTransformer({
        template: ContentTextStub({ value: codeweaverPromptStatics.prompt.template }),
      });

      expect(result).toStrictEqual(expected);
    });

    it('VALID: {role: pathseeker} => returns pathseeker prompt template with resolved URL', () => {
      const role = AgentRoleStub({ value: 'pathseeker' });

      const result = roleToPromptTemplateTransformer({ role });

      const expected = resolveServerUrlTransformer({
        template: ContentTextStub({ value: pathseekerPromptStatics.prompt.template }),
      });

      expect(result).toStrictEqual(expected);
    });

    it('VALID: {role: siegemaster} => returns siegemaster prompt template with resolved URL', () => {
      const role = AgentRoleStub({ value: 'siegemaster' });

      const result = roleToPromptTemplateTransformer({ role });

      const expected = resolveServerUrlTransformer({
        template: ContentTextStub({ value: siegemasterPromptStatics.prompt.template }),
      });

      expect(result).toStrictEqual(expected);
    });

    it('VALID: {role: lawbringer} => returns lawbringer prompt template with resolved URL', () => {
      const role = AgentRoleStub({ value: 'lawbringer' });

      const result = roleToPromptTemplateTransformer({ role });

      const expected = resolveServerUrlTransformer({
        template: ContentTextStub({ value: lawbringerPromptStatics.prompt.template }),
      });

      expect(result).toStrictEqual(expected);
    });

    it('VALID: {role: spiritmender} => returns spiritmender prompt template with resolved URL', () => {
      const role = AgentRoleStub({ value: 'spiritmender' });

      const result = roleToPromptTemplateTransformer({ role });

      const expected = resolveServerUrlTransformer({
        template: ContentTextStub({ value: spiritmenderPromptStatics.prompt.template }),
      });

      expect(result).toStrictEqual(expected);
    });
  });
});
