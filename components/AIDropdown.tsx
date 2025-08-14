import React from 'react';
import { SparklesIcon } from './icons.tsx';

interface AIDropdownProps {
    onOptimize: () => void;
    onGenerate: () => void;
}

const AIDropdown: React.FC<AIDropdownProps> = ({ onOptimize, onGenerate }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = (action: () => void) => {
        action();
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-2 bg-purple-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 active:scale-95"
            >
                <SparklesIcon className="h-5 w-5"/>
                <span>Ações com IA</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-army-olive rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-fast">
                    <ul className="text-gray-700 dark:text-gray-200">
                        <li>
                            <button
                                onClick={() => handleOptionClick(onOptimize)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-army-olive-light transition-colors"
                            >
                                <h4 className="font-semibold">Otimizar Grade Atual</h4>
                                <p className="text-xs text-gray-500 dark:text-sage">Sugerir melhorias para a grade existente.</p>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => handleOptionClick(onGenerate)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-army-olive-light transition-colors"
                            >
                                <h4 className="font-semibold">Gerar Nova Grade Semanal</h4>
                                <p className="text-xs text-gray-500 dark:text-sage">Criar uma grade do zero com base em regras.</p>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
             <style>{`
                @keyframes fade-in-fast {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-fast {
                animation: fade-in-fast 0.15s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AIDropdown;