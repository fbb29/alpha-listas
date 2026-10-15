// Modelo do e-mail da lista "CND de obra · decadente" (obra aberta no CNO da Receita há mais de 5 anos).
// Um lead = um titular; outras obras do mesmo titular no lote vêm em l.outras_obras (só o número do CNO).
import { nomeBR } from '/_app/canal.js';

// 900012345678 -> 90.001.23456/78
export const cnoFmt = c => { const d = String(c || '').replace(/\D/g, ''); return d.length === 12 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 10)}/${d.slice(10)}` : String(c || ''); };
export const m2 = x => Number(x || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' m²';
export const mesAno = d => { const m = String(d || '').match(/^(\d{4})-(\d{2})/); return m ? `${m[2]}/${m[1]}` : ''; };
const anos = d => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return 0;
  const hoje = new Date(); let a = hoje.getFullYear() - Number(m[1]); if (hoje.getMonth() + 1 < Number(m[2])) a--; return a; };

const TIPO = { AL: 'Alameda', ALAMEDA: 'Alameda', AV: 'Avenida', AVENIDA: 'Avenida', R: 'Rua', RUA: 'Rua', EST: 'Estrada', ESTRADA: 'Estrada', PC: 'Praça', PRACA: 'Praça',
  TV: 'Travessa', TRAVESSA: 'Travessa', ROD: 'Rodovia', RODOVIA: 'Rodovia', LGO: 'Largo', LARGO: 'Largo', VIA: 'Via', VL: 'Viela', VIELA: 'Viela', CAM: 'Caminho', CAMINHO: 'Caminho' };
// "ALAMEDA", "DAS ROSAS", "123", "LOTE 5" -> "Alameda das Rosas, 123 (Lote 5)"
export function endereco(l) {
  const tipo = TIPO[String(l.tipo_logradouro || '').toUpperCase().replace(/\.$/, '')] || nomeBR(l.tipo_logradouro || '');
  const lg = String(l.logradouro || '').trim();
  let rua = tipo && !lg.toLowerCase().startsWith(tipo.toLowerCase()) ? nomeBR(`${tipo} ${lg}`) : nomeBR(lg);
  const n = String(l.numero || '').trim();
  const num = n && !/^(S\/?N|SN|0+)$/i.test(n) ? `, ${n.replace(/^0+/, '')}` : '';
  const comp = String(l.complemento || '').trim();
  return (rua + num + (comp ? ` (${nomeBR(comp)})` : '')).trim();
}
const ondeCurto = l => { const e = endereco(l); return e || nomeBR(l.bairro || '') || nomeBR(l.municipio || ''); };
const lugar = l => { const e = endereco(l), b = nomeBR(l.bairro || ''), c = nomeBR(l.municipio || '');
  return [e, b && !e.includes(b) ? b : '', c].filter(Boolean).join(', '); };

export function assunto(l) {
  return `Obra aberta na Receita Federal: ${ondeCurto(l)} (CNO ${cnoFmt(l.id_cno)})`;
}
export function corpo(l) {
  const nome = nomeBR(l.nome || ''), pn = nome.split(' ')[0] || '';
  const a = anos(l.data_inicio), outras = (l.outras_obras || []).filter(Boolean);
  const p1 = `A obra do imóvel na ${lugar(l)}, com ${m2(l.m2_obra)} de construção e início em ${mesAno(l.data_inicio)}, consta como aberta no Cadastro Nacional de Obras da Receita Federal (CNO ${cnoFmt(l.id_cno)}), em seu nome.`
    + (outras.length ? ` ${outras.length === 1 ? 'Há também outra obra aberta em seu nome' : `Há também outras ${outras.length} obras abertas em seu nome`} (CNO ${outras.map(cnoFmt).join(', ')}).` : '');
  return [
    pn ? `Prezado(a) ${pn},` : 'Prezado(a),',
    p1,
    'Enquanto a obra não é encerrada na Receita com a CND de obra, a construção não pode ser averbada na matrícula do imóvel. Isso costuma aparecer na hora de vender, financiar, fazer inventário ou doar o imóvel, quando o prazo já está correndo.',
    `Como a obra começou há ${a > 5 ? `${a} anos` : 'mais de 5 anos'}, o INSS da obra pode estar total ou parcialmente decaído. Nesses casos a regularização sai com pouco ou nenhum imposto a pagar.`,
    'A Alpha Soluções faz esse trabalho do começo ao fim: encerramento da obra na Receita, emissão da CND de obra e averbação da construção na matrícula. A análise do caso não tem custo.',
    'Para receber a análise, é só responder este e-mail.',
    'Fico à disposição.\nAtenciosamente,'].join('\n\n');
}
// abre no Mail do computador, com a assinatura da conta; vários destinatários separados por vírgula
export function mailto(para, l) {
  const dest = String(para).split(/\s*,\s*/).filter(Boolean).map(e => encodeURIComponent(e).replace(/%40/g, '@')).join(',');
  return 'mailto:' + dest + '?subject=' + encodeURIComponent(assunto(l)) + '&body=' + encodeURIComponent(corpo(l).replace(/\n/g, '\r\n'));
}
