import { resizeStatics } from './resize-statics';

describe('resizeStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(resizeStatics).toStrictEqual({
      template: 'resized to {width}x{height}',
      reading: {
        template: 'resized to {width}x{height}',
      },
    });
  });
});
