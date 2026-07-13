import { FloorNameStub } from '../../contracts/floor-name/floor-name.stub';
import { WorkItemRoleStub } from '../../contracts/work-item-role/work-item-role.stub';
import { executionFloorConfigStatics } from '../../statics/execution-floor-config/execution-floor-config-statics';

import { roleToConfigIndexTransformer } from './role-to-config-index-transformer';

// Derive the [role, expectedIndex] matrix from the canonical floor config so this test cannot
// go stale as the config grows. Each single-floor role maps to its first-occurrence index; stop
// before 'ward' (whose two entries are covered separately in the floorName disambiguation block).
const FIRST_WARD_INDEX = executionFloorConfigStatics.floors.findIndex((f) => f.role === 'ward');
const SINGLE_FLOOR_ROLE_INDEXES = executionFloorConfigStatics.floors
  .map((floor, index) => [floor.role, index] as const)
  .filter(
    ([role, index]) =>
      index < FIRST_WARD_INDEX &&
      index === executionFloorConfigStatics.floors.findIndex((f) => f.role === role),
  );

describe('roleToConfigIndexTransformer', () => {
  describe('known roles', () => {
    it.each(SINGLE_FLOOR_ROLE_INDEXES)(
      'VALID: {role: %s} => returns %i (first-occurrence config index)',
      (role, expectedIndex) => {
        const result = roleToConfigIndexTransformer({
          role: WorkItemRoleStub({ value: role }),
        });

        expect(result).toBe(expectedIndex);
      },
    );
  });

  describe('ward floorName disambiguation', () => {
    it('VALID: {role: ward, no floorName} => returns 4 (first ward / MINI BOSS entry)', () => {
      const result = roleToConfigIndexTransformer({
        role: WorkItemRoleStub({ value: 'ward' }),
      });

      expect(result).toBe(4);
    });

    it('VALID: {role: ward, floorName: MINI BOSS} => returns 4 (MINI BOSS entry)', () => {
      const result = roleToConfigIndexTransformer({
        role: WorkItemRoleStub({ value: 'ward' }),
        floorName: FloorNameStub({ value: 'MINI BOSS' }),
      });

      expect(result).toBe(4);
    });

    it('VALID: {role: ward, floorName: FLOOR BOSS} => returns 15 (FLOOR BOSS entry, last floor)', () => {
      const result = roleToConfigIndexTransformer({
        role: WorkItemRoleStub({ value: 'ward' }),
        floorName: FloorNameStub({ value: 'FLOOR BOSS' }),
      });

      expect(result).toBe(15);
    });
  });

  describe('out-of-config sentinel', () => {
    it('EDGE: {role not in floor config} => returns floors.length sentinel', () => {
      // Every WorkItemRole is now mapped, so exercise the -1 → floors.length fallback with an
      // out-of-enum value (WorkItemRoleStub cannot build an invalid role — pass `as never`).
      const result = roleToConfigIndexTransformer({ role: 'not-a-role' as never });

      expect(result).toBe(executionFloorConfigStatics.floors.length);
    });
  });
});
