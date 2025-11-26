/**
 * PURPOSE: Proxy for start-primitive-duplicate-detection integration tests
 *
 * USAGE:
 * const proxy = StartPrimitiveDuplicateDetectionProxy();
 * // Startup runs in subprocess - proxy delegates to broker proxy for consistency
 */

import { duplicateDetectionDetectBrokerProxy } from '../brokers/duplicate-detection/detect/duplicate-detection-detect-broker.proxy';

export const StartPrimitiveDuplicateDetectionProxy = (): Record<PropertyKey, never> => {
  duplicateDetectionDetectBrokerProxy();

  return {};
};
