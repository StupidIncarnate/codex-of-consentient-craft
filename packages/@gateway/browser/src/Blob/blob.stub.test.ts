import { BlobStub } from './blob.stub';

describe('BlobStub', () => {
  it('VALID: {} => a real Blob with the default text encoded and the default type', () => {
    const blob = BlobStub();

    expect({ isBlob: blob instanceof Blob, type: blob.type, size: blob.size }).toStrictEqual({
      isBlob: true,
      type: 'text/plain',
      size: 5,
    });
  });

  it('VALID: {text, type} => a real Blob sized for the given content and carrying the given type', () => {
    const blob = BlobStub({ text: 'a longer sample', type: 'application/json' });

    expect({ type: blob.type, size: blob.size }).toStrictEqual({
      type: 'application/json',
      size: 15,
    });
  });
});
