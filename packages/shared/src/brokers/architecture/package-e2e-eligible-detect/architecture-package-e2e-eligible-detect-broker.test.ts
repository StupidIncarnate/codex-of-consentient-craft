import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { architecturePackageE2eEligibleDetectBrokerProxy } from './architecture-package-e2e-eligible-detect-broker.proxy';
import { architecturePackageE2eEligibleDetectBroker } from './architecture-package-e2e-eligible-detect-broker';

describe('architecturePackageE2eEligibleDetectBroker', () => {
  describe('own signals', () => {
    it('VALID: {widgets/ + react in dependencies} => returns true', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['widgets', 'bindings'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {widgets/ + adapters/ink} => returns true', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['ink'],
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(true);
    });

    it('INVALID: {no widgets folder} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['brokers', 'contracts'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {widgets folder, no react or ink} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['fetch'],
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });

    it('EMPTY: {no src directory, no dependencies} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({ packageRoot: '/repo/packages/pkg' });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('two e2e-eligible packages, resolved independently', () => {
    it('VALID: {frontend-react at packages/web, frontend-ink at packages/tui} => both resolve true on their own signals', async () => {
      const webProxy = architecturePackageE2eEligibleDetectBrokerProxy();
      webProxy.setupPackage({
        packageRoot: '/repo/packages/web',
        srcDirNames: ['widgets', 'bindings'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const webResult = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      const tuiProxy = architecturePackageE2eEligibleDetectBrokerProxy();
      tuiProxy.setupPackage({
        packageRoot: '/repo/packages/tui',
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['ink'],
      });

      const tuiResult = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/tui' }),
      });

      expect(webResult).toBe(true);
      expect(tuiResult).toBe(true);
    });
  });

  // Every fixture below reproduces the disk signals detect-package-type-layer-broker.test.ts uses
  // for that same package type (packages/shared/src/brokers/architecture/package-type-detect/) —
  // proving eligibility resolves correctly against the exact shapes the live detector classifies,
  // for every one of its 9 types, not just the two that should read eligible.
  describe('eligibility across every detector-classified package shape', () => {
    it('VALID: {mirrors http-backend: adapters/hono} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        adapterDirNames: ['hono', 'fs'],
        srcDirNames: ['adapters', 'flows', 'responders'],
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {mirrors mcp-server: adapters/@modelcontextprotocol} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        adapterDirNames: ['@modelcontextprotocol'],
        srcDirNames: ['adapters'],
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {mirrors frontend-ink: widgets/ + adapters/ink} => returns true', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['ink', 'fs'],
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {mirrors frontend-react: widgets/ + react in dependencies} => returns true', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['widgets', 'bindings'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {mirrors hook-handlers: responders/hook, no widgets} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['responders', 'startup'],
        packageJsonContent: JSON.stringify({
          bin: { 'dm-pre': './dist/pre.js', 'dm-post': './dist/post.js' },
        }),
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {mirrors eslint-plugin: brokers/rule + responders/rule, no widgets} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['brokers', 'responders'],
        packageJsonContent: JSON.stringify({ exports: { '.': './dist/index.js' } }),
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {mirrors cli-tool: startup/, no widgets} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['startup'],
        packageJsonContent: JSON.stringify({ bin: { mycli: './dist/bin.js' } }),
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {mirrors programmatic-service: flows + responders + state, no widgets} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['flows', 'responders', 'state', 'startup'],
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {mirrors library: no matching signals} => returns false', async () => {
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['contracts', 'guards', 'transformers'],
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {mirrors the priority-ordering trap: widgets + hono adapter + react} => returns true even though the detector would classify http-backend', async () => {
      // detect-package-type-layer-broker.test.ts's own 'priority ordering' case: rule 1
      // (hono/express) returns before rule 4 (widgets+react) is reached, so
      // detectPackageTypeLayerBroker classifies this exact shape 'http-backend'. This broker does
      // not consult that label, so the widgets+react signal still resolves eligible.
      const proxy = architecturePackageE2eEligibleDetectBrokerProxy();
      proxy.setupPackage({
        packageRoot: '/repo/packages/pkg',
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['hono'],
        packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
      });

      const result = await architecturePackageE2eEligibleDetectBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/pkg' }),
      });

      expect(result).toBe(true);
    });
  });
});
