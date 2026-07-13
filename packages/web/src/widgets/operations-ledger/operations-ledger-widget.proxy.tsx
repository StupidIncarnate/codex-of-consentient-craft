import { screen } from '@testing-library/react';

export const OperationsLedgerWidgetProxy = (): {
  hasLedger: () => boolean;
  getLedgerRows: () => HTMLElement[];
} => ({
  hasLedger: (): boolean => screen.queryByTestId('OPERATIONS_LEDGER') !== null,
  getLedgerRows: (): HTMLElement[] => screen.queryAllByTestId('OPERATIONS_LEDGER_ROW'),
});
