/*
  Warnings:

  - You are about to drop the column `permission` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `users` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `Shops` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `Users_roleId_fkey`;

-- AlterTable
ALTER TABLE `roles` DROP COLUMN `permission`;

-- AlterTable
ALTER TABLE `shops` ADD COLUMN `roleId` VARCHAR(30) NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `roleId`;

-- CreateTable
CREATE TABLE `Permissions` (
    `id` VARCHAR(50) NOT NULL,
    `roleId` VARCHAR(30) NOT NULL,
    `permission` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Permissions` ADD CONSTRAINT `Permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shops` ADD CONSTRAINT `Shops_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
