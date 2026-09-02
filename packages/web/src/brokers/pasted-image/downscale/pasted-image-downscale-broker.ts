/**
 * PURPOSE: The Anthropic API enforces `pastedImageStatics.maxBytesPerImage` per image, so a paste
 * over that ceiling fails on send however it is carried — reducing it here, before the byte total
 * ever leaves the browser, is what lets a big screenshot succeed instead of bouncing off the server
 * with no local signal. Every redraw decodes the ORIGINAL pasted bytes rather than the previous
 * attempt's output, so repeated halving never compounds JPEG artifacts on top of JPEG artifacts.
 * The one real cost: an animated GIF that needs reducing loses its animation, because the canvas
 * re-encode this broker relies on only ever paints a single frame.
 *
 * USAGE:
 * const attachment = await pastedImageDownscaleBroker({ attachmentId, dataUrl, mediaType });
 * // Returns: ComposerAttachment, unchanged if dataUrl already fits under the byte ceiling
 */

import { pastedImageMediaTypeContract } from '@dungeonmaster/shared/contracts';
import type { PastedImageMediaType } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { canvasImageMeasureAdapter } from '../../../adapters/canvas/image-measure/canvas-image-measure-adapter';
import { canvasImageRescaleAdapter } from '../../../adapters/canvas/image-rescale/canvas-image-rescale-adapter';
import type { AttachmentId } from '../../../contracts/attachment-id/attachment-id-contract';
import { composerAttachmentContract } from '../../../contracts/composer-attachment/composer-attachment-contract';
import type { ComposerAttachment } from '../../../contracts/composer-attachment/composer-attachment-contract';
import type { ImageDataUrl } from '../../../contracts/image-data-url/image-data-url-contract';
import type { ImageSize } from '../../../contracts/image-size/image-size-contract';
import { base64ByteLengthTransformer } from '../../../transformers/base64-byte-length/base64-byte-length-transformer';
import { downscaleTargetTransformer } from '../../../transformers/downscale-target/downscale-target-transformer';

// canvas.toDataURL ignores its quality argument entirely for image/png (lossless), but the adapter's
// signature always requires a number regardless of media type — this is that placeholder, not a
// size or quality threshold.
const PNG_ENCODE_QUALITY = 1;

// The halving ladder's own factor (step 3): "halve the longest edge and retry" — not itself one of
// pastedImageStatics' thresholds, just the arithmetic that walks toward them.
const HALVING_DIVISOR = 2;

const PNG_MEDIA_TYPE = pastedImageMediaTypeContract.parse('image/png');
const JPEG_MEDIA_TYPE = pastedImageMediaTypeContract.parse('image/jpeg');

// dataUrlSplitTransformer re-validates through pastedImageUploadContract, which itself refuses a
// payload over the byte ceiling — exactly the candidates this ladder has to be ABLE to inspect
// mid-attempt. So byte-length checking reads the base64 payload the same way the two canvas
// adapters already do (their own BASE64_MARKER slice), never through that validating transformer.
const BASE64_MARKER = ';base64,';

export const pastedImageDownscaleBroker = async ({
  attachmentId,
  dataUrl,
  mediaType,
  retry,
}: {
  attachmentId: AttachmentId;
  dataUrl: ImageDataUrl;
  mediaType: PastedImageMediaType;
  // Internal recursion state for the halving ladder (step 3+): the ORIGINAL measured size (so a
  // retry never re-measures) and the longest edge the next jpeg attempt targets. External callers
  // never pass this — the ladder starts fresh every time from a bare {attachmentId, dataUrl, mediaType}.
  retry?: { originalSize: ImageSize; longestEdgePx: number };
}): Promise<ComposerAttachment> => {
  if (retry) {
    const target = downscaleTargetTransformer({
      size: retry.originalSize,
      longestEdgePx: retry.longestEdgePx,
    });
    const jpegDataUrl = await canvasImageRescaleAdapter({
      dataUrl,
      size: target,
      mediaType: JPEG_MEDIA_TYPE,
      quality: pastedImageStatics.jpegQuality,
    });
    const jpegDataBase64 = jpegDataUrl.slice(
      jpegDataUrl.indexOf(BASE64_MARKER) + BASE64_MARKER.length,
    );
    const jpegByteLength = base64ByteLengthTransformer({ dataBase64: jpegDataBase64 });

    if (jpegByteLength <= pastedImageStatics.maxBytesPerImage) {
      return composerAttachmentContract.parse({
        attachmentId,
        mediaType: JPEG_MEDIA_TYPE,
        dataUrl: jpegDataUrl,
        byteLength: jpegByteLength,
        widthPx: target.widthPx,
        heightPx: target.heightPx,
      });
    }

    if (retry.longestEdgePx <= pastedImageStatics.minLongestEdgePx) {
      throw new Error(
        `pastedImageDownscaleBroker: image still exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes at the minimum longest edge of ${String(pastedImageStatics.minLongestEdgePx)}px`,
      );
    }

    const nextLongestEdgePx = Math.max(
      pastedImageStatics.minLongestEdgePx,
      Math.floor(retry.longestEdgePx / HALVING_DIVISOR),
    );

    return pastedImageDownscaleBroker({
      attachmentId,
      dataUrl,
      mediaType,
      retry: { originalSize: retry.originalSize, longestEdgePx: nextLongestEdgePx },
    });
  }

  const originalSize = await canvasImageMeasureAdapter({ dataUrl });
  const originalDataBase64 = dataUrl.slice(dataUrl.indexOf(BASE64_MARKER) + BASE64_MARKER.length);
  const originalByteLength = base64ByteLengthTransformer({ dataBase64: originalDataBase64 });

  if (originalByteLength <= pastedImageStatics.maxBytesPerImage) {
    return composerAttachmentContract.parse({
      attachmentId,
      mediaType,
      dataUrl,
      byteLength: originalByteLength,
      widthPx: originalSize.widthPx,
      heightPx: originalSize.heightPx,
    });
  }

  const target = downscaleTargetTransformer({
    size: originalSize,
    longestEdgePx: pastedImageStatics.maxLongestEdgePx,
  });
  const pngDataUrl = await canvasImageRescaleAdapter({
    dataUrl,
    size: target,
    mediaType: PNG_MEDIA_TYPE,
    quality: PNG_ENCODE_QUALITY,
  });
  const pngDataBase64 = pngDataUrl.slice(pngDataUrl.indexOf(BASE64_MARKER) + BASE64_MARKER.length);
  const pngByteLength = base64ByteLengthTransformer({ dataBase64: pngDataBase64 });

  if (pngByteLength <= pastedImageStatics.maxBytesPerImage) {
    return composerAttachmentContract.parse({
      attachmentId,
      mediaType: PNG_MEDIA_TYPE,
      dataUrl: pngDataUrl,
      byteLength: pngByteLength,
      widthPx: target.widthPx,
      heightPx: target.heightPx,
    });
  }

  return pastedImageDownscaleBroker({
    attachmentId,
    dataUrl,
    mediaType,
    retry: { originalSize, longestEdgePx: pastedImageStatics.maxLongestEdgePx },
  });
};
