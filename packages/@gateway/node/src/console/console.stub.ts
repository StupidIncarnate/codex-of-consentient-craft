/**
 * PURPOSE: The real `console` singleton `#gateway/node/console` passes through — there is nothing
 * to construct beyond it, so this hands back the genuine object rather than a fake one.
 *
 * USAGE:
 * const realConsole = ConsoleStub();
 * // Returns globalThis.console, unchanged
 */
import { console } from './console';

export const ConsoleStub = (): Console => console;
