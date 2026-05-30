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

    it('VALID: pathseeker => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'pathseeker' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('pathseeker');
    });

    it('VALID: pathseeker-surface => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'pathseeker-surface' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('pathseeker-surface');
    });

    it('VALID: pathseeker-dedup => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'pathseeker-dedup' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('pathseeker-dedup');
    });

    it('VALID: pathseeker-assertion-correctness => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'pathseeker-assertion-correctness' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('pathseeker-assertion-correctness');
    });

    it('VALID: pathseeker-walk => parses successfully', () => {
      const role = WorkItemRoleStub({ value: 'pathseeker-walk' });

      const result = workItemRoleContract.parse(role);

      expect(result).toBe('pathseeker-walk');
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
  });
});
