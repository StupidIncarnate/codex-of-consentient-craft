/**
 * PURPOSE: Barrel export for testing brokers other packages drive directly
 *
 * USAGE:
 * import { openHandleTrackingBroker } from '@dungeonmaster/testing/brokers';
 * // The open-handle pair is here because Playwright runs OUTSIDE jest, so the web package's
 * // e2e fixtures have to arm and report the watch themselves rather than inherit it from
 * // jest.setup.js
 */
export * from './src/brokers/open-handle/tracking/open-handle-tracking-broker';
export * from './src/brokers/open-handle/report/open-handle-report-broker';
