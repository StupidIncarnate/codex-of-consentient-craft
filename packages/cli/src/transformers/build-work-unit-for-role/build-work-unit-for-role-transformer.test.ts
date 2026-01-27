import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { buildWorkUnitForRoleTransformer } from './build-work-unit-for-role-transformer';
import { buildWorkUnitForRoleTransformerProxy } from './build-work-unit-for-role-transformer.proxy';

describe('buildWorkUnitForRoleTransformer', () => {
  describe('codeweaver role', () => {
    it('VALID: {role: codeweaver, step} => returns CodeweaverWorkUnit', () => {
      buildWorkUnitForRoleTransformerProxy();
      const step = DependencyStepStub();

      const result = buildWorkUnitForRoleTransformer({ role: 'codeweaver', step });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        step,
      });
    });
  });

  describe('unsupported roles', () => {
    it('ERROR: {role: pathseeker, step} => throws error about requiring additional context', () => {
      buildWorkUnitForRoleTransformerProxy();
      const step = DependencyStepStub();

      expect(() => buildWorkUnitForRoleTransformer({ role: 'pathseeker', step })).toThrow(
        /Role "pathseeker" cannot be built from step alone/u,
      );
    });

    it('ERROR: {role: spiritmender, step} => throws error about requiring additional context', () => {
      buildWorkUnitForRoleTransformerProxy();
      const step = DependencyStepStub();

      expect(() => buildWorkUnitForRoleTransformer({ role: 'spiritmender', step })).toThrow(
        /Role "spiritmender" cannot be built from step alone/u,
      );
    });

    it('ERROR: {role: lawbringer, step} => throws error about requiring additional context', () => {
      buildWorkUnitForRoleTransformerProxy();
      const step = DependencyStepStub();

      expect(() => buildWorkUnitForRoleTransformer({ role: 'lawbringer', step })).toThrow(
        /Role "lawbringer" cannot be built from step alone/u,
      );
    });

    it('ERROR: {role: siegemaster, step} => throws error about requiring additional context', () => {
      buildWorkUnitForRoleTransformerProxy();
      const step = DependencyStepStub();

      expect(() => buildWorkUnitForRoleTransformer({ role: 'siegemaster', step })).toThrow(
        /Role "siegemaster" cannot be built from step alone/u,
      );
    });
  });
});
