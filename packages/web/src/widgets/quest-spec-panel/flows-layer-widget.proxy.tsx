import { ReactFlowDiagramWidgetProxy } from '../react-flow-diagram/react-flow-diagram-widget.proxy';
import { SectionHeaderWidgetProxy } from '../section-header/section-header-widget.proxy';

type ReactFlowProxy = ReturnType<typeof ReactFlowDiagramWidgetProxy>;
type SetupPositionsArgs = Parameters<ReactFlowProxy['setupPositions']>[0];

export const FlowsLayerWidgetProxy = (): {
  setupPositions: (args: SetupPositionsArgs) => void;
  setupEmptyQueue: () => void;
  clickNode: ReactFlowProxy['clickNode'];
  clickObservableNode: ReactFlowProxy['clickObservableNode'];
  getCommentBadgeTextsOn: ReactFlowProxy['getCommentBadgeTextsOn'];
  hasCommentsSection: () => boolean;
  getPanelCommentTexts: () => HTMLElement['textContent'][];
} => {
  SectionHeaderWidgetProxy();
  const reactFlowProxy = ReactFlowDiagramWidgetProxy();

  return {
    setupPositions: (args: SetupPositionsArgs): void => {
      reactFlowProxy.setupPositions(args);
    },
    setupEmptyQueue: (): void => {
      reactFlowProxy.setupEmptyQueue();
    },
    clickNode: reactFlowProxy.clickNode,
    clickObservableNode: reactFlowProxy.clickObservableNode,
    getCommentBadgeTextsOn: reactFlowProxy.getCommentBadgeTextsOn,
    hasCommentsSection: (): boolean => reactFlowProxy.hasCommentsSection(),
    getPanelCommentTexts: (): HTMLElement['textContent'][] => reactFlowProxy.getPanelCommentTexts(),
  };
};
