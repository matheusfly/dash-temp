import React, { useMemo } from 'react';
import { AIOptimizationResponse, AISuggestion, ScheduleEntry, Teacher } from '../types.ts';
import Modal from './Modal.tsx';
import { SparklesIcon, XIcon, CheckIcon, ArrowLongRightIcon } from './icons.tsx';

interface AISuggestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    aiResponse: AIOptimizationResponse | null;
    schedule: ScheduleEntry[];
    teachers: Teacher[];
    onApplySuggestion: (suggestion: AISuggestion) => void;
}

const formatTime = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const LoadingState: React.FC = () => {
    const messages = ["Analisando o cronograma...", "Calculando cargas de trabalho...", "Encontrando otimizações...", "Gerando sugestões inteligentes..."];
    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        let index = 0;
        const intervalId = setInterval(() => {
            index = (index + 1) % messages.length;
            setMessage(messages[index]);
        }, 2500);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
            <SparklesIcon className="h-16 w-16 text-lime-green animate-pulse" />
            <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Otimizando...</h3>
            <p className="mt-1 text-gray-500 dark:text-sage">{message}</p>
        </div>
    );
};

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

const SuggestionCard: React.FC<{
    suggestion: AISuggestion;
    entry: ScheduleEntry;
    getTeacherName: (id: string) => string;
    onApply: () => void;
}> = ({ suggestion, entry, getTeacherName, onApply }) => {
    const originalTeachers = entry.teacherIds.map(getTeacherName).join(', ');
    const suggestedTeachers = suggestion.newTeacherIds.map(getTeacherName).join(', ');

    return (
        <div className="bg-white dark:bg-army-olive-light/50 p-4 rounded-lg border border-gray-200 dark:border-khaki-border/30">
            <div className="mb-3">
                <p className="font-bold text-gray-900 dark:text-white">{entry.classType}</p>
                <p className="text-sm text-gray-500 dark:text-sage">{dayNames[entry.day]}, {formatTime(entry.startTime)} - {formatTime(entry.endTime)}</p>
            </div>
            <div className="mb-4">
                <p className="text-xs font-semibold uppercase text-lime-green mb-1">Justificativa</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion.reasoning}</p>
            </div>
            <div className="flex items-center justify-between gap-4">
                <div className="text-center">
                    <p className="text-xs font-medium text-gray-500 dark:text-sage">Antes</p>
                    <p className="font-semibold text-gray-800 dark:text-white truncate max-w-24">{originalTeachers}</p>
                </div>
                <ArrowLongRightIcon className="h-6 w-6 text-gray-400 dark:text-sage flex-shrink-0" />
                 <div className="text-center">
                    <p className="text-xs font-medium text-gray-500 dark:text-sage">Sugestão</p>
                    <p className="font-semibold text-lime-green truncate max-w-24">{suggestedTeachers}</p>
                </div>
                 <button onClick={onApply} className="ml-auto bg-lime-green text-charcoal-black font-bold px-3 py-1.5 rounded-lg hover:brightness-110 transition-all text-sm active:scale-95 flex items-center gap-1.5">
                    <CheckIcon className="h-4 w-4" />
                    Aplicar
                </button>
            </div>
        </div>
    );
};


const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({ isOpen, onClose, isLoading, error, aiResponse, schedule, teachers, onApplySuggestion }) => {
    
    const getTeacherName = (id: string): string => teachers.find(t => t.id === id)?.name || 'Desconhecido';
    
    const scheduleMap = useMemo(() => {
        const map = new Map<string, ScheduleEntry>();
        schedule.forEach(entry => map.set(entry.id, entry));
        return map;
    }, [schedule]);
    
    const renderContent = () => {
        if (isLoading) return <LoadingState />;
        if (error) return <ErrorState error={error} onClose={onClose} />;
        if (!aiResponse || aiResponse.suggestions.length === 0) {
            return (
                 <div className="flex flex-col items-center justify-center h-96 text-center">
                    <CheckIcon className="h-16 w-16 text-lime-green" />
                    <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Tudo Certo!</h3>
                    <p className="mt-1 text-gray-500 dark:text-sage">A IA analisou o cronograma e não encontrou nenhuma otimização óbvia.</p>
                </div>
            )
        }
        
        return (
            <div>
                 <div className="p-4 bg-gray-100 dark:bg-charcoal-black/50 rounded-lg mb-4">
                    <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">{aiResponse.summary}</p>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1 -m-1">
                    {aiResponse.suggestions.map(suggestion => {
                        const entry = scheduleMap.get(suggestion.scheduleEntryId);
                        if (!entry) return null;
                        return (
                            <SuggestionCard 
                                key={suggestion.scheduleEntryId}
                                suggestion={suggestion}
                                entry={entry}
                                getTeacherName={getTeacherName}
                                onApply={() => onApplySuggestion(suggestion)}
                            />
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Otimizador de Grade com IA">
            <div className="min-h-96">
                {renderContent()}
            </div>
        </Modal>
    );
};

export default AISuggestionsModal;