/**
 * PURPOSE: Parses a spiritmender batch file JSON into typed filePaths, errors, and optional verificationCommand
 *
 * USAGE:
 * parseBatchFileTransformer({ contents: FileContentsStub({ value: '{"filePaths":["/src/a.ts"],"errors":["error msg"],"verificationCommand":"npm run ward"}' }) });
 * // Returns { filePaths: [AbsoluteFilePath], errors: [ErrorMessage], verificationCommand: VerificationCommand | undefined }
 */

import {
  absoluteFilePathContract,
  errorMessageContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type FileContents,
} from '@dungeonmaster/shared/contracts';

import { workUnitContract } from '../../contracts/work-unit/work-unit-contract';
import type { SpiritmenderWorkUnit } from '../../contracts/work-unit/work-unit-contract';

type VerificationCommand = SpiritmenderWorkUnit['verificationCommand'];
type ContextInstructions = SpiritmenderWorkUnit['contextInstructions'];

export const parseBatchFileTransformer = ({
  contents,
}: {
  contents: FileContents;
}): {
  filePaths: AbsoluteFilePath[];
  errors: ErrorMessage[];
  verificationCommand: VerificationCommand;
  contextInstructions: ContextInstructions;
} => {
  const parsed: unknown = JSON.parse(contents);

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      filePaths: [],
      errors: [],
      verificationCommand: undefined,
      contextInstructions: undefined,
    };
  }

  const rawFilePaths: unknown = Reflect.get(parsed, 'filePaths');
  const rawErrors: unknown = Reflect.get(parsed, 'errors');
  const rawVerificationCommand: unknown = Reflect.get(parsed, 'verificationCommand');
  const rawContextInstructions: unknown = Reflect.get(parsed, 'contextInstructions');

  const filePaths: AbsoluteFilePath[] = [];
  if (Array.isArray(rawFilePaths)) {
    for (const fp of rawFilePaths) {
      if (typeof fp === 'string') {
        try {
          filePaths.push(absoluteFilePathContract.parse(fp));
        } catch {
          // Skip invalid paths
        }
      }
    }
  }

  const errors: ErrorMessage[] = [];
  if (Array.isArray(rawErrors)) {
    for (const err of rawErrors) {
      if (typeof err === 'string') {
        errors.push(errorMessageContract.parse(err));
      }
    }
  }

  const verificationCommand: VerificationCommand =
    typeof rawVerificationCommand === 'string' && rawVerificationCommand.length > 0
      ? (() => {
          try {
            const unit = workUnitContract.parse({
              role: 'spiritmender',
              filePaths: [],
              verificationCommand: rawVerificationCommand,
            });
            return unit.role === 'spiritmender' ? unit.verificationCommand : undefined;
          } catch {
            return undefined;
          }
        })()
      : undefined;

  const contextInstructions: ContextInstructions =
    typeof rawContextInstructions === 'string' && rawContextInstructions.length > 0
      ? (() => {
          try {
            const unit = workUnitContract.parse({
              role: 'spiritmender',
              filePaths: [],
              contextInstructions: rawContextInstructions,
            });
            return unit.role === 'spiritmender' ? unit.contextInstructions : undefined;
          } catch {
            return undefined;
          }
        })()
      : undefined;

  return { filePaths, errors, verificationCommand, contextInstructions };
};
