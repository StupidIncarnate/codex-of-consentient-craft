import { coverageToTextTransformer } from './coverage-to-text-transformer';
import { TrackCoverageStub } from '../../contracts/track-coverage/track-coverage.stub';

const CAVEAT_LINE_ONE = 'These counts can be too high.';
const CAVEAT_LINE_TWO =
  'This reading has no operation item, so it counts rows a real checklist would leave out.';
const CAVEAT_LINE_THREE = 'For the exact numbers, ask get-quest-work({questId, operationItemId}).';
const HEADER_LINE =
  "  sign-off track         REQUIRED  marked        met     can't meet    unmet    unmarked";

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
          met: 8,
          cantMeet: 0,
          unsigned: 2,
        }),
        TrackCoverageStub({
          flowId: 'flow-one',
          track: 'siegemaster',
          owed: 20,
          signed: 15,
          met: 10,
          cantMeet: 5,
          unsigned: 5,
        }),
      ];

      const result = coverageToTextTransformer({ coverage });

      expect(String(result)).toBe(
        [
          'Flow flow-one',
          HEADER_LINE,
          '  codeweaver                   58      58         55              3        0           0',
          '  flowrider                    10       8          8              0        0           2',
          '  siegemaster                  20      15         10              5        0           5',
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
          met: 5,
          cantMeet: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'flowrider',
          owed: 5,
          signed: 4,
          met: 4,
          cantMeet: 0,
          unsigned: 1,
        }),
        TrackCoverageStub({
          flowId: 'flow-alpha',
          track: 'siegemaster',
          owed: 7,
          signed: 0,
          met: 0,
          cantMeet: 0,
          unsigned: 7,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'codeweaver',
          owed: 3,
          signed: 3,
          met: 2,
          cantMeet: 1,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'flowrider',
          owed: 0,
          signed: 0,
          met: 0,
          cantMeet: 0,
          unsigned: 0,
        }),
        TrackCoverageStub({
          flowId: 'flow-beta',
          track: 'siegemaster',
          owed: 7,
          signed: 1,
          met: 1,
          cantMeet: 0,
          unsigned: 6,
        }),
      ];

      const result = coverageToTextTransformer({ coverage });

      expect(String(result)).toBe(
        [
          'Flow flow-alpha',
          HEADER_LINE,
          '  codeweaver                    5       5          5              0        0           0',
          '  flowrider                     5       4          4              0        0           1',
          '  siegemaster                   7       0          0              0        0           7',
          '',
          'Flow flow-beta',
          HEADER_LINE,
          '  codeweaver                    3       3          2              1        0           0',
          '  flowrider                     0       0          0              0        0           0',
          '  siegemaster                   7       1          1              0        0           6',
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
          met: 0,
          cantMeet: 0,
          unsigned: 6,
        }),
      ];

      const result = coverageToTextTransformer({ coverage });

      expect(String(result)).toBe(
        [
          'Flow flow-never-ran',
          HEADER_LINE,
          '  flowrider                     6       0          0              0        0           6',
          '',
          CAVEAT_LINE_ONE,
          CAVEAT_LINE_TWO,
          CAVEAT_LINE_THREE,
        ].join('\n'),
      );
    });
  });

  describe('non-zero cantMeet', () => {
    it('VALID: {cantMeet: 3} => the cantMeet column carries the non-zero count', () => {
      const coverage = [TrackCoverageStub({ flowId: 'flow-cant-meet' })];

      const result = coverageToTextTransformer({ coverage });

      expect(String(result)).toBe(
        [
          'Flow flow-cant-meet',
          HEADER_LINE,
          '  codeweaver                   58      58         55              3        0           0',
          '',
          CAVEAT_LINE_ONE,
          CAVEAT_LINE_TWO,
          CAVEAT_LINE_THREE,
        ].join('\n'),
      );
    });
  });

  describe('non-zero unmet', () => {
    it('VALID: {unmet: 3} => the unmet column carries the non-zero count', () => {
      const coverage = [
        TrackCoverageStub({
          flowId: 'flow-unmet',
          owed: 10,
          signed: 10,
          met: 6,
          cantMeet: 1,
          unmet: 3,
          unsigned: 0,
        }),
      ];

      const result = coverageToTextTransformer({ coverage });

      expect(String(result)).toBe(
        [
          'Flow flow-unmet',
          HEADER_LINE,
          '  codeweaver                   10      10          6              1        3           0',
          '',
          CAVEAT_LINE_ONE,
          CAVEAT_LINE_TWO,
          CAVEAT_LINE_THREE,
        ].join('\n'),
      );
    });
  });
});
