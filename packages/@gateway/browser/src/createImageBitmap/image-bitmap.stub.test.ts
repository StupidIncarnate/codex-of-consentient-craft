import { ImageBitmapStub } from './image-bitmap.stub';

describe('ImageBitmapStub', () => {
  it('VALID: {} => defaults to a 32x16 bitmap that can be closed', () => {
    const bitmap = ImageBitmapStub();

    expect({ width: bitmap.width, height: bitmap.height }).toStrictEqual({
      width: 32,
      height: 16,
    });

    bitmap.close();

    expect(bitmap.width).toBe(32);
  });

  it('VALID: {width, height} => carries the given dimensions', () => {
    const bitmap = ImageBitmapStub({ width: 100, height: 50 });

    expect({ width: bitmap.width, height: bitmap.height }).toStrictEqual({
      width: 100,
      height: 50,
    });
  });
});
