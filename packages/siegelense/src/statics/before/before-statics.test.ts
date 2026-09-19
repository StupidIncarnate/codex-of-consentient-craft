import { beforeStatics } from './before-statics';

describe('beforeStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(beforeStatics).toStrictEqual({
      template: 'installed init script ({characters} chars)',
      reading: {
        template: 'installed init script ({characters} chars)',
      },
    });
  });
});
