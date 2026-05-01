import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineHookHandlersStatics } from '../../../statics/project-map-headline-hook-handlers/project-map-headline-hook-handlers-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/hooks' });

const PRE_EDIT_STARTUP_SOURCE = ContentTextStub({
  value: [
    `import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`,
    `StartPreEditHook({ inputData });`,
  ].join('\n'),
});

const PRE_EDIT_FLOW_SOURCE = ContentTextStub({
  value: [
    `import { HookPreEditResponder } from '../../responders/hook/pre-edit/hook-pre-edit-responder';`,
    `export const HookPreEditFlow = async ({ inputData }) => HookPreEditResponder({ input: parsed });`,
  ].join('\n'),
});

describe('exemplarSectionRenderLayerBroker', () => {
  describe('exemplar header', () => {
    it('VALID: {bin name} => section header contains bin name', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        binName: ContentTextStub({ value: 'dungeonmaster-pre-edit-lint' }),
        startupSource: PRE_EDIT_STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const headerLine = `${projectMapHeadlineHookHandlersStatics.exemplarSectionPrefix}dungeonmaster-pre-edit-lint${projectMapHeadlineHookHandlersStatics.exemplarSectionSuffix}`;

      expect(lines[0]).toBe(headerLine);
    });
  });

  describe('call trace section', () => {
    it('VALID: {any startup} => call trace header present', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        binName: ContentTextStub({ value: 'dungeonmaster-pre-edit-lint' }),
        startupSource: PRE_EDIT_STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineHookHandlersStatics.exemplarRequestChainHeader),
      ).toBe(true);
    });

    it('VALID: {startup with flow import} => flow name appears in trace', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => PRE_EDIT_FLOW_SOURCE });

      const result = exemplarSectionRenderLayerBroker({
        binName: ContentTextStub({ value: 'dungeonmaster-pre-edit-lint' }),
        startupSource: PRE_EDIT_STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('hook-pre-edit-flow'))).toBe(true);
    });

    it('VALID: {flow has responder import} => responder name appears in trace', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupImplementation({ fn: () => PRE_EDIT_FLOW_SOURCE });

      const result = exemplarSectionRenderLayerBroker({
        binName: ContentTextStub({ value: 'dungeonmaster-pre-edit-lint' }),
        startupSource: PRE_EDIT_STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('hook-pre-edit-responder'))).toBe(true);
    });

    it('VALID: {any trace} => exit code line present', () => {
      const proxy = exemplarSectionRenderLayerBrokerProxy();
      proxy.setupMissing();

      const result = exemplarSectionRenderLayerBroker({
        binName: ContentTextStub({ value: 'dungeonmaster-pre-edit-lint' }),
        startupSource: PRE_EDIT_STARTUP_SOURCE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l.includes('exit'))).toBe(true);
    });
  });
});
