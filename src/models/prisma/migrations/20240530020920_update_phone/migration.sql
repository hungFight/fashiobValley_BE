/*
  Warnings:

  - You are about to alter the column `email` on the `infos` table. The data in that column could be lost. The data in that column will be cast from `VarChar(200)` to `VarChar(100)`.
  - Added the required column `extraPassword` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `infos` MODIFY `phone` VARCHAR(20) NOT NULL,
    MODIFY `email` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `extraPassword` VARCHAR(100) NOT NULL,
    ADD COLUMN `password` VARCHAR(100) NOT NULL;
