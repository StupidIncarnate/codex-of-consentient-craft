/**
 * PURPOSE: Returns true when a flow file's content imports ToolRegistration, indicating the flow returns ToolRegistration[]
 *
 * USAGE:
 * flowReturnsToolRegistrationGuard({ flowFileContent: "import type { ToolRegistration } from '...';" });
 * // Returns true — ToolRegistration import detected
 */

const TOOL_REGISTRATION_IMPORT_PATTERN = /import\s+(?:type\s+)?\{[^}]*\bToolRegistration\b/u;

export const flowReturnsToolRegistrationGuard = ({
  flowFileContent,
}: {
  flowFileContent?: string;
}): boolean => {
  if (flowFileContent === undefined) {
    return false;
  }
  return TOOL_REGISTRATION_IMPORT_PATTERN.test(flowFileContent);
};
