import { cliResponderImportsExtractTransformer } from './cli-responder-imports-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('cliResponderImportsExtractTransformer', () => {
  describe('single responder import', () => {
    it("VALID: {one Responder import} => returns ['WardRunResponder']", () => {
      const source = ContentTextStub({
        value: `import { WardRunResponder } from '../../responders/ward/run/ward-run-responder';`,
      });

      const result = cliResponderImportsExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['WardRunResponder']);
    });
  });

  describe('multiple responder imports', () => {
    it('VALID: {multiple Responder imports} => returns all names in order', () => {
      const source = ContentTextStub({
        value: [
          `import { WardRunResponder } from '../../responders/ward/run/ward-run-responder';`,
          `import { WardDetailResponder } from '../../responders/ward/detail/ward-detail-responder';`,
          `import { WardRawResponder } from '../../responders/ward/raw/ward-raw-responder';`,
        ].join('\n'),
      });

      const result = cliResponderImportsExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual([
        'WardRunResponder',
        'WardDetailResponder',
        'WardRawResponder',
      ]);
    });
  });

  describe('deduplication', () => {
    it('EDGE: {same responder imported twice} => returns it only once', () => {
      const source = ContentTextStub({
        value: [
          `import { WardRunResponder } from '../../responders/ward/run/ward-run-responder';`,
          `import { WardRunResponder } from '../../responders/ward/run/ward-run-responder';`,
        ].join('\n'),
      });

      const result = cliResponderImportsExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['WardRunResponder']);
    });
  });

  describe('no responder imports', () => {
    it('EMPTY: {no Responder imports} => returns empty array', () => {
      const source = ContentTextStub({
        value: `import { WardFlow } from '../flows/ward/ward-flow';`,
      });

      const result = cliResponderImportsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
