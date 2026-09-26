/**
 * PURPOSE: OUR guarded PNG decode, promoting the try/catch-with-cause shape every existing
 * `pngjsDecodeAdapter` already carried. A new name, not `PNG`'s own `sync.read`, because the shape
 * changes: a plain `Buffer` in, a plain `{width, height, pixels}` out, with pngjs's own thrown
 * error wrapped so a caller sees which operation failed alongside the decoder's own message.
 *
 * USAGE:
 * decodePng({ bytes: pngBuffer });
 * // Returns { width, height, pixels: Uint8Array }
 */
import { PNG } from 'pngjs';

export const decodePng = ({
  bytes,
}: {
  bytes: Buffer;
}): { width: number; height: number; pixels: Uint8Array } => {
  try {
    const decoded = PNG.sync.read(bytes);

    return {
      width: decoded.width,
      height: decoded.height,
      // Copied rather than passed through: `decoded.data` is a Buffer (a Uint8Array subclass)
      // that may share pngjs's own pooled ArrayBuffer.
      pixels: new Uint8Array(decoded.data),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to decode PNG bytes: ${reason}`, { cause: error });
  }
};
