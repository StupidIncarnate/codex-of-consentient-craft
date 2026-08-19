/**
 * PURPOSE: Single source for the health error panel's display vocabulary and the socket-close
 * sentinel useHealthBinding writes into its error state on a WebSocket close, so the panel's
 * CONNECTION LOST branch and the binding that produces that string can never drift into two
 * different literals.
 *
 * USAGE:
 * healthErrorStatics.labels.httpPrefix + status;
 * // Returns 'HTTP 500' when concatenated with a status code
 */
export const healthErrorStatics = {
  socketClosedMessage: 'WebSocket connection lost',
  labels: {
    connectionLost: 'CONNECTION LOST',
    noResponse: 'NO RESPONSE',
    httpPrefix: 'HTTP ',
  },
} as const;
