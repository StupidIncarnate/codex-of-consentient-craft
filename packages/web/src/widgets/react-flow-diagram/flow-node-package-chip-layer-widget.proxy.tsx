import { screen } from '#gateway/npm/testing-library__react';

interface FlowNodePackageChipLayerWidgetProxyResult {
  getChip: () => HTMLElement | null;
  getChipName: () => Node['textContent'];
  getChipAccent: () => Node['textContent'];
  getChipPackageType: () => Node['textContent'];
}

export const FlowNodePackageChipLayerWidgetProxy =
  (): FlowNodePackageChipLayerWidgetProxyResult => ({
    getChip: (): HTMLElement | null => screen.queryByTestId('FLOW_NODE_PACKAGE_CHIP'),
    getChipName: (): Node['textContent'] =>
      screen.queryByTestId('FLOW_NODE_PACKAGE_CHIP')?.textContent ?? null,
    getChipAccent: (): Node['textContent'] =>
      screen.queryByTestId('FLOW_NODE_PACKAGE_CHIP')?.getAttribute('data-package-accent') ?? null,
    getChipPackageType: (): Node['textContent'] =>
      screen.queryByTestId('FLOW_NODE_PACKAGE_CHIP')?.getAttribute('data-package-type') ?? null,
  });
