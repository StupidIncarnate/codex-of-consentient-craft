import type { StubArgument } from '@dungeonmaster/shared/@types';

import { imageSizeContract } from './image-size-contract';
import type { ImageSize } from './image-size-contract';

export const ImageSizeStub = ({ ...props }: StubArgument<ImageSize> = {}): ImageSize =>
  imageSizeContract.parse({
    widthPx: 2000,
    heightPx: 1333,
    ...props,
  });
