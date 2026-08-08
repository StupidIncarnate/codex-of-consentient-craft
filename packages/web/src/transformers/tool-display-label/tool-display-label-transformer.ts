/**
 * PURPOSE: Answers "what did the agent just do?" for a collapsed tool row, where the raw tool name
 * mostly does not. Every shell call is named `Bash` and every MCP call carries a server-qualified
 * `mcp__server__tool`, so a scrolling transcript of either reads as one repeated word; this reads
 * the invocation itself and names the action — `git diff`, `npm run ward`, `discover`.
 *
 * Reach for this for the row's bold slot only. It deliberately discards arguments, so it is the
 * wrong input for anything that needs to identify WHICH call was made — use `toolName` for that.
 *
 * USAGE:
 * toolDisplayLabelTransformer({toolName: 'Bash', toolInput: '{"command":"git diff -- src"}'});
 * // Returns 'git diff'
 */

import { toolDisplayLabelContract } from '../../contracts/tool-display-label/tool-display-label-contract';
import type { ToolDisplayLabel } from '../../contracts/tool-display-label/tool-display-label-contract';
import { toolDisplayLabelStatics } from '../../statics/tool-display-label/tool-display-label-statics';
import { formatToolInputTransformer } from '../format-tool-input/format-tool-input-transformer';

const MCP_PREFIX = /^mcp__.+?__/u;
const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/u;
const COMMAND_WORD = /^[a-z][a-z0-9._-]*$/u;
const WHITESPACE = /\s+/u;

export const toolDisplayLabelTransformer = ({
  toolName,
  toolInput,
}: {
  toolName: string;
  toolInput: string;
}): ToolDisplayLabel => {
  const formatted = formatToolInputTransformer({ toolName, toolInput });

  if (toolName === toolDisplayLabelStatics.skillToolName) {
    const skillField = formatted?.fields.find(
      (field) => field.key === toolDisplayLabelStatics.skillFieldKey,
    );
    const skillName =
      skillField === undefined
        ? toolDisplayLabelStatics.unknownSkillLabel
        : String(skillField.value);

    return toolDisplayLabelContract.parse(`${toolDisplayLabelStatics.skillToolName}: ${skillName}`);
  }

  if (toolName === toolDisplayLabelStatics.bashToolName) {
    const commandField = formatted?.fields.find(
      (field) => field.key === toolDisplayLabelStatics.commandFieldKey,
    );
    const tokens = String(commandField?.value ?? '')
      .trim()
      .split(WHITESPACE)
      .filter((token) => token !== '');

    // A leading `VAR=val` run is env setup, not the command — skip past it before naming anything.
    const commandStart = tokens.findIndex((token) => !ENV_ASSIGNMENT.test(token));
    const afterEnv = commandStart === -1 ? [] : tokens.slice(commandStart);

    // Sub-commands (`run ward`) are bare words; the first flag, path, or redirect ends the name.
    const firstNonWord = afterEnv.findIndex((token) => !COMMAND_WORD.test(token));
    const wordCount = firstNonWord === -1 ? afterEnv.length : firstNonWord;
    const words = afterEnv.slice(0, Math.min(wordCount, toolDisplayLabelStatics.maxCommandWords));

    if (words.length > 0) {
      return toolDisplayLabelContract.parse(words.join(' '));
    }

    return toolDisplayLabelContract.parse(toolDisplayLabelStatics.bashToolName);
  }

  const withoutMcpPrefix = toolName.replace(MCP_PREFIX, '');

  return toolDisplayLabelContract.parse(withoutMcpPrefix === '' ? toolName : withoutMcpPrefix);
};
