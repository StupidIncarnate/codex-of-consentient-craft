/**
 * PURPOSE: Strips the .jsonl file extension from an absolute file path to derive a directory path
 *
 * USAGE:
 * stripJsonlSuffixTransformer({
 *   filePath: absoluteFilePathContract.parse('/home/user/.claude/projects/abc-123.jsonl'),
 * });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/abc-123'
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../contracts/absolute-file-path/absolute-file-path-contract';

export const stripJsonlSuffixTransformer = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): AbsoluteFilePath => absoluteFilePathContract.parse(filePath.replace(/\.jsonl$/u, ''));
