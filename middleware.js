// Alpha Soluções · Listas — acesso privado por usuário + senha, com log de acessos geolocalizado.
// Tudo passa por aqui: páginas, dados e API. Sem cookie válido, nada é servido.
//
// Variáveis de ambiente (Vercel → Settings → Environment Variables):
//   SITE_PASSWORD      senha única de acesso
//   AUTH_SECRET        segredo que assina o cookie de sessão (trocar = derruba todas as sessões)
//   SUPABASE_URL       https://<ref>.supabase.co
//   SUPABASE_ANON_KEY  chave anon (pública) do projeto
//   LOG_TOKEN          token exigido pelas funções alpha_* no Supabase

export const config = { matcher: '/:path*' };

const USERS = {
  felipe:   { nome: 'Felipe',   admin: true },
  fernanda: { nome: 'Fernanda', admin: true },
  kely:     { nome: 'Kely',     admin: false },
  lucas:    { nome: 'Lucas Santos',   admin: false },
  lucash:   { nome: 'Lucas Henrique', admin: false },
};
// clique em E-mail/WhatsApp numa lista: além do log, grava o canal em "enviados" com a chave <contato>#<canal>:<destino>
const CANAL = { abriu_email: 'e', abriu_email_2: 'e', whatsapp: 'w' };
const STATUS_FCL = ['novo', 'em_contato', 'respondeu', 'proposta', 'fechado', 'descartado'];
const SESSAO_DIAS = 365;
const COOKIE = 'al_s';
const COOKIE_USER = 'al_u';
const EVENTOS_OK = new Set(['abriu_email', 'abriu_email_2', 'whatsapp', 'marcou_enviado', 'desmarcou_enviado']);

// versão das páginas: muda a cada publicação. A página compara com o cabeçalho x-app-v e pede para recarregar quando estiver velha.
const VERSAO = '2026-10-15e';

// ---------- divisão da lista de foro (14/10): cada contato pertence a uma pessoa ----------
// Para cada pessoa, o hash FNV-1a (30 bits, 5 caracteres) do e-mail-chave dos contatos da sua lista (gerado de data/foro-email1).
// Quem não é admin só registra envio/contato nos contatos da própria lista, mesmo com uma página velha aberta.
const DONO_FORO = {"kely":"-6aKX-PRFc-dZ5Q-iZsg-sD0V0-RUm0ByO10KySz0Sqwe0WzqU0bRF20mo9b0q4Wi0qggp0sBCL0z3GG1-_u-14Kg2156Yp15CrO1N3RJ1ZU9h1fYuE1nTmv1v6SX1yk9K21WPq22l9l29x1b2BSh42S4gj2Vu-32YwvO2j7i22vKCY2wEsc3-C0-3A_sG3VLSk3ZmyX3dYO53kOnU4TEyA4Twxf4W7JM4oHyz4qRtw4qun_5DNd75Dzut5NQqS5Owm95XK3U5ZCzx5ghay5wmpn69c7A6Nvy16Vo4X6eDQ26gy3W6hVlu6hlrh79XS17rb2W7yBZO7yLMA87CF-88dOo8Mhte8fNWn8jhFZ8xkwl9Kelx9YwTT9fUo79saSR9wQ9Q9zMe9ADhhbA_GwZAelq6AhSeEAkMIkAplQIAvu8oB4UHyBF4K5BJmo4BenlQBunuBCKGpICLyR9CYNBUCbHyhCmf2iCqhFiCyxWrDFS5JDLXz4DS7upDTQBFDY3DxDZBTdDhBDEDnlJaDteNLE-TdYE23dnEDv7DEOW6IEOXSKEPr6NEZKUUEkmr8FXqeIFkQPyFnh40FuH3oGA9WuGDLk7GDmCEGFwc6GW5ykGlsqcHBsKEHC8S-Hb7CJHcg1vHno4XHoCRFIAs1-IL_ONIQHHLIc60qJ6DVFJ8U92J92cqJOZf7JYCxSJfeDtJrDF2KHUm6KWDpPKWNMVKaNNdL8fH7LEvWkLG7TyLQkmyLjxR3LqMNyLrWeULuL2yM-TilM3-VcM6QW5MAnyHMDNb_MDjQ0MHn11MN6O1MTCM1MecdFMpjKONNkqpNZxPTNi6_FNsVTrNyVBYO39JEO98JnOBH8OOPdnUOV-S4OnxCaOo033PJfYFPPEmXP_zZgPamVeQF8deQGp6NQKfnFQizMFREqiBRNI_ORi8N3Rm7sbRux1DSFC3fSFGVLS_P-0SiMd4T-bKbT7jtpTHjqmTUdn4TdkpKTl96UU6yrbUGY-jUIPHcULxabUPJK_Ue9AbUfg68UgrRGUhAJXUwSwkV2qmuVJlRGVNTLcVSTn2VTqsxVU9d5Vf6vhVpzYgWJgydWV9RnWcRQMWixocWzQRDX346oXC3bpXOGyvXQLpyXY-BhXiDulXqVhsY-POeY9eMaYAQQ7YCQeKYLT43YOF_gYQfJQYTAUaYlSHYZMoOq_FP7__IltF_PZVa_RQY__TMcX_nK99_ohSN_st1U_uWev_vLlca86SLa9AgXaN7mOaRVlNa_Z_1bJJVJbO-q8bTCC8b_XO6bfVvzbjCTnbqxiec3g7Qc4M3kcQgghcdsTFcgu1dd5aqMdBrXkdC4hkdPmK1ddQpKddb9Zdm7SEe-mLte07AreJMTyeUdNRer8BTexHqHf2_ryfI8UEfP9aqft8V1gFes_gTOangVnW4ggpdegmuJMgtFG6gzzvKhCtWZhUwkyhiVaxho0Eni-pOTi4Mg7i8iRxiNL36iR7-8iSrj6isdG9j8AeEjT3lAjYxuLj_5lmj_BqbjggQ7jsWPqjzE7gk03xek4wyukEeqpkK-DLkLzZNkNtGdkQTzzkV3HGk_RxMkfEM1klH_akyjtXkzU3ol-VMDlImt2lNMiYlWB6clZjUllnaN0lx0lKm1fEnm3dnhmCRBkmCwSHmO-oEmW8V5mZN3Zmmwt_msX3_n2J34nDzyOniQEqnnci1o-Xv6o4nKYo8IOWoC5j6oCiqWoUQYjp1fzZp7yMOp8axTpHJClpRoG7pXR39paUwgpf3acq0Ce0q0yRaq749dqAwH_qObc0qmUcWqmZNAqsLRGr6SLkreoWFriKYMrmO1Aru_12s1L_us8XhBsAADDsIOf9sPAC4sdGB5sqjCft2hk7tBiSNtKt4ktN3j9tNd1htkjcVtxqGTuC8cfuCcIuuMKk4uVyZjuouKFuuy0ev1OMGv1vDMvC6eVvNI1hvlqL9w-OFHw6GqRw8n5KwC-tIwJT8nwfWzZwmSxOx14SFx9vhYxALzIxEGkExIMwUxL0cPxMRttxjRn_xvWLYyLP0NyLg3lyMhR4yTfUJyw0-fz1IFHzGWZjzYjijzdOKCzjdCU","lucas":"-ef1q-oUG3-pFcN-wrJ00CeXT0Tors0vUsq0zPad10SZe1AsYj1IC3k1NLYv1enpI1xty826T7F27oZe2jNGm30QnT37N2G399pM3Db4E3Gxl-3O5sF3VKix3dHFt3eA563hJ503hRQA3hrJO3lLg73pLf03qxbC45PWj46ygf4BfEv4RICw4U4UQ4ZhDl4iaCI4oIhy4uUe54vn4W4xwY7513l15EfkZ5LKXC5a9uM5nSLb5yHrl5zdCo6ftit7PMFY7n2Ed7w6wu7xszD8Xpx98YK5h8eg9v8lEIZ8lWTN8nOyP8p8XG8pifD8sN5P8yift90I5O99cP39Bf679EW3t9T4fp9X2JY9n5St9zdBIAQCvuAW3N7B6WmhBEkWQBahDUBfQ68BuRo4C-UBQCWjqbCbruaCfEHeCn5giCscPuCyXcEDFNp0DVojmDhZs5Dr54rDzxxFEGqTTEbMmdEc-k1F9CLIFDxN2FaMofFj14JFz-0AG8LMNGK_g5GX77rGd7fFGeX20GnSlOGzl2OHFhBzHGVsuHJHbOHNrscHP97RHTl41HZn9JHf8OmHjreyHkYfWHl-JKHmou-HrrvSI1_BwI5svPI8_PbIGIGHIRVKEIUJ3KJ2mYyJKNsxJUvmvJ_Gr_K36lLKEcEeKFbvUKPSHkKVL48KY5PcKachCKcwhnKmX7bKpQ6BKxYsuL0STzLC23RLNhByLVs5JLWfEjLjIJCLl39mLlP_nLux4XM5VgyM7yu-MBVlbMEWoJMSS10MWUqUMkbHeN1lCXN2mY4N3f3LN9sTFNeTxeNixYQNk4C5NmqSYNrhpJOXj66OmP5wOsTtBP7g6PP9h-fPBvnLPGDSnPVga9Q-XPOQ1wtGQLP8yQYtA3QijH5QjWwbQzqr9R1dutRMAcPRU2DtRVWGgRfQPNRjVzdRmPeIRpWcaRwVHYS2CPGS39pOSES4zSMzG1Sd9mPSk27TSskf2SwAeZTBPcITFQ3rTIJ9sTKq2eTdERKTjyOrTzTbHU2EN6U9hUNUHCJ6UM2YHUPewXUTtvEU_Rb7Uf_-yUjJuvUmSLEUmvdjUpMpAUtgW8Utk33UyeGjV-P_qV32wsVBKAAVnzmEVqkM5Vu6DrVyqA-W3aXcWCYynWJKkKWLMPGWwbCHX-C_eX33DKXIlK4XM6PrXO6hpXPa-bXf2nrXn60OXnJc6Y0xOyY7ZE7YDqpRYFfkPYIZtRYSulaYWepQYbke-YyIRyZ1R9mZEvbIZJa1-ZNj10ZYj9gZZ3apZbtTLZgTNQZxVRb_1Lfm_6vbw_OKkR_emWl_yLt0aD7gnaKAfIaUJKmafPJgauxGGb9QEAc0Ah8cC9excPEm0cXqZicjF9Cd8nVldFOntdLL-tdYHP3d_pT8da1ridd9nMdgZ3sdm8BqdvAYAdxV3Kdyni9eB-5xeCdOaeI5dMeMcLjelaC7eo0ndf7XtsfFuDnfbo-Rfcls6fff4Effv01fyZm9g1Hv_gB0jTgC7c8gPzebgbjEugeB11gyqbWh4QFThBnjIhEaIxhJZ08hMcHqhYGNXhZcDXhavnyhm1L7iONxsiPe61iecsdirQOXjLDfLjcZQljhjjskIwCMkQgT-kRmnnkTcAokYgSskZuUgkiN-3l1lzZl8ObFlBBHMlJVv8lTM2tlbdBElu38jm-hcSm09-4m5VqCmRHm3mW4oemXf2vma2pbn3UuznU0V4nY_hOnf-ymnmcqzo1ypWo5pvvoVf2Gob6L7odQtQoh5gtosAwNp-CMIp1Kg7p4DSmpKUAZpiZ9DpnKVlq2plUqHgUXqfchvqfw4oqvIMFr8De7r8x_srNYdKrmMOfrrU7qrywBbs8R6csGGzcsNyOJsWJ7isYCWjszXpCt3wHTtE5O5tOo-etsCcStx8zfu6t05uKLBsulY1Yuopu0usT_quskfgv2UhNvFzCnvcG0eveIDPvuFx5vyy_kw4-oSwYOnMwpPDhwrGJ5wytkox6Mvyx6TZfxB4J8xN8O-xb14wxc3ctxgofHy4690yD22tyFycUyZFAeytIBvz4Pl6z5JVNzIiGSzJQnDzWsMVzXB3tzeTN0zkjnh","lucash":"--auM-90c3-IUE3-Wy2e-Y-fa-eby5-nPD6-sE-S-vlms04zw608lWv0AFPN0FMgM14pjD1HZVb1JB6o1_I9_1rCqN1staz1zYDB2GoqH2H05f2QStN2Rnkk2mW3n2tmke3LxE83MH2Y3dkZn3qSYs3sui83tgyG3tjJ5470PV4PErm4q0Kv4rhDu4sP-m4tDXn4yrWT5J2pG5Kdnu5SOS95ZR075a5SB5gyoC5pPXl5vtEg6dsxi6j85n6nneC6tJ2y6x2RF7U-ZN7id6Q7mhsW7q1Sn7u61e7ulsZ81oXV832iz8GLZl8IDOy8TNh68yPeW8yeZU90YkL912yU9L0tt9QncI9bFP99mXFZ9pIovA0V7aA0zGWAJ0UlAQy8ZB2gW3BIz8ZBJYzcBYtDxBeq6SBlJW1BwnVdC5tGMCCs67CKnbqCZapzCaUFjCzvcJD9XfSDxSzqEBPyeENi9OETADFETI5TEUZnMEbMZSEgJjDEi5hAElYNBEoKezEqZxiFMknQFwEaIG31GZGHhP2GO9MsGgRxtGoZrtHDFQiHHnY4HWbEIHZkGqHlFunHnPhJHtRdkHzWjVI1BnhI3QEZI4PbxI8BAUIcwxTIpoTTJ2HrWJBQ9VJEpqNJLAPuJSY4FJWSIvJmOo7Jx8jZKRzVlKtTo_Kz1M_LJ9GZLOj_yLSaZDMLh9FMQkqbMlefAN7sy2N9DGlNC7-YNN2WgNXaveNuOc5O-bwIO27CcOUyzAOeqzFOfMMiOhi32OkAO-OqDolP3NcSP5bF2P6bBPPOV2hPTggWPVomaPeHM_PtkdqQ7bR_Q9GP4Q9IkeQPiQLQgIUmQnWAxR5DRKRAC4mRXnyhRZ6P4RolKBS1UVaSCwHmSXWuZSdRnkShCAeSkSbVSmSUMSmtPbSqb7pT8p6vTBnuETIFgeTSfsjTW3tpT_M7CT_Y1ZTiWNVU66hJUM0reUb1OKUebTmUjo5GUnG1yV1mRUVHZENVOynMVSrNXVWmAwVg-zFVmKwBVr3lrVvFatVwLCTVyG5bWAEJdWNS6FWT5qGW_Sw8WcHXIWcrTqWscGjWvh0fX5n21X5znRX6Io2X87ifXCUViXIJgaXKK5DXQEd2XjGNAXr91dXrqfLY-dYRYM1s2YQ54MYVSodYVvjZYjvWHYlUniYlrNwYm8O8YplGtZ9OFeZBF08ZLtCKZRBsrZiReqZslU8ZyKhs_0G4J_B6Q7_Ex8u_kohA_rch-_tM2La5AyFaK4EuaLjiPaObyqaece3ahcObaknOiaswp0b0hdRb7DOJbDpfxbVINTbgqkycGTfncMcTXcVKIgcc-yVcdUnwcewh8crSqbcsmQqd5Mz9dLvZhdOH-IdORI0dQlzoda4iedg8sFdjAhldnIfBdo-yUe-UCYeKdgdeQEpqeTwLYeVXC1eYrygemiRhf2iX_f7vJuf83gvfAPzrfAUEmfAqv6fWTRDfdk6DfoVd6foxe0g1TXygOh83gXru3gd5yDgoVsBgupPUh-nEbhDfIHhFExZhNBPOhQ_4VhfO6ehhFryiZp2Uj6_HgjVcCAjh6IXjkSuTjlsY3joDg5jsOYcjxbsbkB909kC6Q8kDd29kG47OkKPmLkg-fWkouZoktU7KkuTLyl-8oyl9bQIlI5mrlQ_INlRkiYltSO8mGFI-mHUAEmKqDUmiunxmlIsymw5KIncFMhny7oNoV2CpoWXfeocrQPoib97p1sl1pDHXgpE8sLpFBH5pM-QxpYETIpf7ZFpfiuQpsUPdq-Ibdq0-laq4Bu-q7PRhq8vsnqBBL9qQQrkqVQ4LqYGlUqYbVzqxLWgrCBilrJjZnrKM1JrUP2ks7Y8asGOXHsJnGQsNy0rsVCjVsbOnJseN3gsjNHntO8XPtagJ6ts0XytuQPntzUk8u3U5buVkPCuc6Cyug3pPux205v-3gDvF-ABvdZ03vm1PXvwExpvz3eqwGLHCwKd3LwSs9lwTY1wwbgPswkYgpwqnWcxWw9TxYNldxYgV-xm1x_xrfPLxvIU-y7CzpyBL18yEwZsyPP3WyQ_GKyXdQrz4I6ozEosFzJTADzOEXuzjjWHzkay_zowVN"};
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
let mapaForo = null;
function h30(s) {
  let x = 0x811c9dc5;
  for (const b of new TextEncoder().encode(s)) x = Math.imul(x ^ b, 0x01000193) >>> 0;
  x >>>= 2;
  let o = '';
  for (const k of [4, 3, 2, 1, 0]) o += B64[(x >>> (6 * k)) & 63];
  return o;
}
function donoForo(chave) {
  if (!mapaForo) {
    mapaForo = new Map();
    for (const [u, s] of Object.entries(DONO_FORO)) for (let i = 0; i < s.length; i += 5) mapaForo.set(s.slice(i, i + 5), u);
  }
  return mapaForo.get(h30(String(chave).split('#')[0])) || '';
}
function bloqueio(user, lista, chave) {
  if (user.admin || lista !== 'foro-email1') return '';
  const d = donoForo(chave);
  if (d === user.id) return '';
  return d ? `Este contato é da lista de ${USERS[d].nome}. Recarregue a página para ver a sua lista.` : 'Este contato não está em nenhuma lista. Recarregue a página.';
}

const enc = new TextEncoder();
const env = (k) => (typeof process !== 'undefined' && process.env ? process.env[k] : undefined);

// ---------- utilidades ----------
function b64u(buf) {
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function assinar(msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(env('AUTH_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
function iguais(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function cookies(req) {
  const out = {};
  (req.headers.get('cookie') || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) { try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) {} }
  });
  return out;
}
async function sessao(req) {
  const v = cookies(req)[COOKIE];
  if (!v) return null;
  const [u, exp, sig] = v.split('.');
  if (!u || !exp || !sig || !USERS[u]) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  if (!iguais(sig, await assinar(`${u}.${exp}`))) return null;
  return { id: u, ...USERS[u] };
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function geo(req) {
  const h = (k) => req.headers.get(k) || '';
  let cidade = h('x-vercel-ip-city');
  try { cidade = decodeURIComponent(cidade); } catch (e) {}
  return {
    ip: h('x-real-ip') || (h('x-forwarded-for').split(',')[0] || '').trim(),
    cidade, regiao: h('x-vercel-ip-country-region'), pais: h('x-vercel-ip-country'),
    cep: h('x-vercel-ip-postal-code'), lat: h('x-vercel-ip-latitude'), lon: h('x-vercel-ip-longitude'),
    ua: h('user-agent'),
  };
}
async function rpc(fn, args) {
  const url = env('SUPABASE_URL'), key = env('SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Supabase não configurado');
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_token: env('LOG_TOKEN'), ...args }),
  });
  if (!r.ok) throw new Error(`Supabase ${fn}: ${r.status} ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
function registrar(ctx, req, dados) {
  const p = rpc('alpha_log', { p: { ...geo(req), ...dados } }).catch((e) => console.error('log', e.message));
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(p);
  return p;
}
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-app-v': VERSAO } });
const html = (body, status = 200, extra = {}) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', ...extra } });
const seguir = () => new Response(null, { headers: { 'x-middleware-next': '1' } });
// só caminhos do próprio site (barra invertida, tab e // viram outro domínio no navegador)
const destinoSeguro = (n) => {
  if (typeof n !== 'string' || !n.startsWith('/') || /[\\\s]/.test(n) || n.startsWith('//')) return '/';
  try { const u = new URL(n, 'https://x.invalid'); return u.origin === 'https://x.invalid' && !u.pathname.startsWith('/login') ? u.pathname + u.search : '/'; } catch (e) { return '/'; }
};

// ---------- estilo comum ----------
const CSS = `:root{--bg:#f6f5f1;--card:#fff;--ink:#1d2a30;--mut:#6b7479;--navy:#2C4C57;--gold:#B99042;--line:#e4e1d8;--err:#a33}
@media (prefers-color-scheme:dark){:root{--bg:#14191b;--card:#1d2427;--ink:#e8ecec;--mut:#9aa4a8;--navy:#7fb0bf;--gold:#d2ad62;--line:#2c3539;--err:#e88}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
h1{font:600 24px/1.2 Georgia,serif;color:var(--navy);margin:0 0 6px}.sub{color:var(--mut);font-size:14px}a{color:var(--navy)}`;

// ---------- páginas ----------
function paginaLogin({ next = '/', erro = '', ultimo = '' }) {
  const botoes = Object.entries(USERS).map(([id, u]) =>
    `<label class="u"><input type="radio" name="usuario" value="${id}"${id === ultimo ? ' checked' : ''} required><span>${esc(u.nome)}</span></label>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Alpha · Listas — entrar</title><style>${CSS}
.w{max-width:420px;margin:0 auto;padding:64px 16px}.card{background:var(--card);border:1px solid var(--line);border-top:3px solid var(--gold);border-radius:12px;padding:24px}
.us{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}.u input{position:absolute;opacity:0;pointer-events:none}
.u span{display:block;text-align:center;padding:12px;border:1px solid var(--line);border-radius:9px;font-weight:600;cursor:pointer;color:var(--ink)}
.u input:checked+span{border-color:var(--navy);background:var(--navy);color:#fff}.u input:focus-visible+span{outline:2px solid var(--gold)}
@media (prefers-color-scheme:dark){.u input:checked+span{color:#14191b}}
input[type=password]{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font-size:16px}
button{width:100%;margin-top:14px;padding:12px;border:0;border-radius:8px;background:var(--navy);color:#fff;font-weight:600;font-size:15px;cursor:pointer}
@media (prefers-color-scheme:dark){button{color:#14191b}}.erro{color:var(--err);font-size:14px;margin:10px 0 0}.rod{margin-top:18px;font-size:12px;color:var(--mut)}</style></head>
<body><div class="w"><div class="card"><h1>Alpha Soluções · Listas</h1><div class="sub">Acesso restrito à equipe.</div>
<form method="post" action="/login" autocomplete="on"><input type="hidden" name="next" value="${esc(next)}">
<div class="us">${botoes}</div>
<input type="password" name="senha" placeholder="Senha" autocomplete="current-password" required ${ultimo ? 'autofocus' : ''}>
${erro ? `<p class="erro">${esc(erro)}</p>` : ''}<button type="submit">Entrar</button></form>
<p class="rod">Depois de entrar, este navegador fica conectado. Não precisa digitar a senha de novo.</p></div></div></body></html>`;
}

function fmtData(ts) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(ts));
  } catch (e) { return ts; }
}
function aparelho(ua = '') {
  const so = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : '—';
  const nav = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return nav ? `${so} · ${nav}` : so;
}
const NOME_EVENTO = { login: 'Entrou', login_falhou: 'Senha errada', logout: 'Saiu', pagina: 'Abriu página', abriu_email: 'Abriu e-mail', abriu_email_2: 'Abriu e-mail (2 endereços)', whatsapp: 'Abriu WhatsApp', marcou_enviado: 'Marcou feito / enviado', desmarcou_enviado: 'Desmarcou', observacao: 'Observação', fcl_status: 'FCL: mudou status', fcl_obs: 'FCL: observação', fcl_envio: 'FCL: enviado' };

async function paginaLog(req, user) {
  const u = new URL(req.url);
  const filtro = u.searchParams.get('u') || '';
  const limite = Math.min(Number(u.searchParams.get('n')) || 1000, 5000);
  let linhas = [], erro = '';
  try { linhas = (await rpc('alpha_acessos', { p_limite: limite })) || []; } catch (e) { erro = e.message; }
  if (u.searchParams.get('formato') === 'csv') {
    const cab = ['data_hora', 'usuario', 'evento', 'caminho', 'detalhe', 'cidade', 'regiao', 'pais', 'cep', 'lat', 'lon', 'ip', 'aparelho'];
    const rows = linhas.filter((r) => !filtro || r.usuario === filtro).map((r) =>
      [fmtData(r.ts), r.usuario, NOME_EVENTO[r.evento] || r.evento, r.caminho, r.detalhe, r.cidade, r.regiao, r.pais, r.cep, r.lat, r.lon, r.ip, aparelho(r.ua)]
        .map((v) => { let t = String(v ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; }).join(';'));
    return new Response('﻿' + [cab.join(';'), ...rows].join('\r\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="acessos-alpha-listas.csv"', 'cache-control': 'no-store' } });
  }
  // resumo por usuário
  const res = {};
  for (const r of linhas) {
    if (!r.usuario) continue;
    const s = (res[r.usuario] ||= { total: 0, ultimo: null, onde: '', ips: new Set(), emails: 0, zaps: 0, enviados: 0 });
    s.total++; if (r.ip) s.ips.add(r.ip);
    if (r.evento === 'abriu_email' || r.evento === 'abriu_email_2') s.emails++;
    if (r.evento === 'whatsapp') s.zaps++;
    if (r.evento === 'marcou_enviado') s.enviados++;
    if (!s.ultimo) { s.ultimo = r.ts; s.onde = [r.cidade, r.regiao, r.pais].filter(Boolean).join(', '); }
  }
  const resumo = Object.entries(res).map(([k, s]) => `<tr><td><a href="?u=${esc(k)}">${esc(USERS[k]?.nome || k)}</a></td><td>${fmtData(s.ultimo)}</td><td>${esc(s.onde)}</td><td class="v">${s.total}</td><td class="v">${s.emails}</td><td class="v">${s.zaps}</td><td class="v">${s.enviados}</td><td class="v">${s.ips.size}</td></tr>`).join('');
  const corpo = linhas.filter((r) => !filtro || r.usuario === filtro).map((r) => {
    const onde = [r.cidade, r.regiao, r.pais].filter(Boolean).join(', ');
    const mapa = r.lat && r.lon ? ` <a href="https://www.google.com/maps?q=${esc(r.lat)},${esc(r.lon)}" target="_blank" rel="noopener">mapa</a>` : '';
    return `<tr><td class="nw">${fmtData(r.ts)}</td><td>${esc(USERS[r.usuario]?.nome || r.usuario || '—')}</td><td>${esc(NOME_EVENTO[r.evento] || r.evento)}</td><td class="pt">${esc(r.detalhe || r.caminho || '')}</td><td>${esc(onde)}${mapa}</td><td class="mut">${esc(r.ip)}</td><td class="mut">${esc(aparelho(r.ua))}</td></tr>`;
  }).join('');
  const filtros = ['', ...Object.keys(USERS)].map((k) => `<a class="f${k === filtro ? ' on' : ''}" href="${k ? `?u=${k}` : '?'}">${k ? esc(USERS[k].nome) : 'Todos'}</a>`).join('');
  return html(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Log de acessos</title><style>${CSS}
.w{max-width:1300px;margin:0 auto;padding:28px 16px 48px}nav{font-size:14px;margin-bottom:14px}table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);margin:12px 0 28px;font-size:13.5px}
th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.03em;color:var(--mut);padding:9px 10px;border-bottom:1px solid var(--line)}td{padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
.v{text-align:right;font-variant-numeric:tabular-nums}.nw{white-space:nowrap;font-variant-numeric:tabular-nums}.mut{color:var(--mut)}.pt{max-width:320px;word-break:break-all}
h2{font:600 17px Georgia,serif;color:var(--navy);margin:24px 0 0}.fs{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.f{padding:5px 11px;border:1px solid var(--line);border-radius:20px;text-decoration:none;font-size:13px}.f.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.scroll{overflow-x:auto}</style></head><body><div class="w"><nav><a href="/">Listas</a> › Log de acessos · <a href="/logout">Sair</a></nav>
<h1>Log de acessos</h1><div class="sub">Últimos ${linhas.length} registros · horário de Brasília · localização aproximada pelo IP (provedor de internet, não GPS) · <a href="?${filtro ? `u=${esc(filtro)}&` : ''}formato=csv">baixar CSV</a></div>
${erro ? `<p style="color:var(--err)">Erro ao ler o log: ${esc(erro)}</p>` : ''}
<h2>Resumo por pessoa</h2><div class="scroll"><table><thead><tr><th>Pessoa</th><th>Último acesso</th><th>Último local</th><th class="v">Registros</th><th class="v">E-mails abertos</th><th class="v">WhatsApp abertos</th><th class="v">Marcou feito</th><th class="v">IPs distintos</th></tr></thead><tbody>${resumo || '<tr><td colspan="8" class="mut">Nenhum acesso ainda.</td></tr>'}</tbody></table></div>
<h2>Detalhe</h2><div class="fs">${filtros}</div><div class="scroll"><table><thead><tr><th>Data e hora</th><th>Pessoa</th><th>O que fez</th><th>Página / contato</th><th>Local</th><th>IP</th><th>Aparelho</th></tr></thead><tbody>${corpo}</tbody></table></div>
</div></body></html>`);
}

// ---------- roteamento ----------
export default async function middleware(req, ctx) {
  const url = new URL(req.url);
  const path = url.pathname;

  if (!env('AUTH_SECRET') || !env('SITE_PASSWORD')) return html('<p>Configuração incompleta do site.</p>', 500);

  if (path === '/favicon.ico' || path === '/robots.txt') {
    return path === '/robots.txt' ? new Response('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain' } }) : new Response(null, { status: 204 });
  }

  // ----- login -----
  if (path === '/login') {
    const ultimo = USERS[cookies(req)[COOKIE_USER]] ? cookies(req)[COOKIE_USER] : '';
    if (req.method === 'POST') {
      const f = await req.formData();
      const usuario = String(f.get('usuario') || '').toLowerCase();
      const senha = String(f.get('senha') || '');
      const next = destinoSeguro(String(f.get('next') || '/'));
      // admin pode ter senha própria (variável ADMIN_PASSWORD); sem ela, vale a senha do site
      const esperada = USERS[usuario]?.admin && env('ADMIN_PASSWORD') ? env('ADMIN_PASSWORD') : env('SITE_PASSWORD');
      if (!USERS[usuario] || !iguais(senha, esperada)) {
        await registrar(ctx, req, { usuario: USERS[usuario] ? usuario : '', evento: 'login_falhou', caminho: '/login' });
        return html(paginaLogin({ next, erro: 'Senha incorreta.', ultimo: USERS[usuario] ? usuario : ultimo }), 401);
      }
      const exp = Math.floor(Date.now() / 1000) + SESSAO_DIAS * 86400;
      const valor = `${usuario}.${exp}.${await assinar(`${usuario}.${exp}`)}`;
      await registrar(ctx, req, { usuario, evento: 'login', caminho: '/login' });
      const h = new Headers({ location: next, 'cache-control': 'no-store' });
      h.append('set-cookie', `${COOKIE}=${valor}; Path=/; Max-Age=${SESSAO_DIAS * 86400}; HttpOnly; Secure; SameSite=Lax`);
      h.append('set-cookie', `${COOKIE_USER}=${usuario}; Path=/; Max-Age=${2 * SESSAO_DIAS * 86400}; Secure; SameSite=Lax`);
      return new Response(null, { status: 303, headers: h });
    }
    if (await sessao(req)) return Response.redirect(new URL(destinoSeguro(url.searchParams.get('next') || '/'), url), 303);
    return html(paginaLogin({ next: destinoSeguro(url.searchParams.get('next') || '/'), ultimo }));
  }

  const user = await sessao(req);

  if (path === '/logout') {
    if (user) await registrar(ctx, req, { usuario: user.id, evento: 'logout', caminho: '/logout' });
    return new Response(null, { status: 303, headers: { location: '/login', 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }

  if (!user) {
    if (path.startsWith('/api/')) return json({ erro: 'não autenticado' }, 401);
    const dest = (req.headers.get('sec-fetch-dest') || 'document') === 'document' || (req.headers.get('accept') || '').includes('text/html');
    if (dest) return Response.redirect(new URL(`/login?next=${encodeURIComponent(path + url.search)}`, url), 303);
    return new Response('Acesso restrito', { status: 401 });
  }

  // ----- API -----
  if (path === '/api/me') return json({ usuario: user.id, nome: user.nome, admin: user.admin, usuarios: Object.fromEntries(Object.entries(USERS).map(([k, v]) => [k, v.nome])) });

  if (path === '/api/evento' && req.method === 'POST') {
    let b = {};
    try { b = await req.json(); } catch (e) {}
    if (!EVENTOS_OK.has(b.evento)) return json({ erro: 'evento inválido' }, 400);
    const reg = registrar(ctx, req, { usuario: user.id, evento: b.evento, caminho: String(b.caminho || '').slice(0, 300), detalhe: String(b.detalhe || '').slice(0, 300) });
    const lista = String(b.lista || ''), chave = String(b.chave || '').slice(0, 200), alvo = String(b.alvo || '').slice(0, 200);
    if (CANAL[b.evento] && chave && /^[a-z0-9-]{1,60}$/.test(lista)) {
      const bl = bloqueio(user, lista, chave);
      if (bl) { await reg; return json({ erro: bl }, 403); }
      try { await rpc('alpha_marcar', { p_lista: lista, p_chave: `${chave}#${CANAL[b.evento]}:${alvo}`, p_usuario: user.id, p_on: true }); }
      catch (e) { await reg; return json({ erro: e.message }, 502); }
    }
    await reg;
    return json({ ok: true });
  }

  if (path === '/api/enviados') {
    const lista = url.searchParams.get('lista') || '';
    if (!/^[a-z0-9-]{1,60}$/.test(lista)) return json({ erro: 'lista inválida' }, 400);
    try {
      if (req.method === 'POST') {
        const b = await req.json();
        const chave = String(b.chave || '').slice(0, 300);
        if (!chave) return json({ erro: 'chave vazia' }, 400);
        const bl = bloqueio(user, lista, chave);
        if (bl) return json({ erro: bl }, 403);
        if (!b.on && !user.admin) {
          // desmarcar / remover registro: só quem criou (ou admin)
          const atual = ((await rpc('alpha_enviados', { p_lista: lista })) || []).find((r) => r.chave === chave);
          if (atual && atual.usuario !== user.id) return json({ erro: `Registro feito por ${USERS[atual.usuario]?.nome || atual.usuario}. Só quem registrou (ou Felipe/Fernanda) pode remover.` }, 403);
        }
        await rpc('alpha_marcar', { p_lista: lista, p_chave: chave, p_usuario: user.id, p_on: !!b.on });
        await registrar(ctx, req, { usuario: user.id, evento: b.on ? 'marcou_enviado' : 'desmarcou_enviado', caminho: `/${lista}`, detalhe: chave });
        return json({ ok: true });
      }
      const rows = (await rpc('alpha_enviados', { p_lista: lista })) || [];
      return json(Object.fromEntries(rows.map((r) => [r.chave, { u: r.usuario, ts: r.ts }])));
    } catch (e) {
      return json({ erro: e.message }, 502);
    }
  }

  // ----- observação por linha nas listas (foro, multa, laudêmio) -----
  if (path === '/api/obs') {
    const lista = url.searchParams.get('lista') || '';
    if (!/^[a-z0-9-]{1,60}$/.test(lista)) return json({ erro: 'lista inválida' }, 400);
    try {
      if (req.method === 'POST') {
        let b = {};
        try { b = await req.json(); } catch (e) { return json({ erro: 'JSON inválido' }, 400); }
        const chave = String(b.chave || '').slice(0, 300), texto = String(b.texto ?? '').slice(0, 2000);
        if (!chave) return json({ erro: 'chave vazia' }, 400);
        const bl = bloqueio(user, lista, chave);
        if (bl) return json({ erro: bl }, 403);
        await rpc('alpha_obs_set', { p_lista: lista, p_chave: chave, p_texto: texto, p_usuario: user.id });
        await registrar(ctx, req, { usuario: user.id, evento: 'observacao', caminho: `/${lista}`, detalhe: `${chave}: ${texto}`.slice(0, 300) });
        return json({ ok: true, u: user.id });
      }
      const rows = (await rpc('alpha_obs', { p_lista: lista })) || [];
      return json(Object.fromEntries(rows.map((r) => [r.chave, { t: r.texto, u: r.usuario, ts: r.ts }])));
    } catch (e) {
      return json({ erro: e.message }, 502);
    }
  }

  // ----- Laudêmio · FCL novas: repassa para a API de leads do Supabase (alpha-spu). O token fica só no servidor. -----
  if (path === '/api/fcl') {
    const tok = env('FCL_LEADS_TOKEN');
    if (!tok) return json({ erro: 'FCL_LEADS_TOKEN não configurado na Vercel' }, 500);
    const API = 'https://hewjrukaghsvfkobgxyh.supabase.co/functions/v1/leads-api';
    try {
      if (req.method === 'GET') {
        const q = new URLSearchParams();
        const tier = url.searchParams.get('tier'), st = url.searchParams.get('status');
        if (tier && /^[AB]$/.test(tier)) q.set('tier', tier);
        if (st && STATUS_FCL.includes(st)) q.set('status', st);
        if (url.searchParams.get('incluir_descartados') === '1') q.set('incluir_descartados', '1');
        const r = await fetch(API + (q.toString() ? '?' + q : ''), { headers: { 'x-site-token': tok } });
        const t = await r.text();
        if (!r.ok) return json({ erro: `API de leads respondeu ${r.status}: ${t.slice(0, 200)}` }, 502);
        return new Response(t, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-app-v': VERSAO } });
      }
      if (req.method === 'POST') {
        let b = {};
        try { b = await req.json(); } catch (e) { return json({ erro: 'JSON inválido' }, 400); }
        // registro de envio: uma ou várias FCLs do mesmo titular; quem envia é sempre o usuário logado
        if (b.enviado === true) {
          const fcls = [...new Set((Array.isArray(b.fcls) ? b.fcls : [b.fcl]).map(String))];
          if (!fcls.length || fcls.length > 20 || !fcls.every((f) => /^[0-9-]{4,30}$/.test(f))) return json({ erro: 'FCL inválida' }, 400);
          const canal = b.canal === 'whatsapp' ? 'whatsapp' : 'email';
          const leads = [];
          for (const f of fcls) {
            const r = await fetch(API, { method: 'POST', headers: { 'x-site-token': tok, 'content-type': 'application/json' }, body: JSON.stringify({ fcl: f, enviado: true, enviado_por: user.nome, canal }) });
            const t = await r.text();
            if (!r.ok) return json({ erro: `API de leads respondeu ${r.status} na FCL ${f}: ${t.slice(0, 200)}`, gravadas: leads.map((l) => l.fcl) }, r.status === 404 ? 404 : 502);
            try { leads.push(JSON.parse(t).lead); } catch (e) { leads.push({ fcl: f }); }
          }
          await registrar(ctx, req, { usuario: user.id, evento: 'fcl_envio', caminho: '/laudemio-fcl/', detalhe: `${canal} · FCL ${fcls.join(', ')} · ${String(b.alvo || '').slice(0, 120)}`.slice(0, 300) });
          return json({ ok: true, leads });
        }
        const fcl = String(b.fcl || '');
        if (!/^[0-9-]{4,30}$/.test(fcl)) return json({ erro: 'FCL inválida' }, 400);
        const corpo = { fcl };
        if (b.status_comercial !== undefined) {
          if (!STATUS_FCL.includes(b.status_comercial)) return json({ erro: 'status inválido' }, 400);
          corpo.status_comercial = b.status_comercial;
          corpo.responsavel_comercial = user.nome;   // quem mudou o status passa a ser o responsável comercial
        }
        if (b.observacao !== undefined) corpo.observacao = String(b.observacao).slice(0, 2000);
        if (Object.keys(corpo).length === 1) return json({ erro: 'nada para gravar' }, 400);
        const r = await fetch(API, { method: 'POST', headers: { 'x-site-token': tok, 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
        const t = await r.text();
        if (!r.ok) return json({ erro: `API de leads respondeu ${r.status}: ${t.slice(0, 200)}` }, r.status === 404 ? 404 : 502);
        await registrar(ctx, req, { usuario: user.id, evento: corpo.status_comercial ? 'fcl_status' : 'fcl_obs', caminho: '/laudemio-fcl/',
          detalhe: (`FCL ${fcl}` + (corpo.status_comercial ? ` → ${corpo.status_comercial}` : '') + (corpo.observacao !== undefined ? ` · obs: ${corpo.observacao}` : '')).slice(0, 300) });
        return new Response(t, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-app-v': VERSAO } });
      }
      return json({ erro: 'use GET ou POST' }, 405);
    } catch (e) {
      return json({ erro: 'Falha ao falar com a API de leads: ' + e.message }, 502);
    }
  }

  // ----- log (só Felipe e Fernanda) -----
  if (path === '/log' || path === '/log/') {
    if (!user.admin) return html('<p>Página restrita.</p>', 403);
    return paginaLog(req, user);
  }

  // ----- páginas estáticas: registra a navegação e segue -----
  const ehPagina = (req.headers.get('sec-fetch-dest') || '') === 'document' || /\.html?$|\/$/.test(path);
  if (ehPagina && req.method === 'GET') registrar(ctx, req, { usuario: user.id, evento: 'pagina', caminho: path + url.search });
  return seguir();
}
