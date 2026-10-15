// Barra superior comum: quem está conectado, link do log (Felipe/Fernanda) e sair.
(async () => {
  try {
    const r = await fetch('/api/me', { cache: 'no-store' });
    if (!r.ok) return;
    const me = await r.json();
    window.ALPHA_ME = me;
    document.dispatchEvent(new CustomEvent('alpha-me', { detail: me }));
    const bar = document.createElement('div');
    bar.className = 'alpha-topo';
    bar.innerHTML = `<span>Conectado como <b>${me.nome}</b></span>` +
      (me.admin ? ` · <a href="/log">Log de acessos</a>` : '') + ` · <a href="/logout">Sair</a>`;
    const st = document.createElement('style');
    st.textContent = '.alpha-topo{font:13px/1.4 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--mut,#6b7479);text-align:right;padding:8px 24px 0}.alpha-topo a{color:var(--navy,#2C4C57)}@media (max-width:760px){.alpha-topo{padding:8px 16px 0}}';
    document.head.appendChild(st);
    document.body.prepend(bar);
  } catch (e) {}
})();
