// Modelo do e-mail 1 de foro. Campos de cada linha dos arquivos data/foro-email1/c*.bin:
// 0 email, 1 email2, 2 titular, 3 saudação, 4 pj, 5 nº imóveis, 6 município(s), 7 endereço curto,
// 8 RIP, 9 foro cobrado 2026, 10 foro correto, 11 redução/ano, 12 crédito, 13 tel, 14 tel2, 15 recebeu em set.
// (16 é um campo antigo e não é usado: a divisão entre as três pessoas é feita em lista.html.)
import { nomeBR, fone } from '/_app/canal.js';
export const brl = x => 'R$ ' + Number(x).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function assunto(r) { return `Seu foro na SPU (RIP ${r[8]}${r[5] > 1 ? ' e outros' : ''}): redução estimada de ${brl(r[11])} por ano`; }

// endereço só entra no texto quando começa com um tipo de logradouro ("na Alameda..."); corta o que veio truncado na base
const LOGR = /^(Alameda|Avenida|Rua|Praça|Estrada|Travessa|Rodovia|Largo|Via)\b/;
function endereco(im) {
  if (!im || !LOGR.test(im)) return '';
  if (im.length >= 50) { const m = im.match(/^.*?\d+[A-Za-z]?\b/); return m ? m[0] : ''; }
  return im;
}
export function corpo(r) {
  const [, , titRaw, saudRaw, pj, n, mun, imRaw, rip, fa, fr, red, cred] = r;
  const tit = nomeBR(titRaw), saud = String(saudRaw || '').split(' ').map((w, i) => i === 0 ? w : nomeBR(w.replace(/,$/, '')) + (w.endsWith(',') ? ',' : '')).join(' '), im = endereco(imRaw);
  let p1, p2 = '', p3;
  if (n === 1) {
    const alvo = pj ? `do imóvel da ${tit}` : 'do seu imóvel';
    p1 = im ? `Analisamos o extrato da SPU ${alvo} na ${im}, em ${mun} (RIP ${rip}).`
            : `Analisamos o extrato da SPU ${alvo} em ${mun} (RIP ${rip}).`;
    p2 = `O foro cobrado em 2026 foi de ${brl(fa)}. Pelos limites legais de reajuste, o valor correto seria de cerca de ${brl(fr)}. A diferença se repete todo ano.`;
    p3 = pj ? 'Nossa estimativa preliminar para o imóvel:' : 'Nossa estimativa preliminar para o seu imóvel:';
  } else {
    const alvo = pj ? `dos ${n} imóveis da ${tit}` : `dos seus ${n} imóveis`;
    p1 = `Analisamos o extrato da SPU ${alvo} em ${mun} (entre eles o RIP ${rip}).`;
    p3 = pj ? 'Nossa estimativa preliminar para os imóveis:' : 'Nossa estimativa preliminar para os seus imóveis:';
  }
  return [saud, p1, p2,
    p3 + '\n• Redução do foro: ' + brl(red) + ' por ano\n• Valores pagos a mais, que podem ser restituídos: ' + brl(cred),
    'A Alpha Soluções trabalha com imóveis da União. Nos últimos 180 dias, protocolamos 290 pedidos de revisão de foro na SPU em Alphaville.',
    'A análise completa do seu caso não tem custo. Só cobramos se a SPU reduzir o foro ou devolver valores, e apenas no fim do processo.',
    'Se quiser receber o relatório detalhado' + (n === 1 ? ' do seu imóvel' : ' dos seus imóveis') + ', é só responder este e-mail.',
    'Fico à disposição.\nAtenciosamente,'].filter(Boolean).join('\n\n');
}

export function mailto(para, r) {
  return 'mailto:' + para.map(e => encodeURIComponent(e).replace(/%40/g, '@')).join(',') + '?subject=' + encodeURIComponent(assunto(r)) +
    '&body=' + encodeURIComponent(corpo(r).replace(/\n/g, '\r\n'));
}

// Celular vira link do WhatsApp Web; fixo aparece só como texto. Celular antigo de 8 dígitos ganha o 9.
export function zap(t) { const f = fone(t); return [f.wa, f.fmt || null]; }
