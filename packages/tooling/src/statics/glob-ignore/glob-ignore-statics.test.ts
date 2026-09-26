import { globIgnoreStatics } from './glob-ignore-statics';

describe('globIgnoreStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(globIgnoreStatics).toStrictEqual({
      defaults: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
    });
  });
});
