import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { listRuleFilesLayerBrokerProxy } from './list-rule-files-layer-broker.proxy';
import { rulesSectionRenderLayerBrokerProxy } from './rules-section-render-layer-broker.proxy';
import { configPresetsSectionRenderLayerBrokerProxy } from './config-presets-section-render-layer-broker.proxy';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';

export const architectureProjectMapHeadlineEslintPluginBrokerProxy = (): {
  setup: ({
    ruleDomainNames,
    startupSource,
    ruleSourceMap,
  }: {
    ruleDomainNames: ContentText[];
    startupSource: ContentText | undefined;
    ruleSourceMap: Map<AbsoluteFilePath, ContentText>;
  }) => void;
} => {
  const listProxy = listRuleFilesLayerBrokerProxy();
  rulesSectionRenderLayerBrokerProxy();
  configPresetsSectionRenderLayerBrokerProxy();
  const exemplarProxy = exemplarSectionRenderLayerBrokerProxy();
  const readProxy = readSourceLayerBrokerProxy();

  return {
    setup: ({
      ruleDomainNames,
      startupSource,
      ruleSourceMap,
    }: {
      ruleDomainNames: ContentText[];
      startupSource: ContentText | undefined;
      ruleSourceMap: Map<AbsoluteFilePath, ContentText>;
    }): void => {
      // Wire the readdir mock to return rule domain directories and their broker files
      listProxy.setupRuleDomains({
        domainNames: ruleDomainNames.map(String),
      });

      // Wire readFileSync for startup file and rule source files.
      // Both readSourceLayerBroker (called by main broker for startup) and
      // exemplarSectionRenderLayerBroker (via readSourceLayerBroker) share this mock
      // via stack-based dispatch.
      const unifiedRead = (filePath: ContentText): ContentText => {
        const filePathStr = String(filePath);

        if (filePathStr.endsWith('start-eslint-plugin.ts')) {
          return startupSource ?? ContentTextStub({ value: '' });
        }

        for (const [key, source] of ruleSourceMap) {
          if (String(key) === filePathStr) {
            return source;
          }
        }

        return ContentTextStub({ value: '' });
      };

      readProxy.setupImplementation({ fn: unifiedRead });
      exemplarProxy.setupImplementation({ fn: unifiedRead });
    },
  };
};
