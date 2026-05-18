-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERVISOR', 'CONSULTOR', 'GESTOR', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "TipoPortaria" AS ENUM ('ASSISTIDA', 'AUTONOMA', 'CONTROLE_ACESSO');

-- CreateEnum
CREATE TYPE "TipoRecolhimento" AS ENUM ('DIURNO', 'NOTURNO');

-- CreateEnum
CREATE TYPE "VistoriaStatus" AS ENUM ('EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "FotoCategoria" AS ENUM ('FRENTE_CONDOMINIO', 'PORTAO_VEICULAR_FRENTE', 'PORTAO_VEICULAR_COSTAS', 'PORTAO_PEDESTRE_FRENTE', 'PORTAO_PEDESTRE_COSTAS', 'ELEVADORES', 'HALL', 'GUARITA', 'LIXEIRA', 'VISTA_SUPERIOR_MAPS', 'OUTROS');

-- CreateEnum
CREATE TYPE "AnexoTipo" AS ENUM ('CROQUI', 'PROJETO_TECNICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "AssinaturaTipo" AS ENUM ('SUPERVISOR', 'CONSULTOR');

-- CreateEnum
CREATE TYPE "AprovacaoAcao" AS ENUM ('APROVADO', 'REPROVADO', 'SOLICITADO_AJUSTE');

-- CreateEnum
CREATE TYPE "NotificacaoTipo" AS ENUM ('NOVA_VISTORIA', 'APROVACAO', 'REPROVACAO', 'SOLICITACAO_AJUSTE', 'EDICAO_SOLICITADA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONSULTOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condominios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condominios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vistoria_sequences" (
    "ano" INTEGER NOT NULL,
    "ultimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vistoria_sequences_pkey" PRIMARY KEY ("ano")
);

-- CreateTable
CREATE TABLE "vistorias" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "condominioId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "consultorId" TEXT NOT NULL,
    "tipoPortaria" "TipoPortaria" NOT NULL,
    "qtdUnidades" INTEGER,
    "qtdPortoesVeiculares" INTEGER,
    "qtdPortoesPedestres" INTEGER,
    "qtdElevadores" INTEGER,
    "possuiLixeira" BOOLEAN NOT NULL DEFAULT false,
    "tipoRecolhimento" "TipoRecolhimento",
    "observacoesGerais" TEXT,
    "status" "VistoriaStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "vistorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "custo" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vistoria_itens" (
    "id" TEXT NOT NULL,
    "vistoriaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "custoUnit" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vistoria_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "tipoPortaria" "TipoPortaria" NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_itens" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "template_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "tipoPortaria" "TipoPortaria" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "pergunta" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vistoria_checklist_itens" (
    "id" TEXT NOT NULL,
    "vistoriaId" TEXT NOT NULL,
    "checklistTemplateId" TEXT NOT NULL,
    "resposta" BOOLEAN,
    "observacao" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vistoria_checklist_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vistoria_fotos" (
    "id" TEXT NOT NULL,
    "vistoriaId" TEXT NOT NULL,
    "categoria" "FotoCategoria" NOT NULL,
    "descricao" TEXT,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanhoBytes" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vistoria_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vistoria_anexos" (
    "id" TEXT NOT NULL,
    "vistoriaId" TEXT NOT NULL,
    "tipo" "AnexoTipo" NOT NULL,
    "nome" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vistoria_anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "vistoriaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "AssinaturaTipo" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edit_locks" (
    "id" TEXT NOT NULL,
    "vistoriaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edit_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aprovacoes" (
    "id" TEXT NOT NULL,
    "vistoriaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acao" "AprovacaoAcao" NOT NULL,
    "comentario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aprovacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "vistoriaId" TEXT,
    "userId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vistoriaId" TEXT,
    "tipo" "NotificacaoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "condominios_nome_endereco_key" ON "condominios"("nome", "endereco");

-- CreateIndex
CREATE UNIQUE INDEX "vistorias_numero_key" ON "vistorias"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_key" ON "produtos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "vistoria_itens_vistoriaId_produtoId_key" ON "vistoria_itens"("vistoriaId", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "templates_tipoPortaria_key" ON "templates"("tipoPortaria");

-- CreateIndex
CREATE UNIQUE INDEX "template_itens_templateId_produtoId_key" ON "template_itens"("templateId", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "vistoria_checklist_itens_vistoriaId_checklistTemplateId_key" ON "vistoria_checklist_itens"("vistoriaId", "checklistTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "vistoria_fotos_storageKey_key" ON "vistoria_fotos"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "vistoria_anexos_storageKey_key" ON "vistoria_anexos"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_storageKey_key" ON "assinaturas"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_vistoriaId_tipo_key" ON "assinaturas"("vistoriaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "edit_locks_vistoriaId_key" ON "edit_locks"("vistoriaId");

-- AddForeignKey
ALTER TABLE "vistorias" ADD CONSTRAINT "vistorias_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "condominios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistorias" ADD CONSTRAINT "vistorias_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistorias" ADD CONSTRAINT "vistorias_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistoria_itens" ADD CONSTRAINT "vistoria_itens_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistoria_itens" ADD CONSTRAINT "vistoria_itens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_itens" ADD CONSTRAINT "template_itens_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_itens" ADD CONSTRAINT "template_itens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistoria_checklist_itens" ADD CONSTRAINT "vistoria_checklist_itens_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistoria_checklist_itens" ADD CONSTRAINT "vistoria_checklist_itens_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistoria_fotos" ADD CONSTRAINT "vistoria_fotos_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vistoria_anexos" ADD CONSTRAINT "vistoria_anexos_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edit_locks" ADD CONSTRAINT "edit_locks_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edit_locks" ADD CONSTRAINT "edit_locks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovacoes" ADD CONSTRAINT "aprovacoes_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovacoes" ADD CONSTRAINT "aprovacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "vistorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
