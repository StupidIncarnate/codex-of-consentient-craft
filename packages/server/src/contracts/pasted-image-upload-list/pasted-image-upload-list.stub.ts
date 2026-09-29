import { PastedImageUploadStub } from '@dungeonmaster/shared/contracts/pasted-image-upload/pasted-image-upload.stub';

import { pastedImageUploadListContract } from './pasted-image-upload-list-contract';
import type { PastedImageUploadList } from './pasted-image-upload-list-contract';

type PastedImageUpload = ReturnType<typeof PastedImageUploadStub>;

export const PastedImageUploadListStub = (
  { value }: { value: PastedImageUpload[] } = { value: [PastedImageUploadStub()] },
): PastedImageUploadList => pastedImageUploadListContract.parse(value);
