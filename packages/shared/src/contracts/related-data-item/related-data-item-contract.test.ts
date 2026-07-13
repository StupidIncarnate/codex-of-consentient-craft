import { relatedDataItemContract } from './related-data-item-contract';
import { RelatedDataItemStub } from './related-data-item.stub';

describe('relatedDataItemContract', () => {
  describe('valid references', () => {
    it('VALID: operations reference => parses successfully', () => {
      const item = RelatedDataItemStub({ value: 'operations/abc-123' });

      expect(item).toBe('operations/abc-123');
    });

    it('VALID: wardResults reference => parses successfully', () => {
      const item = RelatedDataItemStub({ value: 'wardResults/def-456' });

      expect(item).toBe('wardResults/def-456');
    });

    it('VALID: {default value} => uses default reference', () => {
      const item = RelatedDataItemStub();

      expect(item).toBe('operations/f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: operations with full uuid => parses successfully', () => {
      const item = RelatedDataItemStub({
        value: 'operations/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(item).toBe('operations/f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: flows reference => parses successfully', () => {
      const item = RelatedDataItemStub({ value: 'flows/login-flow' });

      expect(item).toBe('flows/login-flow');
    });
  });

  describe('invalid references', () => {
    it('INVALID: unknown collection => throws validation error', () => {
      expect(() => {
        relatedDataItemContract.parse('unknown/abc');
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });

    it('INVALID: steps reference => throws validation error (removed collection)', () => {
      expect(() => {
        relatedDataItemContract.parse('steps/f47ac10b-58cc-4372-a567-0e02b2c3d479');
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });

    it('INVALID: flows with empty id => throws validation error', () => {
      expect(() => {
        relatedDataItemContract.parse('flows/');
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });

    it('INVALID: missing id => throws validation error', () => {
      expect(() => {
        relatedDataItemContract.parse('operations');
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });

    it('INVALID: empty id after slash => throws validation error', () => {
      expect(() => {
        relatedDataItemContract.parse('operations/');
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });

    it('INVALID: missing collection => throws validation error', () => {
      expect(() => {
        relatedDataItemContract.parse('/abc');
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });

    it('INVALID: empty string => throws validation error', () => {
      expect(() => {
        relatedDataItemContract.parse('');
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });
  });
});
