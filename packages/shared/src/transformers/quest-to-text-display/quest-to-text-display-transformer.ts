/**
 * PURPOSE: Transforms a Quest object into a human-readable text display format with flow graph visualization
 *
 * USAGE:
 * const text = questToTextDisplayTransformer({quest: QuestStub()});
 * // Returns: branded ContentText string with full quest display
 *
 * const staged = questToTextDisplayTransformer({quest, stage: 'spec'});
 * // Omits the sections `spec` does not carry, rather than rendering them as "(none)". A staged
 * // get-quest hands back a quest whose excluded sections are EMPTY ARRAYS, indistinguishable from
 * // genuinely empty at this layer — so without the stage, `stage: 'spec'` prints an empty
 * // "## Operations" header and an agent reads it as "this quest has no ledger" instead of "you
 * // did not ask for it".
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { Quest } from '../../contracts/quest/quest-contract';
import type { QuestStage } from '../../contracts/quest-stage/quest-stage-contract';
import { isQuestSectionInStageGuard } from '../../guards/is-quest-section-in-stage/is-quest-section-in-stage-guard';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';
import { flowGraphToTextTransformer } from '../flow-graph-to-text/flow-graph-to-text-transformer';
import { questContractPropertiesToTextTransformer } from '../quest-contract-properties-to-text/quest-contract-properties-to-text-transformer';

const SYM = textDisplaySymbolsStatics;
const PROPERTY_START_DEPTH = 1;

export const questToTextDisplayTransformer = ({
  quest,
  stage,
}: {
  quest: Quest;
  stage?: QuestStage | undefined;
}): ContentText => {
  const parts: ContentText[] = [];

  parts.push(contentTextContract.parse(SYM.legendLines.join('\n')));
  parts.push(contentTextContract.parse(''));
  parts.push(contentTextContract.parse(`# Quest: ${String(quest.title)}`));
  parts.push(contentTextContract.parse(`Status: ${quest.status}`));

  if (isQuestSectionInStageGuard({ section: 'designDecisions', stage })) {
    parts.push(contentTextContract.parse(''));
    parts.push(contentTextContract.parse(SYM.sectionHeaders.designDecisions));
    parts.push(contentTextContract.parse(''));
    if (quest.designDecisions.length === 0) {
      parts.push(contentTextContract.parse(SYM.none));
    } else {
      for (const dd of quest.designDecisions) {
        parts.push(contentTextContract.parse(`#${String(dd.id)}: "${String(dd.title)}"`));
        parts.push(contentTextContract.parse(`${SYM.indent}Rationale: ${String(dd.rationale)}`));
        if (dd.relatedNodeIds.length > 0) {
          parts.push(
            contentTextContract.parse(
              `${SYM.indent}Relates to: ${dd.relatedNodeIds.map((nid) => `#${String(nid)}`).join(', ')}`,
            ),
          );
        }
      }
    }
  }

  if (isQuestSectionInStageGuard({ section: 'contracts', stage })) {
    parts.push(contentTextContract.parse(''));
    parts.push(contentTextContract.parse(SYM.sectionHeaders.contracts));
    parts.push(contentTextContract.parse(''));
    if (quest.contracts.length === 0) {
      parts.push(contentTextContract.parse(SYM.none));
    } else {
      for (const c of quest.contracts) {
        const headerParts = [`#${String(c.id)}`, SYM.emDash, c.name, `(${c.kind}, ${c.status})`];
        if (c.source) {
          headerParts.push(`[${SYM.rightArrow} ${String(c.source)}]`);
        }
        parts.push(contentTextContract.parse(headerParts.join(' ')));

        if (c.properties.length > 0) {
          parts.push(
            ...questContractPropertiesToTextTransformer({
              properties: c.properties,
              depth: PROPERTY_START_DEPTH,
            }),
          );
        }
      }
    }
  }

  if (isQuestSectionInStageGuard({ section: 'toolingRequirements', stage })) {
    parts.push(contentTextContract.parse(''));
    parts.push(contentTextContract.parse(SYM.sectionHeaders.tooling));
    parts.push(contentTextContract.parse(''));
    if (quest.toolingRequirements.length === 0) {
      parts.push(contentTextContract.parse(SYM.none));
    } else {
      for (const t of quest.toolingRequirements) {
        parts.push(
          contentTextContract.parse(
            `#${String(t.id)}: "${String(t.name)}" (${String(t.packageName)})`,
          ),
        );
        parts.push(contentTextContract.parse(`${SYM.indent}Reason: ${String(t.reason)}`));
        if (t.requiredByObservables.length > 0) {
          parts.push(
            contentTextContract.parse(
              `${SYM.indent}Used by: ${t.requiredByObservables.map((oid) => `#${String(oid)}`).join(', ')}`,
            ),
          );
        }
      }
    }
  }

  if (isQuestSectionInStageGuard({ section: 'flows', stage })) {
    for (const flow of quest.flows) {
      parts.push(contentTextContract.parse(''));
      parts.push(
        contentTextContract.parse(
          `## Flow: #${String(flow.id)} ${SYM.emDash} "${String(flow.name)}"`,
        ),
      );
      if (flow.scope) {
        parts.push(contentTextContract.parse(`Scope: ${String(flow.scope)}`));
      }
      parts.push(
        contentTextContract.parse(
          `Entry: ${String(flow.entryPoint)} | Exits: ${flow.exitPoints.map((ep) => String(ep)).join(', ')}`,
        ),
      );
      parts.push(contentTextContract.parse(''));
      parts.push(...flowGraphToTextTransformer({ flow }));
    }
  }

  if (isQuestSectionInStageGuard({ section: 'operations', stage })) {
    parts.push(contentTextContract.parse(''));
    parts.push(contentTextContract.parse(SYM.sectionHeaders.operations));
    parts.push(contentTextContract.parse(''));
    if (quest.operations.length === 0) {
      parts.push(contentTextContract.parse(SYM.none));
    } else {
      for (const operation of quest.operations) {
        const lockedPart = operation.locked ? ' [locked]' : '';
        const wardModePart = operation.wardMode === undefined ? '' : ` (${operation.wardMode})`;
        const flowsPart =
          operation.flowIds.length === 0
            ? ''
            : ` [flows: ${operation.flowIds.map((flowId) => `#${String(flowId)}`).join(', ')}]`;
        parts.push(
          contentTextContract.parse(
            `#${String(operation.id)}: [${operation.role}${wardModePart}] ${String(operation.text)} ${SYM.emDash} ${operation.status}${lockedPart}${flowsPart}`,
          ),
        );
      }
    }
  }

  return contentTextContract.parse(parts.join('\n'));
};
