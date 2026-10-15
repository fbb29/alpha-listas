// Modelo do e-mail da lista "Laudêmio · FCL novas" (laudêmio emitido, ainda a vencer).
// Recebe a lista de FCLs do mesmo titular (CPF/CNPJ): um e-mail só, com todos os RIPs e valores.
// Cada lead pode trazer l.foro = [crédito, redução anual, confiança] (data/foro-credito.bin); só A e B entram no e-mail.
import { nomeBR } from '/_app/canal.js';
export const brl = x => 'R$ ' + Number(x).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dataBR = d => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
const lista = x => Array.isArray(x) ? x : [x];
const soma = ls => ls.reduce((a, l) => a + Number(l.valor_total || 0), 0);
const primeiroVenc = ls => ls.map(l => String(l.vencimento || '')).filter(Boolean).sort()[0];

// ----- endereço do cadastro da SPU → "Alameda Suíça, 184 (Quadra 22, Lote 1)" -----
const TIPO = { CALCDAS: 'Calçada das', AL: 'Alameda', AV: 'Avenida', R: 'Rua', RUA: 'Rua', EST: 'Estrada', CALC: 'Calçada', PC: 'Praça', PCA: 'Praça', TV: 'Travessa', ROD: 'Rodovia', LGO: 'Largo', IA: 'Via', VIA: 'Via' };
const ACENTO = { SUICA: 'Suíça', FRANCA: 'França', JURUA: 'Juruá', JAU: 'Jaú', MARILIA: 'Marília', AVILA: 'Ávila', GUARUJA: 'Guarujá', RIBEIRAO: 'Ribeirão', JUNDIAI: 'Jundiaí',
  JAPAO: 'Japão', MEDITERRANEO: 'Mediterrâneo', UNIVERSITARIO: 'Universitário', GONCALVES: 'Gonçalves', MAGNOLIAS: 'Magnólias', SAO: 'São', JOAO: 'João', JOSE: 'José', CONCEICAO: 'Conceição',
  ATENAS: 'Atenas', GRECIA: 'Grécia', BELGICA: 'Bélgica', AUSTRALIA: 'Austrália', ITALIA: 'Itália', ARGENTINA: 'Argentina', COLOMBIA: 'Colômbia', MEXICO: 'México', PANAMA: 'Panamá',
  VENEZUELA: 'Venezuela', CANADA: 'Canadá', AMAZONAS: 'Amazonas', PARANA: 'Paraná', GOIAS: 'Goiás', PIAUI: 'Piauí', CEARA: 'Ceará', MARANHAO: 'Maranhão', PARA: 'Pará', AMAPA: 'Amapá',
  ITU: 'Itu', TAMBORE: 'Tamboré', ARAGUAIA: 'Araguaia', CAMPINAS: 'Campinas', SOROCABA: 'Sorocaba', TAUBATE: 'Taubaté', MARCILIO: 'Marcílio', MARIA: 'Maria', ANTONIO: 'Antônio',
  ANDRE: 'André', VITORIA: 'Vitória', GLORIA: 'Glória', PRAIA: 'Praia', PORTUGAL: 'Portugal', ESPANHA: 'Espanha', ALEMANHA: 'Alemanha', ESTOCOLMO: 'Estocolmo', MONACO: 'Mônaco',
  GENEBRA: 'Genebra', BELEM: 'Belém', MACEIO: 'Maceió', CUIABA: 'Cuiabá', AREA: 'Área', IMOV: 'Imóvel', JARDIM: 'Jardim', PRESIDENTE: 'Presidente' };
const PEQ = new Set(['DA', 'DE', 'DO', 'DAS', 'DOS', 'E']);
const palavra = (w, i) => ACENTO[w] || (i && PEQ.has(w) ? w.toLowerCase() : w.charAt(0) + w.slice(1).toLowerCase());
export function endBR(s) {
  let t = String(s || '').toUpperCase().replace(/\s*\S*\d{8,}.*$/, '').replace(/\s+/g, ' ').trim();   // corta o lixo colado (CEP+RIP+nome)
  if (!t) return '';
  const tk = t.split(' ');
  let tipo = '';
  if (TIPO[tk[0]]) tipo = TIPO[tk.shift()];
  // nome do logradouro: até o número / S/N / palavra de complemento; descarta "RESIDENCIAL TRES", "CONDOMINIO X"
  const PARA = /^(\d+[A-Z]?|S\/N|S\/Nº?|QD|QUADRA|LT|L|LOTE|LOTES|APTO|AP|CASA|CASAS\S*|CONJ|IMOV|TORRE|GLEBA|AREA|TERRENO)$/;
  const nome = [];
  while (tk.length && !PARA.test(tk[0])) {
    if (tk[0] === 'RESIDENCIAL' && /^(ZERO|UM|DOIS|TRES|QUATRO|CINCO|SEIS|SETE|OITO|NOVE|DEZ)$/.test(tk[1] || '')) { tk.splice(0, 2); continue; }
    if (/^CONDOMINIO/.test(tk[0])) { tk.shift(); while (tk.length && !PARA.test(tk[0]) && !/^\d/.test(tk[0])) tk.shift(); continue; }
    nome.push(tk.shift());
  }
  const n = tk.length && /^\d+[A-Z]?$/.test(tk[0]) ? tk.shift() : (tk.length && /^S\/N/.test(tk[0]) ? (tk.shift(), '') : '');
  const resto = tk.join(' ');
  const comp = [];
  let m;
  if ((m = resto.match(/\bAPTO?\s*([\w-]+?)(?:-|\s|$)/))) comp.push('Apto. ' + m[1]);
  if ((m = resto.match(/\bTORRE\s*([A-Z0-9]+)/))) comp.push('Torre ' + m[1]);
  if ((m = resto.match(/\bCASAS?\s*([\d/]+)/))) comp.push((m[1].includes('/') ? 'Casas ' : 'Casa ') + m[1]);
  if ((m = resto.match(/\bIMOV\s*([\w-]+)/))) comp.push('Imóvel ' + m[1]);
  if ((m = resto.match(/\bCONJ\s*(\d+)/))) comp.push('Conj. ' + m[1]);
  if ((m = resto.match(/\b(?:QD|QUADRA)\s*([A-Z0-9]+)/))) comp.push('Quadra ' + m[1]);
  if ((m = resto.match(/\bLOTES\s*([\d, ]+(?:E\s*(?:METADE DO LOTE\s*)?\d+)?)/))) comp.push('Lotes ' + m[1].replace(/\s*,\s*/g, ', ').replace(/\s*E\s*METADE DO LOTE\s*/, ' e metade do ').replace(/\s*E\s*/, ' e ').trim());
  else if ((m = resto.match(/\b(?:LT|LOTE)\s*(\d+)\s+E\s+(\d+)\b/))) comp.push(`Lotes ${m[1]} e ${m[2]}`);
  else if ((m = resto.match(/\b(?:LT|LOTE)\s*([A-Z0-9]+)/)) || (m = resto.match(/\bL\s+(\d+)\b/))) comp.push('Lote ' + m[1]);
  if (!nome.length) return '';
  const rua = [tipo, ...nome.map((w, i) => palavra(w, i + (tipo ? 1 : 0)))].filter(Boolean).join(' ');
  const z = c => c.replace(/\b0+(\d)/g, '$1');   // "Lote 05" → "Lote 5"
  return rua + (n ? ', ' + n : '') + (comp.length ? ` (${z(comp.join(', '))})` : '');
}
// "na Alameda Suíça, 184 (Quadra 22, Lote 1), em Barueri (RIP 6213.0000186-08)"
const imovel = y => { const e = endBR(y.endereco), c = y.municipio ? nomeBR(y.municipio) : '';
  return (e ? `na ${e}` : '') + (c ? `${e ? ',' : ''} em ${c}` : '') + ` (RIP ${y.rip})`; };
const bala = y => `• ${endBR(y.endereco) || 'Imóvel'}${y.municipio ? ', em ' + nomeBR(y.municipio) : ''} (RIP ${y.rip}): ${brl(y.valor_total)}, vencimento em ${dataBR(y.vencimento)}`;
// crédito de foro: só estimativas tiradas do próprio extrato (A e B); a analogia por vizinhos (D) fica só na página
export const foroOk = y => Array.isArray(y.foro) && (y.foro[2] === 'A' || y.foro[2] === 'B');

export function assunto(x) {
  const ls = lista(x);
  if (ls.length === 1) return `Laudêmio de ${brl(ls[0].valor_total)} na SPU, com vencimento em ${dataBR(ls[0].vencimento)} (RIP ${ls[0].rip})`;
  return `Laudêmios de ${brl(soma(ls))} na SPU, com vencimento a partir de ${dataBR(primeiroVenc(ls))} (RIPs ${ls.map(l => l.rip).join(', ')})`;
}
// socio: nome do sócio quando o e-mail vai para ele, e não para a empresa
export function corpo(x, socio) {
  const ls = lista(x), l = ls[0];
  const pj = l.tipo_doc === 'CNPJ', nome = nomeBR(l.responsavel);
  let saud = socio ? `Prezado(a) ${nomeBR(socio).split(' ')[0]},` : pj ? `Prezados representantes da ${nome},` : `Prezado(a) ${nome.split(' ')[0]},`;
  const deQuem = socio || pj ? ` em nome da ${nome}` : '';
  let p1;
  if (ls.length === 1) {
    p1 = `Foi emitido um laudêmio de ${brl(l.valor_total)}${deQuem} referente à transferência do imóvel ${imovel(l)}, com vencimento em ${dataBR(l.vencimento)}.`;
  } else {
    p1 = `Foram emitidos laudêmios${deQuem} referentes à transferência de ${ls.length} imóveis, que somam ${brl(soma(ls))}:\n` + ls.map(bala).join('\n');
  }
  // lead que já recebeu proposta da Alpha e não fechou: abertura reconhece o contato anterior
  const prop = (ls.find(y => y.proposta_alpha) || {}).proposta_alpha;
  if (prop) {
    const m = String(prop).match(/última em (\d{2}\/\d{2}\/\d{4})/);
    const quem = socio ? nomeBR(socio).split(' ')[0] : pj ? nome : nome.split(' ')[0];
    const quando = m ? `Em ${m[1]}` : 'Recentemente';
    saud = '';
    p1 = ls.length === 1
      ? `Olá, ${quem}. ${quando} a Alpha Soluções enviou uma proposta para o imóvel ${imovel(l)}. Agora foi emitido um laudêmio desse imóvel, no valor de ${brl(l.valor_total)}, com vencimento em ${dataBR(l.vencimento)}.`
      : `Olá, ${quem}. ${quando} a Alpha Soluções enviou uma proposta para os imóveis RIP ${ls.map(y => y.rip).join(', ')}. Agora foram emitidos laudêmios desses imóveis, que somam ${brl(soma(ls))}:\n` + ls.map(bala).join('\n');
  }
  // crédito de foro no(s) mesmo(s) imóvel(is): argumento a mais
  const cf = ls.filter(foroOk);
  let pForo = '';
  if (cf.length === 1 && ls.length === 1) {
    pForo = `Também analisamos o extrato de foro desse imóvel. O foro cobrado está acima dos limites legais de reajuste: pela nossa estimativa preliminar, foram pagos ${brl(cf[0].foro[0])} a mais, que podem ser restituídos, e o foro pode ser reduzido em ${brl(cf[0].foro[1])} por ano.`;
  } else if (cf.length) {
    pForo = `Também analisamos o extrato de foro ${cf.length === 1 ? 'de um desses imóveis' : 'desses imóveis'}. O foro cobrado está acima dos limites legais de reajuste. Nossa estimativa preliminar:\n` +
      cf.map(y => `• RIP ${y.rip}: ${brl(y.foro[0])} pagos a mais, que podem ser restituídos, e redução de ${brl(y.foro[1])} por ano no foro`).join('\n') +
      (cf.length > 1 ? `\nNo total, ${brl(cf.reduce((a, y) => a + y.foro[0], 0))} a restituir e ${brl(cf.reduce((a, y) => a + y.foro[1], 0))} por ano de redução.` : '');
  }
  return [saud, p1, pForo,
    'Se este laudêmio foi emitido para transferir o imóvel para uma holding, recomendamos fortemente que fale conosco antes de pagar. Nesse tipo de operação existem soluções que podem ser bem mais vantajosas, e vale avaliar o caso antes de recolher a guia.',
    'O laudêmio é calculado sobre a avaliação que a SPU faz do terreno. Em boa parte dos casos é possível reduzir esse valor, seja por erro na avaliação ou no cálculo, seja por hipóteses já reconhecidas pela própria SPU. A análise precisa ser feita antes do vencimento: depois que o laudêmio é pago, não há mais o que fazer.',
    `A Alpha Soluções trabalha com imóveis da União. A análise do caso não tem custo. Só cobramos se ${cf.length ? 'o laudêmio ou o foro for reduzido' : 'o laudêmio for reduzido'}, e apenas no fim do processo.`,
    'Para receber a análise, é só responder este e-mail.',
    'Fico à disposição.\nAtenciosamente,'].filter(Boolean).join('\n\n');
}
// abre no app de e-mail do computador (Mail), com a assinatura da conta; vários destinatários separados por vírgula
export function mailto(para, x, socio) {
  const dest = String(para).split(/\s*,\s*/).filter(Boolean).map(e => encodeURIComponent(e).replace(/%40/g, '@')).join(',');
  return 'mailto:' + dest + '?subject=' + encodeURIComponent(assunto(x)) + '&body=' + encodeURIComponent(corpo(x, socio).replace(/\n/g, '\r\n'));
}
