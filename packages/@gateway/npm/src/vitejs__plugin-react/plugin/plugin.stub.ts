/**
 * PURPOSE: The real array of Vite plugins, built by actually calling `@vitejs/plugin-react`'s own
 * default export factory — never a hand-typed plugin object standing in for what the real factory
 * produces. Loading `@vitejs/plugin-react` for real trips the unit-test I/O trap (see this
 * subpath's own `.integration.test.ts`), so this stub's own companion test is
 * `.stub.integration.test.ts` too. Typed via `ReturnType<typeof react>` rather than naming `Plugin`
 * directly — this installed `vite` version does not re-export that type name at its package root,
 * even though `@vitejs/plugin-react`'s own (differently-resolved) type declares its factory
 * returning exactly that type.
 *
 * USAGE:
 * const plugins = VitePluginReactStub();
 * // Returns the real two Vite plugins the factory produces
 */
import react from '@vitejs/plugin-react';

export const VitePluginReactStub = (): ReturnType<typeof react> => react();
