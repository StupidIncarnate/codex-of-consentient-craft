/**
 * PURPOSE: Strips quest.comments out of a GetQuestResult before an MCP agent ever sees it, so a
 * get-quest call never repeats feedback the comment-batch route already delivered as a chat turn
 *
 * USAGE:
 * const payload = questStripCommentsTransformer({ result: GetQuestResultStub() });
 * // Returns AgentQuestPayload — same success/quest/error shape as the input, but quest has no
 * // `comments` key
 */
import { agentQuestPayloadContract } from '../../contracts/agent-quest-payload/agent-quest-payload-contract';
import type { AgentQuestPayload } from '../../contracts/agent-quest-payload/agent-quest-payload-contract';
import type { GetQuestResult } from '@dungeonmaster/shared/contracts';

// agentQuestPayloadContract's `quest` shape has no `comments` field at all. Zod's object parser
// defaults to "strip" mode: any key present on the input that isn't in the target shape is
// dropped from the parsed output, silently. That default strip IS the mechanism here — there is
// no explicit delete anywhere in this function, only a shape with one fewer key than the one it
// is parsing against.
export const questStripCommentsTransformer = ({
  result,
}: {
  result: GetQuestResult;
}): AgentQuestPayload => agentQuestPayloadContract.parse(result);
