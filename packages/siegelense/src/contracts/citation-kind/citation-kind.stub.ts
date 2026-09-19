import type { z } from 'zod';

import { citationKindContract } from './citation-kind-contract';
import type { CitationKind } from './citation-kind-contract';

type CitationKindInput = z.input<typeof citationKindContract>;

export const CitationKindStub = ({ value }: { value?: CitationKindInput } = {}): CitationKind =>
  citationKindContract.parse(value ?? 'walked-note');
