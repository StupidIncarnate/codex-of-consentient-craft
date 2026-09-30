/**
 * PURPOSE: Builds a valid AttrsBudget for tests
 *
 * USAGE:
 * AttrsBudgetStub();
 * // Returns a valid AttrsBudget
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { attrsBudgetContract } from './attrs-budget-contract';
import type { AttrsBudget } from './attrs-budget-contract';

export const AttrsBudgetStub = ({ ...props }: StubArgument<AttrsBudget> = {}): AttrsBudget =>
  attrsBudgetContract.parse({ kept: [], dropped: 0, ...props });
