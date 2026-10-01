import { npmFirstErrorLineTransformer } from './npm-first-error-line-transformer';

describe('npmFirstErrorLineTransformer', () => {
  it('VALID: {npm E404 output} => returns the first npm error line with a body, skipping the bare code line', () => {
    const output = [
      'npm error code E404',
      'npm error 404 Not Found - GET https://registry.npmjs.org/@dungeonmaster%2fsiegelense - Not found',
      "npm error 404  '@dungeonmaster/siegelense@*' is not in this registry.",
      'npm error A complete log of this run can be found in: /home/u/.npm/_logs/debug-0.log',
    ].join('\n');

    expect(npmFirstErrorLineTransformer({ output })).toBe(
      'npm error 404 Not Found - GET https://registry.npmjs.org/@dungeonmaster%2fsiegelense - Not found',
    );
  });

  it('VALID: {legacy npm ERR! output} => returns the first npm ERR! line', () => {
    const output = 'npm WARN deprecated x\nnpm ERR! network request failed\nnpm ERR! retry later';

    expect(npmFirstErrorLineTransformer({ output })).toBe('npm ERR! network request failed');
  });

  it('EDGE: {only a bare code line} => returns that code line', () => {
    expect(npmFirstErrorLineTransformer({ output: '\nnpm error code ELIFECYCLE\n' })).toBe(
      'npm error code ELIFECYCLE',
    );
  });

  it('VALID: {tsc output under npm run build} => returns the tsc error line over the bare npm code line', () => {
    const output =
      '> hydration-recipes@0.0.0 build\n> tsc -p tsconfig.build.json\n' +
      "src/index.ts(1,20): error TS2307: Cannot find module 'x'.\nnpm error code 2";

    expect(npmFirstErrorLineTransformer({ output })).toBe(
      "src/index.ts(1,20): error TS2307: Cannot find module 'x'.",
    );
  });

  it('EDGE: {output with no error line} => returns the first non-empty line', () => {
    expect(npmFirstErrorLineTransformer({ output: '\n  Killed  \nsomething else' })).toBe('Killed');
  });

  it('EMPTY: {output: ""} => says npm printed nothing', () => {
    expect(npmFirstErrorLineTransformer({ output: '' })).toBe('(npm printed no output)');
  });
});
