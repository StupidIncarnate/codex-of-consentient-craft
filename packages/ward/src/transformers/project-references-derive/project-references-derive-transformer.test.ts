import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';
import { TsconfigReferenceStub } from '../../contracts/tsconfig-reference/tsconfig-reference.stub';
import { projectReferencesDeriveTransformer } from './project-references-derive-transformer';

const pkg = (value: string) => PackageJsonStub({ name: value }).name!;

describe('projectReferencesDeriveTransformer', () => {
  describe('two packages, one depends on the other', () => {
    it('VALID: {orchestrator depends on shared} => orchestrator refs shared, root has both in topo order', () => {
      const sharedPath = ProjectFolderStub({ path: '/repo/packages/shared' }).path;
      const orchPath = ProjectFolderStub({ path: '/repo/packages/orchestrator' }).path;
      const sharedName = pkg('@dm/shared');
      const orchName = pkg('@dm/orchestrator');

      const result = projectReferencesDeriveTransformer({
        workspaces: [
          {
            projectPath: sharedPath,
            packageName: sharedName,
            dependencyNames: [],
            isCompositeEligible: true,
          },
          {
            projectPath: orchPath,
            packageName: orchName,
            dependencyNames: [sharedName],
            isCompositeEligible: true,
          },
        ],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        cycle: null,
        perPackage: new Map([
          [sharedPath, []],
          [orchPath, [TsconfigReferenceStub({ path: '../shared' })]],
        ]),
        root: [
          TsconfigReferenceStub({ path: './packages/shared' }),
          TsconfigReferenceStub({ path: './packages/orchestrator' }),
        ],
      });
    });
  });

  describe('three packages linear chain', () => {
    it('VALID: {a depends on b, b depends on c} => root order is [c, b, a]', () => {
      const pathC = ProjectFolderStub({ path: '/repo/packages/c' }).path;
      const pathB = ProjectFolderStub({ path: '/repo/packages/b' }).path;
      const pathA = ProjectFolderStub({ path: '/repo/packages/a' }).path;
      const nameC = pkg('@dm/c');
      const nameB = pkg('@dm/b');
      const nameA = pkg('@dm/a');

      const result = projectReferencesDeriveTransformer({
        workspaces: [
          {
            projectPath: pathA,
            packageName: nameA,
            dependencyNames: [nameB],
            isCompositeEligible: true,
          },
          {
            projectPath: pathB,
            packageName: nameB,
            dependencyNames: [nameC],
            isCompositeEligible: true,
          },
          {
            projectPath: pathC,
            packageName: nameC,
            dependencyNames: [],
            isCompositeEligible: true,
          },
        ],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        cycle: null,
        perPackage: new Map([
          [pathA, [TsconfigReferenceStub({ path: '../b' })]],
          [pathB, [TsconfigReferenceStub({ path: '../c' })]],
          [pathC, []],
        ]),
        root: [
          TsconfigReferenceStub({ path: './packages/c' }),
          TsconfigReferenceStub({ path: './packages/b' }),
          TsconfigReferenceStub({ path: './packages/a' }),
        ],
      });
    });
  });

  describe('one eligible and one ineligible workspace', () => {
    it('VALID: {ineligible workspace present} => only eligible workspace appears in output', () => {
      const eligiblePath = ProjectFolderStub({ path: '/repo/packages/shared' }).path;
      const ineligiblePath = ProjectFolderStub({ path: '/repo/packages/other' }).path;
      const eligibleName = pkg('@dm/shared');
      const ineligibleName = pkg('@dm/other');

      const result = projectReferencesDeriveTransformer({
        workspaces: [
          {
            projectPath: eligiblePath,
            packageName: eligibleName,
            dependencyNames: [],
            isCompositeEligible: true,
          },
          {
            projectPath: ineligiblePath,
            packageName: ineligibleName,
            dependencyNames: [],
            isCompositeEligible: false,
          },
        ],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        cycle: null,
        perPackage: new Map([[eligiblePath, []]]),
        root: [TsconfigReferenceStub({ path: './packages/shared' })],
      });
    });
  });

  describe('eligible workspace with no in-monorepo deps', () => {
    it('VALID: {package with no monorepo deps} => empty refs array for that package', () => {
      const pkgPath = ProjectFolderStub({ path: '/repo/packages/leaf' }).path;
      const pkgName = pkg('@dm/leaf');

      const result = projectReferencesDeriveTransformer({
        workspaces: [
          {
            projectPath: pkgPath,
            packageName: pkgName,
            dependencyNames: [],
            isCompositeEligible: true,
          },
        ],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        cycle: null,
        perPackage: new Map([[pkgPath, []]]),
        root: [TsconfigReferenceStub({ path: './packages/leaf' })],
      });
    });
  });

  describe('cycle detection', () => {
    it('INVALID: {a depends on b, b depends on a} => returns cycle, perPackage and root empty', () => {
      const pathA = ProjectFolderStub({ path: '/repo/packages/a' }).path;
      const pathB = ProjectFolderStub({ path: '/repo/packages/b' }).path;
      const nameA = pkg('@dm/a');
      const nameB = pkg('@dm/b');

      const result = projectReferencesDeriveTransformer({
        workspaces: [
          {
            projectPath: pathA,
            packageName: nameA,
            dependencyNames: [nameB],
            isCompositeEligible: true,
          },
          {
            projectPath: pathB,
            packageName: nameB,
            dependencyNames: [nameA],
            isCompositeEligible: true,
          },
        ],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        perPackage: new Map(),
        root: [],
        cycle: [nameA, nameB, nameA],
      });
    });
  });

  describe('workspace missing packageName', () => {
    it('VALID: {workspace without packageName} => ignored, not in output', () => {
      const pkgPath = ProjectFolderStub({ path: '/repo/packages/unnamed' }).path;

      const result = projectReferencesDeriveTransformer({
        workspaces: [
          {
            projectPath: pkgPath,
            dependencyNames: [],
            isCompositeEligible: true,
          },
        ],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        cycle: null,
        perPackage: new Map(),
        root: [],
      });
    });
  });

  describe('empty workspaces', () => {
    it('EMPTY: {workspaces: []} => returns empty output', () => {
      const result = projectReferencesDeriveTransformer({
        workspaces: [],
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({ perPackage: new Map(), root: [], cycle: null });
    });
  });
});
