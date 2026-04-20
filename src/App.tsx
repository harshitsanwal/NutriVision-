/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { 
  Camera, 
  Upload, 
  Activity, 
  Target, 
  User, 
  Scale, 
  Ruler, 
  PieChart, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Utensils,
  Mail, 
  Bell,
  Lock,
  X,
  Share2,
  Calendar,
  History,
  Clock,
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  MessageSquare,
  Send,
  Sparkles,
  BrainCircuit,
  Zap,
  Palette,
  Settings,
  LogOut,
  Dna,
  CircleDot,
  Flame,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Award,
  Star,
  Sun,
  Moon,
  Layout,
  Check,
  BarChart2,
  Zap as ZapIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { cn } from "./lib/utils";
import { NutritionResponse, UserProfile, DayLog, LoggedMeal, Message } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const ai = genAI; // for compatibility with rest of code

const THEMES = {
  light: {
    bg: "bg-white",
    subBg: "bg-slate-50",
    text: "text-slate-900",
    subText: "text-slate-500",
    border: "border-slate-100",
    card: "bg-white",
    input: "bg-slate-50 border-slate-200",
    nav: "bg-white/50 border-slate-100/50"
  },
  dark: {
    bg: "bg-slate-900",
    subBg: "bg-slate-800",
    text: "text-slate-50",
    subText: "text-slate-400",
    border: "border-slate-800",
    card: "bg-slate-800",
    input: "bg-slate-800 border-slate-700",
    nav: "bg-slate-900/50 border-slate-800/50"
  },
  gray: {
    bg: "bg-slate-700",
    subBg: "bg-slate-600",
    text: "text-white",
    subText: "text-slate-300",
    border: "border-slate-500",
    card: "bg-slate-600",
    input: "bg-slate-600 border-slate-500",
    nav: "bg-slate-700/50 border-slate-600/50"
  }
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    email: "",
    notificationsEnabled: true,
    calorieGoal: 2000,
    goalType: "maintain",
    weightUnit: "kg",
    heightUnit: "cm",
    activityLevel: "moderate",
    theme: "light"
  });
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NutritionResponse | null>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [profileTab, setProfileTab] = useState<"settings" | "health">("settings");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [history, setHistory] = useState<DayLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('nutrivision_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nutrivision_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const isAnyModalOpen = showLogin || cameraActive || showProfile || showHistory;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLogin, cameraActive, showProfile, showHistory]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.username && profile.email && profile.weight && profile.height && profile.age && profile.gender) {
      // Convert to Metric for calculation
      const weightInKg = profile.weightUnit === "lbs" ? profile.weight * 0.453592 : profile.weight;
      let heightInCm = profile.height;
      if (profile.heightUnit === "ft") heightInCm = profile.height * 30.48;
      else if (profile.heightUnit === "m") heightInCm = profile.height * 100;

      // Calculate BMR using Mifflin-St Jeor Equation
      let bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * profile.age;
      if (profile.gender === "male") bmr += 5;
      else bmr -= 161;

      // Activity multiplier mapping
      const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725,
        extra: 1.9
      };
      
      const multiplier = activityMultipliers[profile.activityLevel || "moderate"] || 1.55;
      let tdee = bmr * multiplier;

      // Adjust for goal
      let finalGoal = tdee;
      if (profile.goalType === "lose") finalGoal -= 500;
      else if (profile.goalType === "gain") finalGoal += 500;

      setProfile({ ...profile, calorieGoal: Math.round(finalGoal) });
      setIsLoggedIn(true);
      setShowLogin(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && history.length === 0) {
      const today = new Date();
      const seedData: DayLog[] = [];
      
      for (let i = 1; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        seedData.push({
          date: dateStr,
          totalCalories: 1850 + Math.floor(Math.random() * 300),
          meals: [
            { id: Math.random().toString(36).substr(2, 9), timestamp: '08:30 AM', name: 'Oatmeal with Blueberries', calories: 350, macros: { protein: 12, carbs: 55, fats: 8 } },
            { id: Math.random().toString(36).substr(2, 9), timestamp: '01:15 PM', name: 'Grilled Chicken Salad', calories: 550, macros: { protein: 45, carbs: 15, fats: 22 } },
            { id: Math.random().toString(36).substr(2, 9), timestamp: '07:45 PM', name: 'Salmon and Quinoa', calories: 750, macros: { protein: 40, carbs: 45, fats: 30 } },
          ]
        });
      }
      setHistory(seedData);
    }
  }, [isLoggedIn]);

  const [showLogSuccess, setShowLogSuccess] = useState(false);

  const logMeal = () => {
    const totals = adjustedTotals;
    if (!totals || !result?.food_analysis?.items) return;

    const today = new Date().toISOString().split('T')[0];
    const itemNames: string[] = [];

    result.food_analysis.items.forEach((item, idx) => {
      const q = itemQuantities[idx] ?? 1;
      if (q > 0) {
        itemNames.push(`${q}x ${item.name}`);
      }
    });

    if (itemNames.length === 0) return;

    const newMeal: LoggedMeal = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name: itemNames.join(", "),
      calories: totals.calories,
      macros: {
        protein: totals.protein,
        carbs: totals.carbs,
        fats: totals.fats,
      }
    };

    setHistory(prev => {
      const existingDay = prev.find(d => d.date === today);
      if (existingDay) {
        return prev.map(d => d.date === today ? {
          ...d,
          meals: [newMeal, ...d.meals],
          totalCalories: d.totalCalories + newMeal.calories
        } : d);
      } else {
        return [{
          date: today,
          meals: [newMeal],
          totalCalories: newMeal.calories
        }, ...prev];
      }
    });
    
    setResult(null);
    setImage(null);
    setShowLogSuccess(true);
    setTimeout(() => setShowLogSuccess(false), 3000);
    setShowHistory(true);
  };

  const deleteMeal = (date: string, mealId: string) => {
    setHistory(prev => {
      const newHistory = prev.map(day => {
        if (day.date === date) {
          const mealToDelete = day.meals.find(m => m.id === mealId);
          const updatedMeals = day.meals.filter(m => m.id !== mealId);
          return {
            ...day,
            meals: updatedMeals,
            totalCalories: Math.max(0, Math.round(day.totalCalories - (mealToDelete?.calories || 0)))
          };
        }
        return day;
      }).filter(day => day.meals.length > 0);
      
      // Update localStorage immediately to be safe
      localStorage.setItem('nutrivision_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const getTodayCalories = () => {
    const today = new Date().toISOString().split('T')[0];
    const day = history.find(d => d.date === today);
    return day ? Math.round(day.totalCalories) : 0;
  };

  const toNum = (val: string | number): number => {
    if (typeof val === "number") return val;
    const matched = val.match(/(\d+\.?\d*)/);
    return matched ? parseFloat(matched[1]) : 0;
  };

  const adjustedTotals = React.useMemo(() => {
    const defaults = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      proteinPct: 0,
      carbsPct: 0,
      fatsPct: 0
    };

    if (!result?.food_analysis?.items) return defaults;

    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    result.food_analysis.items.forEach((item, idx) => {
      const q = itemQuantities[idx] ?? 1;
      const itemCals = toNum(item.calories);
      const itemProtein = toNum(item.protein_g);
      const itemCarbs = toNum(item.carbs_g);
      const itemFats = toNum(item.fats_g);

      calories += itemCals * q;
      protein += itemProtein * q;
      carbs += itemCarbs * q;
      fats += itemFats * q;
    });

    const totalWeight = protein + carbs + fats || 1;

    return {
      calories: Math.round(calories),
      protein: Number(protein.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fats: Number(fats.toFixed(1)),
      proteinPct: Math.round((protein * 4 / (calories || 1)) * 100),
      carbsPct: Math.round((carbs * 4 / (calories || 1)) * 100),
      fatsPct: Math.round((fats * 9 / (calories || 1)) * 100)
    };
  }, [result, itemQuantities]);

  const todayCals = getTodayCalories();
  const calProgress = Math.min((todayCals / profile.calorieGoal) * 100, 100);

  const handleShare = async () => {
    const shareData = {
      title: 'NutriVision AI',
      text: 'Check out my personalized AI nutritionist!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const calculateBMI = () => {
    if (profile.weight && profile.height) {
      let weightInKg = profile.weightUnit === "lbs" ? profile.weight * 0.453592 : profile.weight;
      let heightInMeters = profile.height;
      if (profile.heightUnit === "ft") heightInMeters = profile.height * 0.3048;
      else if (profile.heightUnit === "cm") heightInMeters = profile.height / 100;
      // if "m", it's already in meters
      return (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const getBMIAdvice = (bmi: number) => {
    const goal = profile.goalType;
    let status = "";
    let advice = "";

    if (bmi < 18.5) status = "Underweight";
    else if (bmi < 25) status = "Normal";
    else if (bmi < 30) status = "Overweight";
    else status = "Obese";

    if (goal === "gain") {
      advice = bmi < 18.5 
        ? "Try adding a bit more healthy food to your meals, like nuts or extra grains, to help reach a healthy weight." 
        : "Focus on eating balanced meals with plenty of protein to help you gain weight steadily.";
    } else if (goal === "lose") {
      advice = bmi > 25 
        ? "Try slightly smaller portions and adding more veggies to your plate. A short daily walk can also make a big difference!" 
        : "Focus on eating wholesome foods and staying active with activities you enjoy, like walking or swimming.";
    } else {
      advice = "You're doing great! Keep focusing on a variety of colorful foods and staying active every day.";
    }

    return { status, advice };
  };

  const bmiValue = calculateBMI();
  const bmiData = bmiValue ? getBMIAdvice(parseFloat(bmiValue)) : null;

  const compressImage = (dataUrl: string, maxDimension: number = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const optimized = await compressImage(result);
        setImage(optimized);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  const startCamera = () => {
    setCameraActive(true);
    setError(null);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const initCamera = async () => {
      if (cameraActive && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setError("Could not access camera. Please check permissions and ensure you are using HTTPS.");
          setCameraActive(false);
        }
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive]);

  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      const optimized = await compressImage(dataUrl);
      setImage(optimized);
      setCameraActive(false);
      setResult(null);
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
  };

  const cleanJson = (text: string) => {
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?|```/g, "").trim();
      return cleaned;
    } catch (e) {
      return text;
    }
  };

  const analyzeFood = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setItemQuantities({}); // Reset quantities for new analysis

    try {
      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
      });

      // Extract accurate mime type
      const mimeMatch = image.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64Data = image.split(",")[1];
      
      const prompt = `Analyze this meal for a user with the following profile: ${JSON.stringify(profile)}. 
              
      1. Identify the discrete items in the photo (e.g., 'Chapati', 'Dal', 'Rice', 'Paneer Sabzi').
      2. For each item, estimate a 'base' portion (e.g., 1 chapati, 1 small bowl of dal) so the user can easily adjust quantities.
      3. Identify exactly what could be changed to make this meal healthier (e.g., specific swaps, portion tweaks, hidden culprits).
      
      Be extremely specific and actionable. Use common Indian food names for items.
      
      Return the analysis in JSON format matching the schema provided.`;

      const resultAI = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              food_analysis: {
                type: SchemaType.OBJECT,
                properties: {
                  items: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        name: { type: SchemaType.STRING },
                        portion: { type: SchemaType.STRING },
                        calories: { type: SchemaType.NUMBER },
                        protein_g: { type: SchemaType.NUMBER },
                        carbs_g: { type: SchemaType.NUMBER },
                        fats_g: { type: SchemaType.NUMBER },
                      },
                      required: ["name", "portion", "calories"],
                    },
                  },
                  total_calories: { type: SchemaType.NUMBER },
                  macros: {
                    type: SchemaType.OBJECT,
                    properties: {
                      protein_g: { type: SchemaType.NUMBER },
                      carbs_g: { type: SchemaType.NUMBER },
                      fats_g: { type: SchemaType.NUMBER },
                      "protein_%": { type: SchemaType.NUMBER },
                      "carbs_%": { type: SchemaType.NUMBER },
                      "fats_%": { type: SchemaType.NUMBER },
                    },
                  },
                  confidence: { type: SchemaType.STRING },
                },
              },
              diet_plan: {
                type: SchemaType.OBJECT,
                properties: {
                  breakfast: { type: SchemaType.STRING },
                  lunch: { type: SchemaType.STRING },
                  dinner: { type: SchemaType.STRING },
                  snacks: { type: SchemaType.STRING },
                },
              },
              insights: {
                type: SchemaType.OBJECT,
                properties: {
                  goal_alignment: { type: SchemaType.STRING },
                  suggestions: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                  },
                  alternatives: { type: SchemaType.STRING },
                  bmi_culprits: { type: SchemaType.STRING },
                  bmi_steps: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                  },
                },
              },
            },
            required: ["food_analysis", "diet_plan", "insights"],
          },
        },
      });

      const response = await resultAI.response;
      const text = response.text();
      
      if (!text) {
        throw new Error("No response from AI");
      }

      const parsed = JSON.parse(text) as NutritionResponse;
      setResult(parsed);
      
      // Initialize quantities
      const initialQs: Record<number, number> = {};
      parsed.food_analysis.items.forEach((_, i) => initialQs[i] = 1);
      setItemQuantities(initialQs);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      if (err.message?.includes("API key")) {
        setError("AI Service Unreachable. Please check your configuration.");
      } else {
        setError("Failed to analyze image. Please try again with a clearer photo of food.");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentTheme = THEMES[profile.theme || "light"];

  if (!isLoggedIn) {
    return (
      <div className={cn("min-h-screen font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-500", currentTheme.bg)}>
        {/* Navigation */}
        <nav className={cn("fixed top-0 w-full z-50 backdrop-blur-2xl transition-all h-24 flex items-center border-b", currentTheme.nav)}>
          <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-200 group-hover:rotate-[360deg] transition-transform duration-1000">
                <Utensils className="text-white w-6 h-6" />
              </div>
              <span className={cn("text-2xl font-black tracking-tighter font-display transition-colors", currentTheme.text)}>NutriVision</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="hidden lg:flex items-center gap-6">
                {[
                  { label: "Features", id: "features" },
                  { label: "Accuracy", id: "accuracy" },
                  { label: "Privacy", id: "privacy" }
                ].map(link => (
                  <button 
                    key={link.id} 
                    onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
                    className={cn("text-sm font-black transition-colors uppercase tracking-widest cursor-pointer", currentTheme.subText, "hover:text-emerald-500")}
                  >
                    {link.label}
                  </button>
                ))}
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setProfile({...profile, theme: 'light'})}
                    className={cn("p-2 rounded-full transition-all", profile.theme === 'light' ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-emerald-500")}
                    title="Light Theme"
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setProfile({...profile, theme: 'dark'})}
                    className={cn("p-2 rounded-full transition-all", profile.theme === 'dark' ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-emerald-500")}
                    title="Dark Theme"
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setProfile({...profile, theme: 'gray'})}
                    className={cn("p-2 rounded-full transition-all", profile.theme === 'gray' ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-emerald-500")}
                    title="Gray Theme"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <button 
                  onClick={() => setShowLogin(true)}
                  className={cn("px-6 py-3 font-black text-sm transition-colors uppercase tracking-widest hover:text-emerald-600", currentTheme.subText)}
                >
                  Log In
                </button>
                <button 
                  onClick={() => setShowLogin(true)}
                  className={cn("px-8 py-3 rounded-full text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-xl", profile.theme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200' : 'bg-white text-slate-900 hover:bg-slate-100 shadow-black/20')}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className={cn("pt-40 pb-20 px-6 relative overflow-hidden transition-colors duration-500", currentTheme.bg)}>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-emerald-100/20 rounded-full blur-[140px] opacity-40 animate-blob" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-[140px] opacity-40 animate-blob animation-delay-2000" />
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">AI-Powered Nutrition</span>
              </div>
              <h1 className={cn("text-6xl sm:text-7xl font-black leading-[1.05] tracking-tight font-display transition-colors", currentTheme.text)}>
                Your Health, <br />
                <span className="text-emerald-500">Visualized.</span>
              </h1>
              <p className={cn("text-xl leading-relaxed max-w-lg font-medium transition-colors", currentTheme.subText)}>
                Snap a photo, know your macros. NutriVision uses state-of-the-art AI to track your diet, BMI, and health roadmaps instantly. Start seeing what you eat.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <button 
                  onClick={() => setShowLogin(true)}
                  className="px-10 py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 flex items-center justify-center gap-4 active:scale-95 group"
                >
                  Start Scanning <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>

              {/* Scroll Indicator */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="pt-12 hidden lg:flex flex-col items-start gap-4"
              >
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  <div className="w-10 h-16 border-2 border-slate-200 rounded-full flex justify-center p-2">
                    <motion.div 
                      animate={{ y: [0, 16, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-1.5 h-1.5 bg-emerald-600 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Scroll to explore</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-emerald-400/20 blur-[100px] rounded-full" />
              {/* Phone Mockup */}
              <div className="relative bg-slate-900 rounded-[3.5rem] p-4 shadow-2xl border-8 border-slate-800 aspect-[9/18.5] w-full max-w-[320px] mx-auto overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                <img 
                  src="https://picsum.photos/seed/nutrition/800/1600" 
                  alt="App interface" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-[2.5rem] opacity-70 transition-all duration-700 hover:opacity-100"
                />
                <div className="absolute inset-x-6 bottom-12 p-5 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 space-y-4 shadow-2xl">
                   <div className="flex justify-between items-center text-white">
                     <div>
                        <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Grilled Chicken</p>
                        <p className="text-xl font-black">380 kcal</p>
                     </div>
                     <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                        <Check className="w-5 h-5" />
                     </div>
                   </div>
                   <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 w-2/3" />
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Accuracy Section */}
        <section id="accuracy" className="py-32 bg-slate-50 scroll-mt-24 transition-all overflow-hidden border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Lab-Verified Precision</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 font-display tracking-tight leading-[1.1]">
                Precision you can <br /> 
                <span className="text-blue-600">bank your health on.</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                NutriVision provides science-backed tracking. Our model is trained on diverse food images and validated against clinical standards to ensure accuracy.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/20 blur-[120px] rounded-full" />
              <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <Star className="w-6 h-6 fill-white" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 font-display">The accuracy promise</h4>
                </div>
                <div className="space-y-4">
                  {[
                    "Item Identification accuracy",
                    "Portion Estimation precision",
                    "Micro-nutrient detection",
                    "Real-time correction latency"
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-slate-600 font-bold">{stat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section id="privacy" className="py-32 bg-white scroll-mt-24">
          <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-slate-200 mb-8">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-5xl font-black text-slate-900 font-display tracking-tight">Your health data is <br /> <span className="text-emerald-600">yours alone.</span></h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                Privacy isn't a feature; it's our foundation. We use bank-grade encryption and never sell your profile data to advertisers or third-party researchers.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 text-left">
              {[
                { title: "End-to-End Encryption", desc: "All food photos are encrypted during transit and at rest. Only you can access your historical logs.", icon: <ShieldCheck className="w-6 h-6" /> },
                { title: "Zero Data Selling", desc: "We are funded by users, not advertisers. Your diet data stays between you and your goal.", icon: <X className="w-6 h-6" /> },
                { title: "Universal Portability", desc: "Export your data anytime. Delete your entire history with a single tap in the settings menu.", icon: <CheckCircle2 className="w-6 h-6" /> }
              ].map((p, i) => (
                <div key={i} className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4 hover:bg-white hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                    {p.icon}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 font-display tracking-tight">{p.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 bg-slate-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-white opacity-5" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <span className="text-emerald-500 font-black uppercase tracking-[0.4em] text-xs">Testimonials</span>
              <h2 className="text-4xl sm:text-6xl font-black text-white font-display mt-4 tracking-tight">Loved by seekers globally.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Sarah J.", role: "Yoga Instructor", text: "NutriVision changed how I look at my post-workout meals. The accuracy is mind-blowing.", img: "10" },
                { name: "Marcus T.", role: "Software Engineer", text: "As a busy dev, I needed something fast. Snapping a photo takes 2 seconds and I'm done.", img: "11" },
                { name: "Elena R.", role: "Nutritionist", text: "I recommend this to all my clients. It bridges the gap between intention and action.", img: "12" }
              ].map((t, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-xl p-10 rounded-[3rem] border border-slate-700 space-y-6 hover:border-emerald-500 transition-colors"
                >
                  <p className="text-slate-300 text-lg italic leading-relaxed font-medium">"{t.text}"</p>
                  <div className="flex items-center gap-4 border-t border-slate-700 pt-6">
                    <img className="w-14 h-14 rounded-full border-2 border-emerald-500 p-0.5" src={`https://picsum.photos/seed/${t.img}/56/56`} referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-white font-black font-display tracking-tight text-xl">{t.name}</p>
                      <p className="text-slate-500 text-sm font-bold">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-10 relative z-10">
            <h2 className="text-5xl sm:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight">
              Ready to see your <br /> health differently?
            </h2>
            <p className="text-xl text-slate-500 max-w-xl mx-auto font-medium lead-relaxed">
              Start your journey today and transform your relationship with food through intelligent visual tracking.
            </p>
            <button 
              onClick={() => setShowLogin(true)}
              className="px-12 py-6 bg-emerald-600 text-white rounded-full font-black text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 hover:scale-105 active:scale-95"
            >
              Get Started for Free
            </button>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 blur-[120px] rounded-full" />
        </section>

        <footer className="py-20 border-t border-slate-100 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Utensils className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight font-display">NutriVision</span>
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Precision Nutrition AI</p>
        </footer>

        {/* Auth Modal overlay */}
        <AnimatePresence>
          {showLogin && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden relative"
              >
                <button 
                  onClick={() => setShowLogin(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
                <div className={cn("p-10 sm:p-14 space-y-10 transition-colors", currentTheme.bg)}>
                  <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-200 mx-auto mb-8">
                      <Utensils className="text-white w-10 h-10" />
                    </div>
                    <h2 className={cn("text-4xl font-black tracking-tight font-display transition-colors", currentTheme.text)}>Setup Profile</h2>
                    <p className={cn("font-medium transition-colors", currentTheme.subText)}>Let's personalize your experience</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                          <User className="w-3 h-3" /> Full Name
                        </label>
                        <input 
                          required
                          type="text" 
                          value={profile.username || ""}
                          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                          className={cn("w-full px-6 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold placeholder:text-slate-400", currentTheme.input, currentTheme.text)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                          <Mail className="w-3 h-3" /> Email Address
                        </label>
                        <input 
                          required
                          type="email" 
                          value={profile.email || ""}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className={cn("w-full px-6 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold placeholder:text-slate-400", currentTheme.input, currentTheme.text)}
                          placeholder="john@example.com"
                        />
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                              <History className="w-3 h-3" /> Age
                            </label>
                            <input 
                              required
                              type="number" 
                              className={cn("w-full px-6 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold", currentTheme.input, currentTheme.text)}
                              value={profile.age || ""}
                              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                              placeholder="Age"
                            />
                          </div>
                          <div className="space-y-2 relative group">
                            <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                              <Target className="w-3 h-3" /> Gender
                            </label>
                            <div className="relative">
                              <select 
                                required
                                className={cn("w-full px-6 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer", currentTheme.input, currentTheme.text)}
                                value={profile.gender || ""}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                              >
                                <option value="" className="bg-slate-800 text-white">Select</option>
                                <option value="male" className="bg-slate-800 text-white">Male</option>
                                <option value="female" className="bg-slate-800 text-white">Female</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight className="w-4 h-4 rotate-90" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                            <Scale className="w-3 h-3" /> Current Weight
                          </label>
                          <div className="flex gap-2">
                            <input 
                              required
                              type="number" 
                              className={cn("flex-grow px-6 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold", currentTheme.input, currentTheme.text)}
                              value={profile.weight || ""}
                              onChange={(e) => setProfile({ ...profile, weight: parseFloat(e.target.value) || 0 })}
                              placeholder={profile.weightUnit === "kg" ? "e.g. 70" : "e.g. 154"}
                            />
                            <div className="relative group w-24">
                              <select
                                value={profile.weightUnit}
                                onChange={(e) => setProfile({ ...profile, weightUnit: e.target.value as "kg" | "lbs" })}
                                className={cn("w-full px-4 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs cursor-pointer appearance-none h-full", currentTheme.input, currentTheme.text)}
                              >
                                <option value="kg" className="bg-slate-800 text-white">kg</option>
                                <option value="lbs" className="bg-slate-800 text-white">lbs</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight className="w-3 h-3 rotate-90" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                            <Ruler className="w-3 h-3" /> Current Height
                          </label>
                          <div className="flex gap-2">
                            <input 
                              required
                              type="number" 
                              step="0.01"
                              className={cn("flex-grow px-6 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold", currentTheme.input, currentTheme.text)}
                              value={profile.height || ""}
                              onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || 0 })}
                              placeholder={profile.heightUnit === "cm" ? "e.g. 175" : profile.heightUnit === "ft" ? "e.g. 5.9" : "e.g. 1.75"}
                            />
                            <div className="relative group w-24">
                              <select
                                value={profile.heightUnit}
                                onChange={(e) => setProfile({ ...profile, heightUnit: e.target.value as "cm" | "ft" | "m" })}
                                className={cn("w-full px-4 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs cursor-pointer appearance-none h-full", currentTheme.input, currentTheme.text)}
                              >
                                <option value="cm" className="bg-slate-800 text-white">cm</option>
                                <option value="ft" className="bg-slate-800 text-white">ft</option>
                                <option value="m" className="bg-slate-800 text-white">m</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight className="w-3 h-3 rotate-90" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                            <Activity className="w-3 h-3" /> Your Activity Level
                          </label>
                          <div className="relative group">
                            <select 
                              required
                              value={profile.activityLevel || "moderate"}
                              onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
                              className={cn("w-full px-6 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer", currentTheme.input, currentTheme.text)}
                            >
                              <option value="sedentary" className="bg-slate-800 text-white">Sedentary (No exercise)</option>
                              <option value="light" className="bg-slate-800 text-white">Lightly Active (1-2 days/week)</option>
                              <option value="moderate" className="bg-slate-800 text-white">Moderately Active (3-5 days/week)</option>
                              <option value="very" className="bg-slate-800 text-white">Very Active (Daily exercise)</option>
                              <option value="extra" className="bg-slate-800 text-white">Extra Active (Professional athlete)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                              <ChevronRight className="w-4 h-4 rotate-90" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                            <Target className="w-3 h-3" /> Your Health Goal
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["lose", "maintain", "gain"] as const).map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setProfile({ ...profile, goalType: g })}
                                className={cn(
                                  "py-3 px-2 rounded-xl text-[10px] font-black uppercase transition-all border",
                                  profile.goalType === g 
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100" 
                                    : cn(currentTheme.subBg, currentTheme.subText, "border-transparent hover:border-emerald-200")
                                )}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-6"
                    >
                      Complete Profile <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen font-sans transition-all duration-500 selection:bg-emerald-500 selection:text-white", currentTheme.bg, currentTheme.text)}>
      {/* Header */}
      <header className={cn("sticky top-0 z-50 backdrop-blur-md border-b px-4 py-3 transition-colors", currentTheme.nav)}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {bmiValue && (
              <div className="flex flex-col items-start px-3 py-1 border rounded-lg bg-emerald-50 border-emerald-100">
                <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">Your BMI</p>
                <p className="text-sm font-black leading-none text-emerald-900">{bmiValue}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Utensils className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block text-slate-800">NutriVision <span className="text-emerald-600">AI</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Welcome back</p>
              <p className="text-sm font-black text-slate-800">{profile.username || "User"}</p>
            </div>
            <div className="relative">
              <button 
                onClick={handleShare}
                className="p-2 rounded-full transition-colors group hover:bg-slate-100"
                title="Share App"
              >
                <Share2 className="w-5 h-5 transition-colors text-slate-600 group-hover:text-emerald-600" />
              </button>
              <AnimatePresence>
                {showCopied && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg whitespace-nowrap shadow-xl"
                  >
                    Link Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => setShowHistory(true)}
              className="p-2 rounded-full transition-colors group hover:bg-slate-100"
              title="Daily History"
            >
              <History className="w-6 h-6 transition-colors text-slate-600 group-hover:text-emerald-600" />
            </button>
            <button 
              onClick={() => setShowProfile(true)}
              className="p-2 rounded-full transition-colors group hover:bg-slate-100"
            >
              <User className="w-6 h-6 transition-colors text-slate-600 group-hover:text-emerald-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 md:space-y-10 relative">
        {/* Fancy Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 blur-[120px] rounded-full" />
        </div>

        {/* Camera Modal */}
        <AnimatePresence>
          {cameraActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] overflow-y-auto flex items-center justify-center bg-black"
            >
              <div className="relative w-full h-full max-w-2xl mx-auto flex flex-col min-h-screen">
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
                  <button 
                    onClick={stopCamera}
                    className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-grow flex items-center justify-center p-2 sm:p-4">
                  <div className="relative w-full aspect-[3/4] sm:aspect-square max-h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 shadow-2xl">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Viewfinder overlay */}
                    <div className="absolute inset-0 border-2 border-white/20 pointer-events-none m-4 sm:m-8 rounded-xl sm:rounded-2xl">
                      <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1" />
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-10 flex flex-col items-center gap-4 sm:gap-6">
                  <p className="text-white/60 text-xs sm:text-sm font-medium">Position your meal within the frame</p>
                  <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all group"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-emerald-600 rounded-full group-hover:scale-105 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-auto"
              >
                <div className="p-6 sm:p-8 space-y-6 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Daily Log</h2>
                      <p className="text-slate-500 text-xs sm:text-sm">Track your calorie journey</p>
                    </div>
                    <button 
                      onClick={() => setShowHistory(false)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {history.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                          <Calendar className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No meals logged yet today.</p>
                      </div>
                    ) : (
                      history.map((day) => (
                        <div key={day.date} className="space-y-4">
                          <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </h3>
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                              {day.totalCalories} / {profile.calorieGoal} kcal
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {day.meals.map((meal) => (
                              <div key={meal.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{meal.timestamp}</span>
                                  </div>
                                  <p className="text-sm font-bold text-slate-800">{meal.name}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    P: {meal.macros.protein}g • C: {meal.macros.carbs}g • F: {meal.macros.fats}g
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-base font-black text-emerald-600">{meal.calories}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">kcal</p>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMeal(day.date, meal.id);
                                    }}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Remove meal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button 
                    onClick={() => setShowHistory(false)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Modal */}
        <AnimatePresence>
          {showProfile && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={cn("rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-auto transition-all duration-500", currentTheme.card)}
              >
                <div className="p-6 sm:p-10 space-y-8 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className={cn("text-2xl font-black font-display transition-colors", currentTheme.text)}>Your Profile</h2>
                      <p className={cn("text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none transition-colors", currentTheme.subText)}>{profile.username} • {profile.email}</p>
                    </div>
                    <button 
                      onClick={() => setShowProfile(false)}
                      className={cn("p-2 rounded-full transition-colors", profile.theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/10')}
                    >
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>

                  {/* Tab Selector */}
                  <div className={cn("flex p-1 rounded-2xl flex-shrink-0 transition-colors", currentTheme.subBg)}>
                    <button 
                      onClick={() => setProfileTab("settings")}
                      className={cn(
                        "flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all",
                        profileTab === "settings" 
                          ? (profile.theme === 'light' ? "bg-white text-slate-800 shadow-sm" : "bg-emerald-600 text-white shadow-lg") 
                          : cn("transition-colors", currentTheme.subText, "hover:text-emerald-500")
                      )}
                    >
                      Settings
                    </button>
                    <button 
                      onClick={() => setProfileTab("health")}
                      className={cn(
                        "flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all",
                        profileTab === "health" 
                          ? (profile.theme === 'light' ? "bg-white text-slate-800 shadow-sm" : "bg-emerald-600 text-white shadow-lg") 
                          : cn("transition-colors", currentTheme.subText, "hover:text-emerald-500")
                      )}
                    >
                      Health Dashboard
                    </button>
                  </div>

                  <div className="space-y-6">
                    {profileTab === "settings" ? (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                            <Sun className="w-3 h-3" /> Appearance Preference
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {([
                              { id: "light", icon: <Sun className="w-4 h-4" />, label: "Light" },
                              { id: "dark", icon: <Moon className="w-4 h-4" />, label: "Dark" },
                              { id: "gray", icon: <Palette className="w-4 h-4" />, label: "Gray" }
                            ] as const).map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setProfile({ ...profile, theme: t.id })}
                                className={cn(
                                  "flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl text-[10px] font-black uppercase transition-all border",
                                  profile.theme === t.id 
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200" 
                                    : cn("border-transparent hover:border-emerald-500/30", currentTheme.subBg, currentTheme.subText)
                                )}
                              >
                                {t.icon}
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                            <User className="w-3 h-3" /> Display Name
                          </label>
                          <input 
                            type="text" 
                            value={profile.username || ""}
                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                            className={cn("w-full px-5 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold", currentTheme.input, currentTheme.text)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                              <History className="w-3 h-3" /> Age
                            </label>
                            <input 
                              type="number" 
                              value={profile.age || ""}
                              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                              className={cn("w-full px-5 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold", currentTheme.input, currentTheme.text)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                              <Target className="w-3 h-3" /> Gender
                            </label>
                            <div className="relative group">
                              <select 
                                value={profile.gender || ""}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                className={cn("w-full px-5 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer", currentTheme.input, currentTheme.text)}
                              >
                                <option value="" className="bg-slate-800 text-white">Select</option>
                                <option value="male" className="bg-slate-800 text-white">Male</option>
                                <option value="female" className="bg-slate-800 text-white">Female</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight className="w-4 h-4 rotate-90" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className={cn("text-sm font-bold flex items-center gap-2 transition-colors", currentTheme.text)}>
                              <Scale className="w-4 h-4 text-emerald-600" /> Weight
                            </label>
                            <div className="flex gap-3">
                              <input 
                                type="number" 
                                value={profile.weight || ""}
                                onChange={(e) => setProfile({ ...profile, weight: parseFloat(e.target.value) || 0 })}
                                className={cn("flex-grow px-5 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold", currentTheme.input, currentTheme.text)}
                                placeholder={profile.weightUnit === "kg" ? "70" : "154"}
                              />
                              <div className="relative group">
                                <select
                                  value={profile.weightUnit}
                                  onChange={(e) => setProfile({ ...profile, weightUnit: e.target.value as "kg" | "lbs" })}
                                  className={cn("px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs cursor-pointer appearance-none min-w-[75px] h-full text-center", currentTheme.input, currentTheme.text)}
                                >
                                  <option value="kg" className="bg-slate-800 text-white">kg</option>
                                  <option value="lbs" className="bg-slate-800 text-white">lbs</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                  <ChevronRight className="w-3 h-3 rotate-90" />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className={cn("text-sm font-bold flex items-center gap-2 transition-colors", currentTheme.text)}>
                              <Ruler className="w-4 h-4 text-emerald-600" /> Height
                            </label>
                            <div className="flex gap-3">
                              <input 
                                type="number" 
                                step="0.01"
                                value={profile.height || ""}
                                onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || 0 })}
                                className={cn("flex-grow px-5 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold", currentTheme.input, currentTheme.text)}
                                placeholder={profile.heightUnit === "cm" ? "175" : profile.heightUnit === "ft" ? "5.9" : "1.75"}
                              />
                              <div className="relative group">
                                <select
                                  value={profile.heightUnit}
                                  onChange={(e) => setProfile({ ...profile, heightUnit: e.target.value as "cm" | "ft" | "m" })}
                                  className={cn("px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs cursor-pointer appearance-none min-w-[75px] h-full text-center", currentTheme.input, currentTheme.text)}
                                >
                                  <option value="cm" className="bg-slate-800 text-white">cm</option>
                                  <option value="ft" className="bg-slate-800 text-white">ft</option>
                                  <option value="m" className="bg-slate-800 text-white">m</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                  <ChevronRight className="w-3 h-3 rotate-90" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className={cn("text-sm font-bold flex items-center gap-2 transition-colors", currentTheme.text)}>
                                <Activity className="w-4 h-4 text-emerald-600" /> Daily Calorie Goal (kcal)
                              </label>
                              <button 
                                onClick={() => {
                                  const weightInKg = profile.weightUnit === "lbs" ? (profile.weight || 0) * 0.453592 : (profile.weight || 0);
                                  let heightInCm = (profile.height || 0);
                                  if (profile.heightUnit === "ft") heightInCm = (profile.height || 0) * 30.48;
                                  else if (profile.heightUnit === "m") heightInCm = (profile.height || 0) * 100;
                                  
                                  let bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * (profile.age || 0);
                                  if (profile.gender === "male") bmr += 5;
                                  else bmr -= 161;
                                  const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9 };
                                  let tdee = bmr * (multipliers[profile.activityLevel || "moderate"] || 1.55);
                                  let goal = tdee;
                                  if (profile.goalType === "lose") goal -= 500;
                                  else if (profile.goalType === "gain") goal += 500;
                                  setProfile({ ...profile, calorieGoal: Math.round(goal) });
                                }}
                                className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 px-3 py-1.5 rounded-xl transition-all"
                              >
                                Recalculate
                              </button>
                            </div>
                            <input 
                              type="number" 
                              value={profile.calorieGoal}
                              onChange={(e) => setProfile({ ...profile, calorieGoal: parseInt(e.target.value) || 0 })}
                              className={cn("w-full px-5 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold", currentTheme.input, currentTheme.text)}
                              placeholder="e.g. 2000"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className={cn("text-sm font-bold flex items-center gap-2 transition-colors", currentTheme.text)}>
                              <Activity className="w-4 h-4 text-emerald-600" /> Activity Level
                            </label>
                            <div className="relative group">
                              <select 
                                value={profile.activityLevel}
                                onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
                                className={cn("w-full px-5 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer", currentTheme.input, currentTheme.text)}
                              >
                                <option value="sedentary" className="bg-slate-800 text-white">Sedentary (Office job)</option>
                                <option value="light" className="bg-slate-800 text-white">Lightly Active</option>
                                <option value="moderate" className="bg-slate-800 text-white">Moderately Active</option>
                                <option value="very" className="bg-slate-800 text-white">Very Active</option>
                                <option value="extra" className="bg-slate-800 text-white">Extra Active</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight className="w-4 h-4 rotate-90" />
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center justify-between p-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
                            <div className="flex items-center gap-3">
                              <Bell className="w-5 h-5 text-emerald-500" />
                              <div>
                                <p className={cn("text-sm font-bold", currentTheme.text)}>Meal Reminders</p>
                                <p className={cn("text-[10px] uppercase font-black tracking-widest", currentTheme.subText)}>Daily scanning</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProfile({ ...profile, notificationsEnabled: !profile.notificationsEnabled })}
                              className={cn(
                                "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                profile.notificationsEnabled ? "bg-emerald-600" : "bg-slate-300"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 bg-white rounded-full transition-all duration-300",
                                profile.notificationsEnabled ? "translate-x-6" : "translate-x-0"
                              )} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {bmiValue && (
                          <div className="space-y-6">
                            <div className="p-8 bg-emerald-600 text-white rounded-[3rem] shadow-xl shadow-emerald-200">
                              <div className="flex items-center justify-between mb-6">
                                <div>
                                  <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em]">Current BMI</p>
                                  <p className="text-5xl font-black font-display">{bmiValue}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em]">Status</p>
                                  <p className="text-xl font-bold">{bmiData?.status}</p>
                                </div>
                              </div>
                              <div className="pt-6 border-t border-white/20">
                                <p className="text-[10px] font-black text-emerald-100 mb-2 flex items-center gap-2">
                                  <Info className="w-4 h-4" /> HEALTH RECOMMENDATION
                                </p>
                                <p className="text-sm leading-relaxed font-medium">
                                  {bmiData?.advice}
                                </p>
                              </div>
                            </div>

                            {result ? (
                              <div className="space-y-6">
                                <div className="space-y-3">
                                  <h4 className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                                    <AlertCircle className="w-4 h-4 text-amber-500" /> Dietary Risks
                                  </h4>
                                  <div className="p-5 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 transition-all">
                                    <p className="text-sm leading-relaxed italic text-amber-600 font-medium">
                                      {result.insights.bmi_culprits}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", currentTheme.subText)}>
                                    <Sparkles className="w-4 h-4 text-emerald-500" /> Improvement Plan
                                  </h4>
                                  <div className="space-y-2">
                                    {result.insights.bmi_steps.map((step, idx) => (
                                      <div key={idx} className={cn("flex items-start gap-4 p-5 rounded-[2rem] border transition-all", currentTheme.subBg, "border-emerald-500/10")}>
                                        <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                                          {idx + 1}
                                        </div>
                                        <p className={cn("text-sm font-bold", currentTheme.text)}>{step}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={cn("p-10 text-center rounded-[3rem] border space-y-4", currentTheme.subBg, "border-emerald-500/10")}>
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm bg-white">
                                  <Camera className="w-8 h-8 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                  <p className={cn("font-bold", currentTheme.text)}>Unlock Analysis</p>
                                  <p className={cn("text-xs", currentTheme.subText)}>Scan a meal to see AI insights about your BMI and tailored roadmap.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {!bmiValue && (
                          <div className={cn("p-10 text-center rounded-[3rem] border space-y-4", currentTheme.subBg, "border-emerald-500/10")}>
                            <Scale className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className={cn("text-sm font-bold", currentTheme.text)}>Complete profile to see metrics.</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-4 space-y-3">
                      <button 
                        onClick={() => {
                          setIsLoggedIn(false);
                          setShowProfile(false);
                        }}
                        className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                      <button 
                        onClick={() => setShowProfile(false)}
                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-[0.98]"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Analysis & Results (8 units) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Hero Progress Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">Daily Energy</p>
                    <h3 className="text-4xl font-black tracking-tight">
                      {todayCals} <span className="text-slate-400 text-lg font-medium">/ {profile.calorieGoal} kcal</span>
                    </h3>
                  </div>
                  {bmiValue && (
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status: {bmiData?.status}</p>
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                        <p className="text-2xl font-black text-white">{bmiValue}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Current BMI</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>Progress</span>
                    <span>{Math.round(calProgress)}%</span>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${calProgress}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        calProgress > 100 ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Remaining</p>
                    <p className="text-xl font-black">{Math.max(0, profile.calorieGoal - todayCals)}</p>
                  </div>
                  <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</p>
                    <p className="text-sm font-bold text-emerald-400">
                      {calProgress >= 100 ? "Goal Met" : "On Track"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Analysis & Camera Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 text-emerald-600" />
                </div>
                Analyze Meal
              </h3>

              {!image ? (
                <div className="space-y-4">
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer",
                      isDragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Drop your meal photo here</p>
                    <p className="text-slate-400 text-sm mt-1">or click to browse</p>
                  </div>
                  
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">OR</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  <button 
                    onClick={startCamera}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    Take a Photo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden aspect-square shadow-inner bg-slate-100">
                    <img src={image!} alt="Meal" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => { setImage(null); setResult(null); }}
                      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all"
                    >
                      <RefreshCw className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={analyzeFood}
                    disabled={loading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Analyzing Nutrition...
                      </>
                    ) : (
                      <>
                        <Activity className="w-6 h-6" />
                        Analyze Meal
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Portion Adjustment & Logging UI (Only when result exists) */}
            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-200 text-white space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <PlusCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-1">Portion Control</h3>
                    <p className="text-xl font-black">How much was eaten?</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 py-2">
                  {result.food_analysis.items.map((item, idx) => (
                    <div key={idx} className="bg-white/10 rounded-3xl p-4 flex flex-col gap-3">
                      <div className="flex-grow">
                        <p className="text-sm font-bold truncate">{item.name}</p>
                        <p className="text-[10px] text-emerald-100/70">{item.portion}</p>
                      </div>
                      <div className="flex items-center justify-between bg-white/20 rounded-2xl p-2 shrink-0">
                        <button 
                          onClick={() => setItemQuantities(prev => ({ ...prev, [idx]: Math.max(0, (prev[idx] || 1) - 0.5) }))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-base font-black w-10 text-center">{itemQuantities[idx] ?? 1}</span>
                        <button 
                          onClick={() => setItemQuantities(prev => ({ ...prev, [idx]: (prev[idx] || 1) + 0.5 }))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={logMeal}
                  className="group relative w-full py-5 bg-white text-emerald-600 font-black rounded-2xl hover:bg-emerald-50 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  CONFIRM & LOG MEAL
                  <div className="absolute inset-0 rounded-2xl ring-4 ring-white/20 group-hover:ring-white/40 transition-all" />
                </button>
              </motion.div>
            )}

            {/* Results Section */}
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] p-12 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-slate-100 rounded-full blur-2xl opacity-50" />
                    <div className="relative w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center">
                      <Utensils className="w-16 h-16 text-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Fuel Your Potential</h3>
                    <p className="text-slate-500 max-w-sm leading-relaxed">Analyze your meal to unlock deep nutritional profiling and see how it fits your daily goals.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <div className="p-5 bg-slate-50 rounded-3xl text-left border border-slate-100">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">AI-Powered Calibration</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-3xl text-left border border-slate-100">
                      <PieChart className="w-6 h-6 text-blue-500 mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Macros</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">Full Macro Breakdown</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* BMI Dashboard in Results */}
                  {bmiValue && (
                    <motion.div 
                      className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8"
                    >
                      <div className="flex items-center gap-6 border-r border-slate-100 pr-8">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center relative">
                          <Activity className="w-8 h-8 text-emerald-600" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Your BMI</p>
                          <p className="text-4xl font-black text-slate-800">{bmiValue}</p>
                        </div>
                      </div>
                      <div className="flex-grow space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                            bmiData?.status === "Normal" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {bmiData?.status}
                          </span>
                          <p className="text-sm font-black text-slate-700">Health Status</p>
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed italic border-l-4 border-emerald-100 pl-4 py-1">
                          "{bmiData?.advice}"
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all hover:-translate-y-1">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:bg-slate-100">
                        <Zap className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cals</p>
                      <p className="text-3xl font-black text-slate-800 tracking-tight">{adjustedTotals.calories}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all hover:-translate-y-1">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                        <Dna className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protein</p>
                      <p className="text-3xl font-black text-slate-800 tracking-tight">{adjustedTotals.protein}g</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all hover:-translate-y-1">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                        <CircleDot className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carbs</p>
                      <p className="text-3xl font-black text-slate-800 tracking-tight">{adjustedTotals.carbs}g</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all hover:-translate-y-1">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                        <Flame className="w-5 h-5 text-amber-500" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fats</p>
                      <p className="text-3xl font-black text-slate-800 tracking-tight">{adjustedTotals.fats}g</p>
                    </div>
                  </div>

                  {/* Food Items List */}
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">Detected Items</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Smart Breakdown</p>
                      </div>
                      <div className={cn(
                        "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                        result.food_analysis.confidence === "high" ? "bg-emerald-100 text-emerald-700" :
                        result.food_analysis.confidence === "medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      )}>
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        {result.food_analysis.confidence} Confidence
                      </div>
                    </div>
                    <div className="grid gap-4">
                      {result.food_analysis.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:border-emerald-100 group">
                          <div className="space-y-1">
                            <p className="font-black text-slate-800 text-lg group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{item.name}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg uppercase">{item.portion}</span>
                              {itemQuantities[idx] !== undefined && itemQuantities[idx] !== 1 && (
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase">×{itemQuantities[idx]} Qty</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-6">
                            <div className="hidden sm:block">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Energy</p>
                              <p className="text-xl font-black text-slate-900">{(toNum(item.calories) * (itemQuantities[idx] ?? 1)).toFixed(0)} <span className="text-xs font-medium text-slate-400">cal</span></p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: AI Coach & Health Optimizer (4 units) */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col min-h-[500px]"
            >
              <div className="p-6 border-b border-slate-50 bg-emerald-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <Sparkles className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase text-[10px] tracking-widest">Health Coach</h3>
                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">AI Insights</p>
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                {!result ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-24 opacity-40">
                    <BrainCircuit className="w-16 h-16 text-slate-300 transition-all hover:scale-110" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Meal Info...</p>
                    <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                      Analyze a meal to unlock health-boosting swaps and expert tips.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Alternatives */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Smart Swaps</h4>
                      </div>
                      <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100/50 relative group transition-all hover:bg-emerald-100/50">
                        <div className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-600 text-[10px] text-white px-3 py-1 rounded-full font-black shadow-lg">AI TIP</div>
                        <p className="text-sm text-emerald-800 leading-relaxed font-bold italic">
                          "{result.insights.alternatives}"
                        </p>
                      </div>
                    </div>

                    {/* Action Steps */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority Tips</h4>
                      </div>
                      <div className="grid gap-3">
                        {result.insights.suggestions.map((tip, i) => (
                          <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-200/50 transition-all hover:bg-white hover:shadow-md">
                            <span className="text-xl font-black text-emerald-200 mt-1 leading-none">{i+1}</span>
                            <p className="text-xs text-slate-700 leading-relaxed font-bold">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        {/* Notification Toast */}
        <AnimatePresence>
          {showLogSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
            >
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm tracking-tight">Meal logged successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto p-8 text-center border-t border-slate-200 mt-12">
        <p className="text-slate-400 text-sm">Powered by Gemini 3 Flash • Professional Nutrition AI</p>
      </footer>
    </div>
  );
}
