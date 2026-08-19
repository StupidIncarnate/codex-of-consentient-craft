/**
 * PURPOSE: Single deterministic point that turns the raw failure message useHealthBinding
 * surfaces into the health error panel's three-word headline, so a status code, a dropped
 * socket, a network failure, and an unparseable body each map to exactly one label instead of
 * every consumer re-deriving its own text from the same message.
 *
 * USAGE:
 * healthErrorLabelTransformer({ message: 'GET /api/health failed with status 500' });
 * // Returns 'HTTP 500' as branded DisplayLabel
 */

import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { healthErrorStatics } from '../../statics/health-error/health-error-statics';

const HTTP_STATUS_PATTERN = /failed with status (\d+)$/u;

export const healthErrorLabelTransformer = ({ message }: { message: string }): DisplayLabel => {
  if (message === healthErrorStatics.socketClosedMessage) {
    return displayLabelContract.parse(healthErrorStatics.labels.connectionLost);
  }

  const statusMatch = HTTP_STATUS_PATTERN.exec(message);
  const capturedStatus = statusMatch?.[1];
  if (capturedStatus !== undefined) {
    return displayLabelContract.parse(`${healthErrorStatics.labels.httpPrefix}${capturedStatus}`);
  }

  return displayLabelContract.parse(healthErrorStatics.labels.noResponse);
};
