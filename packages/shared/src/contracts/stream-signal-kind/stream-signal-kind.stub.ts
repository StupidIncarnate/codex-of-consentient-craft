import { streamSignalKindContract } from './stream-signal-kind-contract';
import type { StreamSignalKind } from './stream-signal-kind-contract';

export const StreamSignalKindStub = ({
  value,
}: { value?: StreamSignalKind } = {}): StreamSignalKind =>
  streamSignalKindContract.parse(value ?? 'complete');
