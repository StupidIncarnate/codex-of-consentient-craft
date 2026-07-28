import { FormTagListWidgetProxy } from '../form-tag-list/form-tag-list-widget.proxy';
import { PlanSectionWidgetProxy } from '../plan-section/plan-section-widget.proxy';

export const ContractsLayerWidgetProxy = (): Record<PropertyKey, never> => {
  PlanSectionWidgetProxy();
  FormTagListWidgetProxy();

  return {};
};
