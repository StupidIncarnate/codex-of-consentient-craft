import { WardResultStub } from '@dungeonmaster/shared/contracts';

import { resolvedRelatedDataItemContract } from './resolved-related-data-item-contract';
import { ResolvedRelatedDataItemStub } from './resolved-related-data-item.stub';

describe('resolvedRelatedDataItemContract', () => {
  describe('valid results', () => {
    it('VALID: {collection: steps, step item} => parses successfully', () => {
      const result = ResolvedRelatedDataItemStub();

      expect(result.collection).toBe('steps');
    });

    it('VALID: {collection: wardResults, wardResult item} => parses successfully', () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = resolvedRelatedDataItemContract.parse({
        collection: 'wardResults',
        id: wardResult.id,
        item: wardResult,
      });

      expect(result.collection).toBe('wardResults');
    });
  });
});
