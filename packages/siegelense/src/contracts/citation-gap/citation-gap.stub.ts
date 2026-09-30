import type { StubArgument } from '@dungeonmaster/shared/@types';

import { CitationKindStub } from '../citation-kind/citation-kind.stub';
import { citationGapContract } from './citation-gap-contract';
import type { CitationGap } from './citation-gap-contract';

export const CitationGapStub = ({ ...props }: StubArgument<CitationGap> = {}): CitationGap =>
  citationGapContract.parse({
    kind: CitationKindStub({ value: 'open-issue' }),
    why: 'no issue record exists on disk to check',
    ...props,
  });
