import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { checkFolderReturnTypeLayerBroker } from './check-folder-return-type-layer-broker';
import { checkFolderReturnTypeLayerBrokerProxy } from './check-folder-return-type-layer-broker.proxy';

describe('checkFolderReturnTypeLayerBroker', () => {
  describe('R1 — void is permitted exactly when every discarded call also told it nothing', () => {
    it('INVALID: void return discards a real value from a broker call => reports folderVoidReturn', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = (): void => { await otherBroker(); };';
      const callNode = CallExpressionStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: '/repo/packages/orchestrator/src/brokers/quest/x/quest-x-broker.ts',
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'folderVoidReturn',
        data: { folderType: 'brokers' },
      });
    });

    it('VALID: void return, discarded broker call also returns void => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = (): void => { doNothingBroker(); };';
      const callNode = CallExpressionStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: '/repo/packages/orchestrator/src/brokers/quest/y/quest-y-broker.ts',
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: void return with no discarded calls at all => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (): void => {  };' });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: Promise<void> return discards a real value from a gateway call => reports folderPromiseVoidReturn', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = (): Promise<void> => { await statIfExists(); };';
      const callNode = CallExpressionStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: '/repo/packages/@gateway/node/src/fs__promises/stat-if-exists/stat-if-exists.ts',
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'folderPromiseVoidReturn',
        data: { folderType: 'brokers' },
      });
    });

    it('VALID: Promise<void> return, discarded gateway call also returns void => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = (): Promise<void> => { await unlinkIfExists(); };';
      const callNode = CallExpressionStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: '/repo/packages/@gateway/node/src/fs__promises/unlink-if-exists/unlink-if-exists.ts',
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: single-value return type discards a real value => reports folderDisguisedVoidReturn', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = (): true => { otherBroker(); };';
      const callNode = CallExpressionStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: '/repo/packages/orchestrator/src/brokers/quest/z/quest-z-broker.ts',
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'folderDisguisedVoidReturn',
        data: { folderType: 'brokers' },
      });
    });

    it('VALID: single-value return type, discarded call also void-like => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = (): true => { doNothingBroker(); };';
      const callNode = CallExpressionStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: '/repo/packages/orchestrator/src/brokers/quest/w/quest-w-broker.ts',
      });
      proxy.setupCallReturnIsVoidLike({ callNode, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: void return, discarded call declared outside brokers/gateway => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = (): void => { formatQuestId(); };';
      const callNode = CallExpressionStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({
        callNode,
        declarationFile: '/repo/packages/orchestrator/src/transformers/quest-id/quest-id-transformer.ts',
      });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: void return, discarded call whose declaration file cannot be resolved => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const code = 'const f = (): void => { unresolvedCall(); };';
      const callNode = CallExpressionStub({ code });
      const node = ArrowFunctionExpressionStub({ code });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });
      proxy.setupCallDeclarationFile({ callNode, declarationFile: undefined });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: void return, discarded MemberExpression call (array.push) => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({
        code: 'const f = (): void => { items.push(); };',
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });

      // No setupCallDeclarationFile staged for this call — if the broker asked the adapter to
      // resolve a MemberExpression callee, the unaddressed mock call would throw unconditionally.
      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: proxy file returning void => does not report (R1 skipped for proxy files)', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (): void => {  };' });

      // No setupDeclaredReturn staged — if the broker called the adapter despite isProxyFile,
      // the unaddressed mock call would throw unconditionally.
      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
        isProxyFile: true,
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('guard-specific check', () => {
    it('VALID: guard returning boolean => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (): boolean => {};' });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'guards',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: guard returning type predicate => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({
        code: 'const f = (value: unknown): value is string => {};',
      });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'guards',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: guard returning string => reports guardMustReturnBoolean', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (): string => {};' });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'guards',
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'guardMustReturnBoolean',
      });
    });

    it('INVALID: guard returning void with no informative calls => reports guardMustReturnBoolean', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (): void => {  };' });

      proxy.setupDeclaredReturn({ node, isVoidLike: true });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'guards',
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'guardMustReturnBoolean',
      });
    });

    it('VALID: broker returning string (guard check does not apply) => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (): string => {};' });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('non-void return types (loose-return and passthrough)', () => {
    it('VALID: broker with non-void return type => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (): string => {};' });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: transformer returning branded type => does not report', () => {
      const proxy = checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (): ContentText => {};' });

      proxy.setupDeclaredReturn({ node, isVoidLike: false });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'transformers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('early returns', () => {
    it('VALID: no node => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });

      checkFolderReturnTypeLayerBroker({
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: no folderType (file outside function-exporting folders) => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = (): void => {};' });

      checkFolderReturnTypeLayerBroker({ node, ctx });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: no return type annotation => does not report', () => {
      checkFolderReturnTypeLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });

      checkFolderReturnTypeLayerBroker({
        node,
        ctx,
        folderType: 'brokers',
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });
});
