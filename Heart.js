



const STORAGE_KEY = 'zenjournal_local_entries';
    const CATEGORIES_KEY = 'zenjournal_local_categories';
    const TODO_KEY = 'zenjournal_local_todos';
    const HABITS_KEY = 'zenjournal_local_habits';
    const HABIT_LOGS_KEY = 'zenjournal_local_habit_logs';
    const THEME_KEY = 'zenjournal_theme';
    const DATES_KEY = 'zenjournal_important_dates';
    const DEFAULT_CATEGORIES = [{ name: 'Personal', icon: '🏠' }, { name: 'Work', icon: '💼' }, { name: 'Idea', icon: '💡' }, { name: 'Travel', icon: '✈️' }];

    let entries = [], categories = [], todos = [], habits = [], habitLogs = {}, importantDates = [];
    let currentEditingId = null, selectedMood = 'neutral', isSidebarCollapsed = false, isDatesSidebarVisible = true;
    let currentEntryImages = [];
    let wizardHabitType = 'yesno';
    let calendarDate = new Date();
    let currentDayFilter = null; 

    let el = {};
    function updateElements() {
        const ids = [
            'sidebar', 'sidebar-toggle-icon', 'entries-grid', 'stats-counter', 'search-input', 'editor-overlay',
            'entry-title', 'entry-content', 'entry-type', 'mood-selector', 'editor-image-preview',
            'entry-date-input', 'media-gallery', 'media-stats', 'categories-list',
            'image-lightbox', 'lightbox-img', 'tab-journal', 'tab-calendar', 'tab-media', 'tab-settings', 'tab-todo',
            'todo-input', 'todo-date', 'todo-time', 'todo-list', 'todo-stats',
            'tab-habit', 'habit-checklist', 'habit-progress-list', 'habit-stats', 'habit-wizard', 'calendar-grid', 'calendar-month-year',
            'theme-toggle-icon', 'entry-location', 'dates-sidebar', 'important-dates-list', 'imp-date-title', 'imp-date-value'
        ];
        ids.forEach(id => el[id] = document.getElementById(id));
    }

    const formatDate = (date) => new Date(date).toISOString().split('T')[0];

    // Separate Functionality: Store Important Dates
    window.storeImportantDate = () => {
        const title = el['imp-date-title'].value.trim();    
        const dateValue = el['imp-date-value'].value;
        
        if (!title || !dateValue) return;

        const newDate = {
            id: 'imp_' + Date.now(),
            title: title,
            date: dateValue,
            storedAt: new Date().toISOString()
        };

        importantDates.push(newDate);
        importantDates.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Save to dedicated separate storage
        localStorage.setItem(DATES_KEY, JSON.stringify(importantDates));
        
        // Reset UI
        el['imp-date-title'].value = '';
        el['imp-date-value'].value = '';
        
        renderImportantDates();
    };

    window.removeImportantDate = (id) => {
        importantDates = importantDates.filter(d => d.id !== id);
        localStorage.setItem(DATES_KEY, JSON.stringify(importantDates));
        renderImportantDates();
    };

    function renderImportantDates() {
        if (!el['important-dates-list']) return;
        
        el['important-dates-list'].innerHTML = importantDates.map(d => {
            const dateObj = new Date(d.date + "T12:00:00");
            const diff = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
            let diffText = diff === 0 ? 'Today!' : diff > 0 ? `In ${diff} days` : `${Math.abs(diff)} days ago`;
            
            return `
                <div class="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/20 transition-all">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[9px] font-black uppercase text-indigo-500 tracking-widest">${dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <button onclick="removeImportantDate('${d.id}')" class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
                    </div>
                    <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">${d.title}</h4>
                    <p class="text-[9px] font-medium text-slate-400 mt-1 italic">${diffText}</p>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    }

    // Existing Standard Functions
    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const isDark = document.documentElement.classList.contains('dark');
        if(el['theme-toggle-icon']) {
            el['theme-toggle-icon'].setAttribute('data-lucide', isDark ? 'sun' : 'moon');
            lucide.createIcons();
        }
    }

    window.toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
        updateThemeIcon();
    };

    window.toggleSidebar = () => {
        isSidebarCollapsed = !isSidebarCollapsed;
        el['sidebar'].classList.toggle('collapsed', isSidebarCollapsed);
        el['sidebar'].style.width = isSidebarCollapsed ? '90px' : '288px';
        el['sidebar-toggle-icon'].setAttribute('data-lucide', isSidebarCollapsed ? 'chevron-right' : 'chevron-left');
        lucide.createIcons();
    };

    window.toggleDatesSidebar = () => {
        isDatesSidebarVisible = !isDatesSidebarVisible;
        el['dates-sidebar'].classList.toggle('hidden', !isDatesSidebarVisible);
    };

    window.switchTab = (tab) => {
        ['journal', 'calendar', 'media', 'settings', 'todo', 'habit'].forEach(t => {
            if (el[`tab-${t}`]) el[`tab-${t}`].classList.toggle('hidden', t !== tab);
            const n = document.getElementById(`nav-${t}`);
            if (n) n.classList.toggle('active', t === tab);
        });
        if (tab === 'journal') renderEntries();
        if (tab === 'todo') renderTodos();
        if (tab === 'calendar') renderCalendar();
        if (tab === 'media') renderMediaVault();
        if (tab === 'habit') renderHabitView();
        if (tab === 'settings') renderCategories();
        lucide.createIcons();
    };

    window.format = (command, value = null) => {
        document.execCommand(command, false, value);
        el['entry-content'].focus();
    };

    window.openEditor = (id = null) => {
        currentEditingId = id;
        el['entry-type'].innerHTML = categories.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
        if (id) {
            const e = entries.find(x => x.id === id);
            el['entry-title'].value = e.title || '';
            el['entry-content'].innerHTML = e.content || '';
            el['entry-location'].value = e.location || '';
            el['entry-type'].value = e.type;
            el['entry-date-input'].value = formatDate(e.date);
            currentEntryImages = [...(e.images || [])];
            setMood(e.mood || 'neutral');
        } else {
            el['entry-title'].value = ''; el['entry-content'].innerHTML = ''; el['entry-location'].value = '';
            el['entry-date-input'].value = formatDate(new Date()); currentEntryImages = []; setMood('neutral');
        }
        renderEditorMedia();
        el['editor-overlay'].classList.remove('hidden');
        setTimeout(() => { el['editor-overlay'].classList.remove('opacity-0'); el['editor-overlay'].firstElementChild.classList.remove('scale-95'); }, 10);
    };

    window.closeEditor = () => {
        el['editor-overlay'].classList.add('opacity-0'); el['editor-overlay'].firstElementChild.classList.add('scale-95');
        setTimeout(() => el['editor-overlay'].classList.add('hidden'), 300);
    };

    window.setMood = (m) => { selectedMood = m; el['mood-selector'].querySelectorAll('button').forEach(b => b.classList.toggle('ring-2', b.dataset.mood === m)); };

    window.handleMediaUpload = (input) => {
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentEntryImages.push({ name: file.name, type: file.type, data: e.target.result });
                renderEditorMedia();
            };
            reader.readAsDataURL(file);
        });
    };

    function renderEditorMedia() {
        if (!el['editor-image-preview']) return;
        el['editor-image-preview'].innerHTML = currentEntryImages.map((img, i) => `
            <div class="relative group aspect-square rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-center p-2">
                ${img.type.startsWith('image/') ? `<img src="${img.data}" class="w-full h-full object-cover rounded-lg">` : `<div class="text-center"><i data-lucide="file-text" class="w-8 h-8 text-indigo-500 mx-auto"></i><p class="text-[8px] font-bold text-slate-400 truncate w-full px-2">${img.name}</p></div>`}
                <button onclick="currentEntryImages.splice(${i},1);renderEditorMedia()" class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="trash" class="w-3 h-3"></i></button>
            </div>
        `).join('');
        lucide.createIcons();
    }

    window.saveEntry = () => {
        const title = el['entry-title'].value.trim(), content = el['entry-content'].innerHTML.trim(), location = el['entry-location'].value.trim();
        if (!content && !title) return;
        const data = {
            id: currentEditingId || Date.now().toString(),
            title, content, location, type: el['entry-type'].value, mood: selectedMood,
            images: currentEntryImages, date: new Date(el['entry-date-input'].value + "T12:00:00").toISOString(),
            updatedAt: new Date().toISOString()
        };
        if (currentEditingId) entries[entries.findIndex(e => e.id === currentEditingId)] = data;
        else entries.unshift(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        closeEditor(); renderEntries();
    };

    function renderEntries() {
        const searchVal = (el['search-input']?.value || '').toLowerCase();
        const filtered = entries.filter(e => {
            const m = (e.title || '').toLowerCase().includes(searchVal) || (e.content || '').toLowerCase().includes(searchVal);
            return currentDayFilter ? (m && formatDate(e.date) === currentDayFilter) : m;
        });
        el['stats-counter'].textContent = `${filtered.length} captured moments`;
        el['entries-grid'].innerHTML = filtered.map(e => {
            const d = new Date(e.date), c = categories.find(x => x.name === e.type) || { icon: '📝' };
            const div = document.createElement('div'); div.innerHTML = e.content || "";
            return `
                <div class="group bg-white dark:bg-[#0b0f1a] rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800/50 hover:border-indigo-500/20 transition-all cursor-pointer relative premium-shadow" onclick="openEditor('${e.id}')">
                    <div class="flex justify-between items-start mb-8">
                        <div class="flex gap-5">
                            <div class="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center font-bold text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 shadow-sm">
                                <span class="text-[9px] uppercase tracking-widest text-slate-400">${d.toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span class="text-xl leading-none mt-0.5">${d.getDate()}</span>
                            </div>
                            <div>
                                <h4 class="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-1.5">${d.toLocaleDateString('en-US', { weekday: 'long' })} • ${c.icon} ${e.type} ${e.location ? `• ${e.location}` : ''}</h4>
                                <h3 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">${e.title || "Untitled"}</h3>
                            </div>
                        </div>
                        <button onclick="event.stopPropagation();deleteEntry('${e.id}')" class="text-slate-200 dark:text-slate-800 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                    </div>
                    <p class="text-slate-500 dark:text-slate-400 text-lg leading-relaxed line-clamp-3">${div.textContent || div.innerText || ""}</p>
                </div>`;
        }).join('');
        lucide.createIcons();
    }

    window.deleteEntry = (id) => { if (confirm("Delete memory?")) { entries = entries.filter(e => e.id !== id); localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); renderEntries(); } };

    function changeMonth(dir) { calendarDate.setMonth(calendarDate.getMonth() + dir); renderCalendar(); }
    function renderCalendar() {
        const year = calendarDate.getFullYear(), month = calendarDate.getMonth();
        el['calendar-month-year'].textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarDate);
        const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
        const entryDays = entries.reduce((acc, e) => {
            const d = new Date(e.date); if (d.getMonth() === month && d.getFullYear() === year) { const day = d.getDate(); if (!acc[day]) acc[day] = []; acc[day].push(e); } return acc;
        }, {});
        let html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="text-center text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase py-4">${d}</div>`).join('');
        for (let i = 0; i < firstDay; i++) html += `<div class="h-24 opacity-0"></div>`;
        for (let i = 1; i <= daysInMonth; i++) {
            const e = entryDays[i]; html += `<div class="calendar-day h-24 rounded-3xl border border-slate-50 dark:border-slate-800/30 flex flex-col items-center justify-start p-3 gap-2 cursor-pointer bg-[#fdfdfe] dark:bg-slate-900/20" onclick="openDateEntries(${i})"><span class="text-sm font-bold">${i}</span>${e ? `<p class="text-[9px] font-bold text-center truncate w-full text-indigo-500">${e[0].title || "Untitled"}</p>` : ''}</div>`;
        }
        el['calendar-grid'].innerHTML = html;
    }
    window.openDateEntries = (day) => { currentDayFilter = formatDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)); switchTab('journal'); renderEntries(); };

    function renderMediaVault() {
        const m = {}; entries.forEach(e => { if (e.images) { const k = formatDate(e.date); if (!m[k]) m[k] = []; e.images.forEach(f => m[k].push({...f, entryTitle: e.title})); } });
        const dates = Object.keys(m).sort((a,b) => new Date(b) - new Date(a));
        el['media-gallery'].innerHTML = dates.map(d => `<div class="space-y-6"><h3 class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">${d}</h3><div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">${m[d].map(f => `<div class="relative aspect-square rounded-[2rem] overflow-hidden group shadow-md bg-white dark:bg-slate-900 flex items-center justify-center p-4" onclick="${f.type.startsWith('image/') ? `openLightbox('${f.data}')` : `window.open('${f.data}')`}">${f.type.startsWith('image/') ? `<img src="${f.data}" class="w-full h-full object-cover">` : `<i data-lucide="file-text" class="w-10 h-10 text-indigo-500"></i>`}</div>`).join('')}</div></div>`).join('');
        lucide.createIcons();
    }

    window.addTodo = () => { const t = el['todo-input'].value.trim(); if (!t) return; todos.unshift({ id: Date.now().toString(), text: t, completed: false }); el['todo-input'].value = ''; saveTodos(); };
    function saveTodos() { localStorage.setItem(TODO_KEY, JSON.stringify(todos)); renderTodos(); }
    function renderTodos() {
        el['todo-list'].innerHTML = todos.map(t => `<div class="bg-white dark:bg-[#0b0f1a] rounded-[1.75rem] p-5 flex items-center justify-between border border-slate-100 dark:border-slate-800/50 premium-shadow"><div class="flex items-center gap-5 flex-1"><button onclick="toggleTodo('${t.id}')" class="w-9 h-9 rounded-2xl border-2 flex items-center justify-center ${t.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 dark:border-slate-800'}">${t.completed ? '<i data-lucide="check" class="w-5 h-5"></i>' : ''}</button><p class="font-bold ${t.completed ? 'opacity-30 line-through' : ''}">${t.text}</p></div><button onclick="deleteTodo('${t.id}')" class="text-slate-200"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`).join('');
        lucide.createIcons();
    }
    window.toggleTodo = (id) => { let t = todos.find(x => x.id === id); if (t) { t.completed = !t.completed; saveTodos(); } };
    window.deleteTodo = (id) => { todos = todos.filter(x => x.id !== id); saveTodos(); };

    window.openHabitWizard = () => { el['habit-wizard'].classList.remove('hidden'); setTimeout(() => el['habit-wizard'].classList.remove('opacity-0'), 10); };
    window.closeHabitWizard = () => { el['habit-wizard'].classList.add('opacity-0'); setTimeout(() => el['habit-wizard'].classList.add('hidden'), 300); };
    window.goToWizardStep1 = () => { document.getElementById('wizard-step-1').classList.remove('hidden'); document.getElementById('wizard-step-2').classList.add('hidden'); };
    window.goToWizardStep2 = () => { document.getElementById('wizard-step-1').classList.add('hidden'); document.getElementById('wizard-step-2').classList.remove('hidden'); };
    window.selectHabitType = (t) => { wizardHabitType = t; };
    window.completeHabitWizard = () => {
        const n = document.getElementById('wiz-habit-name').value.trim(), i = document.getElementById('wiz-habit-icon').value.trim() || '🌱';
        habits.push({ id: Date.now().toString(), name: n, icon: i, type: wizardHabitType, createdAt: new Date().toISOString() });
        localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
        closeHabitWizard(); renderHabitView();
    };
    function renderHabitView() {
        const today = formatDate(new Date());
        el['habit-checklist'].innerHTML = habits.map(h => {
            const d = habitLogs[today]?.[h.id];
            return `<div class="bg-white dark:bg-[#0b0f1a] rounded-[2rem] p-6 border border-slate-100 flex items-center justify-between group premium-shadow"><div class="flex items-center gap-5 overflow-hidden"><span class="text-3xl">${h.icon}</span><span class="font-bold text-sm truncate">${h.name}</span></div><button onclick="updateHabitValue('${h.id}', ${!d})" class="w-11 h-11 rounded-2xl border-2 flex items-center justify-center ${d ? 'bg-green-500 border-green-500 text-white' : 'border-slate-100 dark:border-slate-800'}">${d ? '<i data-lucide="check" class="w-6 h-6"></i>' : ''}</button></div>`;
        }).join('');
        el['habit-progress-list'].innerHTML = habits.map(h => `<div class="bg-white dark:bg-[#0b0f1a] rounded-4xl border border-slate-100 p-8 flex items-center justify-between premium-shadow transition-all"><div class="flex items-center gap-6"><span class="text-4xl p-5 bg-slate-50 dark:bg-slate-800 rounded-[2.25rem]">${h.icon}</span><h4 class="font-bold text-xl">${h.name}</h4></div><button onclick="if(confirm('Stop?')){habits=habits.filter(x=>x.id!=='${h.id}');localStorage.setItem(HABITS_KEY,JSON.stringify(habits));renderHabitView()}"><i data-lucide="trash-2" class="w-6 h-6"></i></button></div>`).join('');
        lucide.createIcons();
    }
    window.updateHabitValue = (id, val) => {
        const t = formatDate(new Date()); if (!habitLogs[t]) habitLogs[t] = {};
        habitLogs[t][id] = val; localStorage.setItem(HABIT_LOGS_KEY, JSON.stringify(habitLogs));
        renderHabitView();
    };

    function renderCategories() {
        el['categories-list'].innerHTML = categories.map(c => `<div class="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 flex items-center justify-between"><span>${c.icon} ${c.name}</span><button onclick="deleteCategory('${c.name}')"><i data-lucide="x" class="w-4 h-4"></i></button></div>`).join('');
        lucide.createIcons();
    }
    window.deleteCategory = (n) => { categories = categories.filter(c => c.name !== n); localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)); renderCategories(); };

    function exportData() {
        const data = { entries, categories, todos, habits, habitLogs, importantDates };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ZenJournal_Export_${formatDate(new Date())}.json`; a.click();
    }

    function openLightbox(src) { el['lightbox-img'].src = src; el['image-lightbox'].classList.remove('hidden'); setTimeout(() => el['image-lightbox'].classList.remove('opacity-0'), 10); }
    function closeLightbox() { el['image-lightbox'].classList.add('opacity-0'); setTimeout(() => el['image-lightbox'].classList.add('hidden'), 400); }

    window.onload = () => {
        updateElements(); initTheme();
        entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || [...DEFAULT_CATEGORIES];
        todos = JSON.parse(localStorage.getItem(TODO_KEY)) || [];
        habits = JSON.parse(localStorage.getItem(HABITS_KEY)) || [];
        habitLogs = JSON.parse(localStorage.getItem(HABIT_LOGS_KEY)) || {};
        importantDates = JSON.parse(localStorage.getItem(DATES_KEY)) || [];
        renderImportantDates(); switchTab('journal');
    };
    function resetApp() {
  // Clear all web storage
  localStorage.clear();
  sessionStorage.clear();

  // Delete all cookies for this site
  document.cookie.split(";").forEach(cookie => {
    const name = cookie.split("=")[0].trim();
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
  });

  // Reload page
  window.location.reload();
}

