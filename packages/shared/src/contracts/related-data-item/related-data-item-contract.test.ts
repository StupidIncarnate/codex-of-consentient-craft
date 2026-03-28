import { relatedDataItemContract } from './related-data-item-contract';
import { RelatedDataItemStub } from './related-data-item.stub';

describe('relatedDataItemContract', () => {
  describe('valid references', () => {
    it('VALID: steps reference => parses successfully', () => {
      const item = RelatedDataItemStub({ value: 'steps/abc-123' });

      expect(item).toBe('steps/abc-123');
    });

    it('VALID: wardResults reference => parses successfully', () => {
      const item = RelatedDataItemStub({ value: 'wardResults/def-456' });

      expect(item).toBe('wardResults/def-456');
    });

    it('VALID: {default value} => uses default reference', () => {
      const item = RelatedDataItemStub();

      expect(item).toBe('steps/f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: flows reference => parses successfully', () => {
      const item = RelatedDataItemStub({ value: 'flows/login-flow' });

      expect(item).toBe('flows/login-flow');
    });

    it('VALID: flows with uuid => parses successfully', () => {
      const item = RelatedDataItemStub({
        value: 'flows/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(item).toBe('flows/f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: steps with full uuid => parses successfully', () => {
      const item = RelatedDataItemStub({
        value: 'steps/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(item).toBe('steps/f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('invalid references', () => {
    it('INVALID: unknown collection => throws validation error', () => {
      expect(() => {
        relatedDataItemContract.parse('unknown/abc');
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });

    it('INVALID: missing id => throws validation error', () => {
      expect(() => {
        relatedDataItemContract.parse('steps');
      }).toThrow(/Must be \{collection\}\/\{id\}/u);
    });

    it('INVALID: empty id after slash => throws validation error', () => {
      expect(() => {
        relatedDataItemContract.parse('steps/');
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
