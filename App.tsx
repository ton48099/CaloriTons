import React, { useState, useEffect } from 'react';
import { Tab, FoodItem, DailyGoals, DayLog } from './types';
import Tracker from './components/Tracker';
import Calculators from './components/Calculators';
import { Utensils, Calculator, Leaf } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRACKER);
  
  // Date State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Global Data State (Logs per date)
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  
  // Default Goals
  const [goals, setGoals] = useState<DailyGoals>({
    calories: 2000,
    carbs: 250,
    protein: 100,
    fat: 66,
    water: 2500
  });

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('caloritons_logs');
    const savedGoals = localStorage.getItem('caloritons_goals');
    
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    }
    
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (e) {
        console.error("Failed to parse goals", e);
      }
    }
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (Object.keys(logs).length > 0) {
      localStorage.setItem('caloritons_logs', JSON.stringify(logs));
    }
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('caloritons_goals', JSON.stringify(goals));
  }, [goals]);

  // Helpers to get/set current day data
  const currentLog = logs[selectedDate] || { food: [], water: 0 };

  const setFoodLog = (newFoodLog: FoodItem[] | ((prev: FoodItem[]) => FoodItem[])) => {
    setLogs(prev => {
      const current = prev[selectedDate] || { food: [], water: 0 };
      const updatedFood = typeof newFoodLog === 'function' ? newFoodLog(current.food) : newFoodLog;
      return {
        ...prev,
        [selectedDate]: { ...current, food: updatedFood }
      };
    });
  };

  const setWaterIntake = (newWater: number) => {
    setLogs(prev => {
      const current = prev[selectedDate] || { food: [], water: 0 };
      return {
        ...prev,
        [selectedDate]: { ...current, water: newWater }
      };
    });
  };

  return (
    <div className="min-h-screen bg-dark-900 font-sans text-dark-text">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-10 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">CaloriTons</h1>
          </div>
          
          <nav className="flex gap-2">
             <button 
               onClick={() => setActiveTab(Tab.TRACKER)}
               className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === Tab.TRACKER ? 'bg-primary text-dark-900 shadow-md shadow-primary/20' : 'text-dark-muted hover:bg-dark-700 hover:text-white'}`}
             >
               <Utensils className="w-4 h-4" />
               <span className="hidden sm:inline">Diário</span>
             </button>
             <button 
               onClick={() => setActiveTab(Tab.CALCULATOR)}
               className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === Tab.CALCULATOR ? 'bg-secondary text-dark-900 shadow-md shadow-secondary/20' : 'text-dark-muted hover:bg-dark-700 hover:text-white'}`}
             >
               <Calculator className="w-4 h-4" />
               <span className="hidden sm:inline">Calculadoras</span>
             </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === Tab.TRACKER ? (
          <Tracker 
            goals={goals}
            foodLog={currentLog.food}
            setFoodLog={setFoodLog}
            waterIntake={currentLog.water}
            setWaterIntake={setWaterIntake}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        ) : (
          <Calculators 
            currentGoals={goals}
            onUpdateGoals={(newGoals) => {
              setGoals(newGoals);
              setActiveTab(Tab.TRACKER);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;