import { coverageToTextTransformer } from './coverage-to-text-transformer';
import { TrackCoverageStub } from '../../contracts/track-coverage/track-coverage.stub';

const CAVEAT_LINE_ONE = 'These counts can be too high.';
const CAVEAT_LINE_TWO =
  'This reading has no operation item, so it counts rows a real checklist would leave out.';
const CAVEAT_LINE_THREE =
  'For the exact numbers, ask get-qa-checklist({questId, operationItemId}).';
const HEADER_LINE =
  "  sign-off track         REQUIRED  signed  confirmed  can't confirm  NOT SIGNED";

describe('coverageToTextTransformer', () => {
  describe('one flow, three rows', () => {
    it('VALID: {three tracks on one flow} => flow id, header, one row per track, then the caveat', () => {
      const coverage = [
        TrackCoverageStub({ flowId: 'flow-one', track: 'codeweaver' }),
        TrackCoverageStub({
          flowId: 'flow-one',
          track: 'flowrider',
          owed: 10,
          signed: 8,
          confirmed: 8,
          unconfirmable: 0,
          unsigned: 2,
        }),
        TrackCoverageStub({
          flowId: 'flow-one',
          track: 'siegemaster',
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
          'Flow flow-one',
          HEADER_LINE,
          '  codeweaver                   58      58         55              3           0',
          '  flowrider                    10       8          8              0           2',
          '  siegemaster                  20      15         10              5           5',
          '',
          CAVEAT_LINE_ONE,
          CAVEAT_LINE_TWO,
          CAVEAT_LINE_THREE,
        ].join('\n'),
      );
    });
  });

  describe('two flows, six rows', () => {
    it('VALID: {two flows of three tracks each} => grouped by flow, blank line between, first-seen flow order', () => {
      const coverage = [
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'codeweaver',
          owed: 5,
          signed: 5,
          confirmed: 5,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'flowrider',
          owed: 5,
          signed: 4,
          confirmed: 4,
          unconfirmable: 0,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'siegemaster',
          owed: 7,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 7,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'codeweaver',
          owed: 3,
          signed: 3,
          confirmed: 2,
          unconfirmable: 1,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'flowrider',
          owed: 0,
          signed: 0,
          confirmed: 0,
          unconfirmable: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'siegemaster',
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
          'Flow flow-alpha',
          HEADER_LINE,
          '  codeweaver                    5       5          5              0           0',
          '  flowrider                     5       4          4              0           1',
          '  siegemaster                   7       0          0              0           7',
          '',
          'Flow flow-beta',
          HEADER_LINE,
          '  codeweaver                    3       3          2              1           0',
          '  flowrider                     0       0          0              0           0',
          '  siegemaster                   7       1          1              0           6',
          '',
          CAVEAT_LINE_ONE,
          CAVEAT_LINE_TWO,
          CAVEAT_LINE_THREE,
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
          track: 'flowrider',
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
          'Flow flow-never-ran',
          HEADER_LINE,
          '  flowrider                     6       0          0              0           6',
          '',
          CAVEAT_LINE_ONE,
          CAVEAT_LINE_TWO,
          CAVEAT_LINE_THREE,
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
          'Flow flow-unconfirmable',
          HEADER_LINE,
          '  codeweaver                   58      58         55              3           0',
          '',
          CAVEAT_LINE_ONE,
          CAVEAT_LINE_TWO,
          CAVEAT_LINE_THREE,
        ].join('\n'),
      );
    });
  });
});
