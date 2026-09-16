/**
 * PURPOSE: Empty proxy for `planPreflightBroker` — it is pure. It reads the plan and the target it
 * is handed and calls other pure transformers; nothing here touches disk or opens a socket, so there
 * is no I/O boundary for a test to mock.
 *
 * USAGE:
 * planPreflightBrokerProxy();
 */
export const planPreflightBrokerProxy = (): Record<PropertyKey, never> => ({});
