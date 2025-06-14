/*
 * Mays Medical HR Portal JavaScript
 * Version: 1.1.0
 * Author: AI Assistant (refined from original)
 * Description: Handles dynamic content, user interactions, and API integrations.
 */

// --- Global Application State & Configuration ---
const appState = {
    currentUser: null, // { id, name, email, isAdmin, phone, dateJoined, type }
    jobs: [],
    applications: [], 
    users: [], 
    chat: {
        mode: 'text', // 'text' or 'voice'
        isVoiceListening: false,
        messages: [], // { sender: 'user'/'bot', text: 'message', timestamp: ... }
        aiIsTyping: false,
        isWindowOpen: false,
        lastBotMessage: "", // To avoid repetitive bot messages if AI is slow
    },
    ui: {
        activeModalId: null,
        isUserMenuOpen: false,
        isMobileNavOpen: false,
        alertTimeoutId: null, // To manage alert timeouts
        activeSection: 'home', // For active nav link highlighting
    },
    filters: { 
        departments: [],
        locations: [],
        types: []
    }
};

// Intentionally global for env.local.js to set it if present
var GEMINI_API_KEY_FOR_CHATBOT = "YOUR_GEMINI_API_KEY_PLACEHOLDER"; 

let speechRecognitionInstance = null;

// --- DOM Elements Cache ---
const DOMElements = {};

function cacheDOMElements() {
    DOMElements.pageHeader = document.getElementById('pageHeader');
    DOMElements.userMenuButton = document.getElementById('userMenuButton');
    DOMElements.userDropdownMenu = document.getElementById('userDropdownMenu');
    DOMElements.mobileNavToggle = document.getElementById('mobileNavToggle');
    DOMElements.mainNav = document.getElementById('mainNavMenu'); // Changed selector
    DOMElements.navLinks = document.querySelectorAll('.nav-link'); // For scrollspy

    DOMElements.jobsGridContainer = document.getElementById('jobsGridContainer');
    DOMElements.noJobsMessage = document.getElementById('noJobsMessage');
    DOMElements.departmentFilter = document.getElementById('departmentFilter');
    DOMElements.locationFilter = document.getElementById('locationFilter');
    DOMElements.typeFilter = document.getElementById('typeFilter');
    DOMElements.showGeneralApplicationModalBtn = document.getElementById('showGeneralApplicationModalBtn');

    DOMElements.chatToggleButton = document.getElementById('chatToggleButton');
    DOMElements.chatWindowContainer = document.getElementById('chatWindowContainer');
    DOMElements.closeChatButton = document.getElementById('closeChatButton');
    DOMElements.chatModeTextBtn = document.getElementById('chatModeTextBtn');
    DOMElements.chatModeVoiceBtn = document.getElementById('chatModeVoiceBtn');
    DOMElements.chatMessagesContainer = document.getElementById('chatMessagesContainer');
    DOMElements.chatInputControl = document.getElementById('chatInputControl');
    DOMElements.sendChatMessageBtn = document.getElementById('sendChatMessageBtn');
    DOMElements.voiceRecognitionBtn = document.getElementById('voiceRecognitionBtn');

    DOMElements.loginModalContainer = document.getElementById('loginModalContainer');
    DOMElements.registerModalContainer = document.getElementById('registerModalContainer');
    DOMElements.jobDetailsModalContainer = document.getElementById('jobDetailsModalContainer');
    DOMElements.jobApplicationModalContainer = document.getElementById('jobApplicationModalContainer');
    DOMElements.generalApplicationModalContainer = document.getElementById('generalApplicationModalContainer');

    DOMElements.loginFormElement = document.getElementById('loginFormElement');
    DOMElements.registerFormElement = document.getElementById('registerFormElement');
    DOMElements.jobDetailsModalTitle = document.getElementById('jobDetailsModalTitle');
    DOMElements.jobDetailsModalContent = document.getElementById('jobDetailsModalContent');
    DOMElements.jobApplicationModalTitleSpan = document.querySelector('#jobApplicationModalTitleText .job-title-placeholder');
    DOMElements.applicationJobIdInput = document.getElementById('applicationJobIdInput');
    DOMElements.jobApplicationFormElement = document.getElementById('jobApplicationFormElement');
    DOMElements.generalApplicationFormElement = document.getElementById('generalApplicationFormElement');
    DOMElements.generalDesiredFieldSelect = document.getElementById('generalDesiredFieldSelect');
    
    DOMElements.applyResumeFileInput = document.getElementById('applyResumeFileInput');
    DOMElements.applyResumeFileError = document.getElementById('applyResumeFileError');
    DOMElements.generalApplyResumeFileInput = document.getElementById('generalApplyResumeFileInput');
    DOMElements.generalResumeFileError = document.getElementById('generalResumeFileError');

    DOMElements.globalAlertContainer = document.getElementById('globalAlertContainer');
    DOMElements.currentYearSpan = document.getElementById('currentYear');
}

// --- Application Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    // Check if env.local.js has set the API key
    if (typeof window.DEV_GEMINI_API_KEY !== 'undefined' && window.DEV_GEMINI_API_KEY) {
        GEMINI_API_KEY_FOR_CHATBOT = window.DEV_GEMINI_API_KEY;
    }
    if (GEMINI_API_KEY_FOR_CHATBOT === "YOUR_GEMINI_API_KEY_PLACEHOLDER" || !GEMINI_API_KEY_FOR_CHATBOT) {
        console.warn("Gemini API Key for Chatbot is not configured. Chat AI will use mock responses or be disabled.");
    }
    
    cacheDOMElements();
    loadInitialMockData(); // Load data first
    populateJobFiltersFromData(); // Then populate filters
    renderJobsGrid();
    initializeSpeechRecognitionAPI();
    updateUserMenuDisplay(); // Reflects login state
    addEventListeners();
    checkUserSession(); // Checks localStorage for logged-in user
    initializeScrollSpy();
    
    if (DOMElements.currentYearSpan) {
        DOMElements.currentYearSpan.textContent = new Date().getFullYear();
    }

    // Ensure chat window is hidden initially and ARIA attributes are set
    if (DOMElements.chatWindowContainer) {
        DOMElements.chatWindowContainer.classList.remove('show');
        DOMElements.chatWindowContainer.setAttribute('aria-hidden', 'true');
        appState.chat.isWindowOpen = false;
        DOMElements.chatToggleButton?.setAttribute('aria-expanded', 'false');
    }
});

function addEventListeners() {
    window.addEventListener('scroll', handleHeaderScroll);
    window.addEventListener('scroll', handleScrollSpy); // For nav link highlighting

    DOMElements.userMenuButton?.addEventListener('click', () => toggleUserMenu());
    DOMElements.mobileNavToggle?.addEventListener('click', () => toggleMobileNav());

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modalId;
            if (modalId) closeModal(modalId);
        });
    });
    
    // Dynamic links in user dropdown and form links
    document.addEventListener('click', (event) => {
        const target = event.target.closest('a[data-action], button[data-action]');
        if (target && target.dataset.action) {
            event.preventDefault();
            const action = target.dataset.action;
            if (action === 'showLoginModal') showLoginModal();
            else if (action === 'showRegisterModal') showRegisterModal();
            else if (action === 'logout') userLogout();
            else if (action === 'adminDashboard') window.location.href = 'page/dashboard/dashboard.html'; // Example
        }
    });

    DOMElements.chatToggleButton?.addEventListener('click', () => toggleChatWindow()); // Simplified toggle
    DOMElements.closeChatButton?.addEventListener('click', () => toggleChatWindow(false));
    DOMElements.chatModeTextBtn?.addEventListener('click', () => selectChatMode('text'));
    DOMElements.chatModeVoiceBtn?.addEventListener('click', () => selectChatMode('voice'));
    DOMElements.sendChatMessageBtn?.addEventListener('click', sendUserChatMessage);
    DOMElements.chatInputControl?.addEventListener('keypress', handleChatInputKeyPress);
    DOMElements.voiceRecognitionBtn?.addEventListener('click', toggleVoiceRecognition);

    DOMElements.departmentFilter?.addEventListener('change', renderJobsGrid);
    DOMElements.locationFilter?.addEventListener('change', renderJobsGrid);
    DOMElements.typeFilter?.addEventListener('change', renderJobsGrid);
    DOMElements.showGeneralApplicationModalBtn?.addEventListener('click', openGeneralApplicationModal);

    DOMElements.loginFormElement?.addEventListener('submit', handleUserLogin);
    DOMElements.registerFormElement?.addEventListener('submit', handleUserRegister);
    DOMElements.jobApplicationFormElement?.addEventListener('submit', handleSpecificJobApplication);
    DOMElements.generalApplicationFormElement?.addEventListener('submit', handleGeneralCvSubmission);

    DOMElements.applyResumeFileInput?.addEventListener('change', () => validateResumeFile(DOMElements.applyResumeFileInput, DOMElements.applyResumeFileError));
    DOMElements.generalApplyResumeFileInput?.addEventListener('change', () => validateResumeFile(DOMElements.generalApplyResumeFileInput, DOMElements.generalResumeFileError));

    window.addEventListener('click', handleOutsideClicks);
    document.addEventListener('keydown', handleGlobalKeyDown);

    DOMElements.navLinks?.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Smooth scroll to section
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Close mobile nav if open
                if (appState.ui.isMobileNavOpen) toggleMobileNav(false);
                // Manually update active link (scroll spy will also do this, but this is immediate)
                updateActiveNavLink(this.dataset.section);
            }
        });
    });
}

// --- UI Interaction & State Management ---
function handleHeaderScroll() {
    DOMElements.pageHeader?.classList.toggle('scrolled', window.scrollY > 50);
}

function toggleUserMenu(forceState) {
    const isOpen = typeof forceState === 'boolean' ? forceState : !appState.ui.isUserMenuOpen;
    DOMElements.userDropdownMenu?.classList.toggle('show', isOpen);
    appState.ui.isUserMenuOpen = isOpen;
    DOMElements.userMenuButton?.setAttribute('aria-expanded', isOpen.toString());
}

function toggleMobileNav(forceState) {
    const isOpen = typeof forceState === 'boolean' ? forceState : !appState.ui.isMobileNavOpen;
    appState.ui.isMobileNavOpen = isOpen;
    DOMElements.mainNav?.classList.toggle('mobile-active', isOpen);
    DOMElements.mobileNavToggle?.setAttribute('aria-expanded', isOpen.toString());
    if (DOMElements.mobileNavToggle) {
        DOMElements.mobileNavToggle.querySelector('i').className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    }
    document.body.classList.toggle('mobile-nav-open', isOpen);
}

function handleOutsideClicks(event) {
    if (appState.ui.isUserMenuOpen && DOMElements.userMenuButton && 
        !DOMElements.userMenuButton.contains(event.target) && 
        DOMElements.userDropdownMenu && !DOMElements.userDropdownMenu.contains(event.target)) {
        toggleUserMenu(false);
    }
    // Mobile nav usually closes on item click, or via toggle, so specific outside click handling might not be needed
    // if it's a full-screen overlay.
}

function handleGlobalKeyDown(event) {
    if (event.key === "Escape") {
        if (appState.ui.activeModalId) {
            closeModal(appState.ui.activeModalId);
        } else if (appState.chat.isWindowOpen) {
            toggleChatWindow(false);
        } else if (appState.ui.isUserMenuOpen) {
            toggleUserMenu(false);
        } else if (appState.ui.isMobileNavOpen) {
            toggleMobileNav(false);
        }
    }
}

// --- ScrollSpy for Active Navigation Link ---
function initializeScrollSpy() {
    const sections = document.querySelectorAll('.section-observer');
    const observerOptions = {
        root: null, // viewport
        rootMargin: `-${(DOMElements.pageHeader?.offsetHeight || 70) + 10}px 0px 0px 0px`, // Offset by header height + a bit
        threshold: 0.4 // Trigger when 40% of the section is visible
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateActiveNavLink(entry.target.id);
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));
}

function updateActiveNavLink(sectionId) {
    appState.ui.activeSection = sectionId;
    DOMElements.navLinks?.forEach(link => {
        link.classList.toggle('active-link', link.dataset.section === sectionId);
    });
}


// --- Mock Data & Initialization ---
function loadInitialMockData() {
    // Enhanced Mock Data
    appState.jobs = [
        { id: 'J001', title: 'مطور واجهة أمامية أول (Senior Frontend Developer)', department: 'تطوير البرمجيات', location: 'الرياض', type: 'دوام كامل', datePosted: '2024-07-28', description: 'نبحث عن مطور واجهة أمامية محترف يتمتع بخبرة واسعة في بناء تطبيقات ويب تفاعلية باستخدام أحدث التقنيات. ستكون مسؤولاً عن قيادة تطوير الواجهات الأمامية، وضمان جودة الكود، والتعاون مع فرق التصميم والـ backend.', responsibilities: ['قيادة تصميم وتنفيذ واجهات مستخدم متقدمة باستخدام React و TypeScript.', 'تحسين أداء وسرعة تحميل التطبيقات لضمان أفضل تجربة مستخدم.', 'كتابة كود نظيف، قابل للصيانة، وموثق بشكل جيد وفقًا لأفضل الممارسات.', 'مراجعة كود الزملاء وتقديم التوجيه والإرشاد الفني.', 'البقاء على اطلاع دائم بأحدث اتجاهات وتقنيات تطوير الواجهات الأمامية.'], qualifications: ['خبرة لا تقل عن 5 سنوات في تطوير الواجهات الأمامية.', 'إتقان HTML5, CSS3, JavaScript (ES6+), و TypeScript.', 'خبرة عميقة ومثبتة في React (Hooks, Context API, Redux/Zustand).', 'فهم جيد لـ RESTful APIs وكيفية التفاعل معها بكفاءة.', 'خبرة في أدوات بناء (Webpack/Vite) واختبار الواجهات الأمامية (Jest, React Testing Library).', 'قدرة على العمل بشكل مستقل وضمن فريق.'], skills: ['React', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3/SASS', 'Redux', 'Jest', 'Git', 'Agile Development', 'Problem Solving', 'Leadership'] },
        { id: 'J002', title: 'أخصائي تسويق منتجات طبية', department: 'التسويق', location: 'جدة', type: 'دوام كامل', datePosted: '2024-07-25', description: 'نسعى لتوظيف أخصائي تسويق منتجات طبية مبدع لإدارة وتطوير استراتيجيات التسويق لمنتجاتنا الطبية المبتكرة، وزيادة الوعي بالعلامة التجارية في السوق السعودي.', responsibilities: ['تطوير وتنفيذ خطط التسويق للمنتجات الطبية الجديدة والحالية.', 'إجراء أبحاث السوق وتحليل المنافسين لتحديد الفرص والتحديات.', 'إنشاء محتوى تسويقي جذاب (كتيبات، عروض تقديمية، محتوى رقمي).', 'تنظيم والمشاركة في الفعاليات والمعارض الطبية.', 'بناء علاقات قوية مع قادة الرأي في المجال الطبي.'], qualifications: ['شهادة جامعية في التسويق، الصيدلة، أو مجال طبي ذي صلة.', 'خبرة عملية لا تقل عن 3 سنوات في تسويق المنتجات الطبية أو الأدوية.', 'فهم عميق للسوق الطبي السعودي والمتطلبات التنظيمية.', 'مهارات تواصل وعرض ممتازة باللغتين العربية والإنجليزية.'], skills: ['Product Marketing', 'Medical Devices', 'Pharmaceutical Marketing', 'Market Research', 'Content Creation', 'Event Management', 'Communication Skills'] },
        { id: 'J003', title: 'مهندس أجهزة طبية (خريج حديث)', department: 'الهندسة الطبية', location: 'الدمام', type: 'تدريب', datePosted: '2024-07-22', description: 'فرصة تدريب للخريجين الجدد في مجال الهندسة الطبية للمساهمة في تصميم واختبار أجهزة طبية مبتكرة تحت إشراف فريق من المهندسين الخبراء.', responsibilities: ['المساعدة في تصميم وتطوير نماذج أولية للأجهزة الطبية.', 'إجراء الاختبارات والفحوصات على الأجهزة.', 'توثيق نتائج الاختبارات والمساهمة في إعداد التقارير الفنية.', 'الالتزام بمعايير الجودة والسلامة.'], qualifications: ['حديث التخرج بدرجة البكالوريوس في الهندسة الطبية أو هندسة الإلكترونيات/الميكانيكا.', 'شغف بمجال الأجهزة الطبية والابتكار.', 'قدرة على التعلم السريع والعمل ضمن فريق.', 'مهارات تواصل جيدة باللغتين العربية والإنجليزية.'], skills: ['CAD (SolidWorks/AutoCAD)', 'Microcontrollers', 'Problem Solving', 'Teamwork', 'Technical Writing', 'Prototyping'] },
        { id: 'J004', title: 'مدير حسابات عملاء (قطاع الأدوية)', department: 'المبيعات', location: 'عن بُعد', type: 'دوام كامل', datePosted: '2024-07-20', description: 'نبحث عن مدير حسابات ذو خبرة في قطاع الأدوية لإدارة وتنمية العلاقات مع العملاء الرئيسيين. العمل يتطلب زيارات ميدانية وتواصل عن بعد لخدمة العملاء في مختلف مناطق المملكة.', responsibilities: ['تحقيق أهداف المبيعات المحددة للمنطقة.', 'بناء وتوطيد علاقات قوية ومستدامة مع العملاء الحاليين والمحتملين.', 'تقديم عروض تقديمية احترافية عن منتجات الشركة وفوائدها.', 'متابعة اتجاهات السوق وأنشطة المنافسين لتقديم توصيات استراتيجية.'], qualifications: ['شهادة جامعية في الصيدلة، إدارة الأعمال أو مجال ذي صلة.', 'خبرة لا تقل عن 4 سنوات في مبيعات الأدوية أو المنتجات الطبية.', 'سجل حافل بالإنجازات في تحقيق أهداف المبيعات.', 'مهارات تفاوض وإقناع ممتازة.'], skills: ['Pharmaceutical Sales', 'Account Management', 'Negotiation', 'CRM Software', 'Communication', 'Territory Management'] }
    ];
    appState.users = [
        { id: 'U001', name: 'المدير يزيد', email: 'admin@login.com', phone: '0501234567', dateJoined: '2023-01-01', type: 'مدير', passwordHash: 'admin13579', isAdmin: true },
        { id: 'U002', name: 'سالم الموظف', email: 'salem@mays.com', phone: '0512223333', dateJoined: '2023-06-10', type: 'موظف', passwordHash: 'salem123', isAdmin: false }
    ];
    appState.applications = []; 
}

function populateJobFiltersFromData() {
    if (!appState.jobs || appState.jobs.length === 0) return;

    const departments = [...new Set(appState.jobs.map(job => job.department))].sort();
    const locations = [...new Set(appState.jobs.map(job => job.location))].sort();
    const types = [...new Set(appState.jobs.map(job => job.type))].sort();

    appState.filters.departments = departments;
    appState.filters.locations = locations;
    appState.filters.types = types;

    populateSelectWithOptions(DOMElements.departmentFilter, departments, "جميع الأقسام");
    populateSelectWithOptions(DOMElements.locationFilter, locations, "جميع المواقع");
    populateSelectWithOptions(DOMElements.typeFilter, types, "جميع أنواع الدوام");
    
    // Populate general application desired field select, excluding "أخرى" if already present
    const uniqueDepartmentsForGeneral = departments.filter(dep => dep.toLowerCase() !== 'أخرى');
    populateSelectWithOptions(DOMElements.generalDesiredFieldSelect, uniqueDepartmentsForGeneral, "-- اختر المجال --");
    if (DOMElements.generalDesiredFieldSelect && !uniqueDepartmentsForGeneral.includes('أخرى')) {
         DOMElements.generalDesiredFieldSelect.add(new Option('أخرى', 'أخرى'));
    }
}

function populateSelectWithOptions(selectElement, optionsArray, defaultOptionText = "") {
    if (!selectElement) return;
    
    // Preserve the first option if it's the default placeholder
    const firstOptionValue = selectElement.options.length > 0 ? selectElement.options[0].value : "";
    selectElement.innerHTML = ''; // Clear all existing options

    if (defaultOptionText) {
        const defaultOpt = new Option(defaultOptionText, "");
        if (firstOptionValue === "") defaultOpt.selected = true; // Reselect if it was the original default
        selectElement.add(defaultOpt);
    }

    optionsArray.forEach(optValue => {
        if (optValue) { // Ensure optValue is not null or empty before adding
            selectElement.add(new Option(optValue, optValue));
        }
    });
}

// --- UI Rendering & Updates ---
function renderJobsGrid() {
    if (!DOMElements.jobsGridContainer || !DOMElements.noJobsMessage) return;
    DOMElements.jobsGridContainer.innerHTML = ''; // Clear previous jobs

    const departmentFilter = DOMElements.departmentFilter?.value || "";
    const locationFilter = DOMElements.locationFilter?.value || "";
    const typeFilter = DOMElements.typeFilter?.value || "";

    const filteredJobs = appState.jobs.filter(job =>
        (!departmentFilter || job.department === departmentFilter) &&
        (!locationFilter || job.location === locationFilter) &&
        (!typeFilter || job.type === typeFilter)
    );

    if (filteredJobs.length === 0) {
        DOMElements.noJobsMessage.style.display = 'block';
        DOMElements.noJobsMessage.setAttribute('aria-hidden', 'false');
        DOMElements.jobsGridContainer.setAttribute('aria-busy', 'false');
        return;
    }
    DOMElements.noJobsMessage.style.display = 'none';
    DOMElements.noJobsMessage.setAttribute('aria-hidden', 'true');
    DOMElements.jobsGridContainer.setAttribute('aria-busy', 'true'); // Announce content is loading

    const fragment = document.createDocumentFragment();
    filteredJobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.setAttribute('role', 'article');
        card.setAttribute('aria-labelledby', `job-title-${job.id}`);
        
        card.innerHTML = `
            <h3 class="job-title" id="job-title-${job.id}">${job.title}</h3>
            <div class="job-department">${job.department}</div>
            <div class="job-details">
                <span class="job-detail"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${job.location}</span>
                <span class="job-detail"><i class="fas fa-briefcase" aria-hidden="true"></i> ${job.type}</span>
                 <span class="job-detail"><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${new Date(job.datePosted).toLocaleDateString('ar-SA')}</span>
            </div>
            <p class="job-description-snippet">${job.description.substring(0, 120)}...</p>
            <div class="job-actions">
                <button class="btn details-btn" data-job-id="${job.id}" aria-label="عرض تفاصيل وظيفة ${job.title}">عرض التفاصيل</button>
                <button class="btn apply-btn-in-card" data-job-id="${job.id}" aria-label="التقديم على وظيفة ${job.title}">قدم الآن</button>
            </div>
        `;
        // Add event listeners directly to buttons on creation
        card.querySelector('.details-btn').addEventListener('click', () => openJobDetailsModal(job.id));
        card.querySelector('.apply-btn-in-card').addEventListener('click', () => openJobApplicationModal(job.id));
        fragment.appendChild(card);
    });
    DOMElements.jobsGridContainer.appendChild(fragment);
    DOMElements.jobsGridContainer.setAttribute('aria-busy', 'false'); // Announce content has loaded
}

function updateUserMenuDisplay() {
    if (!DOMElements.userDropdownMenu || !DOMElements.userMenuButton) return;
    const userIcon = DOMElements.userMenuButton.querySelector('i');

    if (appState.currentUser) {
        userIcon.className = 'fas fa-user-check user-icon-loggedin'; // Specific class for logged-in state
        DOMElements.userMenuButton.setAttribute('aria-label', `قائمة المستخدم: ${appState.currentUser.name}`);
        DOMElements.userDropdownMenu.innerHTML = `
            <div class="dropdown-menu-header">
                <strong>${appState.currentUser.name}</strong>
                <small>${appState.currentUser.email}</small>
            </div>
            ${appState.currentUser.isAdmin ? `<a href="#" role="menuitem" data-action="adminDashboard"><i class="fas fa-tachometer-alt"></i> لوحة التحكم</a>` : ''}
            <a href="#" role="menuitem" data-action="logout"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
        `;
    } else {
        userIcon.className = 'fas fa-user-circle';
        DOMElements.userMenuButton.setAttribute('aria-label', 'قائمة المستخدم');
        DOMElements.userDropdownMenu.innerHTML = `
            <a href="#" role="menuitem" data-action="showLoginModal"><i class="fas fa-sign-in-alt"></i> تسجيل الدخول</a>
            <a href="#" role="menuitem" data-action="showRegisterModal"><i class="fas fa-user-plus"></i> إنشاء حساب</a>
        `;
    }
}

// --- Modal Handling ---
function openModal(modalId) {
    if (appState.ui.activeModalId) {
        closeModal(appState.ui.activeModalId); // Close any currently open modal
    }
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        appState.ui.activeModalId = modalId;
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        // Focus on the first focusable element in the modal
        const firstFocusable = modal.querySelector('button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusable?.focus();
    } else {
        console.error(`Modal with id "${modalId}" not found.`);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
    if (appState.ui.activeModalId === modalId) {
        appState.ui.activeModalId = null;
        document.body.style.overflow = 'auto'; // Restore background scroll
        // Return focus to the element that opened the modal, if applicable (more advanced)
    }
}

function showLoginModal() { openModal('loginModalContainer'); }
function showRegisterModal() { openModal('registerModalContainer'); }

function openJobDetailsModal(jobId) {
    const job = appState.jobs.find(j => j.id === jobId);
    if (!job || !DOMElements.jobDetailsModalTitle || !DOMElements.jobDetailsModalContent) {
        displayAlert('لم يتم العثور على تفاصيل الوظيفة.', 'error');
        return;
    }
    DOMElements.jobDetailsModalTitle.textContent = job.title;
    
    // Sanitize and format lists
    const formatList = (items) => {
        if (!items) return '<li>غير محدد</li>';
        return (Array.isArray(items) ? items : [items]).map(item => `<li>${escapeHTML(item)}</li>`).join('');
    };

    DOMElements.jobDetailsModalContent.innerHTML = `
        <p><strong>القسم:</strong> ${escapeHTML(job.department)}</p>
        <p><strong>الموقع:</strong> ${escapeHTML(job.location)}</p>
        <p><strong>نوع الدوام:</strong> ${escapeHTML(job.type)}</p>
        <p><strong>تاريخ النشر:</strong> ${new Date(job.datePosted).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <hr style="margin: 1rem 0;">
        <h4>الوصف الوظيفي:</h4>
        <p style="white-space: pre-wrap;">${escapeHTML(job.description)}</p>
        ${job.responsibilities ? `<h4 style="margin-top:1rem;">المسؤوليات:</h4><ul style="padding-right: 20px;">${formatList(job.responsibilities)}</ul>` : ''}
        ${job.qualifications ? `<h4 style="margin-top:1rem;">المؤهلات:</h4><ul style="padding-right: 20px;">${formatList(job.qualifications)}</ul>` : ''}
        ${job.skills ? `<h4 style="margin-top:1rem;">المهارات المطلوبة:</h4><p>${Array.isArray(job.skills) ? job.skills.map(escapeHTML).join(', ') : escapeHTML(job.skills)}</p>` : ''}
        <div style="margin-top: 2rem; text-align: center;">
            <button class="btn cta-button" id="applyFromDetailsBtn" data-job-id="${job.id}">
                <i class="fas fa-paper-plane"></i> قدم على هذه الوظيفة
            </button>
        </div>
    `;
    // Add event listener to the newly created button
    document.getElementById('applyFromDetailsBtn')?.addEventListener('click', () => {
        openJobApplicationModal(job.id);
        closeModal('jobDetailsModalContainer');
    });
    openModal('jobDetailsModalContainer');
}

function openJobApplicationModal(jobId) {
    const job = appState.jobs.find(j => j.id === jobId);
    if (!job || !DOMElements.jobApplicationModalTitleSpan || !DOMElements.applicationJobIdInput || !DOMElements.jobApplicationFormElement) {
        displayAlert('خطأ في تهيئة نموذج التقديم.', 'error');
        return;
    }
    DOMElements.jobApplicationModalTitleSpan.textContent = job.title;
    DOMElements.applicationJobIdInput.value = jobId;
    
    const form = DOMElements.jobApplicationFormElement;
    form.reset(); // Clear form fields
    clearFormErrors(form); // Clear any previous error messages

    // Pre-fill form if user is logged in
    if (appState.currentUser && !appState.currentUser.isAdmin) {
        form.elements['applyNameInput'].value = appState.currentUser.name || '';
        form.elements['applyEmailInput'].value = appState.currentUser.email || '';
        form.elements['applyPhoneInput'].value = appState.currentUser.phone || '';
    }
    openModal('jobApplicationModalContainer');
}

function openGeneralApplicationModal() {
    if (!DOMElements.generalApplicationFormElement) {
        displayAlert('خطأ في تهيئة نموذج التقديم العام.', 'error');
        return;
    }
    const form = DOMElements.generalApplicationFormElement;
    form.reset();
    clearFormErrors(form);

    if (appState.currentUser && !appState.currentUser.isAdmin) {
        form.elements['generalApplyNameInput'].value = appState.currentUser.name || '';
        form.elements['generalApplyEmailInput'].value = appState.currentUser.email || '';
        form.elements['generalApplyPhoneInput'].value = appState.currentUser.phone || '';
    }
    openModal('generalApplicationModalContainer');
}

// --- User Authentication & Session ---
function handleUserLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.elements['loginEmailInput'].value.trim();
    const password = form.elements['loginPasswordInput'].value;

    if (!email || !password) {
        displayAlert('يرجى إدخال البريد الإلكتروني وكلمة المرور.', 'error');
        return;
    }

    // Special case for hardcoded admin for demo
    if (email === 'admin@login.com' && password === 'admin13579') {
        const adminUser = appState.users.find(u => u.email === email && u.isAdmin);
        appState.currentUser = adminUser || { id:'ADMIN_RUNTIME', name: 'المدير يزيد', email: email, isAdmin: true, phone: 'N/A', dateJoined: new Date().toISOString().split('T')[0], type: 'مدير' };
        if (!adminUser && appState.currentUser.id === 'ADMIN_RUNTIME') { // Add if dynamically created
             appState.users.push(appState.currentUser);
        }
        
        localStorage.setItem('yzUserSession', JSON.stringify(appState.currentUser));
        displayAlert('تم تسجيل الدخول كمدير بنجاح! جاري توجيهك...', 'success');
        setTimeout(() => {
            closeModal('loginModalContainer');
            updateUserMenuDisplay();
            window.location.href = 'page/dashboard/dashboard.html'; // Redirect to dashboard
        }, 1200);
        return;
    }
    
    const user = appState.users.find(u => u.email === email && u.passwordHash === password && !u.isAdmin);
    if (user) {
        appState.currentUser = { ...user, isAdmin: false }; // Ensure isAdmin is explicitly false
        localStorage.setItem('yzUserSession', JSON.stringify(appState.currentUser));
        displayAlert('تم تسجيل الدخول بنجاح!', 'success');
        closeModal('loginModalContainer');
        updateUserMenuDisplay();
    } else {
        displayAlert('بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.', 'error');
    }
}

function handleUserRegister(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.elements['registerNameInput'].value.trim();
    const email = form.elements['registerEmailInput'].value.trim();
    const phone = form.elements['registerPhoneInput'].value.trim();
    const password = form.elements['registerPasswordInput'].value;
    const confirmPassword = form.elements['confirmPasswordInput'].value;

    if (!name || !email || !password || !confirmPassword) {
        displayAlert('يرجى ملء جميع الحقول المطلوبة.', 'error'); return;
    }
    if (password.length < 8) { 
        displayAlert('كلمة المرور يجب أن لا تقل عن 8 أحرف.', 'error'); return; 
    }
    if (password !== confirmPassword) { 
        displayAlert('كلمتا المرور غير متطابقتين!', 'error'); return; 
    }
    if (appState.users.find(u => u.email === email)) { 
        displayAlert('هذا البريد الإلكتروني مسجل مسبقاً!', 'error'); return; 
    }

    const newUser = {
        id: 'U' + String(Date.now()).slice(-4) + Math.random().toString(36).substr(2, 2), // More unique ID
        name, email, phone,
        dateJoined: new Date().toISOString().split('T')[0],
        type: 'مستخدم', passwordHash: password, // In real app, hash this password
        isAdmin: false
    };
    appState.users.push(newUser);
    appState.currentUser = newUser; // Auto-login new user
    localStorage.setItem('yzUserSession', JSON.stringify(appState.currentUser));
    // localStorage.setItem('yzMockUsers', JSON.stringify(appState.users)); // Persist users for mock
    displayAlert('تم إنشاء حسابك بنجاح! مرحباً بك.', 'success');
    closeModal('registerModalContainer');
    updateUserMenuDisplay();
}

function userLogout() {
    appState.currentUser = null;
    localStorage.removeItem('yzUserSession');
    displayAlert('تم تسجيل الخروج بنجاح.', 'info');
    updateUserMenuDisplay();
    if (DOMElements.userDropdownMenu?.classList.contains('show')) {
        toggleUserMenu(false); // Close dropdown if open
    }
    // If on an admin page, redirect to home
    if (window.location.pathname.includes('/dashboard.html')) {
        window.location.href = '../../Oooo.html'; // Adjust path as needed
    }
}

function checkUserSession() {
    const sessionData = localStorage.getItem('yzUserSession');
    if (sessionData) {
        try {
            const userData = JSON.parse(sessionData);
            // Basic validation of stored user data
            if (userData && userData.id && userData.email) {
                appState.currentUser = userData;
                updateUserMenuDisplay();
            } else {
                localStorage.removeItem('yzUserSession'); // Clear invalid session
            }
        } catch (e) {
            console.error("Error parsing session data:", e);
            localStorage.removeItem('yzUserSession');
        }
    }
}

// --- Job Application & File Handling ---
function validateResumeFile(fileInput, errorElement) {
    if (!fileInput || !errorElement) return false;
    errorElement.textContent = ''; // Clear previous errors

    const file = fileInput.files[0];
    if (!file) {
        errorElement.textContent = 'يرجى اختيار ملف السيرة الذاتية.';
        fileInput.setAttribute('aria-invalid', 'true');
        return false;
    }
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        errorElement.textContent = 'صيغة الملف غير مدعومة. يرجى استخدام PDF, DOC, أو DOCX.';
        fileInput.setAttribute('aria-invalid', 'true');
        return false;
    }
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
        errorElement.textContent = `حجم الملف يتجاوز الحد المسموح به (${maxSizeMB}MB).`;
        fileInput.setAttribute('aria-invalid', 'true');
        return false;
    }
    fileInput.setAttribute('aria-invalid', 'false');
    return true;
}

function handleSpecificJobApplication(event) {
    event.preventDefault();
    const form = event.target;
    if (!validateResumeFile(DOMElements.applyResumeFileInput, DOMElements.applyResumeFileError)) return;

    // Additional form validation for other fields
    if (!form.elements['applyNameInput'].value.trim() || !form.elements['applyEmailInput'].value.trim() ||
        !form.elements['applyPhoneInput'].value.trim() || !form.elements['applyExperienceInput'].value) {
        displayAlert('يرجى ملء جميع الحقول المطلوبة.', 'error');
        return;
    }

    const jobId = DOMElements.applicationJobIdInput.value;
    const job = appState.jobs.find(j => j.id === jobId);
    const applicationData = {
        id: 'APP' + String(Date.now()).slice(-5) + Math.random().toString(36).substr(2, 2),
        applicantName: form.elements['applyNameInput'].value.trim(),
        applicantEmail: form.elements['applyEmailInput'].value.trim(),
        applicantPhone: form.elements['applyPhoneInput'].value.trim(),
        experience: parseInt(form.elements['applyExperienceInput'].value, 10),
        coverLetter: form.elements['applyCoverLetterTextarea'].value.trim(),
        resumeFileName: DOMElements.applyResumeFileInput.files[0].name,
        jobId: jobId,
        jobTitle: job ? job.title : 'N/A',
        dateApplied: new Date().toISOString().split('T')[0],
        status: 'قيد المراجعة'
    };
    appState.applications.push(applicationData);
    // localStorage.setItem('yzMockApplications', JSON.stringify(appState.applications)); 
    displayAlert('تم إرسال طلب التوظيف بنجاح! سيتم التواصل معك قريباً.', 'success');
    closeModal('jobApplicationModalContainer');
    form.reset();
    clearFormErrors(form);
}

function handleGeneralCvSubmission(event) {
    event.preventDefault();
    const form = event.target;
    if (!validateResumeFile(DOMElements.generalApplyResumeFileInput, DOMElements.generalResumeFileError)) return;

    if (!form.elements['generalApplyNameInput'].value.trim() || !form.elements['generalApplyEmailInput'].value.trim() ||
        !form.elements['generalApplyPhoneInput'].value.trim() || !form.elements['generalDesiredFieldSelect'].value ||
        !form.elements['generalApplyExperienceInput'].value) {
        displayAlert('يرجى ملء جميع الحقول المطلوبة.', 'error');
        return;
    }

     const generalApplicationData = {
        id: 'GEN' + String(Date.now()).slice(-5) + Math.random().toString(36).substr(2, 2),
        applicantName: form.elements['generalApplyNameInput'].value.trim(),
        applicantEmail: form.elements['generalApplyEmailInput'].value.trim(),
        applicantPhone: form.elements['generalApplyPhoneInput'].value.trim(),
        desiredField: form.elements['generalDesiredFieldSelect'].value,
        experience: parseInt(form.elements['generalApplyExperienceInput'].value, 10),
        bio: form.elements['generalApplyBioTextarea'].value.trim(),
        resumeFileName: DOMElements.generalApplyResumeFileInput.files[0].name,
        jobId: null, jobTitle: 'تقديم عام', // Indicates a general application
        dateApplied: new Date().toISOString().split('T')[0],
        status: 'تقديم عام محفوظ'
    };
    appState.applications.push(generalApplicationData);
    // localStorage.setItem('yzMockApplications', JSON.stringify(appState.applications));
    displayAlert('تم إرسال سيرتك الذاتية بنجاح! شكراً لاهتمامك.', 'success');
    closeModal('generalApplicationModalContainer');
    form.reset();
    clearFormErrors(form);
}

// --- Chat Functionality ---
function toggleChatWindow(forceState) {
    const isOpen = typeof forceState === 'boolean' ? forceState : !appState.chat.isWindowOpen;
    appState.chat.isWindowOpen = isOpen;
    DOMElements.chatWindowContainer?.classList.toggle('show', isOpen);
    DOMElements.chatWindowContainer?.setAttribute('aria-hidden', (!isOpen).toString());
    DOMElements.chatToggleButton?.setAttribute('aria-expanded', isOpen.toString());

    if (isOpen) {
        if (appState.chat.mode === 'text' && DOMElements.chatInputControl) {
            DOMElements.chatInputControl.focus();
        }
        DOMElements.chatMessagesContainer?.scrollTo(0, DOMElements.chatMessagesContainer.scrollHeight);
    } else {
        // Stop voice recognition if window is closed
        if (appState.chat.isVoiceListening && speechRecognitionInstance) {
            speechRecognitionInstance.stop();
        }
    }
}

function selectChatMode(mode) {
    if (!DOMElements.chatInputControl || !DOMElements.voiceRecognitionBtn || !DOMElements.sendChatMessageBtn ||
        !DOMElements.chatModeTextBtn || !DOMElements.chatModeVoiceBtn) return;

    appState.chat.mode = mode;
    const isTextMode = mode === 'text';

    DOMElements.chatInputControl.style.display = isTextMode ? 'block' : 'none';
    DOMElements.sendChatMessageBtn.style.display = isTextMode ? 'flex' : 'none';
    DOMElements.voiceRecognitionBtn.style.display = !isTextMode ? 'flex' : 'none';
    
    DOMElements.chatModeTextBtn.classList.toggle('active', isTextMode);
    DOMElements.chatModeVoiceBtn.classList.toggle('active', !isTextMode);
    DOMElements.chatModeTextBtn.setAttribute('aria-pressed', isTextMode.toString());
    DOMElements.chatModeVoiceBtn.setAttribute('aria-pressed', (!isTextMode).toString());

    if (appState.chat.isVoiceListening && speechRecognitionInstance) {
        speechRecognitionInstance.stop(); // Stop listening if switching modes
    }
    if (isTextMode) DOMElements.chatInputControl.focus();
}

function handleChatInputKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendUserChatMessage();
    }
}

function sendUserChatMessage() {
    if (!DOMElements.chatInputControl) return;
    const messageText = DOMElements.chatInputControl.value.trim();
    if (!messageText) return;
    
    appendChatMessage(messageText, 'user');
    appState.chat.messages.push({ sender: 'user', text: messageText, timestamp: new Date() });
    DOMElements.chatInputControl.value = '';
    DOMElements.chatInputControl.focus();
    
    processUserMessageWithAI(messageText);
}

function appendChatMessage(text, sender, isLoading = false) {
    if (!DOMElements.chatMessagesContainer) return null;

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    if (isLoading) {
        messageElement.classList.add('loading-dots');
        messageElement.setAttribute('aria-label', 'المساعد يكتب الآن');
        messageElement.innerHTML = `<span></span><span></span><span></span>`; // Simpler spans
    } else {
        messageElement.textContent = escapeHTML(text); // Sanitize text before rendering
    }
    DOMElements.chatMessagesContainer.appendChild(messageElement);
    // Scroll to the bottom of the chat messages
    DOMElements.chatMessagesContainer.scrollTop = DOMElements.chatMessagesContainer.scrollHeight;
    return messageElement;
}

async function processUserMessageWithAI(userMessage) {
    if (appState.chat.aiIsTyping) return; // Prevent multiple simultaneous requests

    if (GEMINI_API_KEY_FOR_CHATBOT === "YOUR_GEMINI_API_KEY_PLACEHOLDER" || !GEMINI_API_KEY_FOR_CHATBOT) {
        const mockResponses = [
            "أنا هنا للمساعدة! ما الذي يمكنني أن أفعله لك بخصوص التوظيف في ميس؟",
            `الوظائف المتاحة حاليًا هي: ${appState.jobs.map(j => j.title).join('، ')}. هل تود معرفة المزيد عن وظيفة معينة؟`,
            "ثقافة العمل في ميس ترتكز على الابتكار، التعاون، ورعاية الموظفين والمرضى.",
            "يمكنك التقديم على الوظائف من خلال قسم 'الوظائف' أو تقديم سيرتك الذاتية بشكل عام عبر الزر المخصص.",
            "عذرًا، لا أستطيع الإجابة على هذا السؤال. يمكنني المساعدة في الاستفسارات المتعلقة بالتوظيف في ميس."
        ];
        // Simple mock logic:
        let responseText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        if (userMessage.toLowerCase().includes("راتب") || userMessage.toLowerCase().includes("راتب")) {
            responseText = "لا يمكنني تقديم معلومات عن الرواتب في الوقت الحالي. يتم تحديدها بناءً على الخبرة والمقابلة.";
        } else if (userMessage.toLowerCase().includes("تقديم")) {
             responseText = "يمكنك التقديم على وظيفة معينة من خلال صفحة الوظائف، أو تقديم سيرتك الذاتية بشكل عام بالضغط على زر 'قدم سيرتك الذاتية' في قسم الوظائف.";
        }

        setTimeout(() => {
            appendChatMessage(responseText, 'bot');
            appState.chat.messages.push({ sender: 'bot', text: responseText, timestamp: new Date() });
        }, 800);
        return;
    }

    appState.chat.aiIsTyping = true;
    const loadingElement = appendChatMessage('', 'bot', true);

    try {
        const jobTitles = appState.jobs.map(j => j.title).join('؛ ') || "لا توجد وظائف معلنة حاليًا";
        const companyCultureKeywords = "الرعاية، الابتكار المستدام، التعاون المثمر، السعي للتميز، النمو المهني، النزاهة والشفافية";
        
        // Refined prompt for Gemini
        const prompt = `أنت "مساعد ميس الذكي"، وكيل محادثة ودود ومحترف تابع لقسم الموارد البشرية في شركة "ميس للمنتجات الطبية".
مهمتك الأساسية هي مساعدة المستخدمين في استفساراتهم المتعلقة بالتوظيف، فرص العمل، ثقافة الشركة، وعملية التقديم في ميس.
يجب أن تكون ردودك دائماً باللغة العربية الفصحى، مهذبة، وموجزة قدر الإمكان.
معلومات أساسية عن الشركة: "ميس للمنتجات الطبية" هي شركة رائدة في مجال المنتجات الطبية وتسعى لتوظيف أفضل الكفاءات.
الوظائف المتاحة حاليًا هي: ${jobTitles}.
إذا سئلت عن ثقافة الشركة، يمكنك ذكر بعض من هذه الكلمات المفتاحية: ${companyCultureKeywords}.
إذا سئلت عن كيفية التقديم، وجه المستخدم إلى استكشاف قسم "الوظائف" في الصفحة، أو استخدام زر "قدم سيرتك الذاتية" لتقديم عام.
لا تقدم معلومات عن الرواتب أو تفاصيل تعاقدية محددة، بل اذكر أن هذه الأمور تناقش خلال مراحل متقدمة من عملية التوظيف.
إذا كان السؤال خارج نطاق الموارد البشرية والتوظيف (مثل أسعار المنتجات، الدعم الفني للمنتجات، إلخ)، اعتذر بلطف واقترح على المستخدم التواصل مع القسم المختص عبر معلومات الاتصال الموجودة في صفحة "تواصل معنا" أو زيارة الموقع الرسمي للشركة لمزيد من المعلومات العامة.
تجنب إعطاء نصائح طبية أو معلومات عن المنتجات نفسها. ركز على التوظيف.
تاريخ المحادثة حتى الآن (آخر رسالة هي الأحدث):
${appState.chat.messages.slice(-5).map(m => `${m.sender === 'user' ? 'المستخدم' : 'المساعد'}: ${m.text}`).join('\n')}

رسالة المستخدم الجديدة: "${userMessage}"
ردك كمساعد ميس الذكي:`;

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
                temperature: 0.7, // Slightly more creative but still factual
                topP: 0.95, 
                topK: 40, 
                maxOutputTokens: 350 // Allow for slightly longer, more detailed responses if needed
            },
            // Safety settings (optional, adjust as needed)
            // safetySettings: [
            //     { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            //     { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            //     // etc.
            // ]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY_FOR_CHATBOT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        loadingElement?.remove(); // Remove loading indicator

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try to parse error
            console.error("Gemini API Error:", response.status, response.statusText, errorData);
            appendChatMessage('عذرًا، أواجه بعض الصعوبات التقنية في الوقت الحالي. يرجى المحاولة لاحقًا أو التواصل معنا مباشرة.', 'bot');
            appState.chat.messages.push({ sender: 'bot', text: 'API Error', timestamp: new Date() });
            appState.chat.aiIsTyping = false;
            return;
        }

        const data = await response.json();
        let botResponseText = 'عذرًا، لم أتمكن من فهم طلبك. هل يمكنك إعادة صياغته؟'; // Default fallback

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            botResponseText = data.candidates[0].content.parts[0].text.trim();
        } else if (data.promptFeedback?.blockReason) {
            console.warn("Gemini content blocked:", data.promptFeedback.blockReason, data.promptFeedback.safetyRatings);
            botResponseText = 'عذرًا، لا يمكنني معالجة هذا الطلب حاليًا بسبب سياسات المحتوى.';
        }
        
        appendChatMessage(botResponseText, 'bot');
        appState.chat.messages.push({ sender: 'bot', text: botResponseText, timestamp: new Date() });

    } catch (error) {
        console.error("Chat AI Processing Error:", error);
        loadingElement?.remove();
        appendChatMessage('حدث خطأ غير متوقع أثناء محاولة الرد. يرجى المحاولة مرة أخرى.', 'bot');
        appState.chat.messages.push({ sender: 'bot', text: 'Client-side Error', timestamp: new Date() });
    } finally {
        appState.chat.aiIsTyping = false;
    }
}


function initializeSpeechRecognitionAPI() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI && DOMElements.chatModeVoiceBtn && DOMElements.voiceRecognitionBtn) {
        speechRecognitionInstance = new SpeechRecognitionAPI();
        speechRecognitionInstance.lang = 'ar-SA'; // Arabic - Saudi Arabia
        speechRecognitionInstance.continuous = false; // Stop after first recognition
        speechRecognitionInstance.interimResults = false; // We only want final results

        speechRecognitionInstance.onresult = function(event) {
            const transcript = event.results[0][0].transcript.trim();
            if (transcript) {
                appendChatMessage(transcript, 'user');
                appState.chat.messages.push({ sender: 'user', text: transcript, timestamp: new Date() });
                processUserMessageWithAI(transcript);
            }
        };
        speechRecognitionInstance.onerror = function(event) {
            console.error("Speech Recognition Error:", event.error, event.message);
            let errorMsg = 'حدث خطأ أثناء محاولة التعرف على الصوت.';
            if (event.error === 'no-speech') errorMsg = 'لم يتم اكتشاف أي كلام. يرجى المحاولة مرة أخرى.';
            else if (event.error === 'audio-capture') errorMsg = 'حدثت مشكلة في التقاط الصوت من الميكروفون.';
            else if (event.error === 'not-allowed') errorMsg = 'تم رفض الإذن باستخدام الميكروفون. يرجى التحقق من إعدادات المتصفح.';
            appendChatMessage(errorMsg, 'bot');
            appState.chat.messages.push({ sender: 'bot', text: errorMsg, timestamp: new Date() });
        };
        speechRecognitionInstance.onstart = function() { 
            appState.chat.isVoiceListening = true; 
            updateVoiceRecognitionButtonUI(); 
        };
        speechRecognitionInstance.onend = function() { 
            appState.chat.isVoiceListening = false; 
            updateVoiceRecognitionButtonUI(); 
        };
    } else {
        console.warn("Speech Recognition API not supported or required DOM elements missing.");
        if (DOMElements.chatModeVoiceBtn) {
            DOMElements.chatModeVoiceBtn.disabled = true;
            DOMElements.chatModeVoiceBtn.title = "خاصية التعرف على الصوت غير مدعومة في هذا المتصفح.";
        }
        if (DOMElements.voiceRecognitionBtn) DOMElements.voiceRecognitionBtn.style.display = 'none';
    }
}

function toggleVoiceRecognition() {
    if (!speechRecognitionInstance) { 
        appendChatMessage('عذرًا، خاصية التعرف على الصوت غير مدعومة حاليًا.', 'bot'); 
        return; 
    }
    if (appState.chat.isVoiceListening) {
        speechRecognitionInstance.stop();
    } else {
        try { 
            speechRecognitionInstance.start(); 
        } catch (e) { 
            console.error("Error starting speech recognition:", e);
            appendChatMessage('لم أتمكن من بدء التعرف على الصوت. يرجى التأكد من أن الميكروفون متاح ويعمل.', 'bot');
            appState.chat.isVoiceListening = false; 
            updateVoiceRecognitionButtonUI();
        }
    }
}

function updateVoiceRecognitionButtonUI() {
    const voiceBtn = DOMElements.voiceRecognitionBtn;
    if (!voiceBtn) return;

    if (appState.chat.isVoiceListening) {
        voiceBtn.innerHTML = '<i class="fas fa-stop-circle"></i>';
        voiceBtn.classList.add('listening');
        voiceBtn.setAttribute('aria-label', 'إيقاف التسجيل الصوتي');
        voiceBtn.setAttribute('aria-pressed', 'true');
    } else {
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.classList.remove('listening');
        voiceBtn.setAttribute('aria-label', 'بدء التسجيل الصوتي');
        voiceBtn.setAttribute('aria-pressed', 'false');
    }
}

// --- Utility Functions ---
function displayAlert(message, type = 'success', duration = 4600) {
    if (!DOMElements.globalAlertContainer) {
        console.error("Global alert container not found.");
        return;
    }
    // Clear any existing timeout for alerts to prevent premature removal if multiple alerts are shown quickly
    if (appState.ui.alertTimeoutId) {
        clearTimeout(appState.ui.alertTimeoutId);
    }

    const alertElement = document.createElement('div');
    alertElement.className = `message-alert ${type}`; // Base classes
    alertElement.setAttribute('role', type === 'error' ? 'alert' : 'status'); // Appropriate ARIA role

    const icon = document.createElement('i');
    const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-times-circle' : 'fa-info-circle');
    icon.className = `fas ${iconClass}`;
    icon.setAttribute('aria-hidden', 'true'); // Icon is decorative

    alertElement.appendChild(icon);
    alertElement.appendChild(document.createTextNode(" " + message)); // Add message text

    DOMElements.globalAlertContainer.prepend(alertElement); // Add new alert at the top

    // Trigger animation
    requestAnimationFrame(() => { // Ensures class is added after element is in DOM for animation
        alertElement.classList.add('slide-in');
    });

    // Set timeout to remove the alert
    appState.ui.alertTimeoutId = setTimeout(() => {
        alertElement.classList.remove('slide-in'); // Prepare for fade out
        alertElement.classList.add('fade-out');
        // Wait for fade-out animation to complete before removing from DOM
        alertElement.addEventListener('animationend', () => {
            if (alertElement.parentElement) { // Check if still part of DOM
                alertElement.remove();
            }
        }, { once: true }); // Listener executes only once
    }, duration - 400); // Start fade-out slightly before full duration
}

function escapeHTML(str) {
    if (typeof str !== 'string') return str; // Return non-strings as is
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function clearFormErrors(formElement) {
    if (!formElement) return;
    const errorMessages = formElement.querySelectorAll('.form-error-message');
    errorMessages.forEach(msg => msg.textContent = '');
    const invalidInputs = formElement.querySelectorAll('[aria-invalid="true"]');
    invalidInputs.forEach(input => input.setAttribute('aria-invalid', 'false'));
}

// Debounce function (example, not used in current setup but good utility)
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
