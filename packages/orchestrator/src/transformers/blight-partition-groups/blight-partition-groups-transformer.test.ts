import { BlightChecklistItemStub } from '@dungeonmaster/shared/contracts';

import { blightPartitionStatics } from '../../statics/blight-partition/blight-partition-statics';
import { blightPartitionGroupsTransformer } from './blight-partition-groups-transformer';

// One more file than a single group holds, so the package is forced to split. Derived from the
// static rather than written out: the split is the static's meaning, and a literal here would keep
// passing while the number it is meant to be about changed underneath it.
const OVER_CAP_FILE_COUNT = blightPartitionStatics.targetFilesPerGroup + 1;

const ALPHA_FILES = Array.from(
  { length: OVER_CAP_FILE_COUNT },
  (_, index) => `packages/alpha/src/brokers/a-${String(index)}/a-${String(index)}-broker.ts`,
);
const BETA_FILES = [
  'packages/beta/src/guards/b/b-guard.ts',
  'packages/beta/src/guards/c/c-guard.ts',
];
const UNDECLARED_FILES = ['scripts/release.ts', 'eslint.config.ts'];

// Interleaved on purpose: a fixture whose files already arrive package-by-package cannot tell a
// real bucketing apart from one that just chunked the input in arrival order.
const MULTI_PACKAGE_ITEMS = [
  BlightChecklistItemStub({
    id: `${ALPHA_FILES[0]!}:craft`,
    implPath: ALPHA_FILES[0]!,
    packageName: 'alpha',
  }),
  BlightChecklistItemStub({
    id: `${BETA_FILES[0]!}:craft`,
    implPath: BETA_FILES[0]!,
    packageName: 'beta',
  }),
  BlightChecklistItemStub({
    id: `${ALPHA_FILES[1]!}:craft`,
    implPath: ALPHA_FILES[1]!,
    packageName: 'alpha',
  }),
  BlightChecklistItemStub({
    id: `${ALPHA_FILES[2]!}:craft`,
    implPath: ALPHA_FILES[2]!,
    packageName: 'alpha',
  }),
  BlightChecklistItemStub({
    id: `${BETA_FILES[1]!}:craft`,
    implPath: BETA_FILES[1]!,
    packageName: 'beta',
  }),
  BlightChecklistItemStub({
    id: `${ALPHA_FILES[3]!}:craft`,
    implPath: ALPHA_FILES[3]!,
    packageName: 'alpha',
  }),
  BlightChecklistItemStub({
    id: `${ALPHA_FILES[4]!}:craft`,
    implPath: ALPHA_FILES[4]!,
    packageName: 'alpha',
  }),
  BlightChecklistItemStub({
    id: `${ALPHA_FILES[5]!}:craft`,
    implPath: ALPHA_FILES[5]!,
    packageName: 'alpha',
  }),
  BlightChecklistItemStub({
    id: `${ALPHA_FILES[6]!}:craft`,
    implPath: ALPHA_FILES[6]!,
    packageName: 'alpha',
  }),
];

describe('blightPartitionGroupsTransformer', () => {
  describe('one group per package', () => {
    it('VALID: {two packages, both under the size cap} => one group each, neither mixing the two', () => {
      const groups = blightPartitionGroupsTransformer({
        items: [
          BlightChecklistItemStub({
            id: `${ALPHA_FILES[0]!}:craft`,
            implPath: ALPHA_FILES[0]!,
            packageName: 'alpha',
          }),
          BlightChecklistItemStub({
            id: `${BETA_FILES[0]!}:craft`,
            implPath: BETA_FILES[0]!,
            packageName: 'beta',
          }),
        ],
      });

      expect(groups).toStrictEqual([
        { packageName: 'alpha', implPaths: [ALPHA_FILES[0]!] },
        { packageName: 'beta', implPaths: [BETA_FILES[0]!] },
      ]);
    });

    it('VALID: {one file crossed with four concerns} => the file appears in exactly one group, once', () => {
      const groups = blightPartitionGroupsTransformer({
        items: [
          BlightChecklistItemStub({
            id: `${ALPHA_FILES[0]!}:craft`,
            implPath: ALPHA_FILES[0]!,
            concern: 'craft',
            packageName: 'alpha',
          }),
          BlightChecklistItemStub({
            id: `${ALPHA_FILES[0]!}:perf`,
            implPath: ALPHA_FILES[0]!,
            concern: 'perf',
            packageName: 'alpha',
          }),
          BlightChecklistItemStub({
            id: `${ALPHA_FILES[0]!}:dedup`,
            implPath: ALPHA_FILES[0]!,
            concern: 'dedup',
            packageName: 'alpha',
          }),
          BlightChecklistItemStub({
            id: `${ALPHA_FILES[0]!}:integrity`,
            implPath: ALPHA_FILES[0]!,
            concern: 'integrity',
            packageName: 'alpha',
          }),
        ],
      });

      expect(groups).toStrictEqual([{ packageName: 'alpha', implPaths: [ALPHA_FILES[0]!] }]);
    });
  });

  describe('the size cap splits a package, and only a package', () => {
    it('VALID: {one package with one file more than the cap} => two groups, both naming that same package', () => {
      const groups = blightPartitionGroupsTransformer({
        items: ALPHA_FILES.map((implPath) =>
          BlightChecklistItemStub({
            id: `${implPath}:craft`,
            implPath,
            packageName: 'alpha',
          }),
        ),
      });

      expect(groups).toStrictEqual([
        {
          packageName: 'alpha',
          implPaths: ALPHA_FILES.slice(0, blightPartitionStatics.targetFilesPerGroup),
        },
        {
          packageName: 'alpha',
          implPaths: ALPHA_FILES.slice(blightPartitionStatics.targetFilesPerGroup),
        },
      ]);
    });

    it('VALID: {two packages each holding one file} => two groups of one, never one group packed toward the target', () => {
      const groupSizes = blightPartitionGroupsTransformer({
        items: [
          BlightChecklistItemStub({
            id: `${ALPHA_FILES[0]!}:craft`,
            implPath: ALPHA_FILES[0]!,
            packageName: 'alpha',
          }),
          BlightChecklistItemStub({
            id: `${BETA_FILES[0]!}:craft`,
            implPath: BETA_FILES[0]!,
            packageName: 'beta',
          }),
        ],
      }).map((group) => group.implPaths.length);

      expect(groupSizes).toStrictEqual([1, 1]);
    });
  });

  describe('no group spans two packages', () => {
    it('VALID: {files interleaved across two packages, one of them over the cap} => every group carries exactly the one package it names', () => {
      const groups = blightPartitionGroupsTransformer({ items: MULTI_PACKAGE_ITEMS });

      expect(
        groups.map((group) => [
          ...new Set(
            group.implPaths.map(
              (implPath) =>
                MULTI_PACKAGE_ITEMS.find((item) => String(item.implPath) === String(implPath))
                  ?.packageName,
            ),
          ),
        ]),
      ).toStrictEqual(groups.map((group) => [group.packageName]));
    });

    it('VALID: {files interleaved across two packages, one of them over the cap} => each group holds only its package’s files, in arrival order', () => {
      const groups = blightPartitionGroupsTransformer({ items: MULTI_PACKAGE_ITEMS });
      const alphaPaths = MULTI_PACKAGE_ITEMS.filter(
        (item) => String(item.packageName) === 'alpha',
      ).map((item) => item.implPath);

      expect(groups).toStrictEqual([
        {
          packageName: 'alpha',
          implPaths: alphaPaths.slice(0, blightPartitionStatics.targetFilesPerGroup),
        },
        {
          packageName: 'alpha',
          implPaths: alphaPaths.slice(blightPartitionStatics.targetFilesPerGroup),
        },
        { packageName: 'beta', implPaths: BETA_FILES },
      ]);
    });

    it('VALID: {every file of a multi-package diff} => the groups partition those files — each appears exactly once', () => {
      const groups = blightPartitionGroupsTransformer({ items: MULTI_PACKAGE_ITEMS });

      expect(
        groups.flatMap((group) => group.implPaths.map((implPath) => String(implPath))).sort(),
      ).toStrictEqual(MULTI_PACKAGE_ITEMS.map((item) => String(item.implPath)).sort());
    });
  });

  describe('files under no declared package', () => {
    it('VALID: {one declared package plus two undeclared files} => the undeclared files get their own trailing group', () => {
      const groups = blightPartitionGroupsTransformer({
        items: [
          BlightChecklistItemStub({
            id: `${UNDECLARED_FILES[0]!}:craft`,
            implPath: UNDECLARED_FILES[0]!,
          }),
          BlightChecklistItemStub({
            id: `${ALPHA_FILES[0]!}:craft`,
            implPath: ALPHA_FILES[0]!,
            packageName: 'alpha',
          }),
          BlightChecklistItemStub({
            id: `${UNDECLARED_FILES[1]!}:craft`,
            implPath: UNDECLARED_FILES[1]!,
          }),
        ],
      });

      expect(groups).toStrictEqual([
        { packageName: 'alpha', implPaths: [ALPHA_FILES[0]!] },
        { packageName: undefined, implPaths: UNDECLARED_FILES },
      ]);
    });

    it('VALID: {only undeclared files, one more than the cap} => they split into several residual groups rather than one oversized one', () => {
      const undeclaredOverCap = Array.from(
        { length: OVER_CAP_FILE_COUNT },
        (_, index) => `scripts/task-${String(index)}.ts`,
      );

      const groups = blightPartitionGroupsTransformer({
        items: undeclaredOverCap.map((implPath) =>
          BlightChecklistItemStub({ id: `${implPath}:craft`, implPath }),
        ),
      });

      expect(groups).toStrictEqual([
        {
          packageName: undefined,
          implPaths: undeclaredOverCap.slice(0, blightPartitionStatics.targetFilesPerGroup),
        },
        {
          packageName: undefined,
          implPaths: undeclaredOverCap.slice(blightPartitionStatics.targetFilesPerGroup),
        },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {items: []} => returns no groups rather than one empty group', () => {
      expect(blightPartitionGroupsTransformer({ items: [] })).toStrictEqual([]);
    });
  });
});
