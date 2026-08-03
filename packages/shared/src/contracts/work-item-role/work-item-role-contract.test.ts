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

    it('VALID: blightwarden-minion => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'blightwarden-minion' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('blightwarden-minion');
    });

    it('VALID: blightwarden-crosscut-minion => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'blightwarden-crosscut-minion' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('blightwarden-crosscut-minion');
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

    it('INVALID: lawbringer => throws validation error (removed role)', () => {
      expect(() => {
        workItemRoleContract.parse('lawbringer');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: blightwarden-security-minion => throws validation error (removed role)', () => {
      expect(() => {
        workItemRoleContract.parse('blightwarden-security-minion');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: blightwarden-dedup-minion => throws validation error (removed role)', () => {
      expect(() => {
        workItemRoleContract.parse('blightwarden-dedup-minion');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: blightwarden-perf-minion => throws validation error (removed role)', () => {
      expect(() => {
        workItemRoleContract.parse('blightwarden-perf-minion');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: blightwarden-integrity-minion => throws validation error (removed role)', () => {
      expect(() => {
        workItemRoleContract.parse('blightwarden-integrity-minion');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: blightwarden-dead-code-minion => throws validation error (removed role)', () => {
      expect(() => {
        workItemRoleContract.parse('blightwarden-dead-code-minion');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
