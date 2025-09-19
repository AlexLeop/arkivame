# Arkivame

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-13.4.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.7.0-2D3748?logo=prisma)](https://www.prisma.io/)

O Arkivame é uma plataforma SaaS que transforma conversas de equipe em uma base de conhecimento organizada e pesquisável. Com foco em resolver o problema da "amnésia corporativa", o Arkivame permite que equipes capturem e organizem informações importantes de forma simples e eficiente.

## 🚀 Funcionalidades Principais

- **Captura Inteligente**: Salve threads importantes do Slack, Discord e outras plataformas com um simples comando.
- **Base de Conhecimento Centralizada**: Todas as informações importantes em um só lugar, facilmente pesquisável.
- **Integrações**: Conecte-se com diversas ferramentas populares de comunicação e produtividade.
- **Sugestões Inteligentes**: Receba sugestões de conteúdo relevante baseadas em IA.
- **Painel de Análise**: Acompanhe métricas de engajamento e uso da plataforma.

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma, PostgreSQL
- **Autenticação**: NextAuth.js
- **Fila de Processamento**: BullMQ com Redis
- **Pagamentos**: Stripe
- **Monitoramento**: Sentry
- **Testes**: Jest, React Testing Library

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Docker (para banco de dados local)
- Conta no Stripe (para processamento de pagamentos)
- Conta no Sentry (para monitoramento de erros)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone [URL_DO_REPOSITORIO]
   cd app
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```
   Preencha as variáveis necessárias no arquivo `.env.local`.

4. **Inicie o banco de dados**
   ```bash
   docker-compose up -d
   ```

5. **Execute as migrações do Prisma**
   ```bash
   npx prisma migrate dev
   ```

6. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

7. **Acesse a aplicação**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/arkivame?schema=public"

# Autenticação
NEXTAUTH_SECRET="seu-segredo-seguro"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Redis (para filas)
REDIS_URL="redis://localhost:6379"

# Sentry (opcional)
NEXT_PUBLIC_SENTRY_DSN=""
```

## 🧪 Testes

Para executar os testes:

```bash
npm test
# ou
yarn test
```

## 🛠️ Comandos Úteis

- `dev`: Inicia o servidor de desenvolvimento
- `build`: Constrói a aplicação para produção
- `start`: Inicia o servidor de produção
- `lint`: Executa o linter
- `test`: Executa os testes
- `prisma:migrate`: Executa as migrações do banco de dados
- `prisma:studio`: Abre o Prisma Studio para visualizar os dados

## 🤝 Contribuição

Contribuições são bem-vindas! Siga estes passos:

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Adicione suas mudanças (`git add .`)
4. Comite suas mudanças (`git commit -m 'Add some AmazingFeature'`)
5. Faça o Push da Branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Contato

Equipe Arkivame - [contato@arkivame.com](mailto:contato@arkivame.com)

---

Desenvolvido com ❤️ pela Equipe Arkivame
