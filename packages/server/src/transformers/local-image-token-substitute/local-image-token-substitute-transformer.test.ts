import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { LocalImagePathMatchStub } from '../../contracts/local-image-path-match/local-image-path-match.stub';
import { PastedImageOrdinalStub } from '../../contracts/pasted-image-ordinal/pasted-image-ordinal.stub';
import { localImageTokenSubstituteTransformer } from './local-image-token-substitute-transformer';

describe('localImageTokenSubstituteTransformer', () => {
  describe('a copied path is replaced by its token', () => {
    it('VALID: {message: "before /tmp/snip.png after", one match copied} => the copied destination path is wrapped in the pasted-image token, everything else unchanged', () => {
      const ordinal = PastedImageOrdinalStub({ value: 1 });
      const match = LocalImagePathMatchStub({ path: '/tmp/snip.png', ordinal });
      const copiedPath = AbsoluteFilePathStub({ value: '/home/q/images/abc.png' });

      const result = localImageTokenSubstituteTransformer({
        message: 'before /tmp/snip.png after',
        matches: [match],
        copiedPathByOrdinal: new Map([[ordinal, copiedPath]]),
      });

      expect(result).toBe('before ![Pasted Image 1](/home/q/images/abc.png) after');
    });
  });

  // The quotes and the escapes belong to the SPAN, not to the path — so they have to leave with
  // it. A transformer that searched for `path` instead would find nothing in the escaped message,
  // and in the quoted one would splice the token between two orphaned quote marks.
  describe('a quoted or escaped path takes its quotes and escapes with it', () => {
    it('VALID: {message holds a double-quoted path with spaces} => the quotes are replaced along with the path', () => {
      const ordinal = PastedImageOrdinalStub({ value: 1 });
      const match = LocalImagePathMatchStub({
        path: '/tmp/Screen Shot.png',
        matchedText: '"/tmp/Screen Shot.png"',
        ordinal,
      });
      const copiedPath = AbsoluteFilePathStub({ value: '/home/q/images/abc.png' });

      const result = localImageTokenSubstituteTransformer({
        message: 'before "/tmp/Screen Shot.png" after',
        matches: [match],
        copiedPathByOrdinal: new Map([[ordinal, copiedPath]]),
      });

      expect(result).toBe('before ![Pasted Image 1](/home/q/images/abc.png) after');
    });

    it('VALID: {message holds a backslash-escaped path} => the escaped run is replaced whole', () => {
      const ordinal = PastedImageOrdinalStub({ value: 1 });
      const match = LocalImagePathMatchStub({
        path: '/tmp/Screen Shot.png',
        matchedText: '/tmp/Screen\\ Shot.png',
        ordinal,
      });
      const copiedPath = AbsoluteFilePathStub({ value: '/home/q/images/abc.png' });

      const result = localImageTokenSubstituteTransformer({
        message: 'before /tmp/Screen\\ Shot.png after',
        matches: [match],
        copiedPathByOrdinal: new Map([[ordinal, copiedPath]]),
      });

      expect(result).toBe('before ![Pasted Image 1](/home/q/images/abc.png) after');
    });

    it('VALID: {a quoted path the copy step skipped} => the quotes come back exactly as written', () => {
      const ordinal = PastedImageOrdinalStub({ value: 1 });
      const match = LocalImagePathMatchStub({
        path: '/tmp/Screen Shot.png',
        matchedText: '"/tmp/Screen Shot.png"',
        ordinal,
      });

      const result = localImageTokenSubstituteTransformer({
        message: 'before "/tmp/Screen Shot.png" after',
        matches: [match],
        copiedPathByOrdinal: new Map(),
      });

      expect(result).toBe('before "/tmp/Screen Shot.png" after');
    });
  });

  describe('an unresolved path reaches the agent verbatim', () => {
    it('VALID: {message: "before /tmp/snip.png after", one match, no entry in copiedPathByOrdinal} => the path is untouched, character for character', () => {
      const ordinal = PastedImageOrdinalStub({ value: 1 });
      const match = LocalImagePathMatchStub({ path: '/tmp/snip.png', ordinal });

      const result = localImageTokenSubstituteTransformer({
        message: 'before /tmp/snip.png after',
        matches: [match],
        copiedPathByOrdinal: new Map(),
      });

      expect(result).toBe('before /tmp/snip.png after');
    });
  });

  describe('a path already sitting inside an image token is not matched a second time', () => {
    it('VALID: {message: "![Pasted Image 1](/tmp/a.png) and /tmp/a.png", one match at ordinal 2 (the loose occurrence)} => the existing token is untouched and the loose occurrence becomes its own token', () => {
      const ordinal = PastedImageOrdinalStub({ value: 2 });
      const match = LocalImagePathMatchStub({ path: '/tmp/a.png', ordinal });
      const copiedPath = AbsoluteFilePathStub({ value: '/home/q/images/copy.png' });

      const result = localImageTokenSubstituteTransformer({
        message: '![Pasted Image 1](/tmp/a.png) and /tmp/a.png',
        matches: [match],
        copiedPathByOrdinal: new Map([[ordinal, copiedPath]]),
      });

      expect(result).toBe(
        '![Pasted Image 1](/tmp/a.png) and ![Pasted Image 2](/home/q/images/copy.png)',
      );
    });
  });

  describe('a match whose path cannot be found in the message leaves the message untouched', () => {
    it('VALID: {message: "no images here", one match whose path never occurs} => the message is returned byte-identical', () => {
      const ordinal = PastedImageOrdinalStub({ value: 1 });
      const match = LocalImagePathMatchStub({ path: '/tmp/missing.png', ordinal });
      const copiedPath = AbsoluteFilePathStub({ value: '/home/q/images/copy.png' });

      const result = localImageTokenSubstituteTransformer({
        message: 'no images here',
        matches: [match],
        copiedPathByOrdinal: new Map([[ordinal, copiedPath]]),
      });

      expect(result).toBe('no images here');
    });
  });

  describe('the same path string occurs twice, both copied under different ordinals', () => {
    it('VALID: {message: two occurrences of the same path, two matches with different ordinals} => each occurrence is replaced by its own token, left to right', () => {
      const firstOrdinal = PastedImageOrdinalStub({ value: 1 });
      const secondOrdinal = PastedImageOrdinalStub({ value: 2 });
      const firstMatch = LocalImagePathMatchStub({ path: '/tmp/snip.png', ordinal: firstOrdinal });
      const secondMatch = LocalImagePathMatchStub({
        path: '/tmp/snip.png',
        ordinal: secondOrdinal,
      });
      const firstCopiedPath = AbsoluteFilePathStub({ value: '/q/images/one.png' });
      const secondCopiedPath = AbsoluteFilePathStub({ value: '/q/images/two.png' });

      const result = localImageTokenSubstituteTransformer({
        message: 'X /tmp/snip.png Y /tmp/snip.png Z',
        matches: [firstMatch, secondMatch],
        copiedPathByOrdinal: new Map([
          [firstOrdinal, firstCopiedPath],
          [secondOrdinal, secondCopiedPath],
        ]),
      });

      expect(result).toBe(
        'X ![Pasted Image 1](/q/images/one.png) Y ![Pasted Image 2](/q/images/two.png) Z',
      );
    });
  });
});
