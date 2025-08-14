import React from 'react';
import { AIGeneratedScheduleResponse, Teacher } from '../types.ts';
import Modal from './Modal.tsx';
import { SparklesIcon, XIcon, CheckIcon, ExclamationTriangleIcon } from './icons.tsx';

interface AIGenerateScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    aiResponse: AIGeneratedScheduleResponse | null;
    teachers: Teacher[];
    onApplySchedule: (response: AIGeneratedScheduleResponse) => void;
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const LoadingState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-96 text-center">
        <SparklesIcon className="h-16 w-16 text-lime-green animate-pulse" />
        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Gerando Grade...</h3>
        <p className="mt-1 text-gray-500 dark:text-sage">A IA está montando a grade horária ideal. Isso pode levar um minuto.</p>
    </div>
);

const ErrorState: React.FC<{ error: string; onClose: () => void }> = ({ error, onClose }) => (
    <div className="flex flex-col items-center justify-center h-96 text-center">
        <XIcon className="h-16 w-16 text-red-500" />
        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Ocorreu um erro</h3>
        <p className="mt-1 text-gray-500 dark:text-sage max-w-sm">{error}</p>
        <button onClick={onClose} className="mt-6 bg-lime-green text-charcoal-black font-bold px-6 py-2 rounded-lg hover:brightness-110">
            Fechar
        </button>
    </div>
);

const AIGenerateScheduleModal: React.FC<AIGenerateScheduleModalProps> = ({ isOpen, onClose, isLoading, error, aiResponse, teachers, onApplySchedule }) => {
    
    const getTeacherName = (id: string): string => teachers.find(t => t.id === id)?.name.split(' ')[0] || 'N/A';
    
    const renderContent = () => {
        if (isLoading) return <LoadingState />;
        if (error) return <ErrorState error={error} onClose={onClose} />;
        if (!aiResponse) return null;
        
        return (
            <div>
                <div className="p-4 bg-gray-100 dark:bg-charcoal-black/50 rounded-lg mb-4">
                    <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">{aiResponse.summary}</p>
                </div>

                {aiResponse.warnings.length > 0 && (
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mb-4 border border-yellow-300 dark:border-yellow-700">
                        <div className="flex items-start">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Avisos da IA</h4>
                                <ul className="list-disc list-inside mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                    {aiResponse.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto p-1 -m-1">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiResponse.generatedClasses.sort((a,b) => a.day - b.day || a.startTime.localeCompare(b.startTime)).map((item, index) => (
                            <div key={index} className="bg-white dark:bg-army-olive-light/50 p-3 rounded-lg border border-gray-200 dark:border-khaki-border/30">
                                <p className="font-bold text-gray-900 dark:text-white">{item.classType}</p>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    <p>{dayNames[item.day]}, {item.startTime} - {item.endTime}</p>
                                    <p>Prof: {item.teacherIds.map(getTeacherName).join(', ')}</p>
                                </div>
                            </div>
                        ))}
                   </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={() => onApplySchedule(aiResponse)} className="bg-lime-green text-charcoal-black font-bold px-6 py-2 rounded-lg hover:brightness-110 transition-transform duration-200 active:scale-95 flex items-center gap-2">
                        <CheckIcon className="h-5 w-5" />
                        Aplicar como Proposta
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Grade Gerada por IA">
            <div className="min-h-96">
                {renderContent()}
            </div>
        </Modal>
    );
};

export default AIGenerateScheduleModal;