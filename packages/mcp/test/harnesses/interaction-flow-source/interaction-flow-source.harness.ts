/**
 * PURPOSE: Reads the contents of interaction-flow.ts so integration tests can shape-assert
 * the meta-forwarding pattern in its handlers without violating the test-file rule against
 * importing Node builtins (fs/path). The shape check protects against the regression where
 * the handler destructure dropped `meta` silently, breaking every sub-agent's toolUseId path.
 *
 * USAGE:
 * const source = readInteractionFlowSource();
 * // Returns the FileContents-branded source of interaction-flow.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import { fileContentsContract, type FileContents } from '@dungeonmaster/shared/contracts';

const INTERACTION_FLOW_RELATIVE_PATH = '../../../src/flows/interaction/interaction-flow.ts';

export const readInteractionFlowSource = (): FileContents => {
  const absolutePath = join(__dirname, INTERACTION_FLOW_RELATIVE_PATH);
  return fileContentsContract.parse(readFileSync(absolutePath, 'utf8'));
};
