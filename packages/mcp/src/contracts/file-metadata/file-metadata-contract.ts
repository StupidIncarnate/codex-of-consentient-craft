/**
 * PURPOSE: Defines the complete schema for file metadata including signature and documentation
 *
 * USAGE:
 * const metadata: FileMetadata = fileMetadataContract.parse({ name: 'myBroker', path: '/path/to/file', fileType: 'broker', purpose: '...', signature: {...} });
 * // Returns validated file metadata with name, path, type, optional purpose, signature, and usage
 */
import { z } from '#gateway/npm/zod';
import { grepHitContract } from '../grep-hit/grep-hit-contract';

const signatureParameterContract = z.object({
  name: z.string().brand<'SignatureParameterName'>(),
  type: z.union([
    z.record(z.string().brand<'SignatureParameterTypeKey'>(), z.string().brand<'SignatureParameterType'>()),
    z.string().brand<'SignatureParameterType'>(),
  ]),
}).brand<'SignatureParameter'>();

const functionSignatureContract = z.object({
  raw: z.string().brand<'FunctionSignatureRaw'>(),
  parameters: z.array(signatureParameterContract),
  returnType: z.string().brand<'FunctionSignatureReturnType'>(),
}).brand<'FunctionSignature'>();

export const fileMetadataContract = z.object({
  name: z.string().brand<'FileMetadataName'>(),
  path: z.string().brand<'FileMetadataPath'>(),
  fileType: z.string().brand<'FileMetadataFileType'>(),
  purpose: z.string().brand<'FileMetadataPurpose'>().optional(),
  signature: functionSignatureContract.optional(),
  usage: z.string().brand<'FileMetadataUsage'>().optional(),
  metadata: z.record(z.string().brand<'FileMetadataMetadataKey'>(), z.json()).optional(),
  relatedFiles: z.array(z.string().brand<'FileMetadataRelatedFiles'>()),
  hits: z.array(grepHitContract).optional(),
}).brand<'FileMetadata'>();

export type FileMetadata = z.infer<typeof fileMetadataContract>;
export type FunctionSignature = z.infer<typeof functionSignatureContract>;
export type SignatureParameter = z.infer<typeof signatureParameterContract>;
