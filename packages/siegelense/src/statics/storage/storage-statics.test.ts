import { storageStatics } from './storage-statics';

describe('storageStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(storageStatics).toStrictEqual({
      defaults: {
        prefix: '',
      },
    });
  });

  it('VALID: {defaults.prefix} => is empty string', () => {
    expect(storageStatics.defaults.prefix).toBe('');
  });
});
