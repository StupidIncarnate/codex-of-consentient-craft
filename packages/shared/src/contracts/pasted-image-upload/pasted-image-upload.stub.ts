import type { StubArgument } from '@dungeonmaster/shared/@types';

import { pastedImageUploadContract } from './pasted-image-upload-contract';
import type { PastedImageUpload } from './pasted-image-upload-contract';

export const PastedImageUploadStub = ({
  ...props
}: StubArgument<PastedImageUpload> = {}): PastedImageUpload =>
  pastedImageUploadContract.parse({
    mediaType: 'image/png',
    dataBase64: 'iVBORw0KGgo=',
    ...props,
  });
