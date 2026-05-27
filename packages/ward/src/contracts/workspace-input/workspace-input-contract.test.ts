import { workspaceInputContract } from './workspace-input-contract';
import { WorkspaceInputStub } from './workspace-input.stub';

describe('workspaceInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const result = workspaceInputContract.parse(
        WorkspaceInputStub({
          projectPath: '/repo/packages/shared',
          packageName: '@dm/shared',
          dependencyNames: ['@dm/other'],
          isCompositeEligible: true,
        }),
      );

      expect(result).toStrictEqual({
        projectPath: '/repo/packages/shared',
        packageName: '@dm/shared',
        dependencyNames: ['@dm/other'],
        isCompositeEligible: true,
      });
    });

    it('VALID: {packageName omitted} => parses without optional packageName', () => {
      const result = workspaceInputContract.parse({
        projectPath: '/repo/packages/unnamed',
        dependencyNames: [],
        isCompositeEligible: false,
      });

      expect(result).toStrictEqual({
        projectPath: '/repo/packages/unnamed',
        dependencyNames: [],
        isCompositeEligible: false,
      });
    });

    it('VALID: {dependencyNames omitted} => defaults to empty array', () => {
      const result = workspaceInputContract.parse({
        projectPath: '/repo/packages/shared',
        packageName: '@dm/shared',
        isCompositeEligible: true,
      });

      expect(result).toStrictEqual({
        projectPath: '/repo/packages/shared',
        packageName: '@dm/shared',
        dependencyNames: [],
        isCompositeEligible: true,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {projectPath missing} => throws validation error', () => {
      expect(() =>
        workspaceInputContract.parse({
          isCompositeEligible: true,
        }),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid workspace input', () => {
      const result = WorkspaceInputStub();

      expect(result).toStrictEqual({
        projectPath: '/repo/packages/shared',
        packageName: '@dm/shared',
        dependencyNames: [],
        isCompositeEligible: true,
      });
    });
  });
});
