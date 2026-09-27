/**
 * PURPOSE: Pass-through for the npm package '@testing-library/react'. Code outside the gateway
 * imports it through here instead of the raw package, so a future guard or override lands in this
 * one file and reaches every caller. `render` carries no override here — `@dungeonmaster/testing`'s
 * own `mantineRenderAdapter` wraps this raw `render` in `MantineProvider`, since that Mantine
 * choice belongs to web, the one app that needs it, not to the gateway. A `gateway.restrictedTo`
 * entry in `.dungeonmaster.json` confines this raw `render` export to the `testing` package.
 *
 * USAGE:
 * import { render, renderHook, screen } from '#gateway/npm/testing-library__react';
 */

export * from '@testing-library/react';
