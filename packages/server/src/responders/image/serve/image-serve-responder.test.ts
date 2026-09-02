import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { imageServeStatics } from '../../../statics/image-serve/image-serve-statics';
import { ImageServeResponderProxy } from './image-serve-responder.proxy';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// Every shape the guard/extension check is documented to refuse before any filesystem read.
// `as const` keeps each row's second element as its own literal type instead of a widened union.
const MALFORMED_CASES = [
  ['traversal', '/a/../../../../etc/passwd'],
  ['null byte', '/tmp/quest/images/abc\0evil.png'],
  ['newline', '/tmp/quest/images/abc\nevil.png'],
  ['carriage return', '/tmp/quest/images/abc\revil.png'],
  ['relative path', 'p/x.png'],
  ['path undefined', undefined],
  ['empty string', ''],
  ['over max length', `/${'a'.repeat(imageServeStatics.maxPathLength)}`],
  ['non-image extension', '/etc/passwd'],
] as const;

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

  // No read is staged on this proxy — every one of these shapes is refused by the guard or the
  // extension check before any filesystem read is attempted.
  it.each(MALFORMED_CASES)(
    'INVALID: {path: %s} => 404 with an empty body',
    async (_label, path) => {
      const proxy = ImageServeResponderProxy();

      const result = await proxy.callResponder({ path });

      expect(result).toStrictEqual({ status: 404, bytes: new Uint8Array(), contentType: null });
    },
  );

  // Every malformed/refused shape from MALFORMED_CASES is driven through the SAME responder +
  // dev-log spy in one sequence so this proves the whole run stayed silent, not just one input in
  // isolation. The 404-per-case behavior is already proven above; this test's only job is the log.
  it('INVALID: {every malformed or refused path in sequence} => no "Image serve/read failed" log line', async () => {
    const proxy = ImageServeResponderProxy();
    proxy.enableDevLogs();

    await Promise.all(MALFORMED_CASES.map(async ([, path]) => proxy.callResponder({ path })));

    proxy.disableDevLogs();

    const writtenLines = proxy.getDevLogOutput().map((call) => String(call[0]));
    const failureLines = writtenLines.filter((line) => /Image (serve|read) failed/u.test(line));

    expect(failureLines).toStrictEqual([]);
  });

  // Positive control for the negative assertion above: if the recorder above recorded nothing at
  // all, this proves it would still report an empty list, which would make that test vacuous.
  it('ERROR: {fsReadFileBytesAdapter rejects for a readable image path} => 404 and logs "Image read failed for"', async () => {
    const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/missing.png' });
    const proxy = ImageServeResponderProxy();
    proxy.enableDevLogs();
    proxy.setupReadFailure({ filePath, error: new Error('ENOENT: no such file or directory') });

    const result = await proxy.callResponder({ path: filePath });

    expect(result).toStrictEqual({ status: 404, bytes: new Uint8Array(), contentType: null });

    proxy.disableDevLogs();

    const writtenLines = proxy.getDevLogOutput().map((call) => String(call[0]));
    const readFailedLines = writtenLines.filter((line) => line.includes('Image read failed for'));

    expect(readFailedLines).toStrictEqual([
      '[dev] Image read failed for /tmp/quest/images/missing.png: ENOENT: no such file or directory\n',
    ]);
  });
});
