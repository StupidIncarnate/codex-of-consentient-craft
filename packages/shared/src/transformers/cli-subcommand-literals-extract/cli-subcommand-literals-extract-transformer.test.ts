import { cliSubcommandLiteralsExtractTransformer } from './cli-subcommand-literals-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('cliSubcommandLiteralsExtractTransformer', () => {
  describe('args[0] === pattern', () => {
    it("VALID: {args[0] === 'run'} => returns ['run']", () => {
      const source = ContentTextStub({
        value: `if (args[0] === 'run') { await WardRunResponder(); }`,
      });

      const result = cliSubcommandLiteralsExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['run']);
    });

    it("VALID: {args[0] === 'run' and args[0] === 'detail'} => returns ['run', 'detail']", () => {
      const source = ContentTextStub({
        value: [
          `if (args[0] === 'run') { await WardRunResponder(); }`,
          `if (args[0] === 'detail') { await WardDetailResponder(); }`,
        ].join('\n'),
      });

      const result = cliSubcommandLiteralsExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['run', 'detail']);
    });

    it('VALID: {double-equals variant} => returns subcommand literal', () => {
      const source = ContentTextStub({
        value: `if (args[0] == 'list') { await WardListResponder(); }`,
      });

      const result = cliSubcommandLiteralsExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['list']);
    });
  });

  describe('case pattern', () => {
    it("VALID: {case 'run':} => returns ['run']", () => {
      const source = ContentTextStub({
        value: `switch(cmd) { case 'run': await run(); break; }`,
      });

      const result = cliSubcommandLiteralsExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['run']);
    });
  });

  describe('deduplication', () => {
    it('VALID: {same subcommand appears twice} => returns it only once', () => {
      const source = ContentTextStub({
        value: [
          `if (args[0] === 'run') { return run(); }`,
          `if (args[0] === 'run') { break; }`,
        ].join('\n'),
      });

      const result = cliSubcommandLiteralsExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['run']);
    });
  });

  describe('no match', () => {
    it('EMPTY: {source has no subcommand patterns} => returns empty array', () => {
      const source = ContentTextStub({ value: `export const StartTool = async () => {};` });

      const result = cliSubcommandLiteralsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
