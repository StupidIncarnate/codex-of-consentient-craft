import { imageContentTypeTransformer } from './image-content-type-transformer';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

describe('imageContentTypeTransformer', () => {
  it.each([
    ['/tmp/a.png', 'image/png'],
    ['/tmp/a.jpg', 'image/jpeg'],
    ['/tmp/a.jpeg', 'image/jpeg'],
    ['/tmp/a.gif', 'image/gif'],
    ['/tmp/a.webp', 'image/webp'],
  ])('VALID: {filePath: %s} => %s', (path, expected) => {
    expect(imageContentTypeTransformer({ filePath: AbsoluteFilePathStub({ value: path }) })).toBe(
      expected,
    );
  });

  it('VALID: {filePath: "/tmp/a.PNG" uppercase extension} => image/png', () => {
    expect(
      imageContentTypeTransformer({ filePath: AbsoluteFilePathStub({ value: '/tmp/a.PNG' }) }),
    ).toBe('image/png');
  });

  it('INVALID: {filePath: "/tmp/a.txt"} => null', () => {
    expect(
      imageContentTypeTransformer({ filePath: AbsoluteFilePathStub({ value: '/tmp/a.txt' }) }),
    ).toBe(null);
  });

  it('EMPTY: {filePath: "/tmp/a" no extension} => null', () => {
    expect(
      imageContentTypeTransformer({ filePath: AbsoluteFilePathStub({ value: '/tmp/a' }) }),
    ).toBe(null);
  });

  it('EDGE: {filePath: "/a.dir/file" dot only in directory name} => null', () => {
    expect(
      imageContentTypeTransformer({ filePath: AbsoluteFilePathStub({ value: '/a.dir/file' }) }),
    ).toBe(null);
  });

  it('VALID: {filePath extension in pastedImageStatics.allowedExtensions} => every entry maps to a non-null content type', () => {
    const expected = Object.fromEntries(
      pastedImageStatics.allowedExtensions.map((extension) => [extension, true]),
    );
    const actual = Object.fromEntries(
      pastedImageStatics.allowedExtensions.map((extension) => [
        extension,
        imageContentTypeTransformer({
          filePath: AbsoluteFilePathStub({ value: `/tmp/a.${extension}` }),
        }) !== null,
      ]),
    );

    expect(actual).toStrictEqual(expected);
  });
});
