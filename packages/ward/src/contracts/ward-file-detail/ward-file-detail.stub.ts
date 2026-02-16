import { wardFileDetailContract, type WardFileDetail } from './ward-file-detail-contract';

export const WardFileDetailStub = ({ value }: { value?: string } = {}): WardFileDetail =>
  wardFileDetailContract.parse(
    value ?? 'src/index.ts\n  lint  no-unused-vars (line 10)\n    Unexpected any',
  );
