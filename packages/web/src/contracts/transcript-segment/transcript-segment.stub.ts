import type { StubArgument } from '@dungeonmaster/shared/@types';

import { transcriptSegmentContract } from './transcript-segment-contract';
import type { TranscriptSegment } from './transcript-segment-contract';

export const TranscriptSegmentStub = ({
  ...props
}: StubArgument<TranscriptSegment> = {}): TranscriptSegment =>
  transcriptSegmentContract.parse({ kind: 'text', text: 'hello', ...props });
