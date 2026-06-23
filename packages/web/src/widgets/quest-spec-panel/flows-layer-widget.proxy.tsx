import { FormInputWidgetProxy } from '../form-input/form-input-widget.proxy';
import { PlanSectionWidgetProxy } from '../plan-section/plan-section-widget.proxy';
import { ReactFlowDiagramWidgetProxy } from '../react-flow-diagram/react-flow-diagram-widget.proxy';

type ReactFlowProxy = ReturnType<typeof ReactFlowDiagramWidgetProxy>;
type SetupPositionsArgs = Parameters<ReactFlowProxy['setupPositions']>[0];

export const FlowsLayerWidgetProxy = (): {
  clickAdd: () => Promise<void>;
  clickRemove: (params: { index: number }) => Promise<void>;
  setupPositions: (args: SetupPositionsArgs) => void;
} => {
  const planSection = PlanSectionWidgetProxy();
  FormInputWidgetProxy();
  const reactFlowProxy = ReactFlowDiagramWidgetProxy();

  return {
    clickAdd: planSection.clickAdd,
    clickRemove: planSection.clickRemove,
    setupPositions: (args: SetupPositionsArgs): void => {
      reactFlowProxy.setupPositions(args);
    },
  };
};
