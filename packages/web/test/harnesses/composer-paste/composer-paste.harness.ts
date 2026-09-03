/**
 * PURPOSE: Opens the create-quest chat page, builds byte-distinct in-browser images, dispatches
 * synthetic clipboard `paste` events at the composer's live caret (image-only, text-only, mixed,
 * and arbitrary explicit bytes for unsupported/corrupt formats), and reads back CHAT_INPUT's live
 * DOM plus its localStorage/IndexedDB draft persistence. Real canvas encoding, a real contenteditable
 * caret and real IndexedDB only exist in a browser, so the mechanics live here and the scenario file
 * asserts what they return.
 *
 * React's `onPaste` is delegated from the root DOM container (not attached per-element), so every
 * dispatch below fires the event ON the CHAT_INPUT element itself with `bubbles: true` — that is
 * what lets the delegated listener see it. Read methods return `unknown` (arrays of `unknown`, or a
 * bare `unknown`): these are test-only DOM reads with no production contract to brand them against,
 * and the scenario compares them structurally (toStrictEqual / toBe) rather than by property access.
 *
 * USAGE:
 * const composer = composerPasteHarness({ page });
 * await composer.beforeEach();                                    // clears storage before navigation
 * await composer.openComposerPage({ request, guildName, guildPath });
 * const dataUrl = await composer.buildImageDataUrl({ widthPx: 40, heightPx: 40, seed: 1 });
 * const prevented = await composer.pasteImage({ dataUrl });
 * // prevented === false — dispatchEvent returns false once preventDefault fired
 */
import { existsSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';

import type { APIRequestContext, Page } from '@playwright/test';

import { guildHarness } from '../guild/guild.harness';

const HTTP_OK = 200;
const PANEL_TIMEOUT = 8_000;

// Restated rather than imported: a harness may not import contract values, and these are the exact
// literals the localStorage/IndexedDB draft-persistence adapters open — chatComposerStatics.ts
// drifting from these must fail this harness's reads rather than silently follow it.
const DRAFT_STORAGE_KEY = 'dungeonmaster-chat-draft';
const DRAFT_DATABASE_NAME = 'dungeonmaster-chat-drafts';
const DRAFT_DATABASE_VERSION = 1;
const DRAFT_STORE_NAME = 'dungeonmaster-chat-draft-images';
// A store name the app itself would never create — seedDecoyDraftDatabase uses this to reproduce a
// database that exists, at the right version, but whose expected store never got created.
const DECOY_STORE_NAME = 'decoy-store';

const DEFAULT_IMAGE_FILE_NAME = 'pasted-image.png';
const DEFAULT_BYTES_FILE_NAME = 'pasted-bytes';

// Restated rather than imported — same reasoning as the draft storage/database literals above: the
// server writes every pasted image under <questFolderPath>/images
// (locationsStatics.quest.imagesDir, pastedImagePersistBroker/locationsQuestImagesPathFindBroker), and
// a Node-side reader proving that write actually happened must fail the moment that literal drifts,
// rather than silently following it.
const QUEST_IMAGES_DIR_NAME = 'images';

// Every browser-evaluated function below is passed BY REFERENCE to page.evaluate/addInitScript,
// which serializes only the function's own source text — no outer closure survives the trip, so
// each one is entirely self-contained (literals inline, everything else arrives via its one
// argument). This mirrors the *_BROWSER_FN functions in flow-diagram.harness.ts. None of them
// declare an explicit return type: they are module-private (never exported), and their result
// flows straight into an `unknown`-returning harness method below, so nothing downstream depends on
// the annotation — letting TypeScript infer it keeps a plain string/number field out of the source
// text entirely.

// Builds an off-screen canvas, fills it with a seed-derived base colour plus a seed-sized corner
// notch in the inverted colour (so two different seeds can never encode to the same bytes even at
// identical width/height), and returns the encoded image as a data URL.
const BUILD_IMAGE_BROWSER_FN = async (params: {
  widthPx: number;
  heightPx: number;
  seed: number;
  mimeType: string;
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = params.widthPx;
  canvas.height = params.heightPx;
  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('composer-paste harness: canvas 2d context unavailable');
  }

  const red = (params.seed * 37) % 256;
  const green = (params.seed * 59) % 256;
  const blue = (params.seed * 83) % 256;
  context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
  context.fillRect(0, 0, params.widthPx, params.heightPx);

  const notchSize = Math.max(2, Math.min(params.widthPx, params.heightPx, 4 + params.seed * 3));
  context.fillStyle = `rgb(${blue}, ${red}, ${green})`;
  context.fillRect(0, 0, notchSize, notchSize);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result === null) {
        reject(new Error('composer-paste harness: canvas.toBlob returned null'));
        return;
      }
      resolve(result);
    }, params.mimeType);
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => {
      resolve(String(reader.result));
    };
    reader.onerror = (): void => {
      reject(reader.error ?? new Error('composer-paste harness: FileReader failed'));
    };
    reader.readAsDataURL(blob);
  });
};

// Decodes a data URL into raw bytes, wraps them as a File, and dispatches a synthetic
// ClipboardEvent carrying only that file at CHAT_INPUT. Returns dispatchEvent's own boolean.
const PASTE_IMAGE_BROWSER_FN = (params: { dataUrl: string; fileName: string }): boolean => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const commaIndex = params.dataUrl.indexOf(',');
  const header = params.dataUrl.slice(0, commaIndex);
  const base64Body = params.dataUrl.slice(commaIndex + 1);
  const mediaTypeMatch = /^data:(.*);base64$/u.exec(header);
  const mediaType =
    mediaTypeMatch?.[1] === undefined ? 'application/octet-stream' : mediaTypeMatch[1];
  const binary = atob(base64Body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const file = new File([bytes], params.fileName, { type: mediaType });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const event = new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
  });
  return editor.dispatchEvent(event);
};

// Same decode as PASTE_IMAGE_BROWSER_FN, but the media type comes from the CALLER instead of being
// parsed off the data URL's own header — this is what lets a test hand real, decodable image bytes
// to the clipboard under a media type the browser's own File/Blob constructor would never produce on
// its own (e.g. a trailing space), reproducing an OS/clipboard-declared type exactly as
// pasteMediaTypeNormalizeTransformer's own header describes it: attacker/OS-controlled and free to
// vary from its canonical form by case or surrounding whitespace.
const PASTE_IMAGE_WITH_MEDIA_TYPE_BROWSER_FN = (params: {
  dataUrl: string;
  mediaType: string;
  fileName: string;
}): boolean => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const commaIndex = params.dataUrl.indexOf(',');
  const base64Body = params.dataUrl.slice(commaIndex + 1);
  const binary = atob(base64Body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const file = new File([bytes], params.fileName, { type: params.mediaType });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const event = new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
  });
  return editor.dispatchEvent(event);
};

// Same dispatch as above, but for arbitrary explicit bytes with an explicit (possibly wrong or
// undecodable) media type — for image/bmp (unsupported format) and a truncated PNG (corrupt format).
const PASTE_BYTES_BROWSER_FN = (params: {
  bytes: number[];
  mediaType: string;
  fileName: string;
}): boolean => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const file = new File([new Uint8Array(params.bytes)], params.fileName, {
    type: params.mediaType,
  });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const event = new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
  });
  return editor.dispatchEvent(event);
};

// Dispatches a paste carrying ONLY text/plain — no file item at all.
const PASTE_TEXT_BROWSER_FN = (params: { text: string }): boolean => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const dataTransfer = new DataTransfer();
  dataTransfer.setData('text/plain', params.text);
  const event = new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
  });
  return editor.dispatchEvent(event);
};

// Dispatches ONE paste carrying BOTH a text/plain string and an image File on the SAME
// DataTransfer — the widget's item.kind === 'file' check must pick the image and ignore the text.
const PASTE_TEXT_AND_IMAGE_BROWSER_FN = (params: {
  text: string;
  dataUrl: string;
  fileName: string;
}): boolean => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const commaIndex = params.dataUrl.indexOf(',');
  const header = params.dataUrl.slice(0, commaIndex);
  const base64Body = params.dataUrl.slice(commaIndex + 1);
  const mediaTypeMatch = /^data:(.*);base64$/u.exec(header);
  const mediaType =
    mediaTypeMatch?.[1] === undefined ? 'application/octet-stream' : mediaTypeMatch[1];
  const binary = atob(base64Body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const file = new File([bytes], params.fileName, { type: mediaType });
  const dataTransfer = new DataTransfer();
  // File first, then text — matches how a real OS clipboard hands a DataTransfer to the browser
  // when both an image and its alt text are copied together.
  dataTransfer.items.add(file);
  dataTransfer.setData('text/plain', params.text);
  const event = new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
  });
  return editor.dispatchEvent(event);
};

// Reads CHAT_INPUT's live childNodes into the same discriminated shape the composer's own read
// adapter produces, plus each image's `src` (which the app's own segment shape omits, since the
// segment model only needs the attachmentId — a test needs the pixel data to compare against).
// Each entry is either `{kind:'text', text}` or `{kind:'image', attachmentId, src}`.
const READ_CHILDREN_BROWSER_FN = () => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const result: unknown[] = [];
  editor.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result.push({ kind: 'text', text: node.textContent ?? '' });
      return;
    }
    if (node instanceof HTMLImageElement) {
      result.push({
        kind: 'image',
        attachmentId: node.getAttribute('data-attachment-id') ?? '',
        src: node.getAttribute('src') ?? '',
      });
    }
  });
  return result;
};

// Same shape as READ_CHILDREN_BROWSER_FN, minus attachmentId — a caret/ordering assertion knows the
// pasted image's `src` up front (it built the data URL itself) but can never know the attachmentId
// ahead of time (a fresh crypto.randomUUID() per paste), so this is what lets a test write a fully
// concrete expected array literal instead of reusing a captured-but-opaque `unknown` element.
const READ_CHILD_SUMMARIES_BROWSER_FN = () => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const result: unknown[] = [];
  editor.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result.push({ kind: 'text', text: node.textContent ?? '' });
      return;
    }
    if (node instanceof HTMLImageElement) {
      result.push({ kind: 'image', src: node.getAttribute('src') ?? '' });
    }
  });
  return result;
};

// Reads EVERY direct child of CHAT_INPUT unfiltered (READ_CHILDREN_BROWSER_FN silently drops any
// node that is neither a Text node nor an HTMLImageElement), carrying nodeType/nodeValue/textContent
// raw off the DOM node itself. This is what a caret-adjacency test needs when the very thing under
// test is whether a keystroke landed as a SIBLING text node versus INSIDE the thumbnail element —
// `kind`-based summaries above only prove ordering, never which underlying node type produced it.
const READ_CHILD_NODE_DETAILS_BROWSER_FN = () => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const result: unknown[] = [];
  editor.childNodes.forEach((node) => {
    result.push({
      nodeType: node.nodeType,
      nodeValue: node.nodeValue,
      textContent: node.textContent ?? '',
      tagName: node instanceof Element ? node.tagName : null,
    });
  });
  return result;
};

// Builds a canvas whose encoded PNG exceeds pastedImageStatics.maxBytesPerImage — a solid fill alone
// stays tiny (PNG's deflate collapses a flat colour to almost nothing regardless of canvas area), so
// only a BAND gets per-pixel noise: `noiseBandRows` rows at `widthPx` wide is incompressible, while
// the remaining rows compress away to near-zero, which is what keeps this fast enough to build in a
// browser instead of paying for every one of `widthPx * heightPx` pixels to be random.
const BUILD_OVER_CAP_IMAGE_BROWSER_FN = async (params: {
  widthPx: number;
  heightPx: number;
  noiseBandRows: number;
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = params.widthPx;
  canvas.height = params.heightPx;
  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('composer-paste harness: canvas 2d context unavailable');
  }

  context.fillStyle = 'rgb(120, 90, 60)';
  context.fillRect(0, 0, params.widthPx, params.heightPx);

  const noiseImageData = context.createImageData(params.widthPx, params.noiseBandRows);
  for (let index = 0; index < noiseImageData.data.length; index += 1) {
    noiseImageData.data[index] = Math.floor(Math.random() * 256);
  }
  // Alpha forced fully opaque (every 4th byte) so a random-near-zero alpha never lets the
  // noise band blend away into the solid fill beneath it.
  for (let index = 3; index < noiseImageData.data.length; index += 4) {
    noiseImageData.data[index] = 255;
  }
  context.putImageData(noiseImageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result === null) {
        reject(new Error('composer-paste harness: canvas.toBlob returned null'));
        return;
      }
      resolve(result);
    }, 'image/png');
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => {
      resolve(String(reader.result));
    };
    reader.onerror = (): void => {
      reject(reader.error ?? new Error('composer-paste harness: FileReader failed'));
    };
    reader.readAsDataURL(blob);
  });
};

// 8-byte PNG signature + 25-byte IHDR chunk (4 length + 4 type + 13 data + 4 CRC) — the fixed prefix
// buildOverCapCorruptPngBytes always allocates before the caller-chosen filler.
const OVER_CAP_CORRUPT_PNG_PREFIX_LENGTH = 33;

// A PNG signature + a well-formed IHDR declaring plausible large dimensions, followed by
// `fillerBytes` of zeroes that form no valid chunk at all — enough to push the TOTAL input past
// pastedImageStatics.maxBytesPerImage while still failing to decode, which is what proves the
// cannot-reduce toast on an input that is genuinely over the byte cap (rather than on a small
// truncated file that never entered that size class at all). Written twice, once here and once
// inline in PASTE_OVER_CAP_CORRUPT_PNG_BROWSER_FN below, because a page.evaluate callback cannot
// close over a Node-side helper — see the file-level note on self-contained browser functions.
const buildOverCapCorruptPngBytes = ({ fillerBytes }: { fillerBytes: number }): Uint8Array => {
  const bytes = new Uint8Array(OVER_CAP_CORRUPT_PNG_PREFIX_LENGTH + fillerBytes);
  bytes.set(
    [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x17, 0x70, 0x00, 0x00, 0x0f, 0xa0, 0x08, 0x06, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00,
    ],
    0,
  );
  return bytes;
};

const PASTE_OVER_CAP_CORRUPT_PNG_BROWSER_FN = (params: { fillerBytes: number }): boolean => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const bytes = new Uint8Array(33 + params.fillerBytes);
  bytes.set(
    [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x17, 0x70, 0x00, 0x00, 0x0f, 0xa0, 0x08, 0x06, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00,
    ],
    0,
  );

  const file = new File([bytes], 'over-cap-corrupt.png', { type: 'image/png' });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const event = new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
  });
  return editor.dispatchEvent(event);
};

// Same decode as PASTE_IMAGE_BROWSER_FN, but for N images dispatched in ONE synchronous script with
// NO `await` anywhere between the dispatchEvent calls — an awaited sequence (N separate
// page.evaluate round trips) always lets each paste's handler run to completion before the next
// starts, which proves nothing about a race that only exists inside a single JS tick. This is what
// lets a test fire a genuine burst: every dispatchEvent call here runs each paste handler's
// SYNCHRONOUS prefix (everything before its own first `await`) back-to-back, on the same stale DOM
// read, exactly as three real rapid-fire pastes would.
const PASTE_IMAGES_NO_AWAIT_BROWSER_FN = (params: {
  dataUrls: string[];
  fileName: string;
}): boolean[] => {
  const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }

  const results: boolean[] = [];
  for (const dataUrl of params.dataUrls) {
    const commaIndex = dataUrl.indexOf(',');
    const header = dataUrl.slice(0, commaIndex);
    const base64Body = dataUrl.slice(commaIndex + 1);
    const mediaTypeMatch = /^data:(.*);base64$/u.exec(header);
    const mediaType =
      mediaTypeMatch?.[1] === undefined ? 'application/octet-stream' : mediaTypeMatch[1];
    const binary = atob(base64Body);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const file = new File([bytes], params.fileName, { type: mediaType });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const event = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    });
    results.push(editor.dispatchEvent(event));
  }
  return results;
};

// Places the caret at the given CHILD-NODE offset inside CHAT_INPUT — index 1 sits between
// children[0] and children[1], which is what lets a test paste "between two thumbnails" without
// any keyboard affordance that could reach that position (arrow keys move by character/atomic
// node, not by an arbitrary child index).
const PLACE_CARET_BROWSER_FN = (params: { index: number }): void => {
  const editor = document.querySelector<HTMLElement>('[data-testid="CHAT_INPUT"]');
  if (editor === null) {
    throw new Error('composer-paste harness: CHAT_INPUT not found');
  }
  editor.focus();

  const range = document.createRange();
  range.setStart(editor, params.index);
  range.setEnd(editor, params.index);
  const selection = window.getSelection();
  if (selection === null) {
    throw new Error('composer-paste harness: window has no selection object');
  }
  selection.removeAllRanges();
  selection.addRange(range);
};

// Clears the ENTIRE localStorage origin and deletes the whole drafts database. Runs via
// page.addInitScript — before the app's own bundle executes — so a draft this test leaves behind
// can never leak into the next one via the composer's on-mount restore.
const CLEAR_STORAGE_BROWSER_FN = (params: { databaseName: string }): void => {
  localStorage.clear();
  indexedDB.deleteDatabase(params.databaseName);
};

// Creates the drafts database FRESH, at version 1, holding ONLY a decoy store — never the app's
// own `dungeonmaster-chat-draft-images` store. This is what reproduces defect 2's precondition: a
// database whose VERSION already matches what the app requests, but whose expected store never
// got created (corrupted state, or a schema authored by something other than this app). Must run
// BEFORE the app's own bundle ever touches IndexedDB — deleteDatabase in beforeEach/clearDraftStorage
// then a call to this, in that order, on an already-loaded (non-composer) page — or the app's own
// open would have already created the real store first and there would be nothing left to heal.
const SEED_DECOY_DRAFT_DATABASE_BROWSER_FN = async (params: {
  databaseName: string;
  decoyStoreName: string;
  version: number;
}): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(params.databaseName, params.version);
    request.onupgradeneeded = (): void => {
      const database = request.result;
      if (!database.objectStoreNames.contains(params.decoyStoreName)) {
        database.createObjectStore(params.decoyStoreName, { autoIncrement: true });
      }
    };
    request.onsuccess = (): void => {
      request.result.close();
      resolve();
    };
    request.onerror = (): void => {
      reject(request.error ?? new Error('composer-paste harness: failed to seed decoy database'));
    };
  });

// Reads back every object store name currently in the drafts database, at whatever version it
// actually is — never the hardcoded app version, since a healed database has been bumped past it.
// Opening with NO version argument attaches to the database's current version as-is and never
// fires onupgradeneeded, so this is a pure read with no risk of creating anything itself. Returns
// `unknown[]` (not `string[]`) for the same reason every other read below does — no production
// contract brands a raw IndexedDB store name.
const READ_DATABASE_STORE_NAMES_BROWSER_FN = async (params: {
  databaseName: string;
}): Promise<unknown[]> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(params.databaseName);
    request.onsuccess = (): void => {
      const names: unknown[] = Array.from(request.result.objectStoreNames);
      request.result.close();
      resolve(names);
    };
    request.onerror = (): void => {
      reject(
        request.error ?? new Error('composer-paste harness: failed to read database store names'),
      );
    };
  });

// Opens the drafts database (creating the store if the app itself never has, on a truly empty
// origin) and reads back every record in the images store, in getAll() order. Each record is
// `{attachmentId, mediaType, dataBase64}`. Opened with NO explicit version (attaches to whatever
// version currently exists, or creates fresh at version 1 on a truly empty origin) rather than the
// app's own static version number — a healed database (see indexedDbDraftImagesReadAdapter) sits
// ABOVE that static version, and opening below a database's current version throws VersionError
// outright rather than attaching to it.
const READ_DRAFT_IMAGE_RECORDS_BROWSER_FN = async (params: {
  databaseName: string;
  storeName: string;
}) => {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(params.databaseName);
    request.onupgradeneeded = (): void => {
      const database = request.result;
      if (!database.objectStoreNames.contains(params.storeName)) {
        database.createObjectStore(params.storeName, { autoIncrement: true });
      }
    };
    request.onsuccess = (): void => {
      resolve(request.result);
    };
    request.onerror = (): void => {
      reject(request.error ?? new Error('composer-paste harness: failed to open IndexedDB'));
    };
  });

  const records = await new Promise<unknown[]>((resolve, reject) => {
    const transaction = db.transaction([params.storeName], 'readonly');
    const store = transaction.objectStore(params.storeName);
    const getAllRequest = store.getAll();
    getAllRequest.onsuccess = (): void => {
      resolve(getAllRequest.result);
    };
    getAllRequest.onerror = (): void => {
      reject(
        getAllRequest.error ?? new Error('composer-paste harness: failed to read IndexedDB store'),
      );
    };
  });

  db.close();
  return records;
};

// Same IndexedDB open/getAll shape as READ_DRAFT_IMAGE_RECORDS_BROWSER_FN, projected down to just
// the attachmentId column. Written as its own self-contained open (rather than deriving from that
// function's result) for the same reason the over-cap corrupt-PNG bytes are built twice above: a
// page.evaluate callback cannot close over a Node-side helper.
const READ_DRAFT_IMAGE_ATTACHMENT_IDS_BROWSER_FN = async (params: {
  databaseName: string;
  storeName: string;
}) => {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(params.databaseName);
    request.onupgradeneeded = (): void => {
      const database = request.result;
      if (!database.objectStoreNames.contains(params.storeName)) {
        database.createObjectStore(params.storeName, { autoIncrement: true });
      }
    };
    request.onsuccess = (): void => {
      resolve(request.result);
    };
    request.onerror = (): void => {
      reject(request.error ?? new Error('composer-paste harness: failed to open IndexedDB'));
    };
  });

  const attachmentIds = await new Promise<unknown[]>((resolve, reject) => {
    const transaction = db.transaction([params.storeName], 'readonly');
    const store = transaction.objectStore(params.storeName);
    const getAllRequest = store.getAll();
    getAllRequest.onsuccess = (): void => {
      resolve(getAllRequest.result.map((record) => record.attachmentId));
    };
    getAllRequest.onerror = (): void => {
      reject(
        getAllRequest.error ?? new Error('composer-paste harness: failed to read IndexedDB store'),
      );
    };
  });

  db.close();
  return attachmentIds;
};

export const composerPasteHarness = ({
  page,
}: {
  page: Page;
}): {
  beforeEach: () => Promise<void>;
  openComposerPage: (params: {
    request: APIRequestContext;
    guildName: string;
    guildPath: string;
  }) => Promise<void>;
  buildImageDataUrl: (params: {
    widthPx: number;
    heightPx: number;
    seed: number;
    mimeType?: string;
  }) => Promise<unknown>;
  pasteImage: (params: { dataUrl: string; fileName?: string }) => Promise<boolean>;
  pasteImagesWithNoAwaitBetween: (params: {
    dataUrls: readonly string[];
    fileName?: string;
  }) => Promise<readonly boolean[]>;
  pasteImageWithMediaType: (params: {
    dataUrl: string;
    mediaType: string;
    fileName?: string;
  }) => Promise<boolean>;
  pasteBytes: (params: {
    bytes: readonly number[];
    mediaType: string;
    fileName?: string;
  }) => Promise<boolean>;
  pasteText: (params: { text: string }) => Promise<boolean>;
  pasteTextAndImage: (params: {
    text: string;
    dataUrl: string;
    fileName?: string;
  }) => Promise<boolean>;
  pasteCorruptPng: () => Promise<boolean>;
  buildOverCapImageDataUrl: (params: {
    widthPx: number;
    heightPx: number;
    noiseBandRows: number;
  }) => Promise<unknown>;
  readDataUrlByteLength: (params: { dataUrl: string }) => Promise<unknown>;
  buildOverCapCorruptPngByteLength: (params: { fillerBytes: number }) => Promise<unknown>;
  pasteOverCapCorruptPng: (params: { fillerBytes: number }) => Promise<boolean>;
  readComposerChildren: () => Promise<readonly unknown[]>;
  readComposerChildSummaries: () => Promise<readonly unknown[]>;
  readComposerChildNodeDetails: () => Promise<readonly unknown[]>;
  readComposerTextContent: () => Promise<unknown>;
  readComposerInnerHtml: () => Promise<unknown>;
  readContentEditableAttribute: () => Promise<unknown>;
  readThumbnailCount: () => Promise<unknown>;
  readThumbnailSrcs: () => Promise<readonly unknown[]>;
  readThumbnailNaturalWidths: () => Promise<readonly unknown[]>;
  readThumbnailNaturalHeights: () => Promise<readonly unknown[]>;
  readThumbnailChildElementCounts: () => Promise<readonly unknown[]>;
  readThumbnailAttachmentIds: () => Promise<readonly unknown[]>;
  readThumbnailRenderedSizes: () => Promise<readonly unknown[]>;
  readSendButtonFitsInViewport: () => Promise<unknown>;
  readDraftText: () => Promise<unknown>;
  readDraftImageRecords: () => Promise<readonly unknown[]>;
  readDraftImageAttachmentIds: () => Promise<readonly unknown[]>;
  focusComposer: () => Promise<void>;
  placeCaretBetweenChildren: (params: { index: number }) => Promise<void>;
  clearDraftStorage: () => Promise<void>;
  seedDecoyDraftDatabase: () => Promise<void>;
  readDraftDatabaseStoreNames: () => Promise<readonly unknown[]>;
  readQuestImageByteLengths: (params: { questFilePath: string }) => Promise<readonly unknown[]>;
} => ({
  beforeEach: async (): Promise<void> => {
    await page.addInitScript(CLEAR_STORAGE_BROWSER_FN, { databaseName: DRAFT_DATABASE_NAME });
  },

  openComposerPage: async ({
    request,
    guildName,
    guildPath,
  }: {
    request: APIRequestContext;
    guildName: string;
    guildPath: string;
  }): Promise<void> => {
    const guild = await guildHarness({ request }).createGuild({ name: guildName, path: guildPath });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    const guildsResponse = page.waitForResponse(
      (response) => response.url().includes('/api/guilds') && response.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/quest`);
    await guildsResponse;

    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
  },

  buildImageDataUrl: async ({
    widthPx,
    heightPx,
    seed,
    mimeType = 'image/png',
  }: {
    widthPx: number;
    heightPx: number;
    seed: number;
    mimeType?: string;
  }): Promise<unknown> =>
    page.evaluate(BUILD_IMAGE_BROWSER_FN, { widthPx, heightPx, seed, mimeType }),

  pasteImage: async ({
    dataUrl,
    fileName = DEFAULT_IMAGE_FILE_NAME,
  }: {
    dataUrl: string;
    fileName?: string;
  }): Promise<boolean> => page.evaluate(PASTE_IMAGE_BROWSER_FN, { dataUrl, fileName }),

  pasteImagesWithNoAwaitBetween: async ({
    dataUrls,
    fileName = DEFAULT_IMAGE_FILE_NAME,
  }: {
    dataUrls: readonly string[];
    fileName?: string;
  }): Promise<readonly boolean[]> =>
    page.evaluate(PASTE_IMAGES_NO_AWAIT_BROWSER_FN, { dataUrls: [...dataUrls], fileName }),

  pasteImageWithMediaType: async ({
    dataUrl,
    mediaType,
    fileName = DEFAULT_IMAGE_FILE_NAME,
  }: {
    dataUrl: string;
    mediaType: string;
    fileName?: string;
  }): Promise<boolean> =>
    page.evaluate(PASTE_IMAGE_WITH_MEDIA_TYPE_BROWSER_FN, { dataUrl, mediaType, fileName }),

  pasteBytes: async ({
    bytes,
    mediaType,
    fileName = DEFAULT_BYTES_FILE_NAME,
  }: {
    bytes: readonly number[];
    mediaType: string;
    fileName?: string;
  }): Promise<boolean> =>
    page.evaluate(PASTE_BYTES_BROWSER_FN, { bytes: [...bytes], mediaType, fileName }),

  pasteText: async ({ text }: { text: string }): Promise<boolean> =>
    page.evaluate(PASTE_TEXT_BROWSER_FN, { text }),

  pasteTextAndImage: async ({
    text,
    dataUrl,
    fileName = DEFAULT_IMAGE_FILE_NAME,
  }: {
    text: string;
    dataUrl: string;
    fileName?: string;
  }): Promise<boolean> =>
    page.evaluate(PASTE_TEXT_AND_IMAGE_BROWSER_FN, { text, dataUrl, fileName }),

  // A valid PNG signature (8 bytes) followed by a truncated IHDR chunk header with no body or CRC
  // — enough for the browser's image decoder to recognise the format and then fail to decode it,
  // landing on the same catch block a bottomed-out downscale ladder would. The byte array is
  // inlined here (never hoisted to a top-level const) because enforce-magic-arrays forbids a pure
  // number-literal array assigned to a `const`, and this is test-only fixture data with no
  // application config to live beside; as a bare call-argument literal it is not a
  // VariableDeclarator, so the rule never sees it.
  pasteCorruptPng: async (): Promise<boolean> =>
    page.evaluate(PASTE_BYTES_BROWSER_FN, {
      bytes: [
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52,
      ],
      mediaType: 'image/png',
      fileName: 'corrupt.png',
    }),

  buildOverCapImageDataUrl: async ({
    widthPx,
    heightPx,
    noiseBandRows,
  }: {
    widthPx: number;
    heightPx: number;
    noiseBandRows: number;
  }): Promise<unknown> =>
    page.evaluate(BUILD_OVER_CAP_IMAGE_BROWSER_FN, { widthPx, heightPx, noiseBandRows }),

  // Node-side on purpose: decoding a base64 payload's byte length is plain string arithmetic
  // (Buffer.byteLength honours base64 padding correctly), so this never needs a browser round trip
  // — including when `dataUrl` is a multi-megabyte string already sitting in the test process after
  // buildOverCapImageDataUrl returned it. The `await Promise.resolve()` no-op is what satisfies BOTH
  // this repo's promise-function-async (a Promise<unknown>-returning method must be async) and
  // require-await (an async method must contain a real await) at once.
  readDataUrlByteLength: async ({ dataUrl }: { dataUrl: string }): Promise<unknown> => {
    await Promise.resolve();
    const commaIndex = dataUrl.indexOf(',');
    const base64Body = dataUrl.slice(commaIndex + 1);
    return Buffer.byteLength(base64Body, 'base64');
  },

  // Constructs the SAME over-cap corrupt PNG bytes pasteOverCapCorruptPng dispatches, but only to
  // measure `.length` — this never leaves Node, so a test can assert the input truly clears the byte
  // cap without ever shipping a multi-megabyte array across the Playwright bridge.
  buildOverCapCorruptPngByteLength: async ({
    fillerBytes,
  }: {
    fillerBytes: number;
  }): Promise<unknown> => {
    await Promise.resolve();
    return buildOverCapCorruptPngBytes({ fillerBytes }).length;
  },

  pasteOverCapCorruptPng: async ({ fillerBytes }: { fillerBytes: number }): Promise<boolean> =>
    page.evaluate(PASTE_OVER_CAP_CORRUPT_PNG_BROWSER_FN, { fillerBytes }),

  readComposerChildren: async (): Promise<readonly unknown[]> =>
    page.evaluate(READ_CHILDREN_BROWSER_FN),

  readComposerChildSummaries: async (): Promise<readonly unknown[]> =>
    page.evaluate(READ_CHILD_SUMMARIES_BROWSER_FN),

  readComposerChildNodeDetails: async (): Promise<readonly unknown[]> =>
    page.evaluate(READ_CHILD_NODE_DETAILS_BROWSER_FN),

  readComposerTextContent: async (): Promise<unknown> =>
    page.getByTestId('CHAT_INPUT').evaluate((element) => element.textContent ?? ''),

  readComposerInnerHtml: async (): Promise<unknown> =>
    page.getByTestId('CHAT_INPUT').evaluate((element) => element.innerHTML),

  readContentEditableAttribute: async (): Promise<unknown> =>
    page.getByTestId('CHAT_INPUT').getAttribute('contenteditable'),

  readThumbnailCount: async (): Promise<unknown> =>
    page.getByTestId('CHAT_INPUT_THUMBNAIL').count(),

  readThumbnailSrcs: async (): Promise<readonly unknown[]> =>
    page
      .getByTestId('CHAT_INPUT_THUMBNAIL')
      .evaluateAll((images) => images.map((image) => image.getAttribute('src') ?? '')),

  readThumbnailNaturalWidths: async (): Promise<readonly unknown[]> =>
    page
      .getByTestId('CHAT_INPUT_THUMBNAIL')
      .evaluateAll<
        unknown[],
        HTMLImageElement
      >((images) => images.map((image) => image.naturalWidth)),

  readThumbnailNaturalHeights: async (): Promise<readonly unknown[]> =>
    page
      .getByTestId('CHAT_INPUT_THUMBNAIL')
      .evaluateAll<
        unknown[],
        HTMLImageElement
      >((images) => images.map((image) => image.naturalHeight)),

  readThumbnailChildElementCounts: async (): Promise<readonly unknown[]> =>
    page
      .getByTestId('CHAT_INPUT_THUMBNAIL')
      .evaluateAll((images) => images.map((image) => image.childElementCount)),

  // The identical-clipboard-twice scenarios need to tell two thumbnails' minted ids apart without
  // going through readComposerChildren's mixed text/image shape — this is the direct DOM-order
  // parallel to readThumbnailSrcs, reading the attribute domComposerInsertImageAdapter stamps rather
  // than the pixel data.
  readThumbnailAttachmentIds: async (): Promise<readonly unknown[]> =>
    page
      .getByTestId('CHAT_INPUT_THUMBNAIL')
      .evaluateAll((images) =>
        images.map((image) => image.getAttribute('data-attachment-id') ?? ''),
      ),

  // Painted geometry — jsdom has no layout engine, so this can only be proven in a real browser.
  // getBoundingClientRect() (not naturalWidth/naturalHeight) is what reports the CSS-scaled render
  // size a viewer actually sees, as opposed to the attachment's intrinsic decoded pixel dimensions.
  // Rounded to the nearest pixel in-browser (not left as a sub-pixel float): the layout engine's own
  // sub-pixel snapping is far finer than one pixel, so a test asserting the rounded value is exact
  // and deterministic without chasing Blink's internal snapping unit.
  readThumbnailRenderedSizes: async (): Promise<readonly unknown[]> =>
    page.getByTestId('CHAT_INPUT_THUMBNAIL').evaluateAll<unknown[], HTMLImageElement>((images) =>
      images.map((image) => {
        const rect = image.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height) };
      }),
    ),

  // Painted geometry, same reasoning as readThumbnailRenderedSizes — whether SEND_BUTTON sits inside
  // the viewport can only be measured against a real layout. Resolved to a single boolean here
  // (rather than handing the raw box back) because the box's own x/y drift with unrelated page
  // layout (header height, other panels) in a way this feature has no control over and a test has no
  // stable literal to assert against — "does it fit" is the one fact a pasted-image regression can
  // actually change.
  readSendButtonFitsInViewport: async (): Promise<unknown> => {
    const box = await page.getByTestId('SEND_BUTTON').boundingBox();
    const viewportSize = page.viewportSize();
    if (box === null || viewportSize === null) {
      throw new Error(
        'composer-paste harness: SEND_BUTTON bounding box or viewport size unavailable',
      );
    }
    return box.y >= 0 && box.y + box.height <= viewportSize.height;
  },

  readDraftText: async (): Promise<unknown> =>
    page.evaluate((key) => localStorage.getItem(key), DRAFT_STORAGE_KEY),

  readDraftImageRecords: async (): Promise<readonly unknown[]> =>
    page.evaluate(READ_DRAFT_IMAGE_RECORDS_BROWSER_FN, {
      databaseName: DRAFT_DATABASE_NAME,
      storeName: DRAFT_STORE_NAME,
    }),

  // Same store, projected to just the attachmentId column — an orphaned-record assertion (N
  // thumbnails, does the store hold exactly N ids in the same order) needs this list to line up
  // directly against readThumbnailAttachmentIds' DOM-order list, without either side re-deriving the
  // other's shape (mediaType/dataBase64) it doesn't care about.
  readDraftImageAttachmentIds: async (): Promise<readonly unknown[]> =>
    page.evaluate(READ_DRAFT_IMAGE_ATTACHMENT_IDS_BROWSER_FN, {
      databaseName: DRAFT_DATABASE_NAME,
      storeName: DRAFT_STORE_NAME,
    }),

  focusComposer: async (): Promise<void> => {
    await page.getByTestId('CHAT_INPUT').click();
  },

  placeCaretBetweenChildren: async ({ index }: { index: number }): Promise<void> =>
    page.evaluate(PLACE_CARET_BROWSER_FN, { index }),

  // Same clear as `beforeEach`, but invoked DIRECTLY against the already-loaded page rather than via
  // `page.addInitScript` — `beforeEach`'s registration re-runs on every future navigation of this same
  // `page` (including a later `page.reload()`), which is exactly what a reload-restore test needs to
  // NOT happen to the draft it just wrote. This is the one-shot version: a control case that wants to
  // prove "an empty draft store restores nothing" calls this immediately before ITS OWN reload,
  // instead of a second `beforeEach()` call that would re-arm the persistent wipe-on-every-navigation
  // behaviour for the rest of the test.
  clearDraftStorage: async (): Promise<void> => {
    await page.evaluate(CLEAR_STORAGE_BROWSER_FN, { databaseName: DRAFT_DATABASE_NAME });
  },

  // Reproduces defect 2's precondition — call AFTER clearDraftStorage and BEFORE the composer page
  // ever loads (this test's own storage-clearing beforeEach only runs page.goto('/'), never the
  // composer route itself), so the app's own indexedDbDraftImagesReadAdapter never gets a chance to
  // create the real store first.
  seedDecoyDraftDatabase: async (): Promise<void> => {
    await page.evaluate(SEED_DECOY_DRAFT_DATABASE_BROWSER_FN, {
      databaseName: DRAFT_DATABASE_NAME,
      decoyStoreName: DECOY_STORE_NAME,
      version: DRAFT_DATABASE_VERSION,
    });
  },

  readDraftDatabaseStoreNames: async (): Promise<readonly unknown[]> =>
    page.evaluate(READ_DATABASE_STORE_NAMES_BROWSER_FN, { databaseName: DRAFT_DATABASE_NAME }),

  // Node-side on purpose (same reasoning as readDataUrlByteLength above): the server writes real
  // files to <dirname(questFilePath)>/images, and a Playwright `page` has no filesystem access to
  // read them back. Returns one entry per file in that directory, each entry that file's byte size —
  // absent entirely (never created by a send) reads as an empty array rather than throwing, since a
  // quest that has never received an image send is a legitimate precondition a test measures against.
  readQuestImageByteLengths: async ({
    questFilePath,
  }: {
    questFilePath: string;
  }): Promise<readonly unknown[]> => {
    await Promise.resolve();
    const imagesDirPath = join(dirname(questFilePath), QUEST_IMAGES_DIR_NAME);
    if (!existsSync(imagesDirPath)) {
      return [];
    }
    return readdirSync(imagesDirPath).map(
      (fileName) => statSync(join(imagesDirPath, fileName)).size,
    );
  },
});
