import { screen } from '@testing-library/react';

export const OperationsLedgerWidgetProxy = (): {
  hasLedger: () => boolean;
  getLedgerRows: () => HTMLElement[];
  getFlowLabels: () => HTMLElement[];
} => ({
  hasLedger: (): boolean => screen.queryByTestId('OPERATIONS_LEDGER') !== null,
  getLedgerRows: (): HTMLElement[] => screen.queryAllByTestId('OPERATIONS_LEDGER_ROW'),
  getFlowLabels: (): HTMLElement[] => screen.queryAllByTestId('OPERATIONS_LEDGER_ROW_FLOWS'),
});
