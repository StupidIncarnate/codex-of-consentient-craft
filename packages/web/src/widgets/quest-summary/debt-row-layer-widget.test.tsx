import { screen } from '@testing-library/react';

import { QuestSummaryDebtStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { DebtRowLayerWidget } from './debt-row-layer-widget';
import { DebtRowLayerWidgetProxy } from './debt-row-layer-widget.proxy';

describe('DebtRowLayerWidget', () => {
  describe('a cant-meet entry', () => {
    it('VALID: {mark: cant-meet, toSettle carried} => renders the mark, the track, the unit, the evidence and the action that would settle it', () => {
      DebtRowLayerWidgetProxy();
      const entry = QuestSummaryDebtStub({
        id: 'login-flow:terminal:dashboard:siegemaster',
        unitId: 'login-flow:terminal:dashboard',
        kind: 'terminal',
        track: 'siegemaster',
        mark: 'cant-meet',
        evidence: 'the sandbox refuses to bind port 3737, so no browser can reach the app',
        toSettle: 'Start the sandbox dev server on a free port, then re-walk this node.',
      });

      mantineRenderAdapter({ ui: <DebtRowLayerWidget entry={entry} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_DEBT_UNIT').textContent).toBe(
        '[cant-meet] [siegemaster] login-flow:terminal:dashboard',
      );
      expect(screen.getByTestId('QUEST_SUMMARY_DEBT_EVIDENCE').textContent).toBe(
        'the sandbox refuses to bind port 3737, so no browser can reach the app',
      );
      expect(screen.getByTestId('QUEST_SUMMARY_DEBT_TO_SETTLE').textContent).toBe(
        '→ Start the sandbox dev server on a free port, then re-walk this node.',
      );
      expect(screen.queryByTestId('QUEST_SUMMARY_DEBT_SUCCESSOR')).toBe(null);
    });

    it('VALID: {mark: cant-meet} => the row is exactly the unit line, the evidence and the to-settle line, in that order', () => {
      DebtRowLayerWidgetProxy();
      const entry = QuestSummaryDebtStub({
        mark: 'cant-meet',
        evidence: 'a browser cannot post a non-JSON body through the login form',
        toSettle: 'Drive this observable from an API-level walk instead of the browser.',
      });

      mantineRenderAdapter({ ui: <DebtRowLayerWidget entry={entry} /> });

      const lines = Array.from(screen.getByTestId('QUEST_SUMMARY_DEBT_ROW').children);

      expect(lines.map((line) => String(line.getAttribute('data-testid')))).toStrictEqual([
        'QUEST_SUMMARY_DEBT_UNIT',
        'QUEST_SUMMARY_DEBT_EVIDENCE',
        'QUEST_SUMMARY_DEBT_TO_SETTLE',
      ]);
      expect(lines.map((line) => String(line.textContent))).toStrictEqual([
        '[cant-meet] [flowrider] login-flow:observable:rejects-bleh-payload',
        'a browser cannot post a non-JSON body through the login form',
        '→ Drive this observable from an API-level walk instead of the browser.',
      ]);
    });
  });

  describe('an unmet entry', () => {
    it('VALID: {mark: unmet, no toSettle} => renders the successor line in place of a to-settle line', () => {
      DebtRowLayerWidgetProxy();
      const entry = QuestSummaryDebtStub({
        id: 'login-flow:observable:rejects-bleh-payload:flowrider',
        unitId: 'login-flow:observable:rejects-bleh-payload',
        kind: 'observable',
        track: 'flowrider',
        mark: 'unmet',
        evidence: 'the spec asserts the 400 body but nothing drives a non-JSON request yet',
      });

      mantineRenderAdapter({ ui: <DebtRowLayerWidget entry={entry} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_DEBT_UNIT').textContent).toBe(
        '[unmet] [flowrider] login-flow:observable:rejects-bleh-payload',
      );
      expect(screen.getByTestId('QUEST_SUMMARY_DEBT_EVIDENCE').textContent).toBe(
        'the spec asserts the 400 body but nothing drives a non-JSON request yet',
      );
      expect(screen.getByTestId('QUEST_SUMMARY_DEBT_SUCCESSOR').textContent).toBe(
        '→ nothing hands this over; a successor is owed the work',
      );
      expect(screen.queryByTestId('QUEST_SUMMARY_DEBT_TO_SETTLE')).toBe(null);
    });

    it('VALID: {mark: unmet} => the row is exactly the unit line, the evidence and the successor line, in that order', () => {
      DebtRowLayerWidgetProxy();
      const entry = QuestSummaryDebtStub({
        mark: 'unmet',
        evidence: 'no spec drives a non-JSON request at the login route yet',
      });

      mantineRenderAdapter({ ui: <DebtRowLayerWidget entry={entry} /> });

      const lines = Array.from(screen.getByTestId('QUEST_SUMMARY_DEBT_ROW').children);

      expect(lines.map((line) => String(line.getAttribute('data-testid')))).toStrictEqual([
        'QUEST_SUMMARY_DEBT_UNIT',
        'QUEST_SUMMARY_DEBT_EVIDENCE',
        'QUEST_SUMMARY_DEBT_SUCCESSOR',
      ]);
      expect(lines.map((line) => String(line.textContent))).toStrictEqual([
        '[unmet] [flowrider] login-flow:observable:rejects-bleh-payload',
        'no spec drives a non-JSON request at the login route yet',
        '→ nothing hands this over; a successor is owed the work',
      ]);
    });
  });

  describe('the track on the unit line', () => {
    it('VALID: {track: codeweaver} => the unit line names the track that is short, not the unit alone', () => {
      DebtRowLayerWidgetProxy();
      const entry = QuestSummaryDebtStub({
        id: 'login-flow:observable:rejects-bleh-payload:codeweaver',
        unitId: 'login-flow:observable:rejects-bleh-payload',
        track: 'codeweaver',
        mark: 'unmet',
        evidence: 'the handler has no unit test for the non-JSON branch',
      });

      mantineRenderAdapter({ ui: <DebtRowLayerWidget entry={entry} /> });

      expect(screen.getByTestId('QUEST_SUMMARY_DEBT_UNIT').textContent).toBe(
        '[unmet] [codeweaver] login-flow:observable:rejects-bleh-payload',
      );
    });
  });
});
