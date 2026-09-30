/**
 * PURPOSE: Tells whether a symbol's declaration file is one platform-globals-ban treats as a
 * platform global: `lib.dom*.d.ts`, `lib.webworker*.d.ts`, or anything under `@types/node`. ES
 * built-ins (`JSON`, `Math`, `Promise`, …) live in `lib.es*.d.ts` and never match.
 *
 * USAGE:
 * isBannedPlatformDeclarationFileGuard({ fileName: FilePathStub({ value: '/repo/node_modules/typescript/lib/lib.dom.d.ts' }) });
 * // Returns true
 * isBannedPlatformDeclarationFileGuard({ fileName: FilePathStub({ value: '/repo/node_modules/typescript/lib/lib.es5.d.ts' }) });
 * // Returns false
 */

const DECLARATION_FILE_PATTERNS = [/lib\.dom(\.\w+)?\.d\.ts$/u, /lib\.webworker(\.\w+)?\.d\.ts$/u];

export const isBannedPlatformDeclarationFileGuard = ({
  fileName,
}: {
  fileName?: string;
}): boolean => {
  if (fileName === undefined) {
    return false;
  }
  return (
    DECLARATION_FILE_PATTERNS.some((pattern) => pattern.test(fileName)) ||
    fileName.includes('/@types/node/')
  );
};
