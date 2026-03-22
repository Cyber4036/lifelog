// ─── Lifelog App ────────────────────────────────────────────────────────────
// Plain HTML/CSS/JS SPA. No frameworks. Data in localStorage.

const STORAGE_KEY = 'lifelog_entries';

// ─── Data Layer ──────────────────────────────────────────────────────────────
function loadEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry(entry) {
  const entries = loadEntries();
  entries.unshift(entry); // newest first
  saveEntries(entries);
}

function deleteEntry(id) {
  const entries = loadEntries().filter(e => e.id !== id);
  saveEntries(entries);
}

// ─── Time Helpers ────────────────────────────────────────────────────────────
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function formatTimestamp(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('en-GB', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDateShort(isoString) {
  const d = new Date(isoString);
  return { day: d.getDate(), month: d.toLocaleString('en-GB', { month: 'short' }) };
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

// ─── Feeling Config ──────────────────────────────────────────────────────────
const FEELINGS = [
  { id: 'calm',       label: 'Calm',       icon: 'eco',              color: 'text-secondary' },
  { id: 'focused',    label: 'Focused',    icon: 'center_focus_strong', color: 'text-primary' },
  { id: 'joyful',     label: 'Joyful',     icon: 'sunny',            color: 'text-primary' },
  { id: 'anxious',    label: 'Anxious',    icon: 'bolt',             color: 'text-tertiary' },
  { id: 'frustrated', label: 'Frustrated', icon: 'tsunami',          color: 'text-tertiary' },
  { id: 'tired',      label: 'Tired',      icon: 'bedtime',          color: 'text-outline' },
  { id: 'neutral',    label: 'Neutral',    icon: 'drag_handle',      color: 'text-on-surface-variant' },
  { id: 'serene',     label: 'Serene',     icon: 'self_improvement', color: 'text-secondary' },
];

const INTENSITY_LABELS = { 1: 'Subtle', 2: 'Mild', 3: 'Moderate', 4: 'Strong', 5: 'Overwhelming' };

// ─── View Router ─────────────────────────────────────────────────────────────
let currentView = 'dashboard';

function showView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById(`view-${view}`);
  if (el) el.classList.remove('hidden');

  // Update nav active states
  document.querySelectorAll('[data-nav]').forEach(link => {
    const isActive = link.dataset.nav === view;
    link.classList.toggle('nav-active', isActive);
    link.classList.toggle('nav-inactive', !isActive);
  });

  // Render views on demand
  if (view === 'dashboard') renderDashboard();
  if (view === 'history') renderHistory();
  if (view === 'export') renderExport();
  if (view === 'new-log') initNewLogForm();

  window.scrollTo(0, 0);
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function renderDashboard() {
  const entries = loadEntries();
  const latest = entries[0] || null;

  // Last entry badge
  const lastEntryEl = document.getElementById('last-entry-badge');
  if (lastEntryEl) {
    if (latest) {
      lastEntryEl.innerHTML = `
        <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings:'FILL' 1;">auto_awesome</span>
        <div>
          <p class="font-label text-xs uppercase tracking-widest text-on-surface-variant">Last log: ${timeAgo(latest.timestamp)}</p>
          <p class="font-headline text-lg font-bold text-primary italic">${latest.state || latest.feeling_label || 'No state noted'}</p>
        </div>`;
    } else {
      lastEntryEl.innerHTML = `
        <span class="material-symbols-outlined text-outline text-3xl">ink_pen</span>
        <div>
          <p class="font-label text-xs uppercase tracking-widest text-on-surface-variant">No entries yet</p>
          <p class="font-headline text-lg font-bold text-primary italic">Start your first log</p>
        </div>`;
    }
  }

  // Recent entries on dashboard
  const recentEl = document.getElementById('dashboard-recent');
  if (recentEl) {
    if (entries.length === 0) {
      recentEl.innerHTML = `<div class="text-center py-8 opacity-40">
        <span class="material-symbols-outlined text-4xl block mb-2">ink_pen</span>
        <p class="font-headline italic">Your archive awaits its first entry.</p>
      </div>`;
    } else {
      recentEl.innerHTML = entries.slice(0, 3).map(e => entryCardCondensed(e)).join('');
    }
  }

  // Weekly activity grid
  renderWeeklyGrid();
}

function renderWeeklyGrid() {
  const grid = document.getElementById('weekly-grid');
  if (!grid) return;
  const entries = loadEntries();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  grid.innerHTML = days.map((day, idx) => {
    const isToday = idx === 6;
    const count = entries.filter(e => {
      const ed = new Date(e.timestamp);
      return ed.toDateString() === day.toDateString();
    }).length;
    const opacity = count === 0 ? 'opacity-10' : count === 1 ? 'opacity-40' : count === 2 ? 'opacity-70' : '';
    const label = isToday ? 'Today' : day.toLocaleString('en-GB', { weekday: 'short' });
    const ringClass = isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-highest' : '';
    return `<div class="flex flex-col gap-2 items-center">
      <span class="font-label text-[10px] text-center uppercase tracking-tighter text-on-surface-variant${isToday ? ' text-primary font-bold' : ''}">${label}</span>
      <div class="w-8 h-8 rounded-lg bg-secondary ${opacity} ${ringClass}"></div>
      <span class="font-label text-[10px] text-on-surface-variant">${count || ''}</span>
    </div>`;
  }).join('');
}

// ─── New Log Form ─────────────────────────────────────────────────────────────
let selectedFeeling = null;

function initNewLogForm() {
  selectedFeeling = null;

  // Auto timestamp
  const tsEl = document.getElementById('form-timestamp');
  if (tsEl) {
    tsEl.textContent = formatTimestamp(getCurrentTimestamp());
    tsEl.dataset.iso = getCurrentTimestamp();
  }

  // Reset form fields
  const form = document.getElementById('new-log-form');
  if (form) form.reset();

  // Intensity label
  updateIntensityLabel(3);

  // Render feeling buttons
  renderFeelingButtons();
}

function renderFeelingButtons(selected = null) {
  const container = document.getElementById('feeling-buttons');
  if (!container) return;
  container.innerHTML = FEELINGS.map(f => {
    const isActive = f.id === selected;
    return `<button type="button" data-feeling="${f.id}"
        class="feel-btn flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 active:scale-95
               ${isActive ? 'bg-primary text-on-primary shadow-lg scale-105' : 'hover:bg-surface-container-highest border border-transparent ' + f.color}">
        <span class="material-symbols-outlined text-2xl" ${isActive ? '' : `style="font-variation-settings:'FILL' 0,'wght' 300"`}>${f.icon}</span>
        <span class="text-xs font-bold font-label">${f.label}</span>
      </button>`;
  }).join('');

  container.querySelectorAll('.feel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedFeeling = btn.dataset.feeling;
      renderFeelingButtons(selectedFeeling);
    });
  });
}

function updateIntensityLabel(val) {
  const el = document.getElementById('intensity-label');
  if (el) el.textContent = `${INTENSITY_LABELS[val]} (${val})`;
}

function handleNewLogSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const planned = form.querySelector('#field-planned')?.value?.trim() || '';
  const actual = form.querySelector('#field-actual')?.value?.trim() || '';
  const state = form.querySelector('#field-state')?.value?.trim() || '';
  const notes = form.querySelector('#field-notes')?.value?.trim() || '';
  const intensity = parseInt(form.querySelector('#field-intensity')?.value || '3', 10);
  const feelingNote = form.querySelector('#field-feeling-note')?.value?.trim() || '';

  if (!actual) {
    const el = form.querySelector('#field-actual');
    el.focus();
    el.classList.add('ring-2', 'ring-tertiary');
    setTimeout(() => el.classList.remove('ring-2', 'ring-tertiary'), 2000);
    return;
  }

  const feeling = FEELINGS.find(f => f.id === selectedFeeling);
  const entry = {
    id: Date.now().toString(),
    timestamp: form.querySelector('#form-timestamp')?.dataset?.iso || getCurrentTimestamp(),
    planned,
    actual,
    state,
    notes,
    feeling_id: selectedFeeling,
    feeling_label: feeling?.label || '',
    intensity,
    feeling_note: feelingNote,
  };

  addEntry(entry);
  showView('history');
}

// ─── History ─────────────────────────────────────────────────────────────────
let historySearchQuery = '';
let historyFeelingFilter = 'all';

function renderHistory() {
  let entries = loadEntries();

  // Filter
  if (historySearchQuery) {
    const q = historySearchQuery.toLowerCase();
    entries = entries.filter(e =>
      [e.planned, e.actual, e.state, e.notes, e.feeling_label, e.feeling_note]
        .some(v => v && v.toLowerCase().includes(q))
    );
  }
  if (historyFeelingFilter !== 'all') {
    entries = entries.filter(e => e.feeling_id === historyFeelingFilter);
  }

  const container = document.getElementById('history-feed');
  if (!container) return;

  if (entries.length === 0) {
    container.innerHTML = `<div class="text-center py-16 opacity-40">
      <span class="material-symbols-outlined text-5xl block mb-3">ink_pen</span>
      <p class="font-headline italic text-xl">No entries found.</p>
      <p class="text-sm font-label uppercase tracking-widest mt-2">Begin your archive.</p>
    </div>`;
    return;
  }

  container.innerHTML = entries.map((e, i) =>
    i === 0 ? entryCardExpanded(e) : entryCardCondensed(e)
  ).join('');

  // Delete buttons
  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (confirm('Delete this entry?')) {
        deleteEntry(btn.dataset.delete);
        renderHistory();
      }
    });
  });

  // Expand condensed cards
  container.querySelectorAll('[data-expand]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.expand;
      const entry = loadEntries().find(e => e.id === id);
      if (!entry) return;
      card.outerHTML = entryCardExpanded(entry);
      // re-bind after replace
      renderHistory();
    });
  });
}

function entryCardExpanded(e) {
  const { day, month } = formatDateShort(e.timestamp);
  const feeling = FEELINGS.find(f => f.id === e.feeling_id);
  const intensityPct = ((e.intensity || 3) / 5) * 100;
  return `<article class="group">
    <div class="flex gap-6 md:gap-8">
      <div class="hidden sm:flex flex-col items-center pt-1 shrink-0">
        <span class="font-headline text-2xl font-bold text-primary leading-none">${day}</span>
        <span class="font-label text-xs uppercase tracking-tighter text-on-surface-variant">${month}</span>
        <div class="w-px flex-1 bg-outline-variant/30 mt-3"></div>
      </div>
      <div class="flex-1 bg-surface-container-lowest rounded-xl p-6 md:p-8 transition-all duration-300">
        <div class="flex justify-between items-start mb-5">
          <div>
            <div class="flex items-center gap-3 flex-wrap mb-1">
              <h3 class="font-headline text-xl md:text-2xl font-bold text-on-surface">${e.state || e.actual.slice(0, 30) + (e.actual.length > 30 ? '…' : '')}</h3>
              ${feeling ? `<span class="bg-secondary-container text-on-secondary-container px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest">${feeling.label}</span>` : ''}
            </div>
            <p class="font-label text-xs text-on-surface-variant/60 flex items-center gap-1">
              <span class="material-symbols-outlined" style="font-size:14px">schedule</span>
              ${formatTimestamp(e.timestamp)}
            </p>
          </div>
          <button data-delete="${e.id}" class="p-2 rounded-lg hover:bg-error-container transition-colors text-on-surface-variant hover:text-error shrink-0" title="Delete entry">
            <span class="material-symbols-outlined text-sm">delete_outline</span>
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-${e.planned ? '3' : '2'} gap-6 border-t border-outline-variant/10 pt-5">
          ${e.planned ? `<div>
            <h4 class="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-extrabold mb-2">Planned</h4>
            <p class="font-headline italic text-base leading-relaxed text-on-surface-variant">${escHtml(e.planned)}</p>
          </div>` : ''}
          <div>
            <h4 class="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-extrabold mb-2">Actual</h4>
            <p class="font-headline italic text-base leading-relaxed text-on-surface">${escHtml(e.actual)}</p>
          </div>
          ${feeling ? `<div>
            <h4 class="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-extrabold mb-2">Feeling</h4>
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-3xl ${feeling.color}" style="font-variation-settings:'FILL' 1">${feeling.icon}</span>
              <div class="flex-1">
                <div class="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-secondary rounded-full transition-all" style="width:${intensityPct}%"></div>
                </div>
                <span class="font-label text-xs text-on-surface-variant mt-1 block">${INTENSITY_LABELS[e.intensity] || 'Moderate'}</span>
              </div>
            </div>
            ${e.feeling_note ? `<p class="font-body text-sm italic text-on-surface-variant mt-2 opacity-60">${escHtml(e.feeling_note)}</p>` : ''}
          </div>` : ''}
        </div>
        ${e.notes ? `<div class="mt-5 p-4 bg-surface-container rounded-lg border-l-4 border-primary/30">
          <p class="font-body text-sm leading-relaxed text-on-surface italic">"${escHtml(e.notes)}"</p>
        </div>` : ''}
      </div>
    </div>
  </article>`;
}

function entryCardCondensed(e) {
  const { day, month } = formatDateShort(e.timestamp);
  const feeling = FEELINGS.find(f => f.id === e.feeling_id);
  return `<article class="group cursor-pointer" data-expand="${e.id}">
    <div class="flex gap-6 md:gap-8">
      <div class="hidden sm:flex flex-col items-center pt-1 shrink-0">
        <span class="font-headline text-2xl font-bold text-primary leading-none">${day}</span>
        <span class="font-label text-xs uppercase tracking-tighter text-on-surface-variant">${month}</span>
        <div class="w-px flex-1 bg-outline-variant/30 mt-3"></div>
      </div>
      <div class="flex-1 bg-surface-container-low rounded-xl px-6 py-5 transition-all duration-300 hover:bg-surface-container hover:translate-x-0.5">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4 min-w-0">
            ${feeling ? `<span class="material-symbols-outlined text-2xl ${feeling.color} shrink-0" style="font-variation-settings:'FILL' 0,'wght' 300">${feeling.icon}</span>` : '<span class="material-symbols-outlined text-2xl text-outline shrink-0">ink_pen</span>'}
            <div class="min-w-0">
              <h3 class="font-headline text-lg font-bold text-on-surface truncate">${escHtml(e.actual.slice(0, 60) + (e.actual.length > 60 ? '…' : ''))}</h3>
              <p class="font-label text-xs text-on-surface-variant/60">${timeAgo(e.timestamp)}${e.state ? ' · ' + escHtml(e.state) : ''}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 shrink-0 ml-3">
            ${feeling ? `<span class="font-headline italic text-sm font-bold ${feeling.color} hidden md:block">${feeling.label}</span>` : ''}
            <span class="material-symbols-outlined text-outline transition-transform duration-300 group-hover:translate-x-0.5">chevron_right</span>
          </div>
        </div>
      </div>
    </div>
  </article>`;
}

// ─── Export ───────────────────────────────────────────────────────────────────
function renderExport() {
  const entries = loadEntries();
  const statsEl = document.getElementById('export-stats');
  if (statsEl) {
    const wordCount = entries.reduce((acc, e) =>
      acc + [e.planned, e.actual, e.state, e.notes, e.feeling_note].filter(Boolean).join(' ').split(/\s+/).filter(Boolean).length, 0);
    statsEl.innerHTML = `Your export will include <strong>${entries.length} entries</strong> and <strong>${wordCount.toLocaleString()} words</strong> of personal reflection.`;
  }

  const lastExportEl = document.getElementById('last-export-date');
  const lastExport = localStorage.getItem('lifelog_last_export');
  if (lastExportEl) lastExportEl.textContent = lastExport ? timeAgo(lastExport) : 'Never';
}

function exportJSON() {
  const entries = loadEntries();
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  download(blob, `lifelog-export-${today()}.json`);
  localStorage.setItem('lifelog_last_export', new Date().toISOString());
  renderExport();
}

function exportCSV() {
  const entries = loadEntries();
  const headers = ['id', 'timestamp', 'planned', 'actual', 'state', 'feeling', 'intensity', 'feeling_note', 'notes'];
  const rows = entries.map(e => [
    e.id, e.timestamp,
    csvCell(e.planned), csvCell(e.actual), csvCell(e.state),
    csvCell(e.feeling_label), e.intensity || '',
    csvCell(e.feeling_note), csvCell(e.notes)
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  download(blob, `lifelog-export-${today()}.csv`);
  localStorage.setItem('lifelog_last_export', new Date().toISOString());
  renderExport();
}

function exportMarkdown() {
  const entries = loadEntries();
  const md = entries.map(e => {
    const lines = [`## ${formatTimestamp(e.timestamp)}\n`];
    if (e.planned) lines.push(`**Planned:** ${e.planned}\n`);
    lines.push(`**Actual:** ${e.actual}\n`);
    if (e.state) lines.push(`**State:** ${e.state}\n`);
    if (e.feeling_label) lines.push(`**Feeling:** ${e.feeling_label} (${INTENSITY_LABELS[e.intensity] || ''})\n`);
    if (e.feeling_note) lines.push(`*${e.feeling_note}*\n`);
    if (e.notes) lines.push(`\n> ${e.notes}\n`);
    return lines.join('\n');
  }).join('\n---\n\n');
  const blob = new Blob([`# Lifelog Export\n\n${md}`], { type: 'text/markdown' });
  download(blob, `lifelog-export-${today()}.md`);
  localStorage.setItem('lifelog_last_export', new Date().toISOString());
  renderExport();
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function csvCell(val) {
  if (!val) return '';
  return `"${String(val).replace(/"/g, '""')}"`;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Nav links
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); showView(link.dataset.nav); });
  });

  // New log form submit
  const form = document.getElementById('new-log-form');
  if (form) form.addEventListener('submit', handleNewLogSubmit);

  // Intensity slider
  const slider = document.getElementById('field-intensity');
  if (slider) {
    slider.addEventListener('input', () => updateIntensityLabel(parseInt(slider.value, 10)));
  }

  // History search
  const searchInput = document.getElementById('history-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      historySearchQuery = e.target.value;
      renderHistory();
    });
  }

  // History feeling filter
  const feelingSelect = document.getElementById('history-feeling-filter');
  if (feelingSelect) {
    feelingSelect.addEventListener('change', e => {
      historyFeelingFilter = e.target.value;
      renderHistory();
    });
  }

  // Export buttons
  document.getElementById('btn-export-json')?.addEventListener('click', exportJSON);
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
  document.getElementById('btn-export-md')?.addEventListener('click', exportMarkdown);

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.warn);
  }

  // Dark mode toggle
  const darkToggle = document.getElementById('dark-mode-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('lifelog_theme');
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('lifelog_theme', isDark ? 'dark' : 'light');
      const icon = darkToggle.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    });
    // Set icon
    const icon = darkToggle.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
  }

  // Initial view
  showView('dashboard');
});
