import React, { useState, useEffect } from 'react';
import { Teacher, CapacityProfile } from '../types.ts';
import { useSchedule } from '../hooks/useSchedule.ts';
import { 
  XIcon,
  PencilIcon,
  CheckIcon,
  PlusCircleIcon 
} from './icons.tsx';

interface CapacityProfileEditorProps {
  teacher: Teacher;
  onClose: () => void;
}

// Helper function to get day names
const getDayName = (dayIndex: number): string => {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 
               'Quinta', 'Sexta', 'Sábado'];
  return days[dayIndex];
};

const getDayNameShort = (dayIndex: number): string => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[dayIndex];
};

// Simple time picker component
const TimePicker = ({ value, onChange }: { value: string; onChange: (time: string) => void }) => {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md 
                focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white bg-white"
    />
  );
};


const CapacityProfileEditor: React.FC<CapacityProfileEditorProps> = ({ 
  teacher, 
  onClose 
}) => {
  const { capacityProfiles, addCapacityProfile, updateCapacityProfile } = useSchedule();
  const [profileName, setProfileName] = useState('Novo Perfil');
  const [availability, setAvailability] = useState([
    { day: 0, isAvailable: false, startTime: '09:00', endTime: '17:00' },
    { day: 1, isAvailable: true, startTime: '08:00', endTime: '18:00' },
    { day: 2, isAvailable: true, startTime: '08:00', endTime: '18:00' },
    { day: 3, isAvailable: true, startTime: '08:00', endTime: '18:00' },
    { day: 4, isAvailable: true, startTime: '08:00', endTime: '18:00' },
    { day: 5, isAvailable: true, startTime: '08:00', endTime: '14:00' },
    { day: 6, isAvailable: false, startTime: '09:00', endTime: '17:00' }
  ]);
  const [constraints, setConstraints] = useState({
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    preferredDays: [1, 2, 3, 4, 5] as number[],
    unavailableDates: [] as string[]
  });
  
  const currentProfile = capacityProfiles.find(
    p => p.teacherId === teacher.id && p.isCurrent
  );

  useEffect(() => {
    if (currentProfile) {
      setProfileName(currentProfile.name);
      setAvailability(currentProfile.availability);
      setConstraints(currentProfile.constraints);
    }
  }, [currentProfile]);
  
  const handleSave = () => {
    const profileData = {
      name: profileName,
      teacherId: teacher.id,
      availability,
      constraints,
      effectiveDate: new Date().toISOString(),
      isCurrent: true
    };
    
    // Deactivate any existing current profiles for this teacher
    capacityProfiles
      .filter(p => p.teacherId === teacher.id && p.isCurrent)
      .forEach(p => {
        updateCapacityProfile(p.id, { isCurrent: false });
      });
    
    if (currentProfile) {
        updateCapacityProfile(currentProfile.id, profileData);
    } else {
        addCapacityProfile({ id: `cp-${Date.now()}`, ...profileData });
    }
    
    onClose();
  };
  
  const toggleDayAvailability = (dayIndex: number) => {
    setAvailability(prev => prev.map((day, i) => 
      i === dayIndex ? { ...day, isAvailable: !day.isAvailable } : day
    ));
  };
  
  const updateDayTime = (dayIndex: number, type: 'start' | 'end', time: string) => {
    setAvailability(prev => prev.map((day, i) => {
      if (i !== dayIndex) return day;
      return type === 'start' ? { ...day, startTime: time } : { ...day, endTime: time };
    }));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-army-olive rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Perfil de Capacidade: {teacher.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Defina a disponibilidade e limites do professor
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Perfil
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                          focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white bg-white"
                placeholder="Ex: Perfil 2023/2"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Disponibilidade Semanal
              </h3>
              <div className="space-y-2">
                {availability.map((day, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-charcoal-black/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getDayName(index)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleDayAvailability(index)}
                        className={`p-1 rounded ${
                          day.isAvailable 
                            ? 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' 
                            : 'text-gray-400 bg-gray-200 dark:bg-army-olive-light hover:text-gray-500 dark:hover:text-gray-300'
                        }`}
                      >
                        {day.isAvailable ? <CheckIcon className="h-5 w-5" /> : <XIcon className="h-5 w-5" />}
                      </button>
                      
                      {day.isAvailable && (
                        <div className="flex space-x-2 items-center">
                          <TimePicker 
                            value={day.startTime}
                            onChange={(time) => updateDayTime(index, 'start', time)}
                          />
                          <span className="text-gray-400 dark:text-gray-500">até</span>
                          <TimePicker 
                            value={day.endTime}
                            onChange={(time) => updateDayTime(index, 'end', time)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Limites e Preferências
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Máximo de horas por dia
                  </label>
                  <input
                    type="number" min="1" max="12" value={constraints.maxDailyHours}
                    onChange={(e) => setConstraints(c => ({...c, maxDailyHours: parseInt(e.target.value) || 8}))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Máximo de horas por semana
                  </label>
                  <input
                    type="number" min="1" max="60" value={constraints.maxWeeklyHours}
                    onChange={(e) => setConstraints(c => ({...c, maxWeeklyHours: parseInt(e.target.value) || 40}))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm 
                        text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Salvar Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CapacityProfileEditor);