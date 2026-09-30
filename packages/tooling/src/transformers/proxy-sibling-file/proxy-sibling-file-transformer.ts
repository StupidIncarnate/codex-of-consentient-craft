/**
 * PURPOSE: Names the proxy file that sits beside an implementation file, keeping its `.ts` or
 * `.tsx` extension. The census only looks the name up; whether the file exists is for the caller
 * to check against the files it read.
 *
 * USAGE:
 * proxySiblingFileTransformer({ file: censusPath });
 * // Returns 'packages/a/src/x/x-broker.proxy.ts' for packages/a/src/x/x-broker.ts
 */

export const proxySiblingFileTransformer = ({ file }: { file: string }): string =>
  file.replace(/\.(tsx?)$/u, '.proxy.$1');
