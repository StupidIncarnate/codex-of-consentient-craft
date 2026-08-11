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

  // The closed set every node tag, operation item and observable draws its package names from.
  // Rendered as its own section rather than inline on each item that references it: an entry is a
  // three-field record (location, change type, kind) and repeating it per reference would scale the
  // render by the ledger and the graph instead of by the package count. `usedBy` is printed only
  // for a `new` package, where it is the only source of reverse edges the dependency graph has.
  if (isQuestSectionInStageGuard({ section: 'packagesAffected', stage })) {
    parts.push(contentTextContract.parse(''));
    parts.push(contentTextContract.parse(SYM.sectionHeaders.packagesAffected));
    parts.push(contentTextContract.parse(''));
    if (quest.packagesAffected.length === 0) {
      parts.push(contentTextContract.parse(SYM.none));
    } else {
      for (const entry of quest.packagesAffected) {
        parts.push(
          contentTextContract.parse(
            `${String(entry.name)} ${SYM.emDash} ${entry.changeType}, ${entry.packageType} [${String(entry.location)}]`,
          ),
        );
        if (entry.usedBy !== undefined && entry.usedBy.length > 0) {
          parts.push(
            contentTextContract.parse(
              `${SYM.indent}Used by: ${entry.usedBy.map((name) => String(name)).join(', ')}`,
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
        // The second scope axis, rendered beside the first: `flowIds` says where on the spine an
        // item sits, `packageNames` says where on disk it lands, and a reader reconciling the ledger
        // against the slicing needs both on one line. Names only — the kind and change type of each
        // package belong to `packagesAffected`, and repeating them per item would scale this section
        // by the ledger length instead of by the package count.
        const packagesPart =
          operation.packageNames.length === 0
            ? ''
            : ` [packages: ${operation.packageNames.map((name) => String(name)).join(', ')}]`;
        parts.push(
          contentTextContract.parse(
            `#${String(operation.id)}: [${operation.role}${wardModePart}] ${String(operation.text)} ${SYM.emDash} ${operation.status}${lockedPart}${flowsPart}${packagesPart}`,
          ),
        );
      }
    }
  }

  // Quest notes are the durable side channel — open questions, tooling errors, out-of-scope
  // observations, walk resets. Unlike every section above, an EMPTY notes list renders nothing at
  // all: a note carries no obligation to reconcile, so an empty `## Quest Notes` header would spend
  // every reader's context stating the absence of something nobody owes an answer to. A section
  // that only appears when it has content is also how a reader knows a note is worth reading.
  if (
    isQuestSectionInStageGuard({ section: 'planningNotes', stage }) &&
    quest.planningNotes.questNotes.length > 0
  ) {
    parts.push(contentTextContract.parse(''));
    parts.push(contentTextContract.parse(SYM.sectionHeaders.questNotes));
    parts.push(contentTextContract.parse(''));
    for (const note of quest.planningNotes.questNotes) {
      parts.push(
        contentTextContract.parse(
          `#${String(note.id)}: [${note.kind}] ${String(note.role)} ${SYM.emDash} ${String(note.summary)}`,
        ),
      );
      parts.push(contentTextContract.parse(`${SYM.indent}Detail: ${String(note.detail)}`));
      if (note.flowId !== undefined) {
        parts.push(contentTextContract.parse(`${SYM.indent}Flow: #${String(note.flowId)}`));
      }
      if (note.unitId !== undefined) {
        parts.push(contentTextContract.parse(`${SYM.indent}Unit: ${String(note.unitId)}`));
      }
    }
  }

  return contentTextContract.parse(parts.join('\n'));
};
