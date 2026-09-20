import { servedImageContentContract } from './served-image-content-contract';
import type { ServedImageContent } from './served-image-content-contract';

export const ServedImageContentStub = (
  { value }: { value: string } = {
    value: 'Look at ![Pasted Image 1](/api/images?path=%2Fq%2Fimages%2Fa.png)',
  },
): ServedImageContent => servedImageContentContract.parse(value);
