// ===== DASHBOARD FEATURES - EXTENDS MAIN FUNCTIONALITY =====
// Dashboard-specific features, animations, and interactions

class DashboardFeatures {
    constructor(dashboardInstance) {
        this.dashboard = dashboardInstance;
        this.initState();
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    // ===== INITIALIZATION =====
    
    initState() {
        this.state = {
            isAnimating: false,
            isDragging: false,
            activeFilters: {},
            selectedItems: [],
            viewMode: 'grid',
            sortBy: 'relevance',
            searchQuery: '',
            profileEditMode: false,
            originalProfileData: null
        };
    }
    
    init() {
        this.cacheElements();
        this.setupDashboard();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupCharts();
        this.initTooltips();
        this.loadProfileData();
    }
    
    cacheElements() {
        this.elements = {
            // Stats and Cards
            statCards: document.querySelectorAll('.stat-card'),
            quickStatsSection: document.querySelector('.quick-stats'),
            courseCards: document.querySelectorAll('.course-card'),
            jobCards: document.querySelectorAll('.job-card'),
            certificateCards: document.querySelectorAll('.certificate-card'),
            platformCards: document.querySelectorAll('.platform-card'),
            
            // Progress and Skills
            progressBars: document.querySelectorAll('.progress-bar'),
            skillMeters: document.querySelectorAll('.skill-meter'),
            
            // Activity
            activityItems: document.querySelectorAll('.activity-item'),
            
            // Action Buttons
            actionBtns: document.querySelectorAll('[data-action]'),
            courseEnrollBtns: document.querySelectorAll('.enroll-btn'),
            courseSaveBtns: document.querySelectorAll('.save-btn'),
            jobApplyBtns: document.querySelectorAll('.apply-btn'),
            jobSaveBtns: document.querySelectorAll('.job-save-btn'),
            
            // Filter and Search
            filters: document.querySelectorAll('.filter-btn'),
            sortSelect: document.getElementById('sortSelect'),
            viewToggle: document.getElementById('viewToggle'),
            searchInput: document.getElementById('searchInput'),
            sectionToggles: document.querySelectorAll('.section-toggle'),
            
            // Profile Elements
            profileSection: document.getElementById('profile-section'),
            editProfileBtn: document.getElementById('edit-profile'),
            changeAvatarBtn: document.getElementById('change-avatar-btn'),
            uploadPhotoBtn: document.getElementById('upload-photo'),
            removePhotoBtn: document.getElementById('remove-photo'),
            profileAvatar: document.getElementById('profile-avatar'),
            profileFullname: document.getElementById('profile-fullname'),
            profileTitle: document.getElementById('profile-title'),
            profileLocation: document.getElementById('profile-location'),
            profileEmail: document.getElementById('profile-email'),
            profilePhone: document.getElementById('profile-phone'),
            profileBio: document.getElementById('profile-bio'),
            profileNavLink: document.querySelector('a[data-section="profile"]'),
            
            // Profile Form Elements
            editPersonalInfoBtn: document.getElementById('edit-personal-info'),
            editProfessionalInfoBtn: document.getElementById('edit-professional-info'),
            addSocialLinkBtn: document.getElementById('add-social-link'),
            changePasswordBtn: document.getElementById('change-password'),
            twoFAToggle: document.getElementById('2fa-toggle'),
            viewLoginActivityBtn: document.getElementById('view-login-activity'),
            manageDevicesBtn: document.getElementById('manage-devices'),
            profileVisibility: document.getElementById('profile-visibility'),
            onlineStatusToggle: document.getElementById('online-status'),
            emailNotificationsToggle: document.getElementById('email-notifications'),
            jobRecommendationsToggle: document.getElementById('job-recommendations'),
            exportDataBtn: document.getElementById('export-data'),
            downloadBackupBtn: document.getElementById('download-backup'),
            deactivateAccountBtn: document.getElementById('deactivate-account'),
            deleteAccountBtn: document.getElementById('delete-account')
        };
    }
    
    // ===== DASHBOARD SETUP =====
    
    setupDashboard() {
        this.animateProgressBars();
        this.animateStats();
        this.setupCardEffects();
        this.setupLazyLoading();
        this.setupIntersectionObserver();
    }
    
    setupEventListeners() {
        // Course Actions
        this.setupCourseEventListeners();
        
        // Job Actions
        this.setupJobEventListeners();
        
        // Save Actions
        this.setupSaveEventListeners();
        
        // UI Controls
        this.setupUIControlEventListeners();
        
        // Profile Events
        this.setupProfileEventListeners();
        
        // Window Events
        this.setupWindowEventListeners();
    }
    
    setupCourseEventListeners() {
        this.elements.courseEnrollBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.dashboard?.handleCourseEnrollment) {
                    this.dashboard.handleCourseEnrollment(e);
                } else {
                    this.handleCourseAction(e);
                }
            });
        });
    }
    
    setupJobEventListeners() {
        this.elements.jobApplyBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.dashboard?.handleJobApplication) {
                    this.dashboard.handleJobApplication(e);
                } else {
                    this.handleJobAction(e);
                }
            });
        });
    }
    
    setupSaveEventListeners() {
        this.elements.courseSaveBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSaveAction(e, 'course'));
        });
        
        this.elements.jobSaveBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSaveAction(e, 'job'));
        });
    }
    
    setupUIControlEventListeners() {
        // Filters
        this.elements.filters?.forEach(filter => {
            filter.addEventListener('click', (e) => this.handleFilter(e));
        });
        
        // Sort
        this.elements.sortSelect?.addEventListener('change', (e) => {
            this.handleSortChange(e.target.value);
        });
        
        // View Toggle
        this.elements.viewToggle?.addEventListener('click', () => {
            this.toggleViewMode();
        });
        
        // Search
        this.elements.searchInput?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        this.elements.searchInput?.addEventListener('keyup', 
            this.debounce((e) => this.handleSearch(e.target.value), 300)
        );
        
        // Section Toggles
        this.elements.sectionToggles?.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.toggleSection(e));
        });
        
        // Action Buttons
        this.elements.actionBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAction(e));
        });
    }
    
    setupProfileEventListeners() {
        // Profile Controls
        this.elements.editProfileBtn?.addEventListener('click', (e) => {
            this.toggleProfileEditMode(e.currentTarget);
        });
        
        this.elements.changeAvatarBtn?.addEventListener('click', () => {
            this.openAvatarUpload();
        });
        
        this.elements.uploadPhotoBtn?.addEventListener('click', () => {
            this.openAvatarUpload();
        });
        
        this.elements.removePhotoBtn?.addEventListener('click', () => {
            this.removeProfilePhoto();
        });
        
        this.elements.profileNavLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfileSection();
        });
        
        // Profile Editing
        this.elements.editPersonalInfoBtn?.addEventListener('click', () => {
            this.enablePersonalInfoEditing();
        });
        
        this.elements.editProfessionalInfoBtn?.addEventListener('click', () => {
            this.enableProfessionalInfoEditing();
        });
        
        // Social Links
        this.elements.addSocialLinkBtn?.addEventListener('click', () => {
            this.addSocialLink();
        });
        
        // Security Settings
        this.setupSecurityEventListeners();
        
        // Privacy Settings
        this.setupPrivacyEventListeners();
        
        // Account Actions
        this.setupAccountEventListeners();
    }
    
    setupSecurityEventListeners() {
        this.elements.changePasswordBtn?.addEventListener('click', () => {
            this.showChangePasswordModal();
        });
        
        this.elements.viewLoginActivityBtn?.addEventListener('click', () => {
            this.showLoginActivity();
        });
        
        this.elements.manageDevicesBtn?.addEventListener('click', () => {
            this.showConnectedDevices();
        });
        
        this.elements.twoFAToggle?.addEventListener('change', (e) => {
            this.toggleTwoFactorAuth(e.target.checked);
        });
    }
    
    setupPrivacyEventListeners() {
        this.elements.profileVisibility?.addEventListener('change', (e) => {
            this.updateProfileVisibility(e.target.value);
        });
        
        this.elements.onlineStatusToggle?.addEventListener('change', (e) => {
            this.updateOnlineStatus(e.target.checked);
        });
        
        this.elements.emailNotificationsToggle?.addEventListener('change', (e) => {
            this.updateEmailNotifications(e.target.checked);
        });
        
        this.elements.jobRecommendationsToggle?.addEventListener('change', (e) => {
            this.updateJobRecommendations(e.target.checked);
        });
    }
    
    setupAccountEventListeners() {
        this.elements.exportDataBtn?.addEventListener('click', () => {
            this.exportProfileData();
        });
        
        this.elements.downloadBackupBtn?.addEventListener('click', () => {
            this.downloadBackup();
        });
        
        this.elements.deactivateAccountBtn?.addEventListener('click', () => {
            this.deactivateAccount();
        });
        
        this.elements.deleteAccountBtn?.addEventListener('click', () => {
            this.deleteAccount();
        });
    }
    
    setupWindowEventListeners() {
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
        window.addEventListener('scroll', this.throttle(() => this.handleScroll(), 100));
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    // ===== PROFILE SECTION =====
    
    showProfileSection() {
        // Hide all sections
        document.querySelectorAll('.section-container').forEach(section => {
            section.style.display = 'none';
        });
        
        // Hide main dashboard
        const mainDashboard = document.querySelector('.dashboard-content');
        if (mainDashboard) mainDashboard.style.display = 'none';
        
        // Hide stats
        const quickStatsElements = document.querySelectorAll('.quick-stats, .stats-overview, .stats-grid');
        quickStatsElements.forEach(el => el.style.display = 'none');
        
        const statsSections = document.querySelectorAll('.stats-overview, .header-stats, .stats-card, .stat-cards');
        statsSections.forEach(el => el.style.display = 'none');
        
        // Show profile section
        if (this.elements.profileSection) {
            this.elements.profileSection.style.display = 'block';
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Load profile data
        if (!this.state.originalProfileData) {
            this.loadProfileData();
        }
    }
    
    showDashboard() {
        // Hide all section containers
        document.querySelectorAll('.section-container').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show main dashboard
        const mainDashboard = document.querySelector('.dashboard-content');
        if (mainDashboard) mainDashboard.style.display = 'block';
        
        // Show stats
        const quickStatsElements = document.querySelectorAll('.quick-stats, .stats-overview, .stats-grid');
        quickStatsElements.forEach(el => el.style.display = 'grid');
        
        const statsSections = document.querySelectorAll('.stats-overview, .header-stats, .stats-card, .stat-cards');
        statsSections.forEach(el => el.style.display = 'block');
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const dashboardNavLink = document.querySelector('a[data-section="dashboard"]');
        if (dashboardNavLink) dashboardNavLink.classList.add('active');
    }
    
    loadProfileData() {
        const profileData = {
            fullName: this.elements.profileFullname?.textContent || 'John Doe',
            title: this.elements.profileTitle?.textContent || 'Full Stack Developer',
            location: this.elements.profileLocation?.textContent || 'San Francisco, CA',
            email: this.elements.profileEmail?.textContent || 'john.doe@email.com',
            phone: this.elements.profilePhone?.textContent || '+1 (555) 123-4567',
            bio: this.elements.profileBio?.textContent || 'Passionate full-stack developer...',
            avatar: this.elements.profileAvatar?.src || 'https://ui-avatars.com/api/?name=John+Doe&background=4f46e5&color=fff&size=150&bold=true'
        };
        
        this.state.originalProfileData = profileData;
        return profileData;
    }
    
    toggleProfileEditMode(button) {
        this.state.profileEditMode = !this.state.profileEditMode;
        
        if (this.state.profileEditMode) {
            // Enter edit mode
            button.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            button.classList.add('editing');
            this.enableProfileEditing();
        } else {
            // Save and exit edit mode
            button.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
            button.classList.remove('editing');
            this.saveProfileChanges();
        }
    }
    
    enableProfileEditing() {
        const editableFields = [
            this.elements.profileFullname,
            this.elements.profileTitle,
            this.elements.profileLocation,
            this.elements.profileEmail,
            this.elements.profilePhone,
            this.elements.profileBio
        ];
        
        editableFields.forEach(field => {
            if (field) {
                field.contentEditable = true;
                field.classList.add('editable');
                
                // Focus on first field
                if (field === this.elements.profileFullname) {
                    setTimeout(() => {
                        field.focus();
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(field);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }, 100);
                }
            }
        });
    }
    
    saveProfileChanges() {
        const updatedData = {
            fullName: this.elements.profileFullname?.textContent || '',
            title: this.elements.profileTitle?.textContent || '',
            location: this.elements.profileLocation?.textContent || '',
            email: this.elements.profileEmail?.textContent || '',
            phone: this.elements.profilePhone?.textContent || '',
            bio: this.elements.profileBio?.textContent || '',
            avatar: this.elements.profileAvatar?.src || ''
        };
        
        // Save to state
        this.state.originalProfileData = { ...this.state.originalProfileData, ...updatedData };
        
        // Disable editing
        document.querySelectorAll('.editable').forEach(el => {
            el.contentEditable = false;
            el.classList.remove('editable');
        });
        
        // Update navigation
        this.updateNavigationProfile(updatedData);
        
        /*
        // Show success
        this.showToast('Profile updated successfully!', 'success');
        
        // Simulate API call
        setTimeout(() => {
            this.dashboard?.showToast?.('Profile saved to server', 'success');
        }, 500);*/
    }
    
    updateNavigationProfile(profileData) {
        const navProfileName = document.querySelector('.profile-name');
        if (navProfileName && profileData.fullName) {
            navProfileName.textContent = profileData.fullName;
        }
        
        const navProfileTitle = document.querySelector('.profile-title');
        if (navProfileTitle && profileData.title) {
            navProfileTitle.textContent = profileData.title;
        }
        
        const navAvatar = document.querySelector('.profile-avatar');
        if (navAvatar && profileData.avatar) {
            navAvatar.src = profileData.avatar;
        }
        
        const dropdownHeader = document.querySelector('.profile-header img');
        if (dropdownHeader && profileData.avatar) {
            dropdownHeader.src = profileData.avatar;
        }
        
        const dropdownName = document.querySelector('.profile-header h4');
        if (dropdownName && profileData.fullName) {
            dropdownName.textContent = profileData.fullName;
        }
    }
    
    openAvatarUpload() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.uploadProfilePhoto(file);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }
    
    uploadProfilePhoto(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;
        
        if (!validTypes.includes(file.type)) {
            this.showToast('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'error');
            return;
        }
        
        if (file.size > maxSize) {
            this.showToast('Image size should be less than 5MB', 'error');
            return;
        }
        
        /*
        // Show loading state
        const originalBtnText = this.elements.uploadPhotoBtn?.innerHTML;
        if (this.elements.uploadPhotoBtn) {
            this.elements.uploadPhotoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            this.elements.uploadPhotoBtn.disabled = true; */
        }
        
        /*
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            
            if (this.elements.profileAvatar) {
                this.elements.profileAvatar.src = imageUrl;
            }
            
            this.updateNavigationProfile({ avatar: imageUrl });
            this.showToast('Profile picture updated successfully!', 'success');
            
            if (this.elements.uploadPhotoBtn) {
                this.elements.uploadPhotoBtn.innerHTML = originalBtnText;
                this.elements.uploadPhotoBtn.disabled = false;
            } 
        }; */
        
        /*
        reader.onerror = () => {
            this.showToast('Failed to upload image', 'error');
            if (this.elements.uploadPhotoBtn) {
                this.elements.uploadPhotoBtn.innerHTML = originalBtnText;
                this.elements.uploadPhotoBtn.disabled = false;
            }
        };
        
        reader.readAsDataURL(file); */
    }
    
    removeProfilePhoto() {
        if (!confirm('Are you sure you want to remove your profile picture?')) return;
        
        const defaultAvatar = 'https://ui-avatars.com/api/?name=' + 
            encodeURIComponent(this.elements.profileFullname?.textContent || 'User') + 
            '&background=4f46e5&color=fff&size=150&bold=true';
        
        if (this.elements.profileAvatar) {
            this.elements.profileAvatar.src = defaultAvatar;
        }
        
        this.updateNavigationProfile({ avatar: defaultAvatar });
        this.showToast('Profile picture removed', 'info');
    }
    
    enablePersonalInfoEditing() {
        const personalInfoFields = document.querySelectorAll('.personal-info-grid .info-value');
        
        personalInfoFields.forEach(field => {
            field.contentEditable = true;
            field.classList.add('editable');
            field.dataset.originalValue = field.textContent;
            
            field.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    field.blur();
                }
            });
            
            field.addEventListener('blur', () => {
                if (field.textContent !== field.dataset.originalValue) {
                    this.savePersonalInfo(field);
                }
            });
        });
        
        if (this.elements.editPersonalInfoBtn) {
            this.elements.editPersonalInfoBtn.innerHTML = '<i class="fas fa-save"></i> Save';
            this.elements.editPersonalInfoBtn.dataset.mode = 'save';
        }
    }
    
    savePersonalInfo(field) {
        const infoType = field.closest('.info-item')?.querySelector('.info-label')?.textContent;
        const newValue = field.textContent;
        this.showToast(`${infoType} updated`, 'success');
    }
    
    enableProfessionalInfoEditing() {
        const professionalInfoFields = document.querySelectorAll('.professional-info-grid .info-value');
        
        professionalInfoFields.forEach(field => {
            field.contentEditable = true;
            field.classList.add('editable');
            field.dataset.originalValue = field.textContent;
            
            field.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    field.blur();
                }
            });
            
            field.addEventListener('blur', () => {
                if (field.textContent !== field.dataset.originalValue) {
                    this.saveProfessionalInfo(field);
                }
            });
        });
        
        const careerSummary = document.getElementById('career-summary-text');
        if (careerSummary) {
            careerSummary.contentEditable = true;
            careerSummary.classList.add('editable');
            careerSummary.dataset.originalValue = careerSummary.textContent;
            
            careerSummary.addEventListener('blur', () => {
                if (careerSummary.textContent !== careerSummary.dataset.originalValue) {
                    this.saveCareerSummary(careerSummary);
                }
            });
        }
        
        if (this.elements.editProfessionalInfoBtn) {
            this.elements.editProfessionalInfoBtn.innerHTML = '<i class="fas fa-save"></i> Save';
            this.elements.editProfessionalInfoBtn.dataset.mode = 'save';
        }
    }
    
    saveProfessionalInfo(field) {
        const infoType = field.closest('.info-item')?.querySelector('.info-label')?.textContent;
        const newValue = field.textContent;
        this.showToast(`${infoType} updated`, 'success');
    }
    
    saveCareerSummary(field) {
        this.showToast('Career summary updated', 'success');
    }
    
    addSocialLink() {
        const platform = prompt('Enter platform name (e.g., LinkedIn, GitHub):');
        if (!platform) return;
        
        const url = prompt(`Enter your ${platform} profile URL:`);
        if (!url) return;
        
        const socialLinksList = document.querySelector('.social-links-list');
        if (!socialLinksList) return;
        
        const newItem = document.createElement('div');
        newItem.className = 'social-link-item';
        newItem.innerHTML = `
            <div class="social-icon ${platform.toLowerCase()}">
                <i class="fab fa-${platform.toLowerCase()}"></i>
            </div>
            <div class="social-details">
                <span class="social-platform">${platform}</span>
                <a href="${url}" target="_blank" class="social-url">${url}</a>
            </div>
            <button class="btn-icon btn-sm" onclick="this.closest('.social-link-item').remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        socialLinksList.appendChild(newItem);
        this.showToast(`${platform} link added`, 'success');
    }
    
    showChangePasswordModal() {
        const modalHTML = `
            <div class="modal active" id="passwordModal">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3>Change Password</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="passwordForm">
                            <div class="form-group">
                                <label>Current Password</label>
                                <input type="password" id="currentPassword" required>
                            </div>
                            <div class="form-group">
                                <label>New Password</label>
                                <input type="password" id="newPassword" required minlength="8">
                                <small>Minimum 8 characters with letters and numbers</small>
                            </div>
                            <div class="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" id="confirmPassword" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button class="btn btn-primary" onclick="window.DashboardFeatures.submitPasswordChange()">Update Password</button>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
    }
    
    submitPasswordChange() {
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('Please fill all fields', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters', 'error');
            return;
        }
        
        /*
        this.showToast('Updating password...', 'info');
        
        setTimeout(() => {
            this.showToast('Password updated successfully!', 'success');
            document.getElementById('passwordModal')?.remove();
        }, 1500);*/
    }
    
    toggleTwoFactorAuth(enabled) {
        /*
        if (enabled) {
            this.showToast('Setting up two-factor authentication...', 'info');
            setTimeout(() => {
                this.showToast('Two-factor authentication enabled', 'success');
            }, 2000);
        }*/ else {
            if (confirm('Are you sure you want to disable two-factor authentication? This reduces your account security.')) {
                this.showToast('Two-factor authentication disabled', 'warning');
            } else {
                if (this.elements.twoFAToggle) {
                    this.elements.twoFAToggle.checked = true;
                }
            }
        }
    }
    
    updateProfileVisibility(value) {
        this.showToast(`Profile visibility updated to ${value}`, 'success');
    }
    
    updateOnlineStatus(enabled) {
        // In a real app, update via API
    }
    
    updateEmailNotifications(enabled) {
        this.showToast(`Email notifications ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }
    
    updateJobRecommendations(enabled) {
        this.showToast(`Job recommendations ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }
    
    exportProfileData() {
        const profileData = {
            ...this.state.originalProfileData,
            exportDate: new Date().toISOString(),
            personalInfo: this.getPersonalInfo(),
            professionalInfo: this.getProfessionalInfo(),
            socialLinks: this.getSocialLinks()
        };
        
        const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillhub-profile-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showToast('Profile data exported', 'success');
    }
    
    getPersonalInfo() {
        const info = {};
        document.querySelectorAll('.personal-info-grid .info-item').forEach(item => {
            const label = item.querySelector('.info-label')?.textContent;
            const value = item.querySelector('.info-value')?.textContent;
            if (label && value) {
                info[label.replace(':', '').trim().toLowerCase().replace(/\s+/g, '_')] = value;
            }
        });
        return info;
    }
    
    getProfessionalInfo() {
        const info = {};
        document.querySelectorAll('.professional-info-grid .info-item').forEach(item => {
            const label = item.querySelector('.info-label')?.textContent;
            const value = item.querySelector('.info-value')?.textContent;
            if (label && value) {
                info[label.replace(':', '').trim().toLowerCase().replace(/\s+/g, '_')] = value;
            }
        });
        return info;
    }
    
    getSocialLinks() {
        const links = [];
        document.querySelectorAll('.social-link-item').forEach(item => {
            const platform = item.querySelector('.social-platform')?.textContent;
            const url = item.querySelector('.social-url')?.href;
            if (platform && url) {
                links.push({ platform, url });
            }
        });
        return links;
    }
    
    downloadBackup() {
        /*
        this.showToast('Preparing backup...', 'info');
        setTimeout(() => {
            this.exportProfileData();
        }, 1000); */
    }
    
    deactivateAccount() {
        if (confirm('Are you sure you want to deactivate your account? You can reactivate within 30 days.')) {
            /*
            this.showToast('Account deactivation requested...', 'warning');
            setTimeout(() => {
                this.showToast('Account deactivated. You can reactivate within 30 days.', 'warning');
            }, 2000); */
        }
    }
    
    deleteAccount() {
        if (confirm('WARNING: This will permanently delete your account and all data. This action cannot be undone. Are you absolutely sure?')) {
            const verification = prompt('Type "DELETE MY ACCOUNT" to confirm:');
            if (verification === 'DELETE MY ACCOUNT') {
                /*
                this.showToast('Deleting account...', 'error');
                setTimeout(() => {
                    this.showToast('Account deletion scheduled. You will be logged out shortly.', 'error');
                    setTimeout(() => {
                        window.location.href = '';
                    }, 3000);
                }, 2000); */
            } else {
                this.showToast('Account deletion cancelled', 'info');
            }
        }
    }
    
    showLoginActivity() {
        /*
        this.showToast('Loading login activity...', 'info');*/
    }
    
    showConnectedDevices() {
        /*
        this.showToast('Loading connected devices...', 'info');*/
    }
    
    // ===== ANIMATIONS =====
    
    setupAnimations() {
        this.addAnimationStyles();
        this.setupCardAnimations();
    }
    
    addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .animate-on-scroll {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            
            .animate-on-scroll.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .card-hover {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .card-hover:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
            }
            
            .pulse {
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .progress-animate {
                transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .shake {
                animation: shake 0.5s ease-in-out;
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            .fade-in {
                animation: fadeIn 0.5s ease-in;
            }
            
            .slide-in-right {
                animation: slideInRight 0.5s ease-out;
            }
            
            .profile-avatar-large {
                transition: transform 0.3s ease;
            }
            
            .profile-avatar-large:hover {
                transform: scale(1.05);
            }
            
            .editable {
                background: var(--color-bg-light);
                border: 1px solid var(--color-primary-light);
                border-radius: var(--border-radius);
                padding: 0.5rem;
                outline: none;
                transition: all 0.2s ease;
            }
            
            .editable:focus {
                border-color: var(--color-primary);
                box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
            }
        `;
        document.head.appendChild(style);
    }
    
    setupCardAnimations() {
        this.elements.courseCards?.forEach((card, index) => {
            card.classList.add('animate-on-scroll');
            card.style.transitionDelay = `${index * 0.1}s`;
        });
        
        this.elements.jobCards?.forEach((card, index) => {
            card.classList.add('animate-on-scroll');
            card.style.transitionDelay = `${index * 0.1}s`;
        });
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    if (entry.target.classList.contains('skill-meter')) {
                        this.animateSkillProgress(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px',
        });
        
        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        document.querySelectorAll('.skill-meter').forEach(el => observer.observe(el));
    }
    
    animateProgressBars() {
        this.elements.progressBars?.forEach(bar => {
            const width = bar.style.width || '0%';
            bar.style.width = '0%';
            
            setTimeout(() => {
                bar.style.width = width;
                bar.classList.add('progress-animate');
            }, 300);
        });
    }
    
    animateSkillProgress(skillMeter) {
        const progressBar = skillMeter.querySelector('.skill-progress');
        if (progressBar) {
            const width = progressBar.style.width || '0%';
            progressBar.style.width = '0%';
            
            setTimeout(() => {
                progressBar.style.width = width;
                progressBar.classList.add('progress-animate');
            }, 500);
        }
    }
    
    animateStats() {
        this.elements.statCards?.forEach(card => {
            const valueEl = card.querySelector('.stat-value');
            if (valueEl) {
                const finalValue = parseInt(valueEl.textContent);
                this.animateCount(valueEl, 0, finalValue, 1500);
            }
        });
    }
    
    animateCount(element, start, end, duration) {
        let startTimestamp = null;
        
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        
        window.requestAnimationFrame(step);
    }
    
    // ===== UTILITIES =====
    
    showToast(message, type = 'info') {
        if (this.dashboard?.showToast) {
            this.dashboard.showToast(message, type);
        } else {
            // Fallback toast implementation
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                    <span>${message}</span>
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
            `;
            
            const container = document.querySelector('.toast-container') || (() => {
                const newContainer = document.createElement('div');
                newContainer.className = 'toast-container';
                document.body.appendChild(newContainer);
                return newContainer;
            })();
            
            container.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 5000);
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // ===== PLACEHOLDER METHODS FOR EXISTING FUNCTIONALITY =====
    
    // These methods would be implemented elsewhere in your codebase
    setupCharts() { /* Chart setup implementation */ }
    initTooltips() { /* Tooltip initialization */ }
    setupCardEffects() { /* Card hover effects */ }
    setupLazyLoading() { /* Lazy loading for images */ }
    handleCourseAction(e) { /* Course action handler */ }
    handleJobAction(e) { /* Job action handler */ }
    handleSaveAction(e, type) { /* Save action handler */ }
    handleFilter(e) { /* Filter handler */ }
    handleSortChange(value) { /* Sort handler */ }
    toggleViewMode() { /* View mode toggle */ }
    handleSearch(query) { /* Search handler */ }
    toggleSection(e) { /* Section toggle */ }
    handleAction(e) { /* Generic action handler */ }
    handleResize() { /* Resize handler */ }
    handleScroll() { /* Scroll handler */ }
    handleKeyboardShortcuts(e) { /* Keyboard shortcuts */ }
}

// ===== EXTERNAL HANDLERS =====

// Logout Handler
document.addEventListener('DOMContentLoaded', function() {
    const logoutElements = document.querySelectorAll('.logout, a[href="#logout"]');
    
    logoutElements.forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to logout?')) return;
            
            localStorage.removeItem('skillhub_user');
            alert('Logging out...');
            window.location.href = 'login.html';
        });
    });
});

// Navigation Handler
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sectionContainers = document.querySelectorAll('.section-container');
    const mainDashboard = document.querySelector('.dashboard-content');
    const sidebar = document.querySelector('.sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');
    
    function showSection(sectionId) {
        // Hide all sections
        sectionContainers.forEach(container => {
            container.style.display = 'none';
        });
        
        // Handle main dashboard
        if (mainDashboard) {
            mainDashboard.style.display = sectionId === 'dashboard' ? 'block' : 'none';
        }
        
        // Handle sidebar
        if (sidebar) {
            if (sectionId === 'profile') {
                sidebar.style.display = 'none';
                if (dashboardContainer) dashboardContainer.classList.add('sidebar-hidden');
            } else {
                sidebar.style.display = 'block';
                if (dashboardContainer) dashboardContainer.classList.remove('sidebar-hidden');
            }
        }
        
        // Show selected section
        if (sectionId !== 'dashboard') {
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                targetSection.style.display = 'block';
                
                if (sectionId === 'profile' && window.DashboardFeatures) {
                    window.DashboardFeatures.loadProfileData();
                }
            }
        }
        
        // Update active nav
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });
    }
    
    // Add click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            window.location.hash = sectionId;
        });
    });
    
    // Profile dropdown link
    const profileDropdownLink = document.querySelector('.dropdown-item[data-section="profile"]');
    if (profileDropdownLink) {
        profileDropdownLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('profile');
            
            // Close dropdown on mobile
            const dropdown = this.closest('.dropdown-menu');
            if (dropdown && window.innerWidth < 768) {
                dropdown.style.display = 'none';
            }
        });
    }
    
    // Check URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== 'dashboard') {
        showSection(hash);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    setTimeout(() => {
        setupNavigation();
    }, 500);
    
    // Initialize DashboardFeatures
    setTimeout(() => {
        if (window.SkillHub) {
            window.DashboardFeatures = new DashboardFeatures(window.SkillHub);
            window.SkillHub.dashboardFeatures = window.DashboardFeatures;
        } else {
            console.warn('Main dashboard not found. Initializing standalone dashboard features.');
            window.DashboardFeatures = new DashboardFeatures(null);
        }
    }, 500);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardFeatures;
}