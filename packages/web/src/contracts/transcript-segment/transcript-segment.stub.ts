import type { StubArgument } from '@dungeonmaster/shared/@types';

import { transcriptSegmentContract } from './transcript-segment-contract';
import type { TranscriptSegment } from './transcript-segment-contract';

export const TranscriptSegmentStub = ({
  ...props
}: StubArgument<TranscriptSegment> = {}): TranscriptSegment =>
  // The `broken-image` member is `.strict()`, so merging it under the `text` default the way
  // `image` safely does would leave a stray `text: 'hello'` key that member refuses outright.
  // An override naming any kind other than `text` therefore replaces the default wholesale.
  transcriptSegmentContract.parse(
    props.kind === undefined || props.kind === 'text'
      ? { kind: 'text', text: 'hello', ...props }
      : props,
  );
