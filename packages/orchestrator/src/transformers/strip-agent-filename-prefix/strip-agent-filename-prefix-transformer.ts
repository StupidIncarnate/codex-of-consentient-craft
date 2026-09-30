/**
 * PURPOSE: Strips the 'agent-' prefix from a subagent JSONL filename to extract the raw agentId
 *
 * USAGE:
 * stripAgentFilenamePrefixTransformer({fileName: fileNameContract.parse('agent-a750c8bc.jsonl')});
 * // Returns 'a750c8bc' as AgentId
 */

import type { FileName, Agent } from '@dungeonmaster/shared/contracts';
import { agentContract } from '@dungeonmaster/shared/contracts';

const AGENT_PREFIX = 'agent-';
const JSONL_SUFFIX = '.jsonl';

export const stripAgentFilenamePrefixTransformer = ({
  fileName,
}: {
  fileName: FileName;
}): Agent['id'] => {
  const withoutSuffix = String(fileName).endsWith(JSONL_SUFFIX)
    ? String(fileName).slice(0, -JSONL_SUFFIX.length)
    : String(fileName);

  const withoutPrefix = withoutSuffix.startsWith(AGENT_PREFIX)
    ? withoutSuffix.slice(AGENT_PREFIX.length)
    : withoutSuffix;

  return agentContract.shape.id.parse(withoutPrefix);
};
