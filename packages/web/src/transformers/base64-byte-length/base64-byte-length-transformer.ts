/**
 * PURPOSE: The downscale ladder has to know whether a re-encoded image has landed under
 * pastedImageStatics.maxBytesPerImage BEFORE it builds a request the server would reject, so the
 * browser carries its own copy of this arithmetic rather than paying a round trip to find out.
 *
 * USAGE:
 * base64ByteLengthTransformer({ dataBase64: 'YWJjZA==' });
 * // Returns: 4
 */

import { byteLengthContract } from '../../contracts/byte-length/byte-length-contract';
import type { ByteLength } from '../../contracts/byte-length/byte-length-contract';

// This math must match the `.refine` in
// packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.ts digit for
// digit — that file does not export the schema holding it, so this is a second implementation
// rather than an import.
const BASE64_BYTES_PER_GROUP = 3;
const BASE64_CHARS_PER_GROUP = 4;

export const base64ByteLengthTransformer = ({ dataBase64 }: { dataBase64: string }): ByteLength =>
  byteLengthContract.parse(
    Math.floor(
      (dataBase64.replace(/[=]+$/u, '').length * BASE64_BYTES_PER_GROUP) / BASE64_CHARS_PER_GROUP,
    ),
  );
