const timerState = {
  isRunning: false,
  currentMode: 'focus', 
  timeLeft: 25 * 60,
  focusTime: 25 * 60, 
  breakTime: 5 * 60,
  intervalId: null,
  sessionsCompleted: 0,
};

const todoState = {
  items: [],
  isListOpen: false,
};

const settingsState = {
  nightMode: false,
  font: 'pixel',
};

// Local Storage Keys
const STORAGE_KEYS = {
  TIMER_SETTINGS: 'trove_timer_settings',
  DISPLAY_SETTINGS: 'trove_display_settings',
  TODO_ITEMS: 'trove_todo_items',
  SESSIONS_COMPLETED: 'trove_sessions_completed',
};

function loadState() {
  loadTimerSettings();
  loadDisplaySettings();
  loadTodoItems();
  loadSessionsCompleted();
}

function loadTimerSettings() {
  const saved = localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
  if (saved) {
    const data = JSON.parse(saved);
    timerState.focusTime = data.focusTime || 25 * 60;
    timerState.breakTime = data.breakTime || 5 * 60;
    timerState.timeLeft = timerState.focusTime;
    focusTimeInput.value = timerState.focusTime / 60;
    breakTimeInput.value = timerState.breakTime / 60;
  }
}

function saveTimerSettings() {
  const data = {
    focusTime: timerState.focusTime,
    breakTime: timerState.breakTime,
  };
  localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(data));
}

function loadDisplaySettings() {
  const saved = localStorage.getItem(STORAGE_KEYS.DISPLAY_SETTINGS);
  if (saved) {
    const data = JSON.parse(saved);
    
    if (data.nightMode) {
      settingsState.nightMode = true;
      nightModeCheckbox.checked = true;
      document.body.classList.add('night-mode');
    }
    
    if (data.font) {
      settingsState.font = data.font;
      fontBtns.forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.querySelector(`[data-font="${data.font}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
        changeFontFamily({ target: activeBtn });
      }
    }
  }
}

function saveDisplaySettings() {
  const data = {
    nightMode: settingsState.nightMode,
    font: settingsState.font,
  };
  localStorage.setItem(STORAGE_KEYS.DISPLAY_SETTINGS, JSON.stringify(data));
}

function loadTodoItems() {
  const saved = localStorage.getItem(STORAGE_KEYS.TODO_ITEMS);
  if (saved) {
    todoState.items = JSON.parse(saved);
    updateTaskDisplay();
    renderTodoItems();
  }
}

function saveTodoItems() {
  localStorage.setItem(STORAGE_KEYS.TODO_ITEMS, JSON.stringify(todoState.items));
}

function loadSessionsCompleted() {
  const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS_COMPLETED);
  if (saved) {
    timerState.sessionsCompleted = parseInt(saved, 10);
    updatePlantDisplay();
  }
}

function saveSessionsCompleted() {
  localStorage.setItem(STORAGE_KEYS.SESSIONS_COMPLETED, String(timerState.sessionsCompleted));
}

function updatePlantDisplay() {
  clearAllPlants();
  for (let i = 0; i < timerState.sessionsCompleted; i++) {
    const slotId = `slot-${i + 1}`;
    const slot = document.getElementById(slotId);
    if (slot) {
      const grownPlant = slot.querySelector('.pot-grown');
      if (grownPlant) {
        grownPlant.classList.remove('hidden');
      }
    }
  }
}

const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const focusBtn = document.getElementById('focus-mode');
const breakBtn = document.getElementById('break-mode');
const resetBtn = document.getElementById('reset-mode');

const plansToday = document.getElementById('plans-today');
const todoList = document.getElementById('todo-list');
const todoInput = document.getElementById('todo-input');
const todoItems = document.getElementById('todo-items');
const editListBtn = document.getElementById('edit-list-btn');

const settingsButton = document.getElementById('settings-button');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const settingsContent = document.getElementById('settings-content');
const nightModeToggleSwitch = document.getElementById('night-mode-toggle');
const nightModeCheckbox = nightModeToggleSwitch.querySelector('.toggle-checkbox');
const fontBtns = document.querySelectorAll('.font-btn');
const focusTimeInput = document.getElementById('focus-time-input');
const breakTimeInput = document.getElementById('break-time-input');
const settingsContainer = document.querySelector('.settings-container');
const plansContainer = document.querySelector('.plans-container');
const closePlansBtn = document.getElementById('close-plans-btn');

const plantsRow = document.querySelector('.plants-row');

// Load saved state on page load
loadState();
updateDisplay();

focusBtn.addEventListener('click', switchToFocus);
breakBtn.addEventListener('click', switchToBreak);
resetBtn.addEventListener('click', resetTimer);

// Settings functionality
settingsButton.addEventListener('click', toggleSettings);
closeSettingsBtn.addEventListener('click', toggleSettings);
nightModeToggleSwitch.addEventListener('click', toggleNightMode);
nightModeCheckbox.addEventListener('change', toggleNightMode);
fontBtns.forEach(btn => btn.addEventListener('click', changeFontFamily));
focusTimeInput.addEventListener('change', updateFocusTime);
breakTimeInput.addEventListener('change', updateBreakTime);

// Plans functionality
editListBtn.addEventListener('click', togglePlans);
closePlansBtn.addEventListener('click', togglePlans);
plansToday.addEventListener('click', togglePlans);
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && todoInput.value.trim()) {
    addTodoItem(todoInput.value.trim());
    todoInput.value = '';
  }
});

function updateDisplay() {
  const minutes = Math.floor(timerState.timeLeft / 60);
  const seconds = timerState.timeLeft % 60;
  
  minutesDisplay.textContent = String(minutes).padStart(2, '0');
  secondsDisplay.textContent = String(seconds).padStart(2, '0');
}

function toggleTimer() {
  if (timerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (timerState.isRunning || timerState.timeLeft <= 0) return;
  
  timerState.isRunning = true;
  updateButtonText();
  
  timerState.intervalId = setInterval(() => {
    timerState.timeLeft--;
    updateDisplay();
    
    if (timerState.timeLeft <= 0) {
      timerComplete();
    }
  }, 1000);
}

function pauseTimer() {
  if (!timerState.isRunning) return;
  
  timerState.isRunning = false;
  clearInterval(timerState.intervalId);
  updateButtonText();
}

function resetTimer() {
  pauseTimer();
  timerState.currentMode = 'focus';
  timerState.timeLeft = timerState.focusTime;
  timerState.sessionsCompleted = 0;
  saveSessionsCompleted();
  updateModeButtons();
  updateDisplay();
  clearAllPlants();
}

function switchToFocus() {
  if (timerState.currentMode === 'focus') {
    if (timerState.isRunning) {
      pauseTimer();
    } else {
      startTimer();
      showCurrentPlantEmpty();
    }
  } else {
    pauseTimer();
    timerState.currentMode = 'focus';
    timerState.timeLeft = timerState.focusTime;
    updateModeButtons();
    updateDisplay();
    startTimer();
    showCurrentPlantEmpty();
  }
}

function switchToBreak() {
  if (timerState.currentMode === 'break') {
    if (timerState.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  } else {
    pauseTimer();
    timerState.currentMode = 'break';
    timerState.timeLeft = timerState.breakTime;
    updateModeButtons();
    updateDisplay();
    startTimer();
  }
}

function updateModeButtons() {
  focusBtn.classList.toggle('active', timerState.currentMode === 'focus');
  breakBtn.classList.toggle('active', timerState.currentMode === 'break');
  updateButtonText();
}

function updateButtonText() {
  if (timerState.currentMode === 'focus') {
    focusBtn.textContent = timerState.isRunning ? 'PAUSE' : 'FOCUS';
  } else if (timerState.currentMode === 'break') {
    breakBtn.textContent = timerState.isRunning ? 'PAUSE' : 'BREAK';
  }
}

const notifToggle = document.getElementById('notif-toggle');
let notificationsEnabled = false;

notifToggle.addEventListener('change', () => {
  if (notifToggle.checked) {
    if (Notification.permission === 'granted') {
      notificationsEnabled = true;
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permissionResult) => {
        if (permissionResult === 'granted') {
          notificationsEnabled = true;
          console.log('Notifications enabled');
        } else {
          notifToggle.checked = false;
          notificationsEnabled = false;
        }
      });
    }
  } else {
    notificationsEnabled = false;
  }
});

function timerComplete() {
  pauseTimer();
  playNotification();
  
  if (timerState.currentMode === 'focus') {
    growCurrentPlant();
    timerState.sessionsCompleted++;
    saveSessionsCompleted();
    switchToBreak();
  } else {
    switchToFocus();
  }
}

function playNotification() {
  console.log('Time\'s up!');
  
  if (notificationsEnabled && Notification.permission === 'granted') {
    const title = timerState.currentMode === 'focus' ? 'Focus time complete!' : 'Break time over!';
    const message = timerState.currentMode === 'focus' ? 'Great work! Time for a break.' : 'Ready to focus again?';
    
    new Notification(title, {
      body: message,
      icon: '/favicon/favicon.svg',
    });
  }
}

// To-do list functions
function togglePlans() {
  plansContainer.classList.toggle('open');
  if (plansContainer.classList.contains('open')) {
    todoInput.focus();
  }
}

function toggleTodoList() {
  todoState.isListOpen = !todoState.isListOpen;
  todoList.classList.toggle('hidden');
  
  if (todoState.isListOpen) {
    todoInput.focus();
  }
}

function addTodoItem(text) {
  const item = {
    id: Date.now(),
    text: text,
    completed: false,
  };
  
  todoState.items.push(item);
  saveTodoItems();
  updateTaskDisplay();
  renderTodoItems();
}

function deleteTodoItem(id) {
  todoState.items = todoState.items.filter(item => item.id !== id);
  saveTodoItems();
  updateTaskDisplay();
  renderTodoItems();
}

function toggleTodoItem(id) {
  const item = todoState.items.find(item => item.id === id);
  if (item) {
    item.completed = !item.completed;
    saveTodoItems();
    updateTaskDisplay();
    renderTodoItems();
  }
}

function updateTaskDisplay() {
  const incompleteTasks = todoState.items.filter(item => !item.completed);
  
  if (incompleteTasks.length > 0) {
    plansToday.textContent = incompleteTasks[0].text;
    plansToday.classList.add('has-task');
  } else {
    plansToday.textContent = 'Plans for today?';
    plansToday.classList.remove('has-task');
  }
}

function renderTodoItems() {
  todoItems.innerHTML = '';
  
  todoState.items.forEach(item => {
    const li = document.createElement('li');
    li.className = `todo-item ${item.completed ? 'completed' : ''}`;
    
    li.innerHTML = `
      <input 
        type="checkbox" 
        class="todo-checkbox" 
        ${item.completed ? 'checked' : ''}
        aria-label="Mark task as complete"
      />
      <span class="todo-text">${item.text}</span>
      <button class="todo-delete" aria-label="Delete task">✕</button>
    `;
    
    const checkbox = li.querySelector('.todo-checkbox');
    const deleteBtn = li.querySelector('.todo-delete');
    
    checkbox.addEventListener('change', () => toggleTodoItem(item.id));
    deleteBtn.addEventListener('click', () => deleteTodoItem(item.id));
    
    todoItems.appendChild(li);
  });
}

// Plant functions
function clearAllPlants() {
  const slots = document.querySelectorAll('.plant-slot');
  slots.forEach(slot => {
    const emptyPot = slot.querySelector('.pot-empty');
    const grownPlant = slot.querySelector('.pot-grown');
    if (emptyPot) emptyPot.classList.add('hidden');
    if (grownPlant) grownPlant.classList.add('hidden');
  });
}

function showCurrentPlantEmpty() {
  const slotId = `slot-${timerState.sessionsCompleted + 1}`;
  const slot = document.getElementById(slotId);
  
  if (slot) {
    const emptyPot = slot.querySelector('.pot-empty');
    if (emptyPot) {
      emptyPot.classList.remove('hidden');
    }
  }
}

function growCurrentPlant() {
  const slotId = `slot-${timerState.sessionsCompleted + 1}`;
  const slot = document.getElementById(slotId);
  
  if (slot) {
    const emptyPot = slot.querySelector('.pot-empty');
    const grownPlant = slot.querySelector('.pot-grown');
    
    if (emptyPot) emptyPot.classList.add('hidden');
    if (grownPlant) grownPlant.classList.remove('hidden');
  }
}

// Settings functions
function toggleSettings() {
  settingsContainer.classList.toggle('open');
}

function toggleNightMode(e) {
  // If called from the switch click, toggle the checkbox
  if (e.target === nightModeToggleSwitch) {
    nightModeCheckbox.checked = !nightModeCheckbox.checked;
    settingsState.nightMode = nightModeCheckbox.checked;
  } else {
    // If called from checkbox change event
    settingsState.nightMode = nightModeCheckbox.checked;
  }
  
  // Apply night mode
  if (settingsState.nightMode) {
    document.body.classList.add('night-mode');
  } else {
    document.body.classList.remove('night-mode');
  }
  
  saveDisplaySettings();
  console.log('Night Mode:', settingsState.nightMode);
}

function changeFontFamily(e) {
  const fontType = e.target.dataset.font;
  
  // Remove active class from all buttons
  fontBtns.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to clicked button
  e.target.classList.add('active');
  
  // Map font types to CSS variables
  const fontMap = {
    'pixel': '--pixel-font',
    'sans': '--sans-serif-font',
  };
  
  const fontVar = fontMap[fontType];
  if (fontVar) {
    document.body.style.fontFamily = `var(${fontVar})`;
    settingsState.font = fontType;
    saveDisplaySettings();
  }
}

function updateFocusTime(e) {
  const newFocusTime = parseInt(e.target.value) || 25;
  timerState.focusTime = newFocusTime * 60;
  saveTimerSettings();
  
  // Update display if in focus mode and timer is not running
  if (timerState.currentMode === 'focus' && !timerState.isRunning) {
    timerState.timeLeft = timerState.focusTime;
    updateDisplay();
  }
}

function updateBreakTime(e) {
  const newBreakTime = parseInt(e.target.value) || 5;
  timerState.breakTime = newBreakTime * 60;
  saveTimerSettings();
  
  // Update display if in break mode and timer is not running
  if (timerState.currentMode === 'break' && !timerState.isRunning) {
    timerState.timeLeft = timerState.breakTime;
    updateDisplay();
  }
}
