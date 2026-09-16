/**
 * PURPOSE: Empty proxy for `opSaveRecordApplyLayerBroker`. It only reads and writes the in-memory
 * run state it is handed — no I/O boundary exists here for a test to mock.
 *
 * USAGE:
 * opSaveRecordApplyLayerBrokerProxy();
 */
export const opSaveRecordApplyLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
