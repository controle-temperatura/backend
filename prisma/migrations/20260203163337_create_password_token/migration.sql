-- CreateTable
CREATE TABLE "CreatePasswordToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatePasswordToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatePasswordToken_tokenHash_key" ON "CreatePasswordToken"("tokenHash");

-- CreateIndex
CREATE INDEX "CreatePasswordToken_userId_idx" ON "CreatePasswordToken"("userId");

-- CreateIndex
CREATE INDEX "CreatePasswordToken_expiresAt_idx" ON "CreatePasswordToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "CreatePasswordToken" ADD CONSTRAINT "CreatePasswordToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
