/**
 * PURPOSE: Create stub ScaffoldFile instances for testing
 *
 * USAGE:
 * const file = ScaffoldFileStub({ relativePath: 'src/index.ts' });
 * // Returns a valid ScaffoldFile instance
 */

import { scaffoldFileContract, type ScaffoldFile } from './scaffold-file-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ScaffoldFileStub = ({ ...props }: StubArgument<ScaffoldFile> = {}): ScaffoldFile =>
  scaffoldFileContract.parse({
    relativePath: 'package.json',
    contents: '{}\n',
    ...props,
  });
