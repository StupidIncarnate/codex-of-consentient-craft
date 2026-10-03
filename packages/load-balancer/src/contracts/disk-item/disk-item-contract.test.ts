import { diskItemContract } from './disk-item-contract';
import { DiskItemStub } from './disk-item.stub';

describe('diskItemContract', () => {
  describe('valid items', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const item = DiskItemStub();

      const result = diskItemContract.parse(item);

      expect(result).toStrictEqual({
        storeId: 'ward-run-results',
        path: '/path/to/.ward/run-1.json',
        bytes: 1024,
        mtimeMs: 1_700_000_000_000,
        protectedReason: null,
      });
    });

    it('VALID: {string protectedReason} => parses successfully', () => {
      const item = DiskItemStub({
        protectedReason: 'pid alive',
      });

      const result = diskItemContract.parse(item);

      expect(result).toStrictEqual({
        storeId: 'ward-run-results',
        path: '/path/to/.ward/run-1.json',
        bytes: 1024,
        mtimeMs: 1_700_000_000_000,
        protectedReason: 'pid alive',
      });
    });

    it('VALID: {bytes: 0, mtimeMs: 0} => parses successfully with non-negative boundaries', () => {
      const item = DiskItemStub({
        bytes: 0,
        mtimeMs: 0,
        protectedReason: null,
      });

      const result = diskItemContract.parse(item);

      expect(result).toStrictEqual({
        storeId: 'ward-run-results',
        path: '/path/to/.ward/run-1.json',
        bytes: 0,
        mtimeMs: 0,
        protectedReason: null,
      });
    });
  });

  describe('invalid items', () => {
    it('INVALID: {} => throws on missing required fields', () => {
      expect(() => {
        diskItemContract.parse({});
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {storeId: 123} => throws on non-string storeId', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          storeId: 123 as never,
        });
      }).toThrow(/expected string/u);
    });

    it('INVALID: {path: 123} => throws on non-string path', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          path: 123 as never,
        });
      }).toThrow(/expected string/u);
    });

    it('INVALID: {bytes: -1} => throws on negative bytes', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          bytes: -1 as never,
        });
      }).toThrow(/>=0/u);
    });

    it('INVALID: {bytes: 10.5} => throws on non-integer bytes', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          bytes: 10.5 as never,
        });
      }).toThrow(/int/u);
    });

    it('INVALID: {bytes: "1024"} => throws on non-number bytes', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          bytes: '1024' as never,
        });
      }).toThrow(/expected number/u);
    });

    it('INVALID: {mtimeMs: -1} => throws on negative mtimeMs', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          mtimeMs: -1 as never,
        });
      }).toThrow(/>=0/u);
    });

    it('INVALID: {mtimeMs: 1.5} => throws on non-integer mtimeMs', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          mtimeMs: 1.5 as never,
        });
      }).toThrow(/int/u);
    });

    it('INVALID: {mtimeMs: "now"} => throws on non-number mtimeMs', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          mtimeMs: 'now' as never,
        });
      }).toThrow(/expected number/u);
    });

    it('INVALID: {protectedReason: 42} => throws on non-string protectedReason', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          protectedReason: 42 as never,
        });
      }).toThrow(/expected string/u);
    });

    it('INVALID: {protectedReason: undefined} => throws on missing protectedReason', () => {
      const item = DiskItemStub();

      expect(() => {
        diskItemContract.parse({
          ...item,
          protectedReason: undefined as never,
        });
      }).toThrow(/expected string, received undefined/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid default disk item', () => {
      const result = DiskItemStub();

      expect(result).toStrictEqual({
        storeId: 'ward-run-results',
        path: '/path/to/.ward/run-1.json',
        bytes: 1024,
        mtimeMs: 1_700_000_000_000,
        protectedReason: null,
      });
    });

    it('VALID: {custom overrides} => creates disk item with overridden fields', () => {
      const result = DiskItemStub({
        storeId: 'e2e-sandboxes',
        path: '/tmp/dm-e2e-1234',
        bytes: 2048,
        protectedReason: 'pid alive',
      });

      expect(result).toStrictEqual({
        storeId: 'e2e-sandboxes',
        path: '/tmp/dm-e2e-1234',
        bytes: 2048,
        mtimeMs: 1_700_000_000_000,
        protectedReason: 'pid alive',
      });
    });
  });
});
