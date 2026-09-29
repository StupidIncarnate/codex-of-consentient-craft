/**
 * PURPOSE: The page-free half of the `paste` step verb: refuses a step naming neither a file nor a
 * value, refuses a file that is not there, and turns what is left into the ClipboardPayload the
 * facade writes to the page's clipboard. Reach for this beside `browserSessionLaunchBroker`'s
 * `pasteMatch`/`pasteRef`, which own the page half (focus, clipboard write, `ControlOrMeta+V`). It
 * runs BEFORE the facade touches the page, so a bad step never focuses anything. When both a value
 * and a file are named the file must still exist, and the value is what gets pasted.
 *
 * USAGE:
 * pastePayloadLayerBroker({ filePath: '/tmp/shot.png', value: null });
 * // Returns { kind: 'file', base64: '...', mimeType: 'image/png' }
 */

import { existsSync, readFileBytesSync } from '#gateway/node/fs';
import { extname } from '#gateway/node/path';

import { clipboardPayloadContract } from '../../../contracts/clipboard-payload/clipboard-payload-contract';
import type { ClipboardPayload } from '../../../contracts/clipboard-payload/clipboard-payload-contract';
import { pasteStatics } from '../../../statics/paste/paste-statics';

export const pastePayloadLayerBroker = ({
  filePath,
  value,
}: {
  filePath: string | null;
  value: string | null;
}): ClipboardPayload => {
  if (filePath !== null && !existsSync(filePath)) {
    throw new Error(`file at "${filePath}" does not exist`);
  }
  if (value !== null) {
    return clipboardPayloadContract.parse({ kind: 'text', text: value });
  }
  if (filePath === null) {
    throw new Error('either filePath or value must be provided');
  }

  const rawExt = extname(filePath).toLowerCase();
  const ext = rawExt.startsWith('.') ? rawExt.slice(1) : rawExt;
  const mimeType =
    ext in pasteStatics.mimeTypes
      ? pasteStatics.mimeTypes[ext as keyof typeof pasteStatics.mimeTypes]
      : pasteStatics.mimeTypes.default;

  return clipboardPayloadContract.parse({
    kind: 'file',
    base64: readFileBytesSync(filePath).toString('base64'),
    mimeType,
  });
};
