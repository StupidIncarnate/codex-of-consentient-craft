import { crashOutputExcerptTransformer } from './crash-output-excerpt-transformer';

describe('crashOutputExcerptTransformer', () => {
  describe('output holding a jest failure header', () => {
    it('VALID: {test chatter, then a jest report} => returns the message under the first header', () => {
      const result = crashOutputExcerptTransformer({
        output: [
          '[OK] @dungeonmaster/cli: Added devDependencies to package.json',
          'FAIL src/flows/cli/cli-flow.integration.test.ts (73.469 s)',
          '  ● CliFlow › command routing - siegelense › VALID: routes',
          '',
          '    thrown: "Exceeded timeout of 30000 ms for a hook.',
          '    Add a timeout value to this test to increase the timeout."',
          '',
          '  ● CliFlow › command routing - siegelense › VALID: help',
        ].join('\n'),
      });

      expect(result).toBe(
        [
          'thrown: "Exceeded timeout of 30000 ms for a hook.',
          'Add a timeout value to this test to increase the timeout."',
          '',
          '● CliFlow › command routing - siegelense › VALID: help',
        ].join('\n'),
      );
    });

    it('EDGE: {header is the last non-blank line} => returns the header itself', () => {
      const result = crashOutputExcerptTransformer({
        output: 'FAIL a.test.ts\n  ● Suite › case\n\n',
      });

      expect(result).toBe('● Suite › case');
    });
  });

  describe('output with no jest failure header', () => {
    it('VALID: {usage banner} => returns the output unchanged', () => {
      const result = crashOutputExcerptTransformer({
        output: 'Both --runInBand and --maxWorkers were specified, only one is allowed.',
      });

      expect(result).toBe('Both --runInBand and --maxWorkers were specified, only one is allowed.');
    });
  });
});
