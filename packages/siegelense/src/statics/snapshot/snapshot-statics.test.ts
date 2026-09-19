import { snapshotStatics } from './snapshot-statics';

describe('snapshotStatics', () => {
  describe('the whole object', () => {
    it('VALID: {snapshotStatics} => holds the store, the automatic suffixes, the limits, the numbering and the retention knob', () => {
      expect(snapshotStatics).toStrictEqual({
        store: {
          dirName: '.siegelense-snapshots',
          indexFileName: 'index.jsonl',
        },
        automatic: {
          startSuffix: ':start',
          endSuffix: ':end',
        },
        limits: {
          maxNameLength: 64,
        },
        numbering: {
          firstPayload: 1,
        },
        retention: {
          keepAutomatic: 40,
        },
        template: 'snapshot "{name}" recorded',
      });
    });
  });
});
