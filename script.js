// Updated Tier Configuration
const TIERS = [
    { threshold: 0.10, rate: 1.0 },   // 0-10%
    { threshold: 0.25, rate: 0.80 },  // 10-25%
    { threshold: 0.45, rate: 0.60 },  // 25-45%
    { threshold: 0.70, rate: 0.40 },  // 45-70%
    { threshold: 1.00, rate: 0.20 }   // 70-100%
];

// Initial Tasks
const initialTasks = [
    { 
        id: 1, 
        name: "Complete Human Verification", 
        points: 5000, 
        link: "https://t.me/TapCoinsBot/app?startapp=ref_n2kxMG-page_bioMatrixScan", 
        status: "pending" 
    },
    { 
        id: 2, 
        name: "Join Channel and Spin 3 Times", 
        points: 4500, 
        link: "https://t.me/LuckyDrawMasterBot/app?startapp=Y2g9a1FqOXh2SFI3RyZnPXNwJmw9a1FqOXh2SFI3RyZzbz1TaGFyZSZ1PTc0NzYyMjYyMzg=", 
        status: "pending" 
    },
    { 
        id: 3,
        name: "Join Channel and Claim Bonus", 
        points: 4000, 
        link: "https://t.me/GoosChainBot?start=4587865544", 
        status: "pending" 
    },
    { 
        id: 4, 
        name: "Start Mining and Utilize It", 
        points: 3500, 
        link: "https://t.me/GenkiMinerBot/GenkiMiner?startapp=T9qRvb49", 
        status: "pending" 
    },
    { 
        id: 5, 
        name: "Perticipate in Daily Events", 
        points: 3000, 
        link: "https://t.me/sprizebot/app?startapp=invite_7523668946", 
        status: "pending" 
    }
];

// System State
let tasks = [];
let userTier = null;
const deviceId = createDeviceId();
const storageKey = `vtx_${deviceId}`;

// Device Fingerprint
function createDeviceId() {
    const components = [
        navigator.userAgent,
        navigator.platform,
        screen.width + 'x' + screen.height,
        navigator.language
    ];
    return btoa(unescape(encodeURIComponent(components.join('|')))).slice(0, 32);
}

// Tier Assignment
function assignTier(deviceId) {
    const hash = Array.from(deviceId).reduce((acc, char) => 
        (acc << 5) - acc + char.charCodeAt(0), 0) >>> 0;
    const random = (hash % 10000) / 10000;
    return TIERS.find(t => random < t.threshold) || TIERS[TIERS.length - 1];
}

// Initialize User
function initializeUser() {
    try {
        const savedData = JSON.parse(localStorage.getItem(storageKey));
        
        if (!savedData) {
            userTier = assignTier(deviceId);
            tasks = [...initialTasks];
            saveState();
        } else if (savedData && Array.isArray(savedData.tasks)) {
            // Verify each task has required properties
            const validTasks = savedData.tasks.every(task => 
                task && typeof task === 'object' && 
                'id' in task && 'name' in task && 
                'points' in task && 'link' in task && 
                'status' in task
            );
            
            if (validTasks) {
                userTier = savedData.tier;
                tasks = savedData.tasks;
            } else {
                userTier = assignTier(deviceId);
                tasks = [...initialTasks];
                saveState();
            }
        } else {
            // Reset to initial state if data is invalid
            userTier = assignTier(deviceId);
            tasks = [...initialTasks];
            saveState();
        }
    } catch (e) {
        localStorage.removeItem(storageKey);
        // Reset state
        userTier = assignTier(deviceId);
        tasks = [...initialTasks];
        saveState();
    }
}

let isTaskInProgress = false;
let taskQueue = [];

function processQueue() {
    if (!isTaskInProgress && taskQueue.length > 0) {
        const nextTask = taskQueue.shift();
        handleTask(nextTask);
    }
}

// Updated handleTask function
function handleTask(taskId) {
    if (isTaskInProgress) {
        taskQueue.push(taskId);
        showTaskModal();
        return;
    }

    const task = tasks.find(t => t.id === taskId);
    
    // Check if this is a restart attempt
    const isRestart = task.status === 'failed';
    
    // Try to open the link in a new window, but continue even if blocked
    try {
        window.open(task.link, '_blank');
    } catch (e) {
        console.log('Please complete the task properly!');
    }
    
    // No longer checking if window opened successfully - continue with task

    isTaskInProgress = true;
    task.status = 'verifying';
    saveState();
    renderTasks();

    // Simulate verification process with a random time between 40-50 seconds
    const verificationTime = Math.floor(Math.random() * (50000 - 40000 + 1)) + 40000;

    setTimeout(() => {
        isTaskInProgress = false;
        
        // Determine task success based only on tier rate or restart bonus
        // If this is a restart attempt, give 80% chance of success
        const successRate = isRestart ? 0.8 : userTier.rate;
        task.status = Math.random() < successRate ? 'completed' : 'failed';
        
        saveState();
        renderTasks();
        updateProgress();
        
        // Process next task in queue if any
        processQueue();
    }, verificationTime);
}

// New modal functions - Enhanced for Telegram Mini App compatibility
function showTaskModal() {
    const modal = document.getElementById('taskModal');
    
    // Force repaint to ensure visibility in Telegram WebApp
    modal.style.display = 'flex';
    // Trigger reflow
    void modal.offsetWidth;
    
    // Add active class after reflow to ensure animation works
    modal.classList.add('active');
    
    // Ensure button click works in Telegram WebApp
    const confirmBtn = document.querySelector('.modal-confirm-btn');
    if (confirmBtn) {
        // Remove any existing event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            closeTaskModal();
            processQueue(); // Process next task in queue after closing modal
        });
    }
    
    // Handle background click - with Telegram WebApp compatibility
    const modalClickHandler = (e) => {
        if (e.target === modal) {
            closeTaskModal();
            processQueue(); // Process next task in queue after closing modal
        }
    };
    
    // Remove existing click handler if any
    modal.removeEventListener('click', modalClickHandler);
    // Add new click handler
    modal.addEventListener('click', modalClickHandler);
    
    // Notify Telegram WebApp about UI changes
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
        // Ensure haptic feedback for better UX in Telegram
        if (window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
    }
    
    // Update modal content to show task queue information
    const modalMessage = document.querySelector('.modal-message');
    if (modalMessage) {
        modalMessage.textContent = taskQueue.length > 0 ? 
            `You have ${taskQueue.length} task(s) waiting. Please complete your current task first.` : 
            'Please complete your current task before starting a new one.';
    }
}

// Helper function to close the task modal
function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = '';
    }, 300); // Match transition duration
}

// Save State
function saveState() {
    localStorage.setItem(storageKey, JSON.stringify({
        tier: userTier,
        tasks: tasks
    }));
}

// Render Tasks
function renderTasks() {
    const container = document.getElementById('tasks');
    container.innerHTML = tasks.map(task => `
        <div class="task-card">
            <div class="task-header">
                <div class="task-title">${task.name}</div>
                <div class="task-points">${task.points} TCR</div>
            </div>
            <div class="task-status">
                <div class="status-dot status-${task.status}"></div>
                ${getStatusText(task.status)}
            </div>
            <button class="action-button" ${task.status !== 'pending' && task.status !== 'failed' ? 'disabled' : ''}>
                ${getButtonText(task.status)}
            </button>
        </div>
    `).join('');

    tasks.forEach((task, index) => {
        if (task.status === 'pending' || task.status === 'failed') {
            document.querySelectorAll('.action-button')[index].onclick = () => handleTask(task.id);
        }
    });
}

// Status Text
function getStatusText(status) {
    return {
        pending: 'Available',
        verifying: 'Please wait a moment',
        completed: 'Excellent work!',
        failed: 'Cheating is bad, Try again!'
    }[status];
}

// Button Text
function getButtonText(status) {
    return {
        pending: 'Start',
        verifying: 'Verifying...',
        completed: 'Completed ✓',
        failed: 'Retry ↻'
    }[status];
}

// Progress Update
function updateProgress() {
    const totalPoints = tasks.reduce((sum, task) => 
        task.status === 'completed' ? sum + task.points : sum, 0);
    
    const progress = Math.min((totalPoints / 20000) * 100, 100);
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('current-points').textContent = totalPoints;
}

// Initialize App
window.addEventListener('load', () => {
    initializeUser();
    renderTasks();
    updateProgress();

    setTimeout(() => {
        document.querySelector('.loader').style.opacity = '0';
        setTimeout(() => {
            document.querySelector('.loader').style.display = 'none';
        }, 500);
    }, 1500);
    // Telegram Mini App Integration
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.enableClosingConfirmation();
    }
});

// Prevent Window Closing
window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = '';
});