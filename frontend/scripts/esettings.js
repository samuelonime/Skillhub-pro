// DOM Elements
const toastContainer = document.querySelector('.toast-container');
const saveAllBtn = document.getElementById('save-all-settings');
const fullName = document.getElementById('full-name');
const email = document.getElementById('email');
const phone = document.getElementById('phone');
const jobTitle = document.getElementById('job-title');
const department = document.getElementById('department');
const currentPassword = document.getElementById('current-password');
const newPassword = document.getElementById('new-password');
const confirmPassword = document.getElementById('confirm-password');
const companyName = document.getElementById('company-name');
const industry = document.getElementById('industry');
const companySize = document.getElementById('company-size');
const website = document.getElementById('website');
const locationInput = document.getElementById('location');
const companyDescription = document.getElementById('company-description');
const changeAvatarBtn = document.getElementById('change-avatar');
const uploadPhotoBtn = document.getElementById('upload-photo');
const removePhotoBtn = document.getElementById('remove-photo');
const changeLogoBtn = document.getElementById('change-logo');
const passwordForm = document.querySelector('.password-form');
const twoFactorToggle = document.getElementById('2fa-toggle');
const themeOptions = document.querySelectorAll('.theme-option');
const colorOptions = document.querySelectorAll('.color-option');
const fontSize = document.getElementById('font-size');
const reduceMotion = document.getElementById('reduce-motion');
const exportDataBtn = document.getElementById('export-data');
const downloadBackupBtn = document.getElementById('download-backup');
const deactivateAccountBtn = document.getElementById('deactivate-account');
const deleteAccountBtn = document.getElementById('delete-account');
const themeRadios = document.querySelectorAll('input[name="theme"]');

// Toast Notification System
class Toast {
    constructor(message, type = 'success', duration = 4000) {
        this.message = message;
        this.type = type;
        this.duration = duration;
        this.id = Date.now();
        this.create();
    }

    create() {
        const toast = document.createElement('div');
        toast.className = `toast toast-${this.type}`;
        toast.id = `toast-${this.id}`;
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getIcon()}"></i>
                <span>${this.message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Add animation class
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        if (this.duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, this.duration);
        }
    }

    getIcon() {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
            loading: 'fa-spinner fa-spin'
        };
        return icons[this.type] || icons.info;
    }
}

// Validation Functions
class Validator {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/\D/g, ''));
    }

    static validatePassword(password) {
        return password.length >= 8;
    }

    static validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

// Settings Manager
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.loadTheme();
        this.loadAccentColor();
        this.loadDisplaySettings();
        this.bindEvents();
    }

    loadSettings() {
        const saved = localStorage.getItem('employer-settings');
        return saved ? JSON.parse(saved) : {
            profile: {},
            company: {},
            security: {},
            theme: 'light',
            accentColor: '#4f46e5',
            fontSize: 'medium',
            reduceMotion: false,
            notifications: {}
        };
    }

    saveSettings() {
        this.collectFormData();
        localStorage.setItem('employer-settings', JSON.stringify(this.settings));
        new Toast('Settings saved successfully!', 'success');
        
        // Update CSS variables
        this.updateThemeVariables();
    }

    collectFormData() {
        // Profile Settings
        this.settings.profile = {
            fullName: fullName.value,
            email: email.value,
            phone: phone.value,
            jobTitle: jobTitle.value,
            department: department.value
        };

        // Company Settings
        this.settings.company = {
            name: companyName.value,
            industry: industry.value,
            size: companySize.value,
            website: website.value,
            location: locationInput.value,
            description: companyDescription.value
        };

        // Display Settings
        this.settings.fontSize = fontSize.value;
        this.settings.reduceMotion = reduceMotion.checked;
        
        // Theme
        const selectedTheme = document.querySelector('input[name="theme"]:checked');
        if (selectedTheme) {
            this.settings.theme = selectedTheme.value;
        }
    }

    loadTheme() {
        const theme = this.settings.theme || 'light';
        
        // Set radio button
        themeRadios.forEach(radio => {
            radio.checked = radio.value === theme;
            const parent = radio.closest('.theme-option');
            if (radio.checked) {
                parent.classList.add('active');
            } else {
                parent.classList.remove('active');
            }
        });

        // Apply theme to body
        document.body.setAttribute('data-theme', theme);
    }

    loadAccentColor() {
        const color = this.settings.accentColor || '#4f46e5';
        
        // Update color options
        colorOptions.forEach(option => {
            if (option.dataset.color === color) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        // Set CSS variable
        document.documentElement.style.setProperty('--accent-color', color);
    }

    loadDisplaySettings() {
        // Font size
        if (this.settings.fontSize) {
            fontSize.value = this.settings.fontSize;
            document.body.className = document.body.className.replace(/\bfont-\w+\b/g, '');
            document.body.classList.add(`font-${this.settings.fontSize}`);
        }

        // Reduce motion
        if (this.settings.reduceMotion !== undefined) {
            reduceMotion.checked = this.settings.reduceMotion;
            if (this.settings.reduceMotion) {
                document.documentElement.style.setProperty('--animation-duration', '0s');
            }
        }
    }

    updateThemeVariables() {
        // Update accent color
        const activeColor = document.querySelector('.color-option.active');
        if (activeColor && activeColor.dataset.color !== 'custom') {
            this.settings.accentColor = activeColor.dataset.color;
            document.documentElement.style.setProperty('--accent-color', this.settings.accentColor);
        }
    }

    bindEvents() {
        // Theme selection
        themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const radio = option.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    themeOptions.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    
                    this.settings.theme = radio.value;
                    document.body.setAttribute('data-theme', radio.value);
                    this.saveSettings();
                }
            });
        });

        // Color selection
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                if (option.dataset.color !== 'custom') {
                    this.settings.accentColor = option.dataset.color;
                    this.updateThemeVariables();
                    this.saveSettings();
                }
            });
        });

        // Font size change
        fontSize.addEventListener('change', () => {
            document.body.className = document.body.className.replace(/\bfont-\w+\b/g, '');
            document.body.classList.add(`font-${fontSize.value}`);
            this.saveSettings();
        });

        // Reduce motion toggle
        reduceMotion.addEventListener('change', () => {
            if (reduceMotion.checked) {
                document.documentElement.style.setProperty('--animation-duration', '0s');
            } else {
                document.documentElement.style.setProperty('--animation-duration', '0.3s');
            }
            this.saveSettings();
        });
    }
}

// Form Validation and Handling
class FormHandler {
    static init() {
        // Real-time validation
        email.addEventListener('blur', () => this.validateEmail());
        phone.addEventListener('blur', () => this.validatePhone());
        website.addEventListener('blur', () => this.validateWebsite());
        
        // Password form submission
        passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        
        // Save all button
        saveAllBtn.addEventListener('click', () => this.saveAllChanges());
    }

    static validateEmail() {
        if (!Validator.validateEmail(email.value)) {
            this.showFieldError(email, 'Please enter a valid email address');
            return false;
        }
        this.clearFieldError(email);
        return true;
    }

    static validatePhone() {
        if (!Validator.validatePhone(phone.value)) {
            this.showFieldError(phone, 'Please enter a valid phone number');
            return false;
        }
        this.clearFieldError(phone);
        return true;
    }

    static validateWebsite() {
        if (website.value && !Validator.validateURL(website.value)) {
            this.showFieldError(website, 'Please enter a valid URL');
            return false;
        }
        this.clearFieldError(website);
        return true;
    }

    static validatePasswords() {
        let isValid = true;

        if (currentPassword.value && !Validator.validatePassword(currentPassword.value)) {
            this.showFieldError(currentPassword, 'Password must be at least 8 characters');
            isValid = false;
        } else {
            this.clearFieldError(currentPassword);
        }

        if (newPassword.value && !Validator.validatePassword(newPassword.value)) {
            this.showFieldError(newPassword, 'New password must be at least 8 characters');
            isValid = false;
        } else {
            this.clearFieldError(newPassword);
        }

        if (newPassword.value && confirmPassword.value && newPassword.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Passwords do not match');
            isValid = false;
        } else {
            this.clearFieldError(confirmPassword);
        }

        return isValid;
    }

    static showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('error');
        
        let errorEl = formGroup.querySelector('.error-message');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            formGroup.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    static clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.remove('error');
        const errorEl = formGroup.querySelector('.error-message');
        if (errorEl) errorEl.remove();
    }

    static async handlePasswordChange(e) {
        e.preventDefault();
        
        if (!this.validatePasswords()) {
            return;
        }

        /*
        try {
            // Simulate API call
            await this.simulateApiCall(1500); */
            
            // Clear password fields
            currentPassword.value = '';
            newPassword.value = '';
            confirmPassword.value = '';
            
            new Toast('Password changed successfully!', 'success');
        } catch (error) {
            new Toast('Failed to change password. Please try again.', 'error');
        } 
    }

    static async saveAllChanges() {
        // Validate all fields
        const isEmailValid = this.validateEmail();
        const isPhoneValid = this.validatePhone();
        const isWebsiteValid = this.validateWebsite();
        
        if (!isEmailValid || !isPhoneValid || !isWebsiteValid) {
            new Toast('Please fix the errors before saving.', 'error');
            return;
        }

        try {
            // Show loading state
            saveAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveAllBtn.disabled = true;

            /*
            // Simulate API call
            await this.simulateApiCall(2000); */
            
            // Save to settings manager
            settingsManager.saveSettings();
            
            // Reset button state
            saveAllBtn.innerHTML = '<i class="fas fa-save"></i> Save All Changes';
            saveAllBtn.disabled = false;
            
        } catch (error) {
            new Toast('Failed to save changes. Please try again.', 'error');
            saveAllBtn.innerHTML = '<i class="fas fa-save"></i> Save All Changes';
            saveAllBtn.disabled = false;
        }
    }

    /*
    static simulateApiCall(duration) {
        return new Promise(resolve => setTimeout(resolve, duration)); */
    } 
}

// Avatar and Logo Handling
class MediaHandler {
    static init() {
        // Avatar handling
        changeAvatarBtn.addEventListener('click', () => this.triggerAvatarUpload());
        uploadPhotoBtn.addEventListener('click', () => this.triggerAvatarUpload());
        removePhotoBtn.addEventListener('click', () => this.removeAvatar());
        
        // Logo handling
        changeLogoBtn.addEventListener('click', () => this.triggerLogoUpload());
        
        // Two-factor authentication toggle
        twoFactorToggle.addEventListener('change', (e) => this.handleTwoFactorToggle(e));
    }

    static triggerAvatarUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadImage(file, 'avatar');
            }
        };
        
        input.click();
    }

    static triggerLogoUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadImage(file, 'logo');
            }
        };
        
        input.click();
    }

    static async uploadImage(file, type) {
        // Simulate upload process
        const toast = new Toast('Uploading image...', 'loading', 0);
        
        try {
            /*
            // In a real app, you would upload to your server here
            await new Promise(resolve => setTimeout(resolve, 2000)); */
            
            // Create preview URL
            const url = URL.createObjectURL(file);
            
            if (type === 'avatar') {
                // Update all avatar images
                const avatarImages = document.querySelectorAll('.profile-avatar, .profile-avatar-large');
                avatarImages.forEach(img => {
                    img.src = url;
                });
            } else {
                // Update company logo
                const companyLogo = document.querySelector('.company-logo');
                companyLogo.src = url;
            }
            
            // Update toast
            toast.toast.remove();
            new Toast(`${type === 'avatar' ? 'Profile picture' : 'Company logo'} updated!`, 'success');
            
            // Save to localStorage (in a real app, save the URL to your database)
            localStorage.setItem(`${type}-image-url`, url);
            
        } catch (error) {
            toast.toast.remove();
            new Toast(`Failed to upload ${type}. Please try again.`, 'error');
        }
    }

    static removeAvatar() {
        const confirm = window.confirm('Are you sure you want to remove your profile picture?');
        if (confirm) {
            const defaultAvatar = 'https://ui-avatars.com/api/?name=Alex+Johnson&background=3b82f6&color=fff&size=150';
            
            // Reset all avatar images
            const avatarImages = document.querySelectorAll('.profile-avatar, .profile-avatar-large');
            avatarImages.forEach(img => {
                img.src = defaultAvatar;
            });
            
            // Remove from localStorage
            localStorage.removeItem('avatar-image-url');
            
            new Toast('Profile picture removed', 'info');
        }
    }

   
}

// Account Actions
class AccountActions {
    static init() {
        exportDataBtn.addEventListener('click', () => this.exportData());
        downloadBackupBtn.addEventListener('click', () => this.downloadBackup());
        deactivateAccountBtn.addEventListener('click', () => this.deactivateAccount());
        deleteAccountBtn.addEventListener('click', () => this.deleteAccount());
    }

    static exportData() {
        // Collect all settings data
        const data = {
            timestamp: new Date().toISOString(),
            profile: settingsManager.settings.profile,
            company: settingsManager.settings.company,
            settings: {
                theme: settingsManager.settings.theme,
                accentColor: settingsManager.settings.accentColor,
                fontSize: settingsManager.settings.fontSize,
                reduceMotion: settingsManager.settings.reduceMotion
            }
        };
        
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillhub-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        new Toast('Data exported successfully!', 'success');
    }

    static downloadBackup() {
        // Create a comprehensive backup
        const backup = {
            timestamp: new Date().toISOString(),
            settings: settingsManager.settings,
            formData: this.collectAllFormData()
        };
        
        // Download backup file
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillhub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        new Toast('Backup created successfully!', 'success');
    }

    static collectAllFormData() {
        return {
            profile: {
                fullName: fullName.value,
                email: email.value,
                phone: phone.value,
                jobTitle: jobTitle.value,
                department: department.value
            },
            company: {
                name: companyName.value,
                industry: industry.value,
                size: companySize.value,
                website: website.value,
                location: locationInput.value,
                description: companyDescription.value
            }
        };
    }

    static deactivateAccount() {
        if (confirm('Are you sure you want to deactivate your account? You can reactivate it anytime by logging in.')) {
            // Show loading
            deactivateAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deactivating...';
            deactivateAccountBtn.disabled = true;
            
            /*
            // Simulate API call
            setTimeout(() => {
                new Toast('Account deactivated successfully. You will be logged out.', 'warning');
                
                // In a real app, you would redirect to login page
                setTimeout(() => {
                    window.location.href = 'employer.html';
                }, 2000);
            }, 1500); */
    }

    static deleteAccount() {
        if (confirm('WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Are you absolutely sure?')) {
            const confirmation = prompt('Type "DELETE" to confirm permanent account deletion:');
            
            if (confirmation === 'DELETE') {
                // Show loading
                deleteAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                deleteAccountBtn.disabled = true;
                
                /*
                // Simulate API call
                setTimeout(() => {
                    new Toast('Account deleted permanently.', 'error');
                    
                    // In a real app, you would clear all data and redirect
                    setTimeout(() => {
                        localStorage.clear();
                        window.location.href = 'employer.html';
                    }, 2000);
                }, 2000);
            } else {
                new Toast('Account deletion cancelled.', 'info'); */
            }
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize settings manager
    window.settingsManager = new SettingsManager();
    
    // Initialize form handlers
    FormHandler.init();
    
    // Initialize media handlers
    MediaHandler.init();
    
    // Initialize account actions
    AccountActions.init();
    
    // Load saved avatar and logo
    const savedAvatar = localStorage.getItem('avatar-image-url');
    const savedLogo = localStorage.getItem('logo-image-url');
    
    if (savedAvatar) {
        const avatarImages = document.querySelectorAll('.profile-avatar, .profile-avatar-large');
        avatarImages.forEach(img => {
            img.src = savedAvatar;
        });
    }
    
    if (savedLogo) {
        const companyLogo = document.querySelector('.company-logo');
        companyLogo.src = savedLogo;
    }
    
    // Add some CSS for toast notifications
    const toastStyles = document.createElement('style');
    toastStyles.textContent = `
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .toast {
            background: white;
            border-radius: 8px;
            padding: 16px 20px;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        
        .toast.show {
            transform: translateX(0);
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .toast i {
            font-size: 20px;
        }
        
        .toast-success { border-left: 4px solid #10b981; }
        .toast-error { border-left: 4px solid #ef4444; }
        .toast-warning { border-left: 4px solid #f59e0b; }
        .toast-info { border-left: 4px solid #3b82f6; }
        .toast-success i { color: #10b981; }
        .toast-error i { color: #ef4444; }
        .toast-warning i { color: #f59e0b; }
        .toast-info i { color: #3b82f6; }
        
        .toast-close {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 4px;
        }
        
        .form-group.error input,
        .form-group.error select,
        .form-group.error textarea {
            border-color: #ef4444 !important;
        }
        
        .error-message {
            color: #ef4444;
            font-size: 12px;
            margin-top: 4px;
        }
        
        body.font-small { font-size: 14px; }
        body.font-medium { font-size: 16px; }
        body.font-large { font-size: 18px; }
        
        [data-theme="dark"] {
            background-color: #1f2937;
            color: #f9fafb;
        }
        
        :root {
            --accent-color: #4f46e5;
            --animation-duration: 0.3s;
        }
    `;
    
    document.head.appendChild(toastStyles);
    
    // Show welcome message
    setTimeout(() => {
        new Toast('Settings loaded successfully!', 'info');
    }, 1000);
});
// ── SkillHub layout integration ──────────────────────────────────────────────
(function() {
  const user = SkillHub.requireAuth(['employer', 'admin']);
  if (!user) return;
  if (typeof buildLayout === 'function') {
    buildLayout({ page: 'settings', role: user.role, title: 'Employer Settings' });
  }
})();
