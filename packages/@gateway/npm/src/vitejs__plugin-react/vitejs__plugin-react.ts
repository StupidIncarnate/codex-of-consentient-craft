/**
 * PURPOSE: Pass-through for the npm package '@vitejs/plugin-react'. Code outside the gateway imports @vitejs/plugin-react
 * through here instead of the raw package, so a future guard or override on @vitejs/plugin-react lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/vitejs__plugin-react';
 */

export * from '@vitejs/plugin-react';
export { default } from '@vitejs/plugin-react';
