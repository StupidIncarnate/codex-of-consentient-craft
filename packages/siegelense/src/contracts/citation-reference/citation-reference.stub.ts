import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts/content-text/content-text.stub';

import { CitationKindStub } from '../citation-kind/citation-kind.stub';
import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { RunIdStub } from '../run-id/run-id.stub';
import { citationReferenceContract } from './citation-reference-contract';
import type { CitationReference } from './citation-reference-contract';

export const CitationReferenceStub = ({
  ...props
}: StubArgument<CitationReference> = {}): CitationReference =>
  citationReferenceContract.parse({
    kind: CitationKindStub({ value: 'walked-note' }),
    instanceId: InstanceIdStub({ value: 'inst_1d09' }),
    runId: RunIdStub({ value: 'run_7' }),
    citingFile: '/tmp/quests/q1/quest.json',
    why: ContentTextStub({
      value: 'run_7 cited by a WALKED note on open quest q1 in /tmp/quests/q1/quest.json',
    }),
    ...props,
  });
