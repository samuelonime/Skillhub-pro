// ======================
// STORAGE MANAGEMENT
// ======================
const SettingsStorage = {
    saveSetting: function(key, value) {
        try {
            localStorage.setItem(`settings_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },

    getSetting: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`settings_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },

    clearSetting: function(key) {
        localStorage.removeItem(`settings_${key}`);
    },

    clearAll: function() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('settings_')) {
                localStorage.removeItem(key);
            }
        });
    }
};

// ======================
// DEFAULT SETTINGS
// ======================
const defaultSettings = {
    profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        jobTitle: 'Full Stack Developer',
        bio: 'Passionate full-stack developer with 3+ years of experience building web applications. Specialized in React, Node.js, and cloud technologies.',
        linkedin: '',
        github: '',
        website: '',
        profilePicture: "https://ui-avatars.com/api/?name=John+Doe&background=4f46e5&color=fff&size=128"
    },
    billing: {
        billingName: 'John Doe',
        company: 'N/A',
        address: '123 Main St, San Francisco, CA 94105',
        taxId: '',
        country: 'US',
        countryText: 'United States'
    },
    payment: {
        cardNumber: '4242',
        expiry: '05/2025'
    },
    quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
    },
    notifications: {
        emailAlerts: true,
        pushNotifications: true,
        smsAlerts: false,
        marketingEmails: false
    },
    platformConnections: {
        twitter: false,
        facebook: false,
        instagram: false,
        linkedin: false
    }
};

// ======================
// TEMPLATES
// ======================
const templates = {
    profileForm: (data = {}) => `
        <div class="edit-form-container">
            <form id="profile-edit-form">
                <div class="form-section-header">
                    <h4><i class="fas fa-user-edit"></i> Edit Personal Information</h4>
                </div>
                
                <!-- Professional Profile Picture Upload Section -->
                <div class="profile-picture-section">
                    <div class="profile-upload-card">
                        <div class="profile-preview-wrapper">
                            <div class="profile-preview-circle" id="profile-preview">
                                <img src="${currentProfilePicture}" alt="Profile Preview" id="profile-preview-img" class="profile-preview-image">
                                <div class="profile-upload-overlay">
                                    <i class="fas fa-camera"></i>
                                    <span>Change</span>
                                </div>
                            </div>
                            <div class="profile-upload-details">
                                <h5>Profile Picture</h5>
                                <p class="upload-hint">JPG, PNG or GIF. Max size 5MB. Recommended: 200x200 pixels.</p>
                                <div class="profile-upload-controls">
                                    <label class="btn-upload">
                                        <i class="fas fa-upload"></i>
                                        <span>Choose File</span>
                                        <input type="file" 
                                               id="profile-picture-upload" 
                                               accept="image/*" 
                                               class="file-input-hidden">
                                    </label>
                                    <button type="button" class="btn-remove" id="remove-photo-btn">
                                        <i class="fas fa-trash"></i>
                                        <span>Remove</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="required">First Name</label>
                        <div class="input-with-icon">
                            <input type="text" id="firstName" class="form-control" value="${data.firstName || 'John'}" required>
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="required">Last Name</label>
                        <div class="input-with-icon">
                            <input type="text" id="lastName" class="form-control" value="${data.lastName || 'Doe'}" required>
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="required">Email Address</label>
                    <div class="input-with-icon">
                        <input type="email" id="email" class="form-control" value="${data.email || 'john.doe@email.com'}" required>
                        <i class="fas fa-envelope"></i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Phone Number</label>
                    <div class="input-with-icon">
                        <input type="tel" id="phone" class="form-control" value="${data.phone || '+1 (555) 123-4567'}">
                        <i class="fas fa-phone"></i>
                    </div>
                    <div class="form-help">
                        <i class="fas fa-info-circle"></i>
                        <span>Include country code for international numbers</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Location</label>
                    <div class="input-with-icon">
                        <input type="text" id="location" class="form-control" value="${data.location || 'San Francisco, CA'}">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Job Title</label>
                    <div class="input-with-icon">
                        <input type="text" id="jobTitle" class="form-control" value="${data.jobTitle || 'Full Stack Developer'}">
                        <i class="fas fa-briefcase"></i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Professional Bio</label>
                    <textarea id="bio" class="form-control textarea" rows="4" placeholder="Describe your skills, experience, and achievements...">${data.bio || 'Passionate full-stack developer with 3+ years of experience building web applications. Specialized in React, Node.js, and cloud technologies.'}</textarea>
                    <div class="char-counter">
                        <span id="bio-char-count">${(data.bio || 'Passionate full-stack developer with 3+ years of experience building web applications. Specialized in React, Node.js, and cloud technologies.').length}</span>/500 characters
                    </div>
                </div>
                
                <div class="form-section-header">
                    <h4><i class="fas fa-globe"></i> Social Links</h4>
                </div>
                
                <div class="form-group">
                    <label>LinkedIn Profile</label>
                    <div class="input-with-icon">
                        <input type="url" id="linkedin" class="form-control" placeholder="https://linkedin.com/in/username" value="${data.linkedin || ''}">
                        <i class="fab fa-linkedin"></i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>GitHub Profile</label>
                    <div class="input-with-icon">
                        <input type="url" id="github" class="form-control" placeholder="https://github.com/username" value="${data.github || ''}">
                        <i class="fab fa-github"></i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Personal Website</label>
                    <div class="input-with-icon">
                        <input type="url" id="website" class="form-control" placeholder="https://yourwebsite.com" value="${data.website || ''}">
                        <i class="fas fa-globe"></i>
                    </div>
                </div>

                <!-- Password Change Section -->
                <div class="form-section-header">
                    <h4><i class="fas fa-lock"></i> Change Password</h4>
                </div>
                
                <div class="form-group">
                    <label>Current Password</label>
                    <div class="input-with-icon password-field">
                        <input type="password" id="currentPassword" class="form-control" placeholder="Enter current password">
                        <i class="fas fa-lock"></i>
                        <button type="button" class="toggle-password" data-target="currentPassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>New Password</label>
                    <div class="input-with-icon password-field">
                        <input type="password" id="newPassword" class="form-control" placeholder="Enter new password">
                        <i class="fas fa-key"></i>
                        <button type="button" class="toggle-password" data-target="newPassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="password-strength">
                        <div class="strength-meter">
                            <div class="strength-bar"></div>
                        </div>
                        <div class="strength-text">Password strength: <span>None</span></div>
                    </div>
                    <div class="password-requirements">
                        <p class="requirement-title">Password must contain:</p>
                        <ul class="requirements-list">
                            <li class="req-length"><i class="fas fa-circle"></i> At least 8 characters</li>
                            <li class="req-uppercase"><i class="fas fa-circle"></i> One uppercase letter</li>
                            <li class="req-lowercase"><i class="fas fa-circle"></i> One lowercase letter</li>
                            <li class="req-number"><i class="fas fa-circle"></i> One number</li>
                            <li class="req-special"><i class="fas fa-circle"></i> One special character</li>
                        </ul>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <div class="input-with-icon password-field">
                        <input type="password" id="confirmPassword" class="form-control" placeholder="Confirm new password">
                        <i class="fas fa-key"></i>
                        <button type="button" class="toggle-password" data-target="confirmPassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="password-match">
                        <i class="fas fa-check-circle"></i>
                        <span>Passwords match</span>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancel-profile-edit">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        </div>
    `,
    
    profileDisplay: (data = {}, profilePicture = currentProfilePicture) => `
        <div class="info-row profile-picture-display">
            <div class="info-label">Profile Picture</div>
            <div class="info-value">
                <div class="profile-display-wrapper">
                    <div class="profile-display-circle">
                        <img src="${profilePicture}" alt="Profile Picture" class="profile-display-image">
                    </div>
                    <div class="profile-display-info">
                        <p class="profile-info-text">Current profile photo</p>
                        <p class="profile-info-hint">Click Edit to change</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="info-row">
            <div class="info-label">Full Name</div>
            <div class="info-value">${data.firstName || 'John'} ${data.lastName || 'Doe'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Email Address</div>
            <div class="info-value">${data.email || 'john.doe@email.com'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Phone Number</div>
            <div class="info-value">${data.phone || '+1 (555) 123-4567'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Location</div>
            <div class="info-value">${data.location || 'San Francisco, CA'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Job Title</div>
            <div class="info-value">${data.jobTitle || 'Full Stack Developer'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Bio</div>
            <div class="info-value bio-text">
                ${data.bio || 'Passionate full-stack developer with 3+ years of experience building web applications. Specialized in React, Node.js, and cloud technologies.'}
            </div>
        </div>
    `,
    
    billingForm: (data = {}) => `
        <form id="billing-edit-form">
            <div class="form-group">
                <label>Billing Name</label>
                <input type="text" id="billingName" class="form-control" value="${data.billingName || 'John Doe'}" required>
            </div>
            <div class="form-group">
                <label>Company</label>
                <input type="text" id="company" class="form-control" value="${data.company || 'N/A'}">
            </div>
            <div class="form-group">
                <label>Address</label>
                <input type="text" id="address" class="form-control" value="${data.address || '123 Main St, San Francisco, CA 94105'}" required>
            </div>
            <div class="form-group">
                <label>Tax ID</label>
                <input type="text" id="taxId" class="form-control" placeholder="Enter tax ID" value="${data.taxId || ''}">
            </div>
            <div class="form-group">
                <label>Country</label>
                <select id="country" class="form-control" required>
                    <option value="US" ${data.country === 'US' ? 'selected' : ''}>United States</option>
                    <option value="CA" ${data.country === 'CA' ? 'selected' : ''}>Canada</option>
                    <option value="UK" ${data.country === 'UK' ? 'selected' : ''}>United Kingdom</option>
                    <option value="AU" ${data.country === 'AU' ? 'selected' : ''}>Australia</option>
                </select>
            </div>
            <div class="form-actions" style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button type="button" class="btn btn-outline" id="cancel-billing-edit">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `,
    
    billingDisplay: (data = {}) => `
        <div class="info-row">
            <div class="info-label">Billing Name</div>
            <div class="info-value">${data.billingName || 'John Doe'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Company</div>
            <div class="info-value">${data.company || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Address</div>
            <div class="info-value">${data.address || '123 Main St, San Francisco, CA 94105'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Tax ID</div>
            <div class="info-value">${data.taxId || 'Not provided'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Country</div>
            <div class="info-value">${data.countryText || 'United States'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Next Billing Date</div>
            <div class="info-value">May 1, 2024</div>
        </div>
    `,
    
    paymentEditForm: (currentNumber = '4242', currentExpiry = '05/2025') => `
        <form class="payment-edit-form" style="width: 100%;">
            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Card Number</label>
                <input type="text" class="form-control payment-card-number" value="**** **** **** ${currentNumber}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 0.375rem;">
            </div>
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Expiry Date</label>
                    <input type="text" class="form-control payment-expiry" value="${currentExpiry}" placeholder="MM/YY">
                </div>
                <div class="form-group">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">CVC</label>
                    <input type="text" class="form-control payment-cvc" placeholder="***">
                </div>
            </div>
            <div class="form-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button type="button" class="btn btn-sm btn-outline cancel-payment-edit">Cancel</button>
                <button type="submit" class="btn btn-sm btn-primary">Save</button>
            </div>
        </form>
    `
};

// ======================
// GLOBAL VARIABLES
// ======================
let currentProfilePicture = "https://ui-avatars.com/api/?name=John+Doe&background=4f46e5&color=fff&size=128";
let uploadedImageFile = null;
let imagePreviewUrl = null;

// ======================
// HELPER FUNCTIONS
// ======================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 400px;
    `;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 300);
    }, 3000);
}

function getPlatformName(platformId) {
    const platformNames = {
        'udemy': 'Udemy',
        'coursera': 'Coursera',
        'linkedin': 'LinkedIn Learning',
        'github': 'GitHub',
        'pluralsight': 'Pluralsight',
        'edx': 'edX',
        'codecademy': 'Codecademy'
    };
    
    return platformNames[platformId] || platformId;
}

// ======================
// PASSWORD VALIDATION
// ======================
function validatePasswordForm() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    // Check if any password field has content
    const isChangingPassword = currentPassword || newPassword || confirmPassword;
    
    if (!isChangingPassword) {
        return { valid: true, message: '' };
    }
    
    // All password fields must be filled
    if (!currentPassword || !newPassword || !confirmPassword) {
        return { valid: false, message: 'Please fill in all password fields' };
    }
    
    // Check password requirements
    const requirements = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /\d/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    };
    
    if (!requirements.length || !requirements.uppercase || !requirements.lowercase || 
        !requirements.number || !requirements.special) {
        return { valid: false, message: 'New password does not meet requirements' };
    }
    
    // Check password match
    if (newPassword !== confirmPassword) {
        return { valid: false, message: 'Passwords do not match' };
    }
    
    return { valid: true, message: 'Password validation successful' };
}

function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text span');
    const requirements = document.querySelectorAll('.requirements-list li i');
    
    if (!strengthBar || !strengthText) return;
    
    let score = 0;
    const total = 5;
    
    // Check requirements
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];
    
    checks.forEach((check, index) => {
        if (check) {
            score++;
            if (requirements[index]) {
                requirements[index].className = 'fas fa-check-circle';
                requirements[index].style.color = '#10b981';
            }
        } else {
            if (requirements[index]) {
                requirements[index].className = 'fas fa-circle';
                requirements[index].style.color = '#9ca3af';
            }
        }
    });
    
    // Update strength bar and text
    const percentage = (score / total) * 100;
    strengthBar.style.width = `${percentage}%`;
    
    if (score === 0) {
        strengthBar.style.background = '#9ca3af';
        strengthText.textContent = 'None';
        strengthText.style.color = '#9ca3af';
    } else if (score <= 2) {
        strengthBar.style.background = '#ef4444';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ef4444';
    } else if (score <= 3) {
        strengthBar.style.background = '#f59e0b';
        strengthText.textContent = 'Fair';
        strengthText.style.color = '#f59e0b';
    } else if (score <= 4) {
        strengthBar.style.background = '#3b82f6';
        strengthText.textContent = 'Good';
        strengthText.style.color = '#3b82f6';
    } else {
        strengthBar.style.background = '#10b981';
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#10b981';
    }
}

function checkPasswordMatch() {
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const matchIndicator = document.querySelector('.password-match');
    
    if (!matchIndicator) return;
    
    if (!newPassword || !confirmPassword) {
        matchIndicator.style.display = 'none';
        return;
    }
    
    matchIndicator.style.display = 'flex';
    
    if (newPassword === confirmPassword) {
        matchIndicator.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match';
        matchIndicator.style.color = '#10b981';
    } else {
        matchIndicator.innerHTML = '<i class="fas fa-times-circle"></i> Passwords do not match';
        matchIndicator.style.color = '#ef4444';
    }
}

// ======================
// STYLE UTILITIES
// ======================
function addProfilePictureStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .profile-picture-section {
            margin-bottom: 2rem;
        }
        
        .profile-upload-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 0.75rem;
            padding: 1.5rem;
        }
        
        .profile-preview-wrapper {
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
        }
        
        .profile-preview-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            position: relative;
            border: 3px solid var(--primary-color);
            cursor: pointer;
            flex-shrink: 0;
        }
        
        .profile-preview-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .profile-upload-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-size: 0.75rem;
        }
        
        .profile-preview-circle:hover .profile-upload-overlay {
            opacity: 1;
        }
        
        .profile-preview-circle:hover .profile-preview-image {
            transform: scale(1.1);
        }
        
       .profile-upload-overlay {
        opacity: 0; 
        transition: opacity 0.3s ease;
    }

        .profile-upload-details h5 {
            margin: 0 0 0.5rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .upload-hint {
            margin: 0 0 1rem 0;
            font-size: 0.875rem;
            color: var(--text-secondary);
            line-height: 1.5;
        }
        
        .profile-upload-controls {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }
        
        .btn-upload {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--primary-color);
            color: black;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
            border: none;
        }
        
        .btn-upload:hover {
            background: var(--primary-dark);
        }
        
        .btn-remove {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.3rem;
            background: transparent;
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .btn-remove:hover {
            background: var(--danger-light);
            color: var(--danger-color);
            border-color: var(--danger-color);
        }
        
        .file-input-hidden {
            display: none;
        }
        
        /* Profile Display Styles */
        .profile-picture-display {
            align-items: flex-start;
        }
        
        .profile-display-wrapper {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .profile-display-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            overflow: hidden;
            border: 2px solid var(--border-color);
            flex-shrink: 0;
        }
        
        .profile-display-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .profile-display-info {
            display: flex;
            flex-direction: column;
        }
        
        .profile-info-text {
            margin: 0;
            font-size: 0.875rem;
            color: var(--text-primary);
            font-weight: 500;
        }
        
        .profile-info-hint {
            margin: 0.25rem 0 0 0;
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
        
        .bio-text {
            line-height: 1.6;
            color: var(--text-secondary);
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
    `;
    document.head.appendChild(style);
}

function addPasswordStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .password-field {
            position: relative;
        }
        
        .toggle-password {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 5px;
            font-size: 0.9rem;
        }
        
        .toggle-password:hover {
            color: var(--text-primary);
        }
        
        .password-strength {
            margin-top: 0.5rem;
        }
        
        .strength-meter {
            height: 4px;
            background: var(--border-color);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 0.25rem;
        }
        
        .strength-bar {
            height: 100%;
            width: 0%;
            background: var(--danger-color);
            border-radius: 2px;
            transition: all 0.3s ease;
        }
        
        .strength-text {
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
        
        .strength-text span {
            font-weight: 600;
        }
        
        .password-requirements {
            margin-top: 0.75rem;
            padding: 0.75rem;
            background: var(--card-bg);
            border-radius: 0.5rem;
            border: 1px solid var(--border-color);
        }
        
        .requirement-title {
            margin: 0 0 0.5rem 0;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-secondary);
        }
        
        .requirements-list {
            margin: 0;
            padding: 0;
            list-style: none;
        }
        
        .requirements-list li {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-bottom: 0.25rem;
        }
        
        .requirements-list li:last-child {
            margin-bottom: 0;
        }
        
        .requirements-list li i {
            font-size: 0.5rem;
        }
        
        .password-match {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.5rem;
            font-size: 0.75rem;
            color: var(--success-color);
        }
        
        .password-match i {
            font-size: 0.75rem;
        }
        
        .password-masked {
            font-family: monospace;
            letter-spacing: 2px;
            color: var(--text-secondary);
            margin-right: 1rem;
        }
        
        .btn-change-password {
            padding: 0.25rem 0.75rem;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .btn-change-password:hover {
            background: var(--primary-dark);
        }
    `;
    document.head.appendChild(style);
}

// ======================
// PROFILE PICTURE HANDLING
// ======================
function initializeProfilePictureUpload() {
    const uploadLabel = document.querySelector('.btn-upload');
    const removeBtn = document.getElementById('remove-photo-btn');
    const fileInput = document.getElementById('profile-picture-upload');
    const profilePreview = document.getElementById('profile-preview');
    const profilePreviewImg = document.getElementById('profile-preview-img');
    
    if (!uploadLabel || !fileInput) return;
    
    // Upload button click triggers file input
    uploadLabel.addEventListener('click', () => fileInput.click());
    
    // Profile preview click also triggers file input
    profilePreview.addEventListener('click', () => fileInput.click());
    
    // File input change handler
    fileInput.addEventListener('change', handleProfilePictureUpload);
    
    // Remove photo button
    if (removeBtn) {
        removeBtn.addEventListener('click', removeProfilePicture);
    }
}

function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        showToast('Please select a valid image file (JPG, PNG, GIF)', 'error');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
    }
    
    // Store the file
    uploadedImageFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreviewUrl = e.target.result;
        const previewImg = document.getElementById('profile-preview-img');
        if (previewImg) {
            previewImg.src = imagePreviewUrl;
            previewImg.style.transform = 'scale(1.05)';
        }
        
        showToast('Profile picture uploaded successfully!', 'success');
    };
    
    reader.readAsDataURL(file);
}

function removeProfilePicture() {
    // Reset to default avatar
    const previewImg = document.getElementById('profile-preview-img');
    if (previewImg) {
        previewImg.src = 'https://ui-avatars.com/api/?name=John+Doe&background=4f46e5&color=fff&size=128';
        previewImg.style.transform = 'scale(1)';
    }
    
    // Clear uploaded file
    uploadedImageFile = null;
    imagePreviewUrl = null;
    
    // Reset file input
    const fileInput = document.getElementById('profile-picture-upload');
    if (fileInput) {
        fileInput.value = '';
    }
    
    showToast('Profile picture removed', 'info');
}

// ======================
// PROFILE EDIT HANDLERS
// ======================
function handleEditProfile() {
    const profileCard = document.querySelector('.settings-card');
    const cardBody = profileCard.querySelector('.card-body');
    const editProfileBtn = document.getElementById('edit-profile');
    
    if (!profileCard || !cardBody || !editProfileBtn) return;
    
    // Get current data
    const currentData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        jobTitle: 'Full Stack Developer',
        bio: 'Passionate full-stack developer with 3+ years of experience building web applications. Specialized in React, Node.js, and cloud technologies.',
        linkedin: '',
        github: '',
        website: ''
    };
    
    // Store current display content
    const originalContent = cardBody.innerHTML;
    cardBody.setAttribute('data-original-content', originalContent);
    
    // Replace with form
    cardBody.innerHTML = templates.profileForm(currentData);
    
    // Update edit button
    editProfileBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Editing';
    editProfileBtn.classList.remove('btn-outline', 'btn-sm');
    editProfileBtn.classList.add('btn-danger');
    editProfileBtn.id = 'cancel-edit-profile';
    
    // Initialize character counter
    const textarea = cardBody.querySelector('#bio');
    const charCounter = cardBody.querySelector('#bio-char-count');
    if (textarea && charCounter) {
        textarea.addEventListener('input', function() {
            const count = this.value.length;
            charCounter.textContent = count;
            charCounter.classList.toggle('near-limit', count > 400);
            charCounter.classList.toggle('over-limit', count > 500);
        });
    }
    
    // Initialize profile picture upload functionality
    initializeProfilePictureUpload();
    
    // Initialize password functionality
    initializePasswordFunctionality();
    
    // Form submission
    const form = cardBody.querySelector('#profile-edit-form');
    if (form) {
        form.addEventListener('submit', handleProfileFormSubmit);
    }
    
    // Add inline styles for profile picture section
    addProfilePictureStyles();
    addPasswordStyles();
}

function handleProfileFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Validate password if attempting to change
    const passwordValidation = validatePasswordForm();
    if (!passwordValidation.valid) {
        showToast(passwordValidation.message, 'error');
        return;
    }
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    // Get form data
    const formData = {
        firstName: form.querySelector('#firstName').value,
        lastName: form.querySelector('#lastName').value,
        email: form.querySelector('#email').value,
        phone: form.querySelector('#phone').value,
        location: form.querySelector('#location').value,
        jobTitle: form.querySelector('#jobTitle').value,
        bio: form.querySelector('#bio').value
    };
    
    // Determine which profile picture to use
    let finalProfilePicture = currentProfilePicture;
    
    // If there's a new uploaded image, use it
    if (imagePreviewUrl) {
        finalProfilePicture = imagePreviewUrl;
        currentProfilePicture = imagePreviewUrl;
        
        // Update sidebar avatar immediately
        const sidebarAvatar = document.querySelector('.user-info .user-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.src = imagePreviewUrl;
            sidebarAvatar.style.width = '64px';
            sidebarAvatar.style.height = '64px';
            sidebarAvatar.style.borderRadius = '50%';
            sidebarAvatar.style.objectFit = 'cover';
        }
    }
    
    // Simulate API call - check password change
    const currentPassword = form.querySelector('#currentPassword').value;
    const newPassword = form.querySelector('#newPassword').value;
    const isChangingPassword = currentPassword && newPassword;

    // Persist updated data back to defaultSettings so a subsequent Edit pre-fills correctly
    defaultSettings.profile = {
      ...defaultSettings.profile,
      ...formData,
    };
    
    // Simulate API call
    setTimeout(() => {
        // Update display
        const cardBody = document.querySelector('.settings-card .card-body');
        cardBody.innerHTML = templates.profileDisplay(formData, finalProfilePicture);
        
        // Reset edit button
        const editBtn = document.getElementById('cancel-edit-profile');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.classList.remove('btn-danger');
            editBtn.classList.add('btn-outline', 'btn-sm');
            editBtn.id = 'edit-profile';
        }
        
        // Show appropriate success message
        if (isChangingPassword) {
            showToast('Profile and password updated successfully!', 'success');
            
            // Clear password fields for next time
            SettingsStorage.saveSetting('password_changed', true);
            
            // Log password change (in real app, this would be an API call)
            console.log('Password changed successfully');
        } else {
            showToast('Profile updated successfully!', 'success');
        }
        
        // Clear upload state
        uploadedImageFile = null;
    }, 1500);
}

function handleCancelProfileEdit() {
    const cardBody = document.querySelector('.settings-card .card-body');
    const editBtn = document.getElementById('cancel-edit-profile');
    
    if (!cardBody || !editBtn) return;
    
    // Restore original content
    const originalContent = cardBody.getAttribute('data-original-content');
    if (originalContent) {
        cardBody.innerHTML = originalContent;
    }
    
    // Reset button
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editBtn.classList.remove('btn-danger');
    editBtn.classList.add('btn-outline', 'btn-sm');
    editBtn.id = 'edit-profile';
    
    // Clear upload state
    uploadedImageFile = null;
    imagePreviewUrl = null;
}

// ======================
// BILLING EDIT HANDLERS
// ======================
function handleEditBilling() {
    const billingInfo = document.querySelector('.billing-info');
    const editBillingBtn = document.getElementById('edit-billing');
    
    if (!billingInfo || !editBillingBtn) return;
    
    // Get current data
    const currentData = {
        billingName: 'John Doe',
        company: 'N/A',
        address: '123 Main St, San Francisco, CA 94105',
        taxId: '',
        country: 'US',
        countryText: 'United States'
    };
    
    // Store current display content
    const originalContent = billingInfo.innerHTML;
    billingInfo.setAttribute('data-original-content', originalContent);
    
    // Replace with form
    billingInfo.innerHTML = templates.billingForm(currentData);
    
    // Update button
    editBillingBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
    editBillingBtn.classList.remove('btn-outline');
    editBillingBtn.classList.add('btn-danger');
    editBillingBtn.id = 'cancel-edit-billing';
    
    // Form submission
    const form = billingInfo.querySelector('#billing-edit-form');
    if (form) {
        form.addEventListener('submit', handleBillingFormSubmit);
    }
}

function handleBillingFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    // Get form data
    const countrySelect = form.querySelector('#country');
    const formData = {
        billingName: form.querySelector('#billingName').value,
        company: form.querySelector('#company').value,
        address: form.querySelector('#address').value,
        taxId: form.querySelector('#taxId').value,
        country: countrySelect.value,
        countryText: countrySelect.options[countrySelect.selectedIndex].text
    };
    
    setTimeout(() => {
        // Update display
        const billingInfo = document.querySelector('.billing-info');
        billingInfo.innerHTML = templates.billingDisplay(formData);
        
        // Reset button
        const editBtn = document.getElementById('cancel-edit-billing');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.classList.remove('btn-danger');
            editBtn.classList.add('btn-outline');
            editBtn.id = 'edit-billing';
        }
        
        showToast('Billing information updated!', 'success');
    }, 1500);
}

function handleCancelBillingEdit() {
    const billingInfo = document.querySelector('.billing-info');
    const editBtn = document.getElementById('cancel-edit-billing');
    
    if (!billingInfo || !editBtn) return;
    
    // Restore original content
    const originalContent = billingInfo.getAttribute('data-original-content');
    if (originalContent) {
        billingInfo.innerHTML = originalContent;
    }
    
    // Reset button
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editBtn.classList.remove('btn-danger');
    editBtn.classList.add('btn-outline');
    editBtn.id = 'edit-billing';
}

// ======================
// PAYMENT METHOD HANDLERS
// ======================
function handleEditPaymentMethod(editBtn) {
    const paymentMethod = editBtn.closest('.payment-method');
    const details = paymentMethod.querySelector('.method-details');
    
    if (!details) return;
    
    // Get current data
    const cardText = details.querySelector('h4').textContent;
    const expiryText = details.querySelector('p').textContent;
    
    const currentNumber = cardText.split('ending in ')[1]?.replace(')', '') || '4242';
    const currentExpiry = expiryText.split('Expires ')[1] || '05/2025';
    
    // Store original content
    const originalHTML = details.innerHTML;
    details.setAttribute('data-original', originalHTML);
    
    // Replace with edit form
    details.innerHTML = templates.paymentEditForm(currentNumber, currentExpiry);
    
    // Disable action buttons during edit
    const actions = paymentMethod.querySelector('.method-actions');
    if (actions) {
        actions.style.opacity = '0.3';
        actions.style.pointerEvents = 'none';
    }
}

function handleSavePaymentEdit(form) {
    const details = form.closest('.method-details');
    const paymentMethod = form.closest('.payment-method');
    
    if (!details || !paymentMethod) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;
    
    // Get form data
    const cardNumber = form.querySelector('.payment-card-number').value;
    const expiryDate = form.querySelector('.payment-expiry').value;
    
    // Extract last 4 digits
    const lastFour = cardNumber.replace(/\D/g, '').slice(-4);
    
    // Determine card type
    const cardType = paymentMethod.querySelector('.method-icon').classList.contains('visa') ? 'Visa' : 
                   paymentMethod.querySelector('.method-icon').classList.contains('mastercard') ? 'Mastercard' : 'Card';
    
    setTimeout(() => {
        // Update display
        details.innerHTML = `
            <h4>${cardType} ending in ${lastFour}</h4>
            <p>Expires ${expiryDate}</p>
        `;
        
        // Re-enable action buttons
        const actions = paymentMethod.querySelector('.method-actions');
        if (actions) {
            actions.style.opacity = '1';
            actions.style.pointerEvents = 'auto';
        }
        
        showToast('Payment method updated!', 'success');
    }, 1000);
}

function handleCancelPaymentEdit(cancelBtn) {
    const details = cancelBtn.closest('.method-details');
    const paymentMethod = cancelBtn.closest('.payment-method');
    
    if (!details || !paymentMethod) return;
    
    // Restore original content
    const originalHTML = details.getAttribute('data-original');
    if (originalHTML) {
        details.innerHTML = originalHTML;
    }
    
    // Re-enable action buttons
    const actions = paymentMethod.querySelector('.method-actions');
    if (actions) {
        actions.style.opacity = '1';
        actions.style.pointerEvents = 'auto';
    }
}

function handleDeletePaymentMethod(deleteBtn) {
    const paymentMethod = deleteBtn.closest('.payment-method');
    const methodName = paymentMethod.querySelector('h4').textContent;
    
    if (confirm(`Are you sure you want to remove ${methodName}?`)) {
        // Add fade-out animation
        paymentMethod.style.transition = 'all 0.3s ease';
        paymentMethod.style.opacity = '0';
        paymentMethod.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            paymentMethod.remove();
            showToast('Payment method removed!', 'success');
            
            // Show empty state if no payment methods left
            const paymentMethodsContainer = document.querySelector('.payment-methods');
            if (paymentMethodsContainer && paymentMethodsContainer.children.length === 0) {
                paymentMethodsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-credit-card"></i>
                        <h4>No Payment Methods</h4>
                        <p>Add a payment method to get started</p>
                        <button class="btn btn-primary" id="add-first-payment-method">
                            <i class="fas fa-plus"></i> Add Payment Method
                        </button>
                    </div>
                `;
                
                // Re-attach event listener to new button
                const addFirstBtn = document.getElementById('add-first-payment-method');
                if (addFirstBtn) {
                    addFirstBtn.addEventListener('click', showAddPaymentModal);
                }
            }
        }, 300);
    }
}

// ======================
// ADD PAYMENT METHOD MODAL
// ======================
function showAddPaymentModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    
    const modalContent = `
        <div class="payment-modal" style="background: white; border-radius: 1rem; padding: 2rem; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; animation: slideUp 0.3s ease;">
            <div class="modal-header" style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;"><i class="fas fa-credit-card"></i> Add Payment Method</h3>
                    <button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
                </div>
                <p style="margin-top: 0.5rem; color: var(--text-secondary);">Add a new credit or debit card</p>
            </div>
            <form id="add-payment-form">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Card Number</label>
                    <input type="text" class="form-control" placeholder="1234 5678 9012 3456" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Expiry Date</label>
                        <input type="text" class="form-control" placeholder="MM/YY" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem;">
                    </div>
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">CVC</label>
                        <input type="text" class="form-control" placeholder="123" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem;">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Cardholder Name</label>
                    <input type="text" class="form-control" value="John Doe" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem;">
                </div>
                <div class="form-check" style="margin-bottom: 1.5rem;">
                    <input type="checkbox" id="set-as-default" checked style="margin-right: 0.5rem;">
                    <label for="set-as-default" style="font-weight: 500;">Set as default payment method</label>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button type="button" class="btn btn-outline close-modal" style="flex: 1;">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="flex: 1;">Add Card</button>
                </div>
            </form>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Close modal handlers
    modal.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                modal.remove();
                style.remove();
            }, 300);
        });
    });
    
    // Form submission
    modal.querySelector('#add-payment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            // Create new payment method element
            const cardNumber = this.querySelector('input[placeholder="1234 5678 9012 3456"]').value;
            const lastFour = cardNumber.replace(/\D/g, '').slice(-4);
            const expiry = this.querySelector('input[placeholder="MM/YY"]').value;
            const isDefault = this.querySelector('#set-as-default').checked;
            
            const cardType = Math.random() > 0.5 ? 'visa' : 'mastercard';
            const cardTypeText = cardType === 'visa' ? 'Visa' : 'Mastercard';
            
            const newPaymentMethod = document.createElement('div');
            newPaymentMethod.className = `payment-method ${isDefault ? 'default' : ''}`;
            newPaymentMethod.innerHTML = `
                <div class="method-icon ${cardType}">
                    <i class="fab fa-cc-${cardType}"></i>
                </div>
                <div class="method-details">
                    <h4>${cardTypeText} ending in ${lastFour}</h4>
                    <p>Expires ${expiry}</p>
                </div>
                <div class="method-actions">
                    <button class="btn-icon" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add to payment methods list
            const paymentMethodsContainer = document.querySelector('.payment-methods');
            if (paymentMethodsContainer.querySelector('.empty-state')) {
                paymentMethodsContainer.innerHTML = '';
            }
            paymentMethodsContainer.appendChild(newPaymentMethod);
            
            // Close modal
            modal.remove();
            style.remove();
            
            // Show success message
            showToast('Payment method added successfully!', 'success');
        }, 1500);
    });
}

// ======================
// VIEW ALL INVOICES FUNCTIONALITY
// ======================
function handleViewAllInvoices() {
    const billingTable = document.querySelector('.billing-table');
    const tableBody = billingTable.querySelector('tbody');
    const originalRows = tableBody.innerHTML;
    const button = document.getElementById('view-all-invoices');
    
    // Create expanded view
    const expandedHTML = `
        <tr>
            <td>Dec 1, 2023</td>
            <td>Pro Plan - Monthly</td>
            <td>$19.99</td>
            <td><span class="status-badge paid">Paid</span></td>
            <td><button class="btn-link view-invoice">View</button></td>
        </tr>
        <tr>
            <td>Nov 1, 2023</td>
            <td>Pro Plan - Monthly</td>
            <td>$19.99</td>
            <td><span class="status-badge paid">Paid</span></td>
            <td><button class="btn-link view-invoice">View</button></td>
        </tr>
        <tr>
            <td>Oct 1, 2023</td>
            <td>Pro Plan - Monthly</td>
            <td>$19.99</td>
            <td><span class="status-badge paid">Paid</span></td>
            <td><button class="btn-link view-invoice">View</button></td>
        </tr>
        <tr>
            <td>Sep 1, 2023</td>
            <td>Basic to Pro Upgrade</td>
            <td>$9.99</td>
            <td><span class="status-badge paid">Paid</span></td>
            <td><button class="btn-link view-invoice">View</button></td>
        </tr>
        <tr>
            <td>Aug 1, 2023</td>
            <td>Basic Plan - Monthly</td>
            <td>$9.99</td>
            <td><span class="status-badge paid">Paid</span></td>
            <td><button class="btn-link view-invoice">View</button></td>
        </tr>
    `;
    
    if (button.textContent.includes('View All')) {
        tableBody.innerHTML = expandedHTML;
        button.innerHTML = 'Show Less';
        button.classList.add('active');
        
        // Initialize invoice view buttons
        document.querySelectorAll('.view-invoice').forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                const date = row.children[0].textContent;
                const description = row.children[1].textContent;
                const amount = row.children[2].textContent;
                
                showToast(`Opening invoice: ${description} (${date}) - ${amount}`, 'info');
            });
        });
    } else {
        tableBody.innerHTML = originalRows;
        button.innerHTML = 'View All';
        button.classList.remove('active');
    }
}

// ======================
// PLATFORM CONNECTIONS
// ======================
function connectPlatform(platform, card, button) {
    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Update UI
        card.classList.remove('available');
        card.classList.add('connected');
        card.dataset.status = 'connected';
        
        // Update button
        button.innerHTML = '<i class="fas fa-unlink"></i> Disconnect';
        button.classList.remove('btn-primary');
        button.classList.add('btn-danger');
        button.title = 'Click to disconnect';
        
        // Update status badge
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = 'status-badge connected';
            statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
        }
        
        // Update platform icon
        const platformIcon = card.querySelector('.platform-icon');
        if (platformIcon) {
            platformIcon.classList.remove('available');
            platformIcon.classList.add('connected');
        }
        
        // Update platform stats
        const statsContainer = card.querySelector('.platform-stats');
        if (statsContainer) {
            // Add sync time
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Keep first two stat items, replace third with sync time
            const statItems = statsContainer.querySelectorAll('.stat-item');
            if (statItems.length >= 3) {
                statItems[2].innerHTML = `<i class="fas fa-sync"></i> Synced: ${timeString}`;
            }
        }
        
        // Enable button
        button.disabled = false;
        
        // Update stats
        updatePlatformStats();
        
        // Show success message
        showToast(`${getPlatformName(platform)} connected successfully!`, 'success');
    }, 1000);
}

function disconnectPlatform(platform, card, button) {
    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disconnecting...';
    button.disabled = true;
    
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to disconnect ${getPlatformName(platform)}?`)) {
        button.innerHTML = '<i class="fas fa-unlink"></i> Disconnect';
        button.disabled = false;
        return;
    }
    
    // Simulate API call
    setTimeout(() => {
        // Update UI
        card.classList.remove('connected');
        card.classList.add('available');
        card.dataset.status = 'available';
        
        // Update button
        button.innerHTML = '<i class="fas fa-plug"></i> Connect';
        button.classList.remove('btn-danger');
        button.classList.add('btn-primary');
        button.title = 'Click to connect';
        
        // Update status badge
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = 'status-badge available';
            statusBadge.innerHTML = '<i class="fas fa-plug"></i> Available';
        }
        
        // Update platform icon
        const platformIcon = card.querySelector('.platform-icon');
        if (platformIcon) {
            platformIcon.classList.remove('connected');
            platformIcon.classList.add('available');
        }
        
        // Reset platform stats for available platforms
        const statsContainer = card.querySelector('.platform-stats');
        if (statsContainer) {
            const platformName = getPlatformName(platform);
            const statItems = statsContainer.querySelectorAll('.stat-item');
            
            // Reset to default stats based on platform
            switch(platform) {
                case 'github':
                    if (statItems.length >= 3) {
                        statItems[0].innerHTML = '<i class="fas fa-code-branch"></i> Import repositories';
                        statItems[1].innerHTML = '<i class="fas fa-chart-line"></i> Contribution history';
                        statItems[2].innerHTML = '<i class="fas fa-project-diagram"></i> Project showcase';
                    }
                    break;
                case 'pluralsight':
                    if (statItems.length >= 3) {
                        statItems[0].innerHTML = '<i class="fas fa-graduation-cap"></i> Skill assessments';
                        statItems[1].innerHTML = '<i class="fas fa-chart-bar"></i> Learning paths';
                        statItems[2].innerHTML = '<i class="fas fa-star"></i> Skill IQ';
                    }
                    break;
                default:
                    // Generic reset
                    if (statItems.length >= 3) {
                        statItems[2].innerHTML = '<i class="fas fa-sync"></i> Connect to sync';
                    }
            }
        }
        
        // Enable button
        button.disabled = false;
        
        // Update stats
        updatePlatformStats();
        
        // Show message
        showToast(`${getPlatformName(platform)} disconnected.`, 'info');
    }, 1000);
}

function syncPlatform(platform, button) {
    // Show loading state
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Restore button
        button.innerHTML = originalText;
        button.disabled = false;
        
        // Update sync time in the card
        const card = button.closest('.platform-card');
        const statItems = card.querySelectorAll('.stat-item');
        if (statItems.length >= 3) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            statItems[2].innerHTML = `<i class="fas fa-sync"></i> Synced: ${timeString}`;
        }
        
        // Show success message
        showToast(`${getPlatformName(platform)} synced successfully!`, 'success');
    }, 1500);
}

function syncAllPlatforms() {
    const button = document.getElementById('sync-all-platforms');
    if (!button) return;
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing All...';
    button.disabled = true;
    
    setTimeout(() => {
        document.querySelectorAll('.platform-card.connected').forEach(card => {
            const statItems = card.querySelectorAll('.stat-item');
            if (statItems.length >= 3) {
                const now = new Date();
                const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                statItems[2].innerHTML = `<i class="fas fa-sync"></i> Synced: ${timeString}`;
            }
        });
        
        button.innerHTML = originalText;
        button.disabled = false;
        showToast('All platforms synced successfully!', 'success');
    }, 3000);
}

function connectAllAvailablePlatforms() {
    const availableCards = document.querySelectorAll('.platform-card.available');
    if (availableCards.length === 0) {
        showToast('No available platforms to connect.', 'info');
        return;
    }
    
    const button = document.getElementById('connect-all-available');
    if (!button) return;
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting All...';
    button.disabled = true;
    
    let connectedCount = 0;
    const total = availableCards.length;
    
    availableCards.forEach((card, index) => {
        setTimeout(() => {
            const platform = card.dataset.platform;
            const connectButton = card.querySelector('.btn-connect-toggle');
            
            if (connectButton) {
                // Simulate connection
                card.classList.remove('available');
                card.classList.add('connected');
                card.dataset.status = 'connected';
                
                connectButton.innerHTML = '<i class="fas fa-unlink"></i> Disconnect';
                connectButton.classList.remove('btn-primary');
                connectButton.classList.add('btn-danger');
                
                connectedCount++;
                
                if (connectedCount === total) {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    updatePlatformStats();
                    showToast(`Successfully connected to ${connectedCount} platform${connectedCount > 1 ? 's' : ''}!`, 'success');
                }
            }
        }, index * 500); // Stagger connections
    });
}

function filterPlatforms(filter) {
    const allCards = document.querySelectorAll('.platform-card');
    
    allCards.forEach(card => {
        switch(filter) {
            case 'all':
                card.style.display = 'flex';
                break;
            case 'connected':
                if (card.classList.contains('connected')) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
                break;
            case 'available':
                if (card.classList.contains('available')) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
                break;
        }
    });
}

function updatePlatformStats() {
    const connectedCount = document.querySelectorAll('.platform-card.connected').length;
    const availableCount = document.querySelectorAll('.platform-card.available').length;
    
    const connectedCountElement = document.querySelector('.connected-count');
    const availableCountElement = document.querySelector('.available-count');
    
    if (connectedCountElement) {
        connectedCountElement.textContent = `${connectedCount} Connected`;
    }
    
    if (availableCountElement) {
        availableCountElement.textContent = `${availableCount} Available`;
    }
    
    // Update connection status summary if exists
    const connectionSummary = document.querySelector('.connection-summary');
    if (connectionSummary) {
        const totalPlatforms = connectedCount + availableCount;
        const summaryStat = connectionSummary.querySelector('.summary-stat:nth-child(1) .stat-value');
        if (summaryStat) {
            summaryStat.textContent = `${connectedCount}/${totalPlatforms}`;
        }
    }
}

// ======================
// PASSWORD FUNCTIONALITY
// ======================
function initializePasswordFunctionality() {
    // Password strength checker
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            checkPasswordMatch();
        });
    }
    
    // Password confirmation checker
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    // Initialize strength display
    updatePasswordStrength('');
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
                icon.title = 'Hide password';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
                icon.title = 'Show password';
            }
        });
    });
}

// ======================
// MAIN DOMContentLoaded
// ======================
document.addEventListener('DOMContentLoaded', function() {
    // Section Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.settings-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Get target section
            const target = this.getAttribute('data-section');
            
            // Hide all sections
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            document.getElementById(`${target}-section`).classList.add('active');
            
            // Update platform stats when connections section is opened
            if (target === 'connections') {
                updatePlatformStats();
            }
        });
    });
    
    // Quiet Hours Toggle
    const quietHoursToggle = document.getElementById('quiet-hours');
    const quietHoursSchedule = document.getElementById('quiet-hours-schedule');
    
    if (quietHoursToggle) {
        quietHoursToggle.addEventListener('change', function() {
            if (this.checked) {
                quietHoursSchedule.style.opacity = '1';
                quietHoursSchedule.style.pointerEvents = 'auto';
            } else {
                quietHoursSchedule.style.opacity = '0.5';
                quietHoursSchedule.style.pointerEvents = 'none';
            }
        });
        
        // Initialize state
        quietHoursToggle.dispatchEvent(new Event('change'));
    }
    
    // ======================
    // EVENT DELEGATION
    // ======================
    document.addEventListener('click', function(e) {
        // Profile Edit
        if (e.target.closest('#edit-profile')) {
            e.preventDefault();
            handleEditProfile();
        }
        
        // Cancel Profile Edit
        else if (e.target.closest('#cancel-edit-profile') || e.target.closest('#cancel-profile-edit')) {
            e.preventDefault();
            handleCancelProfileEdit();
        }
        
        // Change Password Button
        else if (e.target.closest('#change-password-btn')) {
            e.preventDefault();
            handleEditProfile(); // Reopen edit form
        }
        
        // Billing Edit
        else if (e.target.closest('#edit-billing')) {
            e.preventDefault();
            handleEditBilling();
        }
        
        // Cancel Billing Edit
        else if (e.target.closest('#cancel-edit-billing') || e.target.closest('#cancel-billing-edit')) {
            e.preventDefault();
            handleCancelBillingEdit();
        }
        
        // Edit Payment Method
        else if (e.target.closest('.method-actions .btn-icon[title="Edit"]') || 
                e.target.closest('.method-actions .fa-edit')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.btn-icon') || e.target.closest('.fa-edit').closest('.btn-icon');
            handleEditPaymentMethod(btn);
        }
        
        // Delete Payment Method
        else if (e.target.closest('.method-actions .btn-icon[title="Remove"]') || 
                 e.target.closest('.method-actions .fa-trash')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.btn-icon') || e.target.closest('.fa-trash').closest('.btn-icon');
            handleDeletePaymentMethod(btn);
        }
        
        // Cancel Payment Edit
        else if (e.target.closest('.cancel-payment-edit')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.cancel-payment-edit');
            handleCancelPaymentEdit(btn);
        }
        
        // Save Payment Edit
        else if (e.target.closest('.payment-edit-form button[type="submit"]')) {
            e.preventDefault();
            e.stopPropagation();
            const form = e.target.closest('.payment-edit-form');
            handleSavePaymentEdit(form);
        }

        // Eye icon toggle functionality 
        if (e.target.closest('.toggle-password') || 
            e.target.classList.contains('fa-eye') || 
            e.target.classList.contains('fa-eye-slash')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.closest('.toggle-password') || e.target.parentElement;
            if (button) {
                const targetId = button.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = button.querySelector('i');
                
                if (input && icon) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.className = 'fas fa-eye-slash';
                        icon.title = 'Hide password';
                    } else {
                        input.type = 'password';
                        icon.className = 'fas fa-eye';
                        icon.title = 'Show password';
                    }
                }
            }
        }
        
        // Platform connection toggle
        else if (e.target.closest('.btn-connect-toggle')) {
            e.preventDefault();
            const button = e.target.closest('.btn-connect-toggle');
            const platformCard = button.closest('.platform-card');
            const platform = platformCard.dataset.platform;
            const isConnected = platformCard.classList.contains('connected');
            
            // Toggle connection state
            if (isConnected) {
                disconnectPlatform(platform, platformCard, button);
            } else {
                connectPlatform(platform, platformCard, button);
            }
        }
        
        // Sync individual platform
        else if (e.target.closest('.btn-sync')) {
            e.preventDefault();
            const button = e.target.closest('.btn-sync');
            const platformCard = button.closest('.platform-card');
            const platform = platformCard.dataset.platform;
            syncPlatform(platform, button);
        }
        
        // Platform tab filtering
        else if (e.target.closest('.platform-tab')) {
            e.preventDefault();
            const tab = e.target.closest('.platform-tab');
            const tabType = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Filter platforms
            filterPlatforms(tabType);
        }
        
        // Sync all platforms
        else if (e.target.closest('#sync-all-platforms')) {
            e.preventDefault();
            syncAllPlatforms();
        }
        
        // Connect all available platforms
        else if (e.target.closest('#connect-all-available')) {
            e.preventDefault();
            connectAllAvailablePlatforms();
        }
    });
    
    
    // ======================
    // INITIALIZE COMPONENTS
    // ======================
    
    // Add Payment Method Button
    const addPaymentMethodBtn = document.getElementById('add-payment-method');
    if (addPaymentMethodBtn) {
        addPaymentMethodBtn.addEventListener('click', showAddPaymentModal);
    }
    
    // View All Invoices Button
    const viewAllInvoicesBtn = document.getElementById('view-all-invoices');
    if (viewAllInvoicesBtn) {
        viewAllInvoicesBtn.addEventListener('click', handleViewAllInvoices);
    }
    
    // Save Notification Settings Button
    const saveNotificationBtn = document.querySelector('.quiet-hours-controls + .btn-primary');
    if (saveNotificationBtn) {
        saveNotificationBtn.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Saved!';
            this.classList.add('btn-success');
            
            // Get all notification settings
            const settings = {
                email: document.getElementById('email-notifications')?.checked,
                push: document.getElementById('push-notifications')?.checked,
                sms: document.getElementById('sms-notifications')?.checked,
                quietHours: document.getElementById('quiet-hours')?.checked
            };
            
            setTimeout(() => {
                this.innerHTML = originalText;
                this.classList.remove('btn-success');
                showToast('Notification settings saved!', 'success');
            }, 2000);
        });
    }
    
    // Save Preferences Button
    const savePreferencesBtn = document.querySelector('.preference-group + .btn-primary');
    if (savePreferencesBtn) {
        savePreferencesBtn.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Saved!';
            this.classList.add('btn-success');
            
            setTimeout(() => {
                this.innerHTML = originalText;
                this.classList.remove('btn-success');
                showToast('Preferences saved successfully!', 'success');
            }, 2000);
        });
    }
    
    // View Sync History Button
    const viewSyncHistoryBtn = document.querySelector('.sync-actions .btn-outline');
    if (viewSyncHistoryBtn) {
        viewSyncHistoryBtn.addEventListener('click', function() {
            showToast('Sync history would open in a modal here.', 'info');
        });
    }
    
    // Danger Zone Actions
    const exportDataBtn = document.querySelector('.danger-action:nth-child(1) .btn-outline');
    const deactivateAccountBtn = document.querySelector('.danger-action:nth-child(2) .btn-outline');
    const deleteAccountBtn = document.querySelector('.danger-action:nth-child(3) .btn-danger');
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
            this.disabled = true;
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-download"></i> Export Data';
                this.disabled = false;
                showToast('Your data export has been started. You will receive an email with download link.', 'success');
            }, 2000);
        });
    }
    
    if (deactivateAccountBtn) {
        deactivateAccountBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to deactivate your account? You can reactivate at any time by logging in.')) {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                this.disabled = true;
                
                setTimeout(() => {
                    showToast('Account deactivation process started. You will receive a confirmation email.', 'warning');
                    this.innerHTML = '<i class="fas fa-user-slash"></i> Deactivate';
                    this.disabled = false;
                }, 1500);
            }
        });
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            if (confirm('WARNING: This will permanently delete your account and all associated data. This action cannot be undone.')) {
                const password = prompt('Please enter your password to confirm account deletion:');
                if (password) {
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                    this.disabled = true;
                    
                    setTimeout(() => {
                        showToast('Account deletion process initiated. You will receive a confirmation email.', 'danger');
                        this.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Account';
                        this.disabled = false;
                    }, 2000);
                }
            }
        });
    }
    
    // View All Achievements Button
    const viewAllAchievementsBtn = document.getElementById('view-all-achievements');
    if (viewAllAchievementsBtn) {
        viewAllAchievementsBtn.addEventListener('click', function() {
            showToast('Achievements modal would open here.', 'info');
        });
    }
    
    // View All Ways to Earn Button
    const viewAllWaysBtn = document.getElementById('view-all-ways');
    if (viewAllWaysBtn) {
        viewAllWaysBtn.addEventListener('click', function() {
            showToast('All earning methods would be displayed here.', 'info');
        });
    }
    
    // Initialize day checkboxes
    const dayCheckboxes = document.querySelectorAll('.day-checkbox input');
    dayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const parent = this.closest('.day-checkbox');
            if (this.checked) {
                parent.style.background = 'var(--primary-color)';
                parent.style.color = 'white';
                parent.style.borderColor = 'var(--primary-color)';
            } else {
                parent.style.background = 'transparent';
                parent.style.color = 'var(--text-primary)';
                parent.style.borderColor = 'var(--border-color)';
            }
        });
        
        checkbox.dispatchEvent(new Event('change'));
    });
    
    // Initialize platform stats on load
    updatePlatformStats();
});
// ── SkillHub layout integration + real user data ─────────────────────────────
(function () {
  const user = SkillHub.requireAuth();
  if (!user) return;
  if (typeof buildLayout === 'function') {
    buildLayout({ page: 'settings', role: user.role, title: 'Settings' });
  }

  // ── Load real profile data ────────────────────────────────────────────────
  async function loadUserProfile() {
    // 1. Populate immediately from the cached session token (instant, no flash)
    populateProfileFromUser(user);

    // 2. Fetch fresh data from the API and re-populate
    try {
      const res = await SkillHub.profile();
      const fresh = res.data || res;
      populateProfileFromUser(fresh);
    } catch (e) {
      console.warn('Could not refresh profile from API, using session cache.', e);
    }
  }

  function populateProfileFromUser(u) {
    if (!u) return;

    const firstName  = u.firstName  || u.first_name  || (u.name ? u.name.split(' ')[0] : '') || '';
    const lastName   = u.lastName   || u.last_name   || (u.name ? u.name.split(' ').slice(1).join(' ') : '') || '';
    const fullName   = [firstName, lastName].filter(Boolean).join(' ') || u.name || '';
    const email      = u.email      || '';
    const phone      = u.phone      || u.phoneNumber || '';
    const location   = u.location   || '';
    const jobTitle   = u.jobTitle   || u.job_title   || u.title || '';
    const bio        = u.bio        || '';
    const avatarUrl  = u.avatar     || u.profilePicture || u.avatarUrl ||
                       `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=4f46e5&color=fff&size=128`;

    // Update the global profile picture variable so the edit form uses the right picture
    currentProfilePicture = avatarUrl;

    // ── Static display fields in Account Settings card ──
    const nameEl     = document.getElementById('profile-name');
    const emailEl    = document.getElementById('profile-email');
    const phoneEl    = document.getElementById('profile-phone');
    const locationEl = document.getElementById('profile-location');
    const titleEl    = document.getElementById('profile-jobtitle');

    if (nameEl)     nameEl.textContent     = fullName   || '—';
    if (emailEl)    emailEl.textContent    = email      || '—';
    if (phoneEl)    phoneEl.textContent    = phone      || '—';
    if (locationEl) locationEl.textContent = location   || '—';
    if (titleEl)    titleEl.textContent    = jobTitle   || '—';

    // ── Sidebar user card ──
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarName   = document.getElementById('sidebar-name');
    const sidebarEmail  = document.getElementById('sidebar-email');

    if (sidebarAvatar) sidebarAvatar.src = avatarUrl;
    if (sidebarName)   sidebarName.textContent  = fullName || 'Your Name';
    if (sidebarEmail)  sidebarEmail.textContent = email    || '';

    // ── Patch the edit form defaults so they pre-fill correctly ──
    // Override defaultSettings.profile with real data
    defaultSettings.profile = {
      ...defaultSettings.profile,
      firstName,
      lastName,
      email,
      phone,
      location,
      jobTitle,
      bio,
      profilePicture: avatarUrl,
      linkedin: u.linkedin || u.linkedinUrl || '',
      github:   u.github   || u.githubUrl   || '',
      website:  u.website  || u.websiteUrl  || '',
    };
  }

  // ── Also patch handleEditProfile to use real data ─────────────────────────
  const _origHandleEditProfile = handleEditProfile;
  window.handleEditProfile = function () {
    const profileCard = document.querySelector('#account-section .settings-card');
    const cardBody    = profileCard ? profileCard.querySelector('.card-body') : null;
    const editBtn     = document.getElementById('edit-profile');
    if (!profileCard || !cardBody || !editBtn) return;

    const d = defaultSettings.profile; // already patched with real data above
    const originalContent = cardBody.innerHTML;
    cardBody.setAttribute('data-original-content', originalContent);
    cardBody.innerHTML = templates.profileForm(d);

    editBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Editing';
    editBtn.classList.remove('btn-outline', 'btn-sm');
    editBtn.classList.add('btn-danger');
    editBtn.id = 'cancel-edit-profile';

    const textarea   = cardBody.querySelector('#bio');
    const charCounter = cardBody.querySelector('#bio-char-count');
    if (textarea && charCounter) {
      textarea.addEventListener('input', function () {
        charCounter.textContent = this.value.length;
        charCounter.classList.toggle('near-limit', this.value.length > 400);
      });
    }

    initializeProfilePictureUpload();
    initializePasswordFunctionality();

    const form = cardBody.querySelector('#profile-edit-form');
    if (form) form.addEventListener('submit', handleProfileFormSubmit);

    addProfilePictureStyles();
    addPasswordStyles();
  };

  // Run on page load
  loadUserProfile();
})();