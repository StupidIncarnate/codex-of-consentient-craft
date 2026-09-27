/**
 * PURPOSE: Pass-through for the npm package 'react-router-dom'. Code outside the gateway imports react-router-dom
 * through here instead of the raw package, so a future guard or override on react-router-dom lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/react-router-dom';
 */

export * from 'react-router-dom';
