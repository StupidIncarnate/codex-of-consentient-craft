/**
 * PURPOSE: Transforms parsed stream-line objects into StreamJsonLine branded strings
 *          by JSON.stringify-ing the object and parsing through streamJsonLineContract
 *
 * USAGE:
 * const line = streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() });
 * // Returns StreamJsonLine branded string ready for ClaudeQueueResponse.lines
 */

export const streamLineToJsonLineTransformer = ({
  streamLine,
}: {
  streamLine: object;
}): string => JSON.stringify(streamLine);
