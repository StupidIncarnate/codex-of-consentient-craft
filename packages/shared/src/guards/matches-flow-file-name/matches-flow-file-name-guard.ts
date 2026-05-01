/**
 * PURPOSE: Returns true when a filename matches the flow file pattern (*-flow.ts)
 *
 * USAGE:
 * matchesFlowFileNameGuard({ name: 'quest-flow.ts' });
 * // Returns true — matches the flow file pattern
 */

export const matchesFlowFileNameGuard = ({ name }: { name?: string }): boolean => {
  if (name === undefined) return false;
  return name.endsWith('-flow.ts');
};
