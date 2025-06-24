        // إعدادات Gemini API
        const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        const GEMINI_API_KEY = 'AIzaSyCV3Kb2rHMQoyAiYkrAFA82UlcGbYAAC0M';

        // اللغة الحالية
        let currentLanguage = 'ar';
        
        // المتغيرات العامة
        let visitors = JSON.parse(localStorage.getItem('visitors')) || [];
        let deleteIndex = -1;
        let filteredVisitors = [...visitors];
        let currentFilter = 'all';
        let aiReportContent = '';

        // النصوص باللغتين
        const translations = {
            ar: {
                headerTitle: 'نظام إدارة تسجيل الزوار مع الذكاء الاصطناعي',
                headerSubtitle: 'شركة MAIS للمنتجات الطبية',
                aiBadge: 'مدعوم بالذكاء الاصطناعي',
                aiSectionTitle: 'مميزات الذكاء الاصطناعي المدمجة',
                aiFeature1Title: 'تحليل ملف الزائر',
                aiFeature1Desc: 'تحليل تلقائي لمعلومات الزائر والشركة لتقديم رؤى قيمة',
                aiFeature2Title: 'البحث بالذكاء الاصطناعي',
                aiFeature2Desc: 'البحث باللغة الطبيعية للوصول السريع للمعلومات',
                aiFeature3Title: 'تقارير ذكية',
                aiFeature3Desc: 'إنشاء تقارير مفصلة ورؤى تحليلية بالذكاء الاصطناعي',
                aiFeature4Title: 'تصنيف الزيارات',
                aiFeature4Desc: 'تصنيف تلقائي لأسباب الزيارات وإنشاء إحصائيات دقيقة',
                registerTab: 'تسجيل زائر جديد',
                visitorsTab: 'سجل الزوار والإحصائيات',
                aiInsightsTab: 'رؤى الذكاء الاصطناعي',
                fullNameLabel: 'الاسم الكامل',
                phoneLabel: 'رقم الهاتف',
                idTypeLabel: 'نوع الهوية',
                idNumberLabel: 'رقم الهوية',
                companyLabel: 'الشركة/المؤسسة',
                positionLabel: 'المنصب',
                visitReasonLabel: 'سبب الزيارة',
                employeeOfficeLabel: 'الموظف/المكتب المُراد زيارته',
                emailLabel: 'البريد الإلكتروني',
                nationalityLabel: 'الجنسية',
                notesLabel: 'ملاحظات إضافية',
                aiAnalysisTitle: 'تحليل الذكاء الاصطناعي للزائر',
                aiAnalysisLoadingText: 'جاري تحليل معلومات الزائر...',
                submitBtn: 'تسجيل الزائر',
                analyzeBtn: 'تحليل بالذكاء الاصطناعي',
                clearBtn: 'مسح البيانات',
                totalLabel: 'إجمالي الزوار',
                activeLabel: 'زوار نشطون',
                todayLabel: 'زوار اليوم',
                checkedOutLabel: 'تمت زيارتهم',
                weekLabel: 'زوار هذا الأسبوع',
                aiInsightsLabel: 'رؤى الذكاء الاصطناعي',
                naturalSearchTitle: 'البحث بالذكاء الاصطناعي',
                naturalSearchBtn: 'بحث ذكي',
                filterTitle: 'تصفية النتائج',
                dateFromLabel: 'من تاريخ',
                dateToLabel: 'إلى تاريخ',
                statusFilterLabel: 'حالة الزيارة',
                searchTitle: 'البحث المتقدم',
                searchNameLabel: 'البحث بالاسم',
                searchPhoneLabel: 'البحث برقم الهاتف',
                searchCompanyLabel: 'البحث بالشركة',
                searchEmployeeLabel: 'البحث بالموظف/المكتب',
                searchReasonLabel: 'البحث بسبب الزيارة',
                searchBtn: 'بحث',
                clearSearchBtn: 'مسح البحث',
                exportBtn: 'تصدير PDF',
                aiReportBtn: 'تقرير ذكي',
                exportCSVBtn: 'تصدير CSV',
                clearAllBtn: 'مسح جميع البيانات',
                showActiveBtn: 'عرض الزوار النشطون',
                showTodayBtn: 'زوار اليوم',
                showAllBtn: 'جميع الزوار',
                aiInsightsPageTitle: 'رؤى وتحليلات الذكاء الاصطناعي',
                aiInsightsPageDesc: 'استكشف الرؤى المدعومة بالذكاء الاصطناعي حول بيانات الزوار',
                generateInsightsBtn: 'إنشاء رؤى ذكية',
                weeklyReportBtn: 'تقرير أسبوعي ذكي',
                trendAnalysisBtn: 'تحليل الاتجاهات',
                aiEmptyTitle: 'لا توجد رؤى حالياً',
                aiEmptyMessage: 'انقر على أحد الأزرار أعلاه لإنشاء رؤى ذكية',
                loadingText: 'جاري تحميل البيانات...',
                emptyTitle: 'لا توجد سجلات',
                emptyMessage: 'لم يتم العثور على أي زوار مسجلين',
                modalTitle: 'تأكيد الحذف',
                modalMessage: 'هل أنت متأكد من أنك تريد حذف هذا السجل؟',
                aiReportModalTitle: 'التقرير الذكي',
                downloadReportBtn: 'تحميل التقرير',
                closeReportBtn: 'إغلاق',
                confirmDeleteBtn: 'نعم، احذف',
                cancelBtn: 'إلغاء',
                successMessage: 'تم تسجيل الزائر بنجاح!',
                deleteSuccessMessage: 'تم حذف السجل بنجاح!',
                clearAllMessage: 'تم حذف جميع السجلات بنجاح!',
                checkoutSuccessMessage: 'تم تسجيل انهاء الزيارة بنجاح!',
                clearAllConfirm: 'هل أنت متأكد من أنك تريد حذف جميع سجلات الزوار؟ هذا الإجراء لا يمكن التراجع عنه!',
                langText: 'English',
                checkoutBtn: 'إنهاء الزيارة',
                deleteBtn: 'حذف',
                statusActive: 'نشط',
                statusCheckedOut: 'تمت الزيارة',
                visitDate: 'تاريخ الزيارة',
                checkoutDate: 'تاريخ إنهاء الزيارة',
                employee: 'الموظف/المكتب',
                phone: 'الهاتف',
                company: 'الشركة',
                reason: 'سبب الزيارة',
                status: 'الحالة',
                actions: 'الإجراءات'
            },
            en: {
                headerTitle: 'AI-Powered Visitor Management System',
                headerSubtitle: 'MAIS Medical Products Company',
                aiBadge: 'AI-Powered',
                aiSectionTitle: 'Integrated AI Features',
                aiFeature1Title: 'Visitor Profile Analysis',
                aiFeature1Desc: 'Automatic analysis of visitor and company information for valuable insights',
                aiFeature2Title: 'AI-Powered Search',
                aiFeature2Desc: 'Natural language search for quick access to information',
                aiFeature3Title: 'Smart Reports',
                aiFeature3Desc: 'Generate detailed reports and analytical insights with AI',
                aiFeature4Title: 'Visit Classification',
                aiFeature4Desc: 'Automatic classification of visit reasons and accurate statistics',
                registerTab: 'Register New Visitor',
                visitorsTab: 'Visitors Log & Statistics',
                aiInsightsTab: 'AI Insights',
                fullNameLabel: 'Full Name',
                phoneLabel: 'Phone Number',
                idTypeLabel: 'ID Type',
                idNumberLabel: 'ID Number',
                companyLabel: 'Company/Organization',
                positionLabel: 'Position',
                visitReasonLabel: 'Visit Reason',
                employeeOfficeLabel: 'Employee/Office to Visit',
                emailLabel: 'Email Address',
                nationalityLabel: 'Nationality',
                notesLabel: 'Additional Notes',
                aiAnalysisTitle: 'AI Analysis of Visitor',
                aiAnalysisLoadingText: 'Analyzing visitor information...',
                submitBtn: 'Register Visitor',
                analyzeBtn: 'AI Analysis',
                clearBtn: 'Clear Data',
                totalLabel: 'Total Visitors',
                activeLabel: 'Active Visitors',
                todayLabel: 'Today\'s Visitors',
                checkedOutLabel: 'Checked Out',
                weekLabel: 'This Week\'s Visitors',
                aiInsightsLabel: 'AI Insights',
                naturalSearchTitle: 'AI-Powered Search',
                naturalSearchBtn: 'Smart Search',
                filterTitle: 'Filter Results',
                dateFromLabel: 'From Date',
                dateToLabel: 'To Date',
                statusFilterLabel: 'Visit Status',
                searchTitle: 'Advanced Search',
                searchNameLabel: 'Search by Name',
                searchPhoneLabel: 'Search by Phone',
                searchCompanyLabel: 'Search by Company',
                searchEmployeeLabel: 'Search by Employee/Office',
                searchReasonLabel: 'Search by Visit Reason',
                searchBtn: 'Search',
                clearSearchBtn: 'Clear Search',
                exportBtn: 'Export PDF',
                aiReportBtn: 'Smart Report',
                exportCSVBtn: 'Export CSV',
                clearAllBtn: 'Clear All Data',
                showActiveBtn: 'Show Active Visitors',
                showTodayBtn: 'Today\'s Visitors',
                showAllBtn: 'All Visitors',
                aiInsightsPageTitle: 'AI Insights & Analytics',
                aiInsightsPageDesc: 'Explore AI-powered insights about visitor data',
                generateInsightsBtn: 'Generate Smart Insights',
                weeklyReportBtn: 'Smart Weekly Report',
                trendAnalysisBtn: 'Trend Analysis',
                aiEmptyTitle: 'No Insights Available',
                aiEmptyMessage: 'Click one of the buttons above to generate smart insights',
                loadingText: 'Loading data...',
                emptyTitle: 'No Records Found',
                emptyMessage: 'No registered visitors found',
                modalTitle: 'Confirm Delete',
                modalMessage: 'Are you sure you want to delete this record?',
                aiReportModalTitle: 'Smart Report',
                downloadReportBtn: 'Download Report',
                closeReportBtn: 'Close',
                confirmDeleteBtn: 'Yes, Delete',
                cancelBtn: 'Cancel',
                successMessage: 'Visitor registered successfully!',
                deleteSuccessMessage: 'Record deleted successfully!',
                clearAllMessage: 'All records deleted successfully!',
                checkoutSuccessMessage: 'Visit checkout recorded successfully!',
                clearAllConfirm: 'Are you sure you want to delete all visitor records? This action cannot be undone!',
                langText: 'العربية',
                checkoutBtn: 'Check Out',
                deleteBtn: 'Delete',
                statusActive: 'Active',
                statusCheckedOut: 'Checked Out',
                visitDate: 'Visit Date',
                checkoutDate: 'Checkout Date',
                employee: 'Employee/Office',
                phone: 'Phone',
                company: 'Company',
                reason: 'Visit Reason',
                status: 'Status',
                actions: 'Actions'
            }
        };

        // وظائف الذكاء الاصطناعي
        async function callGeminiAPI(prompt, maxTokens = 1000) {
            try {
                const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            maxOutputTokens: maxTokens,
                            temperature: 0.7,
                        }
                    })
                });

                const data = await response.json();
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error('No response from AI');
                }
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                return currentLanguage === 'ar' ? 
                    'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي.' : 
                    'Sorry, there was an error connecting to the AI service.';
            }
        }

        // تحليل الزائر بالذكاء الاصطناعي
        async function analyzeVisitor() {
            const fullName = document.getElementById('fullName').value;
            const company = document.getElementById('company').value;
            const visitReason = document.getElementById('visitReason').value;
            const notes = document.getElementById('notes').value;
            const employeeOffice = document.getElementById('employeeOffice').value;

            if (!fullName && !company) {
                showNotification(
                    currentLanguage === 'ar' ? 
                    'يرجى إدخال اسم الزائر والشركة على الأقل' : 
                    'Please enter at least visitor name and company', 
                    'warning'
                );
                return;
            }

            const analysisSection = document.getElementById('aiAnalysisSection');
            const loadingDiv = document.getElementById('aiAnalysisLoading');
            const contentDiv = document.getElementById('aiAnalysisContent');

            analysisSection.style.display = 'block';
            loadingDiv.style.display = 'flex';
            contentDiv.innerHTML = '<div class="loading-ai" id="aiAnalysisLoading"><span>' + 
                translations[currentLanguage].aiAnalysisLoadingText + '</span></div>';

            const prompt = currentLanguage === 'ar' ? `
تحليل معلومات الزائر التالية وتقديم رؤى مفيدة:

الاسم: ${fullName}
الشركة: ${company}
سبب الزيارة: ${getReasonText(visitReason)}
الموظف/المكتب المراد زيارته: ${employeeOffice}
ملاحظات: ${notes}

يرجى تقديم تحليل شامل يتضمن:
1. معلومات مختصرة عن الشركة ونشاطها
2. تقييم طبيعة الزيارة ومستوى الأهمية
3. اقتراحات للاستعداد للزيارة
4. توصيات للمتابعة

اجعل التحليل مهنياً ومفيداً لموظف الاستقبال.
` : `
Analyze the following visitor information and provide useful insights:

Name: ${fullName}
Company: ${company}
Visit Reason: ${getReasonText(visitReason)}
Employee/Office to Visit: ${employeeOffice}
Notes: ${notes}

Please provide a comprehensive analysis including:
1. Brief information about the company and its activities
2. Assessment of the visit nature and importance level
3. Suggestions for visit preparation
4. Follow-up recommendations

Make the analysis professional and useful for reception staff.
`;

            try {
                const analysis = await callGeminiAPI(prompt, 1500);
                contentDiv.innerHTML = `<div class="ai-analysis-content">${analysis}</div>`;
                loadingDiv.style.display = 'none';
            } catch (error) {
                contentDiv.innerHTML = `<div class="ai-analysis-content">${
                    currentLanguage === 'ar' ? 
                    'عذراً، لم نتمكن من إنشاء التحليل في الوقت الحالي.' : 
                    'Sorry, we could not generate the analysis at this time.'
                }</div>`;
                loadingDiv.style.display = 'none';
            }
        }

        // البحث الطبيعي بالذكاء الاصطناعي
        async function performNaturalSearch() {
            const query = document.getElementById('naturalSearchInput').value.trim();
            if (!query) {
                showNotification(
                    currentLanguage === 'ar' ? 
                    'يرجى إدخال استعلام البحث' : 
                    'Please enter a search query', 
                    'warning'
                );
                return;
            }

            showNotification(
                currentLanguage === 'ar' ? 
                'جاري معالجة البحث الذكي...' : 
                'Processing smart search...', 
                'success'
            );

            // إنشاء ملخص البيانات للذكاء الاصطناعي
            const dataSummary = visitors.map(v => ({
                name: v.fullName,
                company: v.company,
                reason: v.visitReason,
                date: new Date(v.visitDate).toLocaleDateString(),
                status: v.status,
                employee: v.employeeOffice
            }));

            const prompt = currentLanguage === 'ar' ? `
المطلوب تحليل الاستعلام التالي وتحديد الزوار المطابقين من البيانات المتوفرة:

الاستعلام: "${query}"

البيانات المتوفرة:
${JSON.stringify(dataSummary, null, 2)}

يرجى تحديد الزوار المطابقين للاستعلام وإرجاع قائمة بأسمائهم أو "لا توجد نتائج" إذا لم تجد مطابقات.
أرجع الإجابة بصيغة قائمة أسماء فقط، مفصولة بفواصل.
` : `
Please analyze the following query and identify matching visitors from the available data:

Query: "${query}"

Available data:
${JSON.stringify(dataSummary, null, 2)}

Please identify visitors matching the query and return a list of their names or "No results" if no matches found.
Return the answer as a comma-separated list of names only.
`;

            try {
                const result = await callGeminiAPI(prompt, 800);
                
                // معالجة النتيجة وتصفية الزوار
                if (result.toLowerCase().includes('no results') || result.toLowerCase().includes('لا توجد')) {
                    filteredVisitors = [];
                } else {
                    const matchedNames = result.split(',').map(name => name.trim().toLowerCase());
                    filteredVisitors = visitors.filter(visitor => 
                        matchedNames.some(name => visitor.fullName.toLowerCase().includes(name))
                    );
                }

                currentFilter = 'ai-search';
                loadVisitors();
                
                showNotification(
                    currentLanguage === 'ar' ? 
                    `تم العثور على ${filteredVisitors.length} نتيجة` : 
                    `Found ${filteredVisitors.length} results`, 
                    'success'
                );
            } catch (error) {
                showNotification(
                    currentLanguage === 'ar' ? 
                    'عذراً، حدث خطأ في البحث الذكي' : 
                    'Sorry, error in smart search', 
                    'error'
                );
            }
        }

        // تعيين استعلام البحث الطبيعي
        function setNaturalSearch(query) {
            document.getElementById('naturalSearchInput').value = query;
        }

        // إنشاء تقرير ذكي
        async function generateAIReport() {
            document.getElementById('aiReportModal').style.display = 'block';
            document.getElementById('aiReportContent').innerHTML = `
                <div class="loading-ai">
                    <span>${currentLanguage === 'ar' ? 'جاري إنشاء التقرير الذكي...' : 'Generating smart report...'}</span>
                </div>
            `;

            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const totalVisitors = visitors.length;
            const activeVisitors = visitors.filter(v => v.status === 'active').length;
            const todayVisitors = visitors.filter(v => 
                new Date(v.visitDate).toDateString() === today.toDateString()
            ).length;
            const weekVisitors = visitors.filter(v => 
                new Date(v.visitDate) >= weekAgo
            ).length;

            const companiesData = {};
            const reasonsData = {};

            visitors.forEach(visitor => {
                companiesData[visitor.company] = (companiesData[visitor.company] || 0) + 1;
                reasonsData[visitor.visitReason] = (reasonsData[visitor.visitReason] || 0) + 1;
            });

            const topCompanies = Object.entries(companiesData)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

            const topReasons = Object.entries(reasonsData)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

            const prompt = currentLanguage === 'ar' ? `
إنشاء تقرير تحليلي شامل لبيانات زوار شركة MAIS للمنتجات الطبية:

الإحصائيات العامة:
- إجمالي الزوار: ${totalVisitors}
- الزوار النشطون حالياً: ${activeVisitors}
- زوار اليوم: ${todayVisitors}
- زوار هذا الأسبوع: ${weekVisitors}

أهم الشركات الزائرة:
${topCompanies.map(([company, count]) => `- ${company}: ${count} زيارة`).join('\n')}

أهم أسباب الزيارات:
${topReasons.map(([reason, count]) => `- ${getReasonText(reason)}: ${count} زيارة`).join('\n')}

يرجى إنشاء تقرير تحليلي مفصل يتضمن:
1. ملخص تنفيذي
2. تحليل الاتجاهات
3. الرؤى والتوصيات
4. النقاط المهمة للإدارة

اجعل التقرير مهنياً ومناسباً للإدارة العليا.
` : `
Generate a comprehensive analytical report for MAIS Medical Products Company visitor data:

General Statistics:
- Total Visitors: ${totalVisitors}
- Currently Active Visitors: ${activeVisitors}
- Today's Visitors: ${todayVisitors}
- This Week's Visitors: ${weekVisitors}

Top Visiting Companies:
${topCompanies.map(([company, count]) => `- ${company}: ${count} visits`).join('\n')}

Top Visit Reasons:
${topReasons.map(([reason, count]) => `- ${getReasonText(reason)}: ${count} visits`).join('\n')}

Please generate a detailed analytical report including:
1. Executive Summary
2. Trend Analysis
3. Insights and Recommendations
4. Key Points for Management

Make the report professional and suitable for senior management.
`;

            try {
                const report = await callGeminiAPI(prompt, 2000);
                aiReportContent = report;
                document.getElementById('aiReportContent').innerHTML = `
                    <div class="ai-report-content">${report}</div>
                `;
                document.getElementById('downloadReportBtn').style.display = 'inline-flex';
            } catch (error) {
                document.getElementById('aiReportContent').innerHTML = `
                    <div class="ai-report-content">${
                        currentLanguage === 'ar' ? 
                        'عذراً، لم نتمكن من إنشاء التقرير في الوقت الحالي.' : 
                        'Sorry, we could not generate the report at this time.'
                    }</div>
                `;
            }
        }

        // إنشاء رؤى ذكية
        async function generateAIInsights() {
            const contentDiv = document.getElementById('aiInsightsContent');
            contentDiv.innerHTML = `
                <div class="loading-ai">
                    <span>${currentLanguage === 'ar' ? 'جاري إنشاء الرؤى الذكية...' : 'Generating smart insights...'}</span>
                </div>
            `;

            const visitorsThisMonth = visitors.filter(v => {
                const visitDate = new Date(v.visitDate);
                const now = new Date();
                return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
            });

            const prompt = currentLanguage === 'ar' ? `
تحليل بيانات الزوار لشركة MAIS وتقديم رؤى ذكية:

بيانات هذا الشهر: ${visitorsThisMonth.length} زائر
إجمالي الزوار: ${visitors.length}
الزوار النشطون: ${visitors.filter(v => v.status === 'active').length}

أنواع الزيارات:
${Object.entries(visitors.reduce((acc, v) => {
    acc[v.visitReason] = (acc[v.visitReason] || 0) + 1;
    return acc;
}, {})).map(([reason, count]) => `${getReasonText(reason)}: ${count}`).join(', ')}

قدم رؤى ذكية تتضمن:
1. تحليل الأنماط الزمنية
2. تحديد الاتجاهات المهمة
3. اقتراحات التحسين
4. توقعات مستقبلية
5. نصائح إدارية

اجعل الرؤى عملية ومفيدة لتحسين إدارة الزوار.
` : `
Analyze visitor data for MAIS company and provide smart insights:

This month's data: ${visitorsThisMonth.length} visitors
Total visitors: ${visitors.length}
Active visitors: ${visitors.filter(v => v.status === 'active').length} visitors

Visit types:
${Object.entries(visitors.reduce((acc, v) => {
    acc[v.visitReason] = (acc[v.visitReason] || 0) + 1;
    return acc;
}, {})).map(([reason, count]) => `${getReasonText(reason)}: ${count}`).join(', ')}

Provide smart insights including:
1. Time pattern analysis
2. Important trend identification
3. Improvement suggestions
4. Future predictions
5. Management tips

Make insights practical and useful for improving visitor management.
`;

            try {
                const insights = await callGeminiAPI(prompt, 1800);
                contentDiv.innerHTML = `
                    <div class="ai-report-content">${insights}</div>
                `;
                
                // تحديث عداد الرؤى
                document.getElementById('aiInsightsCount').textContent = '✓';
            } catch (error) {
                contentDiv.innerHTML = `
                    <div class="empty-state">
                        <h3>${currentLanguage === 'ar' ? 'خطأ في إنشاء الرؤى' : 'Error generating insights'}</h3>
                        <p>${currentLanguage === 'ar' ? 'يرجى المحاولة مرة أخرى' : 'Please try again'}</p>
                    </div>
                `;
            }
        }

        // إنشاء تقرير أسبوعي ذكي
        async function generateWeeklyReport() {
            const contentDiv = document.getElementById('aiInsightsContent');
            contentDiv.innerHTML = `
                <div class="loading-ai">
                    <span>${currentLanguage === 'ar' ? 'جاري إنشاء التقرير الأسبوعي...' : 'Generating weekly report...'}</span>
                </div>
            `;

            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            
            const weeklyVisitors = visitors.filter(v => new Date(v.visitDate) >= weekAgo);
            
            const dailyBreakdown = {};
            weeklyVisitors.forEach(visitor => {
                const day = new Date(visitor.visitDate).toLocaleDateString();
                dailyBreakdown[day] = (dailyBreakdown[day] || 0) + 1;
            });

            const prompt = currentLanguage === 'ar' ? `
إنشاء تقرير أسبوعي شامل لزوار شركة MAIS:

فترة التقرير: آخر 7 أيام
عدد الزوار: ${weeklyVisitors.length}

التوزيع اليومي:
${Object.entries(dailyBreakdown).map(([date, count]) => `${date}: ${count} زائر`).join('\n')}

أهم الشركات الزائرة هذا الأسبوع:
${Object.entries(weeklyVisitors.reduce((acc, v) => {
    acc[v.company] = (acc[v.company] || 0) + 1;
    return acc;
}, {})).slice(0, 5).map(([company, count]) => `${company}: ${count} زيارة`).join('\n')}

قدم تقريراً أسبوعياً يتضمن:
1. ملخص الأسبوع
2. مقارنة مع الأسابيع السابقة (إذا كانت البيانات متوفرة)
3. أبرز الأحداث والزيارات
4. التوصيات للأسبوع القادم
5. نقاط تحتاج متابعة

اجعل التقرير مفيداً لفريق الإدارة.
` : `
Generate a comprehensive weekly report for MAIS company visitors:

Report Period: Last 7 days
Number of visitors: ${weeklyVisitors.length}

Daily Breakdown:
${Object.entries(dailyBreakdown).map(([date, count]) => `${date}: ${count} visitors`).join('\n')}

Top visiting companies this week:
${Object.entries(weeklyVisitors.reduce((acc, v) => {
    acc[v.company] = (acc[v.company] || 0) + 1;
    return acc;
}, {})).slice(0, 5).map(([company, count]) => `${company}: ${count} visits`).join('\n')}

Provide a weekly report including:
1. Week summary
2. Comparison with previous weeks (if data available)
3. Key events and visits
4. Recommendations for next week
5. Points requiring follow-up

Make the report useful for the management team.
`;

            try {
                const report = await callGeminiAPI(prompt, 1800);
                contentDiv.innerHTML = `
                    <div class="ai-report-content">${report}</div>
                `;
            } catch (error) {
                contentDiv.innerHTML = `
                    <div class="empty-state">
                        <h3>${currentLanguage === 'ar' ? 'خطأ في إنشاء التقرير' : 'Error generating report'}</h3>
                        <p>${currentLanguage === 'ar' ? 'يرجى المحاولة مرة أخرى' : 'Please try again'}</p>
                    </div>
                `;
            }
        }

        // تحليل الاتجاهات
        async function generateTrendAnalysis() {
            const contentDiv = document.getElementById('aiInsightsContent');
            contentDiv.innerHTML = `
                <div class="loading-ai">
                    <span>${currentLanguage === 'ar' ? 'جاري تحليل الاتجاهات...' : 'Analyzing trends...'}</span>
                </div>
            `;

            // تحليل البيانات حسب الشهر
            const monthlyData = {};
            visitors.forEach(visitor => {
                const month = new Date(visitor.visitDate).toISOString().slice(0, 7);
                if (!monthlyData[month]) {
                    monthlyData[month] = { total: 0, reasons: {}, companies: {} };
                }
                monthlyData[month].total++;
                monthlyData[month].reasons[visitor.visitReason] = (monthlyData[month].reasons[visitor.visitReason] || 0) + 1;
                monthlyData[month].companies[visitor.company] = (monthlyData[month].companies[visitor.company] || 0) + 1;
            });

            const prompt = currentLanguage === 'ar' ? `
تحليل اتجاهات زوار شركة MAIS بناءً على البيانات التالية:

البيانات الشهرية:
${Object.entries(monthlyData).map(([month, data]) => 
    `${month}: ${data.total} زائر`
).join('\n')}

قدم تحليلاً شاملاً للاتجاهات يتضمن:
1. الاتجاهات الزمنية العامة
2. أنماط الزيارات الموسمية
3. نمو أو تراجع أعداد الزوار
4. تغييرات في أنواع الزيارات
5. توقعات الاتجاهات المستقبلية
6. عوامل قد تؤثر على هذه الاتجاهات
7. استراتيجيات للاستفادة من الاتجاهات الإيجابية

اجعل التحليل مفيداً لاتخاذ القرارات الاستراتيجية.
` : `
Analyze visitor trends for MAIS company based on the following data:

Monthly Data:
${Object.entries(monthlyData).map(([month, data]) => 
    `${month}: ${data.total} visitors`
).join('\n')}

Provide comprehensive trend analysis including:
1. General time trends
2. Seasonal visit patterns
3. Growth or decline in visitor numbers
4. Changes in visit types
5. Future trend predictions
6. Factors that may affect these trends
7. Strategies to leverage positive trends

Make the analysis useful for strategic decision-making.
`;

            try {
                const analysis = await callGeminiAPI(prompt, 2000);
                contentDiv.innerHTML = `
                    <div class="ai-report-content">${analysis}</div>
                `;
            } catch (error) {
                contentDiv.innerHTML = `
                    <div class="empty-state">
                        <h3>${currentLanguage === 'ar' ? 'خطأ في تحليل الاتجاهات' : 'Error analyzing trends'}</h3>
                        <p>${currentLanguage === 'ar' ? 'يرجى المحاولة مرة أخرى' : 'Please try again'}</p>
                    </div>
                `;
            }
        }

        // تحميل التقرير الذكي
        function downloadAIReport() {
            if (!aiReportContent) return;

            const blob = new Blob([aiReportContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `AI_Report_${new Date().toISOString().slice(0, 10)}.txt`;
            link.click();
        }

        // إغلاق نافذة التقرير الذكي
        function closeAIReportModal() {
            document.getElementById('aiReportModal').style.display = 'none';
            document.getElementById('downloadReportBtn').style.display = 'none';
            aiReportContent = '';
        }

        // تحديث النصوص
        function updateTexts() {
            const texts = translations[currentLanguage];
            for (const [key, value] of Object.entries(texts)) {
                const element = document.getElementById(key);
                if (element) {
                    element.textContent = value;
                }
            }
            
            // تحديث الاتجاه
            const container = document.getElementById('container');
            if (currentLanguage === 'ar') {
                container.setAttribute('dir', 'rtl');
                document.documentElement.setAttribute('dir', 'rtl');
                document.documentElement.setAttribute('lang', 'ar');
            } else {
                container.setAttribute('dir', 'ltr');
                document.documentElement.setAttribute('dir', 'ltr');
                document.documentElement.setAttribute('lang', 'en');
            }
            
            // تحديث قوائم الاختيار
            updateSelectOptions();
            
            // تحديث placeholders
            updatePlaceholders();
        }

        // تحديث النصوص النائبة
        function updatePlaceholders() {
            const placeholders = {
                ar: {
                    fullName: 'ادخل الاسم الكامل',
                    phone: 'ادخل رقم الهاتف',
                    idNumber: 'ادخل رقم الهوية',
                    company: 'ادخل اسم الشركة',
                    position: 'ادخل المنصب',
                    employeeOffice: 'ادخل اسم الموظف أو المكتب',
                    email: 'ادخل البريد الإلكتروني',
                    nationality: 'ادخل الجنسية',
                    notes: 'أضف أي ملاحظات إضافية هنا...',
                    naturalSearchInput: 'اسأل عن الزوار، مثال: أظهر لي زوار شركة X الأسبوع الماضي',
                    searchName: 'ادخل الاسم...',
                    searchPhone: 'ادخل رقم الهاتف...',
                    searchCompany: 'ادخل اسم الشركة...',
                    searchEmployee: 'ادخل اسم الموظف...'
                },
                en: {
                    fullName: 'Enter full name',
                    phone: 'Enter phone number',
                    idNumber: 'Enter ID number',
                    company: 'Enter company name',
                    position: 'Enter position',
                    employeeOffice: 'Enter employee or office name',
                    email: 'Enter email address',
                    nationality: 'Enter nationality',
                    notes: 'Add any additional notes here...',
                    naturalSearchInput: 'Ask about visitors, e.g.: Show me visitors from company X last week',
                    searchName: 'Enter name...',
                    searchPhone: 'Enter phone number...',
                    searchCompany: 'Enter company name...',
                    searchEmployee: 'Enter employee name...'
                }
            };

            const currentPlaceholders = placeholders[currentLanguage];
            for (const [id, placeholder] of Object.entries(currentPlaceholders)) {
                const element = document.getElementById(id);
                if (element) {
                    element.placeholder = placeholder;
                }
            }
        }

        // تحديث خيارات قوائم الاختيار
        function updateSelectOptions() {
            const idTypeSelect = document.getElementById('idType');
            const visitReasonSelect = document.getElementById('visitReason');
            const searchReasonSelect = document.getElementById('searchReason');
            const statusFilterSelect = document.getElementById('statusFilter');

            if (currentLanguage === 'ar') {
                idTypeSelect.innerHTML = `
                    <option value="">اختر نوع الهوية</option>
                    <option value="national">هوية وطنية</option>
                    <option value="passport">جواز سفر</option>
                    <option value="residence">إقامة</option>
                    <option value="other">أخرى</option>
                `;
                
                visitReasonSelect.innerHTML = `
                    <option value="">اختر سبب الزيارة</option>
                    <option value="business">اجتماع عمل</option>
                    <option value="consultation">استشارة طبية</option>
                    <option value="meeting">اجتماع</option>
                    <option value="delivery">تسليم</option>
                    <option value="maintenance">صيانة</option>
                    <option value="training">تدريب</option>
                    <option value="interview">مقابلة</option>
                    <option value="other">أخرى</option>
                `;
                
                searchReasonSelect.innerHTML = `
                    <option value="">جميع الأسباب</option>
                    <option value="business">اجتماع عمل</option>
                    <option value="consultation">استشارة طبية</option>
                    <option value="meeting">اجتماع</option>
                    <option value="delivery">تسليم</option>
                    <option value="maintenance">صيانة</option>
                    <option value="training">تدريب</option>
                    <option value="interview">مقابلة</option>
                    <option value="other">أخرى</option>
                `;

                statusFilterSelect.innerHTML = `
                    <option value="">جميع الحالات</option>
                    <option value="active">نشط</option>
                    <option value="checked-out">تمت الزيارة</option>
                `;
            } else {
                idTypeSelect.innerHTML = `
                    <option value="">Select ID Type</option>
                    <option value="national">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="residence">Residence Permit</option>
                    <option value="other">Other</option>
                `;
                
                visitReasonSelect.innerHTML = `
                    <option value="">Select Visit Reason</option>
                    <option value="business">Business Meeting</option>
                    <option value="consultation">Medical Consultation</option>
                    <option value="meeting">Meeting</option>
                    <option value="delivery">Delivery</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="training">Training</option>
                    <option value="interview">Interview</option>
                    <option value="other">Other</option>
                `;
                
                searchReasonSelect.innerHTML = `
                    <option value="">All Reasons</option>
                    <option value="business">Business Meeting</option>
                    <option value="consultation">Medical Consultation</option>
                    <option value="meeting">Meeting</option>
                    <option value="delivery">Delivery</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="training">Training</option>
                    <option value="interview">Interview</option>
                    <option value="other">Other</option>
                `;

                statusFilterSelect.innerHTML = `
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="checked-out">Checked Out</option>
                `;
            }
        }

        // تبديل اللغة
        function toggleLanguage() {
            currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
            updateTexts();
            loadVisitors();
            updateStats();
        }

        // إظهار التبويب
        function showTab(tabName) {
            // إخفاء جميع التبويبات
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // إزالة الكلاس النشط من جميع الأزرار
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // إظهار التبويب المحدد
            document.getElementById(tabName).classList.add('active');
            
            // إضافة الكلاس النشط للزر المحدد
            if (tabName === 'register') {
                document.getElementById('registerTab').classList.add('active');
            } else if (tabName === 'visitors') {
                document.getElementById('visitorsTab').classList.add('active');
                loadVisitors();
                updateStats();
            } else if (tabName === 'aiInsights') {
                document.getElementById('aiInsightsTab').classList.add('active');
            }
        }

        // إرسال النموذج
        document.getElementById('visitorForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const visitor = {
                id: Date.now(),
                fullName: formData.get('fullName') || '-',
                phone: formData.get('phone') || '-',
                idType: formData.get('idType') || '-',
                idNumber: formData.get('idNumber') || '-',
                company: formData.get('company') || '-',
                position: formData.get('position') || '-',
                visitReason: formData.get('visitReason') || '-',
                employeeOffice: formData.get('employeeOffice') || '-',
                email: formData.get('email') || '-',
                nationality: formData.get('nationality') || '-',
                notes: formData.get('notes') || '-',
                visitDate: new Date().toISOString(),
                status: 'active',
                checkoutDate: null
            };
            
            // visitors.push(visitor);
            visitors.unshift(visitor); // إضافة الزائر الجديد في بداية المصفوفة
            
            localStorage.setItem('visitors', JSON.stringify(visitors));
            
            showNotification(translations[currentLanguage].successMessage, 'success');
            clearForm();
            
            // التبديل تلقائياً إلى تبويب الزوار وتحديث الإحصائيات
            showTab('visitors');
            setTimeout(() => {
                updateStats();
            }, 100);
        });

        // مسح النموذج
        function clearForm() {
            document.getElementById('visitorForm').reset();
            document.getElementById('aiAnalysisSection').style.display = 'none';
        }

        // إظهار الإشعارات
        function showNotification(message, type = 'success') {
            // إزالة الإشعارات السابقة
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notification => notification.remove());

            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // تحديث الإحصائيات
        function updateStats() {
            const total = visitors.length;
            const active = visitors.filter(v => v.status === 'active').length;
            const checkedOut = visitors.filter(v => v.status === 'checked-out').length;
            
            const today = new Date().toDateString();
            const todayCount = visitors.filter(v => 
                new Date(v.visitDate).toDateString() === today
            ).length;
            
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekCount = visitors.filter(v => 
                new Date(v.visitDate) >= weekAgo
            ).length;
            
            document.getElementById('totalVisitors').textContent = total;
            document.getElementById('activeVisitors').textContent = active;
            document.getElementById('todayVisitors').textContent = todayCount;
            document.getElementById('checkedOutVisitors').textContent = checkedOut;
            document.getElementById('weekVisitors').textContent = weekCount;
        }

        // تحميل الزوار
        function loadVisitors() {
            const loadingDiv = document.getElementById('loadingIndicator');
            const emptyDiv = document.getElementById('emptyState');
            const displayDiv = document.getElementById('visitorsDisplay');
            
            loadingDiv.style.display = 'block';
            emptyDiv.style.display = 'none';
            displayDiv.innerHTML = '';
            
            setTimeout(() => {
                loadingDiv.style.display = 'none';
                
                if (filteredVisitors.length === 0) {
                    emptyDiv.style.display = 'block';
                } else {
                    emptyDiv.style.display = 'none';
                    renderVisitors();
                }
            }, 500);
        }

        // عرض الزوار كبطاقات
        function renderVisitors() {
            const displayDiv = document.getElementById('visitorsDisplay');
            displayDiv.innerHTML = '';
            
            filteredVisitors.forEach((visitor, index) => {
                const card = document.createElement('div');
                card.className = 'visitor-card';
                
                const visitDate = new Date(visitor.visitDate);
                const formattedVisitDate = visitDate.toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US') + 
                                         ' ' + visitDate.toLocaleTimeString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US');
                
                let checkoutInfo = '';
                if (visitor.checkoutDate) {
                    const checkoutDate = new Date(visitor.checkoutDate);
                    const formattedCheckoutDate = checkoutDate.toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US') + 
                                                 ' ' + checkoutDate.toLocaleTimeString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US');
                    checkoutInfo = `
                        <div class="visitor-detail">
                            <strong>${translations[currentLanguage].checkoutDate}:</strong> ${formattedCheckoutDate}
                        </div>
                    `;
                }
                
                const idTypeText = getIdTypeText(visitor.idType);
                const reasonText = getReasonText(visitor.visitReason);
                const statusText = visitor.status === 'active' ? 
                    translations[currentLanguage].statusActive : 
                    translations[currentLanguage].statusCheckedOut;
                
                card.innerHTML = `
                    <h4>${visitor.fullName}</h4>
                    <div class="visitor-details">
                        <div class="visitor-detail">
                            <strong>${translations[currentLanguage].phone}:</strong> ${visitor.phone}
                        </div>
                        <div class="visitor-detail">
                            <strong>${translations[currentLanguage].company}:</strong> ${visitor.company}
                        </div>
                        <div class="visitor-detail">
                            <strong>${translations[currentLanguage].employee}:</strong> ${visitor.employeeOffice}
                        </div>
                        <div class="visitor-detail">
                            <strong>${translations[currentLanguage].reason}:</strong> ${reasonText}
                        </div>
                        <div class="visitor-detail">
                            <strong>${translations[currentLanguage].visitDate}:</strong> ${formattedVisitDate}
                        </div>
                        ${checkoutInfo}
                        <div class="visitor-detail">
                            <strong>${translations[currentLanguage].status}:</strong> 
                            <span class="status-badge ${visitor.status === 'active' ? 'status-active' : 'status-checked-out'}">${statusText}</span>
                        </div>
                    </div>
                    <div class="action-buttons">
                        ${visitor.status === 'active' ? `
                            <button class="action-btn checkout-btn" onclick="checkoutVisitor(${visitors.indexOf(visitor)})">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                                ${translations[currentLanguage].checkoutBtn}
                            </button>
                        ` : ''}
                        <button class="action-btn delete-btn" onclick="confirmDelete(${visitors.indexOf(visitor)})">
                            <svg class="icon" viewBox="0 0 24 24">
                                <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                            </svg>
                            ${translations[currentLanguage].deleteBtn}
                        </button>
                    </div>
                `;
                
                displayDiv.appendChild(card);
            });
        }

        // إنهاء زيارة
        function checkoutVisitor(index) {
            visitors[index].status = 'checked-out';
            visitors[index].checkoutDate = new Date().toISOString();
            localStorage.setItem('visitors', JSON.stringify(visitors));
            
            showNotification(translations[currentLanguage].checkoutSuccessMessage, 'success');
            applyCurrentFilter();
            updateStats();
        }

        // عرض الزوار النشطون
        function showActiveVisitors() {
            currentFilter = 'active';
            filteredVisitors = visitors.filter(v => v.status === 'active');
            loadVisitors();
        }

        // عرض زوار اليوم
        function showTodayVisitors() {
            currentFilter = 'today';
            const today = new Date().toDateString();
            filteredVisitors = visitors.filter(v => 
                new Date(v.visitDate).toDateString() === today
            );
            loadVisitors();
        }

        // عرض جميع الزوار
        function showAllVisitors() {
            currentFilter = 'all';
            filteredVisitors = [...visitors];
            loadVisitors();
        }

        // تطبيق الفلتر الحالي
        function applyCurrentFilter() {
            switch (currentFilter) {
                case 'active':
                    showActiveVisitors();
                    break;
                case 'today':
                    showTodayVisitors();
                    break;
                default:
                    showAllVisitors();
                    break;
            }
        }

        // الحصول على نص نوع الهوية
        function getIdTypeText(idType) {
            const texts = {
                ar: {
                    national: 'هوية وطنية',
                    passport: 'جواز سفر',
                    residence: 'إقامة',
                    other: 'أخرى'
                },
                en: {
                    national: 'National ID',
                    passport: 'Passport',
                    residence: 'Residence Permit',
                    other: 'Other'
                }
            };
            return texts[currentLanguage][idType] || idType;
        }

        // الحصول على نص سبب الزيارة
        function getReasonText(reason) {
            const texts = {
                ar: {
                    business: 'اجتماع عمل',
                    consultation: 'استشارة طبية',
                    meeting: 'اجتماع',
                    delivery: 'تسليم',
                    maintenance: 'صيانة',
                    training: 'تدريب',
                    interview: 'مقابلة',
                    other: 'أخرى'
                },
                en: {
                    business: 'Business Meeting',
                    consultation: 'Medical Consultation',
                    meeting: 'Meeting',
                    delivery: 'Delivery',
                    maintenance: 'Maintenance',
                    training: 'Training',
                    interview: 'Interview',
                    other: 'Other'
                }
            };
            return texts[currentLanguage][reason] || reason;
        }

        // تأكيد الحذف
        function confirmDelete(index) {
            deleteIndex = index;
            document.getElementById('confirmModal').style.display = 'block';
        }

        // تنفيذ الحذف
        function executeDelete() {
            if (deleteIndex >= 0) {
                visitors.splice(deleteIndex, 1);
                localStorage.setItem('visitors', JSON.stringify(visitors));
                
                showNotification(translations[currentLanguage].deleteSuccessMessage, 'success');
                applyCurrentFilter();
                updateStats();
            }
            closeModal();
        }

        // إغلاق النافذة المنبثقة
        function closeModal() {
            document.getElementById('confirmModal').style.display = 'none';
            deleteIndex = -1;
        }

        // تأكيد مسح جميع البيانات
        function confirmClearAll() {
            const confirmed = confirm(translations[currentLanguage].clearAllConfirm);
            if (confirmed) {
                visitors = [];
                filteredVisitors = [];
                localStorage.setItem('visitors', JSON.stringify(visitors));
                
                showNotification(translations[currentLanguage].clearAllMessage, 'success');
                loadVisitors();
                updateStats();
            }
        }

        // البحث في الزوار
        function searchVisitors() {
            const name = document.getElementById('searchName').value.toLowerCase();
            const phone = document.getElementById('searchPhone').value.toLowerCase();
            const company = document.getElementById('searchCompany').value.toLowerCase();
            const employee = document.getElementById('searchEmployee').value.toLowerCase();
            const reason = document.getElementById('searchReason').value;
            const dateFrom = document.getElementById('dateFrom').value;
            const dateTo = document.getElementById('dateTo').value;
            const statusFilter = document.getElementById('statusFilter').value;
            
            filteredVisitors = visitors.filter(visitor => {
                const matchName = !name || visitor.fullName.toLowerCase().includes(name);
                const matchPhone = !phone || visitor.phone.toLowerCase().includes(phone);
                const matchCompany = !company || visitor.company.toLowerCase().includes(company);
                const matchEmployee = !employee || visitor.employeeOffice.toLowerCase().includes(employee);
                const matchReason = !reason || visitor.visitReason === reason;
                const matchStatus = !statusFilter || visitor.status === statusFilter;
                
                let matchDate = true;
                if (dateFrom || dateTo) {
                    const visitDate = new Date(visitor.visitDate).toDateString();
                    if (dateFrom) {
                        matchDate = matchDate && new Date(visitDate) >= new Date(dateFrom);
                    }
                    if (dateTo) {
                        matchDate = matchDate && new Date(visitDate) <= new Date(dateTo);
                    }
                }
                
                return matchName && matchPhone && matchCompany && matchEmployee && matchReason && matchStatus && matchDate;
            });
            
            currentFilter = 'search';
            loadVisitors();
        }

        // مسح البحث
        function clearSearch() {
            document.getElementById('searchName').value = '';
            document.getElementById('searchPhone').value = '';
            document.getElementById('searchCompany').value = '';
            document.getElementById('searchEmployee').value = '';
            document.getElementById('searchReason').value = '';
            document.getElementById('dateFrom').value = '';
            document.getElementById('dateTo').value = '';
            document.getElementById('statusFilter').value = '';
            document.getElementById('naturalSearchInput').value = '';
            
            showAllVisitors();
        }

        // تصدير إلى PDF
        function exportToPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFont('helvetica');
            
            const title = currentLanguage === 'ar' ? 
                'تقرير سجل الزوار - شركة MAIS' : 
                'Visitors Log Report - MAIS Company';
            
            doc.setFontSize(16);
            doc.text(title, 20, 20);
            
            const date = new Date().toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US');
            doc.setFontSize(12);
            doc.text(`${currentLanguage === 'ar' ? 'تاريخ التقرير: ' : 'Report Date: '}${date}`, 20, 35);
            
            let yPos = 50;
            
            filteredVisitors.forEach((visitor, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                
                const visitDate = new Date(visitor.visitDate).toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US');
                const idTypeText = getIdTypeText(visitor.idType);
                const reasonText = getReasonText(visitor.visitReason);
                const statusText = visitor.status === 'active' ? 
                    translations[currentLanguage].statusActive : 
                    translations[currentLanguage].statusCheckedOut;
                
                doc.text(`${index + 1}. ${visitor.fullName}`, 20, yPos);
                doc.text(`${currentLanguage === 'ar' ? 'الهاتف: ' : 'Phone: '}${visitor.phone}`, 20, yPos + 10);
                doc.text(`${currentLanguage === 'ar' ? 'الشركة: ' : 'Company: '}${visitor.company}`, 20, yPos + 20);
                doc.text(`${currentLanguage === 'ar' ? 'الموظف/المكتب: ' : 'Employee/Office: '}${visitor.employeeOffice}`, 20, yPos + 30);
                doc.text(`${currentLanguage === 'ar' ? 'سبب الزيارة: ' : 'Visit Reason: '}${reasonText}`, 20, yPos + 40);
                doc.text(`${currentLanguage === 'ar' ? 'الحالة: ' : 'Status: '}${statusText}`, 20, yPos + 50);
                doc.text(`${currentLanguage === 'ar' ? 'التاريخ: ' : 'Date: '}${visitDate}`, 20, yPos + 60);
                
                yPos += 75;
            });
            
            doc.save('visitors_report.pdf');
        }

        // تصدير إلى CSV
        function exportToCSV() {
            const csvContent = [
                [
                    currentLanguage === 'ar' ? 'الاسم' : 'Name',
                    currentLanguage === 'ar' ? 'الهاتف' : 'Phone',
                    currentLanguage === 'ar' ? 'الشركة' : 'Company',
                    currentLanguage === 'ar' ? 'الموظف/المكتب' : 'Employee/Office',
                    currentLanguage === 'ar' ? 'سبب الزيارة' : 'Visit Reason',
                    currentLanguage === 'ar' ? 'الحالة' : 'Status',
                    currentLanguage === 'ar' ? 'تاريخ الزيارة' : 'Visit Date',
                    currentLanguage === 'ar' ? 'تاريخ إنهاء الزيارة' : 'Checkout Date'
                ].join(',')
            ];

            filteredVisitors.forEach(visitor => {
                const visitDate = new Date(visitor.visitDate).toLocaleDateString();
                const checkoutDate = visitor.checkoutDate ? new Date(visitor.checkoutDate).toLocaleDateString() : '-';
                const reasonText = getReasonText(visitor.visitReason);
                const statusText = visitor.status === 'active' ? 
                    translations[currentLanguage].statusActive : 
                    translations[currentLanguage].statusCheckedOut;

                csvContent.push([
                    visitor.fullName,
                    visitor.phone,
                    visitor.company,
                    visitor.employeeOffice,
                    reasonText,
                    statusText,
                    visitDate,
                    checkoutDate
                ].join(','));
            });

            const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'visitors_report.csv';
            link.click();
        }

        // إضافة مستمعي الأحداث للبحث والفلترة
        document.getElementById('searchName').addEventListener('input', searchVisitors);
        document.getElementById('searchPhone').addEventListener('input', searchVisitors);
        document.getElementById('searchCompany').addEventListener('input', searchVisitors);
        document.getElementById('searchEmployee').addEventListener('input', searchVisitors);
        document.getElementById('searchReason').addEventListener('change', searchVisitors);
        document.getElementById('dateFrom').addEventListener('change', searchVisitors);
        document.getElementById('dateTo').addEventListener('change', searchVisitors);
        document.getElementById('statusFilter').addEventListener('change', searchVisitors);

        // مستمع للبحث الطبيعي بـ Enter
        document.getElementById('naturalSearchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performNaturalSearch();
            }
        });

        // إغلاق النافذة المنبثقة عند النقر خارجها
        window.onclick = function(event) {
            const modal = document.getElementById('confirmModal');
            const aiModal = document.getElementById('aiReportModal');
            
            if (event.target === modal) {
                closeModal();
            }
            if (event.target === aiModal) {
                closeAIReportModal();
            }
        }

        // تهيئة التطبيق
        document.addEventListener('DOMContentLoaded', function() {
            updateTexts();
            filteredVisitors = [...visitors];
            updateStats();
            
            // إخفاء قسم تحليل الذكاء الاصطناعي في البداية
            document.getElementById('aiAnalysisSection').style.display = 'none';
        });