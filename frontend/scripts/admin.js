// ============================================
// SkillHub Admin Dashboard - Complete JavaScript
// ============================================

class AdminDashboard {
    constructor() {
        this.currentSection = 'overview';
        this.modals = {};
        this.currentTab = {};
        this.notifications = [];
        this.data = {
            users: [],
            certificates: [],
            jobs: [],
            revenue: [],
            analytics: this.getDefaultAnalyticsData()
        };
        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        this.initializeDOM();
        this.setupEventListeners();
        this.setupNotifications();
        this.loadSampleData();
        this.initializeTooltips();
        this.setupKeyboardShortcuts();
        this.applySavedTheme();
        this.initializeAllCharts();
        console.log('Admin Dashboard initialized');
    }

    initializeDOM() {
        // Get all DOM elements
        this.elements = {
            // Navigation
            navItems: document.querySelectorAll('.sidebar-nav li'),
            sections: document.querySelectorAll('.dashboard-section'),
            sectionTitle: document.getElementById('section-title'),
            breadcrumbSection: document.getElementById('breadcrumb-section'),
            
            // Header
            searchInput: document.querySelector('.search-box input'),
            notificationBell: document.querySelector('.notification'),
            quickActionsBtn: document.getElementById('quick-actions-btn'),
            logoutBtn: document.querySelector('.logout-btn'),
            
            // Modals
            quickActionsModal: document.getElementById('quick-actions-modal'),
            modalCloseBtns: document.querySelectorAll('.close-modal'),
            
            // Tables
            selectAllCheckbox: document.getElementById('select-all'),
            rowCheckboxes: document.querySelectorAll('.row-checkbox'),
            
            // Tabs
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Filters
            filterSelects: document.querySelectorAll('.filter-select'),
            
            // Actions
            verifyBtns: document.querySelectorAll('.verify-btn'),
            actionBtns: document.querySelectorAll('.action-btn'),
            exportBtns: document.querySelectorAll('.export-btn'),
            
            // Analytics
            analyticsTabBtns: document.querySelectorAll('#analytics .tab-btn'),
            exportReportBtn: document.querySelector('.btn-primary .fa-download')?.closest('.btn'),
            
            // Quick Actions
            pageBtns: document.querySelectorAll('.page-btn'),
            
            // Charts
            userGrowthChart: document.getElementById('user-growth-chart'),
            revenueChart: document.getElementById('revenue-chart')
        };

        // Initialize modals
        this.modals.quickActions = this.elements.quickActionsModal;
        this.modals.createSkillPath = document.getElementById('create-skillpath-modal');
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
        // Navigation
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Search functionality
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', 
                this.debounce((e) => this.handleSearch(e), 300)
            );
        }

        // Quick Actions Modal
        if (this.elements.quickActionsBtn) {
            this.elements.quickActionsBtn.addEventListener('click', () => this.openModal('quickActions'));
        }
        
        // Logout
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Select All Checkbox
        if (this.elements.selectAllCheckbox) {
            this.elements.selectAllCheckbox.addEventListener('change', (e) => this.handleSelectAll(e));
        }

        // Tabs
        this.elements.tabBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // Analytics Tabs
        this.elements.analyticsTabBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnalyticsTabSwitch(e));
        });

        // Filters
        this.elements.filterSelects?.forEach(select => {
            select.addEventListener('change', () => this.handleFilterChange());
        });

        // Pagination
        this.elements.pageBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePagination(e));
        });

        // Modal Close Buttons
        this.elements.modalCloseBtns?.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Verify Buttons
        this.elements.verifyBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleVerification(e));
        });

        // Action Buttons
        this.elements.actionBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleUserAction(e));
        });

        // Export Buttons
        this.elements.exportBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleExport(e));
        });

        // Analytics Export
        if (this.elements.exportReportBtn) {
            this.elements.exportReportBtn.addEventListener('click', () => this.exportAnalyticsReport());
        }

        // Close modals on outside click
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcut(e));

        // Window resize
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
    }

    // ============================================
    // NAVIGATION
    // ============================================

    handleNavigation(event) {
        const navItem = event.currentTarget;
        const sectionId = navItem.getAttribute('data-section');
        
        // Update active nav item
        this.elements.navItems.forEach(nav => nav.classList.remove('active'));
        navItem.classList.add('active');
        
        // Show selected section
        this.showSection(sectionId);
        
        // Update page title
        const sectionName = navItem.querySelector('span').textContent;
        this.updatePageTitle(sectionName);
        
        // Store current section
        this.currentSection = sectionId;
        
        // Load section-specific data
        this.loadSectionData(sectionId);
        
        // Initialize charts for the section
        this.initializeSectionCharts(sectionId);
    }

    showSection(sectionId) {
        this.elements.sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
                // Initialize section
                this.initSection(sectionId);
            }
        });
    }

    updatePageTitle(sectionName) {
        if (this.elements.sectionTitle) {
            this.elements.sectionTitle.textContent = `${sectionName} Dashboard`;
        }
        if (this.elements.breadcrumbSection) {
            this.elements.breadcrumbSection.textContent = sectionName;
        }
    }

    initSection(sectionId) {
        console.log(`Initializing section: ${sectionId}`);
        
        switch(sectionId) {
            case 'overview':
                this.initOverview();
                break;
            case 'users':
                this.initUserManagement();
                break;
            case 'certificates':
                this.initCertificateManagement();
                break;
            case 'content':
                this.initContentManagement();
                break;
            case 'jobs':
                this.initJobManagement();
                break;
            case 'skillpaths':
                this.initSkillPaths();
                break;
            case 'finance':
                this.initFinanceDashboard();
                break;
            case 'analytics':
                this.initAnalyticsDashboard();
                break;
            case 'settings':
                this.initSettings();
                break;
        }
    }

    // ============================================
    // CHART VISUALIZATIONS (SVG-Based)
    // ============================================

    initializeAllCharts() {
        // Initialize all charts on page load
        this.renderOverviewCharts();
    }

    initializeSectionCharts(sectionId) {
        switch(sectionId) {
            case 'overview':
                this.renderOverviewCharts();
                break;
            case 'analytics':
                setTimeout(() => this.renderAllAnalyticsCharts(), 100);
                break;
            case 'finance':
                setTimeout(() => this.renderFinanceCharts(), 100);
                break;
        }
    }

    // OVERVIEW CHARTS
    renderOverviewCharts() {
        // User Growth Chart
        if (this.elements.userGrowthChart) {
            this.renderUserGrowthChart();
        }

        // Revenue Chart
        if (this.elements.revenueChart) {
            this.renderRevenueChart();
        }
    }

    renderUserGrowthChart() {
        const chartData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            newUsers: [1250, 1400, 1650, 2200, 2800, 3400, 4000],
            activeUsers: [900, 1050, 1250, 1650, 2100, 2500, 2900]
        };

        const maxValue = Math.max(...chartData.newUsers, ...chartData.activeUsers);
        const width = 400;
        const height = 200;
        const padding = { top: 20, right: 30, bottom: 30, left: 50 };

        const svgContent = `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, 5, 5)}
                
                <!-- New Users line -->
                ${this.generateLinePath(chartData.newUsers, width, height, padding, maxValue, '#4361ee')}
                
                <!-- Active Users line -->
                ${this.generateLinePath(chartData.activeUsers, width, height, padding, maxValue, '#4cc9f0')}
                
                <!-- New Users data points -->
                ${this.generateDataPoints(chartData.newUsers, width, height, padding, maxValue, '#4361ee')}
                
                <!-- Active Users data points -->
                ${this.generateDataPoints(chartData.activeUsers, width, height, padding, maxValue, '#4cc9f0')}
                
                <!-- X-axis labels -->
                ${this.generateXAxisLabels(chartData.labels, width, height, padding)}
                
                <!-- Y-axis labels -->
                ${this.generateYAxisLabels(maxValue, width, height, padding, 5)}
                
                <!-- Legend -->
                <g transform="translate(${width - 150}, 10)">
                    <rect x="0" y="0" width="140" height="60" fill="white" stroke="#e0e0e0" rx="4"/>
                    <circle cx="20" cy="20" r="5" fill="#4361ee"/>
                    <text x="35" y="23" class="chart-label">New Users</text>
                    <circle cx="20" cy="40" r="5" fill="#4cc9f0"/>
                    <text x="35" y="43" class="chart-label">Active Users</text>
                </g>
            </svg>
        `;

        this.elements.userGrowthChart.innerHTML = svgContent;
    }

    renderRevenueChart() {
        const data = [
            { label: 'Student Subscriptions', value: 45, color: '#4361ee' },
            { label: 'Employer Plans', value: 30, color: '#3a0ca3' },
            { label: 'Course Sales', value: 15, color: '#4cc9f0' },
            { label: 'Certification Fees', value: 7, color: '#f8961e' },
            { label: 'Other', value: 3, color: '#9370db' }
        ];

        const total = data.reduce((sum, item) => sum + item.value, 0);
        let cumulativeAngle = 0;
        const centerX = 100;
        const centerY = 100;
        const radius = 60;
        const holeRadius = 30;

        let paths = '';
        let labels = '';
        let labelY = 180;

        data.forEach((item, index) => {
            const angle = (item.value / total) * 360;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            
            // Create donut segment
            const path = this.createDonutSegment(centerX, centerY, radius, holeRadius, startAngle, endAngle, item.color);
            paths += path;
            
            // Create label
            labels += `
                <g transform="translate(200, ${labelY})">
                    <rect x="0" y="-8" width="12" height="12" fill="${item.color}" rx="2"/>
                    <text x="20" y="4" class="chart-label">${item.label}: ${item.value}%</text>
                </g>
            `;
            
            labelY += 20;
            cumulativeAngle = endAngle;
        });

        const svgContent = `
            <svg viewBox="0 0 400 250" class="chart-svg">
                <!-- Donut chart -->
                <g transform="translate(0, 20)">
                    ${paths}
                    <!-- Center text -->
                    <circle cx="${centerX}" cy="${centerY}" r="${holeRadius - 2}" fill="white"/>
                    <text x="${centerX}" y="${centerY - 10}" text-anchor="middle" class="chart-center-text">Revenue</text>
                    <text x="${centerX}" y="${centerY + 10}" text-anchor="middle" class="chart-center-subtext">$${total}k</text>
                </g>
                
                <!-- Legend -->
                <g transform="translate(200, 20)">
                    ${labels}
                </g>
            </svg>
        `;

        this.elements.revenueChart.innerHTML = svgContent;
    }

    // ANALYTICS CHARTS
    renderAllAnalyticsCharts() {
        // Learning Analytics
        this.renderLearningAnalytics();
        
        // Job Market Analytics
        this.renderJobMarketAnalytics();
        
        // Skills Trending
        this.renderSkillsTrending();
        
        // Placement Analytics
        this.renderPlacementAnalytics();
        
        // Retention Analytics
        this.renderRetentionAnalytics();
        
        // Platform Health
        this.renderPlatformHealth();
    }

    renderLearningAnalytics() {
        const tabContent = document.getElementById('learning-analytics-tab');
        if (!tabContent) return;

        tabContent.innerHTML = `
            <div class="analytics-grid">
                ${this.createAnalyticsChartCard('Course Completion Rates', 'completion-chart', this.renderCompletionChart())}
                ${this.createAnalyticsChartCard('Skill Acquisition Speed', 'skill-speed-chart', this.renderSkillSpeedChart())}
                ${this.createAnalyticsChartCard('Learning Path Effectiveness', 'effectiveness-chart', this.renderEffectivenessChart())}
                ${this.createAnalyticsChartCard('Time Spent Analysis', 'time-spent-chart', this.renderTimeSpentChart())}
            </div>
        `;
    }

    createAnalyticsChartCard(title, id, chartContent) {
        return `
            <div class="analytics-card">
                <h4>${title}</h4>
                <div class="chart-placeholder" id="${id}">
                    ${chartContent}
                </div>
            </div>
        `;
    }

    renderCompletionChart() {
        const data = [68, 22, 10]; // Completed, In Progress, Not Started
        const labels = ['Completed', 'In Progress', 'Not Started'];
        const colors = ['#2ecc71', '#f8961e', '#e9ecef'];
        
        const total = data.reduce((a, b) => a + b, 0);
        let cumulativeAngle = 0;
        const centerX = 100;
        const centerY = 100;
        const radius = 50;
        const holeRadius = 20;

        let paths = '';
        let labelsSvg = '';
        let labelY = 170;

        data.forEach((value, index) => {
            const angle = (value / total) * 360;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            
            paths += this.createDonutSegment(centerX, centerY, radius, holeRadius, startAngle, endAngle, colors[index]);
            
            labelsSvg += `
                <g transform="translate(200, ${labelY})">
                    <rect x="0" y="-8" width="12" height="12" fill="${colors[index]}" rx="2"/>
                    <text x="20" y="4" class="chart-label">${labels[index]}: ${value}%</text>
                </g>
            `;
            
            labelY += 20;
            cumulativeAngle = endAngle;
        });

        return `
            <svg viewBox="0 0 400 200" class="chart-svg">
                ${paths}
                <!-- Center text -->
                <circle cx="${centerX}" cy="${centerY}" r="${holeRadius - 2}" fill="white"/>
                <text x="${centerX}" y="${centerY - 5}" text-anchor="middle" class="chart-center-text">${total}%</text>
                <text x="${centerX}" y="${centerY + 10}" text-anchor="middle" class="chart-center-subtext">Total</text>
                
                <!-- Legend -->
                <g transform="translate(200, 20)">
                    ${labelsSvg}
                </g>
            </svg>
        `;
    }

    renderSkillSpeedChart() {
        const data = [
            { skill: 'Web Dev', months: 2.5 },
            { skill: 'Data Science', months: 3.2 },
            { skill: 'Design', months: 2.8 },
            { skill: 'Marketing', months: 1.9 },
            { skill: 'Business', months: 3.5 }
        ];

        const maxMonths = Math.max(...data.map(d => d.months));
        const width = 350;
        const height = 200;
        const padding = { top: 20, right: 30, bottom: 40, left: 60 };
        const barWidth = 40;
        const gap = 20;

        let bars = '';
        let labels = '';

        data.forEach((item, index) => {
            const x = padding.left + index * (barWidth + gap);
            const barHeight = (item.months / maxMonths) * (height - padding.top - padding.bottom);
            const y = height - padding.bottom - barHeight;

            bars += `
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                      fill="#4361ee" rx="4" opacity="0.7"/>
                <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" class="chart-label">
                    ${item.months} mo
                </text>
            `;

            labels += `
                <text x="${x + barWidth/2}" y="${height - 20}" text-anchor="middle" class="chart-label">
                    ${item.skill}
                </text>
            `;
        });

        return `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, 0, 5)}
                
                <!-- Bars -->
                ${bars}
                
                <!-- X-axis labels -->
                ${labels}
                
                <!-- Y-axis label -->
                <text x="${padding.left/2}" y="${height/2}" text-anchor="middle" 
                      transform="rotate(-90 ${padding.left/2} ${height/2})" class="chart-label">
                    Months to Proficiency
                </text>
            </svg>
        `;
    }

    renderEffectivenessChart() {
        const data = {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            completion: [65, 72, 78, 85],
            satisfaction: [4.2, 4.5, 4.7, 4.8]
        };

        const width = 350;
        const height = 200;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };

        // Normalize satisfaction scores (scale to 0-100 for display)
        const normalizedSatisfaction = data.satisfaction.map(s => s * 20);

        // Generate completion line
        const completionLine = this.generateLinePath(
            data.completion, 
            width, height, padding, 100, 
            '#4361ee', false
        );

        // Generate satisfaction line
        const satisfactionLine = this.generateLinePath(
            normalizedSatisfaction, 
            width, height, padding, 100, 
            '#4cc9f0', false
        );

        // Add data points
        let dataPoints = '';
        data.completion.forEach((value, index) => {
            const x = padding.left + (index * (width - padding.left - padding.right) / (data.labels.length - 1));
            const y = height - padding.bottom - (value / 100) * (height - padding.top - padding.bottom);
            dataPoints += `<circle cx="${x}" cy="${y}" r="3" fill="#4361ee"/>`;
        });

        return `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, 4, 5)}
                
                <!-- Lines -->
                ${completionLine}
                ${satisfactionLine}
                
                <!-- Data points -->
                ${dataPoints}
                
                <!-- X-axis labels -->
                ${this.generateXAxisLabels(data.labels, width, height, padding)}
                
                <!-- Y-axis label -->
                <text x="${padding.left/2}" y="${height/2}" text-anchor="middle" 
                      transform="rotate(-90 ${padding.left/2} ${height/2})" class="chart-label">
                    Score
                </text>
                
                <!-- Legend -->
                <g transform="translate(${width - 120}, 10)">
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#4361ee" stroke-width="2"/>
                    <text x="30" y="13" class="chart-label">Completion</text>
                    <line x1="0" y1="25" x2="20" y2="25" stroke="#4cc9f0" stroke-width="2"/>
                    <text x="30" y="28" class="chart-label">Satisfaction</text>
                </g>
            </svg>
        `;
    }

    renderTimeSpentChart() {
        const data = [12.5, 14.2, 16.8, 18.5];
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const maxValue = Math.max(...data);

        const width = 350;
        const height = 200;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };

        // Generate area path
        let pathData = '';
        data.forEach((value, index) => {
            const x = padding.left + (index * (width - padding.left - padding.right) / (data.length - 1));
            const y = height - padding.bottom - (value / maxValue) * (height - padding.top - padding.bottom);
            
            if (index === 0) {
                pathData = `M ${x} ${height - padding.bottom} L ${x} ${y} `;
            } else {
                pathData += `L ${x} ${y} `;
            }
            
            if (index === data.length - 1) {
                pathData += `L ${x} ${height - padding.bottom} Z`;
            }
        });

        return `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, 4, 5)}
                
                <!-- Area chart -->
                <path d="${pathData}" fill="rgba(144, 190, 109, 0.3)" stroke="#90be6d" stroke-width="2"/>
                
                <!-- Data points -->
                ${this.generateDataPoints(data, width, height, padding, maxValue, '#90be6d')}
                
                <!-- X-axis labels -->
                ${this.generateXAxisLabels(labels, width, height, padding)}
                
                <!-- Y-axis label -->
                <text x="${padding.left/2}" y="${height/2}" text-anchor="middle" 
                      transform="rotate(-90 ${padding.left/2} ${height/2})" class="chart-label">
                    Hours
                </text>
            </svg>
        `;
    }

    renderJobMarketAnalytics() {
        const tabContent = document.getElementById('job-analytics-tab');
        if (!tabContent) return;

        const topSkills = [
            { skill: 'Python', demand: 85 },
            { skill: 'JavaScript', demand: 78 },
            { skill: 'React', demand: 72 },
            { skill: 'AWS', demand: 68 },
            { skill: 'Data Science', demand: 65 }
        ];

        const hiringSuccess = [68, 72, 75, 78, 82, 85];
        const hiringLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        tabContent.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h4>Top In-Demand Skills</h4>
                    <div class="skills-list">
                        ${topSkills.map(item => `
                            <div class="skill-item">
                                <span class="skill-name">${item.skill}</span>
                                <div class="skill-bar">
                                    <div class="skill-fill" style="width: ${item.demand}%"></div>
                                </div>
                                <span class="skill-percentage">${item.demand}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="analytics-card">
                    <h4>Hiring Success Rate</h4>
                    <div class="chart-placeholder">
                        ${this.renderHiringSuccessChart(hiringSuccess, hiringLabels)}
                    </div>
                </div>
                <div class="analytics-card">
                    <h4>Employer Satisfaction</h4>
                    <div class="rating-display">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star-half-alt"></i>
                        </div>
                        <p class="rating-score">4.7/5.0</p>
                        <p class="rating-count">Based on 892 reviews</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderHiringSuccessChart(data, labels) {
        const width = 350;
        const height = 200;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };
        const maxValue = 100;

        const linePath = this.generateLinePath(data, width, height, padding, maxValue, '#2ecc71', true);
        const dataPoints = this.generateDataPoints(data, width, height, padding, maxValue, '#2ecc71');

        return `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, data.length - 1, 5)}
                
                <!-- Line -->
                ${linePath}
                
                <!-- Data points -->
                ${dataPoints}
                
                <!-- X-axis labels -->
                ${this.generateXAxisLabels(labels, width, height, padding)}
                
                <!-- Y-axis label -->
                <text x="${padding.left/2}" y="${height/2}" text-anchor="middle" 
                      transform="rotate(-90 ${padding.left/2} ${height/2})" class="chart-label">
                    Success Rate (%)
                </text>
            </svg>
        `;
    }

    renderSkillsTrending() {
        const tabContent = document.getElementById('skills-trending-tab');
        if (!tabContent) return;

        const trendingSkills = [
            { skill: 'Generative AI', trend: 42, change: 'up', description: 'Increased demand for AI/ML skills' },
            { skill: 'Cloud Security', trend: 38, change: 'up', description: 'Growing need for cloud security experts' },
            { skill: 'Data Engineering', trend: 32, change: 'up', description: 'High demand for data pipeline specialists' },
            { skill: 'Cybersecurity', trend: 28, change: 'up', description: 'Critical need for security professionals' },
            { skill: 'Mobile Dev', trend: -12, change: 'down', description: 'Market stabilization in mobile' }
        ];

        tabContent.innerHTML = `
            <div class="trending-skills">
                <h4>Top Trending Skills</h4>
                <div class="trending-grid">
                    ${trendingSkills.map(skill => `
                        <div class="trending-card ${skill.change}">
                            <div class="trending-header">
                                <h5>${skill.skill}</h5>
                                <span class="trend-indicator ${skill.change}">
                                    ${skill.change === 'up' ? '↑' : '↓'} ${Math.abs(skill.trend)}%
                                </span>
                            </div>
                            <div class="trend-sparkline" data-trend="${skill.trend}"></div>
                            <p>${skill.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Render sparklines after DOM is updated
        setTimeout(() => this.renderAllSparklines(), 100);
    }

    renderAllSparklines() {
        document.querySelectorAll('.trend-sparkline').forEach((container, index) => {
            const trend = parseInt(container.getAttribute('data-trend'));
            this.renderSparkline(container, trend);
        });
    }

    renderSparkline(container, trend) {
        const data = this.generateSparklineData(trend);
        const width = 120;
        const height = 40;
        
        let pathData = '';
        data.forEach((value, index) => {
            const x = (index * width) / (data.length - 1);
            const y = height - (value / 100) * height;
            
            if (index === 0) {
                pathData = `M ${x} ${y} `;
            } else {
                pathData += `L ${x} ${y} `;
            }
        });

        container.innerHTML = `
            <svg width="${width}" height="${height}" class="sparkline-svg">
                <path d="${pathData}" fill="none" 
                      stroke="${trend > 0 ? '#2ecc71' : '#f94144'}" 
                      stroke-width="2"/>
            </svg>
        `;
    }

    renderPlacementAnalytics() {
        const tabContent = document.getElementById('placement-tab');
        if (!tabContent) return;

        const placementData = {
            placementRate: 68,
            avgTimeToPlacement: 3.2,
            avgSalaryIncrease: 42,
            employerPartnerships: 245,
            monthlyPlacements: [145, 168, 192, 210, 234, 258],
            monthlyLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        };

        tabContent.innerHTML = `
            <div class="placement-metrics">
                <div class="metric-grid">
                    <div class="metric-card success">
                        <h5>Placement Rate</h5>
                        <p class="metric-value">${placementData.placementRate}%</p>
                        <small>Of enrolled students</small>
                    </div>
                    <div class="metric-card">
                        <h5>Avg Time to Placement</h5>
                        <p class="metric-value">${placementData.avgTimeToPlacement} months</p>
                        <small>After course completion</small>
                    </div>
                    <div class="metric-card">
                        <h5>Avg Salary Increase</h5>
                        <p class="metric-value">${placementData.avgSalaryIncrease}%</p>
                        <small>Post-completion</small>
                    </div>
                    <div class="metric-card">
                        <h5>Employer Partnerships</h5>
                        <p class="metric-value">${placementData.employerPartnerships}</p>
                        <small>Active hiring partners</small>
                    </div>
                </div>
                <div class="monthly-placements-chart" style="margin-top: 30px;">
                    <h4>Monthly Placements</h4>
                    <div class="chart-placeholder">
                        ${this.renderMonthlyPlacementsChart(placementData.monthlyPlacements, placementData.monthlyLabels)}
                    </div>
                </div>
            </div>
        `;
    }

    renderMonthlyPlacementsChart(data, labels) {
        const width = 350;
        const height = 200;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };
        const maxValue = Math.max(...data);
        const barWidth = 30;
        const gap = 15;

        let bars = '';
        data.forEach((value, index) => {
            const x = padding.left + index * (barWidth + gap);
            const barHeight = (value / maxValue) * (height - padding.top - padding.bottom);
            const y = height - padding.bottom - barHeight;

            bars += `
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                      fill="#4361ee" rx="4"/>
                <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" class="chart-label">
                    ${value}
                </text>
            `;
        });

        return `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, 0, 5)}
                
                <!-- Bars -->
                ${bars}
                
                <!-- X-axis labels -->
                ${this.generateXAxisLabels(labels, width, height, padding)}
                
                <!-- Y-axis label -->
                <text x="${padding.left/2}" y="${height/2}" text-anchor="middle" 
                      transform="rotate(-90 ${padding.left/2} ${height/2})" class="chart-label">
                    Placements
                </text>
            </svg>
        `;
    }

    renderRetentionAnalytics() {
        const tabContent = document.getElementById('retention-tab');
        if (!tabContent) return;

        const funnelData = {
            signup: 25847,
            active: 18429,
            premium: 5361,
            engaged: 3245
        };

        const churnData = [12.5, 11.8, 10.2, 9.5, 8.8, 8.2];
        const churnLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        tabContent.innerHTML = `
            <div class="retention-funnel">
                <h4>User Retention Funnel</h4>
                <div class="funnel-steps">
                    <div class="funnel-step">
                        <div class="step-header">
                            <span class="step-number">1</span>
                            <h5>Signup</h5>
                        </div>
                        <p class="step-count">${funnelData.signup.toLocaleString()}</p>
                        <div class="step-bar" style="height: 100%"></div>
                    </div>
                    <div class="funnel-step">
                        <div class="step-header">
                            <span class="step-number">2</span>
                            <h5>Active</h5>
                        </div>
                        <p class="step-count">${funnelData.active.toLocaleString()}</p>
                        <div class="step-bar" style="height: ${(funnelData.active / funnelData.signup) * 100}%"></div>
                    </div>
                    <div class="funnel-step">
                        <div class="step-header">
                            <span class="step-number">3</span>
                            <h5>Premium</h5>
                        </div>
                        <p class="step-count">${funnelData.premium.toLocaleString()}</p>
                        <div class="step-bar" style="height: ${(funnelData.premium / funnelData.signup) * 100}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="retention-chart">
                <h4>Churn Analysis</h4>
                <div class="chart-placeholder">
                    ${this.renderChurnChart(churnData, churnLabels)}
                </div>
            </div>
        `;
    }

    renderChurnChart(data, labels) {
        const width = 350;
        const height = 200;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };
        const maxValue = Math.max(...data);

        // Generate area path (reversed since lower is better for churn)
        let pathData = '';
        const normalizedData = data.map(value => (value / maxValue) * 100);
        
        normalizedData.forEach((value, index) => {
            const x = padding.left + (index * (width - padding.left - padding.right) / (data.length - 1));
            const y = height - padding.bottom - value;
            
            if (index === 0) {
                pathData = `M ${x} ${height - padding.bottom} L ${x} ${y} `;
            } else {
                pathData += `L ${x} ${y} `;
            }
            
            if (index === data.length - 1) {
                pathData += `L ${x} ${height - padding.bottom} Z`;
            }
        });

        return `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, data.length - 1, 5)}
                
                <!-- Area chart -->
                <path d="${pathData}" fill="rgba(249, 65, 68, 0.2)" stroke="#f94144" stroke-width="2"/>
                
                <!-- Data points -->
                ${this.generateDataPoints(normalizedData, width, height, padding, 100, '#f94144')}
                
                <!-- X-axis labels -->
                ${this.generateXAxisLabels(labels, width, height, padding)}
                
                <!-- Y-axis label -->
                <text x="${padding.left/2}" y="${height/2}" text-anchor="middle" 
                      transform="rotate(-90 ${padding.left/2} ${height/2})" class="chart-label">
                    Churn Rate (%)
                </text>
            </svg>
        `;
    }

    renderPlatformHealth() {
        const tabContent = document.getElementById('platform-health-tab');
        if (!tabContent) return;

        const healthData = {
            uptime: 99.8,
            apiResponseTime: 128,
            errorRate: 0.2,
            userSatisfaction: 4.5
        };

        tabContent.innerHTML = `
            <div class="health-metrics">
                <div class="health-grid">
                    ${this.createHealthMetric('Uptime', healthData.uptime, '%', 'uptime')}
                    ${this.createHealthMetric('API Response Time', healthData.apiResponseTime, 'ms', 'response')}
                    ${this.createHealthMetric('Error Rate', healthData.errorRate, '%', 'error')}
                    ${this.createHealthMetric('User Satisfaction', healthData.userSatisfaction, '/5', 'satisfaction')}
                </div>
            </div>
            
            <div class="system-metrics-chart" style="margin-top: 30px;">
                <h4>System Performance Metrics</h4>
                <div class="chart-placeholder">
                    ${this.renderSystemMetricsChart()}
                </div>
            </div>
            
            <div class="system-logs">
                <h4>Recent System Events</h4>
                <div class="logs-list">
                    <div class="log-item info">
                        <span class="log-time">2024-03-20 14:30:12</span>
                        <span class="log-message">API sync completed successfully for Udemy</span>
                    </div>
                    <div class="log-item warning">
                        <span class="log-time">2024-03-20 13:45:23</span>
                        <span class="log-message">Certificate verification queue exceeds 200 items</span>
                    </div>
                    <div class="log-item success">
                        <span class="log-time">2024-03-20 12:15:45</span>
                        <span class="log-message">Daily backup completed successfully</span>
                    </div>
                </div>
            </div>
        `;
    }

    createHealthMetric(label, value, unit, type) {
        const status = this.getHealthStatus(value, type);
        const percentage = type === 'satisfaction' ? (value / 5) * 100 : 
                          type === 'response' ? Math.max(0, 100 - (value / 500) * 100) :
                          type === 'error' ? Math.max(0, 100 - value) : value;

        return `
            <div class="health-metric">
                <h5>${label}</h5>
                <p class="metric-value">${value}${unit}</p>
                <div class="health-bar">
                    <div class="health-fill ${status}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }

    renderSystemMetricsChart() {
        const data = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            cpu: [45, 48, 52, 50, 47, 42, 38],
            memory: [65, 68, 72, 70, 67, 62, 58],
            database: [32, 35, 38, 36, 34, 30, 28]
        };

        const width = 400;
        const height = 250;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };

        // Generate lines for each metric
        const cpuLine = this.generateLinePath(data.cpu, width, height, padding, 100, '#4361ee', false);
        const memoryLine = this.generateLinePath(data.memory, width, height, padding, 100, '#f8961e', false);
        const databaseLine = this.generateLinePath(data.database, width, height, padding, 100, '#90be6d', false);

        return `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, data.labels.length - 1, 5)}
                
                <!-- Metric lines -->
                ${cpuLine}
                ${memoryLine}
                ${databaseLine}
                
                <!-- Data points -->
                ${this.generateDataPoints(data.cpu, width, height, padding, 100, '#4361ee')}
                ${this.generateDataPoints(data.memory, width, height, padding, 100, '#f8961e')}
                ${this.generateDataPoints(data.database, width, height, padding, 100, '#90be6d')}
                
                <!-- X-axis labels -->
                ${this.generateXAxisLabels(data.labels, width, height, padding)}
                
                <!-- Y-axis label -->
                <text x="${padding.left/2}" y="${height/2}" text-anchor="middle" 
                      transform="rotate(-90 ${padding.left/2} ${height/2})" class="chart-label">
                    Usage (%)
                </text>
                
                <!-- Legend -->
                <g transform="translate(${width - 130}, 10)">
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#4361ee" stroke-width="2"/>
                    <text x="25" y="13" class="chart-label">CPU</text>
                    <line x1="0" y1="25" x2="20" y2="25" stroke="#f8961e" stroke-width="2"/>
                    <text x="25" y="28" class="chart-label">Memory</text>
                    <line x1="0" y1="40" x2="20" y2="40" stroke="#90be6d" stroke-width="2"/>
                    <text x="25" y="43" class="chart-label">Database</text>
                </g>
            </svg>
        `;
    }

    // ============================================
    // FINANCE CHARTS
    // ============================================

    initFinanceDashboard() {
        console.log('Initializing finance dashboard...');
        setTimeout(() => this.renderFinanceCharts(), 100);
    }

    renderFinanceCharts() {
        // Find or create chart containers
        this.renderRevenueTrendChart();
        this.renderSubscriptionChart();
        this.renderRevenueBreakdownChart();
    }

    renderRevenueTrendChart() {
        const container = document.querySelector('#revenue-trend-chart');
        if (!container) return;

        const data = [45000, 52000, 68000, 75000, 82000, 90170];
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        const width = 350;
        const height = 200;
        const padding = { top: 20, right: 30, bottom: 40, left: 60 };
        const maxValue = Math.max(...data);

        const linePath = this.generateLinePath(data, width, height, padding, maxValue, '#4361ee', true);
        const dataPoints = this.generateDataPoints(data, width, height, padding, maxValue, '#4361ee');

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, data.length - 1, 5)}
                
                <!-- Line -->
                ${linePath}
                
                <!-- Data points -->
                ${dataPoints}
                
                <!-- X-axis labels -->
                ${this.generateXAxisLabels(labels, width, height, padding)}
                
                <!-- Y-axis label -->
                <text x="${padding.left/2}" y="${height/2}" text-anchor="middle" 
                      transform="rotate(-90 ${padding.left/2} ${height/2})" class="chart-label">
                    Revenue ($)
                </text>
            </svg>
        `;
    }

    renderRevenueChart() {
        const data = [
            { label: 'Student Subscriptions', value: 45, color: '#4361ee' },
            { label: 'Employer Plans', value: 30, color: '#3a0ca3' },
            { label: 'Course Sales', value: 15, color: '#4cc9f0' },
            { label: 'Certification Fees', value: 7, color: '#f8961e' },
            { label: 'Other', value: 3, color: '#9370db' }
        ];

        const total = data.reduce((sum, item) => sum + item.value, 0);
        let cumulativeAngle = 0;
        const centerX = 100;
        const centerY = 100;
        const radius = 60;
        const holeRadius = 30;
        const labelRadius = 85; // Distance from center for labels

        let paths = '';
        let labels = '';

        data.forEach((item, index) => {
            const angle = (item.value / total) * 360;
            const midAngle = cumulativeAngle + angle / 2;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            
            // Create donut segment
            const path = this.createDonutSegment(centerX, centerY, radius, holeRadius, startAngle, endAngle, item.color);
            paths += path;
            
            // Calculate label position
            const labelAngle = (midAngle - 90) * Math.PI / 180; // Convert to radians, adjust for 0° at top
            const labelX = centerX + labelRadius * Math.cos(labelAngle);
            const labelY = centerY + labelRadius * Math.sin(labelAngle);
            
            // Create label with line connector
            const connectorX = centerX + (radius + 10) * Math.cos(labelAngle);
            const connectorY = centerY + (radius + 10) * Math.sin(labelAngle);
            
            // Only show labels for larger segments
            if (item.value >= 10) {
                labels += `
                    <line x1="${connectorX}" y1="${connectorY}" x2="${labelX}" y2="${labelY}" 
                        stroke="${item.color}" stroke-width="1" stroke-dasharray="2,2"/>
                    <g transform="translate(${labelX}, ${labelY})">
                        <text x="${labelX < centerX ? -5 : 5}" y="4" 
                            text-anchor="${labelX < centerX ? 'end' : 'start'}" 
                            class="chart-label" font-size="10">
                            ${item.value}%
                        </text>
                    </g>
                `;
            }
            
            cumulativeAngle = endAngle;
        });

        const svgContent = `
            <svg viewBox="0 0 200 200" class="chart-svg" style="width: 100%; height: 100%;">
                ${paths}
                
                <!-- Center text -->
                <circle cx="${centerX}" cy="${centerY}" r="${holeRadius - 2}" fill="white"/>
                <text x="${centerX}" y="${centerY - 10}" text-anchor="middle" 
                    class="chart-center-text" font-weight="600" font-size="14">
                    Revenue
                </text>
                <text x="${centerX}" y="${centerY + 10}" text-anchor="middle" 
                    class="chart-center-subtext" font-size="12">
                    $${total}k
                </text>
                
                ${labels}
            </svg>
            
            <!-- Legend below chart -->
            <div class="chart-legend" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                ${data.map(item => `
                    <div class="legend-item" style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 12px; height: 12px; background: ${item.color}; border-radius: 2px;"></div>
                        <span style="font-size: 11px; color: #666;">${item.label}</span>
                    </div>
                `).join('')}
            </div>
        `;

        this.elements.revenueChart.innerHTML = svgContent;
    }

    renderRevenueBreakdownChart() {
        const container = document.querySelector('.breakdown-chart');
        if (!container) return;

        const data = {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            student: [25000, 32000, 38000, 42000],
            employer: [18000, 22000, 28000, 32000],
            other: [2000, 3000, 4000, 5000]
        };

        const width = 400;
        const height = 250;
        const padding = { top: 20, right: 30, bottom: 40, left: 60 };
        const barWidth = 25;
        const gap = 10;

        // Calculate stacked totals
        const totals = data.labels.map((_, index) => 
            data.student[index] + data.employer[index] + data.other[index]
        );
        const maxTotal = Math.max(...totals);

        let bars = '';
        data.labels.forEach((label, quarterIndex) => {
            const x = padding.left + quarterIndex * (barWidth * 3 + gap * 3 + 20);
            
            // Student revenue (bottom)
            const studentHeight = (data.student[quarterIndex] / maxTotal) * (height - padding.top - padding.bottom);
            const studentY = height - padding.bottom - studentHeight;
            bars += `
                <rect x="${x}" y="${studentY}" width="${barWidth}" height="${studentHeight}" 
                      fill="#4361ee" rx="2"/>
            `;
            
            // Employer revenue (middle)
            const employerHeight = (data.employer[quarterIndex] / maxTotal) * (height - padding.top - padding.bottom);
            const employerY = studentY - employerHeight;
            bars += `
                <rect x="${x + barWidth}" y="${employerY}" width="${barWidth}" height="${employerHeight}" 
                      fill="#4cc9f0" rx="2"/>
            `;
            
            // Other revenue (top)
            const otherHeight = (data.other[quarterIndex] / maxTotal) * (height - padding.top - padding.bottom);
            const otherY = employerY - otherHeight;
            bars += `
                <rect x="${x + barWidth * 2}" y="${otherY}" width="${barWidth}" height="${otherHeight}" 
                      fill="#f8961e" rx="2"/>
            `;
            
            // Quarter label
            bars += `
                <text x="${x + barWidth * 1.5}" y="${height - padding.bottom + 15}" 
                      text-anchor="middle" class="chart-label">${label}</text>
            `;
        });

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
                <!-- Grid lines -->
                ${this.generateGridLines(width, height, padding, 0, 5)}
                
                <!-- Stacked bars -->
                ${bars}
                
                <!-- Y-axis label -->
                <text x="${padding.left/2}" y="${height/2}" text-anchor="middle" 
                      transform="rotate(-90 ${padding.left/2} ${height/2})" class="chart-label">
                    Revenue ($)
                </text>
                
                <!-- Legend -->
                <g transform="translate(${width - 120}, 10)">
                    <rect x="0" y="0" width="12" height="12" fill="#4361ee" rx="2"/>
                    <text x="20" y="10" class="chart-label">Student</text>
                    <rect x="0" y="20" width="12" height="12" fill="#4cc9f0" rx="2"/>
                    <text x="20" y="30" class="chart-label">Employer</text>
                    <rect x="0" y="40" width="12" height="12" fill="#f8961e" rx="2"/>
                    <text x="20" y="50" class="chart-label">Other</text>
                </g>
            </svg>
        `;
    }

    // ============================================
    // SVG HELPER FUNCTIONS
    // ============================================

    generateGridLines(width, height, padding, xDivisions, yDivisions) {
        let gridLines = '';
        
        // Horizontal grid lines
        for (let i = 0; i <= yDivisions; i++) {
            const y = padding.top + (i * (height - padding.top - padding.bottom) / yDivisions);
            gridLines += `
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
                      stroke="#e0e0e0" stroke-width="1" stroke-dasharray="2,2"/>
            `;
        }
        
        // Vertical grid lines (if xDivisions > 0)
        if (xDivisions > 0) {
            for (let i = 0; i <= xDivisions; i++) {
                const x = padding.left + (i * (width - padding.left - padding.right) / xDivisions);
                gridLines += `
                    <line x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}" 
                          stroke="#e0e0e0" stroke-width="1" stroke-dasharray="2,2"/>
                `;
            }
        }
        
        // Axes
        gridLines += `
            <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" 
                  stroke="#666" stroke-width="2"/>
            <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" 
                  stroke="#666" stroke-width="2"/>
        `;
        
        return gridLines;
    }

    generateLinePath(data, width, height, padding, maxValue, color, fill = false) {
        let pathData = '';
        
        data.forEach((value, index) => {
            const x = padding.left + (index * (width - padding.left - padding.right) / (data.length - 1));
            const y = height - padding.bottom - (value / maxValue) * (height - padding.top - padding.bottom);
            
            if (index === 0) {
                pathData = `M ${x} ${y} `;
            } else {
                pathData += `L ${x} ${y} `;
            }
        });
        
        if (fill) {
            // Close the path for filling
            const lastX = padding.left + ((data.length - 1) * (width - padding.left - padding.right) / (data.length - 1));
            pathData = `M ${padding.left} ${height - padding.bottom} ${pathData} L ${lastX} ${height - padding.bottom} Z`;
            
            return `
                <path d="${pathData}" fill="${color}20" stroke="${color}" stroke-width="2"/>
            `;
        }
        
        return `
            <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2"/>
        `;
    }

    generateDataPoints(data, width, height, padding, maxValue, color) {
        let points = '';
        
        data.forEach((value, index) => {
            const x = padding.left + (index * (width - padding.left - padding.right) / (data.length - 1));
            const y = height - padding.bottom - (value / maxValue) * (height - padding.top - padding.bottom);
            
            points += `<circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="white" stroke-width="1.5"/>`;
        });
        
        return points;
    }

    generateXAxisLabels(labels, width, height, padding) {
        let labelElements = '';
        
        labels.forEach((label, index) => {
            const x = padding.left + (index * (width - padding.left - padding.right) / (labels.length - 1));
            labelElements += `
                <text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" class="chart-label">
                    ${label}
                </text>
            `;
        });
        
        return labelElements;
    }

    generateYAxisLabels(maxValue, width, height, padding, divisions) {
        let labelElements = '';
        
        for (let i = 0; i <= divisions; i++) {
            const y = height - padding.bottom - (i * (height - padding.top - padding.bottom) / divisions);
            const value = Math.round((i * maxValue) / divisions);
            
            labelElements += `
                <text x="${padding.left - 10}" y="${y + 3}" text-anchor="end" class="chart-label">
                    ${value.toLocaleString()}
                </text>
            `;
        }
        
        return labelElements;
    }

    createDonutSegment(cx, cy, radius, holeRadius, startAngle, endAngle, color) {
        // Convert angles to radians
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        
        // Calculate points
        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);
        
        const x3 = cx + holeRadius * Math.cos(endRad);
        const y3 = cy + holeRadius * Math.sin(endRad);
        const x4 = cx + holeRadius * Math.cos(startRad);
        const y4 = cy + holeRadius * Math.sin(startRad);
        
        // Create path
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        
        const pathData = `
            M ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            L ${x3} ${y3}
            A ${holeRadius} ${holeRadius} 0 ${largeArc} 0 ${x4} ${y4}
            Z
        `;
        
        return `<path d="${pathData}" fill="${color}" stroke="white" stroke-width="1"/>`;
    }

    // ============================================
    // DATA MANAGEMENT
    // ============================================

    getDefaultAnalyticsData() {
        return {
            learning: {
                courseCompletionRates: {
                    labels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
                    data: [75, 68, 52, 45]
                },
                skillAcquisitionSpeed: {
                    labels: ['Web Dev', 'Data Science', 'Design', 'Marketing', 'Business'],
                    data: [2.5, 3.2, 2.8, 1.9, 3.5]
                },
                learningPathEffectiveness: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    datasets: [
                        { label: 'Completion Rate', data: [65, 72, 78, 85], borderColor: '#4361ee' },
                        { label: 'Satisfaction', data: [4.2, 4.5, 4.7, 4.8], borderColor: '#4cc9f0' }
                    ]
                },
                timeSpentAnalysis: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    data: [12.5, 14.2, 16.8, 18.5]
                }
            },
            jobMarket: {
                topSkills: {
                    labels: ['Python', 'JavaScript', 'React', 'AWS', 'Data Science', 'DevOps', 'UI/UX', 'Cloud'],
                    data: [85, 78, 72, 68, 65, 62, 58, 55]
                },
                hiringSuccess: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    data: [68, 72, 75, 78, 82, 85]
                },
                employerSatisfaction: 4.7
            },
            skills: {
                trending: [
                    { skill: 'Generative AI', trend: 42, change: 'up' },
                    { skill: 'Cloud Security', trend: 38, change: 'up' },
                    { skill: 'Data Engineering', trend: 32, change: 'up' },
                    { skill: 'Cybersecurity', trend: 28, change: 'up' },
                    { skill: 'Mobile Dev', trend: -12, change: 'down' }
                ]
            },
            placement: {
                placementRate: 68,
                avgTimeToPlacement: 3.2,
                avgSalaryIncrease: 42,
                employerPartnerships: 245,
                monthlyPlacements: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    data: [145, 168, 192, 210, 234, 258]
                }
            },
            retention: {
                funnel: {
                    signup: 25847,
                    active: 18429,
                    premium: 5361,
                    engaged: 3245
                },
                churn: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    data: [12.5, 11.8, 10.2, 9.5, 8.8, 8.2]
                }
            },
            platformHealth: {
                uptime: 99.8,
                apiResponseTime: 128,
                errorRate: 0.2,
                userSatisfaction: 4.5,
                systemMetrics: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    cpu: [45, 48, 52, 50, 47, 42, 38],
                    memory: [65, 68, 72, 70, 67, 62, 58],
                    database: [32, 35, 38, 36, 34, 30, 28]
                }
            }
        };
    }

    generateSparklineData(trend) {
        const base = trend > 0 ? [30, 35, 40, 45, 50, 55, 60, 65] : [70, 65, 60, 55, 50, 45, 40, 35];
        return base.map(value => value + (Math.random() * 10 - 5));
    }

    getHealthStatus(value, metricId) {
        switch(metricId) {
            case 'uptime':
                return value >= 99.5 ? 'healthy' : value >= 99 ? 'warning' : 'danger';
            case 'response':
                return value <= 200 ? 'healthy' : value <= 500 ? 'warning' : 'danger';
            case 'error':
                return value <= 0.5 ? 'healthy' : value <= 2 ? 'warning' : 'danger';
            case 'satisfaction':
                return value >= 4 ? 'healthy' : value >= 3 ? 'warning' : 'danger';
            default:
                return 'healthy';
        }
    }

    // ============================================
    // OTHER METHODS (keep from your original code)
    // ============================================

    // Note: The following methods are kept from your original code.
    // They handle user management, certificates, jobs, settings, etc.
    // I'm including them here for completeness, but they're unchanged.

    loadSampleData() {
        setTimeout(() => {
            console.log('Sample data loaded');
        }, 500);
    }

    loadSectionData(sectionId) {
        console.log(`Loading data for section: ${sectionId}`);
    }

    initUserManagement() {
        console.log('Initializing user management...');
        this.populateUserTable();
    }

    initCertificateManagement() {
        console.log('Initializing certificate management...');
        this.populateCertificateQueue();
    }

    initContentManagement() {
        console.log('Initializing content management...');
        this.setupContentTabs();
    }

    initJobManagement() {
        console.log('Initializing job management...');
        this.populateJobList();
    }

    initSkillPaths() {
        console.log('Initializing skill paths...');
        this.setupSkillPathTabs();
    }

    initSettings() {
        console.log('Initializing settings...');
        this.loadSettings();
        this.setupSettingsListeners();
    }

    initAnalyticsDashboard() {
        console.log('Initializing analytics dashboard...');
        this.currentTab.analytics = 'learning-analytics';
        setTimeout(() => this.renderAllAnalyticsCharts(), 100);
        this.setupAnalyticsTabs();
    }

    setupAnalyticsTabs() {
        this.elements.analyticsTabBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = btn.getAttribute('data-tab');
                
                this.elements.analyticsTabBtns.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                
                document.querySelectorAll('#analytics .tab-content').forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}-tab`) {
                        content.classList.add('active');
                    }
                });
                
                this.currentTab.analytics = tabId;
                
                setTimeout(() => {
                    switch(tabId) {
                        case 'learning-analytics':
                            this.renderLearningAnalytics();
                            break;
                        case 'job-analytics':
                            this.renderJobMarketAnalytics();
                            break;
                        case 'skills-trending':
                            this.renderSkillsTrending();
                            break;
                        case 'placement':
                            this.renderPlacementAnalytics();
                            break;
                        case 'retention':
                            this.renderRetentionAnalytics();
                            break;
                        case 'platform-health':
                            this.renderPlatformHealth();
                            break;
                    }
                }, 100);
            });
        });
    }

    // Tab switching handler
    handleTabSwitch(event) {
        const button = event.currentTarget;
        const tabId = button.getAttribute('data-tab');
        const section = button.closest('.dashboard-section');
        const sectionId = section.id;
        
        this.currentTab[sectionId] = tabId;
        
        section.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
        button.classList.add('active');
        
        section.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            }
        });
    }

    handleAnalyticsTabSwitch(event) {
        this.handleTabSwitch(event);
    }

    setupContentTabs() {
        const contentSection = document.getElementById('content');
        if (contentSection) {
            const tabBtns = contentSection.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => this.handleTabSwitch(e));
            });
        }
    }

    setupSkillPathTabs() {
        const skillPathsSection = document.getElementById('skillpaths');
        if (skillPathsSection) {
            const tabBtns = skillPathsSection.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => this.handleTabSwitch(e));
            });
        }
    }

    // Data table population methods
    populateUserTable() {
        const users = [
            {
                id: 'U-1258',
                name: 'John Doe',
                email: 'john@email.com',
                role: 'Student',
                joined: '2024-02-15',
                status: 'Active',
                avatar: 'https://i.pravatar.cc/150?img=1'
            }
        ];

        const tbody = document.querySelector('#users .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td><input type="checkbox" class="row-checkbox"></td>
                <td>${user.id}</td>
                <td>
                    <div class="user-cell">
                        <img src="${user.avatar}" alt="${user.name}">
                        ${user.name}
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge role-${user.role.toLowerCase()}">${user.role}</span></td>
                <td>${user.joined}</td>
                <td><span class="status-badge ${user.status.toLowerCase()}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn ${user.status === 'Active' ? 'suspend' : 'activate'}" 
                                title="${user.status === 'Active' ? 'Suspend' : 'Activate'}">
                            <i class="fas fa-${user.status === 'Active' ? 'ban' : 'check-circle'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populateCertificateQueue() {
        const certificates = [
            {
                userName: 'Emily Chen',
                certificate: 'AWS Certified Solutions Architect',
                provider: 'AWS',
                submitted: '2 hours ago'
            }
        ];

        const queueContainer = document.querySelector('.queue-items');
        if (!queueContainer) return;

        queueContainer.innerHTML = certificates.map(cert => `
            <div class="queue-item">
                <div class="queue-user">
                    <img src="https://i.pravatar.cc/150?img=5" alt="User">
                    <div>
                        <h4>${cert.userName}</h4>
                        <p>${cert.certificate}</p>
                    </div>
                </div>
                <div class="queue-details">
                    <span class="provider">${cert.provider}</span>
                    <span class="time">Submitted ${cert.submitted}</span>
                </div>
                <button class="btn btn-primary btn-sm verify-btn">Verify Now</button>
            </div>
        `).join('');
    }

    populateJobList() {
        const jobs = [
            {
                id: 'J-1001',
                title: 'Senior Frontend Developer',
                company: 'TechCorp Inc',
                posted: '2024-03-15',
                applicants: 45,
                status: 'active',
                salary: '$120,000 - $150,000'
            }
        ];

        const tbody = document.querySelector('#jobs .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = jobs.map(job => `
            <tr>
                <td>${job.id}</td>
                <td>${job.title}</td>
                <td>${job.company}</td>
                <td>${job.posted}</td>
                <td>${job.applicants}</td>
                <td><span class="status-badge ${job.status}">${job.status}</span></td>
                <td>${job.salary}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn ${job.status === 'active' ? 'pause' : 'activate'}" 
                                title="${job.status === 'active' ? 'Pause' : 'Activate'}">
                            <i class="fas fa-${job.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Action handlers
    handleSelectAll(event) {
        const isChecked = event.target.checked;
        const checkboxes = document.querySelectorAll('.row-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    }

    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        const currentSection = this.currentSection;
        
        switch(currentSection) {
            case 'users':
                this.filterUsers(searchTerm);
                break;
            case 'certificates':
                this.filterCertificates(searchTerm);
                break;
            case 'jobs':
                this.filterJobs(searchTerm);
                break;
            default:
                this.filterTable(searchTerm);
        }
    }

    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#users .data-table tbody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const name = row.querySelector('.user-cell').textContent.toLowerCase();
            const email = row.cells[3].textContent.toLowerCase();
            const role = row.cells[4].textContent.toLowerCase();
            
            if (name.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        this.updateResultsCount(visibleCount);
    }

    filterCertificates(searchTerm) {
        const queueItems = document.querySelectorAll('.queue-item');
        queueItems.forEach(item => {
            const userName = item.querySelector('h4').textContent.toLowerCase();
            const certificate = item.querySelector('p').textContent.toLowerCase();
            
            if (userName.includes(searchTerm) || certificate.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    filterJobs(searchTerm) {
        const rows = document.querySelectorAll('#jobs .data-table tbody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const title = row.cells[1].textContent.toLowerCase();
            const company = row.cells[2].textContent.toLowerCase();
            
            if (title.includes(searchTerm) || company.includes(searchTerm)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        this.updateResultsCount(visibleCount);
    }

    filterTable(searchTerm) {
        const rows = document.querySelectorAll('.data-table tbody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        this.updateResultsCount(visibleCount);
    }

    updateResultsCount(count) {
        const resultsCount = document.querySelector('.results-count');
        if (resultsCount) {
            const total = this.getTotalItems();
            resultsCount.textContent = `Showing 1-${count} of ${total} items`;
        }
    }

    getTotalItems() {
        switch(this.currentSection) {
            case 'users':
                return '25,847';
            case 'certificates':
                return '234';
            case 'jobs':
                return '4,563';
            default:
                return '100';
        }
    }

    handleVerification(event) {
        const button = event.currentTarget;
        const queueItem = button.closest('.queue-item');
        const userName = queueItem.querySelector('h4').textContent;

        if (confirm(`Verify certificate for ${userName}?`)) {
            queueItem.style.opacity = '0.5';
            queueItem.style.pointerEvents = 'none';
            button.textContent = 'Verifying...';
            button.disabled = true;
            
            setTimeout(() => {
                queueItem.remove();
                this.showNotification('Certificate verified successfully!', 'success');
                this.updateVerificationStats();
            }, 1500);
        }
    }

    updateVerificationStats() {
        const pendingBadge = document.querySelector('.stat-badge.pending');
        const verifiedBadge = document.querySelector('.stat-badge.verified');
        
        if (pendingBadge) {
            let pendingCount = parseInt(pendingBadge.textContent) || 0;
            pendingBadge.textContent = `${pendingCount - 1} Pending`;
        }
        
        if (verifiedBadge) {
            let verifiedCount = parseInt(verifiedBadge.textContent) || 0;
            verifiedBadge.textContent = `${verifiedCount + 1} Verified`;
        }
    }

    handleUserAction(event) {
        const button = event.currentTarget;
        const action = button.classList[1];
        const row = button.closest('tr');
        const userName = row.querySelector('.user-cell').textContent.trim();

        switch(action) {
            case 'view':
                this.showUserDetail(userName);
                break;
            case 'edit':
                this.editUser(userName);
                break;
            case 'suspend':
            case 'activate':
                this.toggleUserStatus(userName, row, action);
                break;
            case 'delete':
                this.deleteUser(userName);
                break;
        }
    }

    showUserDetail(userName) {
        this.showNotification(`Viewing details for ${userName}`, 'info');
    }

    editUser(userName) {
        this.showNotification(`Editing ${userName}`, 'warning');
    }

    toggleUserStatus(userName, row, action) {
        const isSuspending = action === 'suspend';
        const confirmMessage = isSuspending 
            ? `Are you sure you want to suspend ${userName}?`
            : `Are you sure you want to activate ${userName}?`;

        if (confirm(confirmMessage)) {
            const statusBadge = row.querySelector('.status-badge');
            const actionBtn = row.querySelector(`.action-btn.${action}`);
            const actionIcon = actionBtn.querySelector('i');

            if (isSuspending) {
                statusBadge.className = 'status-badge suspended';
                statusBadge.textContent = 'Suspended';
                actionBtn.classList.remove('suspend');
                actionBtn.classList.add('activate');
                actionBtn.title = 'Activate';
                actionIcon.className = 'fas fa-check-circle';
                this.showNotification(`User ${userName} suspended`, 'warning');
            } else {
                statusBadge.className = 'status-badge active';
                statusBadge.textContent = 'Active';
                actionBtn.classList.remove('activate');
                actionBtn.classList.add('suspend');
                actionBtn.title = 'Suspend';
                actionIcon.className = 'fas fa-ban';
                this.showNotification(`User ${userName} activated`, 'success');
            }
        }
    }

    deleteUser(userName) {
        if (confirm(`Permanently delete ${userName}? This action cannot be undone.`)) {
            this.showNotification(`User ${userName} deleted`, 'warning');
        }
    }

    handleExport(event) {
        const button = event.currentTarget;
        const format = button.getAttribute('data-format') || 'csv';
        const section = this.currentSection;
        
        this.showNotification(`Exporting ${section} data as ${format.toUpperCase()}...`, 'info');
        
        setTimeout(() => {
            this.showNotification(`Exported ${section} data successfully`, 'success');
        }, 1000);
    }

    exportAnalyticsReport() {
        const currentTab = this.currentTab.analytics || 'learning-analytics';
        const reportData = this.getAnalyticsReportData(currentTab);
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skillhub-analytics-${currentTab}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(`Analytics report exported (${currentTab})`, 'success');
    }

    getAnalyticsReportData(reportType) {
        switch(reportType) {
            case 'learning-analytics':
                return this.data.analytics.learning;
            case 'job-analytics':
                return this.data.analytics.jobMarket;
            case 'skills-trending':
                return this.data.analytics.skills;
            case 'placement':
                return this.data.analytics.placement;
            case 'retention':
                return this.data.analytics.retention;
            case 'platform-health':
                return this.data.analytics.platformHealth;
            default:
                return {};
        }
    }

    loadSettings() {
        const savedTheme = localStorage.getItem('admin-theme') || 'light';
        this.applyTheme(savedTheme);
    }

    setupSettingsListeners() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
    }

    applySavedTheme() {
        const savedTheme = localStorage.getItem('admin-theme') || 'light';
        this.applyTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.applyTheme(newTheme);
        localStorage.setItem('admin-theme', newTheme);
        
        this.showNotification(`Theme changed to ${newTheme}`, 'info');
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        
        if (theme === 'dark') {
            document.documentElement.style.setProperty('--light-color', '#1a1d29');
            document.documentElement.style.setProperty('--dark-color', '#f8f9fa');
            document.documentElement.style.setProperty('--light-gray', '#2d3246');
        } else {
            document.documentElement.style.setProperty('--light-color', '#f8f9fa');
            document.documentElement.style.setProperty('--dark-color', '#212529');
            document.documentElement.style.setProperty('--light-gray', '#e9ecef');
        }
    }

    saveSettings() {
        const settings = {
            theme: document.body.getAttribute('data-theme') || 'light',
        };
        
        localStorage.setItem('admin-settings', JSON.stringify(settings));
        
        this.showNotification('Settings saved successfully', 'success');
    }

    setupNotifications() {
        this.loadNotifications();
    }

    loadNotifications() {
        this.notifications = [
            { id: 1, type: 'warning', title: 'Certificate Queue', message: '234 certificates pending verification', time: '10 min ago', read: false },
            { id: 2, type: 'info', title: 'System Update', message: 'Scheduled maintenance tonight at 2 AM', time: '1 hour ago', read: false },
            { id: 3, type: 'success', title: 'New User', message: '100+ new signups today', time: '2 hours ago', read: true }
        ];
        
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification .badge');
        if (badge) {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="close-toast">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        const autoRemove = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        notification.querySelector('.close-toast').addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle',
            'error': 'times-circle'
        };
        return icons[type] || 'bell';
    }

    openModal(modalName) {
        const modal = this.modals[modalName];
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalName) {
        const modal = this.modals[modalName];
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        Object.keys(this.modals).forEach(key => {
            this.closeModal(key);
        });
    }

    handleOutsideClick(event) {
        Object.keys(this.modals).forEach(key => {
            const modal = this.modals[key];
            if (modal && modal.classList.contains('active') && event.target === modal) {
                this.closeModal(key);
            }
        });
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

    

    handlePagination(event) {
        const button = event.currentTarget;
        const direction = button.querySelector('i').className.includes('left') ? 'prev' : 'next';
        this.showNotification(`Loading ${direction} page...`, 'info');
    }

    handleResize() {
        // Re-render charts on resize
        setTimeout(() => {
            if (this.currentSection === 'overview') {
                this.renderOverviewCharts();
            } else if (this.currentSection === 'analytics') {
                this.renderAllAnalyticsCharts();
            } else if (this.currentSection === 'finance') {
                this.renderFinanceCharts();
            }
        }, 250);
    }

    initializeTooltips() {
        const tooltips = document.querySelectorAll('[title]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => this.showTooltip(e));
            element.addEventListener('mouseleave', (e) => this.hideTooltip(e));
        });
    }

    showTooltip(event) {
        const element = event.target;
        const title = element.getAttribute('title');
        
        if (!title) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = title;
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
        
        element.tooltip = tooltip;
        element.removeAttribute('title');
    }

    hideTooltip(event) {
        const element = event.target;
        if (element.tooltip) {
            element.tooltip.remove();
            element.tooltip = null;
            const title = element.getAttribute('data-original-title');
            if (title) {
                element.setAttribute('title', title);
            }
        }
    }

    setupKeyboardShortcuts() {
        // Setup keyboard shortcuts
    }

    handleKeyboardShortcut(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.saveSettings();
        }
        
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.showNotification('Logging out...', 'info');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Add global CSS for charts and notifications
const globalStyles = `
/* Chart Styles */
.chart-svg {
    width: 100%;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.chart-label {
    font-size: 11px;
    fill: #666;
    font-weight: 500;
}

.chart-center-text {
    font-size: 14px;
    font-weight: 600;
    fill: #333;
}

.chart-center-subtext {
    font-size: 12px;
    fill: #666;
}

.sparkline-svg {
    width: 100%;
    height: 40px;
    margin: 10px 0;
}

/* Analytics Cards */
.analytics-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.analytics-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.analytics-card h4 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #212529;
}

.chart-placeholder {
    height: 250px;
    position: relative;
}

/* Trending Cards */
.trending-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid #4361ee;
    transition: all 0.3s ease;
}

.trending-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.trending-card.up {
    border-left-color: #2ecc71;
}

.trending-card.down {
    border-left-color: #f94144;
}

.trend-indicator {
    font-size: 12px;
    font-weight: 600;
}

.trend-indicator.up {
    color: #2ecc71;
}

.trend-indicator.down {
    color: #f94144;
}

/* Health Metrics */
.health-metric {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.health-bar {
    height: 6px;
    background: #e9ecef;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 10px;
}

.health-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
}

.health-fill.healthy {
    background: #2ecc71;
}

.health-fill.warning {
    background: #f8961e;
}

.health-fill.danger {
    background: #f94144;
}

/* Skills List */
.skills-list {
    margin-top: 15px;
}

.skill-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
}

.skill-name {
    width: 120px;
    font-size: 13px;
    color: #666;
}

.skill-bar {
    flex: 1;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
}

.skill-fill {
    height: 100%;
    background: linear-gradient(90deg, #4361ee, #3a0ca3);
    border-radius: 4px;
    transition: width 0.5s ease;
}

.skill-percentage {
    width: 40px;
    text-align: right;
    font-size: 12px;
    font-weight: 600;
    color: #4361ee;
}

/* Notification Styles */
.notification-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10000;
    transform: translateX(150%);
    transition: transform 0.3s ease;
    max-width: 350px;
}

.notification-toast.show {
    transform: translateX(0);
}

.notification-toast.success {
    border-left: 4px solid #2ecc71;
}

.notification-toast.warning {
    border-left: 4px solid #f8961e;
}

.notification-toast.info {
    border-left: 4px solid #4361ee;
}

.notification-toast.error {
    border-left: 4px solid #f94144;
}

.notification-toast i {
    font-size: 18px;
}

.notification-toast.success i {
    color: #2ecc71;
}

.notification-toast.warning i {
    color: #f8961e;
}

.notification-toast.info i {
    color: #4361ee;
}

.notification-toast.error i {
    color: #f94144;
}

.notification-toast span {
    flex: 1;
    font-size: 14px;
}

.close-toast {
    background: transparent;
    border: none;
    font-size: 20px;
    color: #6c757d;
    cursor: pointer;
    line-height: 1;
}

.close-toast:hover {
    color: #212529;
}

/* Tooltip Styles */
.custom-tooltip {
    position: absolute;
    background: #212529;
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    white-space: nowrap;
    pointer-events: none;
}

.custom-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: #212529 transparent transparent transparent;
}

/* Dark Theme Support */
[data-theme="dark"] .analytics-card,
[data-theme="dark"] .health-metric,
[data-theme="dark"] .trending-card {
    background: #2d3246;
    color: #f8f9fa;
}

[data-theme="dark"] .analytics-card h4,
[data-theme="dark"] .health-metric h5,
[data-theme="dark"] .trending-card h5 {
    color: #f8f9fa;
}

[data-theme="dark"] .trending-card {
    background: #1a1d29;
}

[data-theme="dark"] .chart-label,
[data-theme="dark"] .chart-center-text {
    fill: #f8f9fa;
}

[data-theme="dark"] .chart-center-subtext {
    fill: #adb5bd;
}

[data-theme="dark"] .notification-toast {
    background: #2d3246;
    color: #f8f9fa;
}

/* Responsive Charts */
@media (max-width: 768px) {
    .analytics-grid {
        grid-template-columns: 1fr !important;
    }
    
    .chart-placeholder {
        height: 200px;
    }
    
    .trending-grid {
        grid-template-columns: 1fr !important;
    }
}
`;

// Add global styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);