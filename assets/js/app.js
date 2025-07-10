// Domra Tech - Main Application JavaScript

// Global variables
let lexiconData = [];
let categoriesData = {};
let websiteInfo = {};
let currentFilter = 'all';
let currentSearch = '';

// DOM elements
const elements = {
    loading: null,
    error: null,
    mainContent: null,
    searchInput: null,
    filterButtons: null,
    wordGrid: null,
    resultsCount: null,
    statsContainer: null,
    contributeModal: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    loadTheme();
    loadData();
});

// Initialize DOM element references
function initializeElements() {
    elements.loading = document.getElementById('loading');
    elements.error = document.getElementById('error');
    elements.mainContent = document.getElementById('main-content');
    elements.searchInput = document.getElementById('searchInput');
    elements.filterButtons = document.getElementById('filterButtons');
    elements.wordGrid = document.getElementById('wordGrid');
    elements.resultsCount = document.getElementById('resultsCount');
    elements.statsContainer = document.getElementById('statsContainer');
    elements.contributeModal = document.getElementById('contributeModal');
}

// Theme management
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'light') {
        body.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        localStorage.setItem('domra-tech-theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
        themeIcon.textContent = '🌙';
        localStorage.setItem('domra-tech-theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('domra-tech-theme') || 'light';
    const themeIcon = document.getElementById('themeIcon');
    document.body.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// Modal functions
function openContributeModal() {
    elements.contributeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    elements.contributeModal.setAttribute('aria-hidden', 'false');
}

function closeContributeModal() {
    elements.contributeModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    elements.contributeModal.setAttribute('aria-hidden', 'true');
}

// Data loading
async function loadData() {
    try {
        showLoading();
        
        // Load all data files with timeout
        const loadPromises = [
            fetchWithTimeout('data/lexicon.json', 10000),
            fetchWithTimeout('data/categories.json', 10000),
            fetchWithTimeout('data/website.json', 10000)
        ];

        const [lexiconResponse, categoriesResponse, websiteResponse] = await Promise.all(loadPromises);

        // Parse JSON responses
        const lexiconJson = await lexiconResponse.json();
        const categoriesJson = await categoriesResponse.json();
        const websiteJson = await websiteResponse.json();

        // Store data
        lexiconData = lexiconJson.terms || [];
        categoriesData = categoriesJson.categories || {};
        websiteInfo = websiteJson || {};

        // Hide loading and show content
        hideLoading();
        showMainContent();

        // Initialize the interface
        initializeInterface();
        renderWords();

        console.log('Data loaded successfully:', {
            terms: lexiconData.length,
            categories: Object.keys(categoriesData).length
        });

    } catch (error) {
        console.error('Error loading data:', error);
        showError();
    }
}

// Fetch with timeout utility
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// UI state management
function showLoading() {
    elements.loading.style.display = 'block';
    elements.error.style.display = 'none';
    elements.mainContent.style.display = 'none';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function showError() {
    elements.loading.style.display = 'none';
    elements.error.style.display = 'block';
    elements.mainContent.style.display = 'none';
}

function showMainContent() {
    elements.mainContent.style.display = 'block';
    elements.mainContent.classList.add('fade-in');
}

// Interface initialization
function initializeInterface() {
    populateCategoryButtons();
    updateStats();
    setupEventListeners();
}

function populateCategoryButtons() {
    if (!elements.filterButtons) return;
    
    // Clear existing buttons
    elements.filterButtons.innerHTML = '';
    
    // Add "All Categories" button
    const allButton = createFilterButton('all', 'All Categories', '📚', true);
    elements.filterButtons.appendChild(allButton);
    
    // Add category buttons
    Object.entries(categoriesData).forEach(([categoryKey, category]) => {
        const button = createFilterButton(
            categoryKey, 
            category.name.english, 
            category.icon || '📝',
            false
        );
        elements.filterButtons.appendChild(button);
    });
}

function createFilterButton(categoryKey, name, icon, isActive) {
    const button = document.createElement('button');
    button.className = `filter-btn ${isActive ? 'active' : ''}`;
    button.dataset.category = categoryKey;
    button.innerHTML = `${icon} ${name}`;
    button.setAttribute('aria-pressed', isActive);
    return button;
}

function updateStats() {
    if (!elements.statsContainer) return;
    
    const totalTerms = lexiconData.length;
    const totalCategories = Object.keys(categoriesData).length;
    const totalContributors = new Set(
        lexiconData.flatMap(term => term.contributors || [])
    ).size;
    const verifiedTerms = lexiconData.filter(term => term.status === 'verified').length;

    const stats = [
        { number: totalTerms, label: 'Technical Terms' },
        { number: totalCategories, label: 'Categories' },
        { number: totalContributors, label: 'Contributors' },
        { number: verifiedTerms, label: 'Verified Terms' }
    ];

    elements.statsContainer.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="stat-number">${stat.number}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

// Event listeners
function setupEventListeners() {
    // Search input
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce((e) => {
            currentSearch = e.target.value.trim();
            renderWords();
        }, 300));
    }

    // Filter buttons
    if (elements.filterButtons) {
        elements.filterButtons.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                handleFilterClick(e.target);
            }
        });
    }

    // Modal events
    if (elements.contributeModal) {
        // Close modal on outside click
        elements.contributeModal.addEventListener('click', (e) => {
            if (e.target === elements.contributeModal) {
                closeContributeModal();
            }
        });
    }

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        // Escape key to close modal
        if (e.key === 'Escape' && elements.contributeModal.style.display === 'block') {
            closeContributeModal();
        }
        
        // Focus search box with Ctrl/Cmd + K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            elements.searchInput?.focus();
        }
    });

    // Window events
    window.addEventListener('resize', debounce(() => {
        // Handle any resize-specific logic
    }, 250));
}

function handleFilterClick(button) {
    // Remove active class from all buttons
    elements.filterButtons.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    // Add active class to clicked button
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    
    // Update current filter
    currentFilter = button.dataset.category;
    
    // Re-render words
    renderWords();
}

// Word rendering
function renderWords() {
    if (!elements.wordGrid || !elements.resultsCount) return;

    const filteredWords = filterWords();
    
    // Update results count
    elements.resultsCount.textContent = `${filteredWords.length} terms found`;

    // Render words or no results message
    if (filteredWords.length === 0) {
        renderNoResults();
    } else {
        renderWordCards(filteredWords);
    }
}

function filterWords() {
    return lexiconData.filter(word => {
        const matchesSearch = currentSearch === '' || searchMatches(word, currentSearch);
        const matchesCategory = currentFilter === 'all' || word.category === currentFilter;
        return matchesSearch && matchesCategory;
    });
}

function searchMatches(word, searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    
    return (
        word.english.toLowerCase().includes(searchLower) ||
        word.khmer.includes(searchTerm) ||
        (word.description && word.description.toLowerCase().includes(searchLower)) ||
        (word.tags && word.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        (word.examples && (
            word.examples.english?.toLowerCase().includes(searchLower) ||
            word.examples.khmer?.includes(searchTerm)
        ))
    );
}

function renderNoResults() {
    elements.wordGrid.innerHTML = `
        <div class="no-results">
            <h3>No terms found</h3>
            <p>Try adjusting your search or filter criteria</p>
            <button onclick="openContributeModal()" class="btn btn-primary" style="margin-top: 25px;">
                <span>➕</span>
                Contribute New Terms
            </button>
        </div>
    `;
}

function renderWordCards(words) {
    elements.wordGrid.innerHTML = words.map(word => createWordCard(word)).join('');
}

function createWordCard(word) {
    const category = categoriesData[word.category] || { icon: '📝', name: { english: word.category } };
    
    return `
        <div class="word-card slide-up">
            <div class="word-english">${escapeHtml(word.english)}</div>
            <div class="word-khmer">${escapeHtml(word.khmer)}</div>
            <div class="word-category">
                ${category.icon} ${category.name.english}
            </div>
            <div class="word-description">${escapeHtml(word.description || 'No description available')}</div>
            ${renderExamples(word.examples)}
            ${renderTags(word.tags)}
            <div class="word-footer">
                <div class="word-date">Added: ${word.dateAdded || 'Unknown'}</div>
                ${renderReference(word.reference)}
            </div>
        </div>
    `;
}

function renderExamples(examples) {
    if (!examples || (!examples.english && !examples.khmer)) return '';
    
    return `
        <div class="word-examples">
            <div class="example-label">Examples:</div>
            ${examples.english ? `<div class="example-text">"${escapeHtml(examples.english)}"</div>` : ''}
            ${examples.khmer ? `<div class="example-text khmer">"${escapeHtml(examples.khmer)}"</div>` : ''}
        </div>
    `;
}

function renderTags(tags) {
    if (!tags || !Array.isArray(tags) || tags.length === 0) return '';
    
    return `
        <div class="word-tags">
            ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
    `;
}

function renderReference(reference) {
    if (!reference || reference === '#') return '';
    
    return `
        <a href="${escapeHtml(reference)}" class="word-reference" target="_blank" rel="noopener">
            <span>📂</span>
            Reference
        </a>
    `;
}

// Export functionality
function exportJSON() {
    try {
        const dataToExport = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalTerms: lexiconData.length,
                version: websiteInfo.project?.version || '1.0.0',
                exportedBy: 'Domra Tech Lexicon'
            },
            terms: lexiconData,
            categories: categoriesData
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `domra-tech-lexicon-${getCurrentDateString()}.json`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        console.log('Data exported successfully');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
    }
}

// Utility functions
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

function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getCurrentDateString() {
    return new Date().toISOString().split('T')[0];
}

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}

// Service Worker registration (optional - for future PWA features)
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        // Uncomment when you have a service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}

// Make functions available globally for HTML onclick handlers
window.toggleTheme = toggleTheme;
window.openContributeModal = openContributeModal;
window.closeContributeModal = closeContributeModal;
window.exportJSON = exportJSON;
window.loadData = loadData;