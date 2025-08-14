



import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useSchedule } from './hooks/useSchedule.ts';
import { useToast } from './hooks/useToast.tsx';
import { usePlanMode } from './hooks/usePlanMode.tsx';
import Modal from './components/Modal.tsx';
import WorkLogPanel from './components/WorkLogPanel.tsx';
import InfoWidgets from './components/InfoWidgets.tsx';
import { CalendarIcon, SunIcon, MoonIcon, ChartBarIcon, TableCellsIcon, PlusIcon } from './components/icons.tsx';
import { ScheduleEntry, Teacher, WorkLog, AIOptimizationResponse, AISuggestion, AIGeneratedScheduleResponse, ClassType } from './types.ts';
import { GoogleGenAI, Type } from "@google/genai";
import AIDropdown from './components/AIDropdown.tsx';
import PlanModeToggle from './components/PlanModeToggle.tsx';

type View = 'dashboard' | 'schedule';

// Lazy load components for code-splitting and better initial load performance
const Dashboard = lazy(() => import('./components/Dashboard.tsx'));
const ScheduleGrid = lazy(() => import('./components/ScheduleGrid.tsx'));
const DataTableView = lazy(() => import('./components/DataTableView.tsx'));
const ClassForm = lazy(() => import('./components/ScheduleForm.tsx'));
const WorkLogForm = lazy(() => import('./components/WorkLogForm.tsx'));
const AISuggestionsModal = lazy(() => import('./components/AISuggestionsModal.tsx'));
const AIGenerateScheduleModal = lazy(() => import('./components/AIGenerateScheduleModal.tsx'));
const CapacityProfileEditor = lazy(() => import('./components/CapacityProfileEditor.tsx'));


const LoadingFallback: React.FC = () => (
    <div className="flex justify-center items-center h-full min-h-[60vh] bg-gray-50 dark:bg-charcoal-black rounded-lg">
        <div className="text-center">
            <CalendarIcon className="h-12 w-12 text-lime-green animate-bounce mx-auto" />
            <p className="text-lg font-semibold mt-4">Carregando...</p>
        </div>
    </div>
);

const App: React.FC = () => {
  const scheduleHook = useSchedule();
  const {
    teachers,
    schedule,
    workloadData,
    addEntry,
    updateEntry,
    deleteEntry,
    getTeachersByIds,
    workLogs,
    checkIn,
    checkOut,
    addManualWorkLog,
    updateManualWorkLog,
    priorityList,
    shiftRoster,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    updatePriorityList,
    updateShiftRoster,
    isLoading,
    error,
    capacityProfiles,
    createProposal,
  } = scheduleHook;
  
  const addToast = useToast();
  const { isPlanningMode, activatePlanningMode, deactivatePlanningMode, setCurrentProposalId } = usePlanMode();

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [view, setView] = useState<View>('dashboard');
  
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  
  const [isWorkLogModalOpen, setIsWorkLogModalOpen] = useState(false);
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
  const [logFormTeacher, setLogFormTeacher] = useState<Teacher | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date('2025-08-11T12:00:00'));
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  
  const [isDataTableViewVisible, setIsDataTableViewVisible] = useState(false);
  
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [aiResponse, setAIResponse] = useState<AIOptimizationResponse | null>(null);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateResponse, setGenerateResponse] = useState<AIGeneratedScheduleResponse | null>(null);

  // State for CapacityProfileEditor
  const [isCapacityEditorOpen, setIsCapacityEditorOpen] = useState(false);
  const [editingTeacherForProfile, setEditingTeacherForProfile] = useState<Teacher | null>(null);


  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleOpenNewClass = () => {
    setEditingEntry(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditModal = useCallback((entry: ScheduleEntry) => {
    setEditingEntry(entry);
    setIsClassModalOpen(true);
  }, []);

  const handleCloseClassModal = () => {
    setIsClassModalOpen(false);
    setEditingEntry(null);
  };

  const handleSaveEntry = async (data: Omit<ScheduleEntry, 'id'>, id?: string) => {
    try {
      if (id) {
        await updateEntry(id, data);
        addToast({ type: 'success', message: 'Aula atualizada com sucesso!' });
      } else {
        await addEntry(data);
        addToast({ type: 'success', message: 'Nova aula criada com sucesso!' });
      }
      handleCloseClassModal();
    } catch (err) {
      addToast({ type: 'error', message: `Erro ao salvar: ${(err as Error).message}` });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
        await deleteEntry(id);
        addToast({ type: 'success', message: 'Aula excluída com sucesso!' });
        handleCloseClassModal();
    } catch (err) {
        addToast({ type: 'error', message: `Erro ao excluir: ${(err as Error).message}` });
    }
  };
  
  const handleOpenAddWorkLog = (teacher: Teacher) => {
      setLogFormTeacher(teacher);
      setEditingWorkLog(null);
      setIsWorkLogModalOpen(true);
  };
  
  const handleOpenEditWorkLog = (teacher: Teacher, log: WorkLog) => {
      setLogFormTeacher(teacher);
      setEditingWorkLog(log);
      setIsWorkLogModalOpen(true);
  };

  const handleCloseWorkLogModal = () => {
      setIsWorkLogModalOpen(false);
      setEditingWorkLog(null);
      setLogFormTeacher(null);
  };

  const handleSaveWorkLog = async (data: { teacherId: string; checkIn: Date; checkOut: Date }, logId?: string) => {
    try {
      if (logId) {
          await updateManualWorkLog(logId, data);
          addToast({ type: 'success', message: 'Registro de ponto atualizado!' });
      } else {
          await addManualWorkLog(data);
          addToast({ type: 'success', message: 'Registro de ponto adicionado!' });
      }
      handleCloseWorkLogModal();
    } catch (err) {
       addToast({ type: 'error', message: `Erro ao salvar registro: ${(err as Error).message}` });
    }
  };

  const handleOpenCapacityEditor = (teacher: Teacher) => {
      setEditingTeacherForProfile(teacher);
      setIsCapacityEditorOpen(true);
  };

  const weeklyScheduledHours = useMemo(() => {
    const hoursMap = new Map<string, number>();
    teachers.forEach(t => hoursMap.set(t.id, 0));

    schedule.forEach(entry => {
        const duration = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60);
        entry.teacherIds.forEach(teacherId => {
            hoursMap.set(teacherId, (hoursMap.get(teacherId) || 0) + duration);
        });
    });
    return Object.fromEntries(hoursMap);
  }, [schedule, teachers]);

  const handleAIOptimize = async () => {
    if (!process.env.API_KEY) {
        setAIError("A chave da API Gemini não está configurada. Por favor, configure a variável de ambiente API_KEY.");
        setIsAIModalOpen(true);
        return;
    }
    
    setIsAIModalOpen(true);
    setIsAILoading(true);
    setAIError(null);
    setAIResponse(null);

    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        
        const teacherDataForPrompt = teachers.map(t => ({
            id: t.id,
            name: t.name,
            type: t.type,
            contractedHours: t.contractedHours,
            currentScheduledHours: parseFloat((weeklyScheduledHours[t.id] || 0).toFixed(2))
        }));

        const scheduleDataForPrompt = schedule.map(e => ({
            id: e.id,
            classType: e.classType,
            day: e.day,
            startTime: e.startTime.toLocaleTimeString('pt-BR'),
            endTime: e.endTime.toLocaleTimeString('pt-BR'),
            teacherIds: e.teacherIds,
            isUnplanned: e.isUnplanned
        }));
        
        const prompt = `
            Você é um assistente especialista em otimização de horários para uma academia. Seu objetivo é analisar a lista de professores e o cronograma de aulas semanal para sugerir melhorias. Priorize o equilíbrio da carga horária dos professores de acordo com suas horas contratadas, reduzindo horas extras e utilizando professores subutilizados.

            Aqui estão os dados:

            ## Dados dos Professores (com horas contratadas e horas atualmente agendadas para a semana):
            ${JSON.stringify(teacherDataForPrompt, null, 2)}

            ## Grade Horária Semanal Atual:
            ${JSON.stringify(scheduleDataForPrompt, null, 2)}

            ## Tarefa:
            Analise os dados acima. Forneça uma lista de sugestões de realocação de professores para equilibrar melhor as horas agendadas em relação às horas contratadas. Forneça uma justificativa clara para cada sugestão. Por exemplo, se um professor está acima de suas horas contratadas e outro está abaixo, sugira mover uma aula do professor sobrecarregado para o subutilizado. Ignore as entradas com "isUnplanned: true". Sua resposta DEVE estar em conformidade com o esquema JSON fornecido.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "Um breve resumo de uma frase da estratégia geral de otimização." },
                suggestions: {
                    type: Type.ARRAY,
                    description: "Uma lista de sugestões concretas e acionáveis para melhorar o cronograma.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scheduleEntryId: { type: Type.STRING, description: "O ID da entrada do cronograma (aula) a ser modificada." },
                            newTeacherIds: { type: Type.ARRAY, description: "A nova lista de IDs de professores que devem ser atribuídos a esta aula.", items: { type: Type.STRING } },
                            reasoning: { type: Type.STRING, description: "Uma explicação concisa e amigável para o usuário sobre por que essa mudança é recomendada (por exemplo, 'Reduz as horas extras de Vitor, utiliza as horas contratadas de Wallace')." }
                        },
                        required: ["scheduleEntryId", "newTeacherIds", "reasoning"]
                    }
                }
            },
            required: ["summary", "suggestions"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonResponse = JSON.parse(response.text);
        setAIResponse(jsonResponse);

    } catch (err) {
        console.error("Gemini API Error:", err);
        setAIError(`Falha ao se comunicar com a IA. Detalhes: ${(err as Error).message}`);
    } finally {
        setIsAILoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!process.env.API_KEY) {
        setGenerateError("A chave da API Gemini não está configurada. Por favor, configure a variável de ambiente API_KEY.");
        setIsGenerateModalOpen(true);
        return;
    }

    setIsGenerateModalOpen(true);
    setIsGenerating(true);
    setGenerateError(null);
    setGenerateResponse(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const capacityProfilesForPrompt = capacityProfiles.map(p => {
            const teacher = teachers.find(t => t.id === p.teacherId);
            return {
                teacherId: p.teacherId,
                teacherName: teacher?.name,
                contractedHours: teacher?.contractedHours,
                availability: p.availability,
                constraints: p.constraints
            };
        });

        const classRequirementsPrompt = `
            - As aulas de 'Ambos' devem ter pelo menos um professor 'Titular'.
            - Aulas de 'Calistenia' e 'Escalada' podem ter professores 'Titular' ou 'Auxiliar'.
            - Aulas 'Calistenia Kids' devem ser ministradas por professores experientes (Vitor, GUTO).
            - A aula de 'Fisioterapia' é apenas na Quarta-feira às 10:00 com Mateus Fernandes (t9).
            - Deve haver 'Supervisão Horário Livre' de segunda a sexta, das 12:00 às 15:00.
            - O horário de funcionamento é das 06:00 às 21:00.
            - Tente preencher o máximo possível da grade, mas respeite a disponibilidade e as horas contratadas dos professores.
            - Distribua as aulas de forma equilibrada durante o dia (manhã, tarde, noite).
        `;

        const prompt = `
            Você é um especialista em logística e otimização de horários para uma academia. Sua tarefa é criar uma grade horária semanal completa e otimizada (de segunda a sexta) do zero.

            ## Dados dos Professores e Suas Disponibilidades (Perfis de Capacidade):
            ${JSON.stringify(capacityProfilesForPrompt, null, 2)}
            
            ## Requisitos e Regras para a Grade Horária:
            ${classRequirementsPrompt}

            ## Tarefa:
            Crie uma grade de aulas para a semana inteira (de Segunda (day=1) a Sexta (day=5)) que atenda a todos os requisitos.
            1.  **Respeite a disponibilidade**: Nunca agende um professor fora de seu horário disponível.
            2.  **Balanceie a carga horária**: Tente agendar os professores o mais próximo possível de suas horas contratadas, evitando excesso de horas ou subutilização.
            3.  **Cumpra as regras**: Siga todas as regras de alocação de professores e tipos de aula. Sua resposta DEVE estar em conformidade com o esquema JSON fornecido.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "Um resumo geral da grade gerada e das decisões tomadas." },
                warnings: {
                    type: Type.ARRAY,
                    description: "Uma lista de avisos sobre requisitos que não puderam ser totalmente atendidos ou possíveis problemas.",
                    items: { type: Type.STRING }
                },
                generatedClasses: {
                    type: Type.ARRAY,
                    description: "A lista de todas as aulas geradas para a semana.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            teacherIds: {
                                type: Type.ARRAY,
                                description: "Lista de IDs de professores para a aula.",
                                items: { type: Type.STRING }
                            },
                            startTime: { type: Type.STRING, description: "Horário de início no formato 'HH:mm'." },
                            endTime: { type: Type.STRING, description: "Horário de término no formato 'HH:mm'." },
                            day: { type: Type.INTEGER, description: "Dia da semana (1=Segunda, 5=Sexta)." },
                            classType: { type: Type.STRING, description: `Tipo da aula. Valores possíveis: ${Object.values(ClassType).join(', ')}.` }
                        },
                        required: ["teacherIds", "startTime", "endTime", "day", "classType"]
                    }
                }
            },
            required: ["summary", "warnings", "generatedClasses"]
        };
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonResponse = JSON.parse(response.text);
        setGenerateResponse(jsonResponse);

    } catch (err) {
        console.error("Gemini API Error:", err);
        setGenerateError(`Falha ao gerar a grade com a IA. Detalhes: ${(err as Error).message}`);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleApplySuggestion = async (suggestion: AISuggestion) => {
      try {
          await updateEntry(suggestion.scheduleEntryId, { teacherIds: suggestion.newTeacherIds });
          addToast({ type: 'success', message: 'Sugestão aplicada com sucesso!' });
          // Optionally, remove the applied suggestion from the list to clean up the modal
          setAIResponse(prev => {
              if (!prev) return null;
              return {
                  ...prev,
                  suggestions: prev.suggestions.filter(s => s.scheduleEntryId !== suggestion.scheduleEntryId),
              };
          });
      } catch (err) {
          addToast({ type: 'error', message: `Erro ao aplicar sugestão: ${(err as Error).message}` });
      }
  };

  const handleApplyGeneratedSchedule = async (response: AIGeneratedScheduleResponse) => {
    try {
        const baseDate = new Date('2025-08-11T00:00:00'); // Base Monday for pattern

        const newEntries: ScheduleEntry[] = response.generatedClasses.map((item, index) => {
            const [startHour, startMinute] = item.startTime.split(':').map(Number);
            const [endHour, endMinute] = item.endTime.split(':').map(Number);

            const getAbsDate = (day: number, hour: number, minute: number) => {
                const date = new Date(baseDate);
                date.setDate(baseDate.getDate() + (day - 1));
                date.setHours(hour, minute, 0, 0);
                return date;
            };

            return {
                id: `gen-${Date.now()}-${index}`,
                teacherIds: item.teacherIds,
                studentIds: [],
                day: item.day,
                startTime: getAbsDate(item.day, startHour, startMinute),
                endTime: getAbsDate(item.day, endHour, endMinute),
                classType: item.classType,
                isRecurring: true, // Assuming generated classes are part of a weekly pattern
            };
        });

        const newProposal = await createProposal({
            name: `Grade Gerada por IA - ${new Date().toLocaleString('pt-BR')}`,
            createdBy: 'IA Gemini',
            createdAt: new Date().toISOString(),
            status: 'draft',
            proposedEntries: newEntries,
            notes: response.summary,
            conflictAnalysis: { teacherConflicts: [], resourceConflicts: [], workloadIssues: [] },
        });

        await activatePlanningMode();
        setCurrentProposalId(newProposal.id);
        
        addToast({ type: 'success', message: 'Nova proposta de grade criada a partir da sugestão da IA!' });
        setIsGenerateModalOpen(false);

    } catch (err) {
        addToast({ type: 'error', message: `Erro ao aplicar a grade gerada: ${(err as Error).message}` });
    }
  };

  if (isDataTableViewVisible) {
      return (
          <Suspense fallback={<LoadingFallback />}>
              <DataTableView 
                  schedule={schedule} 
                  workLogs={workLogs} 
                  teachers={teachers} 
                  students={scheduleHook.students} 
                  onBack={() => setIsDataTableViewVisible(false)} 
              />
          </Suspense>
      );
  }

  const renderCurrentView = () => {
    if (isPlanningMode) {
        // NOTE: PlanningDashboard and PlanningScheduleGrid are not implemented yet.
        // This is a placeholder for when they are. For now, we show the operational view.
        return (
             <div className="text-center p-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <h2 className="text-2xl font-bold">Modo de Planejamento Ativo</h2>
                <p className="mt-2 text-yellow-800 dark:text-yellow-200">A funcionalidade de planejamento está em desenvolvimento.</p>
             </div>
        )
    }

    // Operational Mode View
    return view === 'dashboard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                  <Dashboard workloadData={workloadData} teachers={teachers} />
              </div>
              <div>
                  <WorkLogPanel 
                      teachers={teachers} 
                      workLogs={workLogs} 
                      onCheckIn={checkIn}
                      onCheckOut={checkOut}
                      onAddManualLog={handleOpenAddWorkLog}
                      onEditManualLog={handleOpenEditWorkLog}
                  />
              </div>
              <div className="lg:col-span-3">
                  <InfoWidgets
                      teachers={teachers}
                      priorityList={priorityList}
                      shiftRoster={shiftRoster}
                      announcements={announcements}
                      addAnnouncement={addAnnouncement}
                      deleteAnnouncement={deleteAnnouncement}
                      updatePriorityList={updatePriorityList}
                      updateShiftRoster={updateShiftRoster}
                  />
              </div>
        </div>
    ) : (
          <ScheduleGrid 
              entries={schedule}
              teachers={teachers}
              getTeacherById={scheduleHook.getTeacherById}
              getTeachersByIds={getTeachersByIds}
              onEditEntry={handleOpenEditModal}
              updateEntry={updateEntry}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              teacherFilter={teacherFilter}
              setTeacherFilter={setTeacherFilter}
          />
    );
  };


  return (
    <div className={'flex flex-col h-screen font-sans bg-gray-50 dark:bg-charcoal-black text-gray-800 dark:text-gray-200 transition-colors duration-300'}>
        <header className="flex-shrink-0 bg-white dark:bg-army-olive shadow-md z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center">
                        <CalendarIcon className="h-8 w-8 text-lime-green" />
                        <h1 className="text-xl font-bold ml-3 text-gray-900 dark:text-white">
                            Schedule Manager
                        </h1>
                    </div>
                    
                    <nav className="flex items-center space-x-4">
                        <PlanModeToggle />
                        <button
                            onClick={() => setView('dashboard')}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${view === 'dashboard' ? 'bg-lime-green text-charcoal-black' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-army-olive-light'}`}
                        >
                            <ChartBarIcon className="h-5 w-5" />
                            <span>Dashboard</span>
                        </button>
                        <button
                            onClick={() => setView('schedule')}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${view === 'schedule' ? 'bg-lime-green text-charcoal-black' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-army-olive-light'}`}
                        >
                            <TableCellsIcon className="h-5 w-5" />
                            <span>Grade</span>
                        </button>
                    </nav>

                    <div className="flex items-center space-x-4">
                        <AIDropdown onOptimize={handleAIOptimize} onGenerate={handleGenerateSchedule} />
                        <button
                            onClick={handleOpenNewClass}
                            className="flex items-center gap-2 bg-lime-green text-charcoal-black font-bold px-4 py-2 rounded-lg hover:brightness-110 transition-all duration-200 active:scale-95"
                        >
                            <PlusIcon className="h-5 w-5"/>
                            <span>Nova Aula</span>
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-army-olive-light transition-colors">
                            {theme === 'dark' ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-700" />}
                        </button>
                         <button onClick={() => setIsDataTableViewVisible(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-army-olive-light transition-colors">
                            <TableCellsIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
            </div>
        </header>

        {error && (
            <div className="bg-red-500 text-white p-4 text-center">
                <strong>Erro:</strong> {error}
            </div>
        )}
        
        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto">
                {isLoading ? (
                    <LoadingFallback />
                ) : (
                    <Suspense fallback={<LoadingFallback />}>
                      {renderCurrentView()}
                    </Suspense>
                )}
            </div>
        </main>
        
        <Modal 
            isOpen={isClassModalOpen} 
            onClose={handleCloseClassModal} 
            title={editingEntry ? "Editar Aula" : "Criar Nova Aula"}
        >
            <Suspense fallback={<div>Carregando formulário...</div>}>
                <ClassForm
                    entry={editingEntry}
                    teachers={teachers}
                    onSave={handleSaveEntry}
                    onCancel={handleCloseClassModal}
                    onDelete={handleDeleteEntry}
                />
            </Suspense>
        </Modal>

        <Modal
            isOpen={isWorkLogModalOpen}
            onClose={handleCloseWorkLogModal}
            title={editingWorkLog ? `Editar Ponto: ${logFormTeacher?.name}` : `Adicionar Ponto Manual: ${logFormTeacher?.name}`}
        >
            {logFormTeacher && (
                <Suspense fallback={<div>Carregando...</div>}>
                    <WorkLogForm 
                        teacher={logFormTeacher}
                        logToUpdate={editingWorkLog}
                        onSave={handleSaveWorkLog}
                        onCancel={handleCloseWorkLogModal}
                    />
                </Suspense>
            )}
        </Modal>

        <Suspense fallback={null}>
            <AISuggestionsModal 
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                isLoading={isAILoading}
                error={aiError}
                aiResponse={aiResponse}
                schedule={schedule}
                teachers={teachers}
                onApplySuggestion={handleApplySuggestion}
            />
        </Suspense>
        <Suspense fallback={null}>
            <AIGenerateScheduleModal 
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                isLoading={isGenerating}
                error={generateError}
                aiResponse={generateResponse}
                teachers={teachers}
                onApplySchedule={handleApplyGeneratedSchedule}
            />
        </Suspense>
        <Suspense fallback={null}>
            {isCapacityEditorOpen && editingTeacherForProfile && (
                <CapacityProfileEditor
                    teacher={editingTeacherForProfile}
                    onClose={() => setIsCapacityEditorOpen(false)}
                />
            )}
        </Suspense>
    </div>
  );
};

export default App;