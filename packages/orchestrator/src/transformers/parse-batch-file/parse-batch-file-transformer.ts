/**
 * PURPOSE: Parses a spiritmender batch file JSON into typed filePaths, errors, and optional verificationCommand
 *
 * USAGE:
 * parseBatchFileTransformer({ contents: FileContentsStub({ value: '{"filePaths":["/src/a.ts"],"errors":["error msg"],"verificationCommand":"npm run ward"}' }) });
 * // Returns { filePaths: [AbsoluteFilePath], errors: [ErrorMessage], verificationCommand: VerificationCommand | undefined }
 */

import type { FileContents } from '@dungeonmaster/shared/contracts';

import {
  batchFileInputContract,
  type BatchFileInput,
} from '../../contracts/batch-file-input/batch-file-input-contract';

export const parseBatchFileTransformer = ({
  contents,
}: {
  contents: FileContents;
}): BatchFileInput => {
  const { filePaths, errors, verificationCommand, contextInstructions } =
    batchFileInputContract.parse(JSON.parse(contents));
  return { filePaths, errors, verificationCommand, contextInstructions };
};
