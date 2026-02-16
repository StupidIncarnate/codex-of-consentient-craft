import { FolderConfigStub } from '@dungeonmaster/shared/contracts';
import { firstFileSuffixTransformer } from './first-file-suffix-transformer';

describe('firstFileSuffixTransformer', () => {
  describe('single suffix', () => {
    it('VALID: {config: {fileSuffix: -broker.ts}} => returns -broker.ts', () => {
      const result = firstFileSuffixTransformer({
        config: FolderConfigStub({ fileSuffix: '-broker.ts' }),
      });

      expect(result).toBe('-broker.ts');
    });

    it('VALID: {config: {fileSuffix: -guard.ts}} => returns -guard.ts', () => {
      const result = firstFileSuffixTransformer({
        config: FolderConfigStub({ fileSuffix: '-guard.ts' }),
      });

      expect(result).toBe('-guard.ts');
    });
  });

  describe('multiple suffixes', () => {
    it('VALID: {config: {fileSuffix: [-contract.ts, .stub.ts]}} => returns -contract.ts', () => {
      const result = firstFileSuffixTransformer({
        config: FolderConfigStub({ fileSuffix: ['-contract.ts', '.stub.ts'] }),
      });

      expect(result).toBe('-contract.ts');
    });

    it('VALID: {config: {fileSuffix: [-flow.ts, -flow.tsx]}} => returns -flow.ts', () => {
      const result = firstFileSuffixTransformer({
        config: FolderConfigStub({ fileSuffix: ['-flow.ts', '-flow.tsx'] }),
      });

      expect(result).toBe('-flow.ts');
    });
  });
});
