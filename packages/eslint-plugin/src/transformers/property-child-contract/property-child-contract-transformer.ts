/**
 * PURPOSE: Reads the contract a property holds whole from the property's source text: `quest:
 * questContract` gives `questContract`. A wrapped value (`questContract.optional()`) and any other
 * value give null, since only a bare contract is a child that is always there.
 *
 * USAGE:
 * propertyChildContractTransformer({ text: 'quest: questContract' });
 * // Returns 'questContract'; null for 'quest: questContract.optional()'
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';

const CHILD_TEXT = /^[A-Za-z0-9_]+\s*:\s*([A-Za-z0-9_]+Contract)$/u;

export const propertyChildContractTransformer = ({ text }: { text: string }): Identifier | null => {
  const match = CHILD_TEXT.exec(text.trim())?.[1];
  return match === undefined || match === 'Contract' ? null : identifierContract.parse(match);
};
