import { screen } from '#gateway/npm/testing-library__react';

interface FlowNodePackageChipLayerWidgetProxyResult {
  getChip: () => HTMLElement | null;
  getChipName: () => HTMLElement['textContent'];
  getChipAccent: () => HTMLElement['textContent'];
  getChipPackageType: () => HTMLElement['textContent'];
}

export const FlowNodePackageChipLayerWidgetProxy =
  (): FlowNodePackageChipLayerWidgetProxyResult => ({
    getChip: (): HTMLElement | null => screen.queryByTestId('FLOW_NODE_PACKAGE_CHIP'),
    getChipName: (): HTMLElement['textContent'] =>
      screen.queryByTestId('FLOW_NODE_PACKAGE_CHIP')?.textContent ?? null,
    getChipAccent: (): HTMLElement['textContent'] =>
      screen.queryByTestId('FLOW_NODE_PACKAGE_CHIP')?.getAttribute('data-package-accent') ?? null,
    getChipPackageType: (): HTMLElement['textContent'] =>
      screen.queryByTestId('FLOW_NODE_PACKAGE_CHIP')?.getAttribute('data-package-type') ?? null,
  });
