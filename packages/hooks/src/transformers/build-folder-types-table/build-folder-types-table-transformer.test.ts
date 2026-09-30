import { Buffer } from '#gateway/node/buffer';

import { buildFolderTypesTableTransformer } from './build-folder-types-table-transformer';

describe('buildFolderTypesTableTransformer', () => {
  describe('generateTable()', () => {
    it('VALID: {} => includes statics folder entry', () => {
      const result = buildFolderTypesTableTransformer();

      expect(result).toMatch(
        /^\| statics\/ \| Immutable configuration values and constants \| Need immutable config or constants \|$/mu,
      );
    });

    it('VALID: {} => includes brokers folder entry', () => {
      const result = buildFolderTypesTableTransformer();

      expect(result).toMatch(
        /^\| brokers\/ \| Business logic orchestration \| Business logic operations \|$/mu,
      );
    });

    it('VALID: {} => orders depth-1 folders before depth-2 folders', () => {
      const result = buildFolderTypesTableTransformer();

      const staticsIndex = result.indexOf('| statics/ |');
      const brokersIndex = result.indexOf('| brokers/ |');

      expect(staticsIndex).toBeLessThan(brokersIndex);
    });

    it('VALID: {} => emits one row per folder type, ordered by depth then name, with no adapters/ row', () => {
      const result = buildFolderTypesTableTransformer();

      expect(result.match(/^\| [a-z]+\/ /gmu)).toStrictEqual([
        '| startup/ ',
        '| assets/ ',
        '| bindings/ ',
        '| contracts/ ',
        '| errors/ ',
        '| flows/ ',
        '| guards/ ',
        '| middleware/ ',
        '| migrations/ ',
        '| state/ ',
        '| statics/ ',
        '| transformers/ ',
        '| widgets/ ',
        '| brokers/ ',
        '| responders/ ',
      ]);
    });

    it('VALID: {} => result is under 2048 bytes', () => {
      const result = buildFolderTypesTableTransformer();

      expect(Buffer.byteLength(result, 'utf8')).toBeLessThanOrEqual(2048);
    });
  });
});
