import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ImageServeResponderProxy } from './image-serve-responder.proxy';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe('ImageServeResponder', () => {
  it('VALID: {path: readable .png} => 200 with those exact bytes and image/png', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/abc.png' });
    const bytes = new Uint8Array([...PNG_SIGNATURE, 0x01, 0x02, 0x03]);
    const proxy = ImageServeResponderProxy();
    proxy.setupFileBytes({ filePath, bytes });

    const result = await proxy.callResponder({ path: filePath });

    expect(result).toStrictEqual({ status: 200, bytes, contentType: 'image/png' });
  });

  it('VALID: {path: readable .webp} => 200 with those exact bytes and image/webp', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/abc.webp' });
    const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);
    const proxy = ImageServeResponderProxy();
    proxy.setupFileBytes({ filePath, bytes });

    const result = await proxy.callResponder({ path: filePath });

    expect(result).toStrictEqual({ status: 200, bytes, contentType: 'image/webp' });
  });

  // No read is staged on this proxy — a missing path parameter never reaches the broker, so an
  // unstaged registerMock call would throw if it somehow did reach the filesystem.
  it('EMPTY: {path: undefined} => 404 with an empty body and no filesystem read', async () => {
    const proxy = ImageServeResponderProxy();

    const result = await proxy.callResponder({ path: undefined });

    expect(result).toStrictEqual({ status: 404, bytes: new Uint8Array(), contentType: null });
  });

  // No read is staged on this proxy — the guard rejects an empty path before any read is attempted.
  it('EMPTY: {path: ""} => 404 with an empty body and no filesystem read', async () => {
    const proxy = ImageServeResponderProxy();

    const result = await proxy.callResponder({ path: '' });

    expect(result).toStrictEqual({ status: 404, bytes: new Uint8Array(), contentType: null });
  });

  // No read is staged on this proxy — the guard rejects a traversal path before any read is attempted.
  it('INVALID: {path: "/a/../../../../etc/passwd" traversal} => 404 with an empty body', async () => {
    const proxy = ImageServeResponderProxy();

    const result = await proxy.callResponder({ path: '/a/../../../../etc/passwd' });

    expect(result).toStrictEqual({ status: 404, bytes: new Uint8Array(), contentType: null });
  });

  // No read is staged on this proxy — the extension check rejects a non-image path before any read.
  it('INVALID: {path: "/etc/passwd" non-image extension} => 404 with an empty body', async () => {
    const proxy = ImageServeResponderProxy();

    const result = await proxy.callResponder({ path: '/etc/passwd' });

    expect(result).toStrictEqual({ status: 404, bytes: new Uint8Array(), contentType: null });
  });

  it('ERROR: {read rejects ENOENT} => 404 with an empty body', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/missing.png' });
    const proxy = ImageServeResponderProxy();
    proxy.setupReadFailure({ filePath, error: new Error('ENOENT: no such file or directory') });

    const result = await proxy.callResponder({ path: filePath });

    expect(result).toStrictEqual({ status: 404, bytes: new Uint8Array(), contentType: null });
  });
});
