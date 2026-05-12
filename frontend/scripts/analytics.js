// analytics.js - Complete Analytics Dashboard Functionality

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Analytics Dashboard Initializing...');
    
    // Check if we're on analytics page
    const analyticsSection = document.getElementById('analytics-section');
    if (!analyticsSection) {
        console.log('Not on analytics page, skipping initialization');
        return;
    }
    
    console.log('Initializing Analytics Dashboard...');
    
    // Load Chart.js dynamically
    loadChartJS().then(() => {
        // Initialize all components
        initializeAnalyticsDashboard();
    }).catch(error => {
        console.error('Failed to load Chart.js:', error);
        // Fallback to CSS-only charts
        initializeCssOnlyCharts();
    });
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadInitialData();
});

// =========================================
// CHART.JS LOADING
// =========================================

function loadChartJS() {
    return new Promise((resolve, reject) => {
        // Check if Chart.js is already loaded
        if (window.Chart) {
            console.log('Chart.js already loaded');
            resolve();
            return;
        }
        
        // Load Chart.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            console.log('Chart.js loaded successfully');
            resolve();
        };
        script.onerror = () => {
            console.error('Failed to load Chart.js');
            reject(new Error('Chart.js load failed'));
        };
        document.head.appendChild(script);
    });
}

// =========================================
// MAIN INITIALIZATION
// =========================================

function initializeAnalyticsDashboard() {
    console.log('Initializing charts and components...');
    
    try {
        // Initialize all charts
        initializeAllCharts();
        
        // Setup interactive elements
        setupInteractiveElements();
        
        // Update data displays
        updateDataDisplays();
        
        console.log('Analytics dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing analytics dashboard:', error);
        fallbackToSimpleView();
    }
}

// =========================================
// CHART INITIALIZATION
// =========================================

function initializeAllCharts() {
    console.log('Creating charts...');
    
    // Mini metric charts
    createMiniCharts();
    
    // Main charts
    createApplicationsChart();
    createSourcesChart();
    createHiringFunnel();
    createQualityScoreChart();
    createDepartmentPerformance();
    
    // Animate charts
    animateChartLoads();
}

// Mini metric charts (line charts)
function createMiniCharts() {
    // Views Trend Chart
    const viewsCtx = document.getElementById('views-chart');
    if (viewsCtx) {
        new Chart(viewsCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{
                    data: [12, 19, 13, 17, 15, 20, 18],
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }
    
    // CTR Trend Chart
    const ctrCtx = document.getElementById('ctr-chart');
    if (ctrCtx) {
        new Chart(ctrCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['W1', 'W2', 'W3', 'W4'],
                datasets: [{
                    data: [4.2, 4.5, 4.8, 4.9],
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }
    
    // Time to Hire Trend
    const timeCtx = document.getElementById('time-chart');
    if (timeCtx) {
        new Chart(timeCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                datasets: [{
                    data: [28, 26, 24, 22],
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }
    
    // Cost per Hire Trend
    const costCtx = document.getElementById('cost-chart');
    if (costCtx) {
        new Chart(costCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{
                    data: [2800, 2600, 2500, 2450],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }
}

// Applications Over Time Chart
function createApplicationsChart() {
    const ctx = document.getElementById('applications-chart');
    if (!ctx) return;
    
    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
                {
                    label: 'Applications',
                    data: [65, 78, 85, 92, 88, 95, 102],
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderRadius: 6,
                    borderSkipped: false
                },
                {
                    label: 'Previous Period',
                    data: [58, 65, 72, 78, 75, 82, 88],
                    backgroundColor: 'rgba(229, 231, 235, 0.8)',
                    borderRadius: 6,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: '#4b5563',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    boxPadding: 6,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} applications`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [3, 3],
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Sources Breakdown Chart
function createSourcesChart() {
    const ctx = document.getElementById('sources-chart');
    if (!ctx) return;
    
    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['LinkedIn', 'Indeed', 'Company Website', 'Referrals', 'Other'],
            datasets: [{
                data: [38, 22, 18, 15, 7],
                backgroundColor: [
                    'rgb(79, 70, 229)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)',
                    'rgb(239, 68, 68)',
                    'rgb(139, 92, 246)'
                ],
                borderWidth: 0,
                offset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        font: {
                            size: 11
                        },
                        color: '#6b7280'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: '#4b5563',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${percentage}% (${value} applicants)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Hiring Funnel Visualization
function createHiringFunnel() {
    // Animate funnel bars
    const funnelBars = document.querySelectorAll('.funnel-bar');
    funnelBars.forEach((bar, index) => {
        const originalWidth = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = originalWidth;
        }, index * 200);
    });
    
    // Animate conversion rates
    const conversionRates = document.querySelectorAll('.conversion-rate');
    conversionRates.forEach((rate, index) => {
        rate.style.opacity = '0';
        rate.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            rate.style.opacity = '1';
            rate.style.transform = 'translateX(0)';
            rate.style.transition = 'all 0.5s ease';
        }, index * 200 + 300);
    });
}

// Quality Score Chart
function createQualityScoreChart() {
    const scoreElement = document.querySelector('.circular-score');
    if (!scoreElement) return;
    
    const score = parseInt(scoreElement.getAttribute('data-score')) || 78;
    
    // Update the circle stroke with animation
    const scoreFill = scoreElement.querySelector('.score-fill');
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 10 * circumference);
    
    // Set initial state
    scoreFill.style.strokeDasharray = circumference;
    scoreFill.style.strokeDashoffset = circumference;
    
    // Animate to final position
    setTimeout(() => {
        scoreFill.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
        scoreFill.style.strokeDashoffset = offset;
    }, 500);
    
    // Animate score text
    const scoreValue = scoreElement.querySelector('.score-value');
    let currentScore = 0;
    const increment = score / 50;
    
    const timer = setInterval(() => {
        currentScore += increment;
        if (currentScore >= score) {
            currentScore = score;
            clearInterval(timer);
        }
        scoreValue.textContent = currentScore.toFixed(1);
    }, 20);
}

// Department Performance Bars
function createDepartmentPerformance() {
    const metricBars = document.querySelectorAll('.bar-fill');
    metricBars.forEach((bar, index) => {
        const originalWidth = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = originalWidth;
            bar.style.transition = 'width 1s ease';
        }, index * 100);
    });
}

// =========================================
// INTERACTIVE ELEMENTS
// =========================================

function setupInteractiveElements() {
    // Time range filter buttons
    const timeRangeBtns = document.querySelectorAll('.time-range-btn');
    timeRangeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            timeRangeBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Apply filter
            const range = this.dataset.range;
            applyTimeFilter(range);
        });
    });
    
    // Export button
    const exportBtn = document.getElementById('export-analytics');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAnalyticsData);
    }
    
    // Generate report button
    const generateBtn = document.getElementById('generate-report');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateCustomReport);
    }
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-analytics-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyAdvancedFilters);
    }
    
    // AI insight action buttons
    const insightActions = document.querySelectorAll('.insight-actions button');
    insightActions.forEach(btn => {
        btn.addEventListener('click', handleInsightAction);
    });
    
    // Report download buttons
    const reportDownloadBtns = document.querySelectorAll('.report-card .btn');
    reportDownloadBtns.forEach(btn => {
        btn.addEventListener('click', downloadReport);
    });
}

// =========================================
// FILTER FUNCTIONALITY
// =========================================

function applyTimeFilter(range) {
    console.log(`Applying time filter: ${range}`);
    
    // Show loading state
    showLoadingState();
    
    /*
    // Simulate API call delay
    setTimeout(() => {
        // Update chart data based on range
        updateChartsForTimeRange(range);
        
        // Update metrics
        updateMetricsForTimeRange(range);
        
        // Hide loading state
        hideLoadingState();
        
        // Show success message
        showToast(`Showing data for: ${getRangeDisplayName(range)}`, 'success');
    }, 800); */
}   

/*
function updateChartsForTimeRange(range) {
    // This would normally fetch new data from API
    // For demo, we'll just update with sample data
    
    const sampleData = {
        '7d': {
            applications: [45, 52, 48, 55, 60, 58, 62],
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        '30d': {
            applications: [65, 78, 85, 92, 88, 95, 102, 98, 105, 110],
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        },
        '90d': {
            applications: [250, 280, 310, 290, 320, 340],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        },
        'ytd': {
            applications: [250, 530, 840, 1130, 1450, 1790],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        }
    };
    
    const data = sampleData[range] || sampleData['30d'];
    
    // Update applications chart
    updateApplicationsChart(data.applications, data.labels);
}
*/

function updateApplicationsChart(data, labels) {
    // This would update the actual chart instance
    console.log('Updating chart with:', { data, labels });
    
    // For demo, we'll just show a visual indicator
    const chartContainer = document.getElementById('applications-chart');
    if (chartContainer) {
        chartContainer.style.border = '2px solid #10b981';
        setTimeout(() => {
            chartContainer.style.border = 'none';
        }, 1000);
    }
}

function updateMetricsForTimeRange(range) {
    const metrics = {
        '7d': {
            views: '2,458',
            ctr: '5.2%',
            time: '22 days',
            cost: '$2,300'
        },
        '30d': {
            views: '12,458',
            ctr: '4.8%',
            time: '24 days',
            cost: '$2,450'
        },
        '90d': {
            views: '35,458',
            ctr: '4.5%',
            time: '26 days',
            cost: '$2,500'
        },
        'ytd': {
            views: '68,458',
            ctr: '4.2%',
            time: '28 days',
            cost: '$2,550'
        }
    };
    
    const data = metrics[range] || metrics['30d'];
    
    // Update metric cards
    document.querySelectorAll('.metric-value').forEach((el, index) => {
        const values = Object.values(data);
        if (values[index]) {
            // Animate value change
            animateValueChange(el, values[index]);
        }
    });
}

function animateValueChange(element, newValue) {
    const oldValue = element.textContent;
    element.style.color = '#10b981';
    element.textContent = newValue;
    
    setTimeout(() => {
        element.style.color = '';
    }, 1000);
}

// =========================================
// DATA LOADING
// =========================================

/*
function loadInitialData() {
    // Simulate loading data
    console.log('Loading initial analytics data...');
    
    // Show loading indicator
    document.querySelectorAll('.metric-value').forEach(el => {
        el.textContent = '...';
    });
    
    // Simulate API delay
    setTimeout(() => {
        // Update with real data
        updateDataDisplays();
        console.log('Initial data loaded');
    }, 500);
}
*/

function updateDataDisplays() {
    // Update all data displays
    console.log('Updating data displays...');
    
    // You would normally fetch from API here
    // For now, we'll use static data
}

// =========================================
// EXPORT & REPORT FUNCTIONALITY
// =========================================

/*
function exportAnalyticsData() {
    console.log('Exporting analytics data...');
    
    // Show export dialog
    showExportDialog();
    
    // Simulate export process
    setTimeout(() => {
        showToast('Analytics data exported successfully!', 'success');
        
        // Trigger download
        triggerDownload('analytics_export_' + new Date().toISOString().slice(0, 10) + '.csv');
    }, 1500);
}
*/

/*
function generateCustomReport() {
    console.log('Generating custom report...');
    
    // Show report generation modal
    showReportGenerationModal();
    
    // Simulate generation process
    setTimeout(() => {
        showToast('Custom report generated successfully!', 'success');
        
        // Offer download
        triggerDownload('custom_report_' + new Date().toISOString().slice(0, 10) + '.pdf');
    }, 2000);
}
*/

function applyAdvancedFilters() {
    const timeRange = document.querySelector('.time-range-btn.active')?.dataset.range;
    const comparePeriod = document.getElementById('compare-period')?.value;
    const dateFrom = document.getElementById('date-from')?.value;
    const dateTo = document.getElementById('date-to')?.value;
    
    console.log('Applying advanced filters:', {
        timeRange,
        comparePeriod,
        dateFrom,
        dateTo
    });
    
    // Show loading
    const button = document.getElementById('apply-analytics-filters');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        button.innerHTML = originalText;
        button.disabled = false;
        
        // Show success
        showToast('Filters applied successfully!', 'success');
        
        // Update charts with new filters
        if (comparePeriod) {
            enableComparisonMode(comparePeriod);
        }
    }, 1500);
}

// =========================================
// AI INSIGHTS HANDLERS
// =========================================

function handleInsightAction(event) {
    const button = event.currentTarget;
    const action = button.textContent.trim();
    const insightCard = button.closest('.insight-card');
    const insightTitle = insightCard.querySelector('h5').textContent;
    
    console.log(`AI Insight action: ${action} for "${insightTitle}"`);
    
    switch(true) {
        case action.includes('Schedule'):
            scheduleOptimization();
            break;
        case action.includes('Optimize'):
            optimizeProcess();
            break;
        case action.includes('Boost'):
            boostCampaign();
            break;
        case action.includes('Learn More'):
            showInsightDetails(insightTitle);
            break;
        case action.includes('View Details'):
            showInsightDetails(insightTitle);
            break;
        case action.includes('Budget'):
            showBudgetPlanning();
            break;
    }
    
    // Visual feedback
    button.classList.add('active');
    setTimeout(() => {
        button.classList.remove('active');
    }, 300);
}

function scheduleOptimization() {
    showToast('Optimization scheduled for Wednesday mornings!', 'success');
    // Here you would call API to update scheduling
}

function optimizeProcess() {
    showToast('Process optimization started for Design roles!', 'info');
    // Here you would redirect to process optimization page
}

function boostCampaign() {
    showToast('LinkedIn campaign budget increased by 20%!', 'success');
    // Here you would update campaign budget
}

// =========================================
// UTILITY FUNCTIONS
// =========================================

function showLoadingState() {
    const overlay = document.createElement('div');
    overlay.id = 'analytics-loading';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
    `;
    
    const spinner = document.createElement('div');
    spinner.innerHTML = `
        <div style="text-align: center;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color: #4f46e5;"></i>
            <p style="margin-top: 20px; color: #6b7280; font-weight: 500;">Loading analytics data...</p>
        </div>
    `;
    
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
}

function hideLoadingState() {
    const overlay = document.getElementById('analytics-loading');
    if (overlay) {
        overlay.remove();
    }
}

function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${getToastIcon(type)}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">Analytics</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    const autoRemove = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
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

function getRangeDisplayName(range) {
    const names = {
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        '90d': 'Last 90 Days',
        'ytd': 'Year to Date'
    };
    return names[range] || range;
}

function triggerDownload(filename) {
    // Create a dummy download link
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Analytics Data Export');
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =========================================
// FALLBACK FUNCTIONS
// =========================================

function initializeCssOnlyCharts() {
    console.log('Using CSS-only charts fallback');
    
    // Add CSS-only animation classes
    document.querySelectorAll('.funnel-bar').forEach((bar, index) => {
        bar.classList.add('css-animated');
        bar.style.animationDelay = `${index * 0.2}s`;
    });
    
    document.querySelectorAll('.bar-fill').forEach((bar, index) => {
        bar.classList.add('css-animated');
        bar.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Show message about Chart.js
    showToast('Using simplified charts (Chart.js not loaded)', 'info');
}

function fallbackToSimpleView() {
    console.log('Falling back to simple view');
    
    // Hide complex charts
    document.querySelectorAll('.chart-card').forEach(card => {
        card.style.opacity = '0.7';
    });
    
    // Show simplified view
    showToast('Showing simplified analytics view', 'warning');
}

// =========================================
// ANIMATIONS
// =========================================

function animateChartLoads() {
    // Add animation classes to chart cards
    const chartCards = document.querySelectorAll('.chart-card');
    chartCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Animate metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, index * 100 + 300);
    });
}

// =========================================
// EVENT LISTENERS SETUP
// =========================================

function setupEventListeners() {
    // Navigation to analytics section
    const analyticsLink = document.querySelector('a[data-section="analytics"]');
    if (analyticsLink) {
        analyticsLink.addEventListener('click', function() {
            // Pre-load analytics when clicked
            console.log('Analytics section clicked, pre-loading...');
        });
    }
    
    // Window resize handling
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('Window resized, updating charts...');
            // In a real app, you might want to redraw charts here
        }, 250);
    });
    
    // Print functionality
    window.addEventListener('beforeprint', function() {
        console.log('Preparing analytics for print...');
        // You could adjust chart sizes or hide elements for printing
    });
}

// =========================================
// MODAL DIALOGS (Placeholder functions)
// =========================================

function showExportDialog() {
    // In a real app, you would show a modal with export options
    console.log('Showing export dialog');
}

function showReportGenerationModal() {
    // In a real app, you would show a modal for report customization
    console.log('Showing report generation modal');
}

function showInsightDetails(title) {
    // In a real app, you would show detailed insight information
    console.log(`Showing details for insight: ${title}`);
}

function showBudgetPlanning() {
    // In a real app, you would show budget planning interface
    console.log('Showing budget planning');
}

function enableComparisonMode(period) {
    console.log(`Enabling comparison with ${period}`);
    // Add comparison data to charts
}

function downloadReport(event) {
    const button = event.currentTarget;
    const reportCard = button.closest('.report-card');
    const reportTitle = reportCard.querySelector('h5').textContent;
    
    console.log(`Downloading report: ${reportTitle}`);
    
    // Show downloading state
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
    
    // Simulate download
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        showToast(`${reportTitle} downloaded successfully!`, 'success');
    }, 1000);
}

// =========================================
// PUBLIC API (if needed)
// =========================================

// Expose some functions if needed by other scripts
window.AnalyticsDashboard = {
    refresh: function() {
        console.log('Refreshing analytics dashboard...');
        // Re-initialize charts
        if (window.Chart) {
            initializeAllCharts();
        }
    },
    
    exportData: exportAnalyticsData,
    
    applyFilter: applyTimeFilter,
    
    getMetrics: function() {
        // Return current metrics data
        return {
            views: '12,458',
            ctr: '4.8%',
            time: '24 days',
            cost: '$2,450'
        };
    }
};

console.log('Analytics module loaded successfully!');