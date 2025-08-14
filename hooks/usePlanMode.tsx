import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSchedule } from './useSchedule.ts';
import { ScheduleProposal } from '../types.ts';

interface PlanModeContextType {
  isPlanningMode: boolean;
  activatePlanningMode: () => Promise<void>;
  deactivatePlanningMode: () => void;
  currentProposalId: string | null;
  setCurrentProposalId: (id: string | null) => void;
  createNewProposal: () => Promise<string>;
}

const PlanModeContext = createContext<PlanModeContextType | undefined>(undefined);

export const PlanModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlanningMode, setIsPlanningMode] = useState(false);
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null);
  const scheduleHook = useSchedule();
  
  const createNewProposal = useCallback(async (): Promise<string> => {
    const newProposal = await scheduleHook.createProposal({
      name: `Novo Plano ${new Date().toLocaleDateString('pt-BR')}`,
      createdBy: 'current-user-id', // Placeholder
      createdAt: new Date().toISOString(),
      status: 'draft',
      proposedEntries: scheduleHook.schedule, // Base new proposal on current schedule
      conflictAnalysis: { teacherConflicts: [], resourceConflicts: [], workloadIssues: [] },
    });
    return newProposal.id;
  }, [scheduleHook]);
  
  const activatePlanningMode = useCallback(async () => {
    setIsPlanningMode(true);
    // Auto-create a new proposal when entering planning mode for the first time
    if(scheduleHook.proposals.length === 0) {
        const newProposalId = await createNewProposal();
        setCurrentProposalId(newProposalId);
    } else if (!currentProposalId) {
        // If proposals exist but none is active, activate the first one
        setCurrentProposalId(scheduleHook.proposals[0].id);
    }
  }, [createNewProposal, currentProposalId, scheduleHook.proposals]);
  
  const deactivatePlanningMode = () => {
    setIsPlanningMode(false);
    // We can keep currentProposalId to remember the last used plan
  };

  return (
    <PlanModeContext.Provider value={{
      isPlanningMode,
      activatePlanningMode,
      deactivatePlanningMode,
      currentProposalId,
      setCurrentProposalId,
      createNewProposal
    }}>
      {children}
    </PlanModeContext.Provider>
  );
};

export const usePlanMode = () => {
  const context = useContext(PlanModeContext);
  if (context === undefined) {
    throw new Error('usePlanMode must be used within a PlanModeProvider');
  }
  return context;
};