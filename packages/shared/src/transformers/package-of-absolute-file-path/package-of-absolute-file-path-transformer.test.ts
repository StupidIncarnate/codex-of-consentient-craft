import { packageOfAbsoluteFilePathTransformer } from './package-of-absolute-file-path-transformer';

describe('packageOfAbsoluteFilePathTransformer', () => {
  it('VALID: {file under packages/server/src} => returns server', () => {
    const result = packageOfAbsoluteFilePathTransformer({
      filePath: '/repo/packages/server/src/responders/x-responder.ts',
    });

    expect(result).toBe('server');
  });

  it('VALID: {file under packages/orchestrator/src/state} => returns orchestrator', () => {
    const result = packageOfAbsoluteFilePathTransformer({
      filePath: '/repo/packages/orchestrator/src/state/foo/foo-state.ts',
    });

    expect(result).toBe('orchestrator');
  });

  it('INVALID: {path outside packages/} => returns null', () => {
    const result = packageOfAbsoluteFilePathTransformer({
      filePath: '/some/other/path.ts',
    });

    expect(result).toBe(null);
  });
});
