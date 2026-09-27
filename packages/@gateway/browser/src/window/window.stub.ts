/**
 * PURPOSE: The real `window` singleton `#gateway/browser/window` passes through — there is nothing
 * to construct beyond it, so this hands back the genuine object rather than a fake one.
 *
 * USAGE:
 * const realWindow = WindowStub();
 * // Returns globalThis.window, unchanged
 */
import { window } from './window';

export const WindowStub = (): Window & typeof globalThis => window;
