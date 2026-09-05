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

  // The file is REAL here — it exists, it is readable, and its bytes are staged — so the only
  // thing that can refuse it is where it sits. Drop the confinement check and this goes red with
  // {bytes, contentType: 'image/png'} instead of null, which is exactly the defect: an allowed
  // extension anywhere on the host used to be servable.
  it('INVALID: {path: a readable .png outside any images directory} => null', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/backup/id_rsa.png' });
    const bytes = new Uint8Array([...PNG_SIGNATURE, 0x01, 0x02, 0x03]);
    const proxy = imageServeBrokerProxy();
    proxy.setupFileBytes({ filePath, bytes });

    const result = await imageServeBroker({ path: filePath });

    expect(result).toBe(null);
  });

  // Sibling of the case above, one directory deeper: the images directory that confines a file is
  // the one holding it, not any images directory further up the tree. Red at {bytes, contentType}
  // if the check is ever loosened to a prefix/startsWith test against an ancestor.
  it('INVALID: {path: a readable .png in a subdirectory of an images directory} => null', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/nested/abc.png' });
    const bytes = new Uint8Array([...PNG_SIGNATURE, 0x04, 0x05, 0x06]);
    const proxy = imageServeBrokerProxy();
    proxy.setupFileBytes({ filePath, bytes });

    const result = await imageServeBroker({ path: filePath });

    expect(result).toBe(null);
  });

  // The directory IS called `images` and the file inside it is real and readable, so the
  // containing-directory comparison alone lets this through — only the quest file next to that
  // directory can refuse it, and there isn't one. Drop that probe and this goes red with
  // {bytes, contentType: 'image/png'}: every `images` directory on the host becomes servable,
  // which is a folder name far too ordinary to hang a boundary on.
  it('INVALID: {path: a readable .png in an images directory whose parent holds no quest file} => null', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/home/user/Pictures/images/private.png' });
    const bytes = new Uint8Array([...PNG_SIGNATURE, 0x07, 0x08, 0x09]);
    const proxy = imageServeBrokerProxy();
    proxy.setupFileBytesWithoutQuestFile({ filePath, bytes });

    const result = await imageServeBroker({ path: filePath });

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
