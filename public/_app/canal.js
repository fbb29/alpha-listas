// Código comum das listas: registro de canal (E-mail / WhatsApp), avisos por linha, correções de e-mail,
// nomes com acento, telefones e versão da página.
// Cada clique grava em "enviados" a chave <contato>#e:<e-mail> ou <contato>#w:<telefone>, com quem clicou e quando.
// Chaves sem "#" continuam sendo o "Feito"/"Enviado" da linha.
const css = `.reg{display:flex;flex-direction:column;gap:3px;margin-top:6px}
.mk{display:inline-flex;align-items:center;gap:6px;font-size:12px;line-height:1.3;padding:3px 4px 3px 8px;border-radius:6px;background:rgba(185,144,66,.13);color:var(--ink);width:fit-content;max-width:100%}
.mk.w{background:rgba(31,122,77,.13)}.mk b{font-weight:600}.mk .d{color:var(--mut);font-variant-numeric:tabular-nums}
.mk button{border:0;background:transparent;color:var(--mut);cursor:pointer;font-size:14px;line-height:1;padding:0 4px;border-radius:4px}.mk button:hover{color:var(--ink);background:rgba(0,0,0,.08)}
.mk.err{background:rgba(170,51,51,.14)}tr.tent td:first-child{box-shadow:inset 3px 0 0 var(--gold)}
.quem{min-width:150px;margin-top:4px}.quem .fe{color:#1f7a4d;font-weight:700;font-size:12px}.quem .fv{font-size:12px;color:var(--ink)}.quem .fq{display:block}
.av{margin-top:6px;display:flex;flex-direction:column;gap:3px}.av span{font-size:11.5px;line-height:1.35;color:#8a5a00;background:rgba(214,158,46,.14);border-radius:6px;padding:3px 8px;max-width:520px}
.av span.x{color:#a33;background:rgba(170,51,51,.12)}
@media (prefers-color-scheme:dark){.av span{color:#f0c36a}.av span.x{color:#f08a8a}}
#nova-versao{position:sticky;top:0;z-index:5;background:var(--gold);color:#14191b;text-align:center;padding:10px 16px;font-weight:600;font-size:14px}#nova-versao button{margin-left:10px;padding:5px 12px;border:0;border-radius:6px;background:#14191b;color:#fff;font-weight:600;cursor:pointer}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// Botões de e-mail (mailto): abrem o app de e-mail do computador (Mail), que põe a assinatura da conta.
// Em todo clique o texto do e-mail também vai para a área de transferência: se o Mail abrir em branco, é só colar (Cmd+V).
// Link muito longo (titular com muitos imóveis) costuma não abrir: nesse caso abre só com destinatário e assunto e o texto vai colado.
const LIMITE_MAILTO = 1900;
function aviso(txt) {
  let t = document.getElementById('aviso-mail');
  if (!t) { t = document.createElement('div'); t.id = 'aviso-mail';
    t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:50;max-width:min(560px,92vw);background:#1d2a30;color:#fff;padding:11px 16px;border-radius:9px;font:14px/1.4 -apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)';
    document.body.appendChild(t); }
  t.textContent = txt; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(() => { t.style.display = 'none'; }, 9000);
}
document.addEventListener('click', ev => {
  const a = ev.target.closest && ev.target.closest('a[href^="mailto:"]');
  if (!a) return;
  const href = a.getAttribute('href'), i = href.indexOf('&body=');
  if (i < 0) return;
  let corpo = '';
  try { corpo = decodeURIComponent(href.slice(i + 6).split('&')[0]).replace(/\r\n/g, '\n'); } catch (e) {}
  if (corpo && navigator.clipboard) navigator.clipboard.writeText(corpo).catch(() => {});
  if (href.length > LIMITE_MAILTO) {
    a.setAttribute('href', href.slice(0, i));                 // só destinatário e assunto
    setTimeout(() => a.setAttribute('href', href), 1500);
    aviso('E-mail longo: o Mail abre só com destinatário e assunto. O texto já está copiado — clique no corpo do e-mail e cole (Cmd+V).');
  } else {
    aviso('Abrindo no Mail. O texto também foi copiado: se o e-mail abrir em branco, cole no corpo (Cmd+V).');
  }
}, true);

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const quando = ts => { try { return new Date(ts).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ''); } catch (e) { return ''; } };
// busca sem acento e sem maiúsculas
export const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// mesmo hash do servidor (FNV-1a, 30 bits, 5 caracteres): chave dos avisos por linha
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export function h30(s) {
  let x = 0x811c9dc5;
  for (const b of new TextEncoder().encode(String(s))) x = Math.imul(x ^ b, 0x01000193) >>> 0;
  x >>>= 2; let o = '';
  for (const k of [4, 3, 2, 1, 0]) o += B64[(x >>> (6 * k)) & 63];
  return o;
}

// ---------- avisos da auditoria (data/avisos.bin): correções de e-mail, alertas por linha, linhas ocultas ----------
let AV = { corr: {}, avisos: {}, ocultar: {} };
export async function carregarAvisos() {
  try {
    const r = await fetch('/data/avisos.bin', { cache: 'no-store' });
    if (!r.ok) return AV;
    const buf = new Uint8Array(await r.arrayBuffer());
    const txt = (buf[0] === 0x1f && buf[1] === 0x8b) ? await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text() : new TextDecoder().decode(buf);
    AV = Object.assign(AV, JSON.parse(txt));
  } catch (e) {}
  return AV;
}
// e-mails da linha já corrigidos (erro de digitação na base) e sem repetição
export function corrigir(lista) {
  const out = [];
  for (const e of lista) {
    if (!e) continue;
    const c = AV.corr[String(e).trim().toLowerCase()];
    for (const x of (c || [String(e).trim()])) if (x && !out.some(y => y.toLowerCase() === x.toLowerCase())) out.push(x);
  }
  return out;
}
export const avisosDe = (lista, chave) => (AV.avisos[lista] || {})[h30(chave)] || [];
export const oculto = (lista, chave) => (AV.ocultar[lista] || []).includes(h30(chave));
export const htmlAvisos = l => l.length ? '<div class="av">' + l.map(t => `<span${/retirado|respondeu|conferir|não abordar/.test(t) ? ' class="x"' : ''}>${esc(t)}</span>`).join('') + '</div>' : '';

// ---------- nomes: acentos e partículas (a base da SPU vem sem acento e em caixa alta) ----------
const AC = {jose:'José',joao:'João',antonio:'Antônio',antonia:'Antônia',sergio:'Sérgio',marcio:'Márcio',marcia:'Márcia',flavio:'Flávio',flavia:'Flávia',fabio:'Fábio',fabiola:'Fabíola',andre:'André',andrea:'Andréa',monica:'Mônica',patricia:'Patrícia',lucia:'Lúcia',lucio:'Lúcio',vania:'Vânia',claudia:'Cláudia',claudio:'Cláudio',julio:'Júlio',julia:'Júlia',rogerio:'Rogério',mario:'Mário',vinicius:'Vinícius',celia:'Célia',silvia:'Sílvia',sonia:'Sônia',helio:'Hélio',otavio:'Otávio',angela:'Ângela',debora:'Débora',barbara:'Bárbara',cecilia:'Cecília',emilia:'Emília',fatima:'Fátima',gloria:'Glória',ines:'Inês',mauricio:'Maurício',inacio:'Inácio',tarcisio:'Tarcísio',vitoria:'Vitória',valeria:'Valéria',cesar:'César',tania:'Tânia',lidia:'Lídia',regis:'Régis',aurelio:'Aurélio',eugenio:'Eugênio',rosangela:'Rosângela',angelica:'Angélica',veronica:'Verônica',jessica:'Jéssica',erica:'Érica',leticia:'Letícia',marilia:'Marília',natalia:'Natália',eloisa:'Eloísa',heloisa:'Heloísa',luisa:'Luísa',jeronimo:'Jerônimo',rosario:'Rosário',anisio:'Anísio',horacio:'Horácio',nazare:'Nazaré',alcantara:'Alcântara',lazaro:'Lázaro',lucilia:'Lucília',simoes:'Simões',goncalves:'Gonçalves',goncalo:'Gonçalo',conceicao:'Conceição',assuncao:'Assunção',araujo:'Araújo',guimaraes:'Guimarães',magalhaes:'Magalhães',damiao:'Damião',sebastiao:'Sebastião',estevao:'Estêvão',romao:'Romão',leao:'Leão',brandao:'Brandão',falcao:'Falcão',galvao:'Galvão',aragao:'Aragão',mourao:'Mourão',simao:'Simão',abraao:'Abraão',mendonca:'Mendonça',lourenco:'Lourenço',braganca:'Bragança',tome:'Tomé',bras:'Brás',fernao:'Fernão',sao:'São',agua:'Água',
participacoes:'Participações',participacao:'Participação',administracao:'Administração',comercio:'Comércio',incorporacoes:'Incorporações',incorporacao:'Incorporação',construcoes:'Construções',construcao:'Construção',servicos:'Serviços',industria:'Indústria',industrias:'Indústrias',agricola:'Agrícola',imoveis:'Imóveis',imovel:'Imóvel',imobiliaria:'Imobiliária',imobiliarios:'Imobiliários',imobiliario:'Imobiliário',imobiliarias:'Imobiliárias',proprios:'Próprios',locacao:'Locação',locacoes:'Locações',representacoes:'Representações',representacao:'Representação',distribuicao:'Distribuição',importacao:'Importação',exportacao:'Exportação',comunicacao:'Comunicação',tecnica:'Técnica',eletrica:'Elétrica',mecanica:'Mecânica',quimica:'Química',farmaceutica:'Farmacêutica',gestao:'Gestão',seguranca:'Segurança',intermediacoes:'Intermediações',intermediacao:'Intermediação',negocios:'Negócios',patrimonio:'Patrimônio',solucoes:'Soluções',informatica:'Informática',logistica:'Logística',previdencia:'Previdência',fundacao:'Fundação',associacao:'Associação',educacao:'Educação',saude:'Saúde',organizacao:'Organização',producoes:'Produções',promocoes:'Promoções',agropecuaria:'Agropecuária',financas:'Finanças',recuperacao:'Recuperação',edificacoes:'Edificações',suplementacao:'Suplementação',agencia:'Agência',metalurgica:'Metalúrgica',ceramica:'Cerâmica',laboratorios:'Laboratórios',laboratorio:'Laboratório',eletronica:'Eletrônica',automoveis:'Automóveis',veiculos:'Veículos',maquinas:'Máquinas',aluminio:'Alumínio',pecas:'Peças',otica:'Ótica',grafica:'Gráfica',contabil:'Contábil',frigorifico:'Frigorífico',residencia:'Residência',familia:'Família',espolio:'Espólio',condominio:'Condomínio',inspecoes:'Inspeções',purificacao:'Purificação',prestacao:'Prestação'};
const MIN = new Set(['de','da','do','das','dos','e','em','na','no','para','com']);
const SIG = {ltda:'Ltda',me:'ME',epp:'EPP',eireli:'Eireli',spe:'SPE',sa:'S.A.','s/a':'S/A',cia:'Cia.',ii:'II',iii:'III',iv:'IV'};
export function nomeBR(s) {
  const w = String(s ?? '').trim().replace(/\s+/g, ' ').split(' ');
  const out = w.map((p, i) => {
    const l = p.toLowerCase(), b = norm(p), fim = i === w.length - 1;
    if (i > 0 && l === 's' && fim === false && w[i + 1].toLowerCase() === 'a' && i + 2 === w.length) return 'S.A.';
    if (i > 0 && l === 'a' && fim && w[i - 1].toLowerCase() === 's') return '';
    if (i > 0 && MIN.has(l)) return l;
    if (i > 0 && SIG[l]) return SIG[l];
    if (AC[b] && l === b) return AC[b];
    return l.charAt(0).toUpperCase() + l.slice(1);
  });
  return out.filter(Boolean).join(' ');
}

// ---------- telefones ----------
// devolve { wa: '55DDDNÚMERO' ou null, fmt, antigo }. Celular antigo de 8 dígitos (começa com 6-9) ganha o 9.
export function fone(t) {
  let d = String(t ?? '').replace(/\D/g, '');
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d[0] === '0' && (d.length === 11 || d.length === 12)) d = d.slice(1);
  let antigo = false;
  if (d.length === 10 && '6789'.includes(d[2])) { d = d.slice(0, 2) + '9' + d.slice(2); antigo = true; }
  if (d.length === 11 && d[2] === '9') return { wa: '55' + d, fmt: `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`, antigo };
  if (d.length === 10) return { wa: null, fmt: `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`, antigo };
  return { wa: null, fmt: d ? String(t).trim() : '', antigo };
}

// ---------- marcas de canal ----------
// mapa {chave:{u,ts}} -> {contato:[{c,canal,alvo,u,ts}]}
export function marcas(s) {
  const m = {};
  for (const [c, v] of Object.entries(s || {})) {
    const i = c.indexOf('#'); if (i < 0) continue;
    const resto = c.slice(i + 1);
    (m[c.slice(0, i)] ||= []).push({ c, canal: resto[0], alvo: resto.slice(2), u: v.u, ts: v.ts });
  }
  for (const k in m) m[k].sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  return m;
}

// pode(x) diz se quem está usando pode remover o registro (o próprio autor ou admin)
export function htmlMarcas(lst, nomeU, fmtAlvo = x => x, pode = () => true) {
  if (!lst || !lst.length) return '';
  return lst.map(x => `<span class="mk ${x.canal === 'w' ? 'w' : 'e'}${x.err ? ' err' : ''}"><span><b>${x.canal === 'w' ? 'WhatsApp' : 'E-mail'}</b> ${esc(fmtAlvo(x.alvo, x.canal))} · ${esc(nomeU(x.u))} · <span class="d">${x.err ? esc(typeof x.err === 'string' ? x.err : 'não registrou, clique de novo') : esc(quando(x.ts))}</span></span>` +
    (x.err || !pode(x) ? '' : `<button type="button" data-c="${esc(x.c)}" title="Remover este registro" aria-label="Remover este registro">×</button>`) + `</span>`).join('');
}

async function resposta(r) {
  versao(r);
  return r.ok ? { ok: true, status: r.status } : { ok: false, status: r.status, erro: (await r.json().catch(() => ({}))).erro || '' };
}
// grava o clique (log + canal). Devolve { ok, status, erro }; status 0 = falha de rede.
export async function registrarClique({ lista, chave, evento, alvo, detalhe }) {
  try {
    return await resposta(await fetch('/api/evento', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ evento, detalhe, caminho: location.pathname + location.search, lista, chave, alvo }) }));
  } catch (e) { return { ok: false, status: 0, erro: '' }; }
}
// marca/desmarca "Enviado"/"Feito" ou remove um registro de canal. Devolve { ok, status, erro }.
export async function marcar(lista, chave, on) {
  try {
    return await resposta(await fetch(`/api/enviados?lista=${encodeURIComponent(lista)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chave, on }) }));
  } catch (e) { return { ok: false, status: 0, erro: '' }; }
}

// estado local x leitura periódica: o que a pessoa acabou de marcar não some se a leitura chegar antes da gravação
export function pendentes() {
  const p = {};
  return {
    set(k, v) { p[k] = { v, t: Date.now() }; },
    aplicar(s) { const agora = Date.now(); for (const [k, x] of Object.entries(p)) { if (agora - x.t > 90000) { delete p[k]; continue; } if (x.v) s[k] = x.v; else delete s[k]; } return s; },
  };
}

// versão da página: o servidor manda x-app-v; se for outra, aparece uma faixa pedindo para recarregar.
export const VERSAO = '2026-10-15e';
export function versao(r) {
  const v = r && r.headers && r.headers.get('x-app-v');
  if (!v || v === VERSAO || document.getElementById('nova-versao')) return;
  const d = document.createElement('div'); d.id = 'nova-versao';
  d.innerHTML = 'Esta página foi atualizada. <button type="button">Recarregar agora</button>';
  d.querySelector('button').onclick = () => location.reload();
  document.body.prepend(d);
}

// coluna "Enviado"/"Feito": rótulo, canal (pelos cliques de quem marcou), quem e quando.
export function htmlFeito(v, lst, nomeU, rotulo = 'Enviado') {
  if (!v) return '';
  const meus = (lst || []).filter(x => !x.err && x.u === v.u), base = meus.length ? meus : (lst || []).filter(x => !x.err);
  const c = new Set(base.map(x => x.canal));
  const via = c.has('e') && c.has('w') ? 'por e-mail e WhatsApp' : c.has('w') ? 'por WhatsApp' : c.has('e') ? 'por e-mail' : 'canal não registrado';
  return `<b class="fe">${esc(rotulo)}</b> <span class="fv">${via}</span><span class="fq">${esc(nomeU(v.u))}${v.ts ? ' · ' + esc(quando(v.ts)) : ''}</span>`;
}

// ---------- observação por linha (salva no servidor, visível para a equipe) ----------
const cssObs = `.obs{margin-top:8px;min-width:170px}.obs textarea{width:100%;min-height:44px;padding:5px 7px;border:1px solid var(--line);border-radius:7px;background:var(--bg);color:var(--ink);font:12.5px/1.35 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;resize:vertical}
.obs .ln{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:3px;font-size:11px;color:var(--mut)}
.obs button{border:0;background:var(--navy);color:#fff;border-radius:6px;padding:3px 9px;font-size:11.5px;font-weight:600;cursor:pointer}.obs button:disabled{opacity:.3;cursor:default}
@media (prefers-color-scheme:dark){.obs button{color:#14191b}}`;
const st2 = document.createElement('style'); st2.textContent = cssObs; document.head.appendChild(st2);
export const htmlObs = () => '<div class="obs"><textarea placeholder="Observação" aria-label="Observação"></textarea><div class="ln"><span class="om"></span><button type="button" disabled>Salvar</button></div></div>';
// liga as caixas de observação de cada <tr data-k> da tabela; busca as observações a cada minuto sem apagar o que está sendo escrito
export function ligarObs(lista, trs, nomeU) {
  let o = {};
  const pintar = () => trs.forEach(tr => {
    const ta = tr.querySelector('.obs textarea'); if (!ta || tr.dataset.obsSujo === '1') return;
    const x = o[tr.dataset.k]; ta.value = x ? x.t : ''; tr.dataset.obsSalvo = ta.value;
    tr.querySelector('.obs .om').textContent = x ? `${nomeU(x.u)} · ${quando(x.ts)}` : '';
  });
  const ler = async () => { try { const r = await fetch(`/api/obs?lista=${encodeURIComponent(lista)}`, { cache: 'no-store' }); versao(r); if (r.ok) { o = await r.json(); pintar(); } } catch (e) {} };
  trs.forEach(tr => {
    const ta = tr.querySelector('.obs textarea'), bt = tr.querySelector('.obs button'), om = tr.querySelector('.obs .om'); if (!ta) return;
    tr.dataset.obsSalvo = '';
    ta.addEventListener('input', () => { const sujo = ta.value !== tr.dataset.obsSalvo; bt.disabled = !sujo; tr.dataset.obsSujo = sujo ? '1' : ''; });
    bt.addEventListener('click', async () => {
      bt.disabled = true; om.textContent = 'salvando…';
      try {
        const r = await fetch(`/api/obs?lista=${encodeURIComponent(lista)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chave: tr.dataset.k, texto: ta.value }) });
        versao(r); const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.erro || ('erro ' + r.status));
        tr.dataset.obsSalvo = ta.value; tr.dataset.obsSujo = '';
        if (ta.value.trim()) o[tr.dataset.k] = { t: ta.value, u: j.u, ts: new Date().toISOString() }; else delete o[tr.dataset.k];
        om.textContent = ta.value.trim() ? `${nomeU(j.u)} · salvo agora` : 'apagada';
      } catch (e) { bt.disabled = false; om.textContent = ''; alert('Não salvou a observação: ' + e.message); }
    });
  });
  ler(); setInterval(ler, 60000);
}
