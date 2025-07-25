/*
 * Environment Configuration Example
 * مثال على ملف إعدادات البيئة المحلية
 * 
 * انسخ هذا الملف إلى env.local.js وأضف مفاتيح API الخاصة بك
 * Copy this file to env.local.js and add your actual API keys
 */

// Groq API Key for AI Analysis
// مفتاح Groq API للتحليل الذكي
window.DEV_GROQ_API_KEY = "your-groq-api-key-here";

// Gemini API Key for Enhanced Analysis
// مفتاح Gemini API للتحليل المحسن
window.DEV_GEMINI_API_KEY = "your-gemini-api-key-here";

// OpenAI API Key (Optional)
// مفتاح OpenAI API (اختياري)
window.DEV_OPENAI_API_KEY = "your-openai-api-key-here";

// Firebase Configuration Override (Optional)
// تجاوز إعدادات Firebase (اختياري)
window.DEV_FIREBASE_CONFIG = {
    apiKey: "your-firebase-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "your-app-id"
};

// Development Settings
// إعدادات التطوير
window.DEV_SETTINGS = {
    // Enable debug mode
    // تفعيل وضع التطوير
    debugMode: true,
    
    // Mock AI responses when API is not available
    // استخدام ردود وهمية عند عدم توفر API
    useMockAI: false,
    
    // Enable detailed logging
    // تفعيل التسجيل المفصل
    verboseLogging: true,
    
    // Skip certain validations in development
    // تخطي بعض التحققات في وضع التطوير
    skipValidations: false,
    
    // Default admin credentials for testing
    // بيانات المسؤول الافتراضية للاختبار
    defaultAdmin: {
        email: "admin@login.com",
        password: "admin13579"
    }
};

// API Endpoints Configuration
// إعدادات نقاط النهاية للواجهات البرمجية
window.API_ENDPOINTS = {
    groq: "https://api.groq.com/openai/v1/chat/completions",
    gemini: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    openai: "https://api.openai.com/v1/chat/completions"
};

// Feature Flags
// مفاتيح المميزات
window.FEATURE_FLAGS = {
    // Enable advanced AI analysis
    // تفعيل التحليل المتقدم
    advancedAnalysis: true,
    
    // Enable real-time notifications
    // تفعيل الإشعارات الفورية
    realTimeNotifications: true,
    
    // Enable voice interview feature
    // تفعيل ميزة المقابلة الصوتية
    voiceInterview: true,
    
    // Enable PDF generation
    // تفعيل توليد ملفات PDF
    pdfGeneration: true,
    
    // Enable email notifications
    // تفعيل الإشعارات عبر البريد الإلكتروني
    emailNotifications: false,
    
    // Enable analytics tracking
    // تفعيل تتبع التحليلات
    analytics: true
};

// Localization Settings
// إعدادات التعريب
window.LOCALE_SETTINGS = {
    defaultLanguage: "ar",
    supportedLanguages: ["ar", "en"],
    dateFormat: "DD/MM/YYYY",
    timeFormat: "HH:mm",
    currency: "SAR",
    direction: "rtl"
};

// Performance Settings
// إعدادات الأداء
window.PERFORMANCE_SETTINGS = {
    // Maximum file size for CV upload (in MB)
    // الحد الأقصى لحجم ملف السيرة الذاتية (بالميجابايت)
    maxFileSize: 10,
    
    // Analysis timeout (in milliseconds)
    // مهلة التحليل (بالميلي ثانية)
    analysisTimeout: 30000,
    
    // Cache duration (in minutes)
    // مدة التخزين المؤقت (بالدقائق)
    cacheDuration: 60,
    
    // Maximum concurrent analyses
    // الحد الأقصى للتحليلات المتزامنة
    maxConcurrentAnalyses: 3
};

// Security Settings
// إعدادات الأمان
window.SECURITY_SETTINGS = {
    // Session timeout (in minutes)
    // انتهاء الجلسة (بالدقائق)
    sessionTimeout: 120,
    
    // Maximum login attempts
    // الحد الأقصى لمحاولات تسجيل الدخول
    maxLoginAttempts: 5,
    
    // Password requirements
    // متطلبات كلمة المرور
    passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
    },
    
    // Enable CSRF protection
    // تفعيل الحماية من CSRF
    csrfProtection: true
};

console.log('Development environment configuration loaded');
console.log('إعدادات بيئة التطوير تم تحميلها بنجاح');