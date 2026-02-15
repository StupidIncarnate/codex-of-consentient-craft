import { urlSlugContract } from './url-slug-contract';
import { UrlSlugStub } from './url-slug.stub';

describe('urlSlugContract', () => {
  describe('valid slugs', () => {
    it('VALID: simple word => parses successfully', () => {
      const slug = UrlSlugStub({ value: 'hello' });

      const result = urlSlugContract.parse(slug);

      expect(result).toBe('hello');
    });

    it('VALID: kebab-case => parses successfully', () => {
      const slug = UrlSlugStub({ value: 'my-guild-name' });

      const result = urlSlugContract.parse(slug);

      expect(result).toBe('my-guild-name');
    });

    it('VALID: single digit => parses successfully', () => {
      const slug = UrlSlugStub({ value: '1' });

      const result = urlSlugContract.parse(slug);

      expect(result).toBe('1');
    });

    it('VALID: alphanumeric segments => parses successfully', () => {
      const slug = UrlSlugStub({ value: 'app2-v3' });

      const result = urlSlugContract.parse(slug);

      expect(result).toBe('app2-v3');
    });
  });

  describe('invalid slugs', () => {
    it('INVALID: empty string => throws validation error', () => {
      expect(() => {
        urlSlugContract.parse('');
      }).toThrow(/too_small/u);
    });

    it('INVALID: uppercase letters => throws validation error', () => {
      expect(() => {
        urlSlugContract.parse('My-Guild');
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: spaces => throws validation error', () => {
      expect(() => {
        urlSlugContract.parse('my guild');
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: leading hyphen => throws validation error', () => {
      expect(() => {
        urlSlugContract.parse('-my-guild');
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: trailing hyphen => throws validation error', () => {
      expect(() => {
        urlSlugContract.parse('my-guild-');
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: consecutive hyphens => throws validation error', () => {
      expect(() => {
        urlSlugContract.parse('my--guild');
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: special characters => throws validation error', () => {
      expect(() => {
        urlSlugContract.parse('my_guild');
      }).toThrow(/invalid_string/u);
    });
  });
});
