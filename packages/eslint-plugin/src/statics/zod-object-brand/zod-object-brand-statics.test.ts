import { zodObjectBrandStatics } from './zod-object-brand-statics';

describe('zodObjectBrandStatics', () => {
  it('VALID: {} => holds the method names the brand rule sorts a chain by', () => {
    expect(zodObjectBrandStatics).toStrictEqual({
      objectRoots: ['object', 'strictObject', 'looseObject'],
      deriveMethods: ['extend', 'pick', 'omit', 'partial', 'required', 'merge', 'safeExtend'],
      objectLevelMethods: [
        'extend',
        'pick',
        'omit',
        'partial',
        'required',
        'merge',
        'safeExtend',
        'strict',
        'passthrough',
        'strip',
        'catchall',
      ],
      unbrandableRoots: ['enum', 'nativeEnum', 'literal', 'boolean'],
      reuseModifiers: ['optional', 'nullable', 'nullish', 'default', 'unwrap', 'describe'],
      gateway: { brandPrefix: '#Gateway' },
    });
  });
});
