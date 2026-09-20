import type { StubArgument } from '@dungeonmaster/shared/@types';

import { CitationGapStub } from '../citation-gap/citation-gap.stub';
import { citationResolutionContract } from './citation-resolution-contract';
import type { CitationResolution } from './citation-resolution-contract';

export const CitationResolutionStub = ({
  ...props
}: StubArgument<CitationResolution> = {}): CitationResolution =>
  citationResolutionContract.parse({
    references: [],
    gaps: [CitationGapStub()],
    blocked: null,
    ...props,
  });
