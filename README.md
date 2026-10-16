# alpha-listas

Site interno da Alpha Soluções com listas de contato para a equipe comercial (Vercel, projeto `alpha-listas`).

## Acesso
- Login em `/login`: a pessoa escolhe o nome (Felipe, Fernanda, Kely, Lucas Santos, Lucas Henrique) e digita a senha uma vez. O navegador fica conectado por 365 dias.
- Senha: variável `SITE_PASSWORD`. Para derrubar todas as sessões, trocar `AUTH_SECRET`.
- Usuários: objeto `USERS` em `middleware.js` (admin = vê o log e as listas de todos).
- Tudo (páginas, dados, API) passa pelo `middleware.js`; sem sessão válida nada é servido.

## Log de acessos
- `/log` (só admins): quem entrou, quando, de onde (cidade/estado/país pelo IP, link de mapa), IP, aparelho, e-mails abertos, WhatsApp, marcações de enviado. Exporta CSV.
- Gravado no Supabase (projeto lobo-market-engine, schema isolado `alpha_listas`, acesso só pelas funções `alpha_*` com `LOG_TOKEN`).

## Listas
- Cada lista é uma pasta em `public/<lista>/` e um cartão em `public/index.html`.
- Foro e-mail 1: `public/foro-email1/` — `lista.html?p=kely|lucas|lucash` (Kely, Lucas Santos, Lucas Henrique; divisão feita na própria página, do maior crédito para o menor em ida e volta) monta a tabela a partir de `public/data/foro-email1/c0..c7.bin` (JSON gzip) e do modelo de texto em `modelo.js`.
- "Enviado" é salvo no servidor (`/api/enviados?lista=<lista>`), visível para todos.
- Multa de transferência e Laudêmio: `public/multa/` e `public/laudemio/` (mesmo `index.html`, a lista vem do caminho). Dados em `public/data/multa/c0..c6.bin` e `public/data/laudemio/c0..c5.bin`. Listas compartilhadas, sem divisão por pessoa; "Feito" salvo por CPF/CNPJ.
- Canal de contato: o clique em E-mail/WhatsApp grava em `enviados` a chave `<contato>#e:<e-mail>` ou `<contato>#w:<telefone>` (quem e quando), via `/api/evento`; o × na linha remove. Código comum em `public/_app/canal.js`.
- Multa/laudêmio: coleta do robô de 13/10/2026 sem piso de valor (`c0..` até o maior índice; a página ordena por valor).

## Relatório (somente leitura)
- `GET /api/relatorio?data_inicio=AAAA-MM-DD&data_fim=AAAA-MM-DD` (fuso America/Sao_Paulo), cabeçalho `Authorization: Bearer <RELATORIO_API_KEY>`. Sem a chave: 401. Só lê; qualquer outro método: 405.
- Devolve: resumo por pessoa e dia (marcou feito/enviado, e-mails e WhatsApp abertos, observações), lista de ações com lead e lista de origem, e para cada "marcou feito / enviado" se o e-mail/WhatsApp do lead foi aberto pelo site antes (o envio em si acontece no Mail de cada um e não é confirmável pelo site).
- O log (`alpha_listas.acessos`) é histórico permanente: um trigger no banco bloqueia UPDATE, DELETE e TRUNCATE.
