import { PruneAnswerStub } from '../../contracts/prune-answer/prune-answer.stub';
import { PruneRefusalStub } from '../../contracts/prune-refusal/prune-refusal.stub';
import { PruneRemovalStub } from '../../contracts/prune-removal/prune-removal.stub';
import { pruneAnswerRenderTransformer } from './prune-answer-render-transformer';

describe('pruneAnswerRenderTransformer', () => {
  describe('a full answer', () => {
    it('VALID: {one removed, one refused, one kind unchecked} => four lines, with the citing path verbatim in the refusal', () => {
      const answer = PruneAnswerStub();

      expect(pruneAnswerRenderTransformer({ answer })).toBe(
        'FREED: 4100MB (4299161600 bytes)\n' +
          'REMOVED: inst_9b2c (everything, 4100MB, 4299161600 bytes, tombstoned)\n' +
          'REFUSED: inst_1d09 (run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md)\n' +
          'NOT CHECKED: open-issue (no issue record exists on disk to check)\n',
      );
    });
  });

  describe('a kind-scoped removal', () => {
    it('VALID: {kind: video, tombstoned: false} => names the class taken and says the row was kept', () => {
      const answer = PruneAnswerStub({
        removed: [
          PruneRemovalStub({
            kind: 'video' as never,
            freedBytes: 3072 as never,
            freedMB: 0 as never,
            tombstoned: false,
          }),
        ],
        refused: [],
        unresolved: [],
      });

      expect(pruneAnswerRenderTransformer({ answer })).toBe(
        'FREED: 4100MB (4299161600 bytes)\n' +
          'REMOVED: inst_9b2c (video, 0MB, 3072 bytes, row kept)\n' +
          'REFUSED: none\n' +
          'NOT CHECKED: none\n',
      );
    });
  });

  describe('an empty answer', () => {
    it('EMPTY: {nothing matched} => REFUSED and NOT CHECKED are still printed, so an empty refusal never reads as "nothing cites any of this"', () => {
      const answer = PruneAnswerStub({
        freedMB: 0 as never,
        freedBytes: 0 as never,
        removed: [],
        refused: [],
        unresolved: [],
      });

      expect(pruneAnswerRenderTransformer({ answer })).toBe(
        'FREED: 0MB (0 bytes)\nREMOVED: none\nREFUSED: none\nNOT CHECKED: none\n',
      );
    });
  });

  describe('several refusals', () => {
    it('VALID: {two refusals} => both are listed, each with its own reason', () => {
      const answer = PruneAnswerStub({
        freedMB: 0 as never,
        freedBytes: 0 as never,
        removed: [],
        refused: [
          PruneRefusalStub(),
          PruneRefusalStub({
            id: 'inst_7f3a' as never,
            why: 'live — last beat 2s ago' as never,
          }),
        ],
        unresolved: [],
      });

      expect(pruneAnswerRenderTransformer({ answer })).toBe(
        'FREED: 0MB (0 bytes)\n' +
          'REMOVED: none\n' +
          'REFUSED: inst_1d09 (run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md), inst_7f3a (live — last beat 2s ago)\n' +
          'NOT CHECKED: none\n',
      );
    });
  });
});
