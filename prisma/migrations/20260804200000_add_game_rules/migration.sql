-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "ruleBonusX2" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rulePenalties" BOOLEAN NOT NULL DEFAULT false;
