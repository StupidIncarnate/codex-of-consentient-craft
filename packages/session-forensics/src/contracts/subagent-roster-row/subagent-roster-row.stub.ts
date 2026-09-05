import { subagentRosterRowContract, type SubagentRosterRow } from './subagent-roster-row-contract';
import { SubagentMetaStub } from '../subagent-meta/subagent-meta.stub';
import { TranscriptRecordStub } from '../transcript-record/transcript-record.stub';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const SubagentRosterRowStub = ({
  ...props
}: StubArgument<SubagentRosterRow> = {}): SubagentRosterRow =>
  subagentRosterRowContract.parse({
    agentId: 'agent-abc',
    meta: SubagentMetaStub(),
    // startedAt/endedAt are deliberately absent from the defaults (not set to undefined) so a
    // caller who omits them gets a row with those keys genuinely missing, matching the shape a
    // sub-agent transcript with no timestamped record produces. Pass them explicitly to get a
    // row with a window.
    turnCount: 3,
    records: [TranscriptRecordStub()],
    ...props,
  });
