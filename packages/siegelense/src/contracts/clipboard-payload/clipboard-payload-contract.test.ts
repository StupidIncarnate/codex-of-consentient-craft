import { clipboardPayloadContract } from './clipboard-payload-contract';
import { ClipboardPayloadStub } from './clipboard-payload.stub';

describe('clipboardPayloadContract', () => {
  it('VALID: {defaults} => parses a text payload', () => {
    expect(ClipboardPayloadStub()).toStrictEqual({ kind: 'text', text: 'pasted text' });
  });

  it('VALID: {kind: "file"} => parses a file payload with its mime type', () => {
    expect(
      clipboardPayloadContract.parse({ kind: 'file', base64: 'iVBORw==', mimeType: 'image/png' }),
    ).toStrictEqual({ kind: 'file', base64: 'iVBORw==', mimeType: 'image/png' });
  });

  it('INVALID: {kind: "file", mimeType: ""} => throws, because a blob needs a type', () => {
    expect(() =>
      clipboardPayloadContract.parse({ kind: 'file', base64: 'iVBORw==', mimeType: '' }),
    ).toThrow(/Too small/u);
  });

  it('INVALID: {kind: "image"} => throws for a kind that is neither text nor file', () => {
    expect(() => clipboardPayloadContract.parse({ kind: 'image', text: 'x' })).toThrow(
      /Invalid discriminator value/u,
    );
  });
});
