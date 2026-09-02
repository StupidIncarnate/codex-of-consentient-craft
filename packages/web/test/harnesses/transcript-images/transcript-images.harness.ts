/**
 * PURPOSE: Builds real, byte-distinct PNG fixtures on disk (a hand-rolled encoder — no browser
 * involved, so callers never need a `page` to seed a fixture) and reads back a transcript bubble's
 * rendered image segments once a session carrying pasted-image markdown tokens has been replayed
 * into the DOM. `packages/web/CLAUDE.md`'s WHY section explains the replay path this harness rides:
 * a session JSONL seeded with a RAW filesystem path token gets that token rewritten into a served
 * `/api/images` URL by the orchestrator's replay broker before the browser ever sees it, so every
 * token this harness builds carries the raw path — never a pre-resolved URL.
 *
 * Every read method below returns `unknown` (or an array/object built from it): these are test-only
 * DOM/Node reads with no production contract to brand them against, and the scenario compares them
 * structurally (toStrictEqual / toBe) rather than by property access — mirrors
 * composer-paste.harness.ts's own stated reasoning for the same shape.
 *
 * USAGE:
 * const images = transcriptImagesHarness();
 * const seeded = images.seedImageFile({ fileName: 'a.png', widthPx: 20, heightPx: 20, seed: 1 });
 * const content = images.buildTokenLine({
 *   segments: [{ text: 'A' }, { imagePath: String(seeded.imagePath), ordinal: 1 }, { text: 'B' }],
 * });
 * // content === 'A![Pasted Image 1](<seeded.imagePath>)B' — hand this to
 * // sessionHarness({ guildPath }).createSessionFile({ sessionId, userMessage: String(content) })
 * const children = await images.readBubbleChildren({ page });
 * // [{ tag: 'span', text: 'A', testId: 'CHAT_MESSAGE_TEXT', src: '' }, { tag: 'img', ... }, ...]
 */
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { crc32, deflateSync } from 'zlib';

import type { Page, Response } from '@playwright/test';

import { environmentStatics, pastedImageStatics } from '@dungeonmaster/shared/statics';

// Package-local, not `@dungeonmaster/shared` — the overlay's sizing knobs live here, not in the
// cross-package statics barrel. A relative reach into `src/` is what every overlay-geometry
// assertion needs to avoid hand-typing 75/90: `enforce-harness-patterns` (the lint rule governing
// what a *.harness.ts may import) only bans `.proxy` paths and paths ending `-contract`, so this
// import is mechanically unblocked even though sibling harnesses restate other statics as literals.
import { webConfigStatics } from '../../../src/statics/web-config/web-config-statics';

// Every browser-evaluated function below is passed BY REFERENCE to page.evaluate, which serializes
// only the function's own source text — no outer closure survives the trip, so each one is entirely
// self-contained. Mirrors the *_BROWSER_FN functions in composer-paste.harness.ts. None of them
// declare an explicit return type: they are module-private, and their result flows straight into a
// harness method below that is itself typed `unknown` — see the file header.

// Reads IMAGE_CONTENT_LAYER's direct Element children in DOM order — every rendered segment (text
// span, img, or broken-image span) IS a real Element per image-content-layer-widget.tsx, so
// `.children` (which skips bare text nodes) is the exact child list the widget produces.
const READ_IMAGE_CONTENT_LAYER_CHILDREN_BROWSER_FN = () => {
  const layer = document.querySelector('[data-testid="IMAGE_CONTENT_LAYER"]');
  if (layer === null) {
    throw new Error('transcript-images harness: IMAGE_CONTENT_LAYER not found');
  }
  return Array.from(layer.children).map((child) => ({
    tag: child.tagName.toLowerCase(),
    text: child.textContent ?? '',
    testId: child.getAttribute('data-testid') ?? '',
    src: child.tagName.toLowerCase() === 'img' ? (child.getAttribute('src') ?? '') : '',
  }));
};

// IMAGE_CONTENT_LAYER's whole textContent — an <img> contributes nothing to textContent, so this IS
// "the bubble text with every img stripped" without any explicit stripping step.
const READ_IMAGE_CONTENT_LAYER_TEXT_BROWSER_FN = () => {
  const layer = document.querySelector('[data-testid="IMAGE_CONTENT_LAYER"]');
  if (layer === null) {
    throw new Error('transcript-images harness: IMAGE_CONTENT_LAYER not found');
  }
  return layer.textContent ?? '';
};

const READ_CHAT_MESSAGE_IMAGE_NATURAL_WIDTH_BROWSER_FN = (params: { index: number }) => {
  const images = document.querySelectorAll('[data-testid="CHAT_MESSAGE_IMAGE"]');
  const image = images[params.index];
  if (!(image instanceof HTMLImageElement)) {
    throw new Error(
      `transcript-images harness: CHAT_MESSAGE_IMAGE not found at index ${String(params.index)}`,
    );
  }
  return image.naturalWidth;
};

// getComputedStyle is what resolves the widget's `${overlayMaxHeightPercent}vh` inline style into
// an absolute px string — the raw style attribute would still read "90vh", proving nothing about
// what the browser actually laid out.
const READ_OVERLAY_COMPUTED_MAX_HEIGHT_BROWSER_FN = () => {
  const overlay = document.querySelector('[data-testid="IMAGE_OVERLAY"]');
  if (overlay === null) {
    throw new Error('transcript-images harness: IMAGE_OVERLAY not found');
  }
  return getComputedStyle(overlay).maxHeight;
};

// Mirrors READ_CHAT_MESSAGE_IMAGE_NATURAL_WIDTH_BROWSER_FN but targets the overlay's OWN <img> —
// the transcript thumbnail and the full-size overlay render two separate <img> elements from the
// same `src`, so a naturalWidth read has to name which one it means.
const READ_OVERLAY_IMAGE_NATURAL_WIDTH_BROWSER_FN = () => {
  const image = document.querySelector('[data-testid="IMAGE_OVERLAY_IMAGE"]');
  if (!(image instanceof HTMLImageElement)) {
    throw new Error('transcript-images harness: IMAGE_OVERLAY_IMAGE not found');
  }
  return image.naturalWidth;
};

// scrollHeight vs clientHeight is the DOM's own "does this box actually scroll" test — clientHeight
// is the box's visible content area post-cap, scrollHeight is the full content it holds, so a taller
// image only makes them diverge if the maxHeight cap is genuinely constraining the box.
const READ_OVERLAY_CAN_SCROLL_BROWSER_FN = () => {
  const overlay = document.querySelector('[data-testid="IMAGE_OVERLAY"]');
  if (overlay === null) {
    throw new Error('transcript-images harness: IMAGE_OVERLAY not found');
  }
  return overlay.scrollHeight > overlay.clientHeight;
};

// Mantine's Modal resolves a percentage `size` against `.mantine-Modal-inner`'s CONTENT box, not the
// raw viewport — `.mantine-Modal-inner` is the border-box-sized wrapper carrying Mantine's own fixed
// (non-percentage) x/y offset padding, so `.mantine-Modal-content`'s width is
// `overlayWidthPercent% of (inner's border-box width minus its own left+right padding)`, never
// `overlayWidthPercent% of the bare window width`. A caller computing an expected content width has
// to measure THIS available width, not `page.viewportSize()`, or the formula is wrong regardless of
// what the widget renders.
const READ_MODAL_INNER_AVAILABLE_WIDTH_BROWSER_FN = () => {
  const inner = document.querySelector('.mantine-Modal-inner');
  if (inner === null) {
    throw new Error('transcript-images harness: .mantine-Modal-inner not found');
  }
  const computed = getComputedStyle(inner);
  const paddingLeft = Number.parseFloat(computed.paddingLeft);
  const paddingRight = Number.parseFloat(computed.paddingRight);
  return inner.getBoundingClientRect().width - paddingLeft - paddingRight;
};

// Installed BEFORE the send (see the calling spec's own comment on why): opens a MutationObserver
// over the whole document and appends ONE {bubbleCount, firstImageSrcPrefix} sample per DISTINCT
// state observed for the caller-chosen matchText. 'firstImageSrcPrefix' reads 'data:' | 'http:' | ''
// off the FIRST CHAT_MESSAGE_IMAGE inside the first CHAT_MESSAGE whose textContent contains
// matchText. Mirrors chat-control.harness.ts's own MutationObserver record-a-sequence shape: a
// point-in-time read can never prove an ORDERING — that the optimistic data: bubble gives way to the
// transcript's http: bubble IN PLACE, never alongside it — only a recorded sequence can.
// `attributes`/`attributeFilter: ['src']` is a belt-and-braces addition alongside `childList`: the
// transcript entry lands under a different `uuid` than the optimistic one, so React unmounts and
// remounts the whole bubble (a childList change) rather than patching the existing `<img>`'s `src` in
// place — but watching the attribute too costs nothing and covers a future render shape that reuses
// the node instead. Every field is left to TS inference (no explicit primitive-typed locals) to match
// this file's own no-explicit-primitive-annotation convention for browser-evaluated internals.
const INSTALL_TRANSCRIPT_SEQUENCE_RECORDER_BROWSER_FN = (params: { matchText: string }): void => {
  const state = { samples: [] as unknown[] };
  Object.assign(globalThis, { __transcriptImagesSequence: state });

  const sample = (): void => {
    const bubbles = Array.from(document.querySelectorAll('[data-testid="CHAT_MESSAGE"]')).filter(
      (element) => (element.textContent ?? '').includes(params.matchText),
    );
    const [firstBubble] = bubbles;
    let firstImageSrcPrefix = '';
    if (firstBubble !== undefined) {
      const image = firstBubble.querySelector('[data-testid="CHAT_MESSAGE_IMAGE"]');
      const src = image === null ? '' : (image.getAttribute('src') ?? '');
      if (src.startsWith('data:')) {
        firstImageSrcPrefix = 'data:';
      } else if (src.startsWith('http:')) {
        firstImageSrcPrefix = 'http:';
      }
    }

    const next = { bubbleCount: bubbles.length, firstImageSrcPrefix };
    const lastIndex = state.samples.length - 1;
    const last = lastIndex === -1 ? undefined : (state.samples[lastIndex] as typeof next);
    if (
      last === undefined ||
      last.bubbleCount !== next.bubbleCount ||
      last.firstImageSrcPrefix !== next.firstImageSrcPrefix
    ) {
      state.samples.push(next);
    }
  };

  new MutationObserver(sample).observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  });
  sample();
};

// Reads back the sequence INSTALL_TRANSCRIPT_SEQUENCE_RECORDER_BROWSER_FN built up on `globalThis` —
// split into its own function (rather than a plain page.evaluate arrow at the call site) to match
// every other browser-evaluated read in this file, which all serialize a standalone, self-contained
// function rather than a closure.
const READ_TRANSCRIPT_SEQUENCE_SAMPLES_BROWSER_FN = () =>
  (globalThis as unknown as { __transcriptImagesSequence?: { samples: unknown[] } })
    .__transcriptImagesSequence?.samples ?? [];

// --- Node-side PNG encoder -------------------------------------------------------------------
// A hand-rolled encoder rather than a canvas round-trip: seedImageFile has no `page` (per its own
// signature below), and a real decodable PNG is what proves the "readable image" branch and the
// naturalWidth assertions through a REAL browser decode rather than an assumed one. Colour type 2
// (RGB truecolor, no alpha) keeps the raw scanline math simple; deflateSync produces exactly the
// zlib-format (RFC 1950) stream PNG's IDAT chunk requires — no raw-deflate wrapping needed.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHUNK_LENGTH_BYTES = 4;

// PNG's chunk CRC is the same CRC-32 (IEEE 802.3, poly 0xEDB88320) algorithm node:zlib's own
// crc32() implements — reaching for the built-in rather than a hand-rolled table+shift
// implementation is what keeps this file free of `&`/`^`/`>>>`, which this repo's eslint config
// (`no-bitwise`) forbids outright.
const buildPngChunk = ({ type, data }: { type: string; data: Buffer }): Buffer => {
  const length = Buffer.alloc(CHUNK_LENGTH_BYTES);
  length.writeUInt32BE(data.length, 0);
  const typeBytes = Buffer.from(type, 'ascii');
  const crcValue = Buffer.alloc(CHUNK_LENGTH_BYTES);
  crcValue.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crcValue]);
};

const PNG_IHDR_BYTES = 13;
const PNG_BIT_DEPTH = 8;
const PNG_COLOR_TYPE_RGB_TRUECOLOR = 2;
const BYTES_PER_PIXEL = 3;
const FILTER_BYTES_PER_ROW = 1;
const SEED_RED_MULTIPLIER = 37;
const SEED_GREEN_MULTIPLIER = 59;
const SEED_BLUE_MULTIPLIER = 83;
const SEED_COLOR_MODULUS = 256;
const MIN_NOTCH_SIZE_PX = 2;
const NOTCH_BASE_PX = 4;
const NOTCH_PER_SEED_PX = 3;

// Fills the whole canvas with a seed-derived colour, then overwrites a seed-sized corner notch with
// the colour channels rotated — two different seeds can never encode to the same bytes even at
// identical width/height, mirroring composer-paste.harness.ts's BUILD_IMAGE_BROWSER_FN reasoning.
const buildPngBytes = ({
  widthPx,
  heightPx,
  seed,
}: {
  widthPx: number;
  heightPx: number;
  seed: number;
}): Buffer => {
  const ihdr = Buffer.alloc(PNG_IHDR_BYTES);
  ihdr.writeUInt32BE(widthPx, 0);
  ihdr.writeUInt32BE(heightPx, 4);
  ihdr.writeUInt8(PNG_BIT_DEPTH, 8);
  ihdr.writeUInt8(PNG_COLOR_TYPE_RGB_TRUECOLOR, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const red = (seed * SEED_RED_MULTIPLIER) % SEED_COLOR_MODULUS;
  const green = (seed * SEED_GREEN_MULTIPLIER) % SEED_COLOR_MODULUS;
  const blue = (seed * SEED_BLUE_MULTIPLIER) % SEED_COLOR_MODULUS;
  const notchSize = Math.max(
    MIN_NOTCH_SIZE_PX,
    Math.min(widthPx, heightPx, NOTCH_BASE_PX + seed * NOTCH_PER_SEED_PX),
  );

  const rowBytes = FILTER_BYTES_PER_ROW + widthPx * BYTES_PER_PIXEL;
  const raw = Buffer.alloc(rowBytes * heightPx);
  for (let y = 0; y < heightPx; y += 1) {
    const rowStart = y * rowBytes;
    raw.writeUInt8(0, rowStart);
    for (let x = 0; x < widthPx; x += 1) {
      const pixelStart = rowStart + FILTER_BYTES_PER_ROW + x * BYTES_PER_PIXEL;
      const inNotch = x < notchSize && y < notchSize;
      raw.writeUInt8(inNotch ? blue : red, pixelStart);
      raw.writeUInt8(inNotch ? red : green, pixelStart + 1);
      raw.writeUInt8(inNotch ? green : blue, pixelStart + 2);
    }
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    buildPngChunk({ type: 'IHDR', data: ihdr }),
    buildPngChunk({ type: 'IDAT', data: deflateSync(raw) }),
    buildPngChunk({ type: 'IEND', data: Buffer.alloc(0) }),
  ]);
};

const TEMP_DIR_PREFIX = 'dm-e2e-transcript-images-';

// --- Refusal-matrix fixtures (image-route-answers.e2e.ts) ------------------------------------
// That spec drives every documented /api/images refusal path through the REAL running e2e server
// (see its own header for why this can only be proven against the full ServerFlow assembly, not
// an in-process Jest harness behind a stand-in catch-all). Every value below is a raw, UNDECODED
// string headed for a query parameter — the caller percent-encodes it into the URL itself
// (buildImagesRouteUrl takes an already-assembled query string), never this file, so a null byte
// / newline / carriage return survives the trip exactly as typed rather than being silently
// stripped by an intermediate encode step.
const REFUSAL_MATRIX_TRAVERSAL_PATH = '/a/../../../../etc/passwd';
const REFUSAL_MATRIX_NON_IMAGE_PATH = '/etc/passwd';
const REFUSAL_MATRIX_RELATIVE_PATH = 'package.json';
const REFUSAL_MATRIX_OVERLONG_SEGMENT_LENGTH = 5000;
// The default canary is asserted against EVERY row (not just the two header-injection rows) so
// the whole matrix shares one assertion shape per DAMP's parameterization rule — only the literal
// canary value differs per row. For the eight non-injection rows it is inert by construction (a
// value the server has no path to ever echo); for the two newline rows it is exactly what a
// response-splitting regression would leak.
const REFUSAL_MATRIX_DEFAULT_CANARY = 'CANARY-NO-INJECTION-EXPECTED';
const REFUSAL_MATRIX_LF_CANARY = 'HEADER-INJECTION-CANARY-LF';
const REFUSAL_MATRIX_CR_CANARY = 'HEADER-INJECTION-CANARY-CR';

// check-bytes-match-disk's hostile member: a text-safe payload could survive a UTF-8 read that
// would silently corrupt real binary bytes, so this fixture deliberately carries a NUL byte, a run
// of 0xFF, and a 0x0A rather than relying on buildPngBytes's incidental pixel data to contain them.
const HOSTILE_NUL_BYTE = 0x00;
const HOSTILE_FF_RUN_LENGTH = 4;
const HOSTILE_LF_BYTE = 0x0a;

// --- Path-encoding fixtures (transcript-image-path-encoding.e2e.ts) --------------------------
// Extracts the `path` query parameter's value EXACTLY as it sits on the wire — by string position,
// never through URLSearchParams or new URL().searchParams. Both of those DECODE on read, which
// would hide the exact class of bug this reader exists to catch: an unescaped '&', '#', or '?'
// splitting or truncating the query before the browser ever issues the request. A trailing '&'
// (an unescaped hostile character starting a second, bogus parameter) is respected as the value's
// end rather than swallowed, so a broken encoding reads back as a truncated/wrong value instead of
// silently passing. Returns `unknown`, mirroring every other read in this file — see the file
// header on why these test-only reads are typed opaquely.
const PATH_QUERY_MARKER = 'path=';
const extractRawPathQueryValueFromUrl = (url: string): unknown => {
  const markerIndex = url.indexOf(PATH_QUERY_MARKER);
  if (markerIndex === -1) {
    throw new Error(`transcript-images harness: no '${PATH_QUERY_MARKER}' found in url ${url}`);
  }
  const afterMarker = url.slice(markerIndex + PATH_QUERY_MARKER.length);
  const ampersandIndex = afterMarker.indexOf('&');
  return ampersandIndex === -1 ? afterMarker : afterMarker.slice(0, ampersandIndex);
};

export const transcriptImagesHarness = (): {
  afterEach: () => void;
  seedImageFile: (params: {
    fileName: string;
    widthPx: number;
    heightPx: number;
    seed: number;
  }) => { imagePath: unknown; bytes: Buffer };
  removeImageFile: (params: { imagePath: string }) => void;
  // Node-side real-fs read of the quest's OWN images directory (<dirname(questFilePath)>/images,
  // the exact layout pastedImagePersistBroker/locationsQuestImagesPathFindBroker write to) — the
  // filenames are minted from a fresh crypto.randomUUID() server-side, so this is the only way a
  // caller can learn the REAL absolute path a real composer send just wrote, in order to build the
  // exact transcript content (buildTokenLine + appendImagesPromptTrailer) that content-normalises
  // equal to what the browser rendered optimistically. Absent entirely (never created) reads as an
  // empty array rather than throwing, matching composer-paste.harness.ts's own
  // readQuestImageByteLengths precedent for the same "nothing sent yet" precondition.
  readQuestImagePaths: (params: { questFilePath: string }) => Promise<readonly unknown[]>;
  // check-bytes-match-disk's HOSTILE input class: raw bytes containing a NUL, a run of 0xFF, and a
  // 0x0A, written directly (no PNG encode) since the route never decodes what it serves.
  seedHostileBytesFile: (params: { fileName: string }) => { imagePath: unknown; bytes: Buffer };
  // Runtime proof (not trust-by-construction) that seedHostileBytesFile's own fixture actually
  // carries all three hostile bytes, so a future edit to that fixture can't silently go soft.
  verifyHostileBytesPresent: (params: { bytes: Buffer }) => unknown;
  buildTokenLine: (params: {
    segments: readonly ({ text: string } | { imagePath: string; ordinal: number })[];
  }) => unknown;
  appendImagesPromptTrailer: (params: { content: string }) => unknown;
  getPromptInstructionText: () => unknown;
  buildExpectedImageUrl: (params: { imagePath: string }) => unknown;
  // The independent reference value transcript-image-path-encoding.e2e.ts checks the real wire
  // value against — computed with the SAME built-in encodeURIComponent the transformer under test
  // calls, but from this test-side harness rather than by importing that transformer, so a real
  // divergence in prod (e.g. swapping it for encodeURI) shows up as a genuine mismatch rather than
  // a tautology.
  buildExpectedRawPathQueryValue: (params: { imagePath: string }) => unknown;
  // THE REQUIRED READER for the encoding-matrix spec: the `path` query value exactly as it sits on
  // the wire, read by string position — see extractRawPathQueryValueFromUrl's own comment above for
  // why URLSearchParams / new URL() are the wrong tool here.
  readRawPathQueryValue: (params: { url: string }) => unknown;
  // Sibling to readRawPathQueryValue for the ONE row (non-ASCII) whose own extra assertion is a
  // decode round-trip rather than an exact-value comparison.
  decodeRawPathQueryValue: (params: { url: string }) => unknown;
  // Counts '&'-separated segments in the RAW (undecoded) query string. A correctly percent-encoded
  // `path` value can never itself contain a literal '&' (it comes back as %26), so a single-param
  // URL always counts 1; an unescaped '&' inside the path splits it into a second, bogus query
  // parameter and this count reads 2 instead.
  countRawQueryParams: (params: { url: string }) => unknown;
  // Sibling to buildExpectedImageUrl that takes an already-assembled, ALREADY-ENCODED query string
  // rather than a raw imagePath — image-route-answers.e2e.ts needs to drive malformed/undecodable
  // query values (missing entirely, empty, percent-encoded control characters) that
  // buildExpectedImageUrl's own encodeURIComponent-a-clean-path shape cannot express.
  buildImagesRouteUrl: (params: { query: string }) => unknown;
  // Generic sibling for any OTHER server route on the same real API host:port — used to build the
  // definitely-unmounted probe URL that proves the SPA catch-all (not the images route) answered.
  buildServerRouteUrl: (params: { pathname: string }) => unknown;
  // Fully resolves THE REFUSAL MATRIX: seeds every real file a row needs, builds every row's
  // already-percent-encoded URL, and pairs each with the canary string that row's response headers
  // must never leak. Each element's fields are `unknown` (mirrors seedImageFile's own imagePath) —
  // callers read them via String(row.url) / String(row.canary), same as every other harness read.
  buildRefusalMatrixRows: () => readonly { name: unknown; url: unknown; canary: unknown }[];
  getBrokenThumbnailSizePx: () => unknown;
  // Boundary is CHAT_MESSAGE_IMAGE_BROKEN's own box, not the transcript bubble around it — the
  // placeholder is a fixed-size span regardless of what its neighbouring text does to bubble width.
  readBrokenThumbnailBoundingBox: (params: { page: Page }) => Promise<unknown>;
  // page.on('pageerror') — NOT console 'error' — is what isolates an unhandled JS exception from a
  // browser's own routine "Failed to load resource: 404" console noise for the same failed <img>,
  // which recordConsoleErrors would otherwise conflate with a real regression.
  recordPageErrors: (params: { page: Page }) => { getErrors: () => readonly unknown[] };
  readBubbleChildren: (params: { page: Page }) => Promise<readonly unknown[]>;
  readBubbleText: (params: { page: Page }) => Promise<unknown>;
  readNaturalWidth: (params: { page: Page; index: number }) => Promise<unknown>;
  recordReplayFrames: (params: { page: Page }) => { getFrames: () => readonly unknown[] };
  recordConsoleErrors: (params: { page: Page }) => { getErrors: () => readonly unknown[] };
  // Installed BEFORE the send: a MutationObserver-backed sequence of {bubbleCount,
  // firstImageSrcPrefix} samples for the caller-chosen matchText — see
  // INSTALL_TRANSCRIPT_SEQUENCE_RECORDER_BROWSER_FN's own comment for why only a recorded SEQUENCE
  // (not a point-in-time read) can prove the optimistic bubble was replaced IN PLACE rather than
  // duplicated alongside its transcript copy.
  installTranscriptSequenceRecorder: (params: { page: Page; matchText: string }) => Promise<void>;
  readTranscriptSequenceSamples: (params: { page: Page }) => Promise<readonly unknown[]>;
  // A counter (and per-URL response reader) for real GETs to the served images route — installed
  // BEFORE the send so it can prove NO request fired while a bubble still held its in-memory data:
  // URL, then resolve the exact response the browser's own <img> triggered once a served URL
  // replaced it. page.on('response'), never page.route — this only OBSERVES what the browser already
  // decided to fetch, it never intercepts.
  recordImagesRequests: (params: { page: Page }) => {
    getCount: () => unknown;
    readResponseStatusFor: (params: { url: string }) => Promise<unknown>;
    readResponseBodyLengthFor: (params: { url: string }) => Promise<unknown>;
  };
  // The overlay's width lives on Mantine's own `.mantine-Modal-content`, never on IMAGE_OVERLAY —
  // see the file this harness backs, image-overlay-widget.tsx, for why the two are different boxes.
  readModalContentWidth: (params: { page: Page }) => Promise<unknown>;
  readModalContentX: (params: { page: Page }) => Promise<unknown>;
  readModalInnerAvailableWidth: (params: { page: Page }) => Promise<unknown>;
  readOverlayImageWidth: (params: { page: Page }) => Promise<unknown>;
  readOverlayHeight: (params: { page: Page }) => Promise<unknown>;
  readOverlayCloseHasNonZeroArea: (params: { page: Page }) => Promise<unknown>;
  readOverlayComputedMaxHeight: (params: { page: Page }) => Promise<unknown>;
  readOverlayImageNaturalWidth: (params: { page: Page }) => Promise<unknown>;
  readOverlayCanScroll: (params: { page: Page }) => Promise<unknown>;
  getOverlayWidthPercent: () => unknown;
  getOverlayMaxHeightPercent: () => unknown;
  // Sync (page.viewportSize() is not a Promise) and null-checked HERE rather than at the call site —
  // jest/no-conditional-in-test bans an `if` inside a test body, so the one null branch a caller
  // could ever need to write lives in the harness instead.
  readViewportWidth: (params: { page: Page }) => unknown;
  readViewportHeight: (params: { page: Page }) => unknown;
} => {
  // unknown[], not string[]: @dungeonmaster/ban-primitives forbids an annotated `string[]` local
  // variable declaration unconditionally (it is never "input" or "return" context). Every element
  // pushed here is a real string from mkdtempSync; afterEach re-widens with String(dir) when it
  // hands each entry to rmSync.
  const createdDirs: unknown[] = [];

  // Shared by the public seedImageFile method AND buildRefusalMatrixRows below, which needs the
  // identical mkdtemp+write+track-for-cleanup shape to seed its own real fixture files without
  // duplicating (and risking drifting from) this logic.
  const seedPngFileToTemp = ({
    fileName,
    widthPx,
    heightPx,
    seed,
  }: {
    fileName: string;
    widthPx: number;
    heightPx: number;
    seed: number;
  }): { imagePath: unknown; bytes: Buffer } => {
    const bytes = buildPngBytes({ widthPx, heightPx, seed });
    const dir = mkdtempSync(join(tmpdir(), TEMP_DIR_PREFIX));
    createdDirs.push(dir);
    const imagePath = join(dir, fileName);
    writeFileSync(imagePath, bytes);
    return { imagePath, bytes };
  };

  // Shared by buildImagesRouteUrl, buildServerRouteUrl, and buildRefusalMatrixRows — every one of
  // them resolves the same real API host:port that DUNGEONMASTER_PORT names for this e2e run.
  // Returns `unknown` (never a raw string) to stay consistent with every other resolved-value
  // method in this file — see the file header on why these test-only reads are typed opaquely.
  const resolveTestServerPort = (): unknown => {
    const port = process.env.DUNGEONMASTER_PORT;
    if (port === undefined || port.length === 0) {
      throw new Error(
        'transcript-images harness: DUNGEONMASTER_PORT is not set — playwright.config.ts must set it before this harness can resolve a served image URL',
      );
    }
    return port;
  };

  const buildServerRouteUrlImpl = ({ pathname }: { pathname: string }): unknown =>
    `http://${environmentStatics.hostname}:${String(resolveTestServerPort())}${pathname}`;

  const buildImagesRouteUrlImpl = ({ query }: { query: string }): unknown =>
    buildServerRouteUrlImpl({
      pathname: `${pastedImageStatics.serveRoutePath}${query.length > 0 ? `?${query}` : ''}`,
    });

  return {
    afterEach: (): void => {
      for (const dir of createdDirs) {
        rmSync(String(dir), { recursive: true, force: true });
      }
      createdDirs.length = 0;
    },

    seedImageFile: seedPngFileToTemp,

    seedHostileBytesFile: ({
      fileName,
    }: {
      fileName: string;
    }): { imagePath: unknown; bytes: Buffer } => {
      const bytes = Buffer.concat([
        Buffer.from([HOSTILE_NUL_BYTE]),
        Buffer.alloc(HOSTILE_FF_RUN_LENGTH, 0xff),
        Buffer.from([HOSTILE_LF_BYTE]),
        Buffer.from('hostile-byte-fixture-trailing-content-so-the-file-is-not-suspiciously-short'),
      ]);
      const dir = mkdtempSync(join(tmpdir(), TEMP_DIR_PREFIX));
      createdDirs.push(dir);
      const imagePath = join(dir, fileName);
      writeFileSync(imagePath, bytes);
      return { imagePath, bytes };
    },

    verifyHostileBytesPresent: ({ bytes }: { bytes: Buffer }): unknown => {
      const hasNul = bytes.includes(HOSTILE_NUL_BYTE);
      const hasFfRun = bytes.includes(Buffer.alloc(HOSTILE_FF_RUN_LENGTH, 0xff));
      const hasLf = bytes.includes(HOSTILE_LF_BYTE);
      return hasNul && hasFfRun && hasLf;
    },

    removeImageFile: ({ imagePath }: { imagePath: string }): void => {
      rmSync(imagePath, { force: true });
    },

    readQuestImagePaths: async ({
      questFilePath,
    }: {
      questFilePath: string;
    }): Promise<readonly unknown[]> => {
      await Promise.resolve();
      const imagesDirPath = join(dirname(questFilePath), 'images');
      if (!existsSync(imagesDirPath)) {
        return [];
      }
      return readdirSync(imagesDirPath).map((fileName) => join(imagesDirPath, fileName));
    },

    // Builds the transcript content string exactly as a Claude CLI session JSONL user line would
    // carry it BEFORE replay resolves the tokens into served URLs — a RAW filesystem path in each
    // token's parentheses, never a pre-resolved URL. See the file header WHY note.
    buildTokenLine: ({
      segments,
    }: {
      segments: readonly ({ text: string } | { imagePath: string; ordinal: number })[];
    }): unknown =>
      segments
        .map((segment) =>
          'text' in segment
            ? segment.text
            : `![Pasted Image ${String(segment.ordinal)}](${segment.imagePath})`,
        )
        .join(''),

    // Mirrors imagePromptTrailerTransformer's unconditional append shape — the harness's caller is
    // deliberately building a fixture that already carries the trailer, so the transformer's own
    // carries-a-token / already-trailed guards (which decide WHETHER to append) are not needed here.
    appendImagesPromptTrailer: ({ content }: { content: string }): unknown =>
      `${content}\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`,

    getPromptInstructionText: (): unknown => pastedImageStatics.promptInstruction,

    // The URL imagePathToUrlTransformer rewrites a raw path token into, built from the SAME
    // ingredients that broker reads at replay time: environmentStatics.hostname and
    // pastedImageStatics.serveRoutePath, plus DUNGEONMASTER_PORT — which playwright.config.ts sets on
    // process.env before spawning workers, and which the spawned server child inherits via its own
    // explicit `env:` override, so both sides resolve the identical port.
    buildExpectedImageUrl: ({ imagePath }: { imagePath: string }): unknown => {
      const port = process.env.DUNGEONMASTER_PORT;
      if (port === undefined || port.length === 0) {
        throw new Error(
          'transcript-images harness: DUNGEONMASTER_PORT is not set — playwright.config.ts must set it before this harness can resolve a served image URL',
        );
      }
      return `http://${environmentStatics.hostname}:${port}${pastedImageStatics.serveRoutePath}?path=${encodeURIComponent(imagePath)}`;
    },

    buildExpectedRawPathQueryValue: ({ imagePath }: { imagePath: string }): unknown =>
      encodeURIComponent(imagePath),

    readRawPathQueryValue: ({ url }: { url: string }): unknown =>
      extractRawPathQueryValueFromUrl(url),

    decodeRawPathQueryValue: ({ url }: { url: string }): unknown =>
      decodeURIComponent(String(extractRawPathQueryValueFromUrl(url))),

    countRawQueryParams: ({ url }: { url: string }): unknown => {
      const queryIndex = url.indexOf('?');
      if (queryIndex === -1) {
        return 0;
      }
      return url.slice(queryIndex + 1).split('&').length;
    },

    buildImagesRouteUrl: ({ query }: { query: string }): unknown =>
      buildImagesRouteUrlImpl({ query }),

    buildServerRouteUrl: ({ pathname }: { pathname: string }): unknown =>
      buildServerRouteUrlImpl({ pathname }),

    // Fully resolves every row of THE REFUSAL MATRIX: seeds the two real files a couple of rows
    // need (a null-byte target, and a sibling for the missing-file case), builds every row's
    // already-percent-encoded URL via buildImagesRouteUrlImpl, and pairs each with the canary
    // string its response headers must never leak. See the module-level REFUSAL_MATRIX_* consts
    // above for why the canary is uniform across all ten rows rather than only the two LF/CR ones.
    buildRefusalMatrixRows: (): readonly { name: unknown; url: unknown; canary: unknown }[] => {
      const nullByteTarget = seedPngFileToTemp({
        fileName: 'refusal-nullbyte-target.png',
        widthPx: 2,
        heightPx: 2,
        seed: 41,
      });
      const missingFileSibling = seedPngFileToTemp({
        fileName: 'refusal-missing-sibling.png',
        widthPx: 2,
        heightPx: 2,
        seed: 42,
      });

      // Appending a null byte then `.txt` to a REAL seeded png path is what makes the failure
      // reachable: without a real file behind the null byte, a truncate-at-\0 regression would
      // still 404 on ENOENT, and the row would never actually distinguish "refused" from "would
      // have served the real file if the OS truncated the path".
      const nullBytePath = `${String(nullByteTarget.imagePath)}${String.fromCharCode(0)}.txt`;
      // Absolute, and end in a real image extension, so the ONLY thing standing between this path
      // and a 200 is the guard's own newline/carriage-return check — an extension mismatch or a
      // nonexistent directory would let some OTHER gate take credit for the refusal instead.
      const lfPath = `/tmp/dm-e2e-transcript-images-refusal/inject\n${REFUSAL_MATRIX_LF_CANARY}.png`;
      const crPath = `/tmp/dm-e2e-transcript-images-refusal/inject\r${REFUSAL_MATRIX_CR_CANARY}.png`;
      const overlongPath = `/${'a'.repeat(REFUSAL_MATRIX_OVERLONG_SEGMENT_LENGTH)}.png`;
      const missingFilePath = join(
        dirname(String(missingFileSibling.imagePath)),
        'never-created.png',
      );

      return [
        {
          name: 'traversal segments (../ in the decoded path)',
          url: buildImagesRouteUrlImpl({
            query: `path=${encodeURIComponent(REFUSAL_MATRIX_TRAVERSAL_PATH)}`,
          }),
          canary: REFUSAL_MATRIX_DEFAULT_CANARY,
        },
        {
          name: 'embedded NUL byte',
          url: buildImagesRouteUrlImpl({ query: `path=${encodeURIComponent(nullBytePath)}` }),
          canary: REFUSAL_MATRIX_DEFAULT_CANARY,
        },
        {
          name: 'embedded newline (LF)',
          url: buildImagesRouteUrlImpl({ query: `path=${encodeURIComponent(lfPath)}` }),
          canary: REFUSAL_MATRIX_LF_CANARY,
        },
        {
          name: 'embedded carriage return (CR)',
          url: buildImagesRouteUrlImpl({ query: `path=${encodeURIComponent(crPath)}` }),
          canary: REFUSAL_MATRIX_CR_CANARY,
        },
        {
          name: 'relative path resolving to a real file from the server cwd',
          url: buildImagesRouteUrlImpl({
            query: `path=${encodeURIComponent(REFUSAL_MATRIX_RELATIVE_PATH)}`,
          }),
          canary: REFUSAL_MATRIX_DEFAULT_CANARY,
        },
        {
          name: 'missing path query parameter entirely',
          url: buildImagesRouteUrlImpl({ query: '' }),
          canary: REFUSAL_MATRIX_DEFAULT_CANARY,
        },
        {
          name: 'empty path query parameter value',
          url: buildImagesRouteUrlImpl({ query: 'path=' }),
          canary: REFUSAL_MATRIX_DEFAULT_CANARY,
        },
        {
          name: 'path longer than any real filesystem path',
          url: buildImagesRouteUrlImpl({ query: `path=${encodeURIComponent(overlongPath)}` }),
          canary: REFUSAL_MATRIX_DEFAULT_CANARY,
        },
        {
          name: 'path pointing at no file inside a real directory',
          url: buildImagesRouteUrlImpl({ query: `path=${encodeURIComponent(missingFilePath)}` }),
          canary: REFUSAL_MATRIX_DEFAULT_CANARY,
        },
        {
          name: 'non-image extension on a real file',
          url: buildImagesRouteUrlImpl({
            query: `path=${encodeURIComponent(REFUSAL_MATRIX_NON_IMAGE_PATH)}`,
          }),
          canary: REFUSAL_MATRIX_DEFAULT_CANARY,
        },
      ];
    },

    getBrokenThumbnailSizePx: (): unknown => webConfigStatics.pastedImage.brokenThumbnailSizePx,

    // CHAT_MESSAGE_IMAGE_BROKEN's own box — not the bubble around it — since the placeholder is a
    // fixed-size span regardless of what its neighbouring text does to overall bubble width.
    readBrokenThumbnailBoundingBox: async ({ page }: { page: Page }): Promise<unknown> => {
      const box = await page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN').boundingBox();
      if (box === null) {
        throw new Error(
          'transcript-images harness: CHAT_MESSAGE_IMAGE_BROKEN bounding box not available',
        );
      }
      return { width: box.width, height: box.height };
    },

    // 'pageerror' — not the 'console' event recordConsoleErrors listens on — fires ONLY for an
    // uncaught exception or unhandled promise rejection in page JS. A failed <img> load is routine
    // (the widget's own onError handler catches it) but Chromium still prints a routine
    // "Failed to load resource: 404" line to the console for the same failed request; scraping
    // console 'error' text for "no unhandled exception" would conflate that expected noise with an
    // actual regression, so this is a second, narrower recorder rather than a filter on the first.
    recordPageErrors: ({ page }: { page: Page }): { getErrors: () => readonly unknown[] } => {
      const errors: unknown[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      return { getErrors: () => errors };
    },

    readBubbleChildren: async ({ page }: { page: Page }): Promise<readonly unknown[]> =>
      page.evaluate(READ_IMAGE_CONTENT_LAYER_CHILDREN_BROWSER_FN),

    readBubbleText: async ({ page }: { page: Page }): Promise<unknown> =>
      page.evaluate(READ_IMAGE_CONTENT_LAYER_TEXT_BROWSER_FN),

    readNaturalWidth: async ({ page, index }: { page: Page; index: number }): Promise<unknown> =>
      page.evaluate(READ_CHAT_MESSAGE_IMAGE_NATURAL_WIDTH_BROWSER_FN, { index }),

    // Must be called BEFORE navigation — page.on('websocket') only sees sockets opened after it is
    // registered, and the replay-history frame fires the instant the socket opens.
    recordReplayFrames: ({ page }: { page: Page }): { getFrames: () => readonly unknown[] } => {
      const frames: unknown[] = [];
      page.on('websocket', (ws) => {
        ws.on('framesent', (data) => {
          const text =
            typeof data.payload === 'string' ? data.payload : data.payload.toString('utf8');
          frames.push(JSON.parse(text));
        });
      });
      return { getFrames: () => frames };
    },

    recordConsoleErrors: ({ page }: { page: Page }): { getErrors: () => readonly unknown[] } => {
      const errors: unknown[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      return { getErrors: () => errors };
    },

    installTranscriptSequenceRecorder: async ({
      page,
      matchText,
    }: {
      page: Page;
      matchText: string;
    }): Promise<void> => {
      await page.evaluate(INSTALL_TRANSCRIPT_SEQUENCE_RECORDER_BROWSER_FN, { matchText });
    },

    readTranscriptSequenceSamples: async ({ page }: { page: Page }): Promise<readonly unknown[]> =>
      page.evaluate(READ_TRANSCRIPT_SEQUENCE_SAMPLES_BROWSER_FN),

    recordImagesRequests: ({
      page,
    }: {
      page: Page;
    }): {
      getCount: () => unknown;
      readResponseStatusFor: (params: { url: string }) => Promise<unknown>;
      readResponseBodyLengthFor: (params: { url: string }) => Promise<unknown>;
    } => {
      const responses: Response[] = [];
      page.on('response', (response) => {
        if (
          response.request().method() === 'GET' &&
          response.url().includes(pastedImageStatics.serveRoutePath)
        ) {
          responses.push(response);
        }
      });

      const findMatch = ({ url }: { url: string }): Response | undefined =>
        responses.find((response) => response.url() === url);

      return {
        getCount: (): unknown => responses.length,
        // The `await Promise.resolve()` no-op satisfies BOTH promise-function-async (this method's
        // declared return type is Promise<unknown>, matching readResponseBodyLengthFor's own real
        // await) AND require-await (an async method needs a genuine await) at once — mirrors
        // composer-paste.harness.ts's readDataUrlByteLength for the identical reasoning.
        readResponseStatusFor: async ({ url }: { url: string }): Promise<unknown> => {
          await Promise.resolve();
          const match = findMatch({ url });
          return match === undefined ? null : match.status();
        },
        readResponseBodyLengthFor: async ({ url }: { url: string }): Promise<unknown> => {
          const match = findMatch({ url });
          if (match === undefined) {
            return null;
          }
          const body = await match.body();
          return body.length;
        },
      };
    },

    // `.mantine-Modal-content` is the sized box (size={`${overlayWidthPercent}%`} on the Modal
    // itself) — IMAGE_OVERLAY is the inner scroll div and carries no width of its own, only the
    // maxHeight cap, so a width measurement has to name this element specifically.
    readModalContentWidth: async ({ page }: { page: Page }): Promise<unknown> => {
      const box = await page.locator('.mantine-Modal-content').boundingBox();
      if (box === null) {
        throw new Error(
          'transcript-images harness: .mantine-Modal-content bounding box not available',
        );
      }
      return box.width;
    },

    // Reads the CONTENT box's left edge — Mantine centers the modal on both axes, so a point whose
    // x sits left of this edge is provably outside the content regardless of its y.
    readModalContentX: async ({ page }: { page: Page }): Promise<unknown> => {
      const box = await page.locator('.mantine-Modal-content').boundingBox();
      if (box === null) {
        throw new Error(
          'transcript-images harness: .mantine-Modal-content bounding box not available',
        );
      }
      return box.x;
    },

    readModalInnerAvailableWidth: async ({ page }: { page: Page }): Promise<unknown> =>
      page.evaluate(READ_MODAL_INNER_AVAILABLE_WIDTH_BROWSER_FN),

    readOverlayImageWidth: async ({ page }: { page: Page }): Promise<unknown> => {
      const box = await page.getByTestId('IMAGE_OVERLAY_IMAGE').boundingBox();
      if (box === null) {
        throw new Error(
          'transcript-images harness: IMAGE_OVERLAY_IMAGE bounding box not available',
        );
      }
      return box.width;
    },

    readOverlayHeight: async ({ page }: { page: Page }): Promise<unknown> => {
      const box = await page.getByTestId('IMAGE_OVERLAY').boundingBox();
      if (box === null) {
        throw new Error('transcript-images harness: IMAGE_OVERLAY bounding box not available');
      }
      return box.height;
    },

    // A `null` box (element not attached/visible) reads as zero area rather than throwing — the
    // caller's own toBeVisible() assertion is what names a missing control; this method's job is
    // only to answer whether the box that IS there has real area.
    readOverlayCloseHasNonZeroArea: async ({ page }: { page: Page }): Promise<unknown> => {
      const box = await page.getByTestId('IMAGE_OVERLAY_CLOSE').boundingBox();
      return box !== null && box.width > 0 && box.height > 0;
    },

    readOverlayComputedMaxHeight: async ({ page }: { page: Page }): Promise<unknown> =>
      page.evaluate(READ_OVERLAY_COMPUTED_MAX_HEIGHT_BROWSER_FN),

    readOverlayImageNaturalWidth: async ({ page }: { page: Page }): Promise<unknown> =>
      page.evaluate(READ_OVERLAY_IMAGE_NATURAL_WIDTH_BROWSER_FN),

    readOverlayCanScroll: async ({ page }: { page: Page }): Promise<unknown> =>
      page.evaluate(READ_OVERLAY_CAN_SCROLL_BROWSER_FN),

    // Exposes the two sizing knobs a caller needs to compute an expected px value against a chosen
    // viewport — see the file header on webConfigStatics import: this is the ONE web-package-local
    // static this harness reaches into, and only for these two numbers.
    getOverlayWidthPercent: (): unknown => webConfigStatics.pastedImage.overlayWidthPercent,

    getOverlayMaxHeightPercent: (): unknown => webConfigStatics.pastedImage.overlayMaxHeightPercent,

    readViewportWidth: ({ page }: { page: Page }): unknown => {
      const size = page.viewportSize();
      if (size === null) {
        throw new Error('transcript-images harness: viewport size not available');
      }
      return size.width;
    },

    readViewportHeight: ({ page }: { page: Page }): unknown => {
      const size = page.viewportSize();
      if (size === null) {
        throw new Error('transcript-images harness: viewport size not available');
      }
      return size.height;
    },
  };
};
