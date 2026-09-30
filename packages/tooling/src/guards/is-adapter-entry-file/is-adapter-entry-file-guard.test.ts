import { isAdapterEntryFileGuard } from './is-adapter-entry-file-guard';
import { CensusPathStub } from '../../contracts/census-path/census-path.stub';

describe('isAdapterEntryFileGuard', () => {
  describe('adapter entry files', () => {
    it('VALID: {a .ts adapter under src/adapters} => true', () => {
      const file = 'packages/a/src/adapters/fs/read-file/fs-read-file-adapter.ts';

      expect(isAdapterEntryFileGuard({ file })).toBe(true);
    });

    it('VALID: {a .tsx adapter under src/adapters} => true', () => {
      const file = 'packages/a/src/adapters/dom/render/dom-render-adapter.tsx';

      expect(isAdapterEntryFileGuard({ file })).toBe(true);
    });
  });

  describe('files that are not an adapter entry', () => {
    it.each([
      'packages/a/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts',
      'packages/a/src/adapters/fs/read-file/fs-read-file-adapter.test.ts',
      'packages/a/src/adapters/fs/read-file/fs-read-file-adapter.stub.ts',
      'packages/a/src/adapters/fs/read-file/fs-read-file-layer-adapter.ts',
      'packages/a/src/brokers/fs/read/fs-read-broker.ts',
      'packages/a/adapters.ts',
    ])('VALID: {file: %s} => false', (value) => {
      const file = CensusPathStub({ value });

      expect(isAdapterEntryFileGuard({ file })).toBe(false);
    });

    it('EMPTY: {file: undefined} => false', () => {
      expect(isAdapterEntryFileGuard({})).toBe(false);
    });
  });
});
