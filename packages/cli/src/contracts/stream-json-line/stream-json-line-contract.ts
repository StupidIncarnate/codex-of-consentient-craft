/**
 * PURPOSE: Provides stream-json-line contract from orchestrator
 *
 * USAGE:
 * streamJsonLineContract.parse('{"type":"init","session_id":"abc-123"}');
 * // Returns: StreamJsonLine branded string
 */

import {
  streamJsonLineContract as orcStreamJsonLineContract,
  type StreamJsonLine as OrcStreamJsonLine,
} from '@dungeonmaster/orchestrator';

export const streamJsonLineContract = orcStreamJsonLineContract;

export type StreamJsonLine = OrcStreamJsonLine;
