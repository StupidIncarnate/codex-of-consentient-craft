/**
 * PURPOSE: Returns true when a filename matches the startup file pattern (start-*.ts)
 *
 * USAGE:
 * matchesStartupFileNameGuard({ name: 'start-my-app.ts' });
 * // Returns true — matches the startup file pattern
 */

export const matchesStartupFileNameGuard = ({ name }: { name?: string }): boolean => {
  if (name === undefined) return false;
  return /^start-.+\.ts$/u.test(name);
};
