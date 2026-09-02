import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

// Every request in this file goes STRAIGHT to the real API server on DUNGEONMASTER_PORT (built by
// the harness's buildExpectedImageUrl / buildImagesRouteUrl / buildServerRouteUrl), never through
// Vite's `/api` proxy on the web dev server — that is the whole reason these units live here rather
// than in a Jest test: ServerFlow cannot be assembled in-process without binding a socket, starting
// a WS server, and installing SIGTERM handlers that call process.exit, so a Jest test can only
// reach ImagesFlow() in isolation behind a stand-in catch-all. The webServer Playwright already
// starts for this project (packages/web/playwright.config.ts's first `webServer` entry) is the
// fully assembled app — every subApp plus the real SPA catch-all from ServerInitResponder — so this
// file needs no `page`, only the `request` fixture.
const IMAGE_WIDTH_PX = 6;
const IMAGE_HEIGHT_PX = 6;

// EVERY refusal on this route answers with an EMPTY Uint8Array body and `headers: {}` (see
// image-serve-responder.ts / images-flow.ts), which reads as "no Content-Type header" from the
// responder's own contentType:null field — but @hono/node-server's Response wrapper defaults an
// empty-headers Uint8Array body to this exact value on the wire regardless, verified directly
// against the installed @hono/node-server + hono packages (a real body-less GET against a
// `c.body(new Uint8Array(), 404, {})` handler comes back with exactly this Content-Type and
// content-length 0). A header IS present; it is just never one of the image types — asserting the
// real wire value here, not the responder's internal intent, is what keeps this a regression guard
// rather than a check that quietly stops matching reality.
const NO_CONTENT_TYPE_WIRE_VALUE = 'text/plain; charset=UTF-8';

const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('Image route answers', () => {
  test('VALID: {GET the seeded image path, then GET a definitely-unmounted /api path} => the images route answers 200 with the real bytes, and the unrouted path gets a different, unrouted 404', async ({
    request,
  }) => {
    const seeded = images.seedImageFile({
      fileName: 'route-answers.png',
      widthPx: IMAGE_WIDTH_PX,
      heightPx: IMAGE_HEIGHT_PX,
      seed: 11,
    });
    const seededUrl = String(images.buildExpectedImageUrl({ imagePath: String(seeded.imagePath) }));

    const mountedResponse = await request.get(seededUrl);
    const mountedBody = await mountedResponse.body();

    expect({
      status: mountedResponse.status(),
      contentType: mountedResponse.headers()['content-type'],
    }).toStrictEqual({ status: 200, contentType: 'image/png' });
    expect(mountedBody).toStrictEqual(seeded.bytes);

    // Every refusal on the images route is ALSO a 404, so a 404 alone can never distinguish "not
    // mounted" from "refused" — the mount proof above (200 WITH bytes) is what proves the route is
    // registered, and this unrouted request is the contrast that proves the catch-all exists at
    // all: Hono's own default notFoundHandler (`c.text('404 Not Found', 404)`), never the images
    // route's own always-empty-body refusal shape.
    const unroutedUrl = String(
      images.buildServerRouteUrl({ pathname: '/api/definitely-not-a-route' }),
    );
    const unroutedResponse = await request.get(unroutedUrl);
    const unroutedBody = await unroutedResponse.body();

    expect({
      status: unroutedResponse.status(),
      bodyText: unroutedBody.toString('utf8'),
    }).toStrictEqual({ status: 404, bodyText: '404 Not Found' });
  });

  test('VALID: {a seeded PNG whose bytes contain a NUL, a run of 0xFF, and a 0x0A} => the response body bytes exactly equal the file on disk', async ({
    request,
  }) => {
    const seeded = images.seedHostileBytesFile({ fileName: 'hostile.png' });
    expect(images.verifyHostileBytesPresent({ bytes: seeded.bytes })).toBe(true);

    const url = String(images.buildExpectedImageUrl({ imagePath: String(seeded.imagePath) }));
    const response = await request.get(url);
    const body = await response.body();

    expect(body).toStrictEqual(seeded.bytes);
  });

  test('VALID: {a .png path and a .webp path} => Content-Type is image/png for the .png path and image/webp for the .webp path, never the same value for both', async ({
    request,
  }) => {
    const pngSeeded = images.seedImageFile({
      fileName: 'content-type.png',
      widthPx: IMAGE_WIDTH_PX,
      heightPx: IMAGE_HEIGHT_PX,
      seed: 12,
    });
    // The route maps content-type from the EXTENSION, so the bytes need not be real webp for this
    // case — a .webp-named copy of the same PNG bytes is sufficient and correct here.
    const webpSeeded = images.seedImageFile({
      fileName: 'content-type.webp',
      widthPx: IMAGE_WIDTH_PX,
      heightPx: IMAGE_HEIGHT_PX,
      seed: 13,
    });

    const pngUrl = String(images.buildExpectedImageUrl({ imagePath: String(pngSeeded.imagePath) }));
    const webpUrl = String(
      images.buildExpectedImageUrl({ imagePath: String(webpSeeded.imagePath) }),
    );

    const pngResponse = await request.get(pngUrl);
    const webpResponse = await request.get(webpUrl);

    expect({
      pngContentType: pngResponse.headers()['content-type'],
      webpContentType: webpResponse.headers()['content-type'],
    }).toStrictEqual({ pngContentType: 'image/png', webpContentType: 'image/webp' });
  });

  // THE REFUSAL MATRIX — one test driving all ten rows the harness's buildRefusalMatrixRows builds:
  // traversal segments, an embedded NUL byte, an embedded LF, an embedded CR, a relative path, a
  // missing path param, an empty path param, an overlong path, a missing file inside a real
  // directory, and a non-image extension on a real file. Every row asserts the identical
  // {status, byteLength, contentType} shape via ONE toStrictEqual (only the literal `name` differs
  // per DAMP's parameterization rule), plus the identical header-injection-canary shape — both use
  // expect.soft so one row's failure never hides another's in the same run. Rows are driven via
  // .reduce() (not a `for` loop) so each row's request completes before the next begins without
  // tripping no-await-in-loop — the same sequential-await shape composer-paste-refusals.e2e.ts uses.
  test('INVALID: {traversal segments, a NUL byte, an embedded LF, an embedded CR, a relative path, a missing path param, an empty path param, an overlong path, a missing file, and a non-image extension} => every one of the ten answers 404 with a zero-length body, never an image Content-Type, and leaks nothing it was sent back into a response header', async ({
    request,
  }) => {
    const rows = images.buildRefusalMatrixRows();

    await rows.reduce(async (previous, row) => {
      await previous;

      const name = String(row.name);
      const url = String(row.url);
      const canary = String(row.canary);

      const response = await request.get(url);
      const body = await response.body();

      expect
        .soft({
          name,
          status: response.status(),
          byteLength: body.length,
          contentType: response.headers()['content-type'],
        })
        .toStrictEqual({
          name,
          status: 404,
          byteLength: 0,
          contentType: NO_CONTENT_TYPE_WIRE_VALUE,
        });

      const leaked = Object.values(response.headers()).filter((value) => value.includes(canary));
      expect.soft({ name, leaked }).toStrictEqual({ name, leaked: [] });
    }, Promise.resolve());
  });

  // check-never-403 collects its own real statuses (a fresh mounted 200 plus a fresh run of THE
  // REFUSAL MATRIX's ten rows) INSIDE this one test, rather than accumulating a module-level array
  // across the file's separate tests. Playwright retires the worker process after any failing test
  // in the file and starts the next test in a brand-new process — verified directly: a plain
  // module-level array populated by an earlier test reads back EMPTY in a later one the moment
  // anything before it fails, because that later test's `workerIndex` changes. A regression that
  // introduced a real 403 would fail an earlier test in this file too, so a cross-test accumulator
  // is exactly backwards: it loses the evidence in precisely the run where this unit needs it.
  test('VALID: {a fresh mounted 200 plus a fresh run of every refusal-matrix row} => the only status codes ever seen are 200 and 404, never 403 or 500', async ({
    request,
  }) => {
    const mountedSeeded = images.seedImageFile({
      fileName: 'never-403-mounted.png',
      widthPx: IMAGE_WIDTH_PX,
      heightPx: IMAGE_HEIGHT_PX,
      seed: 21,
    });
    const mountedUrl = String(
      images.buildExpectedImageUrl({ imagePath: String(mountedSeeded.imagePath) }),
    );
    const mountedResponse = await request.get(mountedUrl);

    const recordedStatuses: unknown[] = [mountedResponse.status()];

    const rows = images.buildRefusalMatrixRows();
    await rows.reduce(async (previous, row) => {
      await previous;
      const response = await request.get(String(row.url));
      recordedStatuses.push(response.status());
    }, Promise.resolve());

    const uniqueStatuses = Array.from(
      new Set(recordedStatuses.map((status) => String(status))),
    ).sort();

    expect(uniqueStatuses).toStrictEqual(['200', '404']);
  });
});
