import { storageReadingContract } from './storage-reading-contract';
import { StorageReadingStub } from './storage-reading.stub';

describe('storageReadingContract', () => {
  describe('valid values', () => {
    it('VALID: {default stub} => parses and returns exact StorageReading shape', () => {
      const reading = StorageReadingStub();

      const result = storageReadingContract.parse(reading);

      expect(result).toStrictEqual({
        origin: 'http://localhost:3000',
        local: {},
        session: {},
      });
    });

    it('VALID: {with local and session entries} => parses records with string and null values', () => {
      const reading = StorageReadingStub({
        origin: 'https://example.com:8080',
        local: { 'dm-theme': 'dark', 'dm-temp': null },
        session: { 'dm-token': 'xyz789' },
      });

      const result = storageReadingContract.parse(reading);

      expect(result).toStrictEqual({
        origin: 'https://example.com:8080',
        local: { 'dm-theme': 'dark', 'dm-temp': null },
        session: { 'dm-token': 'xyz789' },
      });
    });
  });

  describe('invalid values', () => {
    it('INVALID: {origin: 123} => throws validation error on non-string origin', () => {
      expect(() => {
        storageReadingContract.parse({
          origin: 123 as never,
          local: {},
          session: {},
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {local: "not an object"} => throws validation error on non-record local', () => {
      expect(() => {
        storageReadingContract.parse({
          origin: 'http://localhost:3000',
          local: 'not an object' as never,
          session: {},
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID: {session: { key: 123 }} => throws validation error on non-string/non-null value', () => {
      expect(() => {
        storageReadingContract.parse({
          origin: 'http://localhost:3000',
          local: {},
          session: { key: 123 as never },
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {extraField: true} => throws validation error due to strict object', () => {
      expect(() => {
        storageReadingContract.parse({
          origin: 'http://localhost:3000',
          local: {},
          session: {},
          extraField: true,
        });
      }).toThrow(/Unrecognized key/u);
    });
  });
});
