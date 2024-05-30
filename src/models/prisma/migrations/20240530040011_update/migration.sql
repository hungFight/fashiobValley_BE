/*
  Warnings:

  - A unique constraint covering the columns `[permission]` on the table `Permissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `account` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `infos` MODIFY `email` VARCHAR(320) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `account` VARCHAR(320) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Permissions_permission_key` ON `Permissions`(`permission`);
