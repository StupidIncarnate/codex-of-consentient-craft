import { webBundleContentTypeTransformer } from './web-bundle-content-type-transformer';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';

describe('webBundleContentTypeTransformer', () => {
  it('VALID: {filePath: "/index.html"} => text/html', () => {
    expect(
      webBundleContentTypeTransformer({ filePath: FilePathStub({ value: '/index.html' }) }),
    ).toBe('text/html; charset=utf-8');
  });

  it('VALID: {filePath: "/assets/index-abc.js"} => text/javascript', () => {
    expect(
      webBundleContentTypeTransformer({
        filePath: FilePathStub({ value: '/assets/index-abc.js' }),
      }),
    ).toBe('text/javascript; charset=utf-8');
  });

  it('VALID: {filePath: "/assets/index-abc.css"} => text/css', () => {
    expect(
      webBundleContentTypeTransformer({
        filePath: FilePathStub({ value: '/assets/index-abc.css' }),
      }),
    ).toBe('text/css; charset=utf-8');
  });

  it('VALID: {filePath: "/favicon.svg"} => image/svg+xml', () => {
    expect(
      webBundleContentTypeTransformer({ filePath: FilePathStub({ value: '/favicon.svg' }) }),
    ).toBe('image/svg+xml');
  });

  it('EDGE: {filePath: "/codex/quest/abc-123" no extension} => octet-stream fallback', () => {
    expect(
      webBundleContentTypeTransformer({
        filePath: FilePathStub({ value: '/codex/quest/abc-123' }),
      }),
    ).toBe('application/octet-stream');
  });

  it('EDGE: {filePath: "/unknown.xyz"} => octet-stream fallback', () => {
    expect(
      webBundleContentTypeTransformer({ filePath: FilePathStub({ value: '/unknown.xyz' }) }),
    ).toBe('application/octet-stream');
  });
});
