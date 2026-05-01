import { urlSegmentsExtractStatics } from './url-segments-extract-statics';

describe('urlSegmentsExtractStatics', () => {
  it('VALID: skipPrefixes => contains colon and api entries', () => {
    expect(urlSegmentsExtractStatics.skipPrefixes).toStrictEqual([':', 'api']);
  });
});
