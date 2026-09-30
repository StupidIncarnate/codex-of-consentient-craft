import { architectureBindingFlowTraceBrokerProxy } from '../binding-flow-trace/architecture-binding-flow-trace-broker.proxy';
import { architectureExportNameResolveBrokerProxy } from '../export-name-resolve/architecture-export-name-resolve-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

export const architectureWidgetNodeRenderBrokerProxy = (): {
  setupExportNamesMap: ({ map }: { map: Record<string, string> }) => void;
} => {
  architectureBindingFlowTraceBrokerProxy();
  const exportProxy = architectureExportNameResolveBrokerProxy();

  return {
    setupExportNamesMap: ({ map }: { map: Record<string, string> }): void => {
      exportProxy.setupImplementation({
        fn: (filePath: string): string => {
          const fp = filePath;
          for (const [suffix, content] of Object.entries(map)) {
            if (fp.endsWith(suffix)) {
              return content;
            }
          }
          throw FileMissingErrorStub({ path: fp });
        },
      });
    },
  };
};
