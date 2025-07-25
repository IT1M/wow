/*
 * Firebase Configuration for Mais Co. HR Portal
 * تكوين Firebase لبوابة التوظيف - شركة مايس
 * Version: 2.0.0
 */

// Firebase Configuration Object
const firebaseConfig = {
    // يرجى استبدال هذه القيم بقيم مشروعك الفعلي من Firebase Console
    apiKey: "your-api-key-here",
    authDomain: "mais-co-hr-portal.firebaseapp.com",
    projectId: "mais-co-hr-portal",
    storageBucket: "mais-co-hr-portal.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345678",
    measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase (if Firebase is loaded)
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        
        // Initialize Firestore
        const db = firebase.firestore();
        
        // Initialize Analytics (optional)
        if (firebase.analytics) {
            firebase.analytics();
        }
        
        console.log('Firebase initialized successfully');
        
        // Export for global use
        window.firebaseDb = db;
        window.firebaseAuth = firebase.auth();
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
} else {
    console.warn('Firebase SDK not loaded. Using localStorage as fallback.');
}

// Firebase Helper Functions
const FirebaseHelper = {
    
    /**
     * حفظ طلب توظيف في Firebase
     * @param {Object} applicationData - بيانات طلب التوظيف
     * @returns {Promise} - Promise مع معرف الطلب
     */
    async saveApplication(applicationData) {
        try {
            if (window.firebaseDb) {
                const docRef = await window.firebaseDb.collection('applications').add({
                    ...applicationData,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending'
                });
                return docRef.id;
            } else {
                // Fallback to localStorage
                const applications = JSON.parse(localStorage.getItem('submittedApplications') || '[]');
                const newApplication = {
                    ...applicationData,
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                };
                applications.push(newApplication);
                localStorage.setItem('submittedApplications', JSON.stringify(applications));
                return newApplication.id;
            }
        } catch (error) {
            console.error('Error saving application:', error);
            throw error;
        }
    },

    /**
     * جلب جميع طلبات التوظيف
     * @returns {Promise<Array>} - قائمة طلبات التوظيف
     */
    async getApplications() {
        try {
            if (window.firebaseDb) {
                const snapshot = await window.firebaseDb.collection('applications')
                    .orderBy('timestamp', 'desc')
                    .get();
                
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } else {
                // Fallback to localStorage
                return JSON.parse(localStorage.getItem('submittedApplications') || '[]');
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            return JSON.parse(localStorage.getItem('submittedApplications') || '[]');
        }
    },

    /**
     * تحديث حالة طلب التوظيف
     * @param {string} applicationId - معرف الطلب
     * @param {Object} updates - التحديثات المطلوبة
     * @returns {Promise} - Promise للتحديث
     */
    async updateApplication(applicationId, updates) {
        try {
            if (window.firebaseDb) {
                await window.firebaseDb.collection('applications')
                    .doc(applicationId)
                    .update({
                        ...updates,
                        lastModified: firebase.firestore.FieldValue.serverTimestamp()
                    });
            } else {
                // Fallback to localStorage
                const applications = JSON.parse(localStorage.getItem('submittedApplications') || '[]');
                const index = applications.findIndex(app => app.id === applicationId);
                if (index !== -1) {
                    applications[index] = {
                        ...applications[index],
                        ...updates,
                        lastModified: new Date().toISOString()
                    };
                    localStorage.setItem('submittedApplications', JSON.stringify(applications));
                }
            }
        } catch (error) {
            console.error('Error updating application:', error);
            throw error;
        }
    },

    /**
     * حفظ الوظائف الشاغرة
     * @param {Object} jobData - بيانات الوظيفة
     * @returns {Promise} - Promise مع معرف الوظيفة
     */
    async saveJob(jobData) {
        try {
            if (window.firebaseDb) {
                const docRef = await window.firebaseDb.collection('jobs').add({
                    ...jobData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'active'
                });
                return docRef.id;
            } else {
                // Fallback to localStorage
                const jobs = JSON.parse(localStorage.getItem('jobVacancies') || '[]');
                const newJob = {
                    ...jobData,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    status: 'active'
                };
                jobs.push(newJob);
                localStorage.setItem('jobVacancies', JSON.stringify(jobs));
                return newJob.id;
            }
        } catch (error) {
            console.error('Error saving job:', error);
            throw error;
        }
    },

    /**
     * جلب الوظائف الشاغرة
     * @returns {Promise<Array>} - قائمة الوظائف
     */
    async getJobs() {
        try {
            if (window.firebaseDb) {
                const snapshot = await window.firebaseDb.collection('jobs')
                    .where('status', '==', 'active')
                    .orderBy('createdAt', 'desc')
                    .get();
                
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } else {
                // Fallback to localStorage
                return JSON.parse(localStorage.getItem('jobVacancies') || '[]');
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return JSON.parse(localStorage.getItem('jobVacancies') || '[]');
        }
    },

    /**
     * حفظ تحليل متقدم للمتقدم
     * @param {string} applicationId - معرف الطلب
     * @param {Object} analysisData - بيانات التحليل
     * @returns {Promise} - Promise للحفظ
     */
    async saveAdvancedAnalysis(applicationId, analysisData) {
        try {
            if (window.firebaseDb) {
                await window.firebaseDb.collection('advanced_analysis').doc(applicationId).set({
                    applicationId,
                    analysis: analysisData,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Fallback to localStorage
                const analyses = JSON.parse(localStorage.getItem('advancedAnalyses') || '{}');
                analyses[applicationId] = {
                    applicationId,
                    analysis: analysisData,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('advancedAnalyses', JSON.stringify(analyses));
            }
        } catch (error) {
            console.error('Error saving advanced analysis:', error);
            throw error;
        }
    },

    /**
     * جلب التحليل المتقدم للمتقدم
     * @param {string} applicationId - معرف الطلب
     * @returns {Promise<Object>} - بيانات التحليل
     */
    async getAdvancedAnalysis(applicationId) {
        try {
            if (window.firebaseDb) {
                const doc = await window.firebaseDb.collection('advanced_analysis')
                    .doc(applicationId)
                    .get();
                
                return doc.exists ? doc.data() : null;
            } else {
                // Fallback to localStorage
                const analyses = JSON.parse(localStorage.getItem('advancedAnalyses') || '{}');
                return analyses[applicationId] || null;
            }
        } catch (error) {
            console.error('Error fetching advanced analysis:', error);
            return null;
        }
    },

    /**
     * حفظ إحصائيات النظام
     * @param {Object} statsData - بيانات الإحصائيات
     * @returns {Promise} - Promise للحفظ
     */
    async saveSystemStats(statsData) {
        try {
            if (window.firebaseDb) {
                await window.firebaseDb.collection('system_stats').add({
                    ...statsData,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Fallback to localStorage
                const stats = JSON.parse(localStorage.getItem('systemStats') || '[]');
                stats.push({
                    ...statsData,
                    timestamp: new Date().toISOString()
                });
                // Keep only last 100 entries
                if (stats.length > 100) {
                    stats.splice(0, stats.length - 100);
                }
                localStorage.setItem('systemStats', JSON.stringify(stats));
            }
        } catch (error) {
            console.error('Error saving system stats:', error);
        }
    },

    /**
     * تسجيل نشاط المستخدم
     * @param {string} userId - معرف المستخدم
     * @param {string} action - النشاط المنجز
     * @param {Object} details - تفاصيل إضافية
     */
    async logUserActivity(userId, action, details = {}) {
        try {
            const activityData = {
                userId,
                action,
                details,
                timestamp: window.firebaseDb ? 
                    firebase.firestore.FieldValue.serverTimestamp() : 
                    new Date().toISOString(),
                userAgent: navigator.userAgent,
                ip: 'client-side' // يمكن الحصول على IP من الخادم
            };

            if (window.firebaseDb) {
                await window.firebaseDb.collection('user_activities').add(activityData);
            } else {
                // Fallback to localStorage (limited storage)
                const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
                activities.push(activityData);
                // Keep only last 50 activities
                if (activities.length > 50) {
                    activities.splice(0, activities.length - 50);
                }
                localStorage.setItem('userActivities', JSON.stringify(activities));
            }
        } catch (error) {
            console.error('Error logging user activity:', error);
        }
    }
};

// Export Firebase Helper for global use
window.FirebaseHelper = FirebaseHelper;

// Auto-initialize if Firebase is available
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase !== 'undefined') {
        console.log('Firebase services ready');
        
        // Test connection
        FirebaseHelper.saveSystemStats({
            event: 'system_startup',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        }).catch(err => console.warn('Could not save startup stats:', err));
    }
});

// Export configuration for manual initialization
window.firebaseConfig = firebaseConfig;