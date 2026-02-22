import { tagItemContract } from './tag-item-contract';
import { TagItemStub } from './tag-item.stub';

describe('tagItemContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "typescript"} => parses tag item', () => {
      const result = tagItemContract.parse('typescript');

      expect(result).toBe('typescript');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => tagItemContract.parse('')).toThrow(/String must contain at least 1 character/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => tagItemContract.parse(null)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid tag item', () => {
      const result = TagItemStub();

      expect(result).toBe('typescript');
    });

    it('VALID: {value: "react"} => creates tag with custom value', () => {
      const result = TagItemStub({ value: 'react' });

      expect(result).toBe('react');
    });
  });
});
