import { expectedExportNameTransformer } from './expected-export-name-transformer';

describe('expectedExportNameTransformer', () => {
  describe('camelCase exports', () => {
    it('VALID: broker file => returns camelCase with Broker suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
          fileSuffix: '-broker.ts',
          exportSuffix: 'Broker',
          exportCase: 'camelCase',
        }),
      ).toBe('userFetchBroker');
    });

    it('VALID: contract file => returns camelCase with Contract suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/contracts/user/user-contract.ts',
          fileSuffix: '-contract.ts',
          exportSuffix: 'Contract',
          exportCase: 'camelCase',
        }),
      ).toBe('userContract');
    });

    it('VALID: transformer file => returns camelCase with Transformer suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/transformers/format-date/format-date-transformer.ts',
          fileSuffix: '-transformer.ts',
          exportSuffix: 'Transformer',
          exportCase: 'camelCase',
        }),
      ).toBe('formatDateTransformer');
    });

    it('VALID: guard file => returns camelCase with Guard suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/guards/has-permission/has-permission-guard.ts',
          fileSuffix: '-guard.ts',
          exportSuffix: 'Guard',
          exportCase: 'camelCase',
        }),
      ).toBe('hasPermissionGuard');
    });

    it('VALID: statics file => returns camelCase with Statics suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/statics/user/user-statics.ts',
          fileSuffix: '-statics.ts',
          exportSuffix: 'Statics',
          exportCase: 'camelCase',
        }),
      ).toBe('userStatics');
    });
  });

  describe('PascalCase exports', () => {
    it('VALID: widget file => returns PascalCase with Widget suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/widgets/button/button-widget.tsx',
          fileSuffix: ['-widget.tsx', '-widget.ts'],
          exportSuffix: 'Widget',
          exportCase: 'PascalCase',
        }),
      ).toBe('ButtonWidget');
    });

    it('VALID: responder file => returns PascalCase with Responder suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/responders/user/login/user-login-responder.ts',
          fileSuffix: '-responder.ts',
          exportSuffix: 'Responder',
          exportCase: 'PascalCase',
        }),
      ).toBe('UserLoginResponder');
    });

    it('VALID: error file => returns PascalCase with Error suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/errors/validation/validation-error.ts',
          fileSuffix: '-error.ts',
          exportSuffix: 'Error',
          exportCase: 'PascalCase',
        }),
      ).toBe('ValidationError');
    });

    it('VALID: flow file => returns PascalCase with Flow suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/flows/login/login-flow.tsx',
          fileSuffix: ['-flow.tsx', '-flow.ts'],
          exportSuffix: 'Flow',
          exportCase: 'PascalCase',
        }),
      ).toBe('LoginFlow');
    });
  });

  describe('multiple file suffixes', () => {
    it('VALID: matches first suffix in array', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/widgets/button/button-widget.tsx',
          fileSuffix: ['-widget.tsx', '-widget.ts'],
          exportSuffix: 'Widget',
          exportCase: 'PascalCase',
        }),
      ).toBe('ButtonWidget');
    });

    it('VALID: matches second suffix in array', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/widgets/button/button-widget.ts',
          fileSuffix: ['-widget.tsx', '-widget.ts'],
          exportSuffix: 'Widget',
          exportCase: 'PascalCase',
        }),
      ).toBe('ButtonWidget');
    });
  });

  describe('edge cases', () => {
    it('EDGE: single word basename => returns with suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/contracts/user/user-contract.ts',
          fileSuffix: '-contract.ts',
          exportSuffix: 'Contract',
          exportCase: 'camelCase',
        }),
      ).toBe('userContract');
    });

    it('EDGE: multi-word basename => returns camelCase with suffix', () => {
      expect(
        expectedExportNameTransformer({
          filename: '/project/src/brokers/user/fetch-all/user-fetch-all-broker.ts',
          fileSuffix: '-broker.ts',
          exportSuffix: 'Broker',
          exportCase: 'camelCase',
        }),
      ).toBe('userFetchAllBroker');
    });
  });
});
