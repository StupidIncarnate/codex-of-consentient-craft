import { firstWordTransformer } from './first-word-transformer';

describe('firstWordTransformer', () => {
  describe('single word', () => {
    it('VALID: {text: "git"} => returns "git"', () => {
      expect(firstWordTransformer({ text: 'git' })).toBe('git');
    });
  });

  describe('multiple words', () => {
    it('VALID: {text: "git status"} => returns "git"', () => {
      expect(firstWordTransformer({ text: 'git status' })).toBe('git');
    });

    it('EDGE: {text: "git "} => returns "git", never a trailing space', () => {
      expect(firstWordTransformer({ text: 'git ' })).toBe('git');
    });

    it('EDGE: {text: "gitk"} => returns "gitk", never truncated to "git"', () => {
      expect(firstWordTransformer({ text: 'gitk' })).toBe('gitk');
    });
  });

  describe('empty text', () => {
    it('EMPTY: {text: ""} => returns undefined', () => {
      expect(firstWordTransformer({ text: '' })).toBe(undefined);
    });

    it('EMPTY: {text: "   "} => returns undefined', () => {
      expect(firstWordTransformer({ text: '   ' })).toBe(undefined);
    });
  });
});
