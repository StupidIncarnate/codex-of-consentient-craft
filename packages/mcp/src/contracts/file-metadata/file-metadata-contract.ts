import { z } from 'zod';

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
  path: z.string().brand<'AbsoluteFilePath'>(),
  fileType: z.string().brand<'FileType'>(),
  purpose: z.string().brand<'Purpose'>().optional(),
  signature: functionSignatureContract.optional(),
  usage: z.string().brand<'UsageExample'>().optional(),
  metadata: z.record(z.string().brand<'MetadataValue'>()).optional(),
});

export type FileMetadata = z.infer<typeof fileMetadataContract>;
export type FunctionSignature = z.infer<typeof functionSignatureContract>;
export type SignatureParameter = z.infer<typeof signatureParameterContract>;
