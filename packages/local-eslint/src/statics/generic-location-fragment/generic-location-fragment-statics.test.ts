import { genericLocationFragmentStatics } from './generic-location-fragment-statics';

describe('genericLocationFragmentStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(genericLocationFragmentStatics).toStrictEqual({
      extensions: [
        '.json',
        '.jsonl',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.sock',
        '.txt',
        '.log',
        '.md',
        '.js',
        '.ts',
        '.tsx',
        '.jsx',
        '.mjs',
        '.cjs',
        '.css',
        '.html',
        '.xml',
        '.yaml',
        '.yml',
        '.csv',
        '.lock',
        '.tmp',
        '.zip',
        '.tar',
        '.gz',
        '.pdf',
      ],
    });
  });
});
