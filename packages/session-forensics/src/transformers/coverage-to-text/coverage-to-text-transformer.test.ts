import { coverageToTextTransformer } from './coverage-to-text-transformer';
import { TrackCoverageStub } from '../../contracts/track-coverage/track-coverage.stub';

const NOT_AUTHORITATIVE_LINE =
  'NOT AUTHORITATIVE — get-qa-checklist({questId, operationItemId}) is the real denominator.';
const HEADER_LINE = '  track                    OWED  signed  confirmed  unconfirmable  UNSIGNED';

describe('coverageToTextTransformer', () => {
  describe('one flow, three rows', () => {
    it('VALID: {three tracks on one flow} => flow id, header, one row per track, then the caveat', () => {
      const coverage = [
        TrackCoverageStub({ flowId: 'flow-one', track: 'codeweaverSignoff' }),
        TrackCoverageStub({
          flowId: 'flow-one',
          track: 'flowriderSignoff',
          owed: 10,
          signed: 8,
          confirmed: 8,
          unconfirmable: 0,
          unsigned: 2,
        }),
        TrackCoverageStub({
          flowId: 'flow-one',
          track: 'siegemasterSignoff',
          owed: 20,
          signed: 15,
          confirmed: 10,
          unconfirmable: 5,
          unsigned: 5,
        }),
      ];

      const result = coverageToTextTransformer({ coverage });

      expect(String(result)).toBe(
        [
          'flow-one',
          HEADER_LINE,
          '  codeweaverSignoff          58      58         55              3         0',
          '  flowriderSignoff           10       8          8              0         2',
          '  siegemasterSignoff         20      15         10              5         5',
          '',
          NOT_AUTHORITATIVE_LINE,
        ].join('\n'),
      );
    });
  });

  describe('two flows, six rows', () => {
    it('VALID: {two flows of three tracks each} => grouped by flow, blank line between, first-seen flow order', () => {
      const coverage = [
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'codeweaverSignoff',
          owed: 5,
          signed: 5,
          confirmed: 5,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'flowriderSignoff',
          owed: 5,
          signed: 4,
          confirmed: 4,
          unconfirmable: 0,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'siegemasterSignoff',
          owed: 7,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 7,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'codeweaverSignoff',
          owed: 3,
          signed: 3,
          confirmed: 2,
          unconfirmable: 1,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'flowriderSignoff',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'siegemasterSignoff',
          owed: 7,
          signed: 1,
          confirmed: 1,
          unconfirmable: 0,
          unsigned: 6,
        }),
      ];

      const result = coverageToTextTransformer({ coverage });

      expect(String(result)).toBe(
        [
          'flow-alpha',
          HEADER_LINE,
          '  codeweaverSignoff           5       5          5              0         0',
          '  flowriderSignoff            5       4          4              0         1',
          '  siegemasterSignoff          7       0          0              0         7',
          '',
          'flow-beta',
          HEADER_LINE,
          '  codeweaverSignoff           3       3          2              1         0',
          '  flowriderSignoff            0       0          0              0         0',
          '  siegemasterSignoff          7       1          1              0         6',
          '',
          NOT_AUTHORITATIVE_LINE,
        ].join('\n'),
      );
    });
  });

  describe('empty input', () => {
    it("EMPTY: {coverage: []} => returns ''", () => {
      const result = coverageToTextTransformer({ coverage: [] });

      expect(String(result)).toBe('');
    });
  });

  describe('track that never ran', () => {
    it('EDGE: {unsigned equals owed} => a fully-unsigned row still renders with the caveat', () => {
      const coverage = [
        TrackCoverageStub({
          flowId: 'flow-never-ran',
          track: 'flowriderSignoff',
          owed: 6,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 6,
        }),
      ];

      const result = coverageToTextTransformer({ coverage });

      expect(String(result)).toBe(
        [
          'flow-never-ran',
          HEADER_LINE,
          '  flowriderSignoff            6       0          0              0         6',
          '',
          NOT_AUTHORITATIVE_LINE,
        ].join('\n'),
      );
    });
  });

  describe('non-zero unconfirmable', () => {
    it('VALID: {unconfirmable: 3} => the unconfirmable column carries the non-zero count', () => {
      const coverage = [TrackCoverageStub({ flowId: 'flow-unconfirmable' })];

      const result = coverageToTextTransformer({ coverage });

      expect(String(result)).toBe(
        [
          'flow-unconfirmable',
          HEADER_LINE,
          '  codeweaverSignoff          58      58         55              3         0',
          '',
          NOT_AUTHORITATIVE_LINE,
        ].join('\n'),
      );
    });
  });
});
