import { discoverOutputCapStatics } from './discover-output-cap-statics';

describe('discoverOutputCapStatics', () => {
  it('VALID: exported statics => matches exact expected shape', () => {
    expect(discoverOutputCapStatics).toStrictEqual({
      grepOutput: {
        maxRunLines: 20,
        maxFileLines: 40,
        lineBudgetChars: 8000,
      },
    });
  });

  it('VALID: maxRunLines => sits below maxFileLines so the run cap can fire at all', () => {
    expect(discoverOutputCapStatics.grepOutput.maxRunLines).toBeLessThan(
      discoverOutputCapStatics.grepOutput.maxFileLines,
    );
  });
});
