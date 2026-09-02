import type { StubArgument } from '@dungeonmaster/shared/@types';

import { composerSegmentContract } from './composer-segment-contract';
import type { ComposerSegment } from './composer-segment-contract';

export const ComposerSegmentStub = ({
  ...props
}: StubArgument<ComposerSegment> = {}): ComposerSegment =>
  composerSegmentContract.parse({ kind: 'text', text: 'hello', ...props });
