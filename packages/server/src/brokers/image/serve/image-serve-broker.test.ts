import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { imageServeBroker } from './image-serve-broker';
import { imageServeBrokerProxy } from './image-serve-broker.proxy';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe('imageServeBroker', () => {
  it('VALID: {path: readable .png} => returns those exact bytes with image/png', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/abc.png' });
    const bytes = new Uint8Array([...PNG_SIGNATURE, 0x01, 0x02, 0x03]);
    const proxy = imageServeBrokerProxy();
    proxy.setupFileBytes({ filePath, bytes });

    const result = await imageServeBroker({ path: filePath });

    expect(result).toStrictEqual({ bytes, contentType: 'image/png' });
  });

  it('VALID: {path: readable .webp} => returns those exact bytes with image/webp', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/abc.webp' });
    const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);
    const proxy = imageServeBrokerProxy();
    proxy.setupFileBytes({ filePath, bytes });

    const result = await imageServeBroker({ path: filePath });

    expect(result).toStrictEqual({ bytes, contentType: 'image/webp' });
  });

  // No read is staged on this proxy — if the broker ever reached the filesystem for a
  // traversal path, registerMock would throw on the unstaged call instead of letting this pass.
  it('INVALID: {path: "/a/../../../../etc/passwd" traversal} => null', async () => {
    imageServeBrokerProxy();

    const result = await imageServeBroker({ path: '/a/../../../../etc/passwd' });

    expect(result).toBe(null);
  });

  // No read is staged on this proxy — if the broker ever reached the filesystem for a
  // non-image extension, registerMock would throw on the unstaged call instead of letting this pass.
  it('INVALID: {path: "/etc/passwd" non-image extension} => null', async () => {
    imageServeBrokerProxy();

    const result = await imageServeBroker({ path: '/etc/passwd' });

    expect(result).toBe(null);
  });

  it('ERROR: {read rejects ENOENT} => null', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/missing.png' });
    const proxy = imageServeBrokerProxy();
    proxy.setupReadFailure({
      filePath,
      error: new Error('ENOENT: no such file or directory'),
    });

    const result = await imageServeBroker({ path: filePath });

    expect(result).toBe(null);
  });
});
