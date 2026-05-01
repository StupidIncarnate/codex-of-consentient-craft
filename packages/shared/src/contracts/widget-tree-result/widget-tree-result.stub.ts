import type { StubArgument } from '../../@types/stub-argument.type';
import { widgetTreeResultContract, type WidgetTreeResult } from './widget-tree-result-contract';

export const WidgetTreeResultStub = ({
  ...props
}: StubArgument<WidgetTreeResult> = {}): WidgetTreeResult =>
  widgetTreeResultContract.parse({
    roots: [],
    hubs: [],
    ...props,
  });
