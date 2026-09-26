/**
 * PURPOSE: Reads one environment variable. Returns the raw string or undefined — no parsing, no
 * default, since callers disagree on the fallback (`Number(...)`, `?? default`) and that stays
 * at the call site.
 *
 * USAGE:
 * const verbose = getEnv('VERBOSE');
 * // Returns process.env.VERBOSE, or undefined if unset
 */

export const getEnv = (name: string): string | undefined => process.env[name];
