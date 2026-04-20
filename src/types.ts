export interface FoodItem {
  name: string;
  portion: string;
  calories: string | number;
  protein_g: string | number;
  carbs_g: string | number;
  fats_g: string | number;
}

export interface Macros {
  protein_g: string | number;
  carbs_g: string | number;
  fats_g: string | number;
  "protein_%": string | number;
  "carbs_%": string | number;
  "fats_%": string | number;
}

export interface FoodAnalysis {
  items: FoodItem[];
  total_calories: string | number;
  macros: Macros;
  confidence: string;
}

export interface DietPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

export interface Insights {
  goal_alignment: string;
  suggestions: string[];
  alternatives?: string;
  bmi_culprits?: string;
  bmi_steps?: string[];
}

export interface NutritionResponse {
  food_analysis: FoodAnalysis;
  diet_plan: DietPlan;
  insights: Insights;
}

export interface UserProfile {
  username?: string;
  email?: string;
  notificationsEnabled?: boolean;
  calorieGoal: number;
  goalType: "lose" | "maintain" | "gain";
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  weightUnit: "kg" | "lbs";
  heightUnit: "cm" | "ft" | "m";
  activityLevel?: string;
  theme?: "light" | "dark" | "gray";
}

export interface LoggedMeal {
  id: string;
  timestamp: string;
  name: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  meals: LoggedMeal[];
  totalCalories: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
