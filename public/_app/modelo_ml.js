// Modelo do e-mail de multa de transferência e de laudêmio (listas /multa e /laudemio).
// Linha dos dados: [nome, doc, pj, valor, nº imóveis, RIP, município(s), e-mails, telefones, contato via, óbito]
import { nomeBR } from '/_app/canal.js';
export const brl = x => 'R$ ' + Number(x).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ACENTO = { 'Sao Vicente': 'São Vicente', 'Santana De Parnaiba': 'Santana de Parnaíba', 'Guaruja': 'Guarujá', 'Sao Sebastiao': 'São Sebastião',
  'Sao Paulo': 'São Paulo', 'Itanhaem': 'Itanhaém', 'Cubatao': 'Cubatão', 'Mongagua': 'Mongaguá', 'Peruibe': 'Peruíbe' };
export const municipio = m => {
  const l = String(m || '').split(';').map(x => x.trim()).filter(Boolean).map(x => ACENTO[x] || x);
  return l.length > 1 ? l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1] : (l[0] || '');
};

export function assunto(r, lista) {
  const [, , , valor, , rip] = r;
  return lista === 'laudemio' ? `Laudêmio na SPU: ${brl(valor)} em aberto (RIP ${rip})` : `Multa de transferência na SPU: ${brl(valor)} em aberto (RIP ${rip})`;
}

export function corpo(r, lista) {
  const [nomeRaw, , pj, valor, n, rip, mun] = r;
  const nome = nomeBR(nomeRaw);
  const laud = lista === 'laudemio';
  const saud = pj ? `Prezados representantes da ${nome},` : `Prezado(a) ${String(nome).split(' ')[0]},`;
  const nomeDe = pj ? `em nome da ${nome}` : 'em seu nome';
  const cidade = municipio(mun);
  const onde = n > 1 ? `${n} imóveis${cidade ? ' em ' + cidade : ''} (entre eles o RIP ${rip})` : `imóvel RIP ${rip}${cidade ? ', em ' + cidade : ''}`;
  const p1 = laud
    ? `Consta na SPU um laudêmio de ${brl(valor)} em aberto ${nomeDe}, referente à transferência ${n > 1 ? 'de ' : 'do '}${onde}.`
    : `Consta na SPU uma multa de transferência de ${brl(valor)} em aberto ${nomeDe}, referente ${n > 1 ? 'a ' : 'ao '}${onde}.`;
  const p2 = laud
    ? 'O laudêmio é cobrado de quem transfere um imóvel da União, e o valor é calculado sobre a avaliação que a SPU faz do terreno. Em boa parte dos casos é possível reduzir ou até cancelar a cobrança, seja por erro na avaliação ou no cálculo, seja por hipóteses já reconhecidas pela própria SPU.'
    : 'É a multa cobrada pelo atraso na comunicação da transferência do imóvel à SPU. Em boa parte dos casos é possível reduzir ou até cancelar esse valor, seja por erro de cálculo, seja por hipóteses já reconhecidas pela própria SPU.';
  return [saud, p1, p2,
    'O débito está em cobrança administrativa. Se for inscrito em dívida ativa, passa a ter mais encargos e pode virar execução fiscal. Agir antes disso sai mais barato.',
    `A Alpha Soluções trabalha com imóveis da União. A análise do caso não tem custo. Só cobramos se ${laud ? 'o laudêmio for reduzido ou cancelado' : 'a multa for reduzida ou cancelada'}, e apenas no fim do processo.`,
    'Para receber a análise, é só responder este e-mail.',
    'Fico à disposição.\nAtenciosamente,'].join('\n\n');
}

export function mailto(para, r, lista) {
  return 'mailto:' + encodeURIComponent(para).replace(/%40/g, '@') + '?subject=' + encodeURIComponent(assunto(r, lista)) +
    '&body=' + encodeURIComponent(corpo(r, lista).replace(/\n/g, '\r\n'));
}
