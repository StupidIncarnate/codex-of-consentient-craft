import { ExecutionRoleStub } from '../../contracts/execution-role/execution-role.stub';
import { FloorNameStub } from '../../contracts/floor-name/floor-name.stub';

import { roleToConfigIndexTransformer } from './role-to-config-index-transformer';

describe('roleToConfigIndexTransformer', () => {
  describe('known roles', () => {
    it('VALID: {role: chaoswhisperer} => returns 0 (first in config)', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'chaoswhisperer' }),
      });

      expect(result).toBe(0);
    });

    it('VALID: {role: glyphsmith} => returns 1', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'glyphsmith' }),
      });

      expect(result).toBe(1);
    });

    it('VALID: {role: pathseeker-surface} => returns 2', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker-surface' }),
      });

      expect(result).toBe(2);
    });

    it('VALID: {role: pathseeker-dedup} => returns 3', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker-dedup' }),
      });

      expect(result).toBe(3);
    });

    it('VALID: {role: pathseeker-assertion-correctness} => returns 4', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker-assertion-correctness' }),
      });

      expect(result).toBe(4);
    });

    it('VALID: {role: pathseeker-walk} => returns 5', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker-walk' }),
      });

      expect(result).toBe(5);
    });

    it('VALID: {role: codeweaver} => returns 6', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toBe(6);
    });

    it('VALID: {role: pesteater} => returns 7 (EXTERMINATION floor, after codeweaver)', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pesteater' }),
      });

      expect(result).toBe(7);
    });
  });

  describe('ward floorName disambiguation', () => {
    it('VALID: {role: ward, no floorName} => returns 8 (first ward / MINI BOSS entry)', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'ward' }),
      });

      expect(result).toBe(8);
    });

    it('VALID: {role: ward, floorName: MINI BOSS} => returns 8 (MINI BOSS entry)', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'ward' }),
        floorName: FloorNameStub({ value: 'MINI BOSS' }),
      });

      expect(result).toBe(8);
    });

    it('VALID: {role: ward, floorName: FLOOR BOSS} => returns 19 (FLOOR BOSS entry, last floor)', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'ward' }),
        floorName: FloorNameStub({ value: 'FLOOR BOSS' }),
      });

      expect(result).toBe(19);
    });
  });

  describe('legacy fallback', () => {
    it('VALID: {role: pathseeker (legacy, not in config)} => returns floors.length sentinel', () => {
      const result = roleToConfigIndexTransformer({
        role: ExecutionRoleStub({ value: 'pathseeker' }),
      });

      // floors.length sentinel: 15 base floors (incl. flowrider's GLUEWORKS) + 5 blightwarden minion floors = 20.
      expect(result).toBe(20);
    });
  });
});
