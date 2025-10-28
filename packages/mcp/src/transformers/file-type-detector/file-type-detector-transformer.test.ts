import { fileTypeDetectorTransformer } from './file-type-detector-transformer';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';

describe('fileTypeDetectorTransformer', () => {
  it('VALID: {broker filepath} => returns "broker"', () => {
    const result = fileTypeDetectorTransformer({
      filepath: FilePathStub({
        value: '/packages/eslint-plugin/src/brokers/user/fetch/user-fetch-broker.ts',
      }),
    });

    expect(result).toBe('broker');
  });

  it('VALID: {widget filepath} => returns "widget"', () => {
    const result = fileTypeDetectorTransformer({
      filepath: FilePathStub({ value: '/packages/app/src/widgets/user-card/user-card-widget.tsx' }),
    });

    expect(result).toBe('widget');
  });

  it('VALID: {guard filepath} => returns "guard"', () => {
    const result = fileTypeDetectorTransformer({
      filepath: FilePathStub({
        value: '/packages/eslint-plugin/src/guards/is-test-file/is-test-file-guard.ts',
      }),
    });

    expect(result).toBe('guard');
  });

  it('EDGE: {filepath with -file suffix} => extracts type from suffix', () => {
    const result = fileTypeDetectorTransformer({
      filepath: FilePathStub({ value: '/packages/something/random-file.ts' }),
    });

    expect(result).toBe('file');
  });

  it('EDGE: {filepath with no src/ and no suffix} => returns "unknown"', () => {
    const result = fileTypeDetectorTransformer({
      filepath: FilePathStub({ value: '/packages/something/randomfile.ts' }),
    });

    expect(result).toBe('unknown');
  });
});
