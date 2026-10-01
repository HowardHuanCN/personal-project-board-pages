const KEY = 'personal-project-board-v1';
const $ = selector => document.querySelector(selector);
let state = { projects: [], ideas: [] };
let lastFocus = null;

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function normalize(data) {
  return {
    projects: Array.isArray(data?.projects) ? data.projects : [],
    ideas: Array.isArray(data?.ideas) ? data.ideas : []
  };
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  render();
}

function daysUntil(value) {
  if (!value) return null;
  const target = new Date(`${value}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function dueLabel(value) {
  const days = daysUntil(value);
  if (days === null) return '未设目标日期';
  if (days < 0) return `逾期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天到期';
  if (days <= 7) return `还剩 ${days} 天`;
  return value;
}

function render() {
  $('#today').textContent = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }).format(new Date());
  $('#projectCount').textContent = `${state.projects.length} 个`;
  $('#ideaCount').textContent = `${state.ideas.length} 条`;

  $('#projects').innerHTML = state.projects.length ? state.projects.map(project => {
    const progress = Math.max(0, Math.min(100, Number(project.progress) || 0));
    const due = dueLabel(project.deadline);
    return `<article class="project-card">
      <div><h3>${safe(project.emoji ? `${project.emoji} ` : '')}${safe(project.name)}</h3><span class="status">${safe(project.status || '进行中')}</span></div>
      <div class="progress-track"><span style="width:${progress}%"></span></div>
      <div class="progress-meta"><span>当前进度</span><span>${progress}%</span></div>
      <p class="project-next"><strong>下一步</strong>${safe(project.next || '还没写下一步')}</p>
      ${project.note ? `<p class="project-note">${safe(project.note)}</p>` : ''}
      <div class="project-foot"><span class="${(daysUntil(project.deadline) ?? 1) < 0 ? 'late' : ''}">${safe(due)}</span><button type="button" data-edit-project="${safe(project.id)}">更新</button></div>
    </article>`;
  }).join('') : '<div class="empty project-card">还没有项目。点右下角「＋」添加。</div>';

  $('#ideas').innerHTML = state.ideas.length ? state.ideas.map(idea => {
    const date = new Date(idea.createdAt);
    const time = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
    return `<article class="idea-row"><div><p>${safe(idea.text)}</p><time>${safe(time)}</time></div><button type="button" data-delete-idea="${safe(idea.id)}" aria-label="删除这条灵感">删除</button></article>`;
  }).join('') : '<div class="empty">还没有灵感。点右下角「＋」记下来。</div>';

  const dueMilestones = state.projects.flatMap(project => (project.milestones || [])
    .filter(item => !item.done && daysUntil(item.date) !== null && daysUntil(item.date) <= 3)
    .map(item => ({ project: project.name, title: item.title, date: item.date })));
  const dueProjects = state.projects.filter(project => project.status !== '已完成' && daysUntil(project.deadline) !== null && daysUntil(project.deadline) <= 3)
    .map(project => ({ project: project.name, title: '目标日期', date: project.deadline }));
  const urgent = [...dueMilestones, ...dueProjects].sort((a, b) => a.date.localeCompare(b.date))[0];
  $('#attention').hidden = !urgent;
  if (urgent) $('#attention').innerHTML = `<strong>${safe(urgent.project)} · ${safe(urgent.title)}</strong><span>${safe(dueLabel(urgent.date))}</span>`;
}

function showChoice() {
  $('#entryChoice').hidden = false;
  $('#ideaForm').hidden = true;
  $('#projectForm').hidden = true;
  $('#sheetTitle').textContent = '添加内容';
  $('#chooseIdea').focus();
}

function openSheet(kind = 'choice', project = null) {
  if ($('#sheetBackdrop').hidden) lastFocus = document.activeElement;
  $('#sheetBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  if (kind === 'choice') return showChoice();
  $('#entryChoice').hidden = true;
  $('#ideaForm').hidden = kind !== 'idea';
  $('#projectForm').hidden = kind !== 'project';
  if (kind === 'idea') {
    $('#sheetTitle').textContent = '记一个灵感';
    $('#ideaText').focus();
  } else {
    $('#projectForm').reset();
    $('#projectId').value = project?.id || '';
    $('#projectName').value = project?.name || '';
    $('#projectNext').value = project?.next || '';
    $('#projectProgress').value = project?.progress ?? 0;
    $('#projectDeadline').value = project?.deadline || '';
    $('#projectNote').value = project?.note || '';
    $('#sheetTitle').textContent = project ? '更新项目' : '添加项目';
    $('#projectName').focus();
  }
}

function closeSheet() {
  $('#sheetBackdrop').hidden = true;
  document.body.style.overflow = '';
  $('#ideaForm').reset();
  lastFocus?.focus();
}

let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2000);
}

$('#addButton').addEventListener('click', () => openSheet());
$('#chooseIdea').addEventListener('click', () => openSheet('idea'));
$('#chooseProject').addEventListener('click', () => openSheet('project'));
$('#closeSheet').addEventListener('click', closeSheet);
document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', showChoice));
$('#sheetBackdrop').addEventListener('click', event => {
  if (event.target === $('#sheetBackdrop')) closeSheet();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#sheetBackdrop').hidden) closeSheet();
});

$('#ideaForm').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('#ideaText').value.trim();
  if (!text) return;
  state.ideas.unshift({ id: crypto.randomUUID(), text, status: '待判断', createdAt: new Date().toISOString() });
  persist();
  closeSheet();
  toast('灵感已记下');
});

$('#projectForm').addEventListener('submit', event => {
  event.preventDefault();
  const id = $('#projectId').value;
  const existing = state.projects.find(project => project.id === id);
  const fields = {
    name: $('#projectName').value.trim(),
    next: $('#projectNext').value.trim(),
    progress: Math.max(0, Math.min(100, Number($('#projectProgress').value) || 0)),
    deadline: $('#projectDeadline').value,
    note: $('#projectNote').value.trim()
  };
  if (!fields.name) return;
  if (existing) Object.assign(existing, fields);
  else state.projects.unshift({ id: crypto.randomUUID(), emoji: '✦', status: '进行中', milestones: [], ...fields });
  persist();
  closeSheet();
  toast(existing ? '项目已更新' : '项目已添加');
});

$('#projects').addEventListener('click', event => {
  const button = event.target.closest('[data-edit-project]');
  if (button) openSheet('project', state.projects.find(project => project.id === button.dataset.editProject));
});
$('#ideas').addEventListener('click', event => {
  const button = event.target.closest('[data-delete-idea]');
  if (!button) return;
  state.ideas = state.ideas.filter(idea => idea.id !== button.dataset.deleteIdea);
  persist();
  toast('灵感已删除');
});

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `board-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#importInput').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.projects) || !Array.isArray(data.ideas || [])) throw new Error('Invalid backup');
    state = normalize(data);
    persist();
    toast('备份已导入');
  } catch {
    toast('备份文件无法读取');
  }
  event.target.value = '';
});

(async () => {
  try {
    const saved = localStorage.getItem(KEY);
    state = normalize(saved ? JSON.parse(saved) : await fetch('data/board.json').then(response => response.json()));
  } catch {
    state = normalize(null);
  }
  render();
})();
