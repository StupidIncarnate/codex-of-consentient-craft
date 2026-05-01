/**
 * PURPOSE: Returns true when a filename matches the widget file pattern (*-widget.ts or *-widget.tsx)
 *
 * USAGE:
 * matchesWidgetFileNameGuard({ name: 'quest-chat-widget.tsx' });
 * // Returns true — matches the widget file pattern
 *
 * WHEN-TO-USE: Widget-tree broker filtering directory entries to collect only widget source files
 * WHEN-NOT-TO-USE: When you need to match non-widget source files
 */

export const matchesWidgetFileNameGuard = ({ name }: { name?: string }): boolean => {
  if (name === undefined) return false;
  return name.endsWith('-widget.ts') || name.endsWith('-widget.tsx');
};
