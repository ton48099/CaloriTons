import React, { useState, useRef } from 'react';
import { FoodItem, DailyGoals } from '../types';
import { analyzeFood } from '../services/geminiService';
import { Plus, Search, Loader2, Trash2, Droplet, Utensils, Edit2, Calendar, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface TrackerProps {
  goals: DailyGoals;
  foodLog: FoodItem[];
  setFoodLog: (items: FoodItem[] | ((prev: FoodItem[]) => FoodItem[])) => void;
  waterIntake: number;
  setWaterIntake: (val: number) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const Tracker: React.FC<TrackerProps> = ({ 
  goals, 
  foodLog, 
  setFoodLog, 
  waterIntake, 
  setWaterIntake,
  selectedDate,
  setSelectedDate 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [customWaterAmount, setCustomWaterAmount] = useState('');
  
  // Staging state for a found food or editing food
  const [stagingFood, setStagingFood] = useState<{
    id?: string; // If present, we are editing
    name: string;
    nutritionPer100g: { calories: number; protein: number; carbs: number; fat: number };
    weight: number;
    portionName: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setStagingFood(null);
    
    try {
      const data = await analyzeFood(searchQuery);
      if (data) {
        setStagingFood({
          name: data.name,
          nutritionPer100g: {
            calories: data.calories100g,
            protein: data.protein100g,
            carbs: data.carbs100g,
            fat: data.fat100g,
          },
          weight: data.standardPortionGrams,
          portionName: data.standardPortionName
        });
      } else {
        alert("Alimento não encontrado. Tente detalhar melhor.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar alimento.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFood = () => {
    if (!stagingFood) return;
    
    const ratio = stagingFood.weight / 100;
    
    // Create the updated/new item object
    const finalItem: FoodItem = {
      id: stagingFood.id || Date.now().toString(),
      name: stagingFood.name,
      weight: stagingFood.weight,
      portionName: stagingFood.portionName,
      calories: Math.round(stagingFood.nutritionPer100g.calories * ratio),
      protein: Math.round(stagingFood.nutritionPer100g.protein * ratio),
      carbs: Math.round(stagingFood.nutritionPer100g.carbs * ratio),
      fat: Math.round(stagingFood.nutritionPer100g.fat * ratio),
      nutritionPer100g: stagingFood.nutritionPer100g
    };

    if (stagingFood.id) {
      // Update existing
      setFoodLog(prev => prev.map(item => item.id === stagingFood.id ? finalItem : item));
    } else {
      // Add new
      setFoodLog(prev => [...prev, finalItem]);
    }

    setStagingFood(null);
    setSearchQuery('');
  };

  const handleEditClick = (food: FoodItem) => {
    setStagingFood({
      id: food.id,
      name: food.name,
      weight: food.weight,
      portionName: food.portionName || 'Porção',
      nutritionPer100g: food.nutritionPer100g || {
        // Fallback for old data if it exists without per100g
        calories: (food.calories / food.weight) * 100,
        protein: (food.protein / food.weight) * 100,
        carbs: (food.carbs / food.weight) * 100,
        fat: (food.fat / food.weight) * 100,
      }
    });
    // Scroll to top to see edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeFood = (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      setFoodLog(prev => prev.filter(f => f.id !== id));
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Calculations
  const totalCals = foodLog.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProt = foodLog.reduce((acc, curr) => acc + curr.protein, 0);
  const totalCarb = foodLog.reduce((acc, curr) => acc + curr.carbs, 0);
  const totalFat = foodLog.reduce((acc, curr) => acc + curr.fat, 0);

  const data = [
    { name: 'Carboidratos', value: totalCarb, color: '#06b6d4' },
    { name: 'Proteínas', value: totalProt, color: '#84cc16' },
    { name: 'Gorduras', value: totalFat, color: '#f59e0b' },
  ];

  // Water logic
  const addWater = (amount: number) => {
    setWaterIntake(Math.max(0, waterIntake + amount));
  };
  
  const handleCustomWater = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customWaterAmount);
    if (amount && !isNaN(amount)) {
      addWater(amount);
      setCustomWaterAmount('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
      
      {/* Date Selector Header */}
      <div className="lg:col-span-3 bg-dark-800 p-4 rounded-2xl shadow-sm border border-dark-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-dark-700 rounded-lg text-dark-muted hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 bg-dark-900 px-4 py-2 rounded-xl border border-dark-700">
            <Calendar className="w-4 h-4 text-primary" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white outline-none font-medium appearance-none"
            />
          </div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-dark-700 rounded-lg text-dark-muted hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="text-dark-muted text-sm">
          {new Date(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Left Column: Food Input & Log */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Search/Edit Box */}
        <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            {stagingFood?.id ? <Edit2 className="w-5 h-5 text-secondary" /> : <Utensils className="w-5 h-5 text-primary" />}
            {stagingFood?.id ? 'Editar Alimento' : 'Adicionar Alimento'}
          </h2>
          
          {!stagingFood?.id && (
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: Pão francês com manteiga"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-dark-900 border border-dark-700 text-white placeholder-dark-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <Search className="absolute right-3 top-3.5 text-dark-muted w-5 h-5" />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-primary hover:bg-lime-600 text-dark-900 px-6 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
              </button>
            </form>
          )}

          {stagingFood && (
            <div className="mt-4 p-4 bg-dark-900 rounded-xl border border-dark-700 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{stagingFood.name}</h3>
                  <div className="text-sm text-dark-muted">
                    Padrão: {stagingFood.portionName}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                   <div className="flex flex-col">
                      <label className="text-xs text-dark-muted mb-1">Peso (g)</label>
                      <input 
                        type="number" 
                        value={stagingFood.weight}
                        onChange={(e) => setStagingFood({...stagingFood, weight: parseInt(e.target.value) || 0})}
                        className="w-24 p-2 bg-dark-800 border border-dark-700 text-white rounded-lg text-center font-semibold focus:border-primary outline-none"
                      />
                   </div>
                   <div className="flex gap-2 mt-4 sm:mt-0">
                     {stagingFood.id && (
                       <button 
                        onClick={() => { setStagingFood(null); setSearchQuery(''); }}
                        className="bg-dark-700 text-white p-2.5 rounded-lg hover:bg-dark-600"
                       >
                         Cancelar
                       </button>
                     )}
                     <button 
                      onClick={handleSaveFood}
                      className="bg-primary hover:bg-lime-600 text-dark-900 p-2.5 rounded-lg flex items-center gap-2 font-bold"
                     >
                       {stagingFood.id ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                       {stagingFood.id ? 'Salvar' : 'Adicionar'}
                     </button>
                   </div>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-sm text-dark-muted border-t border-dark-700 pt-3">
                <span className="text-white">🔥 {Math.round(stagingFood.nutritionPer100g.calories * (stagingFood.weight/100))} kcal</span>
                <span>🍞 {Math.round(stagingFood.nutritionPer100g.carbs * (stagingFood.weight/100))}g Carb</span>
                <span>🥩 {Math.round(stagingFood.nutritionPer100g.protein * (stagingFood.weight/100))}g Prot</span>
                <span>🥑 {Math.round(stagingFood.nutritionPer100g.fat * (stagingFood.weight/100))}g Gord</span>
              </div>
            </div>
          )}
        </div>

        {/* Daily Log */}
        <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700 min-h-[300px]">
           <h3 className="font-semibold text-white mb-4">Refeições de {new Date(selectedDate).toLocaleDateString('pt-BR')}</h3>
           {foodLog.length === 0 ? (
             <div className="text-center text-dark-muted py-12 border-2 border-dashed border-dark-700 rounded-xl">
                Nenhum alimento registrado nesta data.
             </div>
           ) : (
             <div className="space-y-3">
               {foodLog.map((food) => (
                 <div key={food.id} className="flex justify-between items-center p-3 bg-dark-900 rounded-xl border border-dark-700 hover:border-dark-600 transition-all group">
                    <div>
                      <div className="font-medium text-gray-200">{food.name}</div>
                      <div className="text-xs text-dark-muted mt-1">{food.weight}g • <span className="text-primary font-bold">{food.calories} kcal</span></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex text-xs gap-2 font-medium">
                         <span className="bg-cyan-900/30 text-cyan-400 border border-cyan-900/50 px-2 py-0.5 rounded">C: {food.carbs}g</span>
                         <span className="bg-lime-900/30 text-lime-400 border border-lime-900/50 px-2 py-0.5 rounded">P: {food.protein}g</span>
                         <span className="bg-orange-900/30 text-orange-400 border border-orange-900/50 px-2 py-0.5 rounded">G: {food.fat}g</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditClick(food)}
                          className="text-dark-muted hover:text-secondary p-2 rounded-lg hover:bg-dark-800 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeFood(food.id)}
                          className="text-dark-muted hover:text-red-400 p-2 rounded-lg hover:bg-dark-800 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* Right Column: Stats & Water */}
      <div className="space-y-6">
        
        {/* Summary Card */}
        <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
          <h3 className="font-bold text-white mb-2">Resumo Diário</h3>
          <div className="text-center mb-4">
             <span className="text-4xl font-bold text-white">{totalCals}</span>
             <span className="text-dark-muted text-sm"> / {goals.calories} kcal</span>
          </div>

          <div className="relative h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-6">
               <div className="text-xs text-dark-muted">Macros</div>
            </div>
          </div>

          <div className="space-y-4 mt-4">
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-300">Carboidratos ({totalCarb}g)</span>
                 <span className="text-dark-muted">{goals.carbs}g</span>
               </div>
               <div className="h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-700/50">
                 <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${Math.min((totalCarb/goals.carbs)*100, 100)}%` }}></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-300">Proteínas ({totalProt}g)</span>
                 <span className="text-dark-muted">{goals.protein}g</span>
               </div>
               <div className="h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-700/50">
                 <div className="h-full bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.5)]" style={{ width: `${Math.min((totalProt/goals.protein)*100, 100)}%` }}></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-300">Gorduras ({totalFat}g)</span>
                 <span className="text-dark-muted">{goals.fat}g</span>
               </div>
               <div className="h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-700/50">
                 <div className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${Math.min((totalFat/goals.fat)*100, 100)}%` }}></div>
               </div>
             </div>
          </div>
        </div>

        {/* Water Tracker */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 p-6 rounded-2xl shadow-sm border border-blue-900/30 relative overflow-hidden">
           {/* Background glow effect */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

           <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Droplet className="w-5 h-5 text-blue-500 fill-current" />
                Hidratação
              </h3>
              <span className="text-sm font-bold text-blue-400">{Math.round((waterIntake / goals.water) * 100)}%</span>
           </div>
           
           <div className="relative h-6 bg-dark-900 rounded-full overflow-hidden mb-6 border border-dark-700 z-10">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                style={{ width: `${Math.min((waterIntake / goals.water) * 100, 100)}%` }}
              >
                  {/* Stripes pattern */}
                  <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]"></div>
              </div>
           </div>

           <div className="text-center mb-6 relative z-10">
              <span className="text-4xl font-bold text-white">{waterIntake}</span>
              <span className="text-dark-muted text-sm"> / {goals.water} ml</span>
           </div>

           <div className="grid grid-cols-2 gap-3 relative z-10">
              <button 
                onClick={() => addWater(250)}
                className="bg-dark-900 border border-blue-500/30 text-blue-400 py-3 rounded-xl hover:bg-blue-500/10 transition-colors font-medium text-sm"
              >
                + 250ml
              </button>
              <button 
                onClick={() => addWater(500)}
                className="bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm shadow-lg shadow-blue-900/50"
              >
                + 500ml
              </button>
           </div>

           {/* Custom Water Input */}
            <form onSubmit={handleCustomWater} className="mt-4 flex gap-2 relative z-10 border-t border-dark-700 pt-4">
              <input 
                type="number"
                placeholder="ml"
                value={customWaterAmount}
                onChange={(e) => setCustomWaterAmount(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
              />
              <button 
                type="submit"
                className="bg-dark-700 hover:bg-dark-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Adicionar
              </button>
            </form>
        </div>

      </div>
    </div>
  );
};

export default Tracker;