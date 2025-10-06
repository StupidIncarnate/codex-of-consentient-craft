import { hasValidFileSuffixGuard } from './has-valid-file-suffix-guard';

describe('hasValidFileSuffixGuard', () => {
  describe('single suffix', () => {
    it('VALID: {filename: "user-fetch-broker.ts", fileSuffix: "-broker.ts"} => returns true', () => {
      expect(
        hasValidFileSuffixGuard({
          filename: 'user-fetch-broker.ts',
          fileSuffix: '-broker.ts',
        }),
      ).toBe(true);
    });

    it('VALID: {filename: "/path/to/user-contract.ts", fileSuffix: "-contract.ts"} => returns true', () => {
      expect(
        hasValidFileSuffixGuard({
          filename: '/path/to/user-contract.ts',
          fileSuffix: '-contract.ts',
        }),
      ).toBe(true);
    });

    it('INVALID: {filename: "user-fetch.ts", fileSuffix: "-broker.ts"} => returns false', () => {
      expect(
        hasValidFileSuffixGuard({
          filename: 'user-fetch.ts',
          fileSuffix: '-broker.ts',
        }),
      ).toBe(false);
    });

    it('INVALID: {filename: "user-broker-helper.ts", fileSuffix: "-broker.ts"} => returns false', () => {
      expect(
        hasValidFileSuffixGuard({
          filename: 'user-broker-helper.ts',
          fileSuffix: '-broker.ts',
        }),
      ).toBe(false);
    });
  });

  describe('multiple suffixes', () => {
    it('VALID: {filename: "button-widget.tsx", fileSuffix: ["-widget.tsx", "-widget.ts"]} => returns true', () => {
      expect(
        hasValidFileSuffixGuard({
          filename: 'button-widget.tsx',
          fileSuffix: ['-widget.tsx', '-widget.ts'],
        }),
      ).toBe(true);
    });

    it('VALID: {filename: "button-widget.ts", fileSuffix: ["-widget.tsx", "-widget.ts"]} => returns true', () => {
      expect(
        hasValidFileSuffixGuard({
          filename: 'button-widget.ts',
          fileSuffix: ['-widget.tsx', '-widget.ts'],
        }),
      ).toBe(true);
    });

    it('INVALID: {filename: "button.tsx", fileSuffix: ["-widget.tsx", "-widget.ts"]} => returns false', () => {
      expect(
        hasValidFileSuffixGuard({
          filename: 'button.tsx',
          fileSuffix: ['-widget.tsx', '-widget.ts'],
        }),
      ).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {filename: "", fileSuffix: "-broker.ts"} => returns false', () => {
      expect(
        hasValidFileSuffixGuard({
          filename: '',
          fileSuffix: '-broker.ts',
        }),
      ).toBe(false);
    });

    it('EDGE: {filename: "-broker.ts", fileSuffix: "-broker.ts"} => returns true', () => {
      expect(
        hasValidFileSuffixGuard({
          filename: '-broker.ts',
          fileSuffix: '-broker.ts',
        }),
      ).toBe(true);
    });
  });
});
