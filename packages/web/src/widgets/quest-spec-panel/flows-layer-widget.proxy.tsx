import { ReactFlowDiagramWidgetProxy } from '../react-flow-diagram/react-flow-diagram-widget.proxy';
import { SectionHeaderWidgetProxy } from '../section-header/section-header-widget.proxy';

type ReactFlowProxy = ReturnType<typeof ReactFlowDiagramWidgetProxy>;
type SetupPositionsArgs = Parameters<ReactFlowProxy['setupPositions']>[0];

export const FlowsLayerWidgetProxy = (): {
  setupPositions: (args: SetupPositionsArgs) => void;
} => {
  SectionHeaderWidgetProxy();
  const reactFlowProxy = ReactFlowDiagramWidgetProxy();

  return {
    setupPositions: (args: SetupPositionsArgs): void => {
      reactFlowProxy.setupPositions(args);
    },
  };
};
