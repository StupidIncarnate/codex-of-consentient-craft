/**
 * PURPOSE: Checks if a glob pattern or file path already has a TypeScript extension (.ts or .tsx)
 *
 * USAGE:
 * isTypescriptFileGuard({ pattern: 'src/index.ts' }); // true
 * isTypescriptFileGuard({ pattern: 'src/**\/*' }); // false
 */

export const isTypescriptFileGuard = ({ pattern }: { pattern?: string }): boolean => {
  if (pattern === undefined) {
    return false;
  }
  return /\.tsx?$/u.test(pattern) || pattern.endsWith('.d.ts');
};
