/*
  Warnings:

  - A unique constraint covering the columns `[account]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Users_account_key` ON `Users`(`account`);
