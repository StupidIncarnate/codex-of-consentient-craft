import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';
import { packageDispatchOrderTransformer } from './package-dispatch-order-transformer';

describe('packageDispatchOrderTransformer', () => {
  describe('unknown packages ordering', () => {
    it('VALID: {unknown first} => packages with missing predictions are placed before known packages', () => {
      const folderA = ProjectFolderStub({ name: 'pkg-a' });
      const folderB = ProjectFolderStub({ name: 'pkg-b' });
      const folderC = ProjectFolderStub({ name: 'pkg-c' });

      const predictions = new Map([
        ['pkg-b', new Map([['unit', { durationMs: 1000, peakRssMB: null }]])],
      ]);

      const result = packageDispatchOrderTransformer({
        projectFolders: [folderA, folderB, folderC],
        predictions,
        checkTypes: ['unit'],
      });

      expect(result).toStrictEqual([folderA, folderC, folderB]);
    });

    it('VALID: {missing ANY check type} => package with partial prediction is treated as unknown and comes first', () => {
      const folderA = ProjectFolderStub({ name: 'pkg-a' });
      const folderB = ProjectFolderStub({ name: 'pkg-b' });

      const predictions = new Map([
        ['pkg-a', new Map([['lint', { durationMs: 500, peakRssMB: null }]])],
        [
          'pkg-b',
          new Map([
            ['lint', { durationMs: 300, peakRssMB: null }],
            ['unit', { durationMs: 200, peakRssMB: null }],
          ]),
        ],
      ]);

      const result = packageDispatchOrderTransformer({
        projectFolders: [folderB, folderA],
        predictions,
        checkTypes: ['lint', 'unit'],
      });

      expect(result).toStrictEqual([folderA, folderB]);
    });

    it('VALID: {multiple unknowns} => preserves input order among unknowns', () => {
      const folderA = ProjectFolderStub({ name: 'pkg-a' });
      const folderB = ProjectFolderStub({ name: 'pkg-b' });
      const folderC = ProjectFolderStub({ name: 'pkg-c' });

      const predictions = new Map();

      const result = packageDispatchOrderTransformer({
        projectFolders: [folderB, folderC, folderA],
        predictions,
        checkTypes: ['unit'],
      });

      expect(result).toStrictEqual([folderB, folderC, folderA]);
    });
  });

  describe('known packages duration ordering', () => {
    it('VALID: {longest first} => known packages sort by predicted duration descending', () => {
      const folderShort = ProjectFolderStub({ name: 'short' });
      const folderMedium = ProjectFolderStub({ name: 'medium' });
      const folderLong = ProjectFolderStub({ name: 'long' });

      const predictions = new Map([
        ['short', new Map([['unit', { durationMs: 100, peakRssMB: null }]])],
        ['medium', new Map([['unit', { durationMs: 500, peakRssMB: null }]])],
        ['long', new Map([['unit', { durationMs: 2000, peakRssMB: null }]])],
      ]);

      const result = packageDispatchOrderTransformer({
        projectFolders: [folderShort, folderMedium, folderLong],
        predictions,
        checkTypes: ['unit'],
      });

      expect(result).toStrictEqual([folderLong, folderMedium, folderShort]);
    });

    it('VALID: {sum across requested check types} => sorts by sum of durations of requested checks', () => {
      const folderA = ProjectFolderStub({ name: 'pkg-a' });
      const folderB = ProjectFolderStub({ name: 'pkg-b' });

      const predictions = new Map([
        [
          'pkg-a',
          new Map([
            ['lint', { durationMs: 300, peakRssMB: null }],
            ['unit', { durationMs: 300, peakRssMB: null }],
          ]),
        ],
        [
          'pkg-b',
          new Map([
            ['lint', { durationMs: 100, peakRssMB: null }],
            ['unit', { durationMs: 400, peakRssMB: null }],
          ]),
        ],
      ]);

      const result = packageDispatchOrderTransformer({
        projectFolders: [folderB, folderA],
        predictions,
        checkTypes: ['lint', 'unit'],
      });

      expect(result).toStrictEqual([folderA, folderB]);
    });

    it('VALID: {only requested check types count} => ignores durations of unrequested check types', () => {
      const folderA = ProjectFolderStub({ name: 'pkg-a' });
      const folderB = ProjectFolderStub({ name: 'pkg-b' });

      const predictions = new Map([
        [
          'pkg-a',
          new Map([
            ['lint', { durationMs: 100, peakRssMB: null }],
            ['unit', { durationMs: 5000, peakRssMB: null }],
          ]),
        ],
        [
          'pkg-b',
          new Map([
            ['lint', { durationMs: 200, peakRssMB: null }],
            ['unit', { durationMs: 50, peakRssMB: null }],
          ]),
        ],
      ]);

      const result = packageDispatchOrderTransformer({
        projectFolders: [folderA, folderB],
        predictions,
        checkTypes: ['lint'],
      });

      expect(result).toStrictEqual([folderB, folderA]);
    });

    it('VALID: {stable ties} => ties between known packages preserve their input order', () => {
      const folderA = ProjectFolderStub({ name: 'pkg-a' });
      const folderB = ProjectFolderStub({ name: 'pkg-b' });
      const folderC = ProjectFolderStub({ name: 'pkg-c' });

      const predictions = new Map([
        ['pkg-a', new Map([['unit', { durationMs: 500, peakRssMB: null }]])],
        ['pkg-b', new Map([['unit', { durationMs: 1000, peakRssMB: null }]])],
        ['pkg-c', new Map([['unit', { durationMs: 500, peakRssMB: null }]])],
      ]);

      const result = packageDispatchOrderTransformer({
        projectFolders: [folderA, folderB, folderC],
        predictions,
        checkTypes: ['unit'],
      });

      expect(result).toStrictEqual([folderB, folderA, folderC]);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {empty projectFolders} => returns empty array', () => {
      const result = packageDispatchOrderTransformer({
        projectFolders: [],
        predictions: new Map(),
        checkTypes: ['unit'],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty checkTypes} => preserves input order of all folders', () => {
      const folderA = ProjectFolderStub({ name: 'pkg-a' });
      const folderB = ProjectFolderStub({ name: 'pkg-b' });

      const result = packageDispatchOrderTransformer({
        projectFolders: [folderA, folderB],
        predictions: new Map(),
        checkTypes: [],
      });

      expect(result).toStrictEqual([folderA, folderB]);
    });
  });
});
