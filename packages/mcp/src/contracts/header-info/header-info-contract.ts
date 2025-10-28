/**
 * PURPOSE: Type for header information extracted from markdown files
 *
 * USAGE:
 * const headerInfo = HeaderInfoStub({ lineIndex: LineIndexStub({ value: 10 }), headerText: HeaderTextStub({ value: '## Section Title' }) });
 *
 * RELATED: line-index-contract, header-text-contract
 */

import { z } from 'zod';
import { lineIndexContract } from '../line-index/line-index-contract';
import { headerTextContract } from '../header-text/header-text-contract';

export const headerInfoContract = z.object({
  lineIndex: lineIndexContract,
  headerText: headerTextContract,
});

export type HeaderInfo = z.infer<typeof headerInfoContract>;
