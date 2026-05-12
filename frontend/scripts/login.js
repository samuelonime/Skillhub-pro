// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Account Type Elements
    const accountTypes = document.querySelectorAll('.account-type');
    const studentFields = document.querySelector('.student-field');
    const employerFields = document.querySelector('.employer-field');
    const instructorFields = document.querySelector('.instructor-field');
    
    // Form Elements
    const registrationForm = document.getElementById('registrationForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const termsCheckbox = document.getElementById('terms');
    const submitBtn = document.getElementById('submitBtn');
    
    // Password Strength Elements
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    // Error Elements
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const termsError = document.getElementById('termsError');
    
    // Modal Elements
    const successModal = document.getElementById('successModal');
    const modalMessage = document.getElementById('modalMessage');
    const goToDashboardBtn = document.getElementById('goToDashboard');
    const closeModalBtn = document.getElementById('closeModal');
    
    // Social Buttons
    const googleBtn = document.querySelector('.google-btn');
    const linkedinBtn = document.querySelector('.linkedin-btn');
    const githubBtn = document.querySelector('.github-btn');
    
    // Current selected account type
    let selectedAccountType = 'student';
    
    // Initialize
    init();
    
    function init() {
        // Set student as default selected account type
        selectAccountType('student');
        
        // Set up event listeners
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Account type selection
        accountTypes.forEach(type => {
            type.addEventListener('click', function() {
                const typeValue = this.getAttribute('data-type');
                selectAccountType(typeValue);
            });
        });
        
        // Toggle password visibility
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
        
        // Password strength indicator
        passwordInput.addEventListener('input', updatePasswordStrength);
        
        // Form validation on input
        fullNameInput.addEventListener('blur', validateName);
        emailInput.addEventListener('blur', validateEmail);
        passwordInput.addEventListener('blur', validatePassword);
        confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
        termsCheckbox.addEventListener('change', validateTerms);
        
        // Form submission
        registrationForm.addEventListener('submit', handleFormSubmit);
        
        // Modal buttons
        goToDashboardBtn.addEventListener('click', goToDashboard);
        closeModalBtn.addEventListener('click', closeModal);
        
        // Social sign up buttons
        googleBtn.addEventListener('click', signUpWithGoogle);
        linkedinBtn.addEventListener('click', signUpWithLinkedIn);
        githubBtn.addEventListener('click', signUpWithGitHub);
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === successModal) {
                closeModal();
            }
        });
    }
    
    // Account Type Selection
    function selectAccountType(type) {
        // Update selected account type
        selectedAccountType = type;
        
        // Remove selected class from all account types
        accountTypes.forEach(accountType => {
            accountType.classList.remove('selected');
        });
        
        // Add selected class to clicked account type
        const selectedElement = document.querySelector(`.${type}-type`);
        selectedElement.classList.add('selected');
        
        // Show/hide conditional fields
        hideAllConditionalFields();
        
        switch(type) {
            case 'student':
                studentFields.classList.add('active');
                break;
            case 'employer':
                employerFields.classList.add('active');
                break;
            case 'instructor':
                instructorFields.classList.add('active');
                break;
        }
    }
    
    function hideAllConditionalFields() {
        studentFields.classList.remove('active');
        employerFields.classList.remove('active');
        instructorFields.classList.remove('active');
    }
    
    // Toggle Password Visibility
    function togglePasswordVisibility() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle eye icon
        const eyeIcon = togglePasswordBtn.querySelector('i');
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
    }
    
    // Password Strength Indicator
    function updatePasswordStrength() {
        const password = passwordInput.value;
        let strength = 0;
        let strengthTextValue = 'Password strength';
        let strengthColor = '#e9ecef';
        
        // Check password length
        if (password.length >= 8) strength += 1;
        
        // Check for lowercase letters
        if (/[a-z]/.test(password)) strength += 1;
        
        // Check for uppercase letters
        if (/[A-Z]/.test(password)) strength += 1;
        
        // Check for numbers
        if (/[0-9]/.test(password)) strength += 1;
        
        // Check for special characters
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        // Update strength indicator
        switch(strength) {
            case 0:
            case 1:
                strengthFill.style.width = '20%';
                strengthFill.style.backgroundColor = '#ef476f'; // Red
                strengthTextValue = 'Very Weak';
                break;
            case 2:
                strengthFill.style.width = '40%';
                strengthFill.style.backgroundColor = '#ff9e00'; // Orange
                strengthTextValue = 'Weak';
                break;
            case 3:
                strengthFill.style.width = '60%';
                strengthFill.style.backgroundColor = '#ffd166'; // Yellow
                strengthTextValue = 'Fair';
                break;
            case 4:
                strengthFill.style.width = '80%';
                strengthFill.style.backgroundColor = '#06d6a0'; // Light green
                strengthTextValue = 'Good';
                break;
            case 5:
                strengthFill.style.width = '100%';
                strengthFill.style.backgroundColor = '#06d6a0'; // Green
                strengthTextValue = 'Strong';
                break;
        }
        
        strengthText.textContent = strengthTextValue;
    }
    
    // Form Validation Functions
    function validateName() {
        const name = fullNameInput.value.trim();
        
        if (name === '') {
            showError(nameError, 'Full name is required');
            return false;
        }
        
        if (name.length < 2) {
            showError(nameError, 'Name must be at least 2 characters');
            return false;
        }
        
        hideError(nameError);
        return true;
    }
    
    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email === '') {
            showError(emailError, 'Email address is required');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            showError(emailError, 'Please enter a valid email address');
            return false;
        }
        
        hideError(emailError);
        return true;
    }
    
    function validatePassword() {
        const password = passwordInput.value;
        
        if (password === '') {
            showError(passwordError, 'Password is required');
            return false;
        }
        
        if (password.length < 8) {
            showError(passwordError, 'Password must be at least 8 characters');
            return false;
        }
        
        hideError(passwordError);
        return true;
    }
    
    function validateConfirmPassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword === '') {
            showError(confirmPasswordError, 'Please confirm your password');
            return false;
        }
        
        if (password !== confirmPassword) {
            showError(confirmPasswordError, 'Passwords do not match');
            return false;
        }
        
        hideError(confirmPasswordError);
        return true;
    }
    
    function validateTerms() {
        if (!termsCheckbox.checked) {
            showError(termsError, 'You must accept the terms and conditions');
            return false;
        }
        
        hideError(termsError);
        return true;
    }
    
    // Error Handling Functions
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }
    
    function hideError(element) {
        element.textContent = '';
        element.style.display = 'none';
    }
    
    // Form Submission
    function handleFormSubmit(event) {
        event.preventDefault();
        
        // Validate all fields
        const isNameValid = validateName();
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const isTermsValid = validateTerms();
        
        // If all validations pass
        if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isTermsValid) {
            // Show loading state on button
            const originalText = submitBtn.querySelector('span').textContent;
            submitBtn.querySelector('span').textContent = 'Creating Account...';
            submitBtn.disabled = true;
            
            // Simulate API call with timeout
            setTimeout(() => {
                // Create user data object
                const userData = {
                    accountType: selectedAccountType,
                    fullName: fullNameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value,
                    termsAccepted: termsCheckbox.checked
                };
                
                // Add conditional data based on account type
                switch(selectedAccountType) {
                    case 'student':
                        userData.currentRole = document.getElementById('currentRole').value;
                        userData.desiredSkills = document.getElementById('desiredSkills').value;
                        break;
                    case 'employer':
                        userData.companyName = document.getElementById('companyName').value;
                        userData.jobTitle = document.getElementById('jobTitle').value;
                        break;
                    case 'instructor':
                        userData.expertiseArea = document.getElementById('expertiseArea').value;
                        userData.yearsExperience = document.getElementById('yearsExperience').value;
                        break;
                }
                /*
                // In a real app, you would send this data to your backend API
                console.log('User registration data:', userData);
                */
               
                // Show success modal
                showSuccessModal(userData);
                
                // Reset button state
                submitBtn.querySelector('span').textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        }
    }
    
    // Success Modal Functions
    function showSuccessModal(userData) {
        // Set modal message based on account type
        let message = `Welcome to SkillHub, ${userData.fullName}! `;
        
        switch(userData.accountType) {
            case 'student':
                message += 'Your student account has been created. You can now explore skill paths, build your portfolio, and find job opportunities.';
                break;
            case 'employer':
                message += 'Your employer account has been created. You can now post jobs, search for talent, and manage applications.';
                break;
            case 'instructor':
                message += 'Your instructor account has been created. You can now create skill paths and mentor learners.';
                break;
        }
        
        modalMessage.textContent = message;
        successModal.style.display = 'flex';
    }
    

    function closeModal() {
        successModal.style.display = 'none';
    }
    
    function goToDashboard() {
        // Save user data to localStorage
        const userData = {
            accountType: selectedAccountType,
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            isLoggedIn: true,
            registrationDate: new Date().toISOString(),
            profileStrength: 75,
            meritCoins: 1250,
            skills: [],
            certificates: []
        };
        
        // Add additional data based on account type
        switch(selectedAccountType) {
            case 'student':
                userData.currentRole = document.getElementById('currentRole')?.value || 'Student';
                userData.desiredSkills = document.getElementById('desiredSkills')?.value || '';
                break;
            case 'employer':
                userData.companyName = document.getElementById('companyName')?.value || '';
                userData.jobTitle = document.getElementById('jobTitle')?.value || '';
                break;
            case 'instructor':
                userData.expertiseArea = document.getElementById('expertiseArea')?.value || '';
                userData.yearsExperience = document.getElementById('yearsExperience')?.value || '';
                break;
        }
        
        // Save to localStorage
        localStorage.setItem('skillhub_user', JSON.stringify(userData));
        
        // Redirect to the appropriate dashboard
        if (selectedAccountType === 'student') {
            // Redirect student to index.html (your dashboard)
            window.location.href = 'index.html';
        } else if (selectedAccountType === 'employer') {
            // Redirect employer to employer.html (if you have it)
            window.location.href = 'employer.html';
        } else if (selectedAccountType === 'instructor') {
            // Redirect instructor to instructor.html (if you have it)
            window.location.href = 'instructor.html';
        }
        
        // Close modal
        closeModal();
        
        // Reset form
        registrationForm.reset();
        
        // Reset password strength indicator
        strengthFill.style.width = '0%';
        strengthText.textContent = 'Password strength';
        
        // Reset account type to default
        selectAccountType('student');
    }
    
    // Social Sign Up Functions (Mock)
    function signUpWithGoogle() {
        alert('Google sign up would be implemented with OAuth in a real application.');
    }
    
    function signUpWithLinkedIn() {
        alert('LinkedIn sign up would be implemented with OAuth in a real application.');
    }
    
    function signUpWithGitHub() {
        alert('GitHub sign up would be implemented with OAuth in a real application.');
    }
});