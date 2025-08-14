import { useState, useMemo, useCallback, useEffect } from 'react';
import { Teacher, Student, ScheduleEntry, Workload, WorkLog, PriorityList, ShiftRoster, Announcement, ScheduleProposal, CapacityProfile } from '../types.ts';
import { api } from '../services/api.ts';

const getDayName = (dayIndex: number): string => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayIndex];
};

const calculateTotalHours = (entries: ScheduleEntry[]): number => {
    return entries.reduce((total, entry) => {
        const duration = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60);
        return total + duration;
    }, 0);
};

export const useSchedule = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [priorityList, setPriorityList] = useState<PriorityList>({ titulares: [], auxiliares: [] });
  const [shiftRoster, setShiftRoster] = useState<ShiftRoster>({ morning: [], afternoon: [] });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // PlanMode State
  const [proposals, setProposals] = useState<ScheduleProposal[]>([]);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [capacityProfiles, setCapacityProfiles] = useState<CapacityProfile[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await api.fetchInitialData();
        setTeachers(data.teachers);
        setStudents(data.students);
        setSchedule(data.schedule);
        setWorkLogs(data.workLogs);
        setPriorityList(data.priorityList);
        setShiftRoster(data.shiftRoster);
        setAnnouncements(data.announcements);
        setCapacityProfiles(data.capacityProfiles);
        setProposals(data.scheduleProposals);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const workloadData = useMemo<Workload[]>(() => {
    if (isLoading) return [];
    // The live timer is handled by the TimeDuration component in WorkLogPanel.
    // For the dashboard, we only need to re-calculate when workLogs change.
    // For active logs, we use the current time when the function runs.
    const now = new Date().getTime();
    return teachers.map(teacher => {
      const workedHours = workLogs
        .filter(log => log.teacherId === teacher.id)
        .reduce((total, log) => {
          const endTime = log.checkOut ? log.checkOut.getTime() : now;
          const duration = (endTime - log.checkIn.getTime()) / (1000 * 60 * 60);
          return total + duration;
        }, 0);

      const overtime = Math.max(0, workedHours - teacher.contractedHours);
      const deficit = Math.max(0, teacher.contractedHours - workedHours);

      return {
        teacherId: teacher.id,
        workedHours: parseFloat(workedHours.toFixed(2)),
        contractedHours: teacher.contractedHours,
        overtime: parseFloat(overtime.toFixed(2)),
        deficit: parseFloat(deficit.toFixed(2)),
      };
    });
  }, [workLogs, teachers, isLoading]);

  const addEntry = useCallback(async (entryData: Omit<ScheduleEntry, 'id'>) => {
    const newEntry = await api.addEntry(entryData);
    setSchedule(prev => [...prev, newEntry]);
    return newEntry;
  }, []);
  
  const updateEntry = useCallback(async (entryId: string, updatedData: Partial<Omit<ScheduleEntry, 'id'>>) => {
    const updatedEntry = await api.updateEntry(entryId, updatedData);
    setSchedule(prev => prev.map(e => e.id === entryId ? updatedEntry : e));
  }, []);

  const deleteEntry = useCallback(async (entryId: string) => {
    await api.deleteEntry(entryId);
    setSchedule(prev => prev.filter(entry => entry.id !== entryId));
  }, []);

  const checkIn = useCallback(async (teacherId: string, checkInTime: Date) => {
    const { newLog, updatedEntry } = await api.checkIn(teacherId, checkInTime);
    setWorkLogs(prev => [...prev, newLog]);
    if (updatedEntry) {
        // This handles both linking a planned entry and creating an unplanned one
        const isNewEntry = !schedule.some(e => e.id === updatedEntry.id);
        if (isNewEntry) {
            setSchedule(prev => [...prev, updatedEntry]);
        } else {
            setSchedule(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
        }
    }
  }, [schedule]);
  
  const checkOut = useCallback(async (logId: string, checkOutTime: Date) => {
    const { updatedLog, updatedEntry } = await api.checkOut(logId, checkOutTime);
    setWorkLogs(prev => prev.map(log => log.id === logId ? updatedLog : log));
    if (updatedEntry) {
        setSchedule(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
    }
  }, []);

  const addManualWorkLog = useCallback(async (data: { teacherId: string; checkIn: Date; checkOut: Date }) => {
    const { newLog, newEntry } = await api.addManualWorkLog(data);
    setWorkLogs(prev => [...prev, newLog]);
    setSchedule(prev => [...prev, newEntry]);
  }, []);

  const updateManualWorkLog = useCallback(async (logId: string, data: { checkIn: Date; checkOut: Date }) => {
    const { updatedLog, updatedEntry } = await api.updateManualWorkLog(logId, data);
    setWorkLogs(prev => prev.map(log => log.id === logId ? updatedLog : log));
    if (updatedEntry) {
        setSchedule(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
    }
  }, []);

  const addAnnouncement = useCallback(async (message: string) => {
      const newAnnouncement = await api.addAnnouncement(message);
      setAnnouncements(prev => [newAnnouncement, ...prev]);
  }, []);

  const deleteAnnouncement = useCallback(async (announcementId: string) => {
      await api.deleteAnnouncement(announcementId);
      setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
  }, []);
  
  const updatePriorityList = useCallback(async (newList: PriorityList) => {
    const updatedList = await api.updatePriorityList(newList);
    setPriorityList(updatedList);
  }, []);
  
  const updateShiftRoster = useCallback(async (newRoster: ShiftRoster) => {
    const updatedRoster = await api.updateShiftRoster(newRoster);
    setShiftRoster(updatedRoster);
  }, []);
  
  const addCapacityProfile = useCallback(async (profile: CapacityProfile) => {
    const newProfile = await api.addCapacityProfile(profile);
    setCapacityProfiles(prev => [...prev, newProfile]);
    return newProfile;
  }, []);

  const updateCapacityProfile = useCallback(async (profileId: string, updates: Partial<CapacityProfile>) => {
    const updatedProfile = await api.updateCapacityProfile(profileId, updates);
    setCapacityProfiles(prev => prev.map(p => p.id === profileId ? updatedProfile : p));
    return updatedProfile;
  }, []);

  // --- PlanMode Functions ---
  const activeProposal = useMemo(() => proposals.find(p => p.id === activeProposalId), [proposals, activeProposalId]);

  const createProposal = useCallback(async (proposalData: Omit<ScheduleProposal, 'id'>) => {
    const newProposal = await api.createProposal(proposalData);
    setProposals(prev => [...prev, newProposal]);
    setActiveProposalId(newProposal.id);
    return newProposal;
  }, []);

  const updateProposal = useCallback(async (proposalId: string, updates: Partial<ScheduleProposal>) => {
    const updatedProposal = await api.updateProposal(proposalId, updates);
    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));
    return updatedProposal;
  }, []);

  const planningAnalysis = useMemo(() => {
    if (!activeProposal) return null;

    const analysis = {
      capacityIssues: [] as { teacherId: string; issues: string[] }[],
      resourceConflicts: [] as { resourceId: string; conflicts: string[] }[],
      workloadBalance: {
        overCapacity: [] as string[],
        underCapacity: [] as string[],
        balanced: [] as string[]
      }
    };
    
    activeProposal.proposedEntries.forEach(entry => {
      entry.teacherIds.forEach(teacherId => {
        const profile = capacityProfiles.find(p => p.teacherId === teacherId && p.isCurrent);
        if (!profile) return;
        
        const entryDay = new Date(entry.startTime).getDay();
        const dayAvailability = profile.availability.find(a => a.day === entryDay);
        
        if (dayAvailability && !dayAvailability.isAvailable) {
          analysis.capacityIssues.push({
            teacherId,
            issues: [`Indisponível na ${getDayName(entryDay)}`]
          });
        }
      });
    });
    
    const teacherWorkloads = teachers.map(teacher => {
      const teacherEntries = activeProposal.proposedEntries.filter(
        e => e.teacherIds.includes(teacher.id)
      );
      const hours = calculateTotalHours(teacherEntries);
      return {
        teacherId: teacher.id,
        hours,
        contracted: teacher.contractedHours,
        variance: hours - teacher.contractedHours
      };
    });
    
    analysis.workloadBalance.overCapacity = teacherWorkloads
      .filter(w => w.variance > 2)
      .map(w => w.teacherId);
      
    analysis.workloadBalance.underCapacity = teacherWorkloads
      .filter(w => w.variance < -2)
      .map(w => w.teacherId);
      
    analysis.workloadBalance.balanced = teacherWorkloads
      .filter(w => Math.abs(w.variance) <= 2)
      .map(w => w.teacherId);
    
    return analysis;
  }, [activeProposal, capacityProfiles, teachers]);


  const getTeacherById = useCallback((id: string) => teachers.find(t => t.id === id), [teachers]);
  const getTeachersByIds = useCallback((ids: string[]) => teachers.filter(t => ids.includes(t.id)), [teachers]);
  const getStudentById = useCallback((id: string) => students.find(s => s.id === id), [students]);

  return { 
      teachers, 
      students, 
      schedule, 
      workloadData,
      addEntry,
      updateEntry, 
      deleteEntry, 
      getTeacherById, 
      getTeachersByIds,
      getStudentById,
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
      // Capacity and Planning
      addCapacityProfile,
      updateCapacityProfile,
      capacityProfiles,
      proposals,
      activeProposal,
      setActiveProposalId,
      createProposal,
      updateProposal,
      planningAnalysis,
    };
};