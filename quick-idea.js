(() => {
  const key = 'personal-project-board-v1';
  const button = document.createElement('button');
  button.id = 'quick-idea-trigger';
  button.type = 'button';
  button.textContent = '＋ 记个想法';
  const layer = document.createElement('div');
  layer.className = 'quick-idea-layer';
  layer.innerHTML = `<section class="quick-idea-sheet" role="dialog" aria-modal="true" aria-labelledby="quickIdeaTitle"><h2 id="quickIdeaTitle">记个想法</h2><p>一句话就够了，先记下，不用整理。</p><textarea autofocus placeholder="比如：给 CRM 增加老顾客生日提醒"></textarea><div class="quick-idea-actions"><button type="button" class="cancel">取消</button><button type="button" class="save">保存想法</button></div></section>`;
  document.body.append(button, layer);
  const input = layer.querySelector('textarea');
  const close = () => { layer.classList.remove('open'); input.value = ''; };
  button.onclick = () => { layer.classList.add('open'); setTimeout(() => input.focus(), 0); };
  layer.onclick = event => { if (event.target === layer) close(); };
  layer.querySelector('.cancel').onclick = close;
  layer.querySelector('.save').onclick = () => {
    const text = input.value.trim();
    if (!text) return input.focus();
    let data;
    try { data = JSON.parse(localStorage.getItem(key)) || { projects: [], ideas: [] }; } catch { data = { projects: [], ideas: [] }; }
    data.ideas = Array.isArray(data.ideas) ? data.ideas : [];
    data.ideas.unshift({ id: crypto.randomUUID(), text, status: '待判断', createdAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(data));
    close();
    button.textContent = '已记下 ✓';
    setTimeout(() => { button.textContent = '＋ 记个想法'; }, 1600);
  };
  input.onkeydown = event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') layer.querySelector('.save').click(); };
})();
