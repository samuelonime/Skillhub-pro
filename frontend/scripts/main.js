// ===== SKILLHUB DASHBOARD - MAIN JAVASCRIPT =====
// Professional dashboard functionality with modern ES6+ features

class SkillHubDashboard {
    constructor() {
        // Initialize dashboard when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => this.init());
        
        // Global state
        this.state = {
            user: null,
            notifications: [],
            activeSection: 'dashboard',
            isLoading: false,
            isMobileMenuOpen: false
        };
        
        // Cache DOM elements
        this.elements = {};
        
        // Initialize event handlers
        this.initEventHandlers();
        
        // API endpoints (replace with actual backend URLs)
        this.API_ENDPOINTS = {
            dashboard: '/api/dashboard',
            notifications: '/api/notifications',
            courses: '/api/courses/recommended',
            jobs: '/api/jobs/matches',
            certificates: '/api/certificates',
            uploadCertificate: '/api/certificates/upload',
            connectPlatform: '/api/platforms/connect',
            userProfile: '/api/user/profile',
            markNotificationRead: '/api/notifications/read'
        };
    }
    
    // ===== INITIALIZATION =====
    init() {
        console.log('🚀 SkillHub Dashboard Initializing...');
        
        this.cacheElements();
        this.setCurrentDate();
        this.loadUserData();
        this.loadDashboardData();
        this.setupEventListeners();
        this.setupTooltips();
        this.setupAnimations();
        
        // Initialize charts if needed
        this.initCharts();
        
        // Show welcome toast
        setTimeout(() => {
            this.showToast('Welcome back to SkillHub!', 'success');
        }, 1000);
    }
    
    cacheElements() {
        // Navigation
        this.elements.navMenu = document.querySelector('.nav-menu');
        this.elements.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        this.elements.navLinks = document.querySelectorAll('.nav-link');
        this.elements.notificationBtn = document.querySelector('.notification-btn');
        this.elements.notificationMenu = document.querySelector('.notification-menu');
        this.elements.profileDropdown = document.querySelector('.profile-dropdown');
        this.elements.profileMenu = document.querySelector('.profile-menu');
        
        // Main content sections
        this.elements.dashboardContent = document.querySelector('.dashboard-content');
        this.elements.currentDate = document.getElementById('current-date');
        this.elements.statsOverview = document.querySelector('.stats-overview');
        this.elements.coursesGrid = document.querySelector('.courses-grid');
        this.elements.jobsList = document.querySelector('.jobs-list');
        this.elements.certificatesList = document.querySelector('.certificates-list');
        this.elements.deadlinesList = document.querySelector('.deadlines-list');
        this.elements.skillsProgress = document.querySelector('.skills-progress');
        this.elements.platformsGrid = document.querySelector('.platforms-grid');
        
        // Buttons and actions
        this.elements.quickActions = document.querySelectorAll('.quick-action');
        this.elements.courseEnrollBtns = document.querySelectorAll('.btn-primary:has(i.fa-paper-plane)');
        this.elements.jobApplyBtns = document.querySelectorAll('.btn-primary:has(i.fa-paper-plane)');
        this.elements.uploadCertificateBtn = document.getElementById('upload-certificate-btn');
        this.elements.connectPlatformBtn = document.getElementById('connect-platform-btn');
        this.elements.refreshActivityBtn = document.getElementById('refresh-activity');
        this.elements.quickGoalBtn = document.getElementById('quick-goal');
        
        // Modals
        this.elements.certificateModal = document.getElementById('certificateModal');
        this.elements.platformModal = document.getElementById('platformModal');
        
        // Toast container
        this.elements.toastContainer = document.querySelector('.toast-container');
    }
    
    // ===== EVENT HANDLERS =====
    initEventHandlers() {
        // Navigation
        document.addEventListener('click', (e) => this.handleDocumentClick(e));
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Custom event for section changes
        document.addEventListener('sectionChanged', (e) => {
            this.handleSectionChange(e.detail.section);
        });
    }
    
    setupEventListeners() {
        // Mobile menu toggle
        if (this.elements.mobileMenuBtn) {
            this.elements.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Navigation links
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Notification dropdown
        if (this.elements.notificationBtn) {
            this.elements.notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotificationMenu();
            });
        }
        
        // Profile dropdown
        if (this.elements.profileDropdown) {
            this.elements.profileDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleProfileMenu();
            });
        }
        
        // Mark all notifications as read
        const markAllReadBtn = document.querySelector('.mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => this.markAllNotificationsRead());
        }
        
        // Quick actions
        this.elements.quickActions.forEach(action => {
            action.addEventListener('click', () => this.handleQuickAction(action.dataset.action));
        });
        
        // Course enrollment
        this.elements.courseEnrollBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCourseEnrollment(e));
        });
        
        // Job applications
        this.elements.jobApplyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleJobApplication(e));
        });
        
        // Certificate upload
        if (this.elements.uploadCertificateBtn) {
            this.elements.uploadCertificateBtn.addEventListener('click', () => this.openCertificateModal());
        }
        
        // Platform connection
        if (this.elements.connectPlatformBtn) {
            this.elements.connectPlatformBtn.addEventListener('click', () => this.openPlatformModal());
        }
        
        // Refresh activity
        if (this.elements.refreshActivityBtn) {
            this.elements.refreshActivityBtn.addEventListener('click', () => this.refreshActivity());
        }
        
        // Set quick goal
        if (this.elements.quickGoalBtn) {
            this.elements.quickGoalBtn.addEventListener('click', () => this.setDailyGoal());
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
    }
    
    // ===== CORE FUNCTIONALITY =====
    
    handleDocumentClick(e) {
        // Close dropdowns when clicking outside
        if (!e.target.closest('.dropdown')) {
            this.closeAllDropdowns();
        }
        
        // Close mobile menu when clicking outside
        if (this.state.isMobileMenuOpen && !e.target.closest('.nav-menu') && 
            !e.target.closest('.mobile-menu-btn')) {
            this.closeMobileMenu();
        }
    }
    
    handleNavClick(e) {
        e.preventDefault();
        
        const link = e.currentTarget;
        const section = link.dataset.section;
        
        // Update active state
        this.elements.navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Update state
        this.state.activeSection = section;
        
        // Dispatch custom event
        const event = new CustomEvent('sectionChanged', {
            detail: { section }
        });
        document.dispatchEvent(event);
        
        // Load section content
        this.loadSectionContent(section);
        
        // Close mobile menu on mobile
        if (window.innerWidth < 768) {
            this.closeMobileMenu();
        }
    }
        handleSectionChange(section) {
        console.log(`Loading section: ${section}`);
        
        // Update page title
        document.title = `${section.charAt(0).toUpperCase() + section.slice(1)} | SkillHub`;
        
        // Show loading state
        this.showLoading();
        
        // Simulate API call
        setTimeout(() => {
            // Update welcome message based on section
            const welcomeHeader = document.querySelector('.header-content h1');
            const welcomeSubtitle = document.querySelector('.subtitle');
            
            switch(section) {
                case 'dashboard':
                    welcomeHeader.textContent = 'Welcome back, John! 👋';
                    welcomeSubtitle.textContent = 'You\'re making great progress on your Full Stack Developer path. Keep going!';
                    break;
                case 'learning':
                    welcomeHeader.textContent = 'Learning Hub 📚';
                    welcomeSubtitle.textContent = 'Track your progress across all learning platforms';
                    break;
                case 'portfolio':
                    welcomeHeader.textContent = 'Your Portfolio 🎨';
                    welcomeSubtitle.textContent = 'Showcase your skills and projects to employers';
                    break;
                case 'jobs':
                    welcomeHeader.textContent = 'Job Opportunities 💼';
                    welcomeSubtitle.textContent = 'Find your next career move based on your skills';
                    break;
                case 'tests':
                    welcomeHeader.textContent = 'Skill Assessments 🧠';
                    welcomeSubtitle.textContent = 'Test your knowledge and earn badges';
                    break;
                case 'rewards':
                    welcomeHeader.textContent = 'Rewards & Achievements 🏆';
                    welcomeSubtitle.textContent = 'Track your progress and redeem rewards';
                    break;
            }
            
            this.hideLoading();
            this.showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} section loaded`, 'success');
        }, 500);
    }
    
    async handleCourseEnrollment(e) {
        const btn = e.currentTarget;
        const courseCard = btn.closest('.course-card');
        const courseTitle = courseCard.querySelector('.course-title').textContent;
        
        if (btn.classList.contains('btn-loading')) return;
        
        btn.classList.add('btn-loading');
        
        try {
            // Simulate API call
            await this.simulateAPICall(1000);
            
            btn.classList.remove('btn-loading');
            btn.innerHTML = '<i class="fas fa-check"></i> Enrolled';
            btn.disabled = true;
            
            this.showToast(`Successfully enrolled in "${courseTitle}"`, 'success');
            
            // Update user's course count
            this.updateCourseCount(1);
            
        } catch (error) {
            btn.classList.remove('btn-loading');
            this.showToast('Failed to enroll. Please try again.', 'error');
        }
    }
    
    async handleJobApplication(e) {
        const btn = e.currentTarget;
        const jobCard = btn.closest('.job-card');
        const jobTitle = jobCard.querySelector('.job-title h3').textContent;
        const company = jobCard.querySelector('.job-company span').textContent;
        
        if (btn.classList.contains('btn-loading')) return;
        
        // Confirm application
        const confirmed = await this.showConfirmation(
            'Confirm Application',
            `Apply for "${jobTitle}" at ${company}?`
        );
        
        if (!confirmed) return;
        
        btn.classList.add('btn-loading');
        
        try {
            // Simulate API call
            await this.simulateAPICall(1500);
            
            btn.classList.remove('btn-loading');
            btn.innerHTML = '<i class="fas fa-check"></i> Applied';
            btn.disabled = true;
            
            this.showToast(`Application submitted for ${jobTitle}`, 'success');
            
            // Update applications count
            this.updateApplicationsCount(1);
            
            // Log activity
            this.logActivity({
                type: 'job_application',
                title: 'Job Application Submitted',
                description: `Applied for ${jobTitle} at ${company}`,
                time: 'Just now'
            });
            
        } catch (error) {
            btn.classList.remove('btn-loading');
            this.showToast('Failed to submit application', 'error');
        }
    }
    
    handleQuickAction(action) {
        switch(action) {
            case 'upload-certificate':
                this.openCertificateModal();
                break;
            case 'update-resume':
                this.updateResume();
                break;
            case 'add-project':
                this.addProject();
                break;
            case 'find-mentor':
                this.findMentor();
                break;
        }
    }

    
    
    // ===== MODAL MANAGEMENT =====
    
    openCertificateModal() {
        this.elements.certificateModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Load modal content
        this.loadCertificateModalContent();
    }
    
    openPlatformModal() {
        this.elements.platformModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Load modal content
        this.loadPlatformModalContent();
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = 'auto';
    }
    
    loadCertificateModalContent() {
        const modalBody = this.elements.certificateModal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="form-group">
                <label class="form-label" for="certificateName">Certificate Name</label>
                <input type="text" id="certificateName" class="form-control" 
                       placeholder="e.g., React Developer Certification" autofocus>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="certificateProvider">Provider</label>
                <select id="certificateProvider" class="form-control">
                    <option value="">Select Provider</option>
                    <option value="udemy">Udemy</option>
                    <option value="coursera">Coursera</option>
                    <option value="linkedin">LinkedIn Learning</option>
                    <option value="freecodecamp">FreeCodeCamp</option>
                    <option value="aws">AWS</option>
                    <option value="google">Google</option>
                    <option value="other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="completionDate">Completion Date</label>
                <input type="date" id="completionDate" class="form-control" 
                       value="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Certificate File</label>
                <div class="file-upload" id="certificateDropzone">
                    <div class="file-upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="file-upload-text">
                        Drag & drop your certificate here
                    </div>
                    <div class="file-upload-hint">
                        or click to browse files
                    </div>
                    <div class="file-upload-hint">
                        Supports: PDF, PNG, JPG (Max 10MB)
                    </div>
                    <input type="file" id="certificateFile" class="file-input" 
                           accept=".pdf,.png,.jpg,.jpeg">
                </div>
                <div id="selectedFile" class="mt-2" style="display: none;"></div>
            </div>
            
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">Verification Process</div>
                    <div class="alert-description">
                        Your certificate will be verified within 24-48 hours. 
                        Once verified, it will appear on your profile and help improve job matches.
                    </div>
                </div>
            </div>
        `;
        
        // Setup file upload
        this.setupFileUpload();
        
        // Setup form submission
        const submitBtn = this.elements.certificateModal.querySelector('[data-action="submit"]');
        submitBtn.addEventListener('click', () => this.submitCertificate());
    }
    
    loadPlatformModalContent() {
        const modalBody = this.elements.platformModal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="platforms-connection">
                <div class="platform-option">
                    <div class="platform-logo">
                        <i class="fab fa-udemy fa-2x"></i>
                    </div>
                    <div class="platform-details">
                        <h4>Udemy</h4>
                        <p>Connect your Udemy account to import completed courses and certificates.</p>
                        <small class="text-muted">Requires OAuth authentication</small>
                    </div>
                    <button class="btn btn-primary connect-btn" data-platform="udemy">
                        Connect
                    </button>
                </div>
                
                <div class="platform-option">
                    <div class="platform-logo">
                        <i class="fab fa-coursera fa-2x"></i>
                    </div>
                    <div class="platform-details">
                        <h4>Coursera</h4>
                        <p>Connect your Coursera account to import your learning progress.</p>
                        <small class="text-muted">Requires OAuth authentication</small>
                    </div>
                    <button class="btn btn-primary connect-btn" data-platform="coursera">
                        Connect
                    </button>
                </div>
                
                <div class="platform-option">
                    <div class="platform-logo">
                        <i class="fab fa-linkedin fa-2x"></i>
                    </div>
                    <div class="platform-details">
                        <h4>LinkedIn Learning</h4>
                        <p>Import your LinkedIn Learning certificates and course completions.</p>
                    </div>
                    <button class="btn btn-primary connect-btn" data-platform="linkedin">
                        Connect
                    </button>
                </div>
                
                <div class="platform-option">
                    <div class="platform-logo">
                        <i class="fab fa-github fa-2x"></i>
                    </div>
                    <div class="platform-details">
                        <h4>GitHub</h4>
                        <p>Connect your GitHub to showcase your projects and contributions.</p>
                    </div>
                    <button class="btn btn-primary connect-btn" data-platform="github">
                        Connect
                    </button>
                </div>
            </div>
        `;
        
        // Setup platform connection buttons
        modalBody.querySelectorAll('.connect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.connectPlatform(e.target.dataset.platform));
        });
    }
    
    async submitCertificate() {
        const name = document.getElementById('certificateName').value;
        const provider = document.getElementById('certificateProvider').value;
        const file = document.getElementById('certificateFile').files[0];
        
        if (!name || !provider || !file) {
            this.showToast('Please fill all fields and select a file', 'warning');
            return;
        }
        
        const submitBtn = this.elements.certificateModal.querySelector('[data-action="submit"]');
        submitBtn.classList.add('btn-loading');
        
        try {
            // Simulate file upload
            await this.simulateAPICall(2000);
            
            submitBtn.classList.remove('btn-loading');
            this.closeAllModals();
            
            this.showToast('Certificate uploaded successfully! Verification in progress.', 'success');
            
            // Add to certificates list
            this.addCertificateToList({
                name,
                provider,
                date: new Date().toISOString().split('T')[0],
                status: 'pending'
            });
            
            // Update certificates count
            this.updateCertificatesCount(1);
            
            // Log activity
            this.logActivity({
                type: 'certificate_upload',
                title: 'Certificate Uploaded',
                description: `Uploaded ${name} from ${provider}`,
                time: 'Just now'
            });
            
        } catch (error) {
            submitBtn.classList.remove('btn-loading');
            this.showToast('Failed to upload certificate', 'error');
        }
    }
    
    async connectPlatform(platform) {
        const platformNames = {
            udemy: 'Udemy',
            coursera: 'Coursera',
            linkedin: 'LinkedIn Learning',
            github: 'GitHub'
        };
        
        this.showToast(`Connecting to ${platformNames[platform]}...`, 'info');
        
        // Simulate OAuth flow
        setTimeout(() => {
            this.showToast(`Successfully connected to ${platformNames[platform]}!`, 'success');
            
            // Update platform status
            this.updatePlatformStatus(platform, 'connected');
            
            // Log activity
            this.logActivity({
                type: 'platform_connection',
                title: 'Platform Connected',
                description: `Connected ${platformNames[platform]} account`,
                time: 'Just now'
            });
            
            this.closeAllModals();
        }, 1500);
    }

    
    
    // ===== DROPDOWN MANAGEMENT =====
    
    toggleMobileMenu() {
        this.state.isMobileMenuOpen = !this.state.isMobileMenuOpen;
        
        if (this.state.isMobileMenuOpen) {
            this.elements.navMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            this.closeMobileMenu();
        }
    }
    
    closeMobileMenu() {
        this.state.isMobileMenuOpen = false;
        this.elements.navMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    toggleNotificationMenu() {
        const isOpen = this.elements.notificationMenu.classList.contains('show');
        
        this.closeAllDropdowns();
        
        if (!isOpen) {
            this.elements.notificationMenu.classList.add('show');
        }
    }
    
    toggleProfileMenu() {
        const isOpen = this.elements.profileMenu.classList.contains('show');
        
        this.closeAllDropdowns();
        
        if (!isOpen) {
            this.elements.profileMenu.classList.add('show');
        }
    }
    
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
    
    // ===== DATA MANAGEMENT =====
    
    async loadUserData() {
        try {
            // Simulate API call
            const userData = await this.simulateAPICall(800, {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@example.com',
                title: 'Full Stack Developer',
                avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=4f46e5&color=fff',
                profileCompletion: 75,
                portfolioScore: 8.5,
                meritCoins: 1250
            });
            
            this.state.user = userData;
            this.updateUserProfile(userData);
            
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }
    
    async loadDashboardData() {
        this.showLoading();
        
        try {
            // Simulate loading multiple data sources
            const [stats, courses, jobs, certificates, activity] = await Promise.all([
                this.simulateAPICall(300, {
                    coursesCompleted: 12,
                    certificatesEarned: 8,
                    jobMatches: 15,
                    portfolioScore: 8.5
                }),
                this.simulateAPICall(400, [
                    {
                        id: 1,
                        title: 'Advanced React Patterns',
                        provider: 'Udemy',
                        duration: '12 hours',
                        level: 'Advanced',
                        tags: ['React', 'TypeScript', 'Hooks']
                    },
                    {
                        id: 2,
                        title: 'Node.js Backend Development',
                        provider: 'Coursera',
                        duration: '24 hours',
                        level: 'Intermediate',
                        tags: ['Node.js', 'Express', 'MongoDB']
                    }
                ]),
                this.simulateAPICall(400, [
                    {
                        id: 1,
                        title: 'Frontend Developer',
                        company: 'TechCorp Inc.',
                        location: 'Remote',
                        salary: '$85k - $110k',
                        type: 'Full-time',
                        match: 92,
                        skills: ['React', 'TypeScript', 'CSS', 'UI/UX']
                    },
                    {
                        id: 2,
                        title: 'Full Stack Developer',
                        company: 'StartupXYZ',
                        location: 'New York, NY',
                        salary: '$95k - $120k',
                        type: 'Full-time',
                        match: 88,
                        skills: ['JavaScript', 'Node.js', 'React', 'MongoDB']
                    }
                ]),
                this.simulateAPICall(300, [
                    {
                        id: 1,
                        name: 'React Developer Certification',
                        provider: 'Udemy',
                        date: 'Mar 15, 2024',
                        status: 'verified'
                    },
                    {
                        id: 2,
                        name: 'JavaScript Algorithms',
                        provider: 'FreeCodeCamp',
                        date: 'Feb 28, 2024',
                        status: 'verified'
                    },
                    {
                        id: 3,
                        name: 'Node.js Backend Course',
                        provider: 'Coursera',
                        date: 'Apr 2, 2024',
                        status: 'pending'
                    }
                ]),
                this.simulateAPICall(200, [
                    {
                        id: 1,
                        type: 'certificate_verified',
                        title: 'Certificate Verified',
                        description: 'React Developer Certification from Udemy has been verified',
                        time: '2 hours ago'
                    },
                    {
                        id: 2,
                        type: 'job_application',
                        title: 'Job Application Submitted',
                        description: 'Applied for Frontend Developer position at TechCorp (92% match)',
                        time: '1 day ago'
                    }
                ])
            ]);
            
            // Update dashboard with loaded data
            this.updateDashboardStats(stats);
            this.updateRecommendedCourses(courses);
            this.updateJobMatches(jobs);
            this.updateCertificates(certificates);
            this.updateActivityFeed(activity);
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showToast('Failed to load dashboard data', 'error');
            this.hideLoading();
        }
    }
    
    loadSectionContent(section) {
        // This would make actual API calls based on the section
        console.log(`Loading content for section: ${section}`);
        
        // For now, simulate loading
        this.showLoading();
        
        setTimeout(() => {
            // Update content based on section
            switch(section) {
                case 'learning':
                    // Load learning hub content
                    break;
                case 'portfolio':
                    // Load portfolio content
                    break;
                case 'jobs':
                    // Load jobs content
                    break;
                // ... other sections
            }
            
            this.hideLoading();
        }, 500);
    }
    
    // ===== UI UPDATES =====
    
    updateUserProfile(user) {
        // Update profile info in navigation
        const profileName = document.querySelector('.profile-name');
        const profileTitle = document.querySelector('.profile-title');
        const profileAvatar = document.querySelector('.profile-avatar');
        
        if (profileName) profileName.textContent = user.name;
        if (profileTitle) profileTitle.textContent = user.title;
        if (profileAvatar) profileAvatar.src = user.avatar;
        
        // Update sidebar stats
        this.updateSidebarStats(user);
    }
    
    updateSidebarStats(user) {
        // Update profile completion
        const progressBar = document.querySelector('.stat-progress .progress-bar');
        if (progressBar) {
            progressBar.style.width = `${user.profileCompletion}%`;
        }
        
        // Update progress value
        const progressValue = document.querySelector('.stat-value');
        if (progressValue) {
            progressValue.textContent = `${user.profileCompletion}%`;
        }
        
        // Update portfolio score circle
        const scoreCircle = document.querySelector('.score-circle');
        if (scoreCircle) {
            scoreCircle.dataset.score = user.portfolioScore;
            const scoreFill = scoreCircle.querySelector('.score-fill');
            const offset = 169.56 - (169.56 * user.portfolioScore) / 10;
            scoreFill.style.strokeDashoffset = offset;
            scoreCircle.querySelector('span').textContent = user.portfolioScore;
        }
        
        // Update coins
        const coinsAmount = document.querySelector('.coins-amount');
        if (coinsAmount) {
            coinsAmount.textContent = user.meritCoins.toLocaleString();
        }
    }
    
    updateDashboardStats(stats) {
        // Animate counting up for stats
        const statValues = document.querySelectorAll('.stat-value');
        
        statValues.forEach((element, index) => {
            const target = Object.values(stats)[index];
            this.animateCount(element, target, index === 3 ? 1 : 0);
        });
    }
    
    updateRecommendedCourses(courses) {
        if (!this.elements.coursesGrid) return;
        
        // Clear existing courses
        this.elements.coursesGrid.innerHTML = '';
        
        // Add new courses
        courses.forEach(course => {
            const courseCard = this.createCourseCard(course);
            this.elements.coursesGrid.appendChild(courseCard);
        });
        
        // Reattach event listeners
        this.attachCourseEventListeners();
    }
    
    updateJobMatches(jobs) {
        if (!this.elements.jobsList) return;
        
        // Clear existing jobs
        this.elements.jobsList.innerHTML = '';
        
        // Add new jobs
        jobs.forEach(job => {
            const jobCard = this.createJobCard(job);
            this.elements.jobsList.appendChild(jobCard);
        });
        
        // Reattach event listeners
        this.attachJobEventListeners();
    }
    
    updateCertificates(certificates) {
        if (!this.elements.certificatesList) return;
        
        // Clear existing certificates
        this.elements.certificatesList.innerHTML = '';
        
        // Add new certificates
        certificates.forEach(cert => {
            const certCard = this.createCertificateCard(cert);
            this.elements.certificatesList.appendChild(certCard);
        });
    }
    
    updateActivityFeed(activities) {
        const activityTimeline = document.querySelector('.activity-timeline');
        if (!activityTimeline) return;
        
        // Clear existing activities
        activityTimeline.innerHTML = '';
        
        // Add new activities
        activities.forEach(activity => {
            const activityItem = this.createActivityItem(activity);
            activityTimeline.appendChild(activityItem);
        });
    }
    
    updatePlatformStatus(platform, status) {
        const platformCard = document.querySelector(`.platform-card:has(.fa-${platform})`);
        if (platformCard) {
            const statusBadge = platformCard.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            }
        }
    }
    
    // ===== COMPONENT CREATION =====
    
    createCourseCard(course) {
        const div = document.createElement('div');
        div.className = 'course-card';
        div.innerHTML = `
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">Master advanced concepts used in production</p>
                <div class="course-meta">
                    <span class="meta-item">
                        <i class="fas fa-clock"></i> ${course.duration}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-signal"></i> ${course.level}
                    </span>
                    <span class="meta-item">
                        <i class="fab fa-${course.provider.toLowerCase()}"></i> ${course.provider}
                    </span>
                </div>
                <div class="course-tags">
                    ${course.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="course-actions">
                <button class="btn btn-primary btn-block enroll-btn">
                    <i class="fas fa-paper-plane"></i> Enroll Now
                </button>
                <button class="btn btn-outline btn-block save-btn">
                    <i class="far fa-bookmark"></i> Save
                </button>
            </div>
        `;
        return div;
    }
    
    createJobCard(job) {
        const div = document.createElement('div');
        div.className = 'job-card';
        div.innerHTML = `
            <div class="job-header">
                <div class="job-title">
                    <h3>${job.title}</h3>
                    <div class="job-match">
                        <div class="match-score">${job.match}%</div>
                        <span class="match-label">Match</span>
                    </div>
                </div>
                <div class="job-company">
                    <i class="fas fa-building"></i>
                    <span>${job.company}</span>
                </div>
            </div>
            <div class="job-details">
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${job.location}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>${job.salary}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${job.type}</span>
                </div>
            </div>
            <div class="job-skills">
                ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="job-actions">
                <button class="btn btn-primary apply-btn">
                    <i class="fas fa-paper-plane"></i> Apply Now
                </button>
                <button class="btn btn-outline save-btn">
                    <i class="far fa-bookmark"></i> Save
                </button>
            </div>
        `;
        return div;
    }
    
    createCertificateCard(cert) {
        const div = document.createElement('div');
        div.className = 'certificate-card';
        div.innerHTML = `
            <div class="certificate-icon ${cert.status}">
                <i class="fas fa-${cert.status === 'verified' ? 'award' : 'clock'}"></i>
            </div>
            <div class="certificate-content">
                <h4>${cert.name}</h4>
                <div class="certificate-details">
                    <span class="provider">${cert.provider}</span>
                    <span class="date">Completed: ${cert.date}</span>
                </div>
            </div>
            <div class="certificate-status">
                <span class="status-badge ${cert.status}">${
                    cert.status.charAt(0).toUpperCase() + cert.status.slice(1)
                }</span>
            </div>
        `;
        return div;
    }
    
    createActivityItem(activity) {
        const iconClass = {
            certificate_verified: 'success',
            job_application: 'info',
            course_completed: 'primary',
            project_added: 'warning'
        }[activity.type] || 'info';
        
        const icon = {
            certificate_verified: 'certificate',
            job_application: 'briefcase',
            course_completed: 'book',
            project_added: 'code'
        }[activity.type] || 'info-circle';
        
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.innerHTML = `
            <div class="activity-icon ${iconClass}">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-header">
                    <h4>${activity.title}</h4>
                    <span class="activity-time">${activity.time}</span>
                </div>
                <p class="activity-description">${activity.description}</p>
            </div>
        `;
        return div;
    }
    
    // ===== UTILITY FUNCTIONS =====
    
    setCurrentDate() {
        if (this.elements.currentDate) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            this.elements.currentDate.textContent = now.toLocaleDateString('en-US', options);
        }
    }
    
    animateCount(element, target, decimals = 0) {
        const duration = 1500;
        const start = 0;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = start + (target - start) * easeOutQuart;
            
            element.textContent = current.toFixed(decimals);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Add close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
    
    async showConfirmation(title, message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" id="confirmCancel">Cancel</button>
                        <button class="btn btn-primary" id="confirmOk">OK</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
            
            modal.querySelector('#confirmCancel').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
            
            modal.querySelector('#confirmOk').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });
            
            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            });
        });
    }
    
    showLoading() {
        this.state.isLoading = true;
        document.body.classList.add('loading');
        
        // Show loading indicator
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        
        document.body.appendChild(loadingEl);
    }
    
    hideLoading() {
        this.state.isLoading = false;
        document.body.classList.remove('loading');
        
        const loadingEl = document.querySelector('.loading-overlay');
        if (loadingEl) {
            loadingEl.remove();
        }
    }
    
    setupTooltips() {
        // Initialize tooltips
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.dataset.tooltip;
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
                tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
                
                e.target.dataset.tooltipId = tooltip;
            });
            
            element.addEventListener('mouseleave', (e) => {
                const tooltip = e.target.dataset.tooltipId;
                if (tooltip) {
                    tooltip.remove();
                    delete e.target.dataset.tooltipId;
                }
            });
        });
    }
    
    setupAnimations() {
        // Add CSS for animations if not present
        if (!document.querySelector('#dashboard-animations')) {
            const style = document.createElement('style');
            style.id = 'dashboard-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    backdrop-filter: blur(5px);
                }
                
                .loading-spinner {
                    text-align: center;
                }
                
                .loading-spinner .spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid var(--border-color);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                
                .tooltip {
                    position: fixed;
                    background: var(--text-primary);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.875rem;
                    z-index: 10000;
                    pointer-events: none;
                    white-space: nowrap;
                }
                
                .file-upload.dragover {
                    border-color: var(--primary-color);
                    background: var(--primary-light);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupFileUpload() {
        const dropzone = document.getElementById('certificateDropzone');
        const fileInput = document.getElementById('certificateFile');
        const selectedFile = document.getElementById('selectedFile');
        
        if (!dropzone || !fileInput || !selectedFile) return;
        
        dropzone.addEventListener('click', () => fileInput.click());
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('dragover');
            }, false);
        });
        
        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                updateSelectedFile(files[0]);
            }
        }, false);
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                updateSelectedFile(e.target.files[0]);
            }
        });
        
        function updateSelectedFile(file) {
            selectedFile.style.display = 'block';
            selectedFile.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-file"></i>
                    Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
            `;
        }
    }
    
    attachCourseEventListeners() {
        document.querySelectorAll('.enroll-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCourseEnrollment(e));
        });
    }
    
    attachJobEventListeners() {
        document.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleJobApplication(e));
        });
    }

    // ===== SECTION MANAGEMENT =====

    async loadSectionContent(section) {
        console.log(`Loading section: ${section}`);
        
        this.showLoading();
        
        try {
            // Hide all sections
            this.hideAllSections();
            
            // Show the requested section
            this.showSection(section);
            
            // Load section-specific data
            await this.loadSectionData(section);
            
            // Update welcome message
            this.updateWelcomeMessage(section);
            
            // Update page title
            document.title = `${this.getSectionTitle(section)} | SkillHub`;
            
            this.hideLoading();
            
            this.showToast(`${this.getSectionTitle(section)} loaded successfully`, 'success');
            
        } catch (error) {
            console.error(`Failed to load ${section} section:`, error);
            this.hideLoading();
            this.showToast(`Failed to load ${section} section`, 'error');
        }
    }

    hideAllSections() {
        // Hide all section containers
        document.querySelectorAll('.section-container').forEach(container => {
            container.style.display = 'none';
        });
        
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
    }

    showSection(section) {
        // Show the requested section
        const sectionContainer = document.getElementById(`${section}-section`);
        if (sectionContainer) {
            sectionContainer.style.display = 'block';
        } else {
            // If section doesn't exist, create it
            this.createSection(section);
        }
        
        // Add active class to nav link
        const navLink = document.querySelector(`[data-section="${section}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }
    }

    async loadSectionData(section) {
        // Load section-specific data
        switch(section) {
            case 'learning':
                await this.loadLearningHubData();
                break;
            case 'portfolio':
                await this.loadPortfolioData();
                break;
            case 'jobs':
                await this.loadJobsSectionData();
                break;
            case 'tests':
                await this.loadTestsData();
                break;
            case 'rewards':
                await this.loadRewardsData();
                break;
            case 'dashboard':
            default:
                await this.loadDashboardData();
                break;
        }
    }

    updateWelcomeMessage(section) {
        const welcomeHeader = document.querySelector('.header-content h1');
        const welcomeSubtitle = document.querySelector('.subtitle');
        
        if (!welcomeHeader || !welcomeSubtitle) return;
        
        const messages = {
            dashboard: {
                title: 'Welcome back, John! 👋',
                subtitle: 'You\'re making great progress on your Full Stack Developer path. Keep going!'
            },
            learning: {
                title: 'Learning Hub 📚',
                subtitle: 'Track your progress across all learning platforms'
            },
            portfolio: {
                title: 'Your Portfolio 🎨',
                subtitle: 'Showcase your skills and projects to employers'
            },
            jobs: {
                title: 'Job Opportunities 💼',
                subtitle: 'Find your next career move based on your skills'
            },
            tests: {
                title: 'Skill Assessments 🧠',
                subtitle: 'Test your knowledge and earn badges'
            },
            rewards: {
                title: 'Rewards & Achievements 🏆',
                subtitle: 'Track your progress and redeem rewards'
            }
        };
        
        const message = messages[section] || messages.dashboard;
        welcomeHeader.textContent = message.title;
        welcomeSubtitle.textContent = message.subtitle;
    }

    getSectionTitle(section) {
        const titles = {
            dashboard: 'Dashboard',
            learning: 'Learning Hub',
            portfolio: 'Portfolio',
            jobs: 'Jobs',
            tests: 'Tests',
            rewards: 'Rewards'
        };
        
        return titles[section] || 'Dashboard';
    }
    
    // ===== HELPER FUNCTIONS =====
    
    async simulateAPICall(delay, response = null) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(response);
            }, delay);
        });
    }
    
    updateCourseCount(increment = 0) {
        const courseStat = document.querySelector('.stat-value:first-child');
        if (courseStat) {
            const current = parseInt(courseStat.textContent);
            courseStat.textContent = current + increment;
        }
    }
    
    updateCertificatesCount(increment = 0) {
        const certStat = document.querySelectorAll('.stat-value')[1];
        if (certStat) {
            const current = parseInt(certStat.textContent);
            certStat.textContent = current + increment;
        }
    }
    
    updateApplicationsCount(increment = 0) {
        const jobStat = document.querySelectorAll('.stat-value')[2];
        if (jobStat) {
            const current = parseInt(jobStat.textContent);
            jobStat.textContent = current + increment;
        }
    }
    
    addCertificateToList(cert) {
        const certsList = document.querySelector('.certificates-list');
        if (certsList) {
            const certCard = this.createCertificateCard(cert);
            certsList.prepend(certCard);
        }
    }
    
    logActivity(activity) {
        const activityTimeline = document.querySelector('.activity-timeline');
        if (activityTimeline) {
            const activityItem = this.createActivityItem(activity);
            activityTimeline.prepend(activityItem);
        }
    }
    
    async markAllNotificationsRead() {
        const unreadItems = document.querySelectorAll('.notification-item.unread');
        unreadItems.forEach(item => item.classList.remove('unread'));
        
        const notificationCount = document.querySelector('.notification-count');
        if (notificationCount) {
            notificationCount.textContent = '0';
        }
        
        this.showToast('All notifications marked as read', 'success');
    }
    
    refreshActivity() {
        this.showToast('Activity feed refreshed', 'info');
        
        // Simulate fetching new activity
        setTimeout(() => {
            this.logActivity({
                type: 'system',
                title: 'Feed Refreshed',
                description: 'Activity feed has been refreshed',
                time: 'Just now'
            });
        }, 500);
    }
    
    setDailyGoal() {
        this.showConfirmation('Set Daily Goal', 'Set a daily learning goal to stay on track.')
            .then((confirmed) => {
                if (confirmed) {
                    this.showToast('Daily goal set to 2 hours', 'success');
                }
            });
    }
    

    updateResume() {
        this.showToast('Resume update feature coming soon!', 'info');
    }
    
    addProject() {
        this.showToast('Add project feature coming soon!', 'info');
    }
    
    findMentor() {
        this.showToast('Find mentor feature coming soon!', 'info');
    }
    
    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth >= 768 && this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
    }
    
    handleKeydown(e) {
        // Close modals on Escape key
        if (e.key === 'Escape') {
            this.closeAllModals();
            this.closeAllDropdowns();
        }
    }
    
    initCharts() {
        // Initialize any charts or graphs here
        // This would be implemented with a charting library like Chart.js
        console.log('Charts initialized');
    }
}

// SIMPLE SOLUTION: Make Browse Files button work
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Find the Browse Files button
    const browseButton = document.getElementById('browse-resume');
    
    // 2. Find the hidden file input
    const fileInput = document.getElementById('resume-file');
    
    // 3. Make the button click open the file picker
    if (browseButton && fileInput) {
        browseButton.addEventListener('click', function(e) {
            e.preventDefault(); // Stop any default behavior
            fileInput.click();  // This opens the file picker
        });
        
        console.log('✅ Browse Files button is now working!');
    } else {
        console.log('❌ Could not find button or file input');
    }
    
    // 4. Handle when a file is selected
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                alert('Selected file: ' + file.name);
                // Here you would normally upload the file
            }
        });
    }
});


document.addEventListener('DOMContentLoaded', function() {
    const editProfileBtn = document.getElementById('edit-profile');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // This will open settings.html and jump to account-section
            window.location.href = 'settings.html#account-section';
        });
    }
});


// ===== INITIALIZE DASHBOARD =====
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.SkillHub = new SkillHubDashboard();
    
    // Add global error handler
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        window.SkillHub?.showToast('An unexpected error occurred', 'error');
    });
    
    // Add offline/online detection
    window.addEventListener('offline', () => {
        window.SkillHub?.showToast('You are offline. Some features may not work.', 'warning');
    });
    
    window.addEventListener('online', () => {
        window.SkillHub?.showToast('You are back online!', 'success');
    });
});