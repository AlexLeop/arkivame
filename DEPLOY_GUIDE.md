# Guia de Deploy - Sistema Arkivame

## 🚀 Deploy em Produção

### Pré-requisitos

1. **Servidor Linux** (Ubuntu 20.04+ recomendado)
2. **Docker e Docker Compose** instalados
3. **Domínio configurado** com DNS apontando para o servidor
4. **Certificado SSL** (Let's Encrypt recomendado)

### Passo 1: Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

### Passo 2: Configuração do Projeto

```bash
# Clonar repositório
git clone <seu-repositorio>
cd arkivame

# Copiar arquivo de ambiente
cp .env.example .env.production

# Editar variáveis de ambiente
nano .env.production
```

### Passo 3: Configurar Variáveis de Ambiente

Edite o arquivo `.env.production` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://arkivame:sua_senha_segura@postgres:5432/arkivame"
POSTGRES_DB=arkivame
POSTGRES_USER=arkivame
POSTGRES_PASSWORD=sua_senha_segura

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-muito-segura-de-32-caracteres"
NEXTAUTH_URL="https://seu-dominio.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_sua_chave_stripe"
STRIPE_WEBHOOK_SECRET="whsec_sua_chave_webhook"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_sua_chave_publica"

# Redis
REDIS_PASSWORD=sua_senha_redis_segura

# Discord
DISCORD_PUBLIC_KEY="sua_chave_publica_discord"
DISCORD_BOT_TOKEN="seu_token_bot_discord"

# Slack
SLACK_BOT_TOKEN="xoxb-seu-token-slack"
SLACK_SIGNING_SECRET="seu_secret_slack"

# OpenAI
OPENAI_API_KEY="sk-sua-chave-openai"

# OAuth (opcional)
GOOGLE_CLIENT_ID="seu-client-id-google"
GOOGLE_CLIENT_SECRET="seu-client-secret-google"
GITHUB_CLIENT_ID="seu-client-id-github"
GITHUB_CLIENT_SECRET="seu-client-secret-github"

# Sentry (opcional)
NEXT_PUBLIC_SENTRY_DSN="https://sua-dsn-sentry"
```

### Passo 4: Configurar SSL

```bash
# Criar diretório para certificados
mkdir -p nginx/ssl

# Opção 1: Let's Encrypt (recomendado)
sudo apt install certbot
sudo certbot certonly --standalone -d seu-dominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem nginx/ssl/key.pem

# Opção 2: Certificado auto-assinado (apenas para teste)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### Passo 5: Deploy da Aplicação

```bash
# Carregar variáveis de ambiente
export $(cat .env.production | xargs)

# Executar migrações do banco
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Iniciar aplicação
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

### Passo 6: Configurar Integrações

#### Discord
1. Acesse o Discord Developer Portal
2. Configure o endpoint: `https://seu-dominio.com/api/integrations/discord`
3. Registre o slash command `/arkivame`

#### Slack
1. Acesse o Slack API
2. Configure o webhook: `https://seu-dominio.com/api/integrations/slack`
3. Configure o slash command `/arkivame`

#### Google Chat
1. Acesse o Google Cloud Console
2. Configure o webhook: `https://seu-dominio.com/api/integrations/google-chat`

#### Mattermost
1. Configure o webhook: `https://seu-dominio.com/api/integrations/mattermost`
2. Configure o slash command `/arkivame`

#### Stripe
1. Configure o webhook: `https://seu-dominio.com/api/webhooks/stripe`
2. Selecione os eventos necessários

### Passo 7: Verificação

```bash
# Verificar health check
curl https://seu-dominio.com/api/health

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f app

# Verificar banco de dados
docker-compose -f docker-compose.prod.yml exec postgres psql -U arkivame -d arkivame -c "SELECT COUNT(*) FROM users;"
```

## 🔧 Manutenção

### Backup do Banco de Dados

```bash
# Criar backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U arkivame arkivame > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U arkivame arkivame < backup_file.sql
```

### Atualização da Aplicação

```bash
# Parar aplicação
docker-compose -f docker-compose.prod.yml down

# Atualizar código
git pull origin main

# Executar migrações
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Rebuild e restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Monitoramento

```bash
# Verificar uso de recursos
docker stats

# Verificar logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Verificar status dos serviços
docker-compose -f docker-compose.prod.yml ps
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verificar variáveis de ambiente
   - Verificar se o PostgreSQL está rodando
   - Verificar logs: `docker-compose logs postgres`

2. **Erro de SSL**
   - Verificar se os certificados estão no local correto
   - Verificar permissões dos arquivos de certificado
   - Verificar configuração do Nginx

3. **Erro de integração**
   - Verificar URLs dos webhooks
   - Verificar tokens e chaves de API
   - Verificar logs da aplicação

### Logs Importantes

```bash
# Logs da aplicação
docker-compose -f docker-compose.prod.yml logs app

# Logs do banco
docker-compose -f docker-compose.prod.yml logs postgres

# Logs do Redis
docker-compose -f docker-compose.prod.yml logs redis

# Logs do Nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

## 📊 Monitoramento de Produção

### Métricas Importantes
- CPU e memória dos containers
- Conexões ativas do banco de dados
- Tempo de resposta das APIs
- Taxa de erro das requisições
- Uso do Redis

### Alertas Recomendados
- Falha no health check
- Alto uso de CPU/memória
- Muitas conexões no banco
- Erros 5xx frequentes
- Disco cheio

---

## ✅ Checklist de Deploy

- [ ] Servidor configurado com Docker
- [ ] Domínio configurado
- [ ] SSL configurado
- [ ] Variáveis de ambiente definidas
- [ ] Banco de dados configurado
- [ ] Redis configurado
- [ ] Aplicação deployada
- [ ] Integrações configuradas
- [ ] Health check funcionando
- [ ] Backup configurado
- [ ] Monitoramento ativo

**Parabéns! Seu sistema Arkivame está rodando em produção! 🎉**

