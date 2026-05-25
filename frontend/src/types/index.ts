// 共享类型定义

export interface Meal {
  id: string;
  user_id: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  food_name: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portion_size?: string;
  meal_date: string;
  meal_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  workout_type: 'CARDIO' | 'STRENGTH' | 'FLEXIBILITY' | 'SPORTS' | 'OTHER';
  exercise_name: string;
  duration_minutes?: number;
  calories_burned?: number;
  intensity?: 'LOW' | 'MEDIUM' | 'HIGH';
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
  workout_date: string;
  workout_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category: 'FOOD' | 'GYM' | 'SUPPLEMENTS' | 'EQUIPMENT' | 'APPAREL' | 'OTHER';
  amount: number;
  currency: string;
  description?: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface BodyRecord {
  id: string;
  user_id: string;
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  arm?: number;
  thigh?: number;
  measurement_date: string;
  created_at: string;
  updated_at: string;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_calories_burned: number;
  total_expenses: number;
  meals_count: number;
  workouts_count: number;
}

export interface CaloriesTrendPoint {
  date: string;
  calories_in: number;
  calories_out: number;
}

export interface NutritionAnalysis {
  start_date: string;
  end_date: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  by_meal_type: Record<string, { calories: number; protein: number; carbs: number; fat: number; count: number }>;
}

export interface ExpenseAnalysis {
  start_date: string;
  end_date: string;
  total_amount: number;
  transaction_count: number;
  by_category: Record<string, { amount: number; count: number }>;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}
