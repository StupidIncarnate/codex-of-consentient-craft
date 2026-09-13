import { screen } from '@testing-library/react';

import { OperationRowLayerWidgetProxy } from './operation-row-layer-widget.proxy';

export const OperationsLedgerWidgetProxy = (): {
  hasLedger: () => boolean;
  getLedgerRows: () => HTMLElement[];
  getFlowLabels: () => HTMLElement[];
} => {
  OperationRowLayerWidgetProxy();

  return {
    hasLedger: (): boolean => screen.queryByTestId('OPERATIONS_LEDGER') !== null,
    getLedgerRows: (): HTMLElement[] => screen.queryAllByTestId('OPERATIONS_LEDGER_ROW'),
    getFlowLabels: (): HTMLElement[] => screen.queryAllByTestId('OPERATIONS_LEDGER_ROW_FLOWS'),
  };
};
