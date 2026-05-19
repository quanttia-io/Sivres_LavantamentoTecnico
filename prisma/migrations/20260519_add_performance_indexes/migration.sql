-- Índices de performance para vistorias (queries com deletedAt + filtros frequentes)
CREATE INDEX IF NOT EXISTS "vistorias_deletedAt_createdAt_idx" ON "vistorias"("deletedAt", "createdAt");
CREATE INDEX IF NOT EXISTS "vistorias_consultorId_deletedAt_idx" ON "vistorias"("consultorId", "deletedAt");
CREATE INDEX IF NOT EXISTS "vistorias_supervisorId_deletedAt_idx" ON "vistorias"("supervisorId", "deletedAt");
CREATE INDEX IF NOT EXISTS "vistorias_status_deletedAt_idx" ON "vistorias"("status", "deletedAt");

-- Índices para notificações (contagem de não lidas + listagem por usuário)
CREATE INDEX IF NOT EXISTS "notificacoes_userId_lida_idx" ON "notificacoes"("userId", "lida");
CREATE INDEX IF NOT EXISTS "notificacoes_userId_createdAt_idx" ON "notificacoes"("userId", "createdAt");

-- Índice para lookup de opex (precificação)
CREATE INDEX IF NOT EXISTS "opex_central_periodo_tipo_idx" ON "opex_central"("periodoAtendimento", "tipoCondominio");

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS "audit_logs_vistoriaId_idx" ON "audit_logs"("vistoriaId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
