/**
 * PURPOSE: The real `expect` this subpath exports, unchanged — there is nothing more to construct:
 * a real `Page`/`Browser` needs an actual browser process, well outside what a stub factory can
 * honestly build. Importing `@playwright/test` for real trips the unit-test I/O trap (see this
 * subpath's own `.integration.test.ts`), so this stub's own companion test is
 * `.stub.integration.test.ts` too.
 *
 * USAGE:
 * const realExpect = ExpectStub();
 * // Returns the real @playwright/test `expect`, unchanged
 */
import { expect as playwrightExpect } from '@playwright/test';

export const ExpectStub = (): typeof playwrightExpect => playwrightExpect;
