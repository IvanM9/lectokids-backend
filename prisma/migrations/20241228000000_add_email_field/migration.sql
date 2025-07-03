-- AddColumn
ALTER TABLE "users" ADD COLUMN "email" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");