// Modelo do e-mail da lista "Laudêmio · FCL novas" (FCL emitida, laudêmio ainda a vencer).
// Recebe a lista de FCLs do mesmo titular (CPF/CNPJ): um e-mail só, com todos os RIPs e valores.
import { nomeBR } from '/_app/canal.js';
export const brl = x => 'R$ ' + Number(x).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dataBR = d => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
const lista = x => Array.isArray(x) ? x : [x];
const soma = ls => ls.reduce((a, l) => a + Number(l.valor_total || 0), 0);
const primeiroVenc = ls => ls.map(l => String(l.vencimento || '')).filter(Boolean).sort()[0];

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
    const cidade = l.municipio ? `, em ${nomeBR(l.municipio)}` : '';
    p1 = `A SPU emitiu o cálculo de laudêmio de ${brl(l.valor_total)}${deQuem} referente à transferência do imóvel RIP ${l.rip}${cidade}, com vencimento em ${dataBR(l.vencimento)}.`;
  } else {
    p1 = `A SPU emitiu os cálculos de laudêmio${deQuem} referentes à transferência de ${ls.length} imóveis, que somam ${brl(soma(ls))}:\n` +
      ls.map(y => `• RIP ${y.rip}${y.municipio ? ', em ' + nomeBR(y.municipio) : ''}: ${brl(y.valor_total)}, vencimento em ${dataBR(y.vencimento)}`).join('\n');
  }
  // lead que já recebeu proposta da Alpha e não fechou: abertura reconhece o contato anterior
  const prop = (ls.find(y => y.proposta_alpha) || {}).proposta_alpha;
  if (prop) {
    const m = String(prop).match(/última em (\d{2}\/\d{2}\/\d{4})/);
    const quem = socio ? nomeBR(socio).split(' ')[0] : pj ? nome : nome.split(' ')[0];
    const quando = m ? `Em ${m[1]}` : 'Recentemente';
    saud = '';
    p1 = ls.length === 1
      ? `Olá, ${quem}. ${quando} a Alpha Soluções enviou uma proposta para o imóvel RIP ${l.rip}. Agora foi emitido um laudêmio desse imóvel, no valor de ${brl(l.valor_total)}, com vencimento em ${dataBR(l.vencimento)}.`
      : `Olá, ${quem}. ${quando} a Alpha Soluções enviou uma proposta para os imóveis RIP ${ls.map(y => y.rip).join(', ')}. Agora foram emitidos laudêmios desses imóveis, que somam ${brl(soma(ls))}:\n` +
        ls.map(y => `• RIP ${y.rip}${y.municipio ? ', em ' + nomeBR(y.municipio) : ''}: ${brl(y.valor_total)}, vencimento em ${dataBR(y.vencimento)}`).join('\n');
  }
  return [saud, p1,
    'Se este laudêmio foi emitido para transferir o imóvel para uma holding, recomendamos fortemente que fale conosco antes de pagar. Nesse tipo de operação existem soluções que podem ser bem mais vantajosas, e vale avaliar o caso antes de recolher a guia.',
    'O laudêmio é calculado sobre a avaliação que a SPU faz do terreno. Em boa parte dos casos é possível reduzir esse valor, seja por erro na avaliação ou no cálculo, seja por hipóteses já reconhecidas pela própria SPU. A análise precisa ser feita antes do vencimento: depois que o laudêmio é pago, não há mais o que fazer.',
    `A Alpha Soluções trabalha com imóveis da União. A análise do caso não tem custo. Só cobramos se o laudêmio for reduzido, e apenas no fim do processo.`,
    'Para receber a análise, é só responder este e-mail.',
    'Fico à disposição.\nAtenciosamente,'].filter(Boolean).join('\n\n');
}
// composição no Gmail web (o app Mail não é usado)
export function gmail(para, x, socio) {
  return 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(para) + '&su=' + encodeURIComponent(assunto(x)) +
    '&body=' + encodeURIComponent(corpo(x, socio));
}
