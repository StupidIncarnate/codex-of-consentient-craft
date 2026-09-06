import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ComposerAttachmentStub } from '../composer-attachment/composer-attachment.stub';

import { composerSendPayloadContract } from './composer-send-payload-contract';
import type { ComposerSendPayload } from './composer-send-payload-contract';

export const ComposerSendPayloadStub = ({
  ...props
}: StubArgument<ComposerSendPayload> = {}): ComposerSendPayload =>
  composerSendPayloadContract.parse({
    message: '[Pasted Image 1]',
    attachments: [ComposerAttachmentStub()],
    ...props,
  });
