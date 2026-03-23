/**
 * PURPOSE: Checks if a file path is inside a test/ directory
 *
 * USAGE:
 * if (isInTestDirGuard({ filename: '/project/test/harnesses/guild/guild.harness.ts' })) {
 *   // Returns true - file is in test/ directory
 * }
 * if (isInTestDirGuard({ filename: '/project/src/brokers/guild/guild-broker.ts' })) {
 *   // Returns false - not in test/ directory
 * }
 *
 * WHEN-TO-USE: Use to exclude test infrastructure files from scenario-level lint rules
 */
export const isInTestDirGuard = ({ filename }: { filename?: string | undefined }): boolean => {
  if (filename === undefined) {
    return false;
  }

  return filename.includes('/test/');
};
