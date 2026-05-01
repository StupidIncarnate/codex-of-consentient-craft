import { stateWritesResultContract } from './state-writes-result-contract';
import { StateWritesResultStub } from './state-writes-result.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('stateWritesResultContract', () => {
  describe('valid results', () => {
    it('VALID: {empty arrays} => parses successfully', () => {
      const result = StateWritesResultStub();

      const parsed = stateWritesResultContract.parse(result);

      expect(parsed).toStrictEqual({
        inMemoryStores: [],
        fileWrites: [],
        browserStorageWrites: [],
      });
    });

    it('VALID: {populated arrays} => parses successfully', () => {
      const store = ContentTextStub({ value: 'design-process' });
      const fileWrite = ContentTextStub({ value: '/path/to/quest.json' });
      const browserWrite = ContentTextStub({ value: 'localStorage: session-id' });

      const result = StateWritesResultStub({
        inMemoryStores: [store],
        fileWrites: [fileWrite],
        browserStorageWrites: [browserWrite],
      });

      const parsed = stateWritesResultContract.parse(result);

      expect(parsed).toStrictEqual({
        inMemoryStores: ['design-process'],
        fileWrites: ['/path/to/quest.json'],
        browserStorageWrites: ['localStorage: session-id'],
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {missing inMemoryStores} => throws validation error', () => {
      expect(() => {
        return stateWritesResultContract.parse({
          fileWrites: [],
          browserStorageWrites: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing fileWrites} => throws validation error', () => {
      expect(() => {
        return stateWritesResultContract.parse({
          inMemoryStores: [],
          browserStorageWrites: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing browserStorageWrites} => throws validation error', () => {
      expect(() => {
        return stateWritesResultContract.parse({
          inMemoryStores: [],
          fileWrites: [],
        });
      }).toThrow(/Required/u);
    });
  });
});
