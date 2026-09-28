import { censusLanguageGlobalsStatics } from './census-language-globals-statics';

describe('censusLanguageGlobalsStatics', () => {
  it('VALID: exported value => lists the language built-ins and no runtime global', () => {
    expect(censusLanguageGlobalsStatics.names).toStrictEqual([
      'JSON',
      'Math',
      'Object',
      'Array',
      'Promise',
      'Number',
      'String',
      'Boolean',
      'Date',
      'Error',
      'TypeError',
      'RangeError',
      'Symbol',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Reflect',
      'RegExp',
      'BigInt',
      'Intl',
      'Uint8Array',
      'ArrayBuffer',
      'parseInt',
      'parseFloat',
      'isNaN',
      'isFinite',
      'encodeURIComponent',
      'decodeURIComponent',
      'structuredClone',
    ]);
  });
});
