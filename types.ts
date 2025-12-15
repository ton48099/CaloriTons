export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem extends NutritionInfo {
  id: string;
  name: string;
  weight: number; // in grams
  portionName?: string; // e.g., "1 unidade", "1 fatia"
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // in ml
}

export interface UserStats {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface DayLog {
  food: FoodItem[];
  water: number;
}

export enum Tab {
  TRACKER = 'tracker',
  CALCULATOR = 'calculator'
}