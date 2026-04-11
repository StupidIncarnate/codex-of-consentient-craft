import { FormInputWidgetProxy } from '../form-input/form-input-widget.proxy';
import { MermaidDiagramWidgetProxy } from '../mermaid-diagram/mermaid-diagram-widget.proxy';
import { PlanSectionWidgetProxy } from '../plan-section/plan-section-widget.proxy';

export const FlowsLayerWidgetProxy = (): {
  clickAdd: () => Promise<void>;
} => {
  const planSection = PlanSectionWidgetProxy();
  FormInputWidgetProxy();
  MermaidDiagramWidgetProxy();

  return {
    clickAdd: planSection.clickAdd,
  };
};
