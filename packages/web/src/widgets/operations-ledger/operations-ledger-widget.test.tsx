import { screen } from '@testing-library/react';

import { OperationItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { OperationsLedgerWidget } from './operations-ledger-widget';
import { OperationsLedgerWidgetProxy } from './operations-ledger-widget.proxy';

describe('OperationsLedgerWidget', () => {
  describe('empty operations', () => {
    it('EMPTY: {operations: []} => renders nothing', () => {
      const proxy = OperationsLedgerWidgetProxy();

      mantineRenderAdapter({
        ui: <OperationsLedgerWidget operations={[]} />,
      });

      expect(proxy.hasLedger()).toBe(false);
      expect(proxy.getLedgerRows()).toStrictEqual([]);
    });
  });

  describe('status markers', () => {
    it('VALID: {pending, in_progress, complete items} => renders one row per item with matching markers in order', () => {
      const proxy = OperationsLedgerWidgetProxy();
      const operations = [
        OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d401',
          role: 'codeweaver',
          text: 'core: config adapter',
          status: 'complete',
        }),
        OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d402',
          role: 'codeweaver',
          text: 'wire config into server',
          status: 'in_progress',
        }),
        OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d403',
          role: 'siegemaster',
          text: 'assault the config flow',
          status: 'pending',
        }),
      ];

      mantineRenderAdapter({
        ui: <OperationsLedgerWidget operations={operations} />,
      });

      expect(proxy.hasLedger()).toBe(true);

      const markers = screen
        .queryAllByTestId('OPERATIONS_LEDGER_ROW_MARKER')
        .map((m) => m.textContent);

      expect(markers).toStrictEqual(['[x]', '[>]', '[ ]']);

      const texts = screen.queryAllByTestId('OPERATIONS_LEDGER_ROW_TEXT').map((t) => t.textContent);

      expect(texts).toStrictEqual([
        'core: config adapter',
        'wire config into server',
        'assault the config flow',
      ]);
    });
  });

  describe('role badges', () => {
    it('VALID: {codeweaver and ward items} => renders uppercase role badge per row', () => {
      OperationsLedgerWidgetProxy();
      const operations = [
        OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d411',
          role: 'codeweaver',
          text: 'build the broker',
          status: 'pending',
        }),
        OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d412',
          role: 'ward',
          text: 'verify: ward',
          status: 'pending',
          wardMode: 'changed',
        }),
      ];

      mantineRenderAdapter({
        ui: <OperationsLedgerWidget operations={operations} />,
      });

      const roles = screen.queryAllByTestId('OPERATIONS_LEDGER_ROW_ROLE').map((r) => r.textContent);

      expect(roles).toStrictEqual(['[CODEWEAVER]', '[WARD]']);
    });
  });

  describe('ward mode', () => {
    it('VALID: {ward item with wardMode: "full"} => renders ward mode suffix', () => {
      OperationsLedgerWidgetProxy();
      const operations = [
        OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d421',
          role: 'ward',
          text: 'verify: full ward',
          status: 'pending',
          wardMode: 'full',
        }),
      ];

      mantineRenderAdapter({
        ui: <OperationsLedgerWidget operations={operations} />,
      });

      expect(screen.getByTestId('OPERATIONS_LEDGER_ROW_WARD_MODE').textContent).toBe('(full)');
    });

    it('EMPTY: {item without wardMode} => does not render ward mode element', () => {
      OperationsLedgerWidgetProxy();
      const operations = [
        OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d431',
          role: 'codeweaver',
          text: 'build the broker',
          status: 'pending',
        }),
      ];

      mantineRenderAdapter({
        ui: <OperationsLedgerWidget operations={operations} />,
      });

      expect(screen.queryByTestId('OPERATIONS_LEDGER_ROW_WARD_MODE')).toBe(null);
    });
  });

  describe('row content', () => {
    it('VALID: {single complete ward item with wardMode} => full row text combines marker, role, text, and mode', () => {
      const proxy = OperationsLedgerWidgetProxy();
      const operations = [
        OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d441',
          role: 'ward',
          text: 'verify: ward',
          status: 'complete',
          wardMode: 'changed',
        }),
      ];

      mantineRenderAdapter({
        ui: <OperationsLedgerWidget operations={operations} />,
      });

      const rows = proxy.getLedgerRows();

      expect(rows.map((r) => r.textContent)).toStrictEqual(['[x][WARD]verify: ward(changed)']);
    });
  });
});
