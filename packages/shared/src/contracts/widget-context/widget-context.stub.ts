/**
 * PURPOSE: Stub factory for WidgetContext contract
 *
 * USAGE:
 * const ctx = WidgetContextStub({ packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }) });
 * // Returns a validated WidgetContext with empty trees and edges by default
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';
import { WidgetTreeResultStub } from '../widget-tree-result/widget-tree-result.stub';
import { widgetContextContract, type WidgetContext } from './widget-context-contract';

export const WidgetContextStub = ({ ...props }: StubArgument<WidgetContext> = {}): WidgetContext =>
  widgetContextContract.parse({
    widgetTree: WidgetTreeResultStub(),
    httpEdges: [],
    wsEdges: [],
    packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
    projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
    ...props,
  });
