import { imageServeStatics } from './image-serve-statics';

describe('imageServeStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(imageServeStatics).toStrictEqual({
      maxPathLength: 4096,
    });
  });
});
