/**
 * PURPOSE: Strips the .jsonl file extension from an absolute file path to derive a directory path
 *
 * USAGE:
 * stripJsonlSuffixTransformer({
 *   filePath: '/home/user/.claude/projects/abc-123.jsonl',
 * });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/abc-123'
 */

export const stripJsonlSuffixTransformer = ({ filePath }: { filePath: string }): string =>
  filePath.replace(/\.jsonl$/u, '');
