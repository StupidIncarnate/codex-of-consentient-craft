import { extractedMetadataContract } from './extracted-metadata-contract';
import type { ExtractedMetadata } from './extracted-metadata-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const ExtractedMetadataStub = ({
  ...props
}: StubArgument<ExtractedMetadata> = {}): ExtractedMetadata =>
  extractedMetadataContract.parse({
    purpose: 'Test purpose',
    usage: 'const result = testFunction();',
    related: ['relatedFunction'],
    metadata: {},
    ...props,
  });
