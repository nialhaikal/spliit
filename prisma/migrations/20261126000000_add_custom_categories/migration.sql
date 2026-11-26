-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Category_groupId_idx" ON "Category"("groupId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_categoryId_fkey";

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- The built-in categories were inserted with explicit ids, which left the id
-- sequence at its start; move it past them so new categories don't collide.
SELECT setval(pg_get_serial_sequence('"Category"', 'id'), (SELECT MAX("id") FROM "Category"));
