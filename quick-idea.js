(() => {
  const storageKey = 'personal-project-board-v1';
  const root = document.createElement('section');
  root.className = 'idea-inbox';
  root.setAttribute('aria-labelledby', 'ideaInboxTitle');
  root.innerHTML = `
    <div class="idea-inbox-head">
      <h2 id="ideaInboxTitle">灵感收件箱</h2>
      <span class="idea-count"></span>
    </div>
    <form class="idea-capture">
      <textarea aria-label="输入灵感" placeholder="想到什么就写什么……"></textarea>
      <button type="submit">记下来</button>
    </form>
    <div class="idea-items" aria-live="polite"></div>`;

  const header = document.querySelector('.top');
  if (header) header.after(root);
  else document.querySelector('main')?.prepend(root);

  const form = root.querySelector('form');
  const input = root.querySelector('textarea');
  const items = root.querySelector('.idea-items');
  const count = root.querySelector('.idea-count');

  function readData() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return saved && typeof saved === 'object' ? saved : { projects: [], ideas: [] };
    } catch {
      return { projects: [], ideas: [] };
    }
  }

  function writeData(data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  }

  function render() {
    const data = readData();
    data.ideas = Array.isArray(data.ideas) ? data.ideas : [];
    count.textContent = `${data.ideas.length} 条`;
    if (!data.ideas.length) {
      items.innerHTML = '<div class="idea-empty">还没有灵感。想到什么，先记下来。</div>';
      return;
    }
    items.innerHTML = data.ideas.map(idea => `
      <article class="idea-row">
        <div>
          <p class="idea-text">${escapeText(idea.text || '')}</p>
          <div class="idea-meta">${formatTime(idea.createdAt)}</div>
        </div>
        <button class="idea-delete" type="button" data-id="${escapeText(idea.id)}" aria-label="删除这条灵感">删除</button>
      </article>`).join('');
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return input.focus();
    const data = readData();
    data.ideas = Array.isArray(data.ideas) ? data.ideas : [];
    data.ideas.unshift({
      id: crypto.randomUUID(), text, status: '待判断', createdAt: new Date().toISOString()
    });
    writeData(data);
    input.value = '';
    render();
    input.focus();
  });

  input.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') form.requestSubmit();
  });

  items.addEventListener('click', event => {
    const button = event.target.closest('.idea-delete');
    if (!button) return;
    const data = readData();
    data.ideas = (data.ideas || []).filter(idea => idea.id !== button.dataset.id);
    writeData(data);
    render();
  });

  render();
})();
