/**
 * PURPOSE: Tells whether a file sits where a package keeps its caller-facing proxy's anchor: directly in `src/startup/`, beside `start-<pkg>.proxy.ts`. The anchor gives enforce-proxy-child-creation the same-named sibling it pairs a proxy with. Pair with isReexportOnlyProgramGuard, since the anchor is a bare re-export that introduces no `import` line for the pairing rule to act on.
 *
 * USAGE:
 * isCallerProxyAnchorFileGuard({ filename: '/repo/packages/config/src/startup/start-config.ts' });
 * // Returns true
 * isCallerProxyAnchorFileGuard({ filename: '/repo/packages/config/src/startup/nested/start-config.ts' });
 * // Returns false
 */
export const isCallerProxyAnchorFileGuard = ({
  filename,
}: {
  filename?: string | undefined;
}): boolean => {
  if (filename === undefined) {
    return false;
  }

  const [fileName, folderName, parentFolderName] = filename.split('/').reverse();

  return (
    parentFolderName === 'src' &&
    folderName === 'startup' &&
    fileName !== undefined &&
    /^start-[a-z0-9-]+\.tsx?$/u.test(fileName)
  );
};
