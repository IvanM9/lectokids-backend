-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "first_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_date" TIMESTAMPTZ,
    "user_id" TEXT NOT NULL,
    "failed" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" VARCHAR(45),
    "device" VARCHAR(100),
    "location" VARCHAR(100),
    "is_active" BOOLEAN DEFAULT true,
    "expires_date" TIMESTAMP NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
