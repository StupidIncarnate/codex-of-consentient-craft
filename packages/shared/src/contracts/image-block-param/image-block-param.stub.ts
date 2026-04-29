import type { StubArgument } from '@dungeonmaster/shared/@types';

import { imageBlockParamContract } from './image-block-param-contract';
import type { ImageBlockParam } from './image-block-param-contract';

/**
 * Base64-encoded image block — Claude CLI emits this when the assistant references
 * an image it was given as a base64-encoded data blob.
 */
export const Base64ImageBlockParamStub = ({
  ...props
}: StubArgument<ImageBlockParam> = {}): ImageBlockParam =>
  imageBlockParamContract.parse({
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/png',
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    ...props,
  });

/**
 * URL-referenced image block — Claude CLI emits this when the assistant references
 * an image via a remote URL rather than inline data.
 */
export const UrlImageBlockParamStub = ({
  ...props
}: StubArgument<ImageBlockParam> = {}): ImageBlockParam =>
  imageBlockParamContract.parse({
    type: 'image',
    source: {
      type: 'url',
      url: 'https://example.com/screenshot.png',
    },
    ...props,
  });
