/// <reference lib="dom" />
/**
 * PURPOSE: A real `File` instance built through the environment's own constructor or factory —
 * for a caller staging `#gateway/browser/File`'s value without hand-typing a fake one.
 *
 * USAGE:
 * const value = FileStub();
 */
import { File } from './File';

export const FileStub = ({
  text = 'hello',
  name = 'pasted-image',
  type = 'image/png',
}: { text?: string; name?: string; type?: string } = {}): File => new File([text], name, { type });
