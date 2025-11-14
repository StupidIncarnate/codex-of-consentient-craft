import { architectureFolderStatics } from './architecture-folder-statics';

describe('architectureFolderStatics', () => {
  it('VALID: folders.all => contains expected architecture folders', () => {
    const { folders } = architectureFolderStatics;

    expect(folders.all).toStrictEqual([
      'contracts',
      'transformers',
      'errors',
      'flows',
      'adapters',
      'middleware',
      'brokers',
      'bindings',
      'state',
      'responders',
      'widgets',
      'startup',
      'assets',
      'migrations',
    ]);
  });

  it('VALID: folders.all => is readonly', () => {
    const { folders } = architectureFolderStatics;

    expect(Object.isFrozen(folders.all)).toBe(true);
  });
});
