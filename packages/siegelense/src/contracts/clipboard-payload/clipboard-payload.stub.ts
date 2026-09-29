import type { StubArgument } from '@dungeonmaster/shared/@types';

import { clipboardPayloadContract } from './clipboard-payload-contract';
import type { ClipboardPayload } from './clipboard-payload-contract';

export const ClipboardPayloadStub = ({
  ...props
}: StubArgument<ClipboardPayload> = {}): ClipboardPayload =>
  clipboardPayloadContract.parse({
    kind: 'text',
    text: 'pasted text',
    ...props,
  });
