import { environmentStatics } from '@dungeonmaster/shared/statics';
import { AgentRoleStub } from '../../contracts/agent-role/agent-role.stub';
import { roleToPromptTemplateTransformer } from './role-to-prompt-template-transformer';

const PLACEHOLDER = environmentStatics.serverUrlPlaceholder;
const RESOLVED_HOST = `http://${environmentStatics.hostname}:`;

describe('roleToPromptTemplateTransformer', () => {
  describe('server URL resolution', () => {
    it('VALID: {role: codeweaver} => resolves {{SERVER_URL}} to actual hostname', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'codeweaver' }),
      });

      expect(result.includes(PLACEHOLDER)).toBe(false);
      expect(result.includes(RESOLVED_HOST)).toBe(true);
    });

    it('VALID: {role: pathseeker} => resolves {{SERVER_URL}} to actual hostname', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'pathseeker' }),
      });

      expect(result.includes(PLACEHOLDER)).toBe(false);
      expect(result.includes(RESOLVED_HOST)).toBe(true);
    });

    it('VALID: {role: siegemaster} => resolves {{SERVER_URL}} to actual hostname', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'siegemaster' }),
      });

      expect(result.includes(PLACEHOLDER)).toBe(false);
      expect(result.includes(RESOLVED_HOST)).toBe(true);
    });

    it('VALID: {role: lawbringer} => resolves {{SERVER_URL}} to actual hostname', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'lawbringer' }),
      });

      expect(result.includes(PLACEHOLDER)).toBe(false);
      expect(result.includes(RESOLVED_HOST)).toBe(true);
    });

    it('VALID: {role: spiritmender} => resolves {{SERVER_URL}} to actual hostname', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'spiritmender' }),
      });

      expect(result.includes(PLACEHOLDER)).toBe(false);
      expect(result.includes(RESOLVED_HOST)).toBe(true);
    });
  });
});
