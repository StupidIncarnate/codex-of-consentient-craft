import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { packageOfAbsoluteFilePathTransformer } from './package-of-absolute-file-path-transformer';

describe('packageOfAbsoluteFilePathTransformer', () => {
  it('VALID: {file under packages/server/src} => returns server', () => {
    const result = packageOfAbsoluteFilePathTransformer({
      filePath: AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/x-responder.ts',
      }),
    });

    expect(result).toBe(ContentTextStub({ value: 'server' }));
  });

  it('VALID: {file under packages/orchestrator/src/state} => returns orchestrator', () => {
    const result = packageOfAbsoluteFilePathTransformer({
      filePath: AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/state/foo/foo-state.ts',
      }),
    });

    expect(result).toBe(ContentTextStub({ value: 'orchestrator' }));
  });

  it('INVALID: {path outside packages/} => returns null', () => {
    const result = packageOfAbsoluteFilePathTransformer({
      filePath: AbsoluteFilePathStub({ value: '/some/other/path.ts' }),
    });

    expect(result).toBe(null);
  });
});
