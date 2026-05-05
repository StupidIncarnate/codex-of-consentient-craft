import { architectureBindingFlowTraceBrokerProxy } from '../binding-flow-trace/architecture-binding-flow-trace-broker.proxy';
import { architectureExportNameResolveBrokerProxy } from '../export-name-resolve/architecture-export-name-resolve-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureWidgetNodeRenderBrokerProxy = (): {
  setupExportNamesMap: ({ map }: { map: Record<string, ContentText> }) => void;
} => {
  architectureBindingFlowTraceBrokerProxy();
  const exportProxy = architectureExportNameResolveBrokerProxy();

  return {
    setupExportNamesMap: ({ map }: { map: Record<string, ContentText> }): void => {
      exportProxy.setupImplementation({
        fn: (filePath: ContentText): ContentText => {
          const fp = String(filePath);
          for (const [suffix, content] of Object.entries(map)) {
            if (fp.endsWith(suffix)) {
              return content;
            }
          }
          throw new Error('ENOENT');
        },
      });
    },
  };
};
