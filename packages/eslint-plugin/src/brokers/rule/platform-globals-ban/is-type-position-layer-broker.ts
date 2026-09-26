/**
 * PURPOSE: Tells whether an identifier sits in a type position — `useRef<HTMLDivElement>`, a
 * `Buffer` parameter type, `NodeJS.ErrnoException` (the qualifier `NodeJS` sits in a
 * TSQualifiedName). A type never runs, so platform-globals-ban never checks one. Names the
 * identifier's own parent, never a grandparent, because nothing else can sit directly between an
 * identifier and the type node that names it.
 *
 * USAGE:
 * isTypePositionLayerBroker({ node: TsestreeStub({ parent: TsestreeStub({ type: 'TSTypeReference' }) }) });
 * // Returns true
 */
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const isTypePositionLayerBroker = ({ node }: { node: Tsestree }): boolean => {
  const parentType = node.parent?.type;
  return parentType === 'TSTypeReference' || parentType === 'TSQualifiedName';
};
