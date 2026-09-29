/**
 * PURPOSE: The real tsx loader URL, produced by calling `tsxLoaderUrl` against the tsx this gateway
 * declares as a dependency, so a stub never holds a hand-typed URL that matches one checkout only.
 *
 * USAGE:
 * const loader = TsxLoaderUrlStub();
 * // Returns the URL tsxLoaderUrl() resolves
 */
import { tsxLoaderUrl } from './tsx-loader-url';

export const TsxLoaderUrlStub = (): ReturnType<typeof tsxLoaderUrl> => tsxLoaderUrl();
