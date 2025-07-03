/*
  Warnings:

  - Added the required column `face_scan` to the `visitor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "visitor" ADD COLUMN     "face_descriptor" DOUBLE PRECISION[],
ADD COLUMN     "face_scan" BYTEA NOT NULL;
