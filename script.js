(() => {
'use strict';

/* ================= Helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const fmtDate = d => { const x = new Date(d + 'T00:00:00'); return isNaN(x) ? '—' : x.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}); };
const fmtTime = t => { if (!/^\d{2}:\d{2}$/.test(t || '')) return ''; const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };

/* ================= Data layer (localStorage) ================= */
const K = {tasks:'studyflow_tasks', subjects:'studyflow_subjects', sessions:'studyflow_sessions', notes:'studyflow_notes', settings:'studyflow_settings'};
const PR = ['Low', 'Medium', 'High'], CAT = ['Assignment','Quiz','Exam','Project','Reading','Research','Other'], ST = ['Pending','In Progress','Completed'];
const YEARS = ['1st Year','2nd Year','3rd Year','4th Year','Senior High School','Other'];

const defaults = {
  settings: () => ({theme:'light', compact:false, showCompleted:true, confirmDelete:true, name:'Student', course:'BS Information Technology', year:'2nd Year'}),
  subjects: () => [
    {id:'s1', name:'Mathematics', teacher:'Prof. Elena Reyes', room:'Room 204', color:'#4f46e5', description:'Calculus II: integration techniques, series and applications.'},
    {id:'s2', name:'Web Development', teacher:'Mr. Daniel Cruz', room:'Computer Lab 1', color:'#0d9488', description:'HTML, CSS, JavaScript and responsive design.'},
    {id:'s3', name:'Database Management', teacher:'Dr. Maria Santos', room:'Room 310', color:'#b45309', description:'Relational modeling, normalization and SQL queries.'},
    {id:'s4', name:'English', teacher:'Ms. Grace Ortega', room:'Room 112', color:'#be185d', description:'Literary analysis and academic writing.'},
    {id:'s5', name:'Computer Programming', teacher:'Mr. Paolo Lim', room:'Computer Lab 2', color:'#1d4ed8', description:'Problem solving with Python, recursion and algorithms.'}],
  tasks: () => {
    const T = (title, subject, d, time, priority, category, status, description, ca = '') => ({id:uid(), title, subject, due:addDays(d), time, priority, category, status, description, completedAt:ca === '' ? '' : addDays(ca)});
    return [
      T('Calculus Problem Set 5','s1',-2,'23:59','High','Assignment','In Progress','Integration by parts, problems 1–20.'),
      T('Build Portfolio Landing Page','s2',0,'17:00','High','Project','In Progress','Responsive hero, projects grid and contact form.'),
      T('ER Diagram for Library System','s3',0,'14:00','Medium','Assignment','Pending','Entities for books, members and loans with cardinalities.'),
      T('Recursion Practice Set','s5',0,'19:00','Medium','Assignment','Completed','Factorial, Fibonacci and tree traversal exercises.',0),
      T('Read The Great Gatsby, Chapters 4–5','s4',1,'09:00','Low','Reading','Pending','Note the symbolism of the green light.'),
      T('SQL Joins Quiz','s3',3,'10:00','High','Quiz','Pending','Inner, left and self joins; subqueries.'),
      T('Research Essay Outline','s4',5,'23:59','Medium','Research','Pending','Thesis statement and three supporting sources.'),
      T('Midterm Exam: Calculus II','s1',7,'08:00','High','Exam','Pending','Chapters 5–8. Bring a calculator.'),
      T('JavaScript DOM Lab','s2',-4,'16:00','Medium','Assignment','Completed','Event listeners and dynamic lists.',-5),
      T('Python Loops Exercise','s5',-6,'12:00','Low','Assignment','Completed','Nested loops and pattern printing.',-3),
      T('Normalization Worksheet','s3',-1,'18:00','Medium','Assignment','Completed','Convert a schema to 3NF.',-1)];
  },
  sessions: () => [
    {id:uid(), subject:'s5', topic:'Recursion practice', date:addDays(-1), start:'16:00', end:'17:30', location:'Computer Lab 2', notes:'Finish the tree traversal problems.', done:true},
    {id:uid(), subject:'s1', topic:'Integration techniques review', date:addDays(0), start:'18:00', end:'19:30', location:'Library, Room 2', notes:'Redo Problem Set 5 mistakes.', done:false},
    {id:uid(), subject:'s2', topic:'CSS Grid and Flexbox practice', date:addDays(1), start:'15:00', end:'16:30', location:'Computer Lab 1', notes:'Rebuild the portfolio layout.', done:false},
    {id:uid(), subject:'s3', topic:'SQL joins and subqueries', date:addDays(2), start:'16:00', end:'17:30', location:'Study Hall', notes:'Prepare for Friday’s quiz.', done:false},
    {id:uid(), subject:'s1', topic:'Midterm review session', date:addDays(6), start:'14:00', end:'16:00', location:'Library', notes:'Chapters 5–8 formula sheet.', done:false}],
  notes: () => [
    {id:uid(), title:'Integration by Parts Formula', subject:'s1', tags:['calculus','formulas'], created:addDays(-3), content:'∫u dv = uv − ∫v du\n\nChoose u using LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential.'},
    {id:uid(), title:'Normal Forms Summary', subject:'s3', tags:['database','normalization'], created:addDays(-2), content:'1NF: atomic values.\n2NF: no partial dependency on a composite key.\n3NF: no transitive dependency.'},
    {id:uid(), title:'Flexbox vs Grid', subject:'s2', tags:['css','layout'], created:addDays(-1), content:'Flexbox is one-dimensional (row or column).\nGrid is two-dimensional (rows and columns).\n\nUse Grid for page layout and Flexbox for components.'}]
};

function load(k) {
  const d = defaults[k](); let raw = null;
  try { raw = localStorage.getItem(K[k]); } catch {}
  if (raw === null) return d;                      // first visit → demo data
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(d)) return Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : d;
    return v && typeof v === 'object' ? {...d, ...v} : d;
  } catch { return d; }                            // corrupted → defaults
}
function save(k) { try { localStorage.setItem(K[k], JSON.stringify(S[k])); } catch { toast('Storage unavailable. Changes will not persist.'); } }
const S = {}; Object.keys(K).forEach(k => S[k] = load(k)); Object.keys(K).forEach(save);

const find = (k, id) => S[k].find(x => x.id === id);
const subj = id => find('subjects', id);
const done = t => t.status === 'Completed';
const byDue = (a, b) => ((a.due || '') + (a.time || '')).localeCompare((b.due || '') + (b.time || ''));
function upsert(k, rec) { const i = S[k].findIndex(x => x.id === rec.id); i < 0 ? S[k].push(rec) : S[k][i] = rec; save(k); closeModal(); render(); }

function stats() {
  const T = S.tasks, td = today(), c = T.filter(done).length;
  return {total:T.length, c, pending:T.length - c, prog:T.filter(t => t.status === 'In Progress').length,
    od:T.filter(t => !done(t) && t.due && t.due < td).length, up:T.filter(t => !done(t) && t.due >= td).length,
    pct:T.length ? Math.round(c / T.length * 100) : 0};
}

/* ================= UI helpers ================= */
const PRI = {High:'▲', Medium:'●', Low:'▼'};
const priB = p => `<span class="badge p-${esc((p || 'Medium').toLowerCase())}">${PRI[p] || '●'} ${esc(p || 'Medium')}</span>`;
const stB = t => done(t) ? '<span class="badge st-done">✓ Completed</span>'
  : t.due && t.due < today() ? '<span class="badge st-late">! Overdue</span>'
  : t.status === 'In Progress' ? '<span class="badge st-prog">◐ In Progress</span>' : '<span class="badge st-pend">○ Pending</span>';
const chip = id => { const s = subj(id); return `<span class="chip"><i style="background:${s ? esc(s.color) : '#64748b'}"></i>${esc(s ? s.name : 'General')}</span>`; };
const bar = (p, c) => `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><span style="width:${p}%${c ? ';background:' + esc(c) : ''}"></span></div>`;
const options = (o, val) => o.map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}"${v === val ? ' selected' : ''}>${esc(l)}</option>`; }).join('');
const empty = (icon, title, msg, btn = '') => `<div class="empty"><div aria-hidden="true">${icon}</div><h3>${title}</h3><p>${msg}</p>${btn}</div>`;
const subjOpts = blank => [...(blank ? [['', 'General (no subject)']] : []), ...S.subjects.map(s => [s.id, s.name])];

function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 3000); }

/* ---- Modal + form builder ---- */
let lastFocus = null;
function openModal(title, html) {
  lastFocus = document.activeElement; $('#mTitle').textContent = title; $('#mBody').innerHTML = html; $('#modal').hidden = false;
  const f = $('#mBody').querySelector('input,select,textarea,button'); if (f) f.focus();
}
function closeModal() { $('#modal').hidden = true; $('#mBody').innerHTML = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
function fieldHtml(f, v) {
  const id = 'f_' + f.n, val = v ?? '';
  const el = f.t === 'select' ? `<select id="${id}" name="${f.n}">${options(f.o, val)}</select>`
    : f.t === 'textarea' ? `<textarea id="${id}" name="${f.n}" rows="${f.rows || 3}">${esc(val)}</textarea>`
    : `<input id="${id}" name="${f.n}" type="${f.t || 'text'}" value="${esc(val)}"${f.r ? ' required' : ''}>`;
  return `<div class="field${f.full ? ' full' : ''}" data-n="${f.n}"><label for="${id}">${f.l}${f.r ? ' *' : ''}</label>${el}<small class="err" role="alert"></small></div>`;
}
function openForm({title, label, fields, data, validate, save: onSave}) {
  openModal(title, `<form id="mForm" novalidate><div class="grid">${fields.map(f => fieldHtml(f, data[f.n])).join('')}</div><div class="actions"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">${label}</button></div></form>`);
  $('#mForm').addEventListener('submit', e => {
    e.preventDefault(); const d = {}, errs = {};
    fields.forEach(f => d[f.n] = e.target.elements[f.n].value.trim());
    fields.forEach(f => { if (f.r && !d[f.n]) errs[f.n] = `${f.l} is required.`; });
    if (!Object.keys(errs).length) Object.assign(errs, validate ? validate(d) : {});
    fields.forEach(f => { const w = $(`[data-n="${f.n}"]`); w.classList.toggle('bad', !!errs[f.n]); $('.err', w).textContent = errs[f.n] || ''; });
    if (!Object.keys(errs).length) onSave(d); else { const b = $('.field.bad input,.field.bad select,.field.bad textarea'); if (b) b.focus(); }
  });
}
function del(k, id, label) {
  const run = () => {
    S[k] = S[k].filter(x => x.id !== id);
    if (k === 'subjects') ['tasks','sessions','notes'].forEach(c => { S[c].forEach(x => { if (x.subject === id) x.subject = ''; }); save(c); });
    save(k); render(); toast(`${label} deleted.`);
  };
  if (!S.settings.confirmDelete) return run();
  openModal('Confirm deletion', `<p>Delete this ${label.toLowerCase()}? This cannot be undone.</p><div class="actions"><button class="btn" data-act="close">Cancel</button><button class="btn danger" id="yes">Delete</button></div>`);
  $('#yes').onclick = () => { closeModal(); run(); };
}

/* ================= Forms ================= */
function taskForm(t) {
  const isNew = !t; t = t || {priority:'Medium', category:'Assignment', status:'Pending', due:today()};
  openForm({title:isNew ? 'Add Task' : 'Edit Task', label:'Save Task', data:t,
    fields:[{n:'title',l:'Task Title',r:1,full:1},{n:'subject',l:'Subject',t:'select',o:subjOpts(true)},{n:'category',l:'Category',t:'select',o:CAT},
      {n:'due',l:'Due Date',t:'date',r:1},{n:'time',l:'Due Time',t:'time'},{n:'priority',l:'Priority',t:'select',o:PR},{n:'status',l:'Status',t:'select',o:ST},
      {n:'description',l:'Description',t:'textarea',full:1}],
    validate: d => isNaN(new Date(d.due + 'T00:00:00')) ? {due:'Enter a valid date.'} : isNew && d.due < today() ? {due:'Due date cannot be in the past.'} : {},
    save: d => { upsert('tasks', {...(t.id ? t : {id:uid()}), ...d, completedAt:d.status === 'Completed' ? (t.completedAt || today()) : ''}); toast(isNew ? 'Task added successfully.' : 'Task updated successfully.'); }});
}
function subjectForm(s) {
  const isNew = !s; s = s || {color:'#4f46e5'};
  openForm({title:isNew ? 'Add Subject' : 'Edit Subject', label:'Save Subject', data:s,
    fields:[{n:'name',l:'Subject Name',r:1,full:1},{n:'teacher',l:'Teacher / Instructor'},{n:'room',l:'Room / Class Info'},{n:'color',l:'Color',t:'color'},{n:'description',l:'Description',t:'textarea',full:1}],
    validate: d => S.subjects.some(x => x.id !== s.id && x.name.toLowerCase() === d.name.toLowerCase()) ? {name:'A subject with this name already exists.'} : {},
    save: d => { upsert('subjects', {...(s.id ? s : {id:uid()}), ...d}); toast(isNew ? 'Subject added successfully.' : 'Subject updated successfully.'); }});
}
function sessionForm(s) {
  const isNew = !s; s = s || {date:today(), start:'16:00', end:'17:00'};
  openForm({title:isNew ? 'Schedule Study Session' : 'Edit Study Session', label:'Save Session', data:s,
    fields:[{n:'subject',l:'Subject',t:'select',o:subjOpts(true)},{n:'topic',l:'Study Topic',r:1},{n:'date',l:'Date',t:'date',r:1},{n:'location',l:'Location'},
      {n:'start',l:'Start Time',t:'time',r:1},{n:'end',l:'End Time',t:'time',r:1},{n:'notes',l:'Notes',t:'textarea',full:1}],
    validate: d => isNaN(new Date(d.date + 'T00:00:00')) ? {date:'Enter a valid date.'} : d.end <= d.start ? {end:'End time must be after the start time.'} : {},
    save: d => { upsert('sessions', {...(s.id ? s : {id:uid(), done:false}), ...d}); toast(isNew ? 'Study session scheduled.' : 'Study session updated.'); }});
}
function noteForm(n) {
  const isNew = !n; n = n ? {...n, tags:(n.tags || []).join(', ')} : {};
  openForm({title:isNew ? 'Add Note' : 'Edit Note', label:'Save Note', data:n,
    fields:[{n:'title',l:'Title',r:1,full:1},{n:'subject',l:'Subject',t:'select',o:subjOpts(true)},{n:'tags',l:'Tags (comma separated)'},{n:'content',l:'Content',t:'textarea',r:1,full:1,rows:7}],
    save: d => { const old = n.id ? find('notes', n.id) : {id:uid(), created:today()}; upsert('notes', {...old, ...d, tags:d.tags.split(',').map(x => x.trim()).filter(Boolean)}); toast(isNew ? 'Note added successfully.' : 'Note updated successfully.'); }});
}

/* ================= Pages ================= */
const F = {q:'', p:'', s:'', sub:'', sort:'asc', nq:'', nsub:''};
const cal = {y:new Date().getFullYear(), m:new Date().getMonth(), sel:today()};

const miniTask = (t, showDate) => `<li class="row${done(t) ? ' is-done' : ''}"><button class="check" data-act="toggle" data-id="${t.id}" aria-label="${done(t) ? 'Mark pending' : 'Mark completed'}: ${esc(t.title)}">${done(t) ? '✓' : ''}</button><div class="grow"><strong>${esc(t.title)}</strong><small>${chip(t.subject)} ${priB(t.priority)} <span>${showDate ? fmtDate(t.due) + ' ' : ''}${fmtTime(t.time)}</span></small></div>${stB(t)}</li>`;
const statCard = (ico, n, l, sub) => `<article class="card stat"><div class="ico" aria-hidden="true">${ico}</div><div><b>${n}</b><strong>${l}</strong><br><small>${sub}</small></div></article>`;

function dashboard() {
  const st = stats(), td = today();
  const tt = S.tasks.filter(t => t.due === td).sort(byDue), up = S.tasks.filter(t => !done(t) && t.due > td).sort(byDue).slice(0, 5);
  return `<section class="card hero"><div><h2>Good day, ${esc(S.settings.name || 'Student')}!</h2><p>Stay organized. Stay focused. Keep learning.</p></div><time datetime="${td}">${new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'})}</time></section>
  <section class="stats" aria-label="Task statistics">${statCard('📋', st.total, 'Total Tasks', 'Across ' + pl(S.subjects.length, 'subject'))}${statCard('✅', st.c, 'Completed Tasks', st.pct + '% completion rate')}${statCard('⏳', st.pending, 'Pending Tasks', st.prog + ' in progress')}${statCard('⚠️', st.od, 'Overdue Tasks', st.od ? 'Needs attention' : 'All caught up')}</section>
  <div class="cols2">
    <section class="card"><h2>Today’s Tasks</h2>${tt.length ? `<ul class="list">${tt.map(t => miniTask(t)).join('')}</ul>` : '<p class="muted">Nothing due today. Enjoy the breathing room.</p>'}</section>
    <section class="card"><h2>Upcoming Deadlines</h2>${up.length ? `<ul class="list">${up.map(t => miniTask(t, 1)).join('')}</ul>` : '<p class="muted">No upcoming deadlines.</p>'}</section>
    <section class="card"><h2>Study Progress</h2><p><strong>${st.pct}%</strong> overall completion</p>${bar(st.pct)}<p class="muted">${st.c} of ${st.total} tasks completed</p></section>
    <section class="card"><h2>Quick Actions</h2><div class="toolbar"><button class="btn primary" data-act="addTask">＋ Add Task</button><button class="btn" data-act="addSubject">＋ Add Subject</button><button class="btn" data-act="addNote">＋ Add Note</button><button class="btn" data-act="addSession">📅 Schedule Study Session</button></div></section>
  </div>`;
}

function taskTable() {
  const q = F.q.toLowerCase();
  const L = S.tasks.filter(t => (!q || ((t.title || '') + ' ' + (t.description || '')).toLowerCase().includes(q)) && (!F.p || t.priority === F.p) && (!F.s || t.status === F.s) && (!F.sub || t.subject === F.sub) && (S.settings.showCompleted || F.s === 'Completed' || !done(t)))
    .sort(byDue); if (F.sort === 'desc') L.reverse();
  if (!L.length) return empty('📝', 'No tasks found', S.tasks.length ? 'Try changing your search or filters.' : 'Add your first task to start planning.', '<button class="btn primary" data-act="addTask">＋ Add Task</button>');
  return `<div class="tablewrap"><table><thead><tr><th>Task</th><th>Subject</th><th>Due Date</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead><tbody>${L.map(t => `<tr${done(t) ? ' class="is-done"' : ''}><td><strong>${esc(t.title)}</strong><br><small>${esc(t.category || '')}</small></td><td>${chip(t.subject)}</td><td>${fmtDate(t.due)}<br><small>${fmtTime(t.time)}</small></td><td>${priB(t.priority)}</td><td>${stB(t)}</td><td><div class="acts"><button class="btn sm" data-act="toggle" data-id="${t.id}">${done(t) ? 'Undo' : 'Complete'}</button><button class="btn sm" data-act="editTask" data-id="${t.id}">Edit</button><button class="btn sm" data-act="delTask" data-id="${t.id}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>`;
}
const filter = (f, lbl, o) => `<select data-f="${f}" aria-label="${lbl}"><option value="">${lbl}</option>${options(o, F[f])}</select>`;
const tasks = () => `<div class="toolbar"><input type="search" data-f="q" placeholder="Search tasks…" aria-label="Search tasks" value="${esc(F.q)}">${filter('p', 'All priorities', PR)}${filter('s', 'All statuses', ST)}${filter('sub', 'All subjects', subjOpts())}<select data-f="sort" aria-label="Sort by due date">${options([['asc','Due date: earliest first'],['desc','Due date: latest first']], F.sort)}</select><button class="btn primary" data-act="addTask">＋ Add Task</button></div><div id="list">${taskTable()}</div>`;

function subjects() {
  const add = '<button class="btn primary" data-act="addSubject">＋ Add Subject</button>';
  if (!S.subjects.length) return empty('📚', 'No subjects yet', 'Add a subject to organize your tasks and notes.', add);
  return `<div class="toolbar">${add}</div><div class="cards">${S.subjects.map(s => {
    const T = S.tasks.filter(t => t.subject === s.id), p = T.length ? Math.round(T.filter(done).length / T.length * 100) : 0;
    return `<article class="card subj" style="--c:${esc(s.color)}"><h3>${esc(s.name)}</h3><p class="muted">👤 ${esc(s.teacher || 'Instructor not set')}${s.room ? ' · 📍 ' + esc(s.room) : ''}</p><p>${esc(s.description)}</p><p><strong>${pl(T.length, 'task')}</strong> · ${p}% complete</p>${bar(p, s.color)}<div class="actions"><button class="btn sm" data-act="editSubject" data-id="${s.id}">Edit</button><button class="btn sm" data-act="delSubject" data-id="${s.id}">Delete</button></div></article>`; }).join('')}</div>`;
}

function schedule() {
  const add = '<button class="btn primary" data-act="addSession">＋ Schedule Study Session</button>';
  if (!S.sessions.length) return empty('⏰', 'No study sessions', 'Plan a session to block out focused study time.', add);
  const L = [...S.sessions].sort((a, b) => ((a.date || '') + (a.start || '')).localeCompare((b.date || '') + (b.start || ''))); let last = '', out = '';
  L.forEach(s => {
    if (s.date !== last) { out += `<h3 class="day">${s.date === today() ? 'Today · ' : ''}${fmtDate(s.date)}</h3>`; last = s.date; }
    out += `<article class="slot${s.done ? ' is-done' : ''}" style="--c:${subj(s.subject) ? esc(subj(s.subject).color) : '#64748b'}"><div class="time">${fmtTime(s.start)} – ${fmtTime(s.end)}</div><div class="grow"><strong>${esc(s.topic)}</strong><br><small>${chip(s.subject)}${s.location ? ' · 📍 ' + esc(s.location) : ''}</small>${s.notes ? `<br><small>${esc(s.notes)}</small>` : ''}</div>${s.done ? '<span class="badge st-done">✓ Done</span>' : '<span class="badge st-pend">○ Planned</span>'}<div class="acts"><button class="btn sm" data-act="doneSession" data-id="${s.id}">${s.done ? 'Undo' : 'Complete'}</button><button class="btn sm" data-act="editSession" data-id="${s.id}">Edit</button><button class="btn sm" data-act="delSession" data-id="${s.id}">Delete</button></div></article>`;
  });
  return `<div class="toolbar">${add}</div><div class="timeline">${out}</div>`;
}

function notesGrid() {
  const q = F.nq.toLowerCase();
  const L = S.notes.filter(n => (!F.nsub || n.subject === F.nsub) && (!q || ((n.title || '') + (n.content || '') + (n.tags || []).join(' ')).toLowerCase().includes(q))).sort((a, b) => (b.created || '').localeCompare(a.created || ''));
  if (!L.length) return empty('🗒️', 'No notes found', S.notes.length ? 'Try a different search or subject.' : 'Capture your first study note.', '<button class="btn primary" data-act="addNote">＋ Add Note</button>');
  return `<div class="cards">${L.map(n => `<article class="card note" style="--c:${subj(n.subject) ? esc(subj(n.subject).color) : '#64748b'}"><h3>${esc(n.title)}</h3><div>${chip(n.subject)} <small>· ${fmtDate(n.created)}</small></div><p class="muted">${esc((n.content || '').slice(0, 140))}${(n.content || '').length > 140 ? '…' : ''}</p><div>${(n.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div><div class="actions"><button class="btn sm" data-act="viewNote" data-id="${n.id}">View</button><button class="btn sm" data-act="editNote" data-id="${n.id}">Edit</button><button class="btn sm" data-act="delNote" data-id="${n.id}">Delete</button></div></article>`).join('')}</div>`;
}
const notes = () => `<div class="toolbar"><input type="search" data-f="nq" placeholder="Search notes…" aria-label="Search notes" value="${esc(F.nq)}">${filter('nsub', 'All subjects', subjOpts())}<button class="btn primary" data-act="addNote">＋ Add Note</button></div><div id="list">${notesGrid()}</div>`;

function calendar() {
  const first = new Date(cal.y, cal.m, 1), dim = new Date(cal.y, cal.m + 1, 0).getDate();
  let cells = '<div class="cell blank"></div>'.repeat(first.getDay());
  for (let d = 1; d <= dim; d++) {
    const ds = `${cal.y}-${pad(cal.m + 1)}-${pad(d)}`, nt = S.tasks.filter(t => t.due === ds).length, ns = S.sessions.filter(s => s.date === ds).length;
    cells += `<button class="cell${ds === today() ? ' today' : ''}${ds === cal.sel ? ' sel' : ''}" data-act="pick" data-id="${ds}" aria-label="${fmtDate(ds)}: ${pl(nt, 'task')}, ${pl(ns, 'study session')}"><b>${d}</b><span class="dots">${nt ? `<i class="dot" title="${pl(nt, 'task')}"></i>` : ''}${ns ? `<i class="dot s" title="${pl(ns, 'session')}"></i>` : ''}</span></button>`;
  }
  const dt = S.tasks.filter(t => t.due === cal.sel).sort(byDue), ds2 = S.sessions.filter(s => s.date === cal.sel).sort((a, b) => a.start.localeCompare(b.start));
  return `<section class="card"><div class="calhead"><button class="btn" data-act="calPrev" aria-label="Previous month">‹</button><h2>${first.toLocaleDateString('en-US', {month:'long', year:'numeric'})}</h2><button class="btn" data-act="calNext" aria-label="Next month">›</button><button class="btn" data-act="calToday">Today</button></div><div class="calgrid">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="dow">${d}</div>`).join('')}${cells}</div><p class="legend"><span class="dot"></span> Task deadline <span class="dot s"></span> Study session</p></section>
  <section class="card"><h2>${fmtDate(cal.sel)}</h2>${dt.length || ds2.length ? `<ul class="list">${dt.map(t => miniTask(t)).join('')}${ds2.map(s => `<li class="row${s.done ? ' is-done' : ''}"><span aria-hidden="true">📅</span><div class="grow"><strong>${esc(s.topic)}</strong><small>${chip(s.subject)} ${fmtTime(s.start)} – ${fmtTime(s.end)}${s.location ? ' · ' + esc(s.location) : ''}</small></div><span class="badge st-pend">Study session</span></li>`).join('')}</ul>` : '<p class="muted">No tasks or study sessions on this day.</p>'}</section>`;
}

function progress() {
  const st = stats(), C = 2 * Math.PI * 52, mx = a => Math.max(1, ...a.map(x => x[1]));
  const pri = ['High','Medium','Low'].map(p => [p, S.tasks.filter(t => t.priority === p).length]);
  const bySub = S.subjects.map(s => [s.name, S.tasks.filter(t => t.subject === s.id).length, s.color]);
  const days = [...Array(7)].map((_, i) => { const d = addDays(i - 6); return [new Date(d + 'T00:00:00').toLocaleDateString('en-US', {weekday:'short'}), S.tasks.filter(t => t.completedAt === d).length]; });
  const hb = (L, c) => L.map(([l, n, col]) => `<div class="hb"><span>${esc(l)}</span>${bar(Math.round(n / mx(L) * 100), col || c)}<b>${n}</b></div>`).join('');
  const sessUp = S.sessions.filter(s => !s.done && s.date >= today()).length;
  return `<section class="stats">${statCard('📋', st.total, 'Total tasks', '')}${statCard('✅', st.c, 'Completed', '')}${statCard('⏳', st.pending, 'Pending', '')}${statCard('⚠️', st.od, 'Overdue', '')}</section>
  <div class="cols2">
  <section class="card"><h2>Task Completion</h2><div class="ringwrap"><svg class="ring" width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="${st.pct}% of tasks completed"><circle cx="70" cy="70" r="52" fill="none" stroke="var(--border)" stroke-width="14"/><circle cx="70" cy="70" r="52" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C * st.pct / 100} ${C}" transform="rotate(-90 70 70)"/><text x="70" y="78" text-anchor="middle">${st.pct}%</text></svg><p class="muted">${st.c} of ${st.total} tasks completed</p></div></section>
  <section class="card"><h2>Tasks by Priority</h2>${hb(pri, 'var(--indigo)')}</section>
  <section class="card"><h2>Tasks by Subject</h2>${bySub.length ? hb(bySub) : '<p class="muted">Add subjects to see this chart.</p>'}</section>
  <section class="card"><h2>Weekly Productivity</h2><p class="muted">Tasks completed in the last 7 days</p><div class="wk">${days.map(([l, n]) => `<div class="col"><b>${n}</b><div class="track"><i style="height:${n / mx(days) * 100}%"></i></div><small>${l}</small></div>`).join('')}</div></section></div>
  <section class="card"><h2>Productivity Summary</h2><ul class="sum"><li>You completed ${st.c} out of ${st.total} tasks.</li><li>You have ${pl(st.up, 'upcoming deadline')}.</li><li>Your current task completion rate is ${st.pct}%.</li><li>${st.od ? `${pl(st.od, 'task')} overdue. Tackle these first.` : 'No overdue tasks. Great work!'}</li><li>You have ${pl(sessUp, 'study session')} planned ahead.</li></ul></section>`;
}

function settings() {
  const s = S.settings, yrs = YEARS.includes(s.year) ? YEARS : [...YEARS, s.year];
  const chk = (n, l) => `<div class="setrow"><label><input type="checkbox" id="set_${n}"${s[n] ? ' checked' : ''}> ${l}</label></div>`;
  return `<section class="card"><h2>Appearance</h2><div class="setrow" role="radiogroup" aria-label="Theme"><label><input type="radio" name="theme" value="light"${s.theme !== 'dark' ? ' checked' : ''}> ☀️ Light Mode</label><label><input type="radio" name="theme" value="dark"${s.theme === 'dark' ? ' checked' : ''}> 🌙 Dark Mode</label></div></section>
  <section class="card"><h2>Application</h2>${chk('compact', 'Compact mode')}${chk('showCompleted', 'Show completed tasks')}${chk('confirmDelete', 'Confirm before deleting')}</section>
  <section class="card"><h2>Student Profile</h2><div class="grid"><div class="field"><label for="set_name">Student Name</label><input id="set_name" value="${esc(s.name)}"></div><div class="field"><label for="set_course">Course / Program</label><input id="set_course" value="${esc(s.course)}"></div><div class="field"><label for="set_year">Year Level</label><select id="set_year">${options(yrs, s.year)}</select></div></div></section>
  <div><button class="btn primary" data-act="saveSettings">Save Settings</button></div>`;
}

/* ================= Router & render ================= */
const PAGES = {dashboard:['Dashboard','🏠',dashboard], tasks:['My Tasks','📝',tasks], subjects:['Subjects','📚',subjects], schedule:['Study Schedule','⏰',schedule], notes:['Notes','🗒️',notes], calendar:['Calendar','📅',calendar], progress:['Progress','📊',progress], settings:['Settings','⚙️',settings]};
let cur = 'dashboard';
function render() {
  const [title,, fn] = PAGES[cur];
  $('#pageTitle').textContent = title; document.title = `${title} · StudyFlow`;
  $('#main').innerHTML = fn();
  $('#nav').innerHTML = Object.entries(PAGES).map(([k, [t, i]]) => `<a href="#${k}"${k === cur ? ' aria-current="page"' : ''}><span aria-hidden="true">${i}</span>${t}</a>`).join('');
  $('#profile').innerHTML = `<strong>${esc(S.settings.name)}</strong>${esc(S.settings.course)}<br>${esc(S.settings.year)}`;
}
function route() { const p = location.hash.slice(1); cur = PAGES[p] ? p : 'dashboard'; document.body.classList.remove('nav-open'); render(); window.scrollTo(0, 0); }
function applyPrefs() {
  document.documentElement.dataset.theme = S.settings.theme; document.body.classList.toggle('compact', !!S.settings.compact);
  $('#themeBtn').textContent = S.settings.theme === 'dark' ? '☀️' : '🌙';
}

/* ================= Actions ================= */
const A = {
  close: closeModal,
  addTask: () => taskForm(), editTask: id => taskForm(find('tasks', id)), delTask: id => del('tasks', id, 'Task'),
  toggle: id => { const t = find('tasks', id); if (!t) return; t.status = done(t) ? 'Pending' : 'Completed'; t.completedAt = done(t) ? today() : ''; save('tasks'); render(); toast(done(t) ? 'Task marked as completed.' : 'Task moved back to pending.'); },
  addSubject: () => subjectForm(), editSubject: id => subjectForm(find('subjects', id)), delSubject: id => del('subjects', id, 'Subject'),
  addSession: () => sessionForm(), editSession: id => sessionForm(find('sessions', id)), delSession: id => del('sessions', id, 'Session'),
  doneSession: id => { const s = find('sessions', id); if (!s) return; s.done = !s.done; save('sessions'); render(); toast(s.done ? 'Study session completed.' : 'Study session reopened.'); },
  addNote: () => noteForm(), editNote: id => noteForm(find('notes', id)), delNote: id => del('notes', id, 'Note'),
  viewNote: id => { const n = find('notes', id); if (!n) return; openModal(n.title, `<p>${chip(n.subject)} <small>· Created ${fmtDate(n.created)}</small></p><div class="note-body">${esc(n.content)}</div><div>${(n.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div><div class="actions"><button class="btn" data-act="close">Close</button><button class="btn primary" data-act="editNote" data-id="${n.id}">Edit</button></div>`); },
  pick: id => { cal.sel = id; render(); },
  calPrev: () => { cal.m--; if (cal.m < 0) { cal.m = 11; cal.y--; } render(); },
  calNext: () => { cal.m++; if (cal.m > 11) { cal.m = 0; cal.y++; } render(); },
  calToday: () => { const n = new Date(); cal.y = n.getFullYear(); cal.m = n.getMonth(); cal.sel = today(); render(); },
  toggleTheme: () => { S.settings.theme = S.settings.theme === 'dark' ? 'light' : 'dark'; save('settings'); applyPrefs(); if (cur === 'settings') render(); },
  saveSettings: () => {
    Object.assign(S.settings, {theme:$('input[name=theme]:checked').value, compact:$('#set_compact').checked, showCompleted:$('#set_showCompleted').checked, confirmDelete:$('#set_confirmDelete').checked,
      name:$('#set_name').value.trim() || 'Student', course:$('#set_course').value.trim(), year:$('#set_year').value});
    save('settings'); applyPrefs(); render(); toast('Settings saved.');
  }
};

/* ================= Events ================= */
document.addEventListener('click', e => {
  if (e.target.id === 'modal') return closeModal();
  const b = e.target.closest('[data-act]'); if (b && A[b.dataset.act]) A[b.dataset.act](b.dataset.id);
});
document.addEventListener('input', e => {
  const f = e.target.dataset.f; if (!f) return;
  F[f] = e.target.value; const l = $('#list'); if (l) l.innerHTML = cur === 'tasks' ? taskTable() : notesGrid();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); document.body.classList.remove('nav-open'); } });
$('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
$('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
window.addEventListener('hashchange', route);

$('#year').textContent = new Date().getFullYear();
applyPrefs(); route();
})();
