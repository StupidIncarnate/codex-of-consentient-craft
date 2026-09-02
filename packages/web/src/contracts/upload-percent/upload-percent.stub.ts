import { uploadPercentContract } from './upload-percent-contract';
import type { UploadPercent } from './upload-percent-contract';

export const UploadPercentStub = ({ value }: { value?: number } = {}): UploadPercent =>
  uploadPercentContract.parse(value ?? 42);
