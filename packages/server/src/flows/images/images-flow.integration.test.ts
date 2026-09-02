import { Hono } from 'hono';

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

const PATH_PARAM = apiRoutesStatics.images.pathQueryParam;

describe('ImagesFlow', () => {
  describe('GET /api/images', () => {
    const harness = serverAppHarness();

    const MALFORMED_CASES = [
      [
        'path traversal segments',
        () => ({
          queryString: `?${PATH_PARAM}=${encodeURIComponent('/a/../../../../etc/passwd')}`,
          cleanup: () => {},
        }),
        null,
      ],
      [
        'null byte in decoded path',
        () => ({
          queryString: `?${PATH_PARAM}=${encodeURIComponent(`/tmp/quest${String.fromCharCode(0)}.png`)}`,
          cleanup: () => {},
        }),
        null,
      ],
      [
        'newline in decoded path',
        () => ({
          queryString: `?${PATH_PARAM}=${encodeURIComponent('/tmp/quest\n.png')}`,
          cleanup: () => {},
        }),
        null,
      ],
      [
        'carriage return in decoded path',
        () => ({
          queryString: `?${PATH_PARAM}=${encodeURIComponent('/tmp/quest\r.png')}`,
          cleanup: () => {},
        }),
        null,
      ],
      [
        'relative path',
        () => ({
          queryString: `?${PATH_PARAM}=${encodeURIComponent('relative/img.png')}`,
          cleanup: () => {},
        }),
        null,
      ],
      [
        'missing parameter',
        () => ({
          queryString: '',
          cleanup: () => {},
        }),
        null,
      ],
      [
        'empty parameter',
        () => ({
          queryString: `?${PATH_PARAM}=`,
          cleanup: () => {},
        }),
        null,
      ],
      [
        'over-long path',
        () => ({
          // absolute, so every earlier guard check passes; only the length check can refuse it
          queryString: `?${PATH_PARAM}=${encodeURIComponent(`/tmp/${'a'.repeat(imageServeStatics.maxPathLength)}.png`)}`,
          cleanup: () => {},
        }),
        null,
      ],
      [
        'non-image extension',
        () => ({
          queryString: `?${PATH_PARAM}=${encodeURIComponent('/etc/passwd')}`,
          cleanup: () => {},
        }),
        null,
      ],
      [
        'missing file',
        () => {
          const { dirPath, cleanup } = harness.seedImageFile({
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

    it('VALID: {a real .png file on disk} => returns 200 with bytes matching disk and Content-Type image/png', async () => {
      const app = ImagesFlow();
      const { imagePath, cleanup } = harness.seedImageFile({
        baseName: 'images-flow-png',
        fileName: 'pasted.png',
        bytes: PNG_SIGNATURE_BYTES,
      });

      const response = await app.request(
        `${apiRoutesStatics.images.serve}?${PATH_PARAM}=${encodeURIComponent(imagePath)}`,
      );
      const responseBytes = new Uint8Array(await response.arrayBuffer());
      const { status } = response;
      const contentType = response.headers.get('content-type');
      cleanup();

      expect(status).toBe(200);
      expect(responseBytes).toStrictEqual(PNG_SIGNATURE_BYTES);
      expect(contentType).toBe('image/png');
    });

    it('VALID: {a real .webp file on disk} => returns Content-Type image/webp', async () => {
      const app = ImagesFlow();
      const { imagePath, cleanup } = harness.seedImageFile({
        baseName: 'images-flow-webp',
        fileName: 'pasted.webp',
        bytes: WEBP_BYTES,
      });

      const response = await app.request(
        `${apiRoutesStatics.images.serve}?${PATH_PARAM}=${encodeURIComponent(imagePath)}`,
      );
      const responseBytes = new Uint8Array(await response.arrayBuffer());
      const { status } = response;
      const contentType = response.headers.get('content-type');
      cleanup();

      expect(status).toBe(200);
      expect(responseBytes).toStrictEqual(WEBP_BYTES);
      expect(contentType).toBe('image/webp');
    });

    it('VALID: {mounted ahead of the SPA catch-all} => answers with the image instead of falling through', async () => {
      const app = new Hono();
      app.route('', ImagesFlow());
      app.get('*', (c) => c.json({ fellThrough: true }));

      const { imagePath, cleanup } = harness.seedImageFile({
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

    it.each(MALFORMED_CASES)(
      'INVALID: %s => answers 404 with zero bytes and no content-type header',
      async (_caseName, buildCase, expectedContentType) => {
        const app = ImagesFlow();
        const { queryString, cleanup } = buildCase();

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
