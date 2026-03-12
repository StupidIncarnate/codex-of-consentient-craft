import { chatRoleContract } from './chat-role-contract';
import { ChatRoleStub } from './chat-role.stub';

describe('chatRoleContract', () => {
  describe('valid values', () => {
    it('VALID: {chaoswhisperer} => parses successfully', () => {
      const result = ChatRoleStub({ value: 'chaoswhisperer' });

      expect(result).toBe('chaoswhisperer');
    });

    it('VALID: {glyphsmith} => parses successfully', () => {
      const result = ChatRoleStub({ value: 'glyphsmith' });

      expect(result).toBe('glyphsmith');
    });
  });

  describe('invalid values', () => {
    it('INVALID_ROLE: {unknown role} => throws ZodError', () => {
      expect(() => chatRoleContract.parse('unknown')).toThrow(/Invalid enum value/u);
    });
  });
});
