import React, { useState, useEffect } from 'react';
import { UserStats, DailyGoals } from '../types';
import { Calculator, Droplet, Activity, Check } from 'lucide-react';

interface CalculatorsProps {
  currentGoals: DailyGoals;
  onUpdateGoals: (goals: DailyGoals) => void;
}

const Calculators: React.FC<CalculatorsProps> = ({ currentGoals, onUpdateGoals }) => {
  const [stats, setStats] = useState<UserStats>({
    weight: 70,
    height: 170,
    age: 30,
    gender: 'female',
    activityLevel: 'sedentary'
  });

  const [results, setResults] = useState<{
    bmi: number;
    bmiCategory: string;
    tdee: number; // Maintenance calories
    water: number;
  } | null>(null);

  const calculate = () => {
    // BMI Calculation
    const heightInMeters = stats.height / 100;
    const bmi = stats.weight / (heightInMeters * heightInMeters);
    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'Abaixo do peso';
    else if (bmi < 24.9) bmiCategory = 'Peso normal';
    else if (bmi < 29.9) bmiCategory = 'Sobrepeso';
    else bmiCategory = 'Obesidade';

    // BMR (Mifflin-St Jeor)
    let bmr = 10 * stats.weight + 6.25 * stats.height - 5 * stats.age;
    if (stats.gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // TDEE Multipliers
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = Math.round(bmr * multipliers[stats.activityLevel]);

    // Water (approx 35ml per kg)
    const water = Math.round(stats.weight * 35);

    setResults({
      bmi: parseFloat(bmi.toFixed(1)),
      bmiCategory,
      tdee,
      water
    });
  };

  useEffect(() => {
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  const applyGoals = () => {
    if (!results) return;

    // Standard balanced macro split: 50% carb, 20% protein, 30% fat
    const cals = results.tdee;
    const carbs = Math.round((cals * 0.5) / 4);
    const protein = Math.round((cals * 0.2) / 4);
    const fat = Math.round((cals * 0.3) / 9);

    onUpdateGoals({
      calories: cals,
      carbs,
      protein,
      fat,
      water: results.water
    });
    alert("Metas atualizadas com sucesso!");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-secondary" />
          Seus Dados
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-muted mb-1">Sexo</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input 
                  type="radio" 
                  checked={stats.gender === 'male'} 
                  onChange={() => setStats({...stats, gender: 'male'})}
                  className="text-primary focus:ring-primary bg-dark-900 border-dark-600"
                />
                Masculino
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input 
                  type="radio" 
                  checked={stats.gender === 'female'} 
                  onChange={() => setStats({...stats, gender: 'female'})}
                  className="text-primary focus:ring-primary bg-dark-900 border-dark-600"
                />
                Feminino
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-muted mb-1">Idade (anos)</label>
            <input 
              type="number" 
              value={stats.age}
              onChange={(e) => setStats({...stats, age: parseInt(e.target.value) || 0})}
              className="w-full p-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-muted mb-1">Peso (kg)</label>
            <input 
              type="number" 
              value={stats.weight}
              onChange={(e) => setStats({...stats, weight: parseFloat(e.target.value) || 0})}
              className="w-full p-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-muted mb-1">Altura (cm)</label>
            <input 
              type="number" 
              value={stats.height}
              onChange={(e) => setStats({...stats, height: parseInt(e.target.value) || 0})}
              className="w-full p-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-dark-muted mb-1">Nível de Atividade</label>
            <select 
              value={stats.activityLevel}
              onChange={(e) => setStats({...stats, activityLevel: e.target.value as any})}
              className="w-full p-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="sedentary">Sedentário (Pouco ou nenhum exercício)</option>
              <option value="light">Levemente Ativo (1-3 dias/semana)</option>
              <option value="moderate">Moderadamente Ativo (3-5 dias/semana)</option>
              <option value="active">Muito Ativo (6-7 dias/semana)</option>
              <option value="very_active">Extremamente Ativo (Trabalho físico pesado)</option>
            </select>
          </div>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* BMI Result */}
           <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  IMC (Índice de Massa Corporal)
                </h3>
                <div className="text-3xl font-bold text-white">{results.bmi}</div>
                <div className="text-sm font-medium text-dark-muted uppercase tracking-wide mt-1">
                  {results.bmiCategory}
                </div>
              </div>
           </div>

           {/* Water Result */}
           <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-dark-700 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-500" />
                  Meta de Água
                </h3>
                <div className="text-3xl font-bold text-white">{results.water} ml</div>
                <div className="text-sm text-dark-muted mt-1">
                  Baseado no seu peso corporal
                </div>
              </div>
           </div>

            {/* Calories Result */}
           <div className="md:col-span-2 bg-gradient-to-r from-primary/5 to-dark-800 p-6 rounded-2xl shadow-sm border border-primary/20">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Calorias Diárias Recomendadas
                  </h3>
                  <div className="text-4xl font-bold text-primary">{results.tdee} kcal</div>
                  <p className="text-sm text-dark-muted mt-2 max-w-md">
                    Isso é o que você precisa para manter seu peso atual considerando seu nível de atividade.
                    Para perder peso, tente consumir cerca de 300-500 kcal a menos.
                  </p>
                </div>
                <button 
                  onClick={applyGoals}
                  className="bg-primary hover:bg-lime-600 text-dark-900 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Aplicar Metas
                </button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                 <div className="bg-dark-700/50 p-3 rounded-lg border border-dark-700">
                    <div className="text-sm text-dark-muted">Carboidratos</div>
                    <div className="font-bold text-white">{Math.round((results.tdee * 0.5) / 4)}g</div>
                 </div>
                 <div className="bg-dark-700/50 p-3 rounded-lg border border-dark-700">
                    <div className="text-sm text-dark-muted">Proteínas</div>
                    <div className="font-bold text-white">{Math.round((results.tdee * 0.2) / 4)}g</div>
                 </div>
                 <div className="bg-dark-700/50 p-3 rounded-lg border border-dark-700">
                    <div className="text-sm text-dark-muted">Gorduras</div>
                    <div className="font-bold text-white">{Math.round((results.tdee * 0.3) / 9)}g</div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Calculators;