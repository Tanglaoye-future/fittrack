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

// v2 daily_summaries 行（Python analytics 服务 GET /daily-summary 直接 SELECT *）
export interface DailySummary {
  id: string;
  user_id: string;
  summary_date: string;
  total_kcal: number | null;
  total_protein: string | number | null;
  total_carbs: string | number | null;
  total_fat: string | number | null;
  total_fiber: string | number | null;
  meals_count: number;
  workout_minutes: number;
  total_volume_kg: string | number | null;
  total_sets: number;
  avg_rpe: string | number | null;
  water_ml: number;
  morning_weight_kg: string | number | null;
  steps: number | null;
  kcal_target: number | null;
  kcal_target_pct: string | number | null;
  is_complete: boolean;
}

export interface MacroTrendPoint {
  date: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface BodyWeightPoint {
  measurement_date: string;
  morning_weight_kg: string | number | null;
  body_fat_percentage: string | number | null;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}
