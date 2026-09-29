/**
 * PURPOSE: The real tsx CLI path, produced by calling `tsxCliPath` against the tsx this gateway
 * declares as a dependency, so a stub never holds a hand-typed path that matches one checkout only.
 *
 * USAGE:
 * const cli = TsxCliPathStub();
 * // Returns the absolute path tsxCliPath() resolves
 */
import { tsxCliPath } from './tsx-cli-path';

export const TsxCliPathStub = (): ReturnType<typeof tsxCliPath> => tsxCliPath();
