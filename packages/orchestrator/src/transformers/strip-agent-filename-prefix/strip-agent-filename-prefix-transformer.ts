/**
 * PURPOSE: Strips the 'agent-' prefix from a subagent JSONL filename to extract the raw agentId
 *
 * USAGE:
 * stripAgentFilenamePrefixTransformer({fileName: fileNameContract.parse('agent-a750c8bc.jsonl')});
 * // Returns 'a750c8bc' as AgentId
 */

import type { FileName } from '@dungeonmaster/shared/contracts';
import { agentIdContract } from '../../contracts/agent-id/agent-id-contract';
import type { AgentId } from '../../contracts/agent-id/agent-id-contract';

const AGENT_PREFIX = 'agent-';
const JSONL_SUFFIX = '.jsonl';

export const stripAgentFilenamePrefixTransformer = ({
  fileName,
}: {
  fileName: FileName;
}): AgentId => {
  const withoutSuffix = String(fileName).endsWith(JSONL_SUFFIX)
    ? String(fileName).slice(0, -JSONL_SUFFIX.length)
    : String(fileName);

  const withoutPrefix = withoutSuffix.startsWith(AGENT_PREFIX)
    ? withoutSuffix.slice(AGENT_PREFIX.length)
    : withoutSuffix;

  return agentIdContract.parse(withoutPrefix);
};
