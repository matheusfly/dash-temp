import React from 'react';
import { usePlanMode } from '../hooks/usePlanMode.tsx';
import { ClipboardIcon, RectangleStackIcon } from './icons.tsx';

const PlanModeToggle: React.FC = () => {
    const { isPlanningMode, activatePlanningMode, deactivatePlanningMode } = usePlanMode();

    return (
        <div className="flex items-center p-1 bg-gray-200 dark:bg-charcoal-black rounded-lg text-xs font-bold">
            <button
                onClick={deactivatePlanningMode}
                disabled={!isPlanningMode}
                className={`px-3 py-1.5 rounded-md transition-colors duration-300 flex items-center gap-2 ${
                    !isPlanningMode
                        ? 'bg-white dark:bg-army-olive-light shadow text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-sage'
                }`}
            >
                <RectangleStackIcon className="h-4 w-4" />
                <span>Operacional</span>
            </button>
            <button
                onClick={activatePlanningMode}
                disabled={isPlanningMode}
                className={`px-3 py-1.5 rounded-md transition-colors duration-300 flex items-center gap-2 ${
                    isPlanningMode
                        ? 'bg-white dark:bg-army-olive-light shadow text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-sage'
                }`}
            >
                <ClipboardIcon className="h-4 w-4" />
                <span>Planejamento</span>
            </button>
        </div>
    );
};

export default PlanModeToggle;