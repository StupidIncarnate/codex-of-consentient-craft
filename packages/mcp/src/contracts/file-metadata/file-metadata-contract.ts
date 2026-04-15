/**
 * PURPOSE: Defines the complete schema for file metadata including signature and documentation
 *
 * USAGE:
 * const metadata: FileMetadata = fileMetadataContract.parse({ name: 'myBroker', path: '/path/to/file', fileType: 'broker', purpose: '...', signature: {...} });
 * // Returns validated file metadata with name, path, type, optional purpose, signature, and usage
 */
import { z } from 'zod';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import { grepHitContract } from '../grep-hit/grep-hit-contract';

const signatureParameterContract = z.object({
  name: z.string().brand<'ParameterName'>(),
  type: z.union([z.record(z.string().brand<'TypeName'>()), z.string().brand<'TypeName'>()]),
});

const functionSignatureContract = z.object({
  raw: z.string().brand<'SignatureRaw'>(),
  parameters: z.array(signatureParameterContract),
  returnType: z.string().brand<'ReturnType'>(),
});

export const fileMetadataContract = z.object({
  name: z.string().brand<'FunctionName'>(),
  path: pathSegmentContract,
  fileType: z.string().brand<'FileType'>(),
  purpose: z.string().brand<'Purpose'>().optional(),
  signature: functionSignatureContract.optional(),
  usage: z.string().brand<'UsageExample'>().optional(),
  metadata: z.record(z.unknown()).optional(),
  relatedFiles: z.array(pathSegmentContract),
  hits: z.array(grepHitContract).optional(),
});

export type FileMetadata = z.infer<typeof fileMetadataContract>;
export type FunctionSignature = z.infer<typeof functionSignatureContract>;
export type SignatureParameter = z.infer<typeof signatureParameterContract>;
