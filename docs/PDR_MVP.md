# Arkivame

## Visão Geral do Projeto

Este documento detalha a construção de um MVP (Produto Mínimo Viável) para um SaaS denominado "Arkivame". O objetivo é resolver a dor da "amnésia corporativa" e da perda de conhecimento em canais de comunicação como Slack e Microsoft Teams, transformando conversas efêmeras em uma base de conhecimento permanente e pesquisável com o mínimo de fricção para o usuário. O MVP incluirá funcionalidades essenciais e as três suboportunidades identificadas para maximizar o valor desde o início.

## 1. Core MVP: Captura e Armazenamento de Conhecimento

### 1.1. Objetivo

Permitir que usuários capturem threads de conversas importantes no Slack/Teams usando uma reação de emoji e as armazenem em uma base de conhecimento web simples e pesquisável.

### 1.2. Funcionalidades Essenciais

#### 1.2.1. Integração com Slack/Microsoft Teams

*   **Tipo de Integração:** Bot de aplicativo (Slack App, Teams App).
*   **Permissões Necessárias:**
    *   `channels:history` (para ler o histórico do canal onde o emoji foi usado).
    *   `reactions:read` (para detectar a reação do emoji).
    *   `chat:write` (para o bot responder na thread, se necessário).
    *   `users:read` (para identificar o usuário que reagiu e o autor da mensagem).
*   **Evento Gatilho:** Reação de emoji específica (configurável pelo administrador do app, padrão: `:livro:` ou `:arquivo:`).
*   **Ação:** Quando o bot detecta a reação de emoji em uma mensagem, ele deve:
    1.  Identificar a mensagem raiz da thread.
    2.  Coletar todas as mensagens da thread, incluindo anexos (links, imagens, arquivos).
    3.  Coletar metadados da thread: canal de origem, autor da mensagem raiz, data/hora da reação, usuário que reagiu.
    4.  Processar o conteúdo para extrair texto limpo e links relevantes.
    5.  Armazenar os dados coletados no banco de dados.

#### 1.2.2. Base de Conhecimento Web Simples

*   **Interface:** Frontend web responsivo e intuitivo.
*   **Autenticação:** Login simples para administradores/membros da equipe (ex: via Google OAuth ou e-mail/senha).
*   **Visualização:**
    *   Lista de todos os itens arquivados, exibindo título (primeira linha da mensagem ou título gerado), canal de origem, autor e data.
    *   Página de detalhe para cada item, exibindo a thread completa de forma legível (como um chat), com links clicáveis e imagens incorporadas.
*   **Busca:** Campo de busca textual que permite pesquisar por palavras-chave em todo o conteúdo arquivado (títulos, mensagens, canais).
*   **Organização:** Capacidade de filtrar por canal de origem. Opcional: tags (se houver hashtags na thread original, usá-las como tags).

#### 1.2.3. Backend e Banco de Dados

*   **Tecnologia:** Serverless (ex: Vercel Functions) para o backend, garantindo escalabilidade e baixo custo.
*   **Banco de Dados:** NoSQL (ex: Firestore) para flexibilidade e escalabilidade. Estrutura de dados para armazenar:
    *   `id` (UUID único para cada item arquivado).
    *   `thread_id` (ID da thread original no Slack/Teams).
    *   `channel_id` (ID do canal de origem).
    *   `channel_name` (Nome do canal).
    *   `root_message_author` (Autor da mensagem raiz).
    *   `archived_by_user` (Usuário que reagiu com o emoji).
    *   `timestamp` (Data/hora da reação/arquivamento).
    *   `title` (Título gerado ou primeira linha da mensagem raiz).
    *   `content` (Array de objetos, cada um representando uma mensagem na thread: `author`, `text`, `timestamp`, `attachments`).
    *   `tags` (Array de strings, extraídas de hashtags ou adicionadas manualmente).
    *   `metadata` (Outros dados relevantes para futuras expansões).

## 2. Suboportunidade 1: O Alimentador de Wikis (Integração de Saída)

### 2.1. Objetivo

Permitir que usuários enviem itens arquivados para ferramentas de base de conhecimento externas (Notion, Confluence) com um clique.

### 2.2. Funcionalidades

#### 2.2.1. Configuração de Integração

*   **Painel de Administração:** Um administrador pode configurar credenciais para uma ou mais ferramentas de wiki (ex: Notion API Key, Confluence API Token).
*   **Seleção de Destino:** O administrador pode definir um destino padrão (ex: ID de um banco de dados no Notion, ID de uma página pai no Confluence).

#### 2.2.2. Ação de Envio

*   **Botão na Interface Web:** Na página de detalhe de cada item arquivado, um botão "Enviar para Notion" (ou similar).
*   **Processo:** Ao clicar, a ferramenta deve:
    1.  Autenticar-se com a API da ferramenta de wiki.
    2.  Criar uma nova página/item na ferramenta de wiki, preenchendo o título e o conteúdo com base no item arquivado.
    3.  O conteúdo deve ser formatado de forma legível (ex: Markdown para Notion, HTML para Confluence).
    4.  Opcional: Adicionar um link de volta para o item original no "Arkivame".
    5.  Notificar o usuário sobre o sucesso ou falha da operação.

## 3. Suboportunidade 2: O Guardião do Conhecimento (Respostas Proativas do Bot)

### 3.1. Objetivo

Permitir que o bot responda proativamente em canais do Slack/Teams quando uma pergunta semelhante a um item já arquivado for feita, reduzindo a repetição de perguntas.

### 3.2. Funcionalidades

#### 3.2.1. Monitoramento de Perguntas

*   **Tipo de Integração:** O mesmo bot existente.
*   **Permissões Necessárias:** `channels:history` (para ler mensagens em canais públicos/privados onde o bot está presente).
*   **Evento Gatilho:** Uma nova mensagem em um canal do Slack/Teams.
*   **Processo:**
    1.  Quando uma nova mensagem é postada, o bot deve analisar seu conteúdo (texto).
    2.  Comparar o texto da mensagem com o conteúdo dos itens já arquivados na base de conhecimento.
    3.  **Algoritmo de Comparação (MVP):** Busca por palavras-chave. Se a mensagem contiver 3 ou mais palavras-chave presentes em um título ou nas primeiras 50 palavras de um item arquivado, considerar uma possível correspondência.
    4.  **Limitação (MVP):** Para evitar spam, o bot deve ter um limite de respostas por canal por período (ex: 1 resposta a cada 15 minutos).

#### 3.2.2. Resposta Proativa do Bot

*   **Ação:** Se uma correspondência for encontrada, o bot deve responder na thread da mensagem original (ou no canal, se não for uma thread) com uma mensagem como:
    *   "Olá! Parece que essa pergunta já foi abordada anteriormente. Você pode encontrar mais informações aqui: [Link para o item arquivado na base de conhecimento]."
*   **Controle:** Um administrador deve ter a opção de ativar/desativar essa funcionalidade por canal ou globalmente.

## 4. Suboportunidade 3: O Analista de Conhecimento (Painel de Análise)

### 4.1. Objetivo

Fornecer insights sobre o conhecimento arquivado, ajudando as equipes a identificar lacunas e tópicos recorrentes.

### 4.2. Funcionalidades

#### 4.2.1. Métricas Chave

*   **Total de Itens Arquivados:** Número total de threads/mensagens salvas.
*   **Itens Arquivados por Período:** Gráfico mostrando o volume de arquivamentos por dia/semana/mês.
*   **Canais Mais Ativos:** Lista dos canais que mais geram conhecimento arquivado.
*   **Usuários Mais Ativos:** Lista dos usuários que mais arquivam conhecimento.
*   **Termos de Busca Mais Frequentes:** Top 10 ou 20 termos mais pesquisados na base de conhecimento.
*   **Itens Mais Visualizados:** Top 10 ou 20 itens mais acessados na base de conhecimento.

#### 4.2.2. Visualização de Dados

*   **Painel:** Uma seção dedicada no painel web para exibir essas métricas de forma clara e visual (gráficos de barra, pizza, linhas).
*   **Filtros:** Capacidade de filtrar as métricas por período (últimos 7 dias, 30 dias, 90 dias, etc.).

## 5. Suboportunidade 4: Resumos, Métricas e Insights de Equipes

### 5.1. Objetivo

Transformar o Arqiva em um centro de inteligência estratégica, permitindo que as equipes não apenas preservem o conhecimento, mas também o compreendam e otimizem seus processos de comunicação e colaboração através de resumos, métricas e insights.

### 5.2. Funcionalidades

#### 5.2.1. Resumos Inteligentes (AI-Powered Summaries)

*   **Resumo de Threads Arquivadas:** Automaticamente gerar um resumo conciso de cada thread arquivada. Isso permite que os usuários compreendam rapidamente o contexto e as decisões tomadas sem precisar ler a conversa inteira. Pode ser exibido no painel web.
    *   **Implementação:** Utilizar APIs de PLN (Processamento de Linguagem Natural) para gerar resumos. O resumo deve ser armazenado junto com a thread arquivada.
*   **Extração de Itens de Ação e Decisões:** Utilizar IA para identificar e listar explicitamente itens de ação (`action items`) e decisões tomadas dentro das threads arquivadas. Isso pode ser apresentado de forma estruturada no painel web.
    *   **Implementação:** Análise do conteúdo da thread para identificar frases que denotem ações ou decisões, utilizando modelos de PLN.

#### 5.2.2. Métricas de Conhecimento e Comunicação

*   **Volume de Arquivamento:** Número total de threads arquivadas por período (dia, semana, mês), por canal e por usuário. Exibido em gráficos no painel web.
*   **Canais Mais Ativos:** Lista dos canais que mais geram conhecimento arquivado.
*   **Usuários Mais Ativos:** Ranking dos usuários que mais contribuem com arquivamentos.
*   **Buscas Realizadas:** Número de buscas no painel web, termos de busca mais frequentes e buscas sem resultados. Exibido em dashboards.
*   **Itens Mais Visualizados/Acessados:** Quais threads arquivadas são mais consultadas, indicando o conhecimento mais relevante ou procurado.

#### 5.2.3. Insights de Equipes

*   **Tópicos Emergentes:** Identificação de novos temas de discussão que estão ganhando tração nos canais, mesmo que ainda não tenham sido formalmente arquivados. Pode ser baseado em análise de frequência de termos.
*   **Lacunas de Conhecimento:** Análise dos termos de busca sem resultados ou das perguntas frequentes não respondidas, indicando áreas onde a documentação é insuficiente. Pode ser um alerta ou um relatório.
*   **Padrões de Colaboração:** Visualização de como as equipes interagem em torno do conhecimento (ex: quais canais colaboram mais, quem são os "experts" em determinados tópicos). (Funcionalidade mais avançada, pode ser para uma fase posterior).

### 5.3. Requisitos Técnicos Adicionais para Suboportunidade 4

*   **Integração com APIs de IA:** Necessidade de integrar com serviços de PLN (ex: OpenAI, Google AI) para sumarização e extração de insights. Considerar custos e limites de uso dessas APIs.
*   **Processamento de Dados:** Infraestrutura para processar o conteúdo das threads e gerar as métricas e insights de forma eficiente.
*   **Armazenamento de Insights:** O banco de dados deve ser capaz de armazenar os resumos gerados e os dados para as métricas e insights.
*   **Visualização:** Ferramentas de visualização de dados (ex: Chart.js, D3.js) para criar dashboards interativos no painel web.

## 6. Requisitos Técnicos Adicionais e Considerações de Infraestrutura

### 6.1. Escalabilidade e Custo

*   **Arquitetura Serverless:** Confirmar que a Lovable utilizará uma arquitetura serverless (AWS Lambda, Vercel Functions, Cloudflare Workers) para todas as funções de backend para garantir baixo custo e escalabilidade automática.
*   **Banco de Dados:** Utilização de um banco de dados NoSQL gerenciado (DynamoDB, Firestore) para armazenamento de dados, com foco na otimização de custos e escalabilidade.
*   **Hospedagem Frontend:** Utilização de serviços de hospedagem de sites estáticos (Vercel, Netlify, Cloudflare Pages) para o painel web.

### 6.2. Segurança e Privacidade

*   **Autenticação:** Implementação de autenticação segura para o painel web (ex: Google OAuth, e-mail/senha com hash).
*   **Autorização:** Controle de acesso baseado em funções (administrador, membro da equipe).
*   **Dados do Slack/Teams:** Armazenar apenas o conteúdo necessário das mensagens e metadados. Não armazenar tokens de acesso de usuários individuais do Slack/Teams de forma persistente. Usar tokens de bot de curto prazo ou credenciais de aplicativo.
*   **Criptografia:** Dados em trânsito (TLS/SSL) e em repouso (criptografia de banco de dados).
*   **Conformidade:** Considerar requisitos básicos de LGPD/GDPR para o armazenamento de dados de usuários (anonimização, direito ao esquecimento).

### 6.3. Monitoramento e Logs

*   **Logs:** Geração de logs detalhados para todas as operações do bot e do painel web para depuração e auditoria.
*   **Monitoramento:** Configuração de alertas para erros e problemas de performance.

## 7. Estratégia de Monetização e Planos

### 7.1. Modelo de Precificação

*   **Freemium:** Um plano gratuito para equipes pequenas e uso limitado.
*   **Assinatura Mensal:** Planos pagos baseados no número de usuários e/ou volume de arquivamentos/buscas.

### 7.2. Planos Sugeridos

*   **Plano Free:**
    *   Até 5 usuários.
    *   Até 50 arquivamentos/mês.
    *   Acesso ao Core MVP (captura e base de conhecimento).
    *   Busca básica.
*   **Plano Starter (US$ 29/mês):**
    *   Até 25 usuários.
    *   Até 200 arquivamentos/mês.
    *   Core MVP + Suboportunidade 1 (Integração de Saída para Wikis).
    *   Busca avançada.
*   **Plano Business (US$ 59/mês):**
    *   Usuários ilimitados.
    *   Arquivamentos ilimitados.
    *   Core MVP + Suboportunidade 1 + Suboportunidade 2 (Respostas Proativas do Bot) + Suboportunidade 3 (Painel de Análise).
    *   Suporte prioritário.

## 8. Requisitos de Interface do Usuário (UI) e Experiência do Usuário (UX)

### 8.1. Simplicidade e Intuitividade

*   **Painel Web:** Design limpo, minimalista, focado na funcionalidade.
*   **Bot:** Mensagens claras e concisas do bot, sem jargões técnicos.

### 8.2. Responsividade

*   O painel web deve ser totalmente responsivo, funcionando bem em desktops, tablets e smartphones.

## 9. Considerações de Marketing e Lançamento

### 9.1. Landing Page

*   Uma landing page clara e concisa explicando o problema, a solução e os benefícios.
*   Call-to-action para inscrição (lista de espera ou teste gratuito).

### 9.2. Canais de Aquisição (Iniciais)

*   **Comunidades:** Reddit (r/slack, r/sysadmin, r/saas), Indie Hackers, Hacker News.
*   **Conteúdo:** Blog posts sobre "como gerenciar conhecimento no Slack", "alternativas ao Confluence para pequenas equipes".
*   **Parcerias:** Com influenciadores de produtividade ou ferramentas complementares.

## 10. Métricas de Sucesso do MVP

*   **Adoção:** Número de equipes que instalam o bot.
*   **Engajamento:** Frequência de uso do emoji de arquivamento.
*   **Retenção:** Percentual de equipes que continuam usando após 30/60/90 dias.
*   **Conversão:** Percentual de usuários Freemium que migram para planos pagos.
*   **Feedback:** Coleta ativa de feedback dos usuários para iterar e melhorar o produto.

## 11. Próximos Passos Pós-MVP

*   **Integrações:** Adicionar suporte a outras plataformas de comunicação (Discord, Google Chat).
*   **IA Avançada:** Implementar sumarização automática de threads, busca semântica.
*   **Customização:** Mais opções de customização para o bot e o painel.
*   **Relatórios:** Relatórios mais aprofundados sobre o uso do conhecimento.