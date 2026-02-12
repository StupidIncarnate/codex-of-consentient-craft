/**
 * PURPOSE: Defines the ordered pipeline phases with display labels and progress calculation constants
 *
 * USAGE:
 * pipelinePhasesStatics.phases[0].label;
 * // Returns 'Pathseeker'
 */

export const pipelinePhasesStatics = {
  phases: [
    { key: 'pathseeker', label: 'Pathseeker' },
    { key: 'codeweaver', label: 'Codeweaver' },
    { key: 'ward', label: 'Ward' },
    { key: 'siegemaster', label: 'Siegemaster' },
    { key: 'lawbringer', label: 'Lawbringer' },
    { key: 'complete', label: 'Complete' },
  ],
  progressPercentageBase: 100,
} as const;
