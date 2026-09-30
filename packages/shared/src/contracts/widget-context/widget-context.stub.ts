/**
 * PURPOSE: Stub factory for WidgetContext contract
 *
 * USAGE:
 * const ctx = WidgetContextStub({ packageRoot: '/repo/packages/web' });
 * // Returns a validated WidgetContext with empty trees and edges by default
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { WidgetTreeResultStub } from '../widget-tree-result/widget-tree-result.stub';
import { widgetContextContract, type WidgetContext } from './widget-context-contract';

export const WidgetContextStub = ({ ...props }: StubArgument<WidgetContext> = {}): WidgetContext =>
  widgetContextContract.parse({
    widgetTree: WidgetTreeResultStub(),
    httpEdges: [],
    wsEdges: [],
    packageRoot: '/repo/packages/web',
    projectRoot: '/repo',
    ...props,
  });
