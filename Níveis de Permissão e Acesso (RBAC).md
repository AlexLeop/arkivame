# Níveis de Permissão e Acesso (RBAC): Arkivame

## 1. Introdução

Este documento define o modelo de Controle de Acesso Baseado em Papéis (RBAC - Role-Based Access Control) para o Arkivame. O objetivo é garantir que os usuários tenham acesso apenas às funcionalidades e dados apropriados para seu papel dentro da equipe, assegurando a segurança, a privacidade e uma experiência de usuário clara.

## 2. Definição de Papéis (Roles)

O Arkivame opera com uma hierarquia de papéis clara para garantir a segurança e a gestão adequada da plataforma e dos dados do cliente.

*   **Super Administrador (`super_admin`):**
    *   **Definição:** O proprietário e administrador do serviço Arkivame. Este papel é para uso interno da equipe do Arkivame para fins de manutenção, suporte e administração geral do sistema.
    *   **Responsabilidade:** Gerenciar todas as organizações, usuários e dados dentro da plataforma.

*   **Administrador (`admin`):**
    *   **Definição:** O acesso da organização (cliente). Um usuário que é administrador ou proprietário da conta da equipe no Arkivame. Geralmente, é a pessoa que instala o aplicativo e gerencia a assinatura.
    *   **Responsabilidade:** Gerenciar as configurações da equipe, integrações, faturamento e ter uma visão completa do conhecimento da sua equipe.

*   **Usuário (`user`):**
    *   **Definição:** Os membros da organização cliente. Qualquer usuário regular do workspace no Slack/Teams que não seja um Administrador.
    *   **Responsabilidade:** Contribuir para a base de conhecimento (arquivando conteúdo) e consumir o conhecimento (buscando e visualizando).

*   **Convidado (`guest`):**
    *   **Definição:** Usuários com acesso limitado no workspace (ex: convidados de canal único no Slack). Por padrão, convidados não terão permissão para interagir com o Arkivame para garantir a privacidade dos dados da equipe.

## 3. Matriz de Permissões

A tabela a seguir detalha as permissões para cada papel nas diferentes áreas do produto.

| Funcionalidade                                     | `super_admin` | `admin`         | `user`          | Notas                                                                                                                                      |
| :------------------------------------------------- | :-----------: | :-------------: | :-------------: | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **Interação no Chat (Slack/Teams)**                |                       |                 |                                                                                                                                  |
| Arquivar conteúdo (reação com emoji)               |           ✅           |        ✅        | Funcionalidade principal, disponível para todos os membros da equipe (exceto convidados).                                        |
| Receber sugestões do "Guardião do Conhecimento"    |           ✅           |        ✅        | O bot responde a perguntas de todos os membros, sugerindo conteúdo relevante.                                                    |
| Receber notificações de confirmação de arquivamento |           ✅           |        ✅        | O usuário que arquivou recebe a confirmação.                                                                                     |
|                                                    |                       |                 |                                                                                                                                  |
| **Painel Web do Arkivame**                         |                       |                 |                                                                                                                                  |
| Acessar o painel web e fazer login                 |           ✅           |        ✅        |        ✅        | Todos os membros podem acessar o painel para visualizar o conhecimento da sua equipe.                                                    |
| Visualizar todos os itens arquivados da equipe     |           ✅           |        ✅        |        ✅        | O conhecimento é da equipe, portanto, todos os membros podem ver tudo o que foi arquivado pela sua equipe.                             |
| Realizar buscas na base de conhecimento            |           ✅           |        ✅        |        ✅        | A funcionalidade de busca é central e disponível para todos.                                                                             |
| Enviar item para Wiki (Notion, Confluence)         |           ✅           |        ✅        |        ✅        | Permite que qualquer membro ajude a manter a documentação oficial atualizada.                                                            |
| Editar/Excluir um item arquivado                   |           ✅           |        ✅        |        ⚠️        | **`admin`**: Pode editar/excluir qualquer item da sua equipe. **`user`**: Pode editar/excluir apenas os itens que ele mesmo arquivou. |
|                                                    |                       |                 |                                                                                                                                  |
| **Painel de Administração (Apenas Admins)**        |                       |                 |                                                                                                                                  |
| Gerenciar assinatura e faturamento                 |           ✅           |        ✅        |        ❌        | Apenas `admin` e `super_admin` podem visualizar e alterar informações de pagamento e do plano.                                           |
| Configurar integrações (ex: chaves de API da Wiki) |           ✅           |        ✅        |        ❌        | A configuração de integrações com outras ferramentas é uma responsabilidade administrativa.                                              |
| Acessar o "Analista de Conhecimento" (Analytics)   |           ✅           |        ✅        |        ❌        | Dashboards com métricas de uso e insights são destinados à gestão (`admin`) e à administração do sistema (`super_admin`).              |
| Configurar o bot (ex: mudar emoji, limites)        |           ✅           |        ✅        |        ❌        | Configurações globais que afetam toda a equipe são controladas pelos administradores.                                                    |
| Gerenciar permissões de usuários (futuro)          |           ✅           |        ✅        |        ❌        | No futuro, um `admin` poderá promover um `user` a `admin` dentro do Arkivame.                                                             |
| Excluir todos os dados da equipe (LGPD/GDPR)       |           ✅           |        ✅        |        ❌        | Garante o controle sobre os dados da empresa, em conformidade com as leis de privacidade.                                                |

## 4. Justificativa do Design de Permissões

*   **Colaboração Aberta:** A decisão de permitir que todos os **Membros** possam ver todo o conteúdo arquivado e enviá-lo para wikis se baseia na filosofia de que o conhecimento pertence à equipe. Isso incentiva a colaboração e a responsabilidade compartilhada pela documentação.
*   **Segurança e Controle:** As funcionalidades de gestão, configuração e análise, que têm impacto estratégico ou financeiro, são centralizadas nos **Administradores (`admin`)** para garantir controle e segurança.
*   **Responsabilidade Individual:** Permitir que um **Usuário (`user`)** edite ou exclua apenas o que ele mesmo arquivou evita a remoção acidental de conhecimento valioso por outros, mas ainda dá ao autor original o controle sobre seu próprio conteúdo.

Este documento serve como um guia para o desenvolvimento e deve ser refletido na documentação do produto para que os clientes entendam claramente como o Arkivame funciona.
