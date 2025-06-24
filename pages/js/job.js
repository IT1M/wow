        // --- Configuration ---
        // Supabase Project URL and Anon Key (Updated to new project)
        const SUPABASE_URL = 'https://uxoyfuatfafeqvdvehvy.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4b3lmdWF0ZmFmZXF2ZHZlaHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MzA0MjgsImV4cCI6MjA2NjMwNjQyOH0.zaj3WdZ_FlAyDGq3qKzvr4mfD_dr20ElBQv0gBwhdoU';

        // Gemini API Key (Replace with your actual key)
        const GEMINI_API_KEY = 'AIzaSyDtV7PQq8KeysGwiK705LlZzRSG1Pzyk68'; // User provided this key
        // Gemini API Endpoint (Using gemini-1.5-flash-latest as in original code)
        const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

        // --- IMPORTANT: Supabase Storage Bucket ---
        // --- You MUST create a bucket named 'files' in your Supabase project Storage. ---
        // --- Go to Supabase Dashboard -> Storage -> Create bucket -> Name: 'files' ---
        // --- Set appropriate RLS policies for uploads and reads. See comments at the end of script. ---
        const BUCKET_NAME = 'files'; 

        // --- Supabase Client Initialization ---
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
            global: { headers: { 'X-Client-Info': 'recruitment-platform-v2.2' } } // Updated version
        });
        
        // --- Global State Variables ---
        let currentStep = 1;
        let uploadedFileObject = null; // Stores the File object itself, used for reading content
        let uploadedFileUrl = null;    // Stores the path in Supabase storage (e.g., USER_ID/APP_ID_filename.ext)
        let resumeAnalysis = null;
        let interviewQuestionsData = null;
        let interviewAnswers = [];
        let mediaRecorder = null;
        let audioChunks = [];
        let currentUser = null;
        let autosaveTimer = null;
        let applicationId = null; // Unique ID for each application attempt (usually the DB primary key of the application)
        
        // --- Authentication Modal ---
        function showAuthModal() {
            document.getElementById('authModal').style.display = 'block';
            document.body.style.overflow = 'hidden';
            document.getElementById('email').focus();
        }

        function hideAuthModal() {
            document.getElementById('authModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        document.querySelector('#authModal .close').onclick = hideAuthModal;
        window.onclick = function(event) {
            if (event.target == document.getElementById('authModal')) hideAuthModal();
        }

        let isSignUp = false;
        document.getElementById('toggleAuth').onclick = function(e) {
            e.preventDefault();
            isSignUp = !isSignUp;
            updateAuthModalUI();
        };
        
        function updateAuthModalUI() {
            const title = document.getElementById('authTitle');
            const buttonText = document.getElementById('authButtonText');
            const buttonIcon = document.querySelector('#authButton .btn-icon');
            const nameGroup = document.getElementById('nameGroup');
            const toggle = document.getElementById('toggleAuth');
            
            if (isSignUp) {
                title.innerHTML = '<span role="img" aria-label="Sparkles Emoji">✨</span> إنشاء حساب جديد';
                buttonText.textContent = 'إنشاء حساب';
                buttonIcon.innerHTML = '✨';
                nameGroup.style.display = 'block';
                document.getElementById('fullName').required = true; // Make full name required for sign up
                toggle.textContent = 'لديك حساب؟ تسجيل الدخول';
            } else {
                title.innerHTML = '<span role="img" aria-label="Lock Emoji">🔐</span> تسجيل الدخول';
                buttonText.textContent = 'تسجيل الدخول';
                buttonIcon.innerHTML = '🚀';
                nameGroup.style.display = 'none';
                document.getElementById('fullName').required = false;
                toggle.textContent = 'ليس لديك حساب؟ إنشاء حساب جديد';
            }
        }

        document.getElementById('authForm').onsubmit = async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const fullName = document.getElementById('fullName').value;
            
            if (isSignUp && (!email || !password || !fullName)) {
                showAlert('يرجى ملء جميع الحقول لإنشاء حساب جديد.', 'error', 'form');
                return;
            }
            if (!isSignUp && (!email || !password)) {
                 showAlert('يرجى إدخال البريد الإلكتروني وكلمة المرور لتسجيل الدخول.', 'error', 'form');
                return;
            }

            if (password.length < 8) { 
                showAlert('كلمة المرور يجب أن تكون 8 أحرف على الأقل.', 'error', 'form');
                return;
            }

            const button = document.getElementById('authButton');
            const originalButtonText = document.getElementById('authButtonText').textContent;
            button.disabled = true;
            document.getElementById('authButtonText').textContent = 'جاري المعالجة...';
            
            try {
                if (isSignUp) {
                    const { data, error } = await supabase.auth.signUp({
                        email: email,
                        password: password,
                        options: { data: { full_name: fullName, created_at: new Date().toISOString() } }
                    });
                    if (error) throw error;

                    if (data && data.user) {
                        try {
                            const { error: profileError } = await supabase
                                .from('profiles')
                                .insert([{
                                    id: data.user.id, // This should match auth.users.id
                                    email: email,
                                    full_name: fullName
                                }]);
                            if (profileError) {
                                console.error('Error inserting into profiles:', profileError);
                                // Non-critical, user is signed up. Log and continue.
                                showAlert('تم إنشاء الحساب، ولكن حدث خطأ بسيط في حفظ بيانات الملف الشخصي الإضافية.', 'warning', 'form');
                            }
                        } catch (profileInsertErr) {
                            console.error('Exception inserting into profiles:', profileInsertErr);
                        }
                    }
                    showAlert('🎉 تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.', 'success', 'form');
                    setTimeout(() => { 
                        isSignUp = false; 
                        updateAuthModalUI(); 
                        document.getElementById('email').value = email; 
                        document.getElementById('password').value = ''; 
                        document.getElementById('password').focus();
                    }, 3000);
                } else { // Sign In
                    const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
                    if (error) throw error;
                    // onAuthStateChange will handle UI updates after successful login
                    showAlert('🎉 تم تسجيل الدخول بنجاح!', 'success', 'form');
                }
            } catch (error) {
                showAlert('❌ ' + getSupabaseErrorMessage(error.message), 'error', 'form');
            } finally {
                button.disabled = false;
                document.getElementById('authButtonText').textContent = originalButtonText;
            }
        };
        
        function getSupabaseErrorMessage(message) {
            const errorMap = {
                'Invalid login credentials': 'بيانات تسجيل الدخول غير صحيحة.',
                'User already registered': 'هذا البريد الإلكتروني مسجل بالفعل.',
                'Email not confirmed': 'لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.',
                'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل (نوصي بـ 8 أو أكثر).',
                'NetworkError when attempting to fetch resource.': 'مشكلة في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.',
                'Unable to validate email address: invalid format': 'صيغة البريد الإلكتروني غير صحيحة.',
                'Bucket not found': 'خطأ في الخادم: لم يتم العثور على مساحة التخزين (Bucket). يرجى التأكد من أن مساحة التخزين باسم "files" موجودة في إعدادات المشروع.',
                // Add more specific Supabase error messages as needed
            };
            return errorMap[message] || `حدث خطأ: ${message}`;
        }
        
        // --- Application ID Management ---
        function generateNewApplicationId() {
            // This generates a temporary ID. The real one comes from the DB after step 1.
            return 'TEMP_APP_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        }

        // --- Auth State Change Handler ---
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (session && session.user) {
                currentUser = session.user;
                
                if (!applicationId) { // Only generate a new temp ID if none exists (e.g. from restore)
                    applicationId = generateNewApplicationId();
                }
                
                if (document.getElementById('authModal').style.display === 'block') {
                    hideAuthModal();
                }
                showApplicationUI(); 
                await restoreProgressFromStorage(); 
            } else if (event === 'SIGNED_OUT' || !session) { 
                currentUser = null;
                // Don't nullify applicationId here if we want to retain it across logouts for some reason
                // But generally, on sign out, clear the specific application context.
                if (applicationId) { // Only clear if there was an active application
                    clearProgressFromStorage(); // Clear progress for the specific application on sign out
                }
                applicationId = null; 
                resetApplicationUI();
            }
        });

        // --- UI Management for Application Visibility ---
        function showApplicationUI() {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('statsSection').style.display = 'none'; 
            document.getElementById('mainApplication').style.display = 'block';
            updateStatusIndicator('pending', '🚀 جاهز للبدء', '🔄');
        }
        
        function resetApplicationUI() {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('statsSection').style.display = 'grid'; 
            document.getElementById('mainApplication').style.display = 'none';
            currentStep = 1;
            updateStepDisplayUI(); 
        }

        function updateStatusIndicator(status, message, icon) {
            const indicator = document.getElementById('statusIndicator');
            indicator.className = `status-indicator status-${status}`;
            indicator.textContent = message;
            indicator.dataset.icon = icon;
            document.getElementById('mainApplication').setAttribute('aria-busy', status === 'processing');
        }

        // --- File Handling ---
        const fileUploadArea = document.getElementById('fileUpload');
        const fileInput = document.getElementById('resumeFile');

        fileUploadArea.onclick = () => fileInput.click();
        fileUploadArea.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); };

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileUploadArea.addEventListener(eventName, preventDefaults, false);
        });
        function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

        fileUploadArea.ondragenter = () => fileUploadArea.classList.add('dragover');
        fileUploadArea.ondragover = () => fileUploadArea.classList.add('dragover');
        fileUploadArea.ondragleave = () => fileUploadArea.classList.remove('dragover');
        fileUploadArea.ondrop = (e) => {
            fileUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFileSelect(files[0]);
        };
        fileInput.onchange = (e) => { if (e.target.files.length > 0) handleFileSelect(e.target.files[0]); };

        async function handleFileSelect(file) {
            const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
            const fileNameOriginal = file.name;
            const fileExtension = ('.' + fileNameOriginal.split('.').pop()).toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                showAlert(`❌ نوع الملف '${fileExtension}' غير مدعوم. يرجى رفع ملف PDF, DOCX, DOC أو TXT.`, 'error');
                return;
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                showAlert('❌ حجم الملف كبير جداً. الحد الأقصى 10MB.', 'error'); return;
            }

            uploadedFileObject = file; 
            updateStatusIndicator('processing', '📤 جاري رفع الملف...', '📤');
            
            document.getElementById('fileUploadIcon').textContent = '⏳';
            document.getElementById('fileUploadTitle').textContent = 'جاري معالجة الملف...';
            document.getElementById('fileUploadHint').textContent = fileNameOriginal;

            const progressElement = document.getElementById('uploadProgress');
            const progressFill = document.getElementById('uploadProgressFill');
            const statusElement = document.getElementById('uploadStatus');
            progressElement.style.display = 'block';
            progressFill.style.width = '0%';
            statusElement.textContent = 'جاري الرفع... 0%';
            
            try {
                if (!currentUser || !currentUser.id ) { // applicationId might be temp here, real one set in nextStep
                    throw new Error("بيانات المستخدم غير متوفرة. يرجى التأكد من تسجيل الدخول.");
                }
                // Use a temporary or current applicationId for path generation. 
                // If it's a temp one, it's just for uniqueness before DB ID is assigned.
                const currentAppIdForPath = applicationId || generateNewApplicationId(); 
                const sanitizedBaseName = fileNameOriginal.substring(0, fileNameOriginal.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '');
                const storageFileName = `${currentUser.id}/${currentAppIdForPath}_${Date.now()}_${sanitizedBaseName}${fileExtension}`;
                
                const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(storageFileName, file, {
                    cacheControl: '3600', upsert: false,
                });

                progressFill.style.width = '100%';
                statusElement.textContent = 'اكتمل الرفع!';

                if (error) {
                    console.error('Supabase storage upload error details:', error);
                    throw error; 
                }

                uploadedFileUrl = storageFileName; // This path IS NOT a public URL, it's the Supabase storage path.
                showAlert('✅ تم رفع الملف بنجاح!', 'success');
                document.getElementById('step1Next').disabled = !document.getElementById('position').value; 
                
                setTimeout(() => { progressElement.style.display = 'none'; }, 1500);
                updateStatusIndicator('completed', '✅ تم رفع الملف', '✅');
                
                document.getElementById('fileUploadIcon').textContent = '✔️';
                document.getElementById('fileUploadTitle').textContent = 'تم رفع الملف بنجاح!';
                document.getElementById('fileUploadHint').innerHTML = `<strong>${fileNameOriginal}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                
                document.getElementById('fileNamePreview').textContent = fileNameOriginal;
                document.getElementById('fileSizePreview').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                document.getElementById('fileInfoPreview').style.display = 'block';

                saveProgressToStorage(); 
                showAutosaveIndicator();
            } catch (error) {
                showAlert('❌ فشل رفع الملف: ' + getSupabaseErrorMessage(error.message), 'error');
                console.error('File upload process failed:', error); 
                progressElement.style.display = 'none';
                updateStatusIndicator('pending', '❌ فشل رفع الملف', '❌');
                document.getElementById('fileUploadIcon').textContent = '📄';
                document.getElementById('fileUploadTitle').textContent = 'اسحب الملف هنا أو اضغط للاختيار';
                document.getElementById('fileUploadHint').textContent = 'الصيغ المدعومة: PDF, DOCX, DOC, TXT (الحد الأقصى 10MB)';
                uploadedFileObject = null; 
                uploadedFileUrl = null;
            }
        }
        
        async function readFileContent(file) { 
            return new Promise(async (resolve, reject) => {
                try {
                    let rawTextContent = '';
                    const fileName = file.name.toLowerCase();
                    
                    if (fileName.endsWith('.pdf')) {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            rawTextContent += textContent.items
                                .filter(item => item.str.trim() !== '')
                                .map(item => item.str.replace(/\s+/g, ' ').trim())
                                .join(' ') + '\n';
                        }
                    } else if (fileName.endsWith('.docx')) {
                        const arrayBuffer = await file.arrayBuffer();
                        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                        rawTextContent = result.value;
                    } else if (fileName.endsWith('.doc')) {
                        showAlert('ملفات .doc القديمة قد لا تُقرأ بشكل مثالي. يُفضل استخدام .docx أو PDF إذا واجهت مشاكل.', 'warning');
                        try {
                            const arrayBuffer = await file.arrayBuffer();
                            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                            rawTextContent = result.value;
                            if (!rawTextContent.trim()) { 
                                rawTextContent = await file.text();
                            }
                        } catch (docError) { 
                            console.warn("Mammoth failed for .doc, falling back to text:", docError);
                            rawTextContent = await file.text();
                        }
                    } else if (fileName.endsWith('.txt')) {
                        rawTextContent = await file.text();
                    } else {
                        reject(new Error('نوع ملف غير مدعوم للمعالجة النصية.'));
                        return;
                    }

                    let cleanedText = rawTextContent
                        .replace(/\s+/g, ' ')            
                        .replace(/(\r\n|\n|\r)/gm, ' ')  
                        .replace(/(\d)\s+(\d)/g, '$1$2') 
                        .trim();
                    
                    cleanedText = cleanedText.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s.,;:!?()%-0-9a-zA-Z]/g, ''); // Keep English chars too

                    if (cleanedText.length < 50) {
                        reject(new Error('محتوى السيرة الذاتية قصير جداً أو غير قابل للقراءة. يرجى التأكد من أن الملف يحتوي على نص كافٍ وواضح.'));
                        return;
                    }
                    if (cleanedText.length > 30000) { 
                        cleanedText = cleanedText.substring(0, 30000);
                        showAlert('تم اقتطاع محتوى السيرة الذاتية الطويل جداً (أكثر من 30,000 حرف).', 'warning');
                    }
                    
                    resolve(cleanedText);
                } catch (error) {
                    console.error('File reading error:', error);
                    reject(new Error('فشل في قراءة محتوى الملف: ' + error.message + '. حاول تحويل الملف إلى صيغة أخرى مثل TXT أو PDF إذا استمرت المشكلة.'));
                }
            });
        }

        // --- Resume Analysis (Step 2) ---
        async function analyzeResume() {
            if (!uploadedFileObject) { 
                 showAlert('❌ لم يتم رفع ملف السيرة الذاتية بشكل صحيح أو تم فقدانه. يرجى إعادة الرفع.', 'error'); 
                 currentStep = 1; 
                 updateStepDisplayUI();
                 return;
            }
            const position = document.getElementById('position').value;
            if (!position) { showAlert('❌ يرجى اختيار المنصب المطلوب.', 'error'); return; }

            updateStatusIndicator('processing', '🔍 جاري تحليل السيرة...', '🔍');
            document.getElementById('analysisLoading').classList.add('show');
            document.getElementById('analysisResult').style.display = 'none';
            document.getElementById('step2').setAttribute('aria-busy', 'true');

            try {
                const fileContent = await readFileContent(uploadedFileObject); 
                const positionName = getPositionNameFromSelect(position);

                const prompt = `أنت خبير توظيف متخصص في تحليل السير الذاتية للمجال الطبي لشركة "مايس للمنتجات الطبية".
المرشح متقدم لمنصب: "${positionName}".
محتوى السيرة الذاتية:
---
${fileContent}
---
الرجاء تقديم تحليل مفصل باللغة العربية، في صيغة JSON صارمة. يجب أن يتضمن الـ JSON الحقول التالية:
- "score": درجة رقمية (0-100) لمدى توافق السيرة مع المنصب. كن واقعياً وموضوعياً.
- "summary": ملخص عام للمرشح في جملتين أو ثلاث.
- "strengths": قائمة (array) من 3-5 نقاط قوة رئيسية واضحة من السيرة وذات صلة بالمنصب.
- "weaknesses": قائمة (array) من 2-4 مجالات للتحسين أو نقاط ضعف محتملة بناءً على ما هو مفقود أو غير واضح في السيرة. كن بناءً.
- "recommendations_for_candidate": قائمة (array) من 2-3 توصيات عملية للمرشح لتطوير ملفه أو مهاراته.
- "missing_skills_for_role": قائمة (array) من 1-3 مهارات أساسية للمنصب تبدو ناقصة أو غير مذكورة.
- "experience_assessment": تقييم موجز للخبرة العملية (جملة أو اثنتين).
- "education_assessment": تقييم موجز للتعليم والشهادات (جملة أو اثنتين).
- "overall_impression": انطباع عام عن المرشح بناءً على السيرة فقط.

تأكد أن الرد هو JSON فقط بدون أي نصوص إضافية قبله أو بعده.`;

                const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.5, topK: 30, topP: 0.9, maxOutputTokens: 8192 } // Increased max tokens
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Gemini API Error:", response.status, errorText);
                    throw new Error(`خطأ في الاتصال بخادم التحليل: ${response.status}. ${errorText.substring(0,100)}`);
                }
                const data = await response.json();
                
                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    console.error("Unexpected Gemini API response structure:", data);
                    throw new Error('استجابة غير متوقعة من API التحليل.');
                }
                
                let analysisText = data.candidates[0].content.parts[0].text;
                analysisText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
                
                try {
                    resumeAnalysis = JSON.parse(analysisText);
                } catch (e) {
                    console.error("Failed to parse JSON from Gemini:", analysisText, e);
                    throw new Error('فشل في فهم رد الذكاء الاصطناعي. قد يكون هناك خطأ في تنسيق الرد. الرد المستلم: ' + analysisText.substring(0,200) + '...');
                }

                if (typeof resumeAnalysis.score !== 'number' || !Array.isArray(resumeAnalysis.strengths)) {
                    throw new Error('التحليل المستلم من الذكاء الاصطناعي غير مكتمل أو بتنسيق خاطئ.');
                }
                
                await saveResumeAnalysisToSupabase(resumeAnalysis);
                displayResumeAnalysisResults(resumeAnalysis);
                document.getElementById('step2Next').disabled = false;
                updateStatusIndicator('completed', '✅ تم التحليل بنجاح', '✅');
                saveProgressToStorage(); showAutosaveIndicator();
            } catch (error) {
                console.error('Resume analysis error:', error);
                showAlert('❌ فشل تحليل السيرة: ' + getSupabaseErrorMessage(error.message), 'error');
                updateStatusIndicator('pending', '❌ فشل التحليل', '❌');
                document.getElementById('analysisResult').innerHTML = `<p style="text-align:center; color: var(--danger-color); padding: 20px; background-color: #fff0f0; border-radius: var(--border-radius-md);">حدث خطأ أثناء تحليل السيرة. يرجى المحاولة مرة أخرى أو التأكد من جودة الملف المرفوع. إذا استمرت المشكلة، قد يكون محتوى الملف غير قابل للقراءة بشكل جيد.</p>`;
                document.getElementById('analysisResult').style.display = 'block';
            } finally {
                document.getElementById('analysisLoading').classList.remove('show');
                document.getElementById('step2').setAttribute('aria-busy', 'false');
            }
        }
        
        function getPositionNameFromSelect(positionValue) {
            const select = document.getElementById('position');
            const option = select.querySelector(`option[value="${positionValue}"]`);
            return option ? option.textContent.replace(/[\s\S]*?\s/, '').trim() : 'منصب غير محدد'; 
        }

        async function saveResumeAnalysisToSupabase(analysis) {
            if (!currentUser || !applicationId) {
                console.warn("User or Application ID missing, cannot save resume analysis.");
                return;
            }
            try {
                // uploadedFileUrl is the path in Supabase storage, e.g., "USER_ID/APP_ID_filename.ext"
                if (!uploadedFileUrl || typeof uploadedFileUrl !== 'string' || uploadedFileUrl.trim() === '') {
                    console.warn("Skipping saving analysis to Supabase due to invalid or empty uploadedFileUrl:", uploadedFileUrl);
                    showAlert('⚠️ لم يتم العثور على مسار ملف السيرة الذاتية المحمل. لا يمكن حفظ التحليل.', 'warning');
                    return; 
                }

                const recordToInsert = {
                    application_id: applicationId, // This should be the DB ID of the application
                    analysis_data: analysis,
                    score: (analysis && typeof analysis.score === 'number') ? analysis.score : null
                    // Optional: If your 'resume_analyses' table has these columns, uncomment and ensure they are populated.
                    // user_id: currentUser.id, 
                    // resume_file_path: uploadedFileUrl 
                };
                
                const { error } = await supabase.from('resume_analyses').insert([recordToInsert]);
                
                if (error) {
                    console.error('Supabase insert error in resume_analyses:', error);
                    throw error; 
                }
            } catch (error) { 
                console.error('Error saving analysis to Supabase:', error);
                showAlert('⚠️ حدث خطأ أثناء حفظ نتائج التحليل في قاعدة البيانات. سيتم المتابعة بالبيانات المحلية.', 'warning');
            }
        }

        function displayResumeAnalysisResults(analysis) {
            const scoreCircle = document.getElementById('scoreCircle');
            const scoreText = document.getElementById('scoreText');
            const analysisDetailsEl = document.getElementById('analysisDetails');

            const scoreDeg = (analysis.score / 100) * 360;
            scoreCircle.style.setProperty('--score', `${scoreDeg}deg`);
            animateScoreCounter(0, analysis.score, scoreText);

            let detailsHTML = `<p style="font-size: 1.1rem; text-align:center; margin-bottom:25px; background-color: #f0f8ff; padding: 15px; border-radius: var(--border-radius-sm);"><strong>الملخص:</strong> ${analysis.summary || 'لم يتم تقديم ملخص.'}</p>`;
            
            if (analysis.strengths && analysis.strengths.length > 0) {
                detailsHTML += `<div class="detail-section strengths-section"><h4><span class="icon">💪</span>نقاط القوة الرئيسية</h4><ul>${analysis.strengths.map(s => `<li>${s}</li>`).join('')}</ul></div>`;
            }
            if (analysis.weaknesses && analysis.weaknesses.length > 0) {
                detailsHTML += `<div class="detail-section weaknesses-section"><h4><span class="icon">🎯</span>مجالات التحسين</h4><ul>${analysis.weaknesses.map(w => `<li>${w}</li>`).join('')}</ul></div>`;
            }
            if (analysis.recommendations_for_candidate && analysis.recommendations_for_candidate.length > 0) {
                detailsHTML += `<div class="detail-section recommendations-section"><h4><span class="icon">🚀</span>توصيات للمرشح</h4><ul>${analysis.recommendations_for_candidate.map(r => `<li>${r}</li>`).join('')}</ul></div>`;
            }
            if (analysis.missing_skills_for_role && analysis.missing_skills_for_role.length > 0) {
                detailsHTML += `<div class="detail-section" style="border-color: #673ab7;"><h4 style="color: #673ab7;"><span class="icon" style="color: #673ab7;">🧩</span>مهارات ناقصة للمنصب</h4><ul>${analysis.missing_skills_for_role.map(s => `<li style="background-color: rgba(103, 58, 183, 0.05);">${s}</li>`).join('')}</ul></div>`;
            }
            detailsHTML += `<p style="margin-top:10px;"><strong>تقييم الخبرة:</strong> ${analysis.experience_assessment || 'غير محدد'}</p>`;
            detailsHTML += `<p style="margin-top:10px;"><strong>تقييم التعليم:</strong> ${analysis.education_assessment || 'غير محدد'}</p>`;
            detailsHTML += `<p style="margin-top:15px; font-style:italic;"><strong>الانطباع العام:</strong> ${analysis.overall_impression || 'لم يتم تقديم انطباع.'}</p>`;

            analysisDetailsEl.innerHTML = detailsHTML;
            document.getElementById('analysisResult').style.display = 'block';
        }
        
        function animateScoreCounter(start, end, element) {
            const duration = 1500;
            const startTime = performance.now();
            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentVal = Math.round(start + (end - start) * progress);
                element.textContent = currentVal + '%';
                if (progress < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
        }
        
        // --- Interview Questions (Step 3) ---
        async function generateInterviewQuestions() {
            updateStatusIndicator('processing', '🤖 جاري توليد الأسئلة...', '🤖');
            document.getElementById('questionsLoading').classList.add('show');
            document.getElementById('interviewQuestions').style.display = 'none';
            document.getElementById('step3').setAttribute('aria-busy', 'true');

            try {
                if (!resumeAnalysis) throw new Error("بيانات تحليل السيرة الذاتية غير متوفرة لتوليد الأسئلة.");

                const positionName = getPositionNameFromSelect(document.getElementById('position').value);
                const prompt = `أنت نظام ذكاء اصطناعي متخصص في إعداد أسئلة المقابلات لشركة "مايس للمنتجات الطبية".
المرشح متقدم لمنصب: "${positionName}".
تحليل السيرة الذاتية للمرشح:
- درجة التوافق: ${resumeAnalysis.score}%
- نقاط القوة: ${resumeAnalysis.strengths.join('، ')}
- نقاط الضعف/تحسين: ${resumeAnalysis.weaknesses.join('، ')}

الرجاء توليد 5 أسئلة مقابلة متنوعة ومخصصة باللغة العربية. يجب أن تكون الأسئلة:
1.  متدرجة الصعوبة (مثلاً: 2 سهل، 2 متوسط، 1 صعب).
2.  تغطي جوانب سلوكية، تقنية، وموقفية ذات صلة بالمنصب والتحليل.
3.  تساعد في استكشاف نقاط القوة والضعف المذكورة.
4.  تتطلب إجابات مفصلة وليس فقط نعم/لا.

الرد يجب أن يكون بصيغة JSON صارمة تحتوي على قائمة (array) باسم "questions". كل عنصر في القائمة يجب أن يكون كائنًا (object) بالخصائص التالية:
- "question_text": نص السؤال.
- "type": نوع السؤال (مثل: "سلوكي", "تقني", "موقفي", "خبرة سابقة", "تحفيزي").
- "difficulty": مستوى الصعوبة ("سهل", "متوسط", "صعب").
- "focus_area": المجال الذي يركز عليه السؤال (مثل: "حل المشكلات", "العمل ضمن فريق", "معرفة المنتج", "التعامل مع العملاء").
تأكد أن الرد هو JSON فقط.`;

                const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 }
                    })
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Gemini API Error (Questions):", response.status, errorText);
                    throw new Error(`خطأ في الاتصال بخادم توليد الأسئلة: ${response.status}. ${errorText.substring(0,100)}`);
                }
                const data = await response.json();

                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    console.error("Unexpected Gemini API response structure (Questions):", data);
                    throw new Error('استجابة غير متوقعة من API توليد الأسئلة.');
                }
                
                let questionsText = data.candidates[0].content.parts[0].text;
                questionsText = questionsText.replace(/```json/g, '').replace(/```/g, '').trim();

                try {
                    interviewQuestionsData = JSON.parse(questionsText);
                } catch (e) {
                    console.error("Failed to parse JSON for questions from Gemini:", questionsText, e);
                    throw new Error('فشل في فهم أسئلة المقابلة من الذكاء الاصطناعي. الرد المستلم: ' + questionsText.substring(0,200) + '...');
                }

                if (!interviewQuestionsData.questions || !Array.isArray(interviewQuestionsData.questions) || interviewQuestionsData.questions.length === 0) {
                    throw new Error('لم يتم توليد أسئلة مقابلة أو أن التنسيق غير صحيح.');
                }

                await saveInterviewQuestionsToSupabase(interviewQuestionsData.questions);
                displayInterviewQuestionsUI(interviewQuestionsData.questions); 
                
                const atLeastOneAnswered = interviewAnswers.some(ans => ans && ans.text && ans.text.trim().length > 0);
                document.getElementById('step3Next').disabled = !atLeastOneAnswered;

                updateStatusIndicator('completed', '✅ تم توليد الأسئلة', '✅');
                saveProgressToStorage(); showAutosaveIndicator();
            } catch (error) {
                console.error('Questions generation error:', error);
                showAlert('❌ فشل توليد أسئلة المقابلة: ' + getSupabaseErrorMessage(error.message), 'error');
                updateStatusIndicator('pending', '❌ فشل توليد الأسئلة', '❌');
                document.getElementById('interviewQuestions').innerHTML = `<p style="text-align:center; color: var(--danger-color); padding: 20px; background-color: #fff0f0; border-radius: var(--border-radius-md);">حدث خطأ أثناء توليد الأسئلة. حاول الرجوع للخلف والمتابعة مجددًا.</p>`;
                document.getElementById('interviewQuestions').style.display = 'block';

            } finally {
                document.getElementById('questionsLoading').classList.remove('show');
                document.getElementById('step3').setAttribute('aria-busy', 'false');
            }
        }
        
        async function saveInterviewQuestionsToSupabase(questions) {
            if (!currentUser || !applicationId) return;
            try {
                // Ensure applicationId is the DB-assigned ID
                if (!applicationId || applicationId.startsWith('TEMP_APP_')) {
                    console.warn("Cannot save interview questions without a valid database application ID.");
                    return;
                }
                const { error } = await supabase.from('interview_questions').insert([{
                    user_id: currentUser.id, application_id: applicationId,
                    questions_data: questions
                }]);
                if (error) throw error;
            } catch (error) { 
                console.error('Error saving questions to Supabase:', error);
                showAlert('⚠️ حدث خطأ أثناء حفظ أسئلة المقابلة في قاعدة البيانات.', 'warning');
            }
        }

        function displayInterviewQuestionsUI(questions) {
            const container = document.getElementById('interviewQuestions');
            container.innerHTML = ''; 
            
            if (!interviewAnswers || interviewAnswers.length !== questions.length) {
                interviewAnswers = new Array(questions.length).fill(null).map(() => ({ text: '', audioUrl: null, audioBlob: null, audioSupabasePath: null }));
            }

            questions.forEach((q, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question-card';
                
                const difficultyColors = { 'سهل': '#4CAF50', 'متوسط': '#ffc107', 'صعب': '#f44336' };
                const difficultyColor = difficultyColors[q.difficulty] || '#757575';

                const existingAnswerText = (interviewAnswers[index] && interviewAnswers[index].text) ? interviewAnswers[index].text : '';
                const existingAudioSupabasePath = (interviewAnswers[index] && interviewAnswers[index].audioSupabasePath) ? interviewAnswers[index].audioSupabasePath : null;

                questionDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="color: ${difficultyColor};">السؤال ${index + 1}</h4>
                        <div class="question-metadata">
                            <span class="metadata-tag" style="background-color: ${difficultyColor}20; color: ${difficultyColor}; border: 1px solid ${difficultyColor}80;">
                                ${q.difficulty || 'غير محدد'}
                            </span>
                            <span class="metadata-tag">${q.type || 'عام'}</span>
                        </div>
                    </div>
                    <p class="question-text">${q.question_text}</p>
                    <p style="font-size:0.9rem; color: var(--text-light); margin-bottom:15px;"><strong>مجال التركيز:</strong> ${q.focus_area || 'عام'}</p>
                    
                    <div class="form-group">
                        <label for="answer_${index}" style="font-weight:600;">📝 إجابتك النصية:</label>
                        <textarea id="answer_${index}" class="answer-input" rows="5" placeholder="اكتب إجابتك هنا بالتفصيل..." oninput="handleAnswerTextInput(${index})" aria-label="إجابة السؤال ${index + 1}">${existingAnswerText}</textarea>
                        <div class="word-count-hint">الحد الأدنى الموصى به: 30 كلمة لتقييم أفضل.</div>
                    </div>

                    <div class="voice-recorder">
                        <h5><span role="img" aria-label="Microphone">🎤</span> أو سجل إجابتك صوتياً (اختياري):</h5>
                        <button class="record-button" onclick="toggleAudioRecording(${index})" id="recordBtn_${index}" aria-label="بدء/إيقاف التسجيل الصوتي للسؤال ${index + 1}">
                            🎤
                        </button>
                        <p id="recordStatus_${index}" style="margin: 12px 0;">اضغط للتسجيل</p>
                        <audio id="audioPlayer_${index}" controls style="display: none;"></audio>
                    </div>
                `;
                container.appendChild(questionDiv);
                
                if (existingAudioSupabasePath) {
                    const audioPlayer = document.getElementById(`audioPlayer_${index}`);
                    // Get public URL for playback
                    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(existingAudioSupabasePath);
                    if (data && data.publicUrl) {
                        audioPlayer.src = data.publicUrl;
                        audioPlayer.style.display = 'block';
                        document.getElementById(`recordStatus_${index}`).textContent = '✅ تم استعادة تسجيل سابق.';
                        interviewAnswers[index].audioUrl = data.publicUrl; // Store public URL for local playback reference
                    } else {
                         document.getElementById(`recordStatus_${index}`).textContent = '⚠️ تعذر استعادة مسار التسجيل.';
                         console.error("Error getting public URL for audio:", existingAudioSupabasePath, data);
                    }
                }
            });
            container.style.display = 'block';
        }
        
        function handleAnswerTextInput(questionIndex) {
            const textarea = document.getElementById(`answer_${questionIndex}`);
            const text = textarea.value;
            if (!interviewAnswers[questionIndex]) interviewAnswers[questionIndex] = { text: '', audioUrl: null, audioBlob: null, audioSupabasePath: null };
            interviewAnswers[questionIndex].text = text;
            
            const atLeastOneAnswered = interviewAnswers.some(ans => ans && ans.text && ans.text.trim().length > 0);
            document.getElementById('step3Next').disabled = !atLeastOneAnswered;

            clearTimeout(autosaveTimer);
            autosaveTimer = setTimeout(() => { saveProgressToStorage(); showAutosaveIndicator(); }, 2500);
        }

        async function toggleAudioRecording(questionIndex) {
            const recordBtn = document.getElementById(`recordBtn_${questionIndex}`);
            const recordStatus = document.getElementById(`recordStatus_${questionIndex}`);
            const audioPlayer = document.getElementById(`audioPlayer_${questionIndex}`);

            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop(); 
                recordBtn.classList.remove('recording');
                recordBtn.innerHTML = '🎤';
                recordStatus.textContent = '⏳ جاري معالجة التسجيل...';
                return;
            }
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } });
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' }); 
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunks.push(event.data); };
                
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioLocalUrl = URL.createObjectURL(audioBlob); 
                    audioPlayer.src = audioLocalUrl;
                    audioPlayer.style.display = 'block';
                    
                    if (!interviewAnswers[questionIndex]) interviewAnswers[questionIndex] = { text: '', audioUrl: null, audioBlob: null, audioSupabasePath: null };
                    interviewAnswers[questionIndex].audioBlob = audioBlob; 
                    interviewAnswers[questionIndex].audioUrl = audioLocalUrl; 

                    recordStatus.textContent = '📤 جاري رفع التسجيل...';
                    const supabasePath = await saveAudioAnswerToSupabase(audioBlob, questionIndex);
                    if (supabasePath) {
                        interviewAnswers[questionIndex].audioSupabasePath = supabasePath; 
                        recordStatus.textContent = '✅ تم حفظ التسجيل بنجاح!';
                        // Update player src to Supabase public URL for consistent playback after upload
                        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(supabasePath);
                        if (publicUrlData && publicUrlData.publicUrl) {
                            audioPlayer.src = publicUrlData.publicUrl;
                            interviewAnswers[questionIndex].audioUrl = publicUrlData.publicUrl; // Update with public URL
                        }
                    } else {
                        recordStatus.textContent = '⚠️ فشل رفع التسجيل. يمكنك المحاولة مرة أخرى.';
                    }
                    saveProgressToStorage(); showAutosaveIndicator();
                    stream.getTracks().forEach(track => track.stop()); 
                };

                mediaRecorder.start();
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = '⏹️'; 
                recordStatus.textContent = '🔴 جاري التسجيل... اضغط للإيقاف';
            } catch (error) {
                console.error('Audio recording error:', error);
                showAlert('❌ فشل الوصول للميكروفون: ' + getSupabaseErrorMessage(error.message), 'error');
                recordStatus.textContent = 'خطأ في الميكروفون';
                 if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
                 if (typeof stream !== 'undefined' && stream) stream.getTracks().forEach(track => track.stop());
            }
        }
        
        async function saveAudioAnswerToSupabase(audioBlob, questionIndex) {
            if (!currentUser || !applicationId || applicationId.startsWith('TEMP_APP_')) {
                console.warn("Cannot save audio answer without a valid user and database application ID.");
                return null;
            }
            try {
                const fileName = `audio_answers/${currentUser.id}/${applicationId}_q${questionIndex + 1}_${Date.now()}.webm`;
                const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, audioBlob, {
                    cacheControl: '3600', upsert: false, contentType: 'audio/webm'
                });
                if (error) throw error;
                return fileName; 
            } catch (error) {
                console.error('Error saving audio to Supabase:', error);
                showAlert('⚠️ فشل رفع التسجيل الصوتي إلى الخادم.', 'warning');
                return null;
            }
        }
        
        // --- Final Evaluation (Step 4) ---
        async function generateFinalEvaluation() {
            updateStatusIndicator('processing', '📊 جاري إعداد التقييم...', '📊');
            document.getElementById('finalLoading').classList.add('show');
            document.getElementById('finalReport').style.display = 'none';
            document.getElementById('step4').setAttribute('aria-busy', 'true');

            let aggregatedAnswers = "ملخص إجابات المرشح:\n";
            interviewAnswers.forEach((ans, index) => {
                if (ans) {
                    if (ans.text) {
                        aggregatedAnswers += `السؤال ${index + 1} (نصي): ${ans.text}\n`;
                    }
                    if (ans.audioSupabasePath) { 
                        aggregatedAnswers += `(يوجد تسجيل صوتي للسؤال ${index + 1} محفوظ في المسار: ${ans.audioSupabasePath})\n`;
                    }
                    aggregatedAnswers += "\n";
                }
            });

            try {
                if (!resumeAnalysis) throw new Error("بيانات تحليل السيرة مفقودة للتقييم النهائي.");
                const positionName = getPositionNameFromSelect(document.getElementById('position').value);
                const prompt = `أنت مدير توظيف خبير في شركة "مايس للمنتجات الطبية". قم بإعداد تقييم نهائي شامل ومفصل للمرشح المتقدم لمنصب "${positionName}".
استند إلى المعلومات التالية:
1.  تحليل السيرة الذاتية:
    - درجة التوافق الأولية: ${resumeAnalysis.score}%
    - ملخص السيرة: ${resumeAnalysis.summary}
    - نقاط القوة من السيرة: ${resumeAnalysis.strengths.join('، ')}
    - مجالات التحسين من السيرة: ${resumeAnalysis.weaknesses.join('، ')}
2.  إجابات المقابلة الأولية:
${aggregatedAnswers}

الرجاء تقديم تقييم شامل باللغة العربية، في صيغة JSON صارمة. يجب أن يتضمن الـ JSON الحقول التالية:
- "overall_candidate_score": درجة رقمية (0-100) تقييم شامل للمرشح.
- "final_recommendation": توصية نهائية واضحة (مثل: "توظيف مباشر", "توظيف مشروط بمقابلة إضافية", "قائمة انتظار", "رفض مع ذكر السبب بإيجاز").
- "confidence_level": مستوى الثقة في التوصية ("عالية جداً", "عالية", "متوسطة", "منخفضة").
- "confirmed_strengths": قائمة (array) من 3-5 نقاط قوة تم تأكيدها أو ظهرت بوضوح خلال عملية التقييم بأكملها.
- "key_development_areas": قائمة (array) من 2-4 مجالات رئيسية يحتاج المرشح لتطويرها.
- "justification_for_recommendation": تبرير مفصل وموضوعي للتوصية النهائية (3-5 جمل).
- "suggested_next_steps_for_candidate": قائمة (array) من 2-3 نصائح أو خطوات تالية مقترحة للمرشح (سواء تم قبوله أو رفضه).
- "internal_notes_for_hr": ملاحظات داخلية لفريق الموارد البشرية (اختياري، جملة أو اثنتين).

تأكد أن الرد هو JSON فقط.`;

                const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.6, topK: 35, topP: 0.9, maxOutputTokens: 8192 }
                    })
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Gemini API Error (Final Eval):", response.status, errorText);
                    throw new Error(`خطأ في الاتصال بخادم التقييم النهائي: ${response.status}. ${errorText.substring(0,100)}`);
                }
                const data = await response.json();

                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    console.error("Unexpected Gemini API response structure (Final Eval):", data);
                    throw new Error('استجابة غير متوقعة من API التقييم النهائي.');
                }
                
                let evaluationText = data.candidates[0].content.parts[0].text;
                evaluationText = evaluationText.replace(/```json/g, '').replace(/```/g, '').trim();
                let finalEvaluationData; 
                try {
                    finalEvaluationData = JSON.parse(evaluationText);
                } catch (e) {
                    console.error("Failed to parse JSON for final evaluation from Gemini:", evaluationText, e);
                    throw new Error('فشل في فهم التقييم النهائي من الذكاء الاصطناعي. الرد المستلم: ' + evaluationText.substring(0,200) + '...');
                }
                
                if (typeof finalEvaluationData.overall_candidate_score !== 'number' || !finalEvaluationData.final_recommendation) {
                     throw new Error('التقييم النهائي المستلم غير مكتمل أو بتنسيق خاطئ.');
                }
                
                // Store the raw evaluation data for PDF generation and potential restoration
                document.getElementById('finalDetails').dataset.evaluation = JSON.stringify(finalEvaluationData);

                await saveFinalReportToSupabaseDB(finalEvaluationData); 
                displayFinalEvaluationUI(finalEvaluationData);
                updateStatusIndicator('completed', '🎉 اكتمل التقييم!', '🎉');
                saveProgressToStorage(true); 
                showAutosaveIndicator();
            } catch (error) {
                console.error('Final evaluation error:', error);
                showAlert('❌ فشل إعداد التقييم النهائي: ' + getSupabaseErrorMessage(error.message), 'error');
                updateStatusIndicator('pending', '❌ فشل التقييم', '❌');
                document.getElementById('finalReport').innerHTML = `<p style="text-align:center; color: var(--danger-color); padding: 20px; background-color: #fff0f0; border-radius: var(--border-radius-md);">حدث خطأ أثناء إعداد التقرير. حاول الرجوع للخلف والمتابعة مجددًا.</p>`;
                document.getElementById('finalReport').style.display = 'block';
            } finally {
                document.getElementById('finalLoading').classList.remove('show');
                document.getElementById('step4').setAttribute('aria-busy', 'false');
            }
        }

        async function saveFinalReportToSupabaseDB(evaluationData) {
            if (!applicationId || applicationId.startsWith('TEMP_APP_')) {
                 console.warn("Cannot save final report without a valid database application ID.");
                 return;
            }
            const reportData = {
                application_id: applicationId,
                user_id: currentUser.id, // Good to have user_id
                final_evaluation_data: evaluationData,
                overall_candidate_score: evaluationData && typeof evaluationData.overall_candidate_score === 'number' ? evaluationData.overall_candidate_score : null,
                final_recommendation: evaluationData && evaluationData.final_recommendation ? evaluationData.final_recommendation : null
            };

            try {
                const { error } = await supabase.from('final_reports').insert([reportData]);
                if (error) throw error;
                showAlert('✅ تم حفظ التقرير النهائي بنجاح في قاعدة البيانات!', 'success');
            } catch (error) {
                console.error('Error saving final report to Supabase DB:', error);
                showAlert('⚠️ تم إنشاء التقرير ولكن حدث خطأ في حفظه بقاعدة البيانات.', 'warning');
            }
        }

        function displayFinalEvaluationUI(evaluation) {
            const container = document.getElementById('finalDetails');
            const recConfig = {
                "توظيف مباشر": { color: '#4CAF50', icon: '🎉', bg: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)' },
                "توظيف مشروط بمقابلة إضافية": { color: '#2196F3', icon: '🤔', bg: 'linear-gradient(135deg, #e3f2fd, #e1f5fe)' },
                "قائمة انتظار": { color: '#ff9800', icon: '⏳', bg: 'linear-gradient(135deg, #fff8e1, #fffbeb)' },
                "رفض مع ذكر السبب بإيجاز": { color: '#f44336', icon: '❌', bg: 'linear-gradient(135deg, #ffebee, #ffcdd2)' }
            };
            const config = recConfig[evaluation.final_recommendation] || { color: '#757575', icon: '📋', bg: '#f5f5f5' };

            container.innerHTML = `
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="display: inline-block; padding: 25px 40px; border-radius: var(--border-radius-lg); background: ${config.bg}; border: 3px solid ${config.color}; box-shadow: var(--shadow-md);">
                        <div style="font-size: 3.5rem; margin-bottom: 10px;">${config.icon}</div>
                        <h3 style="color: ${config.color}; font-size: 1.8rem; margin-bottom: 8px;">${evaluation.final_recommendation}</h3>
                        <div style="font-size: 2.5rem; font-weight: 900; color: ${config.color}; margin-bottom: 8px;">${evaluation.overall_candidate_score}/100</div>
                        <div style="font-size: 0.9rem; color: ${config.color}; opacity: 0.85;">مستوى الثقة: ${evaluation.confidence_level || 'غير محدد'}</div>
                    </div>
                </div>

                <div class="detail-section strengths-section"><h4><span class="icon">🌟</span>نقاط القوة المؤكدة</h4><ul>${(evaluation.confirmed_strengths || []).map(s => `<li>${s}</li>`).join('')}</ul></div>
                <div class="detail-section weaknesses-section"><h4><span class="icon">🛠️</span>مجالات التطوير الرئيسية</h4><ul>${(evaluation.key_development_areas || []).map(d => `<li>${d}</li>`).join('')}</ul></div>
                
                <div class="detail-section" style="border-color: var(--secondary-color);">
                    <h4 style="color: var(--secondary-color);"><span class="icon" style="color: var(--secondary-color);">💬</span>مبررات التوصية</h4>
                    <p style="padding:10px; background-color:rgba(33,150,243,0.05); border-radius:var(--border-radius-sm);">${evaluation.justification_for_recommendation || 'لا يوجد تبرير مفصل.'}</p>
                </div>

                ${(evaluation.suggested_next_steps_for_candidate && evaluation.suggested_next_steps_for_candidate.length > 0) ? `
                <div class="detail-section recommendations-section"><h4><span class="icon">🚶</span>الخطوات التالية للمرشح</h4><ul>${evaluation.suggested_next_steps_for_candidate.map(n => `<li>${n}</li>`).join('')}</ul></div>` : ''}
                
                ${evaluation.internal_notes_for_hr ? `
                <div class="detail-section" style="border-color: #607d8b;">
                    <h4 style="color: #607d8b;"><span class="icon" style="color: #607d8b;">㊙️</span>ملاحظات داخلية لفريق الموارد البشرية</h4>
                    <p style="padding:10px; background-color:rgba(96,125,139,0.05); border-radius:var(--border-radius-sm);">${evaluation.internal_notes_for_hr}</p>
                </div>` : ''}

                <div style="text-align: center; margin-top: 40px; padding: 25px; background: linear-gradient(135deg, var(--bg-light), var(--bg-white)); border-radius: var(--border-radius-md); box-shadow:var(--shadow-sm);">
                    <p style="color: var(--text-dark); font-weight: 600; margin-bottom: 15px; font-size:1.1rem;">
                        شكراً لك على إكمال عملية التقديم الذكية لشركة مايس للمنتجات الطبية.
                    </p>
                    <p style="color: var(--text-light); font-size: 1rem;">
                        سيقوم فريق التوظيف بمراجعة تقييمك، وسيتم التواصل معك خلال 5-7 أيام عمل بخصوص الخطوات التالية إن وجدت.
                    </p>
                </div>
            `;
            document.getElementById('finalReport').style.display = 'block';
        }

        // --- PDF Report Generation ---
        function downloadReport() {
            let finalEvaluationReportData = null;
            const finalDetailsElement = document.getElementById('finalDetails');
            if (finalDetailsElement && finalDetailsElement.dataset.evaluation) {
                try {
                    finalEvaluationReportData = JSON.parse(finalDetailsElement.dataset.evaluation);
                } catch (e) {
                    console.error("Error parsing final evaluation data from dataset for PDF:", e);
                    showAlert('خطأ في استرجاع بيانات التقييم النهائي لإنشاء التقرير.', 'error');
                    return;
                }
            }
            
            if (!currentUser || !resumeAnalysis || !interviewQuestionsData || !finalEvaluationReportData) {
                showAlert('البيانات غير مكتملة لإنشاء التقرير. يرجى التأكد من إكمال جميع الخطوات.', 'error');
                console.log("PDF Report Data Check:", {currentUser, resumeAnalysis, interviewQuestionsData, finalEvaluationReportData});
                return;
            }
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                
                // Add a font that supports Arabic. Example: Amiko (you need to provide the .ttf file or base64)
                // doc.addFileToVFS("Amiko-Regular.ttf", amikoFontBase64); // amikoFontBase64 needs to be defined
                // doc.addFont("Amiko-Regular.ttf", "Amiko", "normal");
                // doc.setFont("Amiko");
                // Fallback (may not render Arabic correctly without a proper Arabic font loaded):
                doc.setFont('helvetica'); // Using a standard font, hoping for the best.
                doc.setLanguage('ar'); // Hint for language
                doc.setR2L(true);

                let y = 20;
                const margin = 15;
                const pageWidth = doc.internal.pageSize.getWidth();
                const textWidth = pageWidth - (2 * margin);

                function addTitle(text) {
                    if (y > 270) { doc.addPage(); y = 20; }
                    doc.setFontSize(18);
                    doc.setFont(undefined, 'bold');
                    doc.text(text, pageWidth - margin, y, { align: 'right' });
                    y += 10;
                    doc.setLineWidth(0.5);
                    doc.line(margin, y - 2, pageWidth - margin, y - 2);
                    y += 5;
                    doc.setFont(undefined, 'normal');
                }

                function addSectionTitle(text) {
                    if (y > 270) { doc.addPage(); y = 20; }
                    doc.setFontSize(14);
                    doc.setFont(undefined, 'bold');
                    doc.text(text, pageWidth - margin, y, { align: 'right' });
                    y += 8;
                    doc.setFont(undefined, 'normal');
                }

                function addParagraph(text, indent = 0) {
                    if (y > 270) { doc.addPage(); y = 20; } 
                    doc.setFontSize(10);
                    const lines = doc.splitTextToSize(String(text || "غير متوفر"), textWidth - indent); 
                    lines.forEach(line => {
                        if (y > 275) { doc.addPage(); y = 20; } 
                        doc.text(line, pageWidth - margin - indent, y, { align: 'right' });
                        y += 6;
                    });
                    y += 3; 
                }
                
                function addList(items, prefix = ' • ') {
                    if (items && items.length > 0) {
                        items.forEach(item => addParagraph(prefix + item, 5));
                    } else {
                        addParagraph(prefix + "لا يوجد", 5);
                    }
                }

                addTitle('تقرير التوظيف الذكي');
                addParagraph(`اسم الشركة: شركة مايس للمنتجات الطبية`);
                addParagraph(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG-u-nu-latn')}`); // Use Latin numbers for dates
                if (applicationId && !applicationId.startsWith('TEMP_APP_')) {
                     addParagraph(`معرف الطلب: ${applicationId}`);
                }
                y += 5;

                addSectionTitle('معلومات المرشح');
                addParagraph(`البريد الإلكتروني: ${currentUser.email}`);
                if (currentUser.user_metadata && currentUser.user_metadata.full_name) {
                    addParagraph(`الاسم الكامل: ${currentUser.user_metadata.full_name}`);
                } else {
                     const profileFullName = document.getElementById('fullName')?.value; // Try to get from form if available
                     if (profileFullName) addParagraph(`الاسم الكامل: ${profileFullName}`);
                     else addParagraph(`الاسم الكامل: غير متوفر`);
                }
                addParagraph(`المنصب المتقدم إليه: ${getPositionNameFromSelect(document.getElementById('position').value)}`);
                y += 5;

                addSectionTitle('ملخص تحليل السيرة الذاتية');
                addParagraph(`درجة التوافق الأولية: ${resumeAnalysis.score}%`);
                addParagraph(`الملخص العام: ${resumeAnalysis.summary}`);
                addParagraph(`نقاط القوة من السيرة:`); addList(resumeAnalysis.strengths);
                addParagraph(`مجالات التحسين من السيرة:`); addList(resumeAnalysis.weaknesses);
                y += 5;

                addSectionTitle('ملخص المقابلة الأولية');
                (interviewQuestionsData.questions || []).forEach((q, index) => {
                    if (y > 260) { doc.addPage(); y = 20; }
                    addParagraph(`السؤال ${index + 1} (${q.type} - ${q.difficulty}): ${q.question_text}`);
                    const answer = interviewAnswers[index];
                    if (answer && answer.text) {
                        addParagraph(`الإجابة النصية: ${answer.text}`, 5);
                    }
                    if (answer && answer.audioSupabasePath) { 
                        addParagraph(`(يوجد تسجيل صوتي محفوظ بالمسار: ${answer.audioSupabasePath})`, 5);
                    }
                    y += 2;
                });
                y += 5;
                
                addSectionTitle('التقييم النهائي والتوصية');
                addParagraph(`التقييم العام للمرشح: ${finalEvaluationReportData.overall_candidate_score}/100`);
                addParagraph(`التوصية النهائية: ${finalEvaluationReportData.final_recommendation}`);
                addParagraph(`مستوى الثقة في التوصية: ${finalEvaluationReportData.confidence_level}`);
                addParagraph(`نقاط القوة المؤكدة:`); addList(finalEvaluationReportData.confirmed_strengths);
                addParagraph(`مجالات التطوير الرئيسية:`); addList(finalEvaluationReportData.key_development_areas);
                addParagraph(`مبررات التوصية: ${finalEvaluationReportData.justification_for_recommendation}`);
                if(finalEvaluationReportData.suggested_next_steps_for_candidate && finalEvaluationReportData.suggested_next_steps_for_candidate.length > 0) {
                   addParagraph(`الخطوات المقترحة للمرشح:`); addList(finalEvaluationReportData.suggested_next_steps_for_candidate);
                }
                if(finalEvaluationReportData.internal_notes_for_hr){
                    addParagraph(`ملاحظات داخلية لفريق الموارد البشرية: ${finalEvaluationReportData.internal_notes_for_hr}`);
                }

                doc.save(`تقرير_توظيف_${(applicationId && !applicationId.startsWith('TEMP_APP_')) ? applicationId : 'مرشح'}.pdf`);
                showAlert('✅ تم إنشاء التقرير PDF بنجاح!', 'success');
            } catch (error) {
                console.error('PDF generation error:', error);
                showAlert('❌ فشل في إنشاء التقرير PDF. ' + error.message, 'error');
            }
        }

        // --- Navigation and Step Control ---
        async function nextStep() {
            if (currentStep === 1) {
                if (!uploadedFileObject || !document.getElementById('position').value) { 
                    showAlert('❌ يرجى رفع السيرة الذاتية واختيار المنصب.', 'error'); return;
                }
                try {
                    const positionValue = document.getElementById('position').value;
                    let { data: posData, error: posError } = await supabase
                        .from('positions') // Ensure this table exists with 'id' and 'value' columns
                        .select('id')
                        .eq('value', positionValue)
                        .single();
                    if (posError || !posData) {
                        console.error("Position fetch error:", posError);
                        showAlert('❌ تعذر العثور على المنصب في قاعدة البيانات. يرجى التأكد من إعدادات المناصب.', 'error');
                        return;
                    }
                    const position_id = posData.id;
                    
                    let { data: appData, error: appError } = await supabase
                        .from('applications') // Ensure this table exists
                        .insert([{
                            user_id: currentUser.id,
                            position_id: position_id,
                            status: 'started',
                            // resume_file_path: uploadedFileUrl // Store the initially uploaded file path
                        }])
                        .select('id') // Ensure RLS allows selecting 'id' after insert
                        .single();

                    if (appError || !appData) {
                        console.error("Application creation error:", appError);
                        showAlert('❌ تعذر بدء الطلب في قاعدة البيانات. يرجى المحاولة لاحقاً.', 'error');
                        return;
                    }
                    applicationId = appData.id; // CRITICAL: Update global applicationId to the DB ID
                    console.log("Application started with DB ID:", applicationId);
                } catch (err) {
                    console.error("Error during application creation DB operations:", err);
                    showAlert('❌ حدث خطأ تقني أثناء بدء الطلب. يرجى المحاولة لاحقاً.', 'error');
                    return;
                }
                currentStep = 2; analyzeResume();
            } else if (currentStep === 2) {
                if (!resumeAnalysis || document.getElementById('step2Next').disabled) {
                    showAlert('❌ يرجى انتظار اكتمال تحليل السيرة.', 'error'); return;
                }
                currentStep = 3; generateInterviewQuestions();
            } else if (currentStep === 3) {
                const answeredTexts = interviewAnswers.filter(ans => ans && ans.text && ans.text.trim().length > 0);
                if (answeredTexts.length === 0) {
                     showAlert('❌ يرجى الإجابة على سؤال واحد على الأقل نصيًا.', 'error'); return;
                }
                const shortAnswersCount = answeredTexts.filter(ans => ans.text.trim().length < 20).length;
                if (shortAnswersCount > 0 && shortAnswersCount === answeredTexts.length) { 
                     if (!confirm('بعض إجاباتك النصية مختصرة جداً (أقل من 20 حرف). للحصول على تقييم أفضل، نوصي بإجابات أكثر تفصيلاً. هل تريد المتابعة على أي حال؟')) return;
                }

                try {
                    if (interviewQuestionsData && Array.isArray(interviewQuestionsData.questions) && interviewQuestionsData.questions.length > 0 && applicationId && !applicationId.startsWith('TEMP_APP_')) {
                        const answersToInsert = [];
                        for (let i = 0; i < interviewQuestionsData.questions.length; i++) {
                            const q = interviewQuestionsData.questions[i];
                            const ans = interviewAnswers[i] || {};
                            // Only insert if there's text or an audio path
                            if ((ans.text && ans.text.trim() !== '') || ans.audioSupabasePath) {
                                answersToInsert.push({
                                    application_id: applicationId,
                                    user_id: currentUser.id, // Good to include user_id
                                    question_text: q.question_text,
                                    text_answer: (ans.text && ans.text.trim() !== '') ? ans.text.trim() : null,
                                    audio_answer_path: ans.audioSupabasePath || null
                                });
                            }
                        }
                        if (answersToInsert.length > 0) {
                            const { error } = await supabase.from('interview_answers').insert(answersToInsert);
                            if (error) {
                                console.error('Error saving interview answers:', error);
                                showAlert('⚠️ حدث خطأ أثناء حفظ إجابات المقابلة في قاعدة البيانات.', 'warning');
                            }
                        }
                    } else {
                        console.warn("Skipping saving interview answers: Missing data or invalid application ID.");
                    }
                } catch (err) {
                    console.error('Exception saving interview answers:', err);
                    showAlert('⚠️ حدث خطأ تقني أثناء حفظ إجابات المقابلة.', 'warning');
                }

                currentStep = 4; generateFinalEvaluation();
            }
            updateStepDisplayUI();
            saveProgressToStorage(); 
        }

        function prevStep() {
            if (currentStep > 1) {
                currentStep--;
                updateStepDisplayUI();
            }
        }

        function updateStepDisplayUI() {
            const progressPercent = ((currentStep - 1) / 3) * 100; 
            const progressBarFill = document.getElementById('progressFill');
            const progressBar = progressBarFill.parentElement;
            
            progressBarFill.style.width = progressPercent + '%';
            progressBar.setAttribute('aria-valuenow', progressPercent);

            document.querySelectorAll('.step').forEach((stepEl, index) => {
                stepEl.classList.remove('active', 'completed');
                stepEl.setAttribute('aria-selected', 'false');
                if (index + 1 < currentStep) {
                    stepEl.classList.add('completed');
                } else if (index + 1 === currentStep) {
                    stepEl.classList.add('active');
                    stepEl.setAttribute('aria-selected', 'true');
                }
            });
            document.querySelectorAll('.section').forEach(sectionEl => sectionEl.classList.remove('active'));
            const currentSection = document.getElementById(`step${currentStep}`);
            if (currentSection) currentSection.classList.add('active');
        }

        function startOver() {
            if (confirm('هل أنت متأكد أنك تريد بدء طلب جديد؟ سيتم فقدان جميع البيانات الحالية لهذا الطلب.')) {
                if (currentUser && applicationId) { 
                    localStorage.removeItem(`recruitment_progress_${currentUser.id}_${applicationId}`);
                }
                applicationId = generateNewApplicationId(); // Generates NEW TEMP ID for new application

                currentStep = 1;
                uploadedFileObject = null; uploadedFileUrl = null;
                resumeAnalysis = null; interviewQuestionsData = null;
                interviewAnswers = [];
                
                if(fileInput) fileInput.value = ''; 
                document.getElementById('position').value = '';
                
                ['step1Next', 'step2Next', 'step3Next'].forEach(id => {
                    const btn = document.getElementById(id);
                    if(btn) btn.disabled = true;
                });
                
                document.getElementById('fileUploadIcon').textContent = '📄';
                document.getElementById('fileUploadTitle').textContent = 'اسحب الملف هنا أو اضغط للاختيار';
                document.getElementById('fileUploadHint').textContent = 'الصيغ المدعومة: PDF, DOCX, DOC, TXT (الحد الأقصى 10MB)';
                document.getElementById('fileInfoPreview').style.display = 'none';

                ['analysisResult', 'interviewQuestions', 'finalReport'].forEach(id => {
                    const el = document.getElementById(id);
                    if(el) {
                        el.style.display = 'none';
                        el.innerHTML = ''; 
                        if (id === 'finalDetails') el.removeAttribute('data-evaluation');
                    }
                });
                document.querySelectorAll('.answer-input').forEach(ta => ta.value = '');
                document.querySelectorAll('audio[id^="audioPlayer_"]').forEach(ap => {
                    ap.src = '';
                    ap.style.display = 'none';
                });
                document.querySelectorAll('p[id^="recordStatus_"]').forEach(rs => rs.textContent = 'اضغط للتسجيل');

                updateStepDisplayUI();
                updateStatusIndicator('pending', '🚀 جاهز للبدء', '🔄');
                showAlert('✅ تم إعادة تعيين الطلب. يمكنك البدء من جديد.', 'success');
            }
        }
        
        // --- Progress Persistence (LocalStorage) ---
        function saveProgressToStorage(isCompleted = false) {
            if (!currentUser || !applicationId) return; 
            try {
                const progress = {
                    currentStep, applicationId,
                    position: document.getElementById('position').value,
                    uploadedFileUrl, 
                    resumeAnalysis,
                    interviewQuestionsData, 
                    interviewAnswers: interviewAnswers.map(ans => ({ 
                        text: ans.text,
                        audioSupabasePath: ans.audioSupabasePath 
                    })),
                    final_evaluation_data: null, 
                    timestamp: new Date().toISOString(),
                    isCompleted
                };

                if (isCompleted && currentStep === 4) {
                    const finalDetailsEl = document.getElementById('finalDetails');
                    if (finalDetailsEl && finalDetailsEl.dataset.evaluation) {
                        try {
                            progress.final_evaluation_data = JSON.parse(finalDetailsEl.dataset.evaluation);
                        } catch(e) { console.error("Error parsing final_evaluation_data for saving:", e); }
                    }
                }

                localStorage.setItem(`recruitment_progress_${currentUser.id}_${applicationId}`, JSON.stringify(progress));
            } catch (error) { 
                console.error('Error saving progress:', error);
                showAlert('⚠️ حدث خطأ أثناء محاولة حفظ تقدمك.', 'warning');
            }
        }
        
        async function restoreProgressFromStorage() {
            if (!currentUser || !applicationId) return; 
            try {
                // The key uses the current global applicationId.
                // If it's a temp one, it looks for progress saved with that temp one.
                // If it's a DB-backed one (restored below), it looks for that.
                const savedData = localStorage.getItem(`recruitment_progress_${currentUser.id}_${applicationId}`);
                if (savedData) {
                    const progress = JSON.parse(savedData);
                    
                    // CRUCIAL: If the saved data has an applicationId (especially a DB-backed one), update the global one.
                    if (progress.applicationId && progress.applicationId !== applicationId) {
                        console.log(`Restoring global applicationId from ${applicationId} to ${progress.applicationId}`);
                        applicationId = progress.applicationId; 
                        // If we updated applicationId, we might need to re-fetch from localStorage with the new ID
                        // but this could loop. Simpler: the initial fetch was with a temp ID. If it finds something,
                        // that something *should* have been saved with that same temp ID or this logic is flawed.
                        // The primary fix is that `applicationId` gets the DB ID after step 1, and subsequent saves use it.
                        // On reload, `onAuthStateChange` -> `generateNewApplicationId` (temp) -> `restoreProgress` (uses temp key).
                        // This means only progress saved with a *temp* key would be found initially.
                        // This complex interaction might need a rethink for robust multi-session DB-linked progress.
                        // For now, let's assume `applicationId` from `progress` is the one to keep if found.
                    }

                    const savedTime = new Date(progress.timestamp);
                    const now = new Date();
                    const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

                    if (hoursDiff < 72 && !progress.isCompleted) { 
                        if (confirm(`تم العثور على تقدم محفوظ للتطبيق (ID: ${progress.applicationId || 'غير معروف'}). هل تريد المتابعة من حيث توقفت؟`)) {
                            currentStep = progress.currentStep || 1;
                            applicationId = progress.applicationId || applicationId; // Ensure global one is updated
                            document.getElementById('position').value = progress.position || '';
                            uploadedFileUrl = progress.uploadedFileUrl; 
                            resumeAnalysis = progress.resumeAnalysis;
                            interviewQuestionsData = progress.interviewQuestionsData;
                            interviewAnswers = progress.interviewAnswers || [];

                            if (uploadedFileUrl) { 
                                document.getElementById('fileUploadIcon').textContent = '✔️';
                                const fileNameFromUrl = uploadedFileUrl.substring(uploadedFileUrl.lastIndexOf('/') + 1).split('_').slice(2).join('_') || "ملف سابق";
                                document.getElementById('fileUploadTitle').textContent = 'تم رفع ملف سابقاً';
                                document.getElementById('fileUploadHint').innerHTML = `<strong>${fileNameFromUrl}</strong>`;
                                document.getElementById('step1Next').disabled = !document.getElementById('position').value;
                                document.getElementById('fileInfoPreview').style.display = 'block';
                                document.getElementById('fileNamePreview').textContent = fileNameFromUrl;
                                document.getElementById('fileSizePreview').textContent = "(الحجم غير متوفر للاستعادة)";
                            }
                            
                            updateStepDisplayUI(); 
                            
                            if (currentStep >= 2 && resumeAnalysis) {
                                displayResumeAnalysisResults(resumeAnalysis);
                                document.getElementById('step2Next').disabled = false;
                            }
                            if (currentStep >= 3 && interviewQuestionsData && interviewQuestionsData.questions) {
                                displayInterviewQuestionsUI(interviewQuestionsData.questions); 
                                const atLeastOneAnswered = interviewAnswers.some(ans => ans && ans.text && ans.text.trim().length > 0);
                                document.getElementById('step3Next').disabled = !atLeastOneAnswered;
                            }
                            if (currentStep === 4 && progress.final_evaluation_data) {
                                const finalEvalDataFromStorage = progress.final_evaluation_data;
                                if (finalEvalDataFromStorage) {
                                    displayFinalEvaluationUI(finalEvalDataFromStorage);
                                    document.getElementById('finalDetails').dataset.evaluation = JSON.stringify(finalEvalDataFromStorage); 
                                }
                            }
                            showAlert('✅ تم استعادة التقدم المحفوظ.', 'success');
                        } else {
                            clearProgressFromStorage(); 
                            applicationId = generateNewApplicationId(); // Start fresh with a new temp ID
                        }
                    } else if (progress.isCompleted || hoursDiff >= 72) {
                        clearProgressFromStorage(); 
                        if(progress.isCompleted) showAlert('تم إكمال هذا الطلب سابقاً. لبدء طلب جديد، اضغط "بدء طلب جديد".', 'info');
                        else showAlert('انتهت صلاحية التقدم المحفوظ (أكثر من 3 أيام). يرجى البدء من جديد.', 'info');
                        applicationId = generateNewApplicationId(); 
                    }
                }
            } catch (error) { 
                console.error('Error restoring progress:', error); 
                clearProgressFromStorage(); 
                applicationId = generateNewApplicationId(); 
            }
        }
        
        function clearProgressFromStorage() { 
            if (currentUser && applicationId) { // applicationId could be temp or DB-backed
                localStorage.removeItem(`recruitment_progress_${currentUser.id}_${applicationId}`);
            }
        }

        function showAutosaveIndicator() {
            const indicator = document.getElementById('autosaveIndicator');
            indicator.classList.add('show');
            indicator.textContent = '⏳ جاري الحفظ...';
            setTimeout(() => {
                indicator.textContent = '✓ تم حفظ التقدم تلقائياً';
                 setTimeout(() => { indicator.classList.remove('show'); }, 1500);
            }, 1000);
        }

        // --- UI Alerts ---
        function showAlert(message, type = 'info', context = 'global') {
            const authModal = document.getElementById('authModal');
            const alertContainer = (context === 'form' && authModal.style.display === 'block') ?
                                   authModal.querySelector('.modal-content') :
                                   document.getElementById('alertContainer');

            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.setAttribute('role', 'alert');
            
            const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
            alertDiv.innerHTML = `<span class="alert-icon" aria-hidden="true">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
            
            if (context === 'form' && authModal.style.display === 'block') { 
                 const formElement = alertContainer.querySelector('form');
                 if (formElement) alertContainer.insertBefore(alertDiv, formElement);
                 else alertContainer.appendChild(alertDiv); 
            } else { 
                alertContainer.appendChild(alertDiv);
            }
            
            try { alertDiv.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e) { /* ignore */ }

            setTimeout(() => { alertDiv.style.opacity = '0'; setTimeout(()=> alertDiv.remove(), 500); }, 7000); 
        }

        // --- Stats Animation ---
        function startStatAnimation() {
            const statNumbers = document.querySelectorAll('.stat-number[data-target]');
            statNumbers.forEach(stat => {
                if (stat.dataset.animated === "true") return; 
                stat.dataset.animated = "true";

                const target = parseInt(stat.dataset.target);
                if (isNaN(target)) return; 

                const suffix = stat.textContent.replace(/\d+/g, '').trim();
                let count = 0;
                const duration = 2000; 
                const frameDuration = 1000 / 60; 
                const totalFrames = Math.round(duration / frameDuration);
                const increment = target / totalFrames;

                function animate() {
                    count += increment;
                    if (count >= target) {
                        stat.textContent = target + suffix;
                        return;
                    }
                    stat.textContent = Math.round(count) + suffix;
                    requestAnimationFrame(animate);
                }
                animate();
            });
        }
        
        // --- Floating Assistant ---
        let assistantHelpVisible = false;
        function showAssistantHelp() {
            const existingHelp = document.getElementById('assistantHelpDialog');
            if (existingHelp) {
                existingHelp.remove();
                assistantHelpVisible = false;
                return;
            }

            const messages = [
                "مرحباً بك! أنا مساعدك الذكي في منصة التوظيف.",
                "يمكنني تقديم المساعدة والإرشادات خلال عملية التقديم.",
                "<strong>الخطوات الرئيسية:</strong>",
                "1. <strong>رفع السيرة الذاتية:</strong> تأكد أنها حديثة وبصيغة PDF, DOCX, DOC أو TXT.",
                "2. <strong>تحليل السيرة:</strong> سيقوم الذكاء الاصطناعي بتحليلها وإعطائك تقييماً أولياً.",
                "3. <strong>المقابلة الأولية:</strong> أجب على الأسئلة بوضوح (نصياً أو صوتياً).",
                "4. <strong>التقييم النهائي:</strong> ستحصل على تقرير شامل.",
                "<strong>نصائح سريعة:</strong>",
                "- كن صادقاً ومفصلاً في إجاباتك.",
                "- تأكد من جودة اتصال الإنترنت، خاصة عند رفع الملفات أو التسجيل الصوتي.",
                "- لا تتردد في استخدام التسجيل الصوتي إذا كان أسهل لك.",
                "- يتم حفظ تقدمك تلقائياً عند الانتقال بين الخطوات أو إدخال البيانات.",
                "إذا واجهتك أي مشكلة تقنية، حاول تحديث الصفحة أو التحقق من اتصالك بالإنترنت."
            ];
            
            const helpDiv = document.createElement('div');
            helpDiv.id = 'assistantHelpDialog';
            helpDiv.className = 'analysis-card'; 
            helpDiv.style.cssText = `
                position: fixed; bottom: 110px; left: 30px; right: auto; z-index: 1001; 
                max-width: 380px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.5s ease-out;
                max-height: 70vh; overflow-y: auto; direction: rtl; padding: 25px;
            `; 
            helpDiv.setAttribute('role', 'dialog');
            helpDiv.setAttribute('aria-labelledby', 'assistantHelpTitle');

            helpDiv.innerHTML = `
                <h3 id="assistantHelpTitle" style="font-size:1.5rem; margin-bottom:15px;"><span role="img" aria-label="Robot Emoji">🤖</span> المساعد الذكي</h3>
                <div style="font-size: 0.95rem; line-height: 1.8;">
                    ${messages.map(msg => `<p style="margin-bottom:10px;">${msg}</p>`).join('')}
                </div>
                <button class="btn btn-secondary" onclick="this.parentElement.remove(); assistantHelpVisible = false;" style="width:100%; margin-top:15px;">
                    <span class="btn-icon" role="img" aria-label="Checkmark">✔</span> فهمت، شكراً!
                </button>
            `;
            document.body.appendChild(helpDiv);
            assistantHelpVisible = true;
        }

        // --- DOMContentLoaded ---
        document.addEventListener('DOMContentLoaded', async function() {
            startStatAnimation(); 
            
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                // currentUser will be set by onAuthStateChange
                // applicationId will be initialized by onAuthStateChange if null
                // showApplicationUI and restoreProgressFromStorage also called by onAuthStateChange
            } else {
                resetApplicationUI(); 
            }

            const positionDropdown = document.getElementById('position');
            if (positionDropdown) {
                positionDropdown.addEventListener('change', () => {
                    const step1NextBtn = document.getElementById('step1Next');
                    if (step1NextBtn) {
                         step1NextBtn.disabled = !(uploadedFileUrl && positionDropdown.value);
                    }
                });
            }
        });

        /*
        --- IMPORTANT: Supabase Storage & RLS ---
        1.  Bucket Creation:
            - You MUST create a bucket named 'files' in your Supabase project.
            - Go to Supabase Dashboard -> Storage -> Create bucket.
            - Name: files
            - Public access: You can set this to true if you want files to be publicly readable by default via URL.
              If false, you'll need RLS policies for SELECT or use signed URLs. The script currently uses getPublicUrl().

        2.  Row Level Security (RLS) Policies for 'files' bucket:
            Enable RLS on the 'files' bucket. Here are example policies. Adapt as needed.

            Policy 1: Allow authenticated users to UPLOAD CVs to their own folder structure
            - Policy Name: Allow CV uploads by authenticated users
            - Target Roles: authenticated
            - Operations: INSERT
            - USING expression / WITH CHECK expression:
              bucket_id = 'files' AND
              (storage.foldername(name))[1] = auth.uid()::text -- Assumes path starts with user_id

            Policy 2: Allow authenticated users to UPLOAD audio answers to their own folder structure
            - Policy Name: Allow audio answer uploads by authenticated users
            - Target Roles: authenticated
            - Operations: INSERT
            - USING expression / WITH CHECK expression:
              bucket_id = 'files' AND
              (storage.foldername(name))[1] = 'audio_answers' AND
              (storage.foldername(name))[2] = auth.uid()::text -- Assumes path is audio_answers/user_id/...

            Policy 3: Allow PUBLIC READ access to files (if bucket is not public or for fine-grained control)
                       (Needed for audioPlayer.src = supabase.storage.from(...).getPublicUrl(...))
            - Policy Name: Allow public read access
            - Target Roles: anon, authenticated (or just 'public' role if you've defined one)
            - Operations: SELECT
            - USING expression:
              bucket_id = 'files'
              -- You can restrict this further, e.g., only specific folders or based on file metadata if needed.

        --- Database Tables ---
        Ensure you have the following tables with appropriate columns in your Supabase database:
        - profiles (id (uuid, PK, references auth.users.id), email, full_name, created_at)
        - positions (id (serial/uuid, PK), value (text, unique, e.g., 'medical-representative'), name (text, e.g., 'مندوب طبي'))
        - applications (id (serial/uuid, PK), user_id (uuid, FK to auth.users.id), position_id (FK to positions.id), status (text), created_at, resume_file_path (text, optional))
        - resume_analyses (id (PK), application_id (FK), user_id (FK, optional), analysis_data (jsonb), score (integer), resume_file_path (text, optional), created_at)
        - interview_questions (id (PK), application_id (FK), user_id (FK), questions_data (jsonb), created_at)
        - interview_answers (id (PK), application_id (FK), user_id (FK), question_text (text), text_answer (text, nullable), audio_answer_path (text, nullable), created_at)
        - final_reports (id (PK), application_id (FK), user_id (FK), final_evaluation_data (jsonb), overall_candidate_score (integer), final_recommendation (text), created_at)
        Adjust column types and constraints as per your specific requirements.
        */
