/**
 * PURPOSE: Returns true for a repo-relative source path whose `.parse` calls count as parsing a
 * contract: production code, or a file under a `test/harnesses/` folder. A harness stands in for
 * an outside program (the Claude CLI, ward) and is where that program's data enters, so its parse
 * is a real boundary. Tests, stubs and proxies never count.
 *
 * USAGE:
 * isContractParseSourceFileGuard({ relativePath: 'packages/web/test/harnesses/a/a.harness.ts' });
 * // Returns true — a harness parse counts
 */
import { isProductionSourceFileGuard } from '../is-production-source-file/is-production-source-file-guard';

const HARNESS_FOLDER_PATTERN = /(?:^|\/)test\/harnesses\//u;
const HARNESS_EXCLUDED_PATTERN =
  /\.(?:test|integration\.test|e2e|spec|proxy|stub)\.tsx?$|\.d\.ts$|(?:^|\/)(?:node_modules|dist)\//u;

export const isContractParseSourceFileGuard = ({
  relativePath,
}: {
  relativePath?: string;
}): boolean => {
  if (relativePath === undefined) {
    return false;
  }
  return (
    isProductionSourceFileGuard({ relativePath }) ||
    (HARNESS_FOLDER_PATTERN.test(relativePath) && !HARNESS_EXCLUDED_PATTERN.test(relativePath))
  );
};
