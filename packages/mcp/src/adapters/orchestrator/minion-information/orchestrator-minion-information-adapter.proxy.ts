/**
 * PURPOSE: Empty proxy for the minion-information adapter.
 *
 * USAGE:
 * orchestratorMinionInformationAdapterProxy();
 * // Nothing to stage — call it so a parent proxy declares this child
 *
 * NOTHING IS MOCKED HERE, and that is the point. This adapter crosses no I/O boundary: it reads three
 * literal statics out of the orchestrator's module graph and hands one back. A test that staged them
 * would be asserting against its own fixture rather than against the text the tool really serves.
 */

export const orchestratorMinionInformationAdapterProxy = (): Record<PropertyKey, never> => ({});
