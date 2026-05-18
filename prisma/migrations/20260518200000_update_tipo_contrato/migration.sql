-- Remove COMODATO_12 and COMODATO_24, add COMODATO_48
-- PostgreSQL does not support DROP VALUE on enums, so we recreate the type.

-- First add COMODATO_48 (ADD VALUE works without recreation)
ALTER TYPE "TipoContrato" ADD VALUE IF NOT EXISTS 'COMODATO_48';

-- Update any rows with the old values to COMODATO_36 (safety net)
UPDATE "vistorias" SET "tipoContrato" = 'COMODATO_36'
WHERE "tipoContrato" IN ('COMODATO_12', 'COMODATO_24');

-- Recreate enum without the old values
ALTER TYPE "TipoContrato" RENAME TO "TipoContrato_old";
CREATE TYPE "TipoContrato" AS ENUM ('COMODATO_36', 'COMODATO_48', 'VENDA');
ALTER TABLE "vistorias"
  ALTER COLUMN "tipoContrato" TYPE "TipoContrato"
  USING "tipoContrato"::text::"TipoContrato";
DROP TYPE "TipoContrato_old";
