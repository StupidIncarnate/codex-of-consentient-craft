import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { resultsStatics } from '../../statics/results/results-statics';
import { networkBodyTrimTransformer } from './network-body-trim-transformer';

describe('networkBodyTrimTransformer', () => {
  describe('body under the trim ceiling', () => {
    it('VALID: {body: "ok"} => returns the body unchanged', () => {
      const body = ContentTextStub({ value: 'ok' });

      const result = networkBodyTrimTransformer({ body });

      expect(result).toBe('ok');
    });
  });

  describe('body exactly at the trim ceiling', () => {
    it('EDGE: {body.length === bodyTrimChars} => returns the body unchanged, no ellipsis', () => {
      const exactBody = 'x'.repeat(resultsStatics.render.bodyTrimChars);
      const body = ContentTextStub({ value: exactBody });

      const result = networkBodyTrimTransformer({ body });

      expect(result).toBe(exactBody);
    });
  });

  describe('body over the trim ceiling', () => {
    it('VALID: {body longer than bodyTrimChars} => trims to the ceiling with a trailing ellipsis', () => {
      const longBody = 'x'.repeat(resultsStatics.render.bodyTrimChars + 50);
      const body = ContentTextStub({ value: longBody });

      const result = networkBodyTrimTransformer({ body });

      expect(result).toBe(`${longBody.slice(0, resultsStatics.render.bodyTrimChars)}…`);
    });
  });

  describe('body with whitespace runs', () => {
    it('VALID: {body: "a\\nb\\tc  d"} => collapses every whitespace run to a single space', () => {
      const body = ContentTextStub({ value: 'a\nb\tc  d' });

      const result = networkBodyTrimTransformer({ body });

      expect(result).toBe('a b c d');
    });

    it('VALID: {body: "<!doctype html>\\n<html lang=\\"en\\">\\n</html>"} => renders as one line', () => {
      const body = ContentTextStub({ value: '<!doctype html>\n<html lang="en">\n</html>' });

      const result = networkBodyTrimTransformer({ body });

      expect(result).toBe('<!doctype html> <html lang="en"> </html>');
    });

    it('VALID: {body: whitespace run long enough alone to exceed bodyTrimChars} => collapses BEFORE trimming, so the trim budget is spent on content, not whitespace', () => {
      const raw = `a${'\n'.repeat(resultsStatics.render.bodyTrimChars + 50)}b`;
      const body = ContentTextStub({ value: raw });

      const result = networkBodyTrimTransformer({ body });

      expect(result).toBe('a b');
    });
  });
});
