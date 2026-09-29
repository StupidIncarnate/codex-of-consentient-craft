import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BoxReadingStub } from '../../contracts/box-reading/box-reading.stub';
import { stepReadingTextRenderTransformer } from './step-reading-text-render-transformer';

describe('stepReadingTextRenderTransformer', () => {
  describe('box', () => {
    it('VALID: {verb: box, geometry JSON} => one geometry line', () => {
      const reading = ContentTextStub({
        value: JSON.stringify(BoxReadingStub({ ref: 24, x: 472, y: 351, width: 260, height: 36 })),
      });

      expect(stepReadingTextRenderTransformer({ verb: 'box', reading })).toBe(
        'ref 24: 260×36 at (472, 351) — visible, in viewport (viewport 1280×720)',
      );
    });

    it('EDGE: {verb: box, reading is not JSON} => untouched', () => {
      const reading = ContentTextStub({ value: 'ref 9 is stale' });

      expect(stepReadingTextRenderTransformer({ verb: 'box', reading })).toBe('ref 9 is stale');
    });

    it('EDGE: {verb: box, JSON of another shape} => untouched', () => {
      const reading = ContentTextStub({ value: '{"ref":1}' });

      expect(stepReadingTextRenderTransformer({ verb: 'box', reading })).toBe('{"ref":1}');
    });
  });

  describe('seed', () => {
    it('VALID: {verb: seed, two bindings} => one summary line per binding, never the whole record', () => {
      const reading = ContentTextStub({
        value: JSON.stringify({
          guild: { id: 'g1', name: 'Siege Guild', urlSlug: 'siege-guild', paths: ['a', 'b'] },
          quest: {
            id: 'd4581716',
            title: 'Advancing quest',
            status: 'in_progress',
            workItems: [{ id: 'w1' }],
          },
        }),
      });

      expect(stepReadingTextRenderTransformer({ verb: 'seed', reading })).toBe(
        'SEEDED:\n' +
          '  guild: g1 (name: Siege Guild, urlSlug: siege-guild)\n' +
          '  quest: d4581716 (title: Advancing quest, status: in_progress)',
      );
    });

    it('EMPTY: {verb: seed, {}} => SEEDED empty', () => {
      const reading = ContentTextStub({ value: '{}' });

      expect(stepReadingTextRenderTransformer({ verb: 'seed', reading })).toBe('SEEDED: (empty)');
    });

    it('EDGE: {verb: seed, reading is not JSON} => untouched', () => {
      const reading = ContentTextStub({ value: 'seed failed' });

      expect(stepReadingTextRenderTransformer({ verb: 'seed', reading })).toBe('seed failed');
    });

    it('EDGE: {verb: seed, JSON is an array} => untouched', () => {
      const reading = ContentTextStub({ value: '[1]' });

      expect(stepReadingTextRenderTransformer({ verb: 'seed', reading })).toBe('[1]');
    });
  });

  describe('other verbs', () => {
    it('VALID: {verb: click, JSON-looking reading} => untouched', () => {
      const reading = ContentTextStub({ value: '{"ref":1}' });

      expect(stepReadingTextRenderTransformer({ verb: 'click', reading })).toBe('{"ref":1}');
    });

    it('EMPTY: {verb: null} => untouched', () => {
      const reading = ContentTextStub({ value: 'plain' });

      expect(stepReadingTextRenderTransformer({ verb: null, reading })).toBe('plain');
    });
  });
});
