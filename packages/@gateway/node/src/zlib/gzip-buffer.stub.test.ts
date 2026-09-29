import { GzipBufferStub } from './gzip-buffer.stub';
import { gunzipSync } from './zlib';

describe('GzipBufferStub', () => {
  it('VALID: {text: "hello"} => gunzips back to "hello"', () => {
    expect(gunzipSync(GzipBufferStub({ text: 'hello' })).toString('utf8')).toBe('hello');
  });

  it('VALID: {} => starts with the gzip magic bytes and gunzips to the default text', () => {
    const gzipped = GzipBufferStub();

    expect([gzipped[0], gzipped[1]]).toStrictEqual([0x1f, 0x8b]);
    expect(gunzipSync(gzipped).toString('utf8')).toBe('gzip-stub-content');
  });
});
