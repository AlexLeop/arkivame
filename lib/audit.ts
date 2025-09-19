import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import logger from '@/lib/logger';

export type AuditLogAction =
  | 'MEMBER_INVITED'
  | 'INVITE_RESENT'
  | 'INVITE_REVOKED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'ORG_SETTINGS_UPDATED'; // Adicione mais ações conforme necessário

/**
 * Registra um evento de auditoria para uma organização.
 * @param organizationId O ID da organização.
 * @param actorId O ID do usuário que realizou a ação.
 * @param action O tipo de ação realizada.
 * @param details Detalhes JSON adicionais sobre o evento.
 */
export async function logAudit(
  organizationId: string,
  actorId: string,
  action: AuditLogAction,
  details?: Prisma.JsonObject
) {
  try {
    await prisma.auditLog.create({
      data: { organizationId, actorId, action, details },
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        message: 'Falha ao criar log de auditoria',
        organizationId,
        actorId,
        action,
      },
      'Falha ao criar log de auditoria'
    );
    // Não queremos que a operação principal falhe se o log falhar,
    // mas devemos registrar o erro para monitoramento.
  }
}