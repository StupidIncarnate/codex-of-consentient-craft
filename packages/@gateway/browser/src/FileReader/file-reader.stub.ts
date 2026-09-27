/**
 * PURPOSE: A real `FileReader` instance, built through the real constructor — for a caller staging
 * `#gateway/browser/FileReader`'s own value without hand-typing a fake one.
 *
 * USAGE:
 * const reader = FileReaderStub();
 * reader.readAsText(BlobStub());
 */

export const FileReaderStub = (): FileReader => new FileReader();
