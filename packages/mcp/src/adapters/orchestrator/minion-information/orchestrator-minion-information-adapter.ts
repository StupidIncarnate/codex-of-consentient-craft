/**
 * PURPOSE: Adapter over the orchestrator's three minion-family information payloads — the text
 * `get-planner-information`, `get-worker-information` and `get-reviewer-information` each serve whole.
 *
 * USAGE:
 * orchestratorMinionInformationAdapter({ family: MinionFamilyStub({ value: 'planner' }) });
 * // Returns the markdown every planner minion reads, whatever kind of work it is planning
 *
 * IT TAKES A FAMILY AND NOTHING ELSE. Each payload is generic by construction: what differs between an
 * implementation planner and a hands-on QA planner lives in that role's own prompt, so there is no role
 * to pass and no context to interpolate. That also makes this the one adapter in the folder with no
 * `await` — the statics are literal text, already in the module graph.
 *
 * IT RETURNS `ContentText`, the same brand every tool response body carries, so the responder hands the
 * value straight to the MCP layer rather than re-parsing a raw string on the way out.
 */

import {
  plannerInformationStatics,
  reviewerInformationStatics,
  workerInformationStatics,
} from '@dungeonmaster/orchestrator';

import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { MinionFamily } from '../../../contracts/minion-family/minion-family-contract';

const BY_FAMILY: Readonly<Record<MinionFamily, ContentText>> = {
  planner: contentTextContract.parse(plannerInformationStatics.markdown),
  worker: contentTextContract.parse(workerInformationStatics.markdown),
  reviewer: contentTextContract.parse(reviewerInformationStatics.markdown),
};

export const orchestratorMinionInformationAdapter = ({
  family,
}: {
  family: MinionFamily;
}): ContentText => BY_FAMILY[family];
