import { imageDataUrlContract } from './image-data-url-contract';
import type { ImageDataUrl } from './image-data-url-contract';

export const ImageDataUrlStub = ({ value }: { value?: string } = {}): ImageDataUrl =>
  imageDataUrlContract.parse(value ?? 'data:image/png;base64,iVBORw0KGgo=');
