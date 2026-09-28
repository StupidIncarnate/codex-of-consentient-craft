import { createImageBitmap } from './create-image-bitmap';
import { createImageBitmapProxy } from './create-image-bitmap.proxy';

describe('createImageBitmap', () => {
  it('VALID: {a staged input} => resolves a bitmap with the staged width and height', async () => {
    const proxy = createImageBitmapProxy();
    const blob = new Blob(['png-bytes']);
    proxy.stageBitmap({ input: blob, width: 640, height: 480 });

    const bitmap = await createImageBitmap(blob);

    expect({ width: bitmap.width, height: bitmap.height }).toStrictEqual({
      width: 640,
      height: 480,
    });
  });

  it('VALID: {two inputs staged differently} => each input gets its own dimensions', async () => {
    const proxy = createImageBitmapProxy();
    const small = new Blob(['a']);
    const large = new Blob(['aaaaaaaa']);
    proxy.stageBitmap({ input: small, width: 10, height: 20 });
    proxy.stageBitmap({ input: large, width: 3000, height: 2000 });

    const largeBitmap = await createImageBitmap(large);
    const smallBitmap = await createImageBitmap(small);

    expect([
      { width: largeBitmap.width, height: largeBitmap.height },
      { width: smallBitmap.width, height: smallBitmap.height },
    ]).toStrictEqual([
      { width: 3000, height: 2000 },
      { width: 10, height: 20 },
    ]);
  });

  it('VALID: {input staged by predicate} => a Blob the test never held still matches', async () => {
    const proxy = createImageBitmapProxy();
    proxy.stageBitmap({
      input: (value) => (value as Blob).size === 4,
      width: 5,
      height: 6,
    });

    const bitmap = await createImageBitmap(new Blob(['abcd']));

    expect({ width: bitmap.width, height: bitmap.height }).toStrictEqual({ width: 5, height: 6 });
  });

  it('ERROR: {decode staged to fail} => rejects with the staged error', async () => {
    const proxy = createImageBitmapProxy();
    const blob = new Blob(['not-an-image']);
    proxy.stageDecodeFails({
      input: blob,
      error: new Error('The source image could not be decoded'),
    });

    await expect(createImageBitmap(blob)).rejects.toThrow(
      /^The source image could not be decoded$/u,
    );
  });

  it('ERROR: {input nothing staged} => rejects rather than answering a default', async () => {
    createImageBitmapProxy();

    await expect(createImageBitmap(new Blob(['unstaged']))).rejects.toThrow(/createImageBitmap/u);
  });

  describe('call inspection', () => {
    it('VALID: {decodes already made} => getRequestedInputs reads back each input in call order', async () => {
      const proxy = createImageBitmapProxy();
      const first = new Blob(['one']);
      const second = new Blob(['three']);
      proxy.stageBitmap({ input: first, width: 1, height: 1 });
      proxy.stageBitmap({ input: second, width: 2, height: 2 });

      await createImageBitmap(first);
      await createImageBitmap(second);

      expect(proxy.getRequestedInputs()).toStrictEqual([first, second]);
    });

    it('VALID: {a bitmap closed by the caller} => getClosedBitmapSizes reads back its size', async () => {
      const proxy = createImageBitmapProxy();
      const blob = new Blob(['x']);
      proxy.stageBitmap({ input: blob, width: 7, height: 9 });

      const bitmap = await createImageBitmap(blob);
      bitmap.close();

      expect(proxy.getClosedBitmapSizes()).toStrictEqual([{ width: 7, height: 9 }]);
    });
  });
});
