import { extractedMetadataContract } from './extracted-metadata-contract';
import type { ExtractedMetadata } from './extracted-metadata-contract';
import type { StubArgument } from '../../@types/stub-argument.type';

/**
 * PURPOSE: Creates stub ExtractedMetadata for testing
 *
 * USAGE:
 * const metadata = ExtractedMetadataStub({ purpose: 'Custom purpose' });
 * // Returns ExtractedMetadata with default values and overrides
 */
export const ExtractedMetadataStub = ({
  ...props
}: StubArgument<ExtractedMetadata> = {}): ExtractedMetadata =>
  extractedMetadataContract.parse({
    purpose: 'Default test purpose',
    usage: 'defaultTest()',
    metadata: {},
    ...props,
  });
