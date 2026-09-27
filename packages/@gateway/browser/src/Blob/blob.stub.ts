/**
 * PURPOSE: A real `Blob` instance, built through the real constructor — for a caller staging
 * `#gateway/browser/Blob`'s own value without hand-typing a fake one.
 *
 * USAGE:
 * const blob = BlobStub({ text: 'hello', type: 'text/plain' });
 */

export const BlobStub = ({
  text = 'hello',
  type = 'text/plain',
}: { text?: string; type?: string } = {}): Blob => new Blob([text], { type });
