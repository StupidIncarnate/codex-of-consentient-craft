/**
 * PURPOSE: Pass-through for the npm package 'react'. Code outside the gateway imports react
 * through here instead of the raw package, so a future guard or override on react lands in
 * this one file and reaches every caller.
 *
 * `@types/react`'s root declaration is `export = React;` — TypeScript hard-refuses `export *`
 * AND `export type *` against any `export =`-typed module (`TS2498`, unconditional, verified
 * against this exact package under both a commonjs and an ESNext module target) — so every value
 * and type this file re-exports is named explicitly rather than passed through with a wildcard.
 * A caller needing a react export not yet listed here adds one named line, same as any other
 * curated gateway subpath (`glob`, `@testing-library/react`).
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/react';
 */

export { default } from 'react';
export {
  Activity,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  act,
  cache,
  cacheSignal,
  captureOwnerStack,
  cloneElement,
  createContext,
  createElement,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  use,
  useActionState,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version,
} from 'react';
export type {
  ChangeEvent,
  ComponentType,
  CSSProperties,
  Dispatch,
  FC,
  KeyboardEvent,
  MouseEvent,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
  SetStateAction,
} from 'react';
