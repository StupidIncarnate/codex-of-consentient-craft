/**
 * PURPOSE: Stub factory for ResponderAnnotationMap contract
 *
 * USAGE:
 * const map = ResponderAnnotationMapStub({ entries: [[filePath, annotation]] });
 * // Returns a validated empty Map by default, or a Map populated from entries
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../absolute-file-path/absolute-file-path-contract';
import { contentTextContract } from '../content-text/content-text-contract';
import type { ResponderAnnotation } from '../responder-annotation/responder-annotation-contract';
import {
  responderAnnotationMapContract,
  type ResponderAnnotationMap,
} from './responder-annotation-map-contract';

type Entry = readonly [AbsoluteFilePath, ResponderAnnotation];

interface StubProps {
  entries: readonly Entry[];
}

export const ResponderAnnotationMapStub = ({
  ...props
}: StubArgument<StubProps> = {}): ResponderAnnotationMap => {
  const rawEntries = props.entries ?? [];
  const initial = new Map<AbsoluteFilePath, ResponderAnnotation>();
  for (const item of rawEntries) {
    if (item === undefined) continue;
    const [key, value] = item;
    if (key === undefined || value === undefined) continue;
    const suffixInput = value.suffix;
    initial.set(absoluteFilePathContract.parse(key), {
      suffix:
        suffixInput === null || suffixInput === undefined
          ? null
          : contentTextContract.parse(suffixInput),
      childLines: (value.childLines ?? []).map((line) => contentTextContract.parse(line)),
    });
  }
  return responderAnnotationMapContract.parse(initial);
};
