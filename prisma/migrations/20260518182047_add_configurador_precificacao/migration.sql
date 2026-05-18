-- CreateEnum
CREATE TYPE "TipoCondominio" AS ENUM ('VERTICAL', 'HORIZONTAL');

-- CreateEnum
CREATE TYPE "PeriodoAtendimento" AS ENUM ('INTEGRAL', 'DIURNO', 'NOTURNO', 'DIURNO_FDS', 'NOTURNO_FDS');

-- CreateEnum
CREATE TYPE "InternetPagoPor" AS ENUM ('EMPRESA', 'CLIENTE');

-- CreateEnum
CREATE TYPE "MargemTipo" AS ENUM ('ESSENCIAL', 'COMPLETA');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('COMODATO_12', 'COMODATO_24', 'COMODATO_36', 'VENDA');

-- CreateEnum
CREATE TYPE "ClasseEquipamento" AS ENUM ('REDE', 'CONTROLE', 'VOIP', 'CFTV', 'AUTOMACAO', 'ENERGIA', 'INFRA', 'ALARME', 'PERIMETRO', 'DISPOSITIVO');

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "classeEquipamento" "ClasseEquipamento",
ADD COLUMN     "percentualRecuperavel" DECIMAL(5,2),
ADD COLUMN     "regraQtdAut" TEXT,
ADD COLUMN     "regraQtdRem" TEXT,
ADD COLUMN     "valorRecuperavel" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "vistoria_itens" ADD COLUMN     "autoGerado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "precoTotal" DECIMAL(10,2),
ADD COLUMN     "precoUnit" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "vistorias" ADD COLUMN     "capexTotal" DECIMAL(10,2),
ADD COLUMN     "celularZelador" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dadosConfiguracao" JSONB,
ADD COLUMN     "internetPagoPor" "InternetPagoPor",
ADD COLUMN     "margemTipo" "MargemTipo",
ADD COLUMN     "mensalidade" DECIMAL(10,2),
ADD COLUMN     "opexMensal" DECIMAL(10,2),
ADD COLUMN     "periodoAtendimento" "PeriodoAtendimento",
ADD COLUMN     "tipoCondominio" "TipoCondominio",
ADD COLUMN     "tipoContrato" "TipoContrato",
ADD COLUMN     "valorVenda" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "opex_central" (
    "id" TEXT NOT NULL,
    "periodoAtendimento" "PeriodoAtendimento" NOT NULL,
    "tipoCondominio" "TipoCondominio" NOT NULL,
    "faixaUnidadesMin" INTEGER NOT NULL,
    "faixaUnidadesMax" INTEGER NOT NULL,
    "custoMensal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "opex_central_pkey" PRIMARY KEY ("id")
);
