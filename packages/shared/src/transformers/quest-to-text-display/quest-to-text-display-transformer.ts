/**
 * PURPOSE: Transforms a Quest object into a human-readable text display format with flow graph visualization
 *
 * USAGE:
 * const text = questToTextDisplayTransformer({quest: QuestStub()});
 * // Returns: branded ContentText string with full quest display
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { Quest } from '../../contracts/quest/quest-contract';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';
import { flowGraphToTextTransformer } from '../flow-graph-to-text/flow-graph-to-text-transformer';
import { questContractPropertiesToTextTransformer } from '../quest-contract-properties-to-text/quest-contract-properties-to-text-transformer';

const SYM = textDisplaySymbolsStatics;
const PROPERTY_START_DEPTH = 1;

export const questToTextDisplayTransformer = ({ quest }: { quest: Quest }): ContentText => {
  const parts: ContentText[] = [];

  parts.push(contentTextContract.parse(SYM.legendLines.join('\n')));
  parts.push(contentTextContract.parse(''));
  parts.push(contentTextContract.parse(`# Quest: ${String(quest.title)}`));
  parts.push(contentTextContract.parse(`Status: ${quest.status}`));

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

  parts.push(contentTextContract.parse(''));
  parts.push(contentTextContract.parse(SYM.sectionHeaders.steps));
  parts.push(contentTextContract.parse(''));
  if (quest.steps.length === 0) {
    parts.push(contentTextContract.parse(SYM.none));
  } else {
    for (const step of quest.steps) {
      parts.push(contentTextContract.parse(`#${step.id}: "${step.name}"`));
      parts.push(
        contentTextContract.parse(
          `${SYM.indent}Assertions: ${step.assertions.map((a) => `${a.prefix}: ${a.input} => ${a.expected}`).join('; ')}`,
        ),
      );
      parts.push(
        contentTextContract.parse(
          `${SYM.indent}Focus: ${step.focusFile.path} (${step.focusFile.action})`,
        ),
      );
      if (step.accompanyingFiles.length > 0) {
        parts.push(
          contentTextContract.parse(
            `${SYM.indent}Accompanying: ${step.accompanyingFiles.map((f) => `${f.path} (${f.action})`).join(', ')}`,
          ),
        );
      }
      if (step.observablesSatisfied.length > 0) {
        parts.push(
          contentTextContract.parse(
            `${SYM.indent}Satisfies: ${step.observablesSatisfied.map((oid) => `#${String(oid)}`).join(', ')}`,
          ),
        );
      }
      if (step.dependsOn.length > 0) {
        parts.push(
          contentTextContract.parse(
            `${SYM.indent}Depends on: ${step.dependsOn.map((sid) => `#${String(sid)}`).join(', ')}`,
          ),
        );
      }
      if (step.exportName) {
        parts.push(contentTextContract.parse(`${SYM.indent}Export: ${String(step.exportName)}`));
      }
      parts.push(
        contentTextContract.parse(
          `${SYM.indent}Contracts in: ${step.inputContracts.map((c) => String(c)).join(', ')} | out: ${step.outputContracts.map((c) => String(c)).join(', ')}`,
        ),
      );
      if (step.uses.length > 0) {
        parts.push(
          contentTextContract.parse(
            `${SYM.indent}Uses: ${step.uses.map((u) => String(u)).join(', ')}`,
          ),
        );
      }
    }
  }

  return contentTextContract.parse(parts.join('\n'));
};
