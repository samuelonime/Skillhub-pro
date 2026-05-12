// employer.js - Employer Dashboard Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all employer dashboard functionality
    initEmployerDashboard();
});

function initEmployerDashboard() {
    // Section Navigation
    initNavigation();
    
    // Dropdowns & Modals
    initDropdowns();
    initModals();
    
    // Job Management
    initJobManagement();
    
    // Applicants Management
    initApplicantsManagement();
    
    // Talent Search
    initTalentSearch();
    
    // Company Settings
    initCompanySettings();
    
    // Notifications
    initNotifications();
    
    // Dashboard Stats
    initDashboardStats();
}

// ===== SECTION NAVIGATION =====
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sectionContainers = document.querySelectorAll('.section-container');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    // Section switching
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get target section
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(`${sectionId}-section`);
            
            if (!targetSection) return;
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section, hide others
            sectionContainers.forEach(section => {
                section.classList.remove('active');
            });
            targetSection.classList.add('active');
            
            // Close mobile menu if open
            navMenu.classList.remove('active');
        });
    });
    
    // Mobile menu toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Default to overview section
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
        const sectionId = activeLink.getAttribute('data-section');
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            sectionContainers.forEach(section => section.classList.remove('active'));
            targetSection.classList.add('active');
        }
    }
}

// ===== DROPDOWNS =====
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.dropdown-toggle, .notification-btn, .profile-btn');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (!btn || !menu) return;
        
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close other open dropdowns
            document.querySelectorAll('.dropdown-menu.active').forEach(activeMenu => {
                if (activeMenu !== menu) {
                    activeMenu.classList.remove('active');
                }
            });
            
            // Toggle current dropdown
            menu.classList.toggle('active');
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    });
}

// ===== MODALS =====
function initModals() {
    const modals = document.querySelectorAll('.modal');
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const modalCloses = document.querySelectorAll('.modal-close, [data-action="cancel"]');
    
    // Open modal
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Close modal
    modalCloses.forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Close modal on backdrop click
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Initialize Create Job Post modal
    initJobPostModal();
}

// ===== JOB MANAGEMENT =====
function initJobManagement() {
    const jobTabs = document.querySelectorAll('.tab-btn[data-tab]');
    const jobTables = document.querySelectorAll('.jobs-table-container');
    const jobSelects = document.querySelectorAll('.job-select');
    const selectAllCheckbox = document.getElementById('select-all-jobs');
    const bulkActionsBar = document.querySelector('.bulk-actions-bar');
    const clearSelectionBtn = document.getElementById('clear-selection');
    const jobSearch = document.getElementById('job-search');
    const sortSelect = document.querySelector('.sort-select');
    
    // Job Tabs
    jobTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab
            jobTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding table
            jobTables.forEach(table => {
                table.style.display = 'none';
                table.classList.remove('active');
                
                if (table.id === `${tabId}-jobs`) {
                    table.style.display = 'block';
                    table.classList.add('active');
                }
            });
        });
    });
    
    // Bulk selection
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            jobSelects.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            updateBulkActionsBar();
        });
    }
    
    jobSelects.forEach(checkbox => {
        checkbox.addEventListener('change', updateBulkActionsBar);
    });
    
    function updateBulkActionsBar() {
        const selectedCount = document.querySelectorAll('.job-select:checked').length;
        const selectedCountElement = document.getElementById('selected-count');
        
        if (selectedCount > 0) {
            bulkActionsBar.style.display = 'flex';
            selectedCountElement.textContent = `${selectedCount} job${selectedCount !== 1 ? 's' : ''} selected`;
            
            // Update select all checkbox state
            const totalJobs = jobSelects.length;
            selectAllCheckbox.checked = selectedCount === totalJobs;
            selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalJobs;
        } else {
            bulkActionsBar.style.display = 'none';
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }
    
    // Clear selection
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', function() {
            jobSelects.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateBulkActionsBar();
        });
    }
    
    // Bulk actions
    const bulkActions = document.querySelectorAll('[data-action]');
    bulkActions.forEach(action => {
        action.addEventListener('click', function() {
            const actionType = this.getAttribute('data-action');
            const selectedJobs = Array.from(document.querySelectorAll('.job-select:checked'))
                .map(checkbox => checkbox.closest('.job-row').getAttribute('data-job-id'));
            
            if (selectedJobs.length === 0) return;
            
            performBulkAction(actionType, selectedJobs);
        });
    });
    
    // Job search
    if (jobSearch) {
        jobSearch.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase();
            const jobRows = document.querySelectorAll('.job-row');
            
            jobRows.forEach(row => {
                const title = row.querySelector('.job-main-title h4').textContent.toLowerCase();
                const description = row.querySelector('.job-description').textContent.toLowerCase();
                const isVisible = title.includes(searchTerm) || description.includes(searchTerm);
                row.style.display = isVisible ? '' : 'none';
            });
        }, 300));
    }
    
    // Sort jobs
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            sortJobsTable(sortBy);
        });
    }
    
    // Job actions dropdown
    initJobActionsDropdown();
    
    // Post New Job button
    const postNewJobBtn = document.getElementById('post-new-job-btn');
    if (postNewJobBtn) {
        postNewJobBtn.addEventListener('click', function() {
            const createJobModal = document.getElementById('createJobModal');
            if (createJobModal) {
                createJobModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // Create Job Post button
    const createJobPostBtn = document.getElementById('create-job-post-btn');
    if (createJobPostBtn) {
        createJobPostBtn.addEventListener('click', function() {
            const createJobModal = document.getElementById('createJobModal');
            if (createJobModal) {
                createJobModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
}

function initJobActionsDropdown() {
    const actionButtons = document.querySelectorAll('.table-actions .dropdown .btn-icon');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.nextElementSibling;
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    });
    
    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', function() {
        document.querySelectorAll('.table-actions .dropdown-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    });
    
    // Handle dropdown actions
    const dropdownItems = document.querySelectorAll('.dropdown-item[data-action]');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.getAttribute('data-action');
            const jobRow = this.closest('.job-row');
            const jobId = jobRow ? jobRow.getAttribute('data-job-id') : null;
            
            handleJobAction(action, jobId);
            
            // Close dropdown
            this.closest('.dropdown-menu').classList.remove('active');
        });
    });
}

function handleJobAction(action, jobId) {
    switch(action) {
        case 'edit':
            openEditJobModal(jobId);
            break;
        case 'view-applicants':
            navigateToApplicants(jobId);
            break;
        case 'duplicate':
            openDuplicateModal(jobId);
            break;
        case 'extend':
            extendJobDeadline(jobId);
            break;
        case 'close':
            closeJob(jobId);
            break;
        case 'archive':
            openArchiveModal(jobId);
            break;
        case 'delete':
            deleteJob(jobId);
            break;
    }
}

function openEditJobModal(jobId) {
    // In a real app, you would fetch job data and populate the form
    const editModal = document.getElementById('editJobModal');
    if (editModal) {
        editModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function openDuplicateModal(jobId) {
    const duplicateModal = document.getElementById('duplicateJobModal');
    if (duplicateModal) {
        duplicateModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set up duplicate action
        const duplicateBtn = duplicateModal.querySelector('[data-action="duplicate"]');
        if (duplicateBtn) {
            duplicateBtn.onclick = function() {
                duplicateJob(jobId);
                duplicateModal.classList.remove('active');
                document.body.style.overflow = '';
            };
        }
    }
}

function openArchiveModal(jobId) {
    const archiveModal = document.getElementById('archiveModal');
    if (archiveModal) {
        archiveModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set up archive action
        const archiveBtn = archiveModal.querySelector('[data-action="archive"]');
        if (archiveBtn) {
            archiveBtn.onclick = function() {
                const reason = document.getElementById('archive-reason').value;
                archiveJob(jobId, reason);
                archiveModal.classList.remove('active');
                document.body.style.overflow = '';
            };
        }
    }
}

function navigateToApplicants(jobId) {
    // Switch to applicants section
    const applicantsLink = document.querySelector('.nav-link[data-section="applicants"]');
    if (applicantsLink) {
        applicantsLink.click();
        
        // Filter applicants for this job
        setTimeout(() => {
            const jobFilter = document.getElementById('job-filter');
            if (jobFilter) {
                jobFilter.value = jobId;
                applyApplicantFilters();
            }
        }, 100);
    }
}

function performBulkAction(action, jobIds) {
    switch(action) {
        case 'publish':
            publishJobs(jobIds);
            break;
        case 'close':
            closeJobs(jobIds);
            break;
        case 'archive':
            archiveJobs(jobIds);
            break;
        case 'duplicate':
            duplicateJobs(jobIds);
            break;
        case 'delete':
            deleteJobs(jobIds);
            break;
    }
}

// ===== JOB POST MODAL WIZARD =====
function initJobPostModal() {
    const modal = document.getElementById('createJobModal');
    if (!modal) return;
    
    const steps = modal.querySelectorAll('.wizard-step');
    const stepButtons = modal.querySelectorAll('.step[data-step]');
    const nextBtn = modal.querySelector('#next-step');
    const prevBtn = modal.querySelector('#prev-step');
    const postBtn = modal.querySelector('#post-job');
    const saveDraftBtn = modal.querySelector('#save-draft');
    let currentStep = 1;
    
    // Initialize wizard
    updateWizardNavigation();
    
    // Step navigation
    nextBtn.addEventListener('click', function() {
        if (validateStep(currentStep)) {
            currentStep++;
            updateWizardNavigation();
        }
    });
    
    prevBtn.addEventListener('click', function() {
        currentStep--;
        updateWizardNavigation();
    });
    
    // Step click navigation
    stepButtons.forEach(step => {
        step.addEventListener('click', function() {
            const stepNum = parseInt(this.getAttribute('data-step'));
            if (stepNum < currentStep) {
                currentStep = stepNum;
                updateWizardNavigation();
            }
        });
    });
    
    // Save draft
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function() {
            saveJobAsDraft();
        });
    }
    
    // Post job
    if (postBtn) {
        postBtn.addEventListener('click', function() {
            if (validateAllSteps()) {
                postJob();
            }
        });
    }
    
    // Location type handling
    const locationRadios = document.querySelectorAll('input[name="location-type"]');
    locationRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateLocationFields(this.value);
        });
    });
    
    // Skills input handling
    initSkillsInput();
    
    // Rich text editor
    initRichTextEditor();
    
    function updateWizardNavigation() {
        // Update step indicators
        stepButtons.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.toggle('active', stepNum === currentStep);
            step.classList.toggle('completed', stepNum < currentStep);
        });
        
        // Show/hide steps
        steps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.toggle('active', stepNum === currentStep);
        });
        
        // Update buttons
        prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
        nextBtn.style.display = currentStep < 5 ? 'inline-flex' : 'none';
        postBtn.style.display = currentStep === 5 ? 'inline-flex' : 'none';
        
        // Update preview on last step
        if (currentStep === 5) {
            updateJobPreview();
        }
    }
    
    function validateStep(step) {
        const currentStepElement = document.querySelector(`.wizard-step[data-step="${step}"]`);
        const requiredInputs = currentStepElement.querySelectorAll('[required]');
        
        let isValid = true;
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                showToast('Please fill in all required fields', 'error');
            } else {
                input.classList.remove('error');
            }
        });
        
        return isValid;
    }
    
    function validateAllSteps() {
        for (let i = 1; i <= 5; i++) {
            if (!validateStep(i)) {
                currentStep = i;
                updateWizardNavigation();
                return false;
            }
        }
        return true;
    }
    
    function updateLocationFields(locationType) {
        const officeField = document.getElementById('office-location-field');
        const remoteField = document.getElementById('remote-location-field');
        const hybridField = document.getElementById('hybrid-schedule-field');
        
        // Hide all fields
        officeField.style.display = 'none';
        remoteField.style.display = 'none';
        hybridField.style.display = 'none';
        
        // Show relevant field
        switch(locationType) {
            case 'onsite':
                officeField.style.display = 'block';
                break;
            case 'remote':
                remoteField.style.display = 'block';
                break;
            case 'hybrid':
                officeField.style.display = 'block';
                hybridField.style.display = 'block';
                break;
        }
    }
    
    function initSkillsInput() {
        const skillsInput = document.getElementById('skills-input');
        const requiredSkillsContainer = document.getElementById('required-skills');
        
        if (skillsInput) {
            skillsInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && this.value.trim()) {
                    e.preventDefault();
                    addSkill(this.value.trim(), requiredSkillsContainer);
                    this.value = '';
                }
            });
        }
        
        // Remove skill buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-skill')) {
                e.target.parentElement.remove();
            }
        });
    }
    
    function initRichTextEditor() {
        const toolbarButtons = document.querySelectorAll('.toolbar-btn');
        const editorContent = document.getElementById('job-description-content');
        const hiddenTextarea = document.getElementById('job-description');
        
        toolbarButtons.forEach(button => {
            button.addEventListener('click', function() {
                const command = this.getAttribute('data-command');
                document.execCommand(command, false, null);
                editorContent.focus();
            });
        });
        
        // Sync content with hidden textarea
        if (editorContent && hiddenTextarea) {
            editorContent.addEventListener('input', function() {
                hiddenTextarea.value = this.innerHTML;
            });
        }
    }
    
    function addSkill(skill, container) {
        if (!skill || skillExists(skill, container)) return;
        
        const skillTag = document.createElement('div');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `
            <span>${skill}</span>
            <button class="remove-skill">&times;</button>
        `;
        
        container.appendChild(skillTag);
    }
    
    function skillExists(skill, container) {
        const existingSkills = container.querySelectorAll('.skill-tag span');
        return Array.from(existingSkills).some(span => 
            span.textContent.toLowerCase() === skill.toLowerCase()
        );
    }
    
    function updateJobPreview() {
        // Update preview with form values
        const title = document.getElementById('job-title')?.value || 'Senior React Developer';
        const department = document.getElementById('job-department')?.value || 'Engineering';
        const locationType = document.querySelector('input[name="location-type"]:checked')?.value || 'remote';
        const salaryMin = document.getElementById('salary-min')?.value || '120000';
        const salaryMax = document.getElementById('salary-max')?.value || '160000';
        
        // Update preview elements
        const previewTitle = document.getElementById('preview-job-title');
        const previewDepartment = document.getElementById('preview-department');
        const previewType = document.getElementById('preview-type');
        const previewLocation = document.getElementById('preview-location');
        const previewSalary = document.getElementById('preview-salary');
        
        if (previewTitle) previewTitle.textContent = title;
        if (previewDepartment) previewDepartment.textContent = department;
        if (previewType) previewType.textContent = document.getElementById('employment-type')?.value || 'Full-time';
        if (previewLocation) previewLocation.textContent = locationType.charAt(0).toUpperCase() + locationType.slice(1);
        if (previewSalary) previewSalary.textContent = `$${parseInt(salaryMin).toLocaleString()} - $${parseInt(salaryMax).toLocaleString()}`;
        
        // Update description preview
        const previewDescription = document.getElementById('preview-description');
        if (previewDescription) {
            previewDescription.innerHTML = document.getElementById('job-description-content')?.innerHTML || '';
        }
        
        // Update skills preview
        const requiredSkills = Array.from(document.querySelectorAll('#required-skills .skill-tag span'))
            .map(span => span.textContent);
        const previewSkills = document.getElementById('preview-required-skills');
        if (previewSkills) {
            previewSkills.innerHTML = requiredSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
        }
        
        // Update experience preview
        const experienceLevel = document.getElementById('experience-level')?.value || 'senior';
        const previewExperience = document.getElementById('preview-experience');
        if (previewExperience) {
            const levelMap = {
                'intern': 'Internship',
                'entry': 'Entry Level (0-2 years)',
                'mid': 'Mid Level (2-5 years)',
                'senior': 'Senior Level (5+ years)',
                'lead': 'Lead/Manager',
                'executive': 'Executive'
            };
            previewExperience.textContent = levelMap[experienceLevel] || 'Senior Level (5+ years)';
        }
    }
    
    function saveJobAsDraft() {
        const jobData = collectJobData();
        jobData.status = 'draft';
        
        // Save to localStorage or send to API
        saveJobToStorage(jobData);
        showToast('Job saved as draft successfully!', 'success');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function postJob() {
        const jobData = collectJobData();
        jobData.status = 'active';
        jobData.postedDate = new Date().toISOString();
        
        // Calculate expiry date
        const duration = document.getElementById('deadline-duration')?.value || 30;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(duration));
        jobData.expiryDate = expiryDate.toISOString();
        
        // Save to localStorage or send to API
        saveJobToStorage(jobData);
        showToast('Job posted successfully!', 'success');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Refresh job list
        refreshJobList();
    }
    
    function collectJobData() {
        return {
            title: document.getElementById('job-title')?.value,
            department: document.getElementById('job-department')?.value,
            employmentType: document.getElementById('employment-type')?.value,
            experienceLevel: document.getElementById('experience-level')?.value,
            requiredSkills: Array.from(document.querySelectorAll('#required-skills .skill-tag span'))
                .map(span => span.textContent),
            locationType: document.querySelector('input[name="location-type"]:checked')?.value,
            salaryRange: {
                min: document.getElementById('salary-min')?.value,
                max: document.getElementById('salary-max')?.value,
                currency: document.getElementById('salary-currency')?.value
            },
            description: document.getElementById('job-description-content')?.innerHTML,
            benefits: Array.from(document.querySelectorAll('input[name="benefits"]:checked'))
                .map(input => input.value),
            featured: document.getElementById('featured-job')?.checked
        };
    }
    
    function saveJobToStorage(jobData) {
        /*
        // In a real app, this would be an API call
        const jobs = JSON.parse(localStorage.getItem('employerJobs') || '[]');
        jobData.id = Date.now().toString();
        jobs.push(jobData);
        localStorage.setItem('employerJobs', JSON.stringify(jobs)); */
    }
}

// ===== APPLICANTS MANAGEMENT =====
function initApplicantsManagement() {
    const statusSelects = document.querySelectorAll('.status-select');
    const filters = document.querySelectorAll('.filter-select');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const selectAllCheckbox = document.getElementById('select-all');
    const applicantSelects = document.querySelectorAll('.select-applicant');
    const bulkActionsBtn = document.getElementById('bulk-actions');
    
    // Status change handling
    statusSelects.forEach(select => {
        select.addEventListener('change', function() {
            const applicantId = this.getAttribute('data-applicant');
            const newStatus = this.value;
            
            updateApplicantStatus(applicantId, newStatus);
            
            // Update row styling based on status
            const row = this.closest('tr');
            row.className = `applicant-row ${getStatusClass(newStatus)}`;
        });
    });
    
    // Filtering
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyApplicantFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            filters.forEach(filter => filter.value = 'all');
            applyApplicantFilters();
        });
    }
    
    // Bulk selection
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            applicantSelects.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    }
    
    // Bulk actions modal
    if (bulkActionsBtn) {
        bulkActionsBtn.addEventListener('click', function() {
            const selectedCount = document.querySelectorAll('.select-applicant:checked').length;
            if (selectedCount > 0) {
                openBulkActionsModal(selectedCount);
            } else {
                showToast('Please select applicants first', 'warning');
            }
        });
    }
    
    // Applicant detail view
    const viewButtons = document.querySelectorAll('[title="View Profile"]');
    const backToListBtn = document.getElementById('back-to-list');
    const applicantDetailView = document.getElementById('applicant-detail');
    const applicantTable = document.querySelector('.applicants-table');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('.applicant-row');
            const applicantId = row.querySelector('.select-applicant').value;
            
            // Show detail view, hide table
            applicantTable.style.display = 'none';
            if (applicantDetailView) {
                applicantDetailView.style.display = 'block';
                loadApplicantDetails(applicantId);
            }
        });
    });
    
    if (backToListBtn) {
        backToListBtn.addEventListener('click', function() {
            if (applicantDetailView) {
                applicantDetailView.style.display = 'none';
            }
            applicantTable.style.display = '';
        });
    }
    
    // Detail tabs
    const detailTabs = document.querySelectorAll('.detail-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    detailTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab
            detailTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function applyApplicantFilters() {
    const jobFilter = document.getElementById('job-filter')?.value;
    const matchFilter = document.getElementById('match-filter')?.value;
    const statusFilter = document.getElementById('status-filter')?.value;
    const experienceFilter = document.getElementById('experience-filter')?.value;
    
    const rows = document.querySelectorAll('.applicant-row');
    
    rows.forEach(row => {
        const jobApplied = row.querySelector('.job-applied').textContent.toLowerCase();
        const matchScore = parseInt(row.querySelector('.score-circle').getAttribute('data-score'));
        const status = row.querySelector('.status-select').value;
        const experienceText = row.querySelector('.candidate-details p').textContent.toLowerCase();
        
        let isVisible = true;
        
        // Job filter
        if (jobFilter && jobFilter !== 'all') {
            const filterMap = {
                'react': 'senior react developer',
                'data': 'data analyst',
                'ux': 'ux designer',
                'devops': 'devops engineer'
            };
            isVisible = isVisible && jobApplied.includes(filterMap[jobFilter]);
        }
        
        // Match score filter
        if (matchFilter && matchFilter !== 'all') {
            isVisible = isVisible && checkMatchScore(matchScore, matchFilter);
        }
        
        // Status filter
        if (statusFilter && statusFilter !== 'all') {
            isVisible = isVisible && status === statusFilter;
        }
        
        // Experience filter
        if (experienceFilter && experienceFilter !== 'all') {
            isVisible = isVisible && checkExperience(experienceText, experienceFilter);
        }
        
        row.style.display = isVisible ? '' : 'none';
    });
}

function checkMatchScore(score, filter) {
    switch(filter) {
        case '90+': return score >= 90;
        case '80-89': return score >= 80 && score <= 89;
        case '70-79': return score >= 70 && score <= 79;
        case 'below-70': return score < 70;
        default: return true;
    }
}

function checkExperience(text, filter) {
    const experienceMap = {
        'entry': ['entry', '0-2', 'junior'],
        'mid': ['mid', '2-5', 'intermediate'],
        'senior': ['senior', '5+', 'lead', 'manager']
    };
    
    return experienceMap[filter].some(term => text.includes(term));
}

function getStatusClass(status) {
    const statusClasses = {
        'new': 'new-applicant',
        'reviewed': 'reviewed-applicant',
        'shortlisted': 'shortlisted-applicant',
        'interview': 'interview-applicant',
        'rejected': 'rejected-applicant',
        'hired': 'hired-applicant'
    };
    
    return statusClasses[status] || '';
}

function updateApplicantStatus(applicantId, status) {
    /*
    // In a real app, this would be an API call
    console.log(`Updating applicant ${applicantId} status to ${status}`);
    showToast('Applicant status updated', 'success');*/
}

function loadApplicantDetails(applicantId) {
    /*
    // In a real app, this would fetch applicant details from an API
    console.log(`Loading details for applicant ${applicantId}`); */
}

function openBulkActionsModal(selectedCount) {
    // Create and show bulk actions modal
    const modalHtml = `
        <div class="modal active" id="bulkActionsModal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">Bulk Actions (${selectedCount} selected)</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="bulk-actions-list">
                        <button class="btn btn-outline btn-block" data-action="status" data-status="shortlisted">
                            <i class="fas fa-star"></i> Mark as Shortlisted
                        </button>
                        <button class="btn btn-outline btn-block" data-action="status" data-status="interview">
                            <i class="fas fa-calendar-alt"></i> Schedule Interview
                        </button>
                        <button class="btn btn-outline btn-block" data-action="status" data-status="rejected">
                            <i class="fas fa-times"></i> Reject Applicants
                        </button>
                        <button class="btn btn-outline btn-block" data-action="message">
                            <i class="fas fa-envelope"></i> Send Message
                        </button>
                        <button class="btn btn-outline btn-block text-danger" data-action="delete">
                            <i class="fas fa-trash"></i> Delete Applications
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" data-action="cancel">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Set up event listeners
    const modal = document.getElementById('bulkActionsModal');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    const actionButtons = modal.querySelectorAll('[data-action]');
    
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const selectedIds = Array.from(document.querySelectorAll('.select-applicant:checked'))
                .map(checkbox => checkbox.value);
            
            performApplicantBulkAction(action, selectedIds, this.getAttribute('data-status'));
            closeModal();
        });
    });
}

function performApplicantBulkAction(action, applicantIds, status = null) {
    switch(action) {
        case 'status':
            updateApplicantsStatus(applicantIds, status);
            break;
        case 'message':
            sendBulkMessage(applicantIds);
            break;
        case 'delete':
            deleteApplications(applicantIds);
            break;
    }
}

function updateApplicantsStatus(applicantIds, status) {
    // Update UI
    applicantIds.forEach(id => {
        const select = document.querySelector(`.status-select[data-applicant="${id}"]`);
        if (select) {
            select.value = status;
            select.dispatchEvent(new Event('change'));
        }
    });
    
    showToast(`Updated status for ${applicantIds.length} applicants`, 'success');
}

// ===== TALENT SEARCH =====
function initTalentSearch() {
    const searchInput = document.getElementById('talent-search-input');
    const skillsInput = document.getElementById('skills-input');
    const selectedSkills = document.getElementById('selected-skills');
    const filters = document.querySelectorAll('.filter-select');
    const saveSearchBtn = document.getElementById('save-search');
    
    // Talent search
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchTalent();
            }
        });
    }
    
    // Skills input
    if (skillsInput) {
        skillsInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                addSearchSkill(this.value.trim());
                this.value = '';
            }
        });
    }
    
    // Remove skill
    selectedSkills.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-skill')) {
            e.target.parentElement.remove();
        }
    });
    
    // Save search
    if (saveSearchBtn) {
        saveSearchBtn.addEventListener('click', function() {
            const searchCriteria = getSearchCriteria();
            saveSearch(searchCriteria);
        });
    }
    
    // Contact buttons
    const contactButtons = document.querySelectorAll('.btn-success .fa-envelope').forEach(icon => {
        icon.closest('button').addEventListener('click', function() {
            const talentName = this.closest('.talent-card').querySelector('h4').textContent;
            openContactModal(talentName);
        });
    });
}

function searchTalent() {
    const searchTerm = document.getElementById('talent-search-input')?.value.toLowerCase();
    const selectedSkills = Array.from(document.querySelectorAll('#selected-skills .selected-skill'))
        .map(skill => skill.textContent.trim().toLowerCase());
    const expLevel = document.getElementById('exp-level-filter')?.value;
    const location = document.getElementById('location-filter')?.value;
    
    const talentCards = document.querySelectorAll('.talent-card');
    
    talentCards.forEach(card => {
        const name = card.querySelector('h4').textContent.toLowerCase();
        const title = card.querySelector('.talent-title').textContent.toLowerCase();
        const skills = Array.from(card.querySelectorAll('.skill-tag'))
            .map(tag => tag.textContent.toLowerCase());
        const locationText = card.querySelector('.talent-location span').textContent.toLowerCase();
        
        let isVisible = true;
        
        // Search term
        if (searchTerm) {
            isVisible = isVisible && (name.includes(searchTerm) || title.includes(searchTerm));
        }
        
        // Skills filter
        if (selectedSkills.length > 0) {
            isVisible = isVisible && selectedSkills.every(skill => 
                skills.some(cardSkill => cardSkill.includes(skill))
            );
        }
        
        // Experience filter (simplified)
        if (expLevel) {
            // This would normally check actual experience data
            isVisible = isVisible && true; // Placeholder
        }
        
        // Location filter
        if (location) {
            const locationMap = {
                'remote': ['remote'],
                'hybrid': ['hybrid'],
                'us': ['united states', 'usa', 'us'],
                'europe': ['europe'],
                'asia': ['asia']
            };
            
            if (locationMap[location]) {
                isVisible = isVisible && locationMap[location].some(term => 
                    locationText.includes(term)
                );
            }
        }
        
        card.style.display = isVisible ? '' : 'none';
    });
    
    // Update results count
    const visibleCount = document.querySelectorAll('.talent-card[style*="display: none"]').length;
    const totalCount = document.querySelectorAll('.talent-card').length;
    const visibleResults = totalCount - visibleCount;
    
    const resultsHeader = document.querySelector('.results-header h3');
    if (resultsHeader) {
        resultsHeader.textContent = `Showing ${visibleResults} Results`;
    }
}

function addSearchSkill(skill) {
    if (!skill) return;
    
    const selectedSkills = document.getElementById('selected-skills');
    const existingSkills = Array.from(selectedSkills.querySelectorAll('.selected-skill span'))
        .map(span => span.textContent.toLowerCase());
    
    if (existingSkills.includes(skill.toLowerCase())) return;
    
    const skillElement = document.createElement('span');
    skillElement.className = 'selected-skill';
    skillElement.innerHTML = `
        ${skill} <button class="remove-skill">&times;</button>
    `;
    
    selectedSkills.appendChild(skillElement);
}

function getSearchCriteria() {
    return {
        searchTerm: document.getElementById('talent-search-input')?.value,
        skills: Array.from(document.querySelectorAll('#selected-skills .selected-skill span'))
            .map(span => span.textContent.trim()),
        expLevel: document.getElementById('exp-level-filter')?.value,
        location: document.getElementById('location-filter')?.value,
        certification: document.getElementById('certification-filter')?.value,
        availability: document.getElementById('availability-filter')?.value,
        timestamp: new Date().toISOString()
    };
}

function saveSearch(criteria) {
    // Save to localStorage or send to API
    const savedSearches = JSON.parse(localStorage.getItem('employerSavedSearches') || '[]');
    savedSearches.push(criteria);
    localStorage.setItem('employerSavedSearches', JSON.stringify(savedSearches));
    
    showToast('Search saved successfully!', 'success');
}

function openContactModal(talentName) {
    const modalHtml = `
        <div class="modal active" id="contactModal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">Contact ${talentName}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="contactForm">
                        <div class="form-group">
                            <label>Subject *</label>
                            <input type="text" placeholder="Job Opportunity at TechCorp" required>
                        </div>
                        <div class="form-group">
                            <label>Message *</label>
                            <textarea rows="6" placeholder="Write your message here..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-option">
                                <input type="checkbox" checked>
                                <span>Attach company profile</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox">
                                <span>Send copy to myself</span>
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" data-action="cancel">Cancel</button>
                    <button class="btn btn-primary" id="sendMessage">Send Message</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Set up event listeners
    const modal = document.getElementById('contactModal');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    const sendBtn = modal.querySelector('#sendMessage');
    
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    sendBtn.addEventListener('click', function() {
        if (validateContactForm()) {
            sendContactMessage(talentName);
            closeModal();
        }
    });
}

// ===== COMPANY SETTINGS =====
function initCompanySettings() {
    const profileTabs = document.querySelectorAll('.profile-tab');
    const tabContents = document.querySelectorAll('.tab-content[id$="-tab"]');
    const saveCompanyBtn = document.getElementById('save-company');
    const inviteMemberBtn = document.getElementById('invite-member');
    const avatarEditBtn = document.querySelector('.btn-avatar-edit');
    
    // Profile tabs
    profileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab
            profileTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.style.display = 'none';
                if (content.id === `${tabId}-tab`) {
                    content.style.display = 'block';
                }
            });
        });
    });
    
    // Save company settings
    if (saveCompanyBtn) {
        saveCompanyBtn.addEventListener('click', function() {
            saveCompanySettings();
        });
    }
    
    // Invite team member
    if (inviteMemberBtn) {
        inviteMemberBtn.addEventListener('click', function() {
            openInviteMemberModal();
        });
    }
    
    // Avatar edit
    if (avatarEditBtn) {
        avatarEditBtn.addEventListener('click', function() {
            document.getElementById('avatar-upload').click();
        });
    }
    
    const avatarUpload = document.getElementById('avatar-upload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                uploadCompanyAvatar(file);
            }
        });
    }
    
    // Plan change
    const changePlanBtn = document.querySelector('.plan-change-btn');
    if (changePlanBtn) {
        changePlanBtn.addEventListener('click', function() {
            openPlanChangeModal();
        });
    }
}

function saveCompanySettings() {
    const companyData = {
        name: document.querySelector('.company-form input[type="text"]')?.value,
        industry: document.querySelector('.company-form select')?.value,
        size: document.querySelector('.company-form select:nth-of-type(2)')?.value,
        foundedYear: document.querySelector('.company-form input[type="number"]')?.value,
        website: document.querySelector('.company-form input[type="url"]')?.value,
        about: document.querySelector('.company-form textarea')?.value,
        tags: Array.from(document.querySelectorAll('.tags-list .tag'))
            .map(tag => tag.textContent)
    };
    
    // Save to localStorage or send to API
    localStorage.setItem('employerCompanySettings', JSON.stringify(companyData));
    showToast('Company settings saved successfully!', 'success');
}

function openInviteMemberModal() {
    const modalHtml = `
        <div class="modal active" id="inviteMemberModal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">Invite Team Member</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="inviteMemberForm">
                        <div class="form-group">
                            <label>Email Address *</label>
                            <input type="email" placeholder="colleague@company.com" required>
                        </div>
                        <div class="form-group">
                            <label>Role *</label>
                            <select required>
                                <option value="">Select Role</option>
                                <option value="admin">Admin</option>
                                <option value="recruiter">Recruiter</option>
                                <option value="hiring-manager">Hiring Manager</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Permissions</label>
                            <div class="permissions-list">
                                <label class="checkbox-option">
                                    <input type="checkbox" name="permissions" value="post-jobs" checked>
                                    <span>Post Jobs</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" name="permissions" value="view-applicants" checked>
                                    <span>View Applicants</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" name="permissions" value="manage-team">
                                    <span>Manage Team</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" name="permissions" value="view-analytics">
                                    <span>View Analytics</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Personal Message (Optional)</label>
                            <textarea placeholder="Add a personal note to the invitation..." rows="3"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" data-action="cancel">Cancel</button>
                    <button class="btn btn-primary" id="sendInvite">Send Invitation</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Set up event listeners
    const modal = document.getElementById('inviteMemberModal');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    const sendBtn = modal.querySelector('#sendInvite');
    
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    sendBtn.addEventListener('click', function() {
        if (validateInviteForm()) {
            sendInvitation();
            closeModal();
        }
    });
}

// ===== NOTIFICATIONS =====
function initNotifications() {
    const notificationBtn = document.querySelector('.notification-btn');
    const markAllReadBtn = document.querySelector('.mark-all-read');
    const notificationItems = document.querySelectorAll('.notification-item');
    
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            notificationItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            // Update notification count
            const notificationCount = document.querySelector('.notification-count');
            if (notificationCount) {
                notificationCount.textContent = '0';
                notificationCount.style.display = 'none';
            }
            
            showToast('All notifications marked as read', 'success');
        });
    }
    
    // Notification click handling
    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            if (this.classList.contains('unread')) {
                this.classList.remove('unread');
                updateNotificationCount();
            }
            
            // Handle notification action
            const notificationType = this.querySelector('.notification-icon i').className;
            handleNotificationAction(notificationType);
        });
    });
}

function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const notificationCount = document.querySelector('.notification-count');
    
    if (notificationCount) {
        notificationCount.textContent = unreadCount;
        notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// ===== DASHBOARD STATS =====
function initDashboardStats() {
    const refreshBtn = document.getElementById('refresh-dashboard');
    const refreshMatchesBtn = document.getElementById('refresh-matches');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            refreshDashboardStats();
        });
    }
    
    if (refreshMatchesBtn) {
        refreshMatchesBtn.addEventListener('click', function() {
            refreshTalentMatches();
        });
    }
    
    // Initialize circular progress bars
    initCircularProgress();
    
    // Initialize match score circles
    initMatchScoreCircles();
}

function refreshDashboardStats() {
    /*
    // Simulate API call
    showToast('Refreshing dashboard data...', 'info');
    
    setTimeout(() => {
        // Update stats with random changes
        updateStatsWithRandomData();
        showToast('Dashboard data refreshed!', 'success');
    }, 1000); */
}

function refreshTalentMatches() {
    /*
    showToast('Finding new talent matches...', 'info');
    
    setTimeout(() => {
        // In a real app, this would fetch new matches from API
        showToast('Found 3 new talent matches!', 'success');
    }, 1500); */
}

function updateStatsWithRandomData() {
    const statValues = document.querySelectorAll('.stat-value');
    
    /*
    statValues.forEach(stat => {
        const currentValue = parseInt(stat.textContent);
        const change = Math.floor(Math.random() * 10) - 3; // Random change between -3 and +6
        const newValue = Math.max(1, currentValue + change);
        
        // Animate value change
        animateValue(stat, currentValue, newValue, 500);
    }); */
}

function initCircularProgress() {
    const circularProgresses = document.querySelectorAll('.circular-progress');
    
    circularProgresses.forEach(progress => {
        const progressValue = parseInt(progress.getAttribute('data-progress') || '0');
        const progressBar = progress.querySelector('.progress-bar');
        
        if (progressBar) {
            const radius = 17;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (progressValue / 100) * circumference;
            
            progressBar.style.strokeDasharray = `${circumference} ${circumference}`;
            progressBar.style.strokeDashoffset = offset;
        }
    });
}

function initMatchScoreCircles() {
    const scoreCircles = document.querySelectorAll('.score-circle');
    
    scoreCircles.forEach(circle => {
        const score = parseInt(circle.getAttribute('data-score') || '0');
        
        // Set color based on score
        if (score >= 90) {
            circle.classList.add('high');
        } else if (score >= 80) {
            circle.classList.add('good');
        } else if (score >= 70) {
            circle.classList.add('medium');
        } else {
            circle.classList.add('low');
        }
        
        // Create SVG circle for visual representation
        createProgressCircle(circle, score);
    });
}

function createProgressCircle(container, score) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '60');
    svg.setAttribute('height', '60');
    svg.setAttribute('viewBox', '0 0 60 60');
    
    const circleBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circleBg.setAttribute('cx', '30');
    circleBg.setAttribute('cy', '30');
    circleBg.setAttribute('r', '25');
    circleBg.setAttribute('fill', 'none');
    circleBg.setAttribute('stroke', '#e5e7eb');
    circleBg.setAttribute('stroke-width', '4');
    
    const circleProgress = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circleProgress.setAttribute('cx', '30');
    circleProgress.setAttribute('cy', '30');
    circleProgress.setAttribute('r', '25');
    circleProgress.setAttribute('fill', 'none');
    circleProgress.setAttribute('stroke', getScoreColor(score));
    circleProgress.setAttribute('stroke-width', '4');
    circleProgress.setAttribute('stroke-linecap', 'round');
    circleProgress.setAttribute('transform', 'rotate(-90 30 30)');
    
    // Calculate stroke dash
    const circumference = 2 * Math.PI * 25;
    const offset = circumference - (score / 100) * circumference;
    circleProgress.style.strokeDasharray = `${circumference} ${circumference}`;
    circleProgress.style.strokeDashoffset = offset;
    
    svg.appendChild(circleBg);
    svg.appendChild(circleProgress);
    
    // Add SVG to container
    const span = container.querySelector('span');
    if (span) {
        container.insertBefore(svg, span);
    }
}

function getScoreColor(score) {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
}

// ===== UTILITY FUNCTIONS =====
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after 5 seconds
    const autoRemove = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', function() {
        clearTimeout(autoRemove);
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
}

function getToastIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function debounce(func, wait) {
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

function animateValue(element, start, end, duration) {
    const startTimestamp = performance.now();
    const step = (timestamp) => {
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}


// ===== PLACEHOLDER FUNCTIONS (to be implemented in real app) =====
function duplicateJob(jobId) {
    /*
    console.log(`Duplicating job ${jobId}`);
    showToast('Job duplicated successfully!', 'success'); */
}



function extendJobDeadline(jobId) {
    /*
    console.log(`Extending deadline for job ${jobId}`);
    showToast('Job deadline extended!', 'success'); */
}

function closeJob(jobId) {
    /*
    console.log(`Closing job ${jobId}`);
    showToast('Job closed successfully!', 'success'); */
}


function archiveJob(jobId, reason) {
    console.log(`Archiving job ${jobId} with reason: ${reason}`);
    showToast('Job archived successfully!', 'success');
}

function deleteJob(jobId) {
    if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        console.log(`Deleting job ${jobId}`);
        showToast('Job deleted successfully!', 'success');
    }
}

function publishJobs(jobIds) {
    console.log(`Publishing jobs: ${jobIds.join(', ')}`);
    showToast(`${jobIds.length} jobs published successfully!`, 'success');
}

function closeJobs(jobIds) {
    console.log(`Closing jobs: ${jobIds.join(', ')}`);
    showToast(`${jobIds.length} jobs closed successfully!`, 'success');
}

function archiveJobs(jobIds) {
    console.log(`Archiving jobs: ${jobIds.join(', ')}`);
    showToast(`${jobIds.length} jobs archived successfully!`, 'success');
}

function duplicateJobs(jobIds) {
    console.log(`Duplicating jobs: ${jobIds.join(', ')}`);
    showToast(`${jobIds.length} jobs duplicated successfully!`, 'success');
}

function deleteJobs(jobIds) {
    if (confirm(`Are you sure you want to delete ${jobIds.length} jobs? This action cannot be undone.`)) {
        console.log(`Deleting jobs: ${jobIds.join(', ')}`);
        showToast(`${jobIds.length} jobs deleted successfully!`, 'success');
    }
}

function sendBulkMessage(applicantIds) {
    console.log(`Sending message to applicants: ${applicantIds.join(', ')}`);
    showToast(`Message sent to ${applicantIds.length} applicants`, 'success');
}

function deleteApplications(applicantIds) {
    if (confirm(`Are you sure you want to delete ${applicantIds.length} applications?`)) {
        console.log(`Deleting applications: ${applicantIds.join(', ')}`);
        showToast(`${applicantIds.length} applications deleted`, 'success');
    }
}

function validateContactForm() {
    const form = document.getElementById('contactForm');
    const inputs = form.querySelectorAll('[required]');
    
    for (let input of inputs) {
        if (!input.value.trim()) {
            showToast('Please fill in all required fields', 'error');
            input.classList.add('error');
            input.focus();
            return false;
        }
        input.classList.remove('error');
    }
    
    return true;
}

function sendContactMessage(talentName) {
    /*
    // In a real app, this would send the message via API
    console.log(`Sending message to ${talentName}`);
    showToast(`Message sent to ${talentName}!`, 'success'); */
}

function validateInviteForm() {
    const form = document.getElementById('inviteMemberForm');
    const emailInput = form.querySelector('input[type="email"]');
    const roleSelect = form.querySelector('select');
    
    if (!emailInput.value.trim()) {
        showToast('Please enter an email address', 'error');
        emailInput.focus();
        return false;
    }
    
    if (!roleSelect.value) {
        showToast('Please select a role', 'error');
        roleSelect.focus();
        return false;
    }
    
    return true;
}

function sendInvitation() {
    /*
    // In a real app, this would send the invitation via API
    console.log('Sending team invitation');
    showToast('Invitation sent successfully!', 'success'); */
}

function uploadCompanyAvatar(file) {
    /*
    // In a real app, this would upload to a server
    console.log('Uploading company avatar:', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatar = document.querySelector('.company-avatar-large img');
        if (avatar) {
            avatar.src = e.target.result;
        }
        showToast('Company avatar updated!', 'success');
    };
    reader.readAsDataURL(file); */
}

function openPlanChangeModal() {
    // Implement plan change modal
    showToast('Plan change feature coming soon!', 'info');
}

function sortJobsTable(sortBy) {
    const table = document.querySelector('.jobs-management-table tbody');
    const rows = Array.from(table.querySelectorAll('.job-row'));
    
    rows.sort((a, b) => {
        /*
        switch(sortBy) {
            case 'newest':
                return compareDates(a, b, 'posted', false);
            case 'oldest':
                return compareDates(a, b, 'posted', true);
            case 'applicants':
                return compareApplicants(a, b);
            case 'match':
                return compareMatchScore(a, b);
            case 'salary':
                return compareSalary(a, b);
            default:
                return 0;
        } */
    });
    
    // Reorder rows
    rows.forEach(row => table.appendChild(row));
}

function compareDates(a, b, type, ascending) {
    const dateA = getDateFromRow(a, type);
    const dateB = getDateFromRow(b, type);
    return ascending ? dateA - dateB : dateB - dateA;
}

function compareApplicants(a, b) {
    const countA = parseInt(a.querySelector('.applicants-count strong').textContent);
    const countB = parseInt(b.querySelector('.applicants-count strong').textContent);
    return countB - countA;
}

function compareMatchScore(a, b) {
    const scoreA = parseInt(a.querySelector('.circular-progress').getAttribute('data-progress'));
    const scoreB = parseInt(b.querySelector('.circular-progress').getAttribute('data-progress'));
    return scoreB - scoreA;
}

function compareSalary(a, b) {
    const salaryA = extractSalary(a);
    const salaryB = extractSalary(b);
    return salaryB.max - salaryA.max;
}

function getDateFromRow(row, type) {
    const dateText = type === 'posted' 
        ? row.querySelector('.date-display .date').textContent
        : row.querySelector('.expiry-display .date').textContent;
    
    return new Date(dateText);
}

function extractSalary(row) {
    const salaryText = row.querySelector('.job-tag.salary').textContent;
    const matches = salaryText.match(/\$([\d,]+)/g);
    
    if (matches && matches.length >= 2) {
        const min = parseInt(matches[0].replace(/[$,]/g, ''));
        const max = parseInt(matches[1].replace(/[$,]/g, ''));
        return { min, max };
    }
    
    return { min: 0, max: 0 };
}

function refreshJobList() {
    // In a real app, this would fetch updated jobs from API
    console.log('Refreshing job list');
    
    // Show loading state
    const table = document.querySelector('.jobs-table');
    if (table) {
        table.classList.add('loading');
        
        setTimeout(() => {
            table.classList.remove('loading');
            showToast('Job list updated!', 'success');
        }, 1000);
    }
}

function handleNotificationAction(notificationType) {
    // Handle different notification types
    if (notificationType.includes('fa-user-plus')) {
        // New applicant notification
        navigateToApplicants();
    } else if (notificationType.includes('fa-clock')) {
        // Deadline notification
        const jobsLink = document.querySelector('.nav-link[data-section="jobs"]');
        if (jobsLink) jobsLink.click();
    } else if (notificationType.includes('fa-check-circle')) {
        // Approval notification
        showToast('Notification handled', 'info');
    } else if (notificationType.includes('fa-lightbulb')) {
        // Talent match notification
        const talentLink = document.querySelector('.nav-link[data-section="talent"]');
        if (talentLink) talentLink.click();
    }
}

