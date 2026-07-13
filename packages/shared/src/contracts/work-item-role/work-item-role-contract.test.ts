import { workItemRoleContract } from './work-item-role-contract';
import { WorkItemRoleStub } from './work-item-role.stub';

describe('workItemRoleContract', () => {
  describe('valid roles', () => {
    it('VALID: chaoswhisperer => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('chaoswhisperer');
    });

    it('VALID: glyphsmith => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'glyphsmith' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('glyphsmith');
    });

    it('VALID: codeweaver => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'codeweaver' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('codeweaver');
    });

    it('VALID: ward => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'ward' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('ward');
    });

    it('VALID: spiritmender => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'spiritmender' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('spiritmender');
    });

    it('VALID: flowrider => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'flowrider' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('flowrider');
    });

    it('VALID: siegemaster => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'siegemaster' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('siegemaster');
    });

    it('VALID: lawbringer => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'lawbringer' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('lawbringer');
    });

    it('VALID: blightwarden-security-minion => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'blightwarden-security-minion' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('blightwarden-security-minion');
    });

    it('VALID: blightwarden-dedup-minion => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'blightwarden-dedup-minion' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('blightwarden-dedup-minion');
    });

    it('VALID: blightwarden-perf-minion => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'blightwarden-perf-minion' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('blightwarden-perf-minion');
    });

    it('VALID: blightwarden-integrity-minion => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'blightwarden-integrity-minion' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('blightwarden-integrity-minion');
    });

    it('VALID: blightwarden-dead-code-minion => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'blightwarden-dead-code-minion' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('blightwarden-dead-code-minion');
    });

    it('VALID: blightwarden => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'blightwarden' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('blightwarden');
    });

    it('VALID: pesteater => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'pesteater' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('pesteater');
    });

    it('VALID: {default} => defaults to codeweaver', () => {
      const role = WorkItemRoleStub();

      expect(role).toBe('codeweaver');
    });
  });

  describe('invalid roles', () => {
    it('INVALID: unknown role => throws validation error', () => {
      expect(() => {
        workItemRoleContract.parse('unknown_role');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: pathseeker => throws validation error (removed role)', () => {
      expect(() => {
        workItemRoleContract.parse('pathseeker');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: pathseeker-surface => throws validation error (removed role)', () => {
      expect(() => {
        workItemRoleContract.parse('pathseeker-surface');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
