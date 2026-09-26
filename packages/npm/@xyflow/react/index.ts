/**
 * PURPOSE: Pass-through for the npm package '@xyflow/react'. Code outside the gateway imports @xyflow/react
 * through here instead of the raw package, so a future guard or override on @xyflow/react lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@xyflow/react';
 */

export * from '@xyflow/react';
