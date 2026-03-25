/**
 * PURPOSE: Transforms parsed stream-line objects into StreamJsonLine branded strings
 *          by JSON.stringify-ing the object and parsing through streamJsonLineContract
 *
 * USAGE:
 * const line = streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() });
 * // Returns StreamJsonLine branded string ready for ClaudeQueueResponse.lines
 */
import { streamJsonLineContract } from '../../contracts/stream-json-line/stream-json-line-contract';
import type { StreamJsonLine } from '../../contracts/stream-json-line/stream-json-line-contract';

export const streamLineToJsonLineTransformer = ({
  streamLine,
}: {
  streamLine: object;
}): StreamJsonLine => streamJsonLineContract.parse(JSON.stringify(streamLine));
