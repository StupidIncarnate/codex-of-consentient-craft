/**
 * PURPOSE: Extracts custom or default violation message from display config
 *
 * USAGE:
 * const message = violationMessageExtractTransformer({ displayConfig, ruleId, hookData });
 * // Returns the instructional message for the violation
 */
import { violationRuleMessageDefaultTransformer } from '../violation-rule-message-default/violation-rule-message-default-transformer';

export const violationMessageExtractTransformer = ({
  displayConfig,
  ruleId,
  hookData,
}: {
  displayConfig: { message?: string | ((data: unknown) => unknown) };
  ruleId: string;
  hookData: unknown;
}): string => {
  const configMessage = displayConfig.message;

  if (configMessage === undefined) {
    return violationRuleMessageDefaultTransformer({ ruleId });
  }

  if (typeof configMessage === 'string') {
    return configMessage;
  }

  // If it's a function, call it
  try {
    const result = configMessage(hookData);
    return typeof result === 'string' ? result : String(result);
  } catch (error: unknown) {
    return `Custom message function failed: ${error instanceof Error ? error.message : String(error)}`;
  }
};
