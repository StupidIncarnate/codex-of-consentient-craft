import { Hono } from 'hono';

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';
import { imageServeStatics } from '../../statics/image-serve/image-serve-statics';
import { ImagesFlow } from './images-flow';

const PNG_SIGNATURE_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03,
]);

const WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

const JPG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

const JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
]);

const GIF_BYTES = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00,
]);

// The case LIST is derived from pastedImageStatics.allowedExtensions, so a newly admitted
// extension is picked up automatically; only the per-extension expected MIME and fixture bytes
// are literal here (each extension's bytes byte-distinct from every other fixture in this file,
// so a bytes-match-disk assertion proves which file the route actually read). A route-admitted
// extension with no case below throws rather than silently dropping out of coverage.
const VALID_EXTENSION_CASES = pastedImageStatics.allowedExtensions.map((extension) => {
  switch (extension) {
    case 'png':
      return [extension, 'image/png', PNG_SIGNATURE_BYTES] as const;
    case 'jpg':
      return [extension, 'image/jpeg', JPG_BYTES] as const;
    case 'jpeg':
      return [extension, 'image/jpeg', JPEG_BYTES] as const;
    case 'gif':
      return [extension, 'image/gif', GIF_BYTES] as const;
    case 'webp':
      return [extension, 'image/webp', WEBP_BYTES] as const;
    default:
      throw new Error(`no fixture bytes registered for extension: ${String(extension)}`);
  }
});

// The bytes a symlink escaping the images directory points at — byte-distinct from every other
// fixture here, so a response carrying them can only have come from outside that directory.
const SECRET_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xde, 0xad, 0xbe, 0xef,
]);

const PATH_PARAM = apiRoutesStatics.images.pathQueryParam;

describe('ImagesFlow', () => {
  describe('GET /api/images', () => {
    const harness = serverAppHarness();

    const MALFORMED_CASES = [
      [
        'path traversal segments',

        async () => {
          await Promise.resolve();
          return {
            queryString: `?${PATH_PARAM}=${encodeURIComponent('/a/../../../../etc/passwd')}`,
            cleanup: () => {},
          };
        },
        null,
      ],
      [
        'null byte in decoded path',

        async () => {
          await Promise.resolve();
          return {
            queryString: `?${PATH_PARAM}=${encodeURIComponent(`/tmp/quest${String.fromCharCode(0)}.png`)}`,
            cleanup: () => {},
          };
        },
        null,
      ],
      [
        'newline in decoded path',

        async () => {
          await Promise.resolve();
          return {
            queryString: `?${PATH_PARAM}=${encodeURIComponent('/tmp/quest\n.png')}`,
            cleanup: () => {},
          };
        },
        null,
      ],
      [
        'carriage return in decoded path',

        async () => {
          await Promise.resolve();
          return {
            queryString: `?${PATH_PARAM}=${encodeURIComponent('/tmp/quest\r.png')}`,
            cleanup: () => {},
          };
        },
        null,
      ],
      [
        'relative path',

        async () => {
          await Promise.resolve();
          return {
            queryString: `?${PATH_PARAM}=${encodeURIComponent('relative/img.png')}`,
            cleanup: () => {},
          };
        },
        null,
      ],
      [
        'missing parameter',

        async () => {
          await Promise.resolve();
          return {
            queryString: '',
            cleanup: () => {},
          };
        },
        null,
      ],
      [
        'empty parameter',

        async () => {
          await Promise.resolve();
          return {
            queryString: `?${PATH_PARAM}=`,
            cleanup: () => {},
          };
        },
        null,
      ],
      [
        'over-long path',

        async () => {
          await Promise.resolve();
          return {
            // absolute, so every earlier guard check passes; only the length check can refuse it
            queryString: `?${PATH_PARAM}=${encodeURIComponent(`/tmp/${'a'.repeat(imageServeStatics.maxPathLength)}.png`)}`,
            cleanup: () => {},
          };
        },
        null,
      ],
      [
        'non-image extension',

        async () => {
          await Promise.resolve();
          return {
            queryString: `?${PATH_PARAM}=${encodeURIComponent('/etc/passwd')}`,
            cleanup: () => {},
          };
        },
        null,
      ],
      [
        'missing file',

        async () => {
          const { dirPath, cleanup } = await harness.seedImageFile({
            baseName: 'images-flow-missing-file',
            fileName: 'seed.png',
            bytes: PNG_SIGNATURE_BYTES,
          });
          return {
            queryString: `?${PATH_PARAM}=${encodeURIComponent(`${dirPath}/never-written.png`)}`,
            cleanup,
          };
        },
        null,
      ],
    ] as const;

    it.each(VALID_EXTENSION_CASES)(
      'VALID: {a real .%s file on disk} => returns 200 with bytes matching disk and Content-Type %s',
      async (extension, expectedContentType, bytes) => {
        const app = ImagesFlow();
        const { imagePath, cleanup } = await harness.seedImageFile({
          baseName: `images-flow-${extension}`,
          fileName: `pasted.${extension}`,
          bytes,
        });

        const response = await app.request(
          `${apiRoutesStatics.images.serve}?${PATH_PARAM}=${encodeURIComponent(imagePath)}`,
        );
        const responseBytes = new Uint8Array(await response.arrayBuffer());
        const { status } = response;
        const contentType = response.headers.get('content-type');
        cleanup();

        expect({ status, contentType, responseBytes }).toStrictEqual({
          status: 200,
          contentType: expectedContentType,
          responseBytes: bytes,
        });
      },
    );

    it('VALID: {mounted ahead of the SPA catch-all} => answers with the image instead of falling through', async () => {
      const app = new Hono();
      app.route('', ImagesFlow());
      app.get('*', (c) => c.json({ fellThrough: true }));

      const { imagePath, cleanup } = await harness.seedImageFile({
        baseName: 'images-flow-mount-order',
        fileName: 'pasted.png',
        bytes: PNG_SIGNATURE_BYTES,
      });

      const response = await app.request(
        `${apiRoutesStatics.images.serve}?${PATH_PARAM}=${encodeURIComponent(imagePath)}`,
      );
      const responseBytes = new Uint8Array(await response.arrayBuffer());
      const { status } = response;
      cleanup();

      expect(status).toBe(200);
      expect(responseBytes).toStrictEqual(PNG_SIGNATURE_BYTES);
    });

    // A REAL symlink, resolved by the real kernel. Both requests hit the SAME images directory, so
    // the only difference between them is where each path lands: the sibling is an ordinary file
    // and answers 200 with its bytes; the link points one directory sideways, outside that images
    // directory, and answers 404 with nothing. Serve the path without resolving it first (or
    // compare the unresolved name against the images directory) and the symlink row goes red as
    // {status: 200, byteLength: 12} carrying SECRET_BYTES — the target's contents, handed out as
    // image/png. Drop the confinement check as well and the sibling row stays green, which is why
    // both rows are asserted together rather than the link alone.
    it('INVALID: {a symlink inside the images directory pointing at a file outside it} => 404 with zero bytes, while a plain sibling in that same directory still answers 200', async () => {
      const app = ImagesFlow();
      const { symlinkPath, siblingPath, cleanup } = await harness.seedSymlinkEscapingImagesDir({
        baseName: 'images-flow-symlink-escape',
        linkFileName: 'escape.png',
        targetFileName: 'secret.png',
        targetBytes: SECRET_BYTES,
        siblingFileName: 'sibling.png',
        siblingBytes: PNG_SIGNATURE_BYTES,
      });

      const symlinkResponse = await app.request(
        `${apiRoutesStatics.images.serve}?${PATH_PARAM}=${encodeURIComponent(symlinkPath)}`,
      );
      const symlinkBytes = await symlinkResponse.arrayBuffer();
      const siblingResponse = await app.request(
        `${apiRoutesStatics.images.serve}?${PATH_PARAM}=${encodeURIComponent(siblingPath)}`,
      );
      const siblingBytes = new Uint8Array(await siblingResponse.arrayBuffer());
      cleanup();

      expect({
        symlinkStatus: symlinkResponse.status,
        symlinkByteLength: symlinkBytes.byteLength,
        symlinkContentType: symlinkResponse.headers.get('content-type'),
        siblingStatus: siblingResponse.status,
        siblingBytes,
      }).toStrictEqual({
        symlinkStatus: 404,
        symlinkByteLength: 0,
        symlinkContentType: null,
        siblingStatus: 200,
        siblingBytes: PNG_SIGNATURE_BYTES,
      });
    });

    it.each(MALFORMED_CASES)(
      'INVALID: %s => answers 404 with zero bytes and no content-type header',
      async (_caseName, buildCase, expectedContentType) => {
        const app = ImagesFlow();
        const { queryString, cleanup } = await buildCase();

        const response = await app.request(`${apiRoutesStatics.images.serve}${queryString}`);
        const bytes = await response.arrayBuffer();
        const { status } = response;
        const contentType = response.headers.get('content-type');
        cleanup();

        expect({ status, byteLength: bytes.byteLength, contentType }).toStrictEqual({
          status: 404,
          byteLength: 0,
          contentType: expectedContentType,
        });
      },
    );
  });
});
