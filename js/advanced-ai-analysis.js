/*
 * نظام التحليل المتقدم للمتقدمين - Mais Co
 * Advanced AI Analysis System for Job Applicants
 * Version: 2.0.0
 * Description: نظام تحليل ذكي متقدم لتقييم المتقدمين بناءً على السير الذاتية والمقابلات
 */

class AdvancedAIAnalyzer {
    constructor() {
        this.analysisWeights = {
            // أوزان التحليل المختلفة
            experience: 0.30,        // الخبرة العملية
            education: 0.20,         // التعليم والمؤهلات
            skills: 0.25,           // المهارات التقنية والشخصية
            interview: 0.15,        // أداء المقابلة
            personality: 0.10       // التحليل الشخصي
        };
        
        this.industryKeywords = {
            'تطوير البرمجيات': ['javascript', 'react', 'node.js', 'python', 'java', 'typescript', 'angular', 'vue', 'git', 'api', 'database', 'sql', 'mongodb', 'aws', 'docker'],
            'التسويق': ['تسويق رقمي', 'سوشيال ميديا', 'google ads', 'facebook ads', 'seo', 'content marketing', 'email marketing', 'analytics', 'crm'],
            'الهندسة الطبية': ['أجهزة طبية', 'fda', 'iso 13485', 'matlab', 'solidworks', 'autocad', 'biomedical', 'medical devices', 'regulatory'],
            'المبيعات': ['مبيعات', 'crm', 'sales', 'negotiation', 'customer service', 'lead generation', 'account management']
        };
        
        this.personalityTraits = {
            leadership: ['قيادة', 'إدارة فريق', 'leadership', 'team management', 'project management'],
            communication: ['تواصل', 'عرض', 'presentation', 'communication', 'public speaking'],
            problemSolving: ['حل المشاكل', 'تحليل', 'problem solving', 'analytical', 'critical thinking'],
            creativity: ['إبداع', 'ابتكار', 'creativity', 'innovation', 'design thinking'],
            teamwork: ['عمل جماعي', 'تعاون', 'teamwork', 'collaboration', 'team player']
        };
    }

    /**
     * تحليل شامل للمتقدم
     * @param {Object} applicantData - بيانات المتقدم
     * @returns {Object} - نتائج التحليل المفصلة
     */
    async analyzeApplicant(applicantData) {
        try {
            const analysis = {
                applicantId: applicantData.id,
                timestamp: new Date().toISOString(),
                overallScore: 0,
                detailedScores: {},
                strengths: [],
                weaknesses: [],
                recommendations: [],
                riskFactors: [],
                compatibilityScore: 0,
                personalityProfile: {},
                careerGrowthPotential: 0,
                salaryRecommendation: {},
                interviewInsights: {}
            };

            // تحليل السيرة الذاتية
            const cvAnalysis = await this.analyzeCVContent(applicantData.cvContent, applicantData.targetPosition);
            
            // تحليل المقابلة (إذا توفرت)
            const interviewAnalysis = applicantData.interviewData ? 
                await this.analyzeInterviewPerformance(applicantData.interviewData) : null;
            
            // تحليل التوافق مع الوظيفة
            const jobCompatibility = await this.analyzeJobCompatibility(applicantData, applicantData.targetPosition);
            
            // تحليل الشخصية
            const personalityAnalysis = await this.analyzePersonality(applicantData);
            
            // حساب النتيجة الإجمالية
            analysis.detailedScores = {
                experience: cvAnalysis.experienceScore,
                education: cvAnalysis.educationScore,
                skills: cvAnalysis.skillsScore,
                interview: interviewAnalysis ? interviewAnalysis.overallScore : 0,
                personality: personalityAnalysis.overallScore
            };
            
            analysis.overallScore = this.calculateOverallScore(analysis.detailedScores);
            analysis.compatibilityScore = jobCompatibility.compatibilityScore;
            analysis.strengths = this.identifyStrengths(cvAnalysis, interviewAnalysis, personalityAnalysis);
            analysis.weaknesses = this.identifyWeaknesses(cvAnalysis, interviewAnalysis, personalityAnalysis);
            analysis.recommendations = this.generateRecommendations(analysis);
            analysis.riskFactors = this.identifyRiskFactors(applicantData, cvAnalysis);
            analysis.personalityProfile = personalityAnalysis.profile;
            analysis.careerGrowthPotential = this.assessCareerGrowthPotential(cvAnalysis, personalityAnalysis);
            analysis.salaryRecommendation = this.generateSalaryRecommendation(analysis, applicantData.targetPosition);
            analysis.interviewInsights = interviewAnalysis ? interviewAnalysis.insights : {};

            return analysis;
        } catch (error) {
            console.error('خطأ في تحليل المتقدم:', error);
            return this.generateErrorAnalysis(applicantData.id);
        }
    }

    /**
     * تحليل محتوى السيرة الذاتية
     */
    async analyzeCVContent(cvContent, targetPosition) {
        const analysis = {
            experienceScore: 0,
            educationScore: 0,
            skillsScore: 0,
            experienceYears: 0,
            relevantExperience: [],
            educationLevel: '',
            relevantSkills: [],
            missingSkills: [],
            languageSkills: [],
            certifications: []
        };

        if (!cvContent) {
            return analysis;
        }

        const cvText = cvContent.toLowerCase();
        
        // تحليل الخبرة العملية
        analysis.experienceYears = this.extractExperienceYears(cvText);
        analysis.experienceScore = Math.min((analysis.experienceYears / 10) * 100, 100);
        analysis.relevantExperience = this.extractRelevantExperience(cvText, targetPosition);
        
        // تحليل التعليم
        analysis.educationLevel = this.extractEducationLevel(cvText);
        analysis.educationScore = this.scoreEducation(analysis.educationLevel, targetPosition);
        
        // تحليل المهارات
        const skillsAnalysis = this.analyzeSkills(cvText, targetPosition);
        analysis.skillsScore = skillsAnalysis.score;
        analysis.relevantSkills = skillsAnalysis.relevant;
        analysis.missingSkills = skillsAnalysis.missing;
        
        // تحليل اللغات
        analysis.languageSkills = this.extractLanguageSkills(cvText);
        
        // تحليل الشهادات
        analysis.certifications = this.extractCertifications(cvText);

        return analysis;
    }

    /**
     * تحليل أداء المقابلة
     */
    async analyzeInterviewPerformance(interviewData) {
        const analysis = {
            overallScore: 0,
            communicationScore: 0,
            technicalScore: 0,
            confidenceScore: 0,
            clarityScore: 0,
            responseQuality: 0,
            insights: {},
            redFlags: [],
            positiveIndicators: []
        };

        if (!interviewData || !interviewData.responses) {
            return analysis;
        }

        // تحليل جودة الإجابات
        const responseAnalysis = this.analyzeInterviewResponses(interviewData.responses);
        analysis.responseQuality = responseAnalysis.averageQuality;
        analysis.technicalScore = responseAnalysis.technicalScore;
        
        // تحليل مهارات التواصل
        analysis.communicationScore = this.analyzeCommunicationSkills(interviewData);
        
        // تحليل الثقة والوضوح
        analysis.confidenceScore = this.analyzeConfidence(interviewData);
        analysis.clarityScore = this.analyzeClarity(interviewData);
        
        // حساب النتيجة الإجمالية
        analysis.overallScore = (
            analysis.responseQuality * 0.4 +
            analysis.communicationScore * 0.25 +
            analysis.technicalScore * 0.2 +
            analysis.confidenceScore * 0.1 +
            analysis.clarityScore * 0.05
        );
        
        // تحديد العلامات الإيجابية والسلبية
        analysis.positiveIndicators = this.identifyPositiveIndicators(interviewData);
        analysis.redFlags = this.identifyInterviewRedFlags(interviewData);
        
        // رؤى المقابلة
        analysis.insights = this.generateInterviewInsights(analysis);

        return analysis;
    }

    /**
     * تحليل التوافق مع الوظيفة
     */
    async analyzeJobCompatibility(applicantData, targetPosition) {
        const compatibility = {
            compatibilityScore: 0,
            matchingSkills: [],
            missingRequirements: [],
            overqualifications: [],
            culturalFit: 0,
            growthPotential: 0
        };

        if (!targetPosition) {
            return compatibility;
        }

        // تحليل المهارات المطلوبة
        const requiredSkills = this.getRequiredSkills(targetPosition);
        const applicantSkills = this.extractApplicantSkills(applicantData);
        
        compatibility.matchingSkills = this.findMatchingSkills(requiredSkills, applicantSkills);
        compatibility.missingRequirements = this.findMissingRequirements(requiredSkills, applicantSkills);
        
        // حساب نسبة التوافق
        const matchPercentage = compatibility.matchingSkills.length / requiredSkills.length;
        compatibility.compatibilityScore = Math.round(matchPercentage * 100);
        
        // تحليل التوافق الثقافي
        compatibility.culturalFit = this.analyzeCulturalFit(applicantData);
        
        // تحليل إمكانية النمو
        compatibility.growthPotential = this.analyzeGrowthPotential(applicantData, targetPosition);

        return compatibility;
    }

    /**
     * تحليل الشخصية
     */
    async analyzePersonality(applicantData) {
        const personality = {
            overallScore: 0,
            profile: {
                leadership: 0,
                communication: 0,
                problemSolving: 0,
                creativity: 0,
                teamwork: 0,
                adaptability: 0,
                initiative: 0,
                reliability: 0
            },
            dominantTraits: [],
            workStyle: '',
            teamRole: '',
            motivationFactors: []
        };

        const cvText = applicantData.cvContent ? applicantData.cvContent.toLowerCase() : '';
        const interviewData = applicantData.interviewData;

        // تحليل السمات من السيرة الذاتية
        Object.keys(this.personalityTraits).forEach(trait => {
            const keywords = this.personalityTraits[trait];
            let score = 0;
            
            keywords.forEach(keyword => {
                if (cvText.includes(keyword.toLowerCase())) {
                    score += 20;
                }
            });
            
            personality.profile[trait] = Math.min(score, 100);
        });

        // تحليل إضافي من المقابلة
        if (interviewData) {
            this.enhancePersonalityFromInterview(personality, interviewData);
        }

        // حساب النتيجة الإجمالية
        const scores = Object.values(personality.profile);
        personality.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        // تحديد السمات المهيمنة
        personality.dominantTraits = this.identifyDominantTraits(personality.profile);
        
        // تحديد أسلوب العمل
        personality.workStyle = this.determineWorkStyle(personality.profile);
        
        // تحديد دور الفريق
        personality.teamRole = this.determineTeamRole(personality.profile);
        
        // تحديد عوامل التحفيز
        personality.motivationFactors = this.identifyMotivationFactors(personality.profile);

        return personality;
    }

    /**
     * حساب النتيجة الإجمالية
     */
    calculateOverallScore(detailedScores) {
        let totalScore = 0;
        
        Object.keys(this.analysisWeights).forEach(category => {
            const weight = this.analysisWeights[category];
            const score = detailedScores[category] || 0;
            totalScore += score * weight;
        });
        
        return Math.round(totalScore);
    }

    /**
     * تحديد نقاط القوة
     */
    identifyStrengths(cvAnalysis, interviewAnalysis, personalityAnalysis) {
        const strengths = [];
        
        // نقاط القوة من السيرة الذاتية
        if (cvAnalysis.experienceScore > 70) {
            strengths.push({
                category: 'الخبرة العملية',
                description: `خبرة عملية قوية (${cvAnalysis.experienceYears} سنوات)`,
                score: cvAnalysis.experienceScore
            });
        }
        
        if (cvAnalysis.skillsScore > 80) {
            strengths.push({
                category: 'المهارات التقنية',
                description: 'مهارات تقنية متقدمة ومتنوعة',
                score: cvAnalysis.skillsScore
            });
        }
        
        if (cvAnalysis.educationScore > 75) {
            strengths.push({
                category: 'التعليم',
                description: `مؤهل تعليمي ممتاز (${cvAnalysis.educationLevel})`,
                score: cvAnalysis.educationScore
            });
        }

        // نقاط القوة من المقابلة
        if (interviewAnalysis && interviewAnalysis.overallScore > 75) {
            strengths.push({
                category: 'أداء المقابلة',
                description: 'أداء ممتاز في المقابلة الشخصية',
                score: interviewAnalysis.overallScore
            });
        }

        // نقاط القوة الشخصية
        Object.keys(personalityAnalysis.profile).forEach(trait => {
            const score = personalityAnalysis.profile[trait];
            if (score > 80) {
                strengths.push({
                    category: 'السمات الشخصية',
                    description: `${this.getTraitNameInArabic(trait)} متميز`,
                    score: score
                });
            }
        });

        return strengths.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    /**
     * تحديد نقاط الضعف
     */
    identifyWeaknesses(cvAnalysis, interviewAnalysis, personalityAnalysis) {
        const weaknesses = [];
        
        // نقاط الضعف من السيرة الذاتية
        if (cvAnalysis.experienceScore < 40) {
            weaknesses.push({
                category: 'الخبرة العملية',
                description: 'خبرة عملية محدودة تحتاج للتطوير',
                score: cvAnalysis.experienceScore,
                improvement: 'يُنصح بالحصول على خبرة إضافية أو تدريب متخصص'
            });
        }
        
        if (cvAnalysis.skillsScore < 50) {
            weaknesses.push({
                category: 'المهارات التقنية',
                description: 'مهارات تقنية تحتاج للتحسين',
                score: cvAnalysis.skillsScore,
                improvement: 'يُنصح بأخذ دورات تدريبية في المهارات المطلوبة'
            });
        }

        // نقاط الضعف من المقابلة
        if (interviewAnalysis && interviewAnalysis.overallScore < 50) {
            weaknesses.push({
                category: 'أداء المقابلة',
                description: 'أداء المقابلة يحتاج للتحسين',
                score: interviewAnalysis.overallScore,
                improvement: 'يُنصح بالتدرب على مهارات المقابلات الشخصية'
            });
        }

        // نقاط الضعف الشخصية
        Object.keys(personalityAnalysis.profile).forEach(trait => {
            const score = personalityAnalysis.profile[trait];
            if (score < 40) {
                weaknesses.push({
                    category: 'السمات الشخصية',
                    description: `${this.getTraitNameInArabic(trait)} يحتاج للتطوير`,
                    score: score,
                    improvement: this.getImprovementSuggestion(trait)
                });
            }
        });

        return weaknesses.sort((a, b) => a.score - b.score).slice(0, 5);
    }

    /**
     * توليد التوصيات
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        // توصيات بناءً على النتيجة الإجمالية
        if (analysis.overallScore >= 85) {
            recommendations.push({
                type: 'hiring',
                priority: 'عالية',
                title: 'مرشح ممتاز - يُنصح بالتوظيف',
                description: 'مرشح متميز يلبي جميع المتطلبات ويتجاوز التوقعات',
                action: 'المضي قدماً في عملية التوظيف فوراً'
            });
        } else if (analysis.overallScore >= 70) {
            recommendations.push({
                type: 'conditional',
                priority: 'متوسطة',
                title: 'مرشح جيد - مع بعض التحفظات',
                description: 'مرشح جيد لكن يحتاج لبعض التطوير في مناطق معينة',
                action: 'إجراء مقابلة إضافية أو تقديم برنامج تدريبي'
            });
        } else if (analysis.overallScore >= 50) {
            recommendations.push({
                type: 'development',
                priority: 'منخفضة',
                title: 'مرشح محتمل - يحتاج تطوير',
                description: 'إمكانيات جيدة لكن يحتاج لتطوير كبير',
                action: 'وضع في قائمة الانتظار مع برنامج تطوير مكثف'
            });
        } else {
            recommendations.push({
                type: 'rejection',
                priority: 'عالية',
                title: 'غير مناسب للوظيفة الحالية',
                description: 'لا يلبي الحد الأدنى من المتطلبات',
                action: 'رفض مهذب مع اقتراح وظائف أخرى مناسبة'
            });
        }

        // توصيات محددة بناءً على نقاط الضعف
        analysis.weaknesses.forEach(weakness => {
            if (weakness.improvement) {
                recommendations.push({
                    type: 'improvement',
                    priority: 'متوسطة',
                    title: `تحسين ${weakness.category}`,
                    description: weakness.improvement,
                    action: 'تقديم برنامج تدريبي مخصص'
                });
            }
        });

        return recommendations;
    }

    /**
     * تحديد عوامل المخاطرة
     */
    identifyRiskFactors(applicantData, cvAnalysis) {
        const riskFactors = [];
        
        // فجوات في التوظيف
        const employmentGaps = this.detectEmploymentGaps(applicantData.cvContent);
        if (employmentGaps.length > 0) {
            riskFactors.push({
                type: 'employment_gap',
                severity: 'متوسط',
                description: 'فجوات في التاريخ الوظيفي',
                details: employmentGaps,
                mitigation: 'استفسار عن أسباب الفجوات في المقابلة'
            });
        }
        
        // تغيير وظائف متكرر
        const jobHopping = this.detectJobHopping(applicantData.cvContent);
        if (jobHopping.risk > 0.7) {
            riskFactors.push({
                type: 'job_hopping',
                severity: 'عالي',
                description: 'تاريخ من تغيير الوظائف بشكل متكرر',
                details: `معدل تغيير الوظائف: ${jobHopping.averageStay} شهر`,
                mitigation: 'مناقشة أسباب تغيير الوظائف والالتزام طويل المدى'
            });
        }
        
        // نقص في المهارات الأساسية
        if (cvAnalysis.missingSkills && cvAnalysis.missingSkills.length > 3) {
            riskFactors.push({
                type: 'skill_gap',
                severity: 'متوسط',
                description: 'نقص في المهارات الأساسية المطلوبة',
                details: cvAnalysis.missingSkills.slice(0, 5),
                mitigation: 'برنامج تدريبي مكثف في المهارات المفقودة'
            });
        }

        return riskFactors;
    }

    // ===== Helper Methods =====

    extractExperienceYears(cvText) {
        // استخراج سنوات الخبرة من النص
        const experiencePatterns = [
            /(\d+)\s*سنة/g,
            /(\d+)\s*years?/gi,
            /(\d+)\s*عام/g
        ];
        
        let maxYears = 0;
        experiencePatterns.forEach(pattern => {
            const matches = cvText.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const years = parseInt(match.match(/\d+/)[0]);
                    maxYears = Math.max(maxYears, years);
                });
            }
        });
        
        return maxYears;
    }

    extractEducationLevel(cvText) {
        const educationLevels = {
            'دكتوراه': ['دكتوراه', 'phd', 'doctorate'],
            'ماجستير': ['ماجستير', 'master', 'masters'],
            'بكالوريوس': ['بكالوريوس', 'bachelor', 'بكالوريس'],
            'دبلوم': ['دبلوم', 'diploma'],
            'ثانوية': ['ثانوية', 'high school', 'secondary']
        };
        
        for (const [level, keywords] of Object.entries(educationLevels)) {
            if (keywords.some(keyword => cvText.includes(keyword.toLowerCase()))) {
                return level;
            }
        }
        
        return 'غير محدد';
    }

    scoreEducation(educationLevel, targetPosition) {
        const educationScores = {
            'دكتوراه': 100,
            'ماجستير': 85,
            'بكالوريوس': 70,
            'دبلوم': 50,
            'ثانوية': 30,
            'غير محدد': 0
        };
        
        return educationScores[educationLevel] || 0;
    }

    analyzeSkills(cvText, targetPosition) {
        const analysis = {
            score: 0,
            relevant: [],
            missing: []
        };
        
        if (!targetPosition || !this.industryKeywords[targetPosition]) {
            return analysis;
        }
        
        const requiredSkills = this.industryKeywords[targetPosition];
        let foundSkills = 0;
        
        requiredSkills.forEach(skill => {
            if (cvText.includes(skill.toLowerCase())) {
                analysis.relevant.push(skill);
                foundSkills++;
            } else {
                analysis.missing.push(skill);
            }
        });
        
        analysis.score = (foundSkills / requiredSkills.length) * 100;
        
        return analysis;
    }

    getTraitNameInArabic(trait) {
        const traitNames = {
            leadership: 'القيادة',
            communication: 'التواصل',
            problemSolving: 'حل المشاكل',
            creativity: 'الإبداع',
            teamwork: 'العمل الجماعي',
            adaptability: 'القدرة على التكيف',
            initiative: 'المبادرة',
            reliability: 'الموثوقية'
        };
        
        return traitNames[trait] || trait;
    }

    getImprovementSuggestion(trait) {
        const suggestions = {
            leadership: 'المشاركة في دورات القيادة وإدارة الفرق',
            communication: 'تطوير مهارات التواصل والعرض',
            problemSolving: 'التدرب على تقنيات حل المشاكل والتفكير النقدي',
            creativity: 'المشاركة في ورش الإبداع والابتكار',
            teamwork: 'العمل في مشاريع جماعية وتطوير مهارات التعاون',
            adaptability: 'التعرض لبيئات عمل متنوعة وتحديات جديدة',
            initiative: 'تولي مسؤوليات إضافية والمبادرة بمشاريع جديدة',
            reliability: 'بناء سجل حافل بالالتزام والوفاء بالمواعيد'
        };
        
        return suggestions[trait] || 'التطوير المستمر في هذا المجال';
    }

    generateErrorAnalysis(applicantId) {
        return {
            applicantId: applicantId,
            timestamp: new Date().toISOString(),
            overallScore: 0,
            error: true,
            message: 'حدث خطأ في تحليل بيانات المتقدم',
            detailedScores: {
                experience: 0,
                education: 0,
                skills: 0,
                interview: 0,
                personality: 0
            },
            strengths: [],
            weaknesses: [],
            recommendations: [{
                type: 'manual_review',
                priority: 'عالية',
                title: 'مراجعة يدوية مطلوبة',
                description: 'يرجى مراجعة ملف المتقدم يدوياً',
                action: 'إجراء تقييم يدوي شامل'
            }],
            riskFactors: [],
            compatibilityScore: 0,
            personalityProfile: {},
            careerGrowthPotential: 0,
            salaryRecommendation: {},
            interviewInsights: {}
        };
    }

    // Additional helper methods would be implemented here...
    // (Methods for interview analysis, personality assessment, etc.)
}

// تصدير الكلاس للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAIAnalyzer;
} else {
    window.AdvancedAIAnalyzer = AdvancedAIAnalyzer;
}