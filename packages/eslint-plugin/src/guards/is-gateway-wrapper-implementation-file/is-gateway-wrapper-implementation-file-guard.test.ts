import { isGatewayWrapperImplementationFileGuard } from './is-gateway-wrapper-implementation-file-guard';

describe('isGatewayWrapperImplementationFileGuard', () => {
  it('VALID: {fileName: a single-dot .ts file} => returns true', () => {
    const result = isGatewayWrapperImplementationFileGuard({ fileName: 'read-file-sync.ts' });

    expect(result).toBe(true);
  });

  it('VALID: {fileName: an .error.ts companion} => returns true', () => {
    const result = isGatewayWrapperImplementationFileGuard({
      fileName: 'git-not-installed.error.ts',
    });

    expect(result).toBe(true);
  });

  it('INVALID: {fileName: a .test.ts companion} => returns false', () => {
    const result = isGatewayWrapperImplementationFileGuard({
      fileName: 'read-file-sync.test.ts',
    });

    expect(result).toBe(false);
  });

  it('INVALID: {fileName: a .proxy.ts companion} => returns false', () => {
    const result = isGatewayWrapperImplementationFileGuard({
      fileName: 'read-file-sync.proxy.ts',
    });

    expect(result).toBe(false);
  });

  it('INVALID: {fileName: a .stub.ts companion} => returns false', () => {
    const result = isGatewayWrapperImplementationFileGuard({ fileName: 'fs-error.stub.ts' });

    expect(result).toBe(false);
  });

  it('INVALID: {fileName: an .integration.test.ts companion} => returns false', () => {
    const result = isGatewayWrapperImplementationFileGuard({
      fileName: 'run.integration.test.ts',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {fileName: undefined} => returns false', () => {
    const result = isGatewayWrapperImplementationFileGuard({});

    expect(result).toBe(false);
  });
});
