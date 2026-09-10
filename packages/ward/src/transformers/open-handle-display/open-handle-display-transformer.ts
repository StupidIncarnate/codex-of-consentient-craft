/**
 * PURPOSE: Renders one open handle down to the package, the message and the few frames that name
 * whoever armed it, with the repo prefix stripped. Reach for this before counting leaks rather than
 * after: two reports are the same leak exactly when this returns the same string for both.
 *
 * USAGE:
 * openHandleDisplayTransformer({packageName, handle, cwd});
 * // Returns '  orchestrator  setImmediate still armed when src/a.test.ts finished\n      at ...'
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { openHandleDisplayContract } from '../../contracts/open-handle-display/open-handle-display-contract';
import type { OpenHandleDisplay } from '../../contracts/open-handle-display/open-handle-display-contract';
import type { OpenHandle } from '../../contracts/open-handle/open-handle-contract';
import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';
import { openHandleStackStatics } from '../../statics/open-handle-stack/open-handle-stack-statics';

export const openHandleDisplayTransformer = ({
  packageName,
  handle,
  cwd,
}: {
  packageName: ProjectFolder['name'];
  handle: OpenHandle;
  cwd: AbsoluteFilePath;
}): OpenHandleDisplay => {
  const prefix = `${String(cwd)}/`;
  const frames = String(handle.stack)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '));

  // Every jest-collected stack opens with node's own plumbing — `emitInitNative`,
  // `initAsyncResource`, `setInterval` — and closes with jest's runtime, and neither end names the
  // leak. The frames BETWEEN them are the caller's own code, and the chain matters more than any
  // single frame: what armed the handle says what leaked, its callers say which path got there.
  // Falls back to the raw first frame when a handle was armed entirely inside a dependency, so a
  // line still prints.
  const ownFrames = frames.filter(
    (line) =>
      !line.includes(openHandleStackStatics.frames.nodeInternal) &&
      !line.includes(openHandleStackStatics.frames.dependency),
  );
  const shown =
    ownFrames.length > 0
      ? ownFrames.slice(0, openHandleStackStatics.frames.maxShown)
      : frames.slice(0, 1);

  // The absolute prefix is identical on every line and is most of each line's width.
  const where = shown.map((line) => `\n      ${line.split(prefix).join('')}`).join('');
  const message = String(handle.message).split(prefix).join('');

  return openHandleDisplayContract.parse(`  ${String(packageName)}  ${message}${where}`);
};
