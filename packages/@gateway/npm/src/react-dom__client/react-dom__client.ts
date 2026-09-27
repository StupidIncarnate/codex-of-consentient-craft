/**
 * PURPOSE: Pass-through for the npm package 'react-dom/client'. Code outside the gateway imports react-dom/client
 * through here instead of the raw package, so a future guard or override on react-dom/client lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/react-dom__client';
 */

export * from 'react-dom/client';
