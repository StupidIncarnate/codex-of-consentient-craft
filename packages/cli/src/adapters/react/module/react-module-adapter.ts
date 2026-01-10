/**
 * PURPOSE: Re-exports React for use in widgets that need JSX support
 *
 * USAGE:
 * import { reactModuleAdapter } from '../../adapters/react/module/react-module-adapter';
 * const React = reactModuleAdapter();
 * // Use in component for JSX namespace: React.JSX.Element
 */
import React from 'react';

export const reactModuleAdapter = (): typeof React => React;
