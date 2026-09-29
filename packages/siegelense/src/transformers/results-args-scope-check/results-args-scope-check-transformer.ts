/**
 * PURPOSE: Refuses a `results` query whose `--where-*` or `--fields` flags cannot act on the kind it
 * reads — a filter outside its kinds would otherwise return the whole unfiltered view, and a
 * `--fields` name that matches nothing would otherwise vanish from every row. Runs on the parsed
 * args, after every flag's own value check, so a badly-shaped value still answers with its own
 * message first. Reach for this over `resultsArgsParseTransformer`'s own checks when the refusal
 * needs two flags at once (a filter and the `--kind` that scopes it).
 *
 * USAGE:
 * resultsArgsScopeCheckTransformer({ args: ResultsArgsStub({ where: { path: '/api', method: null, nth: null, level: null, steps: null } }) });
 * // Throws "--where-path filters network rows; add --kind network"
 */

import type { ResultsArgs } from '../../contracts/results-args/results-args-contract';
import { shotListingContract } from '../../contracts/shot-listing/shot-listing-contract';
import { stepReadingContract } from '../../contracts/step-reading/step-reading-contract';
import { resultsStatics } from '../../statics/results/results-statics';

export const resultsArgsScopeCheckTransformer = ({ args }: { args: ResultsArgs }): ResultsArgs => {
  const { where, kind, fields, since } = args;

  if (where !== null) {
    const scopes = [
      { scope: resultsStatics.whereScope.path, value: where.path },
      { scope: resultsStatics.whereScope.method, value: where.method },
      { scope: resultsStatics.whereScope.nth, value: where.nth },
      { scope: resultsStatics.whereScope.level, value: where.level },
      { scope: resultsStatics.whereScope.steps, value: where.steps },
    ];

    for (const { scope, value } of scopes) {
      const { kinds } = scope;
      if (value !== null && (kind === null || !kinds.some((name) => name === kind))) {
        const wanted = kinds.map((name) => `--kind ${name}`).join(' or ');
        throw new Error(
          kind === null
            ? `${scope.flag} filters ${scope.rows}; add ${wanted}`
            : `${scope.flag} filters ${scope.rows}; --kind ${kind} has nothing for it to filter. Use ${wanted}`,
        );
      }
    }
  }

  if (fields === null) {
    return args;
  }

  const readKind = kind ?? 'steps';
  const bufferFields = Object.entries(resultsStatics.fields).find(([name]) => name === readKind);
  const known =
    bufferFields === undefined
      ? readKind === 'screenshots'
        ? Object.keys(shotListingContract.shape)
        : readKind === 'steps'
          ? Object.keys(stepReadingContract.shape)
          : []
      : [...bufferFields[1], ...(since === null ? [] : resultsStatics.fields.sinceBootStamped)];
  const noun =
    Object.entries(resultsStatics.render.emptyNouns).find(([name]) => name === readKind)?.[1] ??
    `${readKind} readings`;

  for (const field of fields) {
    if (!known.includes(field)) {
      throw new Error(
        known.length === 0
          ? `--fields: no field "${field}" on ${noun}; they are raw log lines with no fields to pick`
          : `--fields: no field "${field}" on ${noun}; fields are: ${known.join(', ')}`,
      );
    }
  }
  return args;
};
