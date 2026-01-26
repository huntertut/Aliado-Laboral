-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT,
    "phoneNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'worker',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pushToken" TEXT,
    "preferredGateway" TEXT,
    "stripeCustomerId" TEXT,
    "mercadopagoCustomerId" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "subscriptionLevel" TEXT NOT NULL DEFAULT 'basic',
    "profileStatus" TEXT NOT NULL DEFAULT 'active',
    "planExpiresAt" DATETIME,
    "hasAcceptedDataSharing" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firebaseUid" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "occupation" TEXT,
    "federalEntity" TEXT,
    "startDate" DATETIME,
    "monthlySalary" DECIMAL,
    "profedetIsActive" BOOLEAN NOT NULL DEFAULT false,
    "profedetStage" TEXT,
    "profedetCaseFile" TEXT,
    "profedetInitialContact" TEXT,
    "profedetDocuments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LegalCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "employerName" TEXT,
    "startDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LegalCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseHistory_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "LegalCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "historyId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "encryptionKeyId" TEXT,
    CONSTRAINT "EvidenceFile_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "CaseHistory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalculationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailySalary" DECIMAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "resultJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalculationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lawyer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "specialty" TEXT,
    "professionalName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "acceptsPymeClients" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripePaymentMethodId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive',
    "subscriptionEndDate" DATETIME,
    "nationalScope" BOOLEAN NOT NULL DEFAULT false,
    "availableStates" TEXT DEFAULT '',
    "acceptsFederalCases" BOOLEAN NOT NULL DEFAULT false,
    "acceptsLocalCases" BOOLEAN NOT NULL DEFAULT false,
    "requiresPhysicalPresence" BOOLEAN NOT NULL DEFAULT true,
    "physicalPresenceStates" TEXT DEFAULT '',
    "isCorrespondent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Lawyer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LawyerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lawyerId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "wonCase1Summary" TEXT,
    "wonCase2Summary" TEXT,
    "wonCase3Summary" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "attentionHours" TEXT,
    "schedule" TEXT,
    "email" TEXT,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "successRate" REAL DEFAULT 0,
    "reputationScore" REAL NOT NULL DEFAULT 50.0,
    "totalCases" INTEGER NOT NULL DEFAULT 0,
    "successfulCases" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LawyerProfile_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "amount" DECIMAL NOT NULL DEFAULT 29.00,
    "paymentProvider" TEXT,
    "lastPaymentId" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerSubscriptionPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentProvider" TEXT,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkerSubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "WorkerSubscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LawyerSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lawyerId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "amount" DECIMAL NOT NULL DEFAULT 99.00,
    "paymentMethod" TEXT,
    "lastPaymentId" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LawyerSubscription_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "LawyerSubscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "lawyerProfileId" TEXT NOT NULL,
    "caseSummary" TEXT NOT NULL,
    "caseType" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "urgencyScore" INTEGER NOT NULL DEFAULT 0,
    "consentTimestamp" DATETIME,
    "dataStatus" TEXT NOT NULL DEFAULT 'MASKED',
    "aiSummary" TEXT,
    "crmStatus" TEXT NOT NULL DEFAULT 'NEW',
    "classification" TEXT NOT NULL DEFAULT 'normal',
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "workerPaymentAmount" DECIMAL NOT NULL DEFAULT 50.00,
    "lawyerPaymentAmount" DECIMAL NOT NULL DEFAULT 150.00,
    "workerPaid" BOOLEAN NOT NULL DEFAULT false,
    "lawyerPaid" BOOLEAN NOT NULL DEFAULT false,
    "leadCostPaid" DECIMAL,
    "openingFeePaid" DECIMAL,
    "workerPaymentGateway" TEXT,
    "workerTransactionId" TEXT,
    "lawyerPaymentGateway" TEXT NOT NULL DEFAULT 'stripe',
    "lawyerTransactionId" TEXT,
    "bothPaymentsSucceeded" BOOLEAN NOT NULL DEFAULT false,
    "refundStatus" TEXT NOT NULL DEFAULT 'not_applicable',
    "refundProcessedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "rejectedAt" DATETIME,
    "expiredAt" DATETIME,
    "rejectionReason" TEXT,
    "lastWorkerActivityAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "lastLawyerActivityAt" DATETIME,
    "subStatus" TEXT,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageContent" TEXT,
    "lastMessageSenderId" TEXT,
    "lastMessageAt" DATETIME,
    "unreadCountLawyer" INTEGER NOT NULL DEFAULT 0,
    "unreadCountWorker" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ContactRequest_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContactRequest_lawyerProfileId_fkey" FOREIGN KEY ("lawyerProfileId") REFERENCES "LawyerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "status" TEXT NOT NULL DEFAULT 'delivered',
    "seenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ContactRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequestDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequestDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ContactRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequestPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "RequestPayment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ContactRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "relatedUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "LegalNews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "titleClickable" TEXT NOT NULL,
    "summaryWorker" TEXT NOT NULL,
    "summarySme" TEXT NOT NULL,
    "summaryLawyer" TEXT NOT NULL,
    "quizQuestion" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PymeProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rfc" TEXT,
    "razonSocial" TEXT,
    "industry" TEXT,
    "internalRegsStatus" TEXT NOT NULL DEFAULT 'pending',
    "assignedLawyerId" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PymeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PymeProfile_assignedLawyerId_fkey" FOREIGN KEY ("assignedLawyerId") REFERENCES "Lawyer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PymeEmployee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pymeProfileId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "rfc" TEXT,
    "dailySalary" DECIMAL NOT NULL DEFAULT 0.0,
    "joinDate" DATETIME NOT NULL,
    "contractType" TEXT NOT NULL DEFAULT 'permanent',
    "contractEndDate" DATETIME,
    "isRenewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PymeEmployee_pymeProfileId_fkey" FOREIGN KEY ("pymeProfileId") REFERENCES "PymeProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PymeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pymeProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PymeDocument_pymeProfileId_fkey" FOREIGN KEY ("pymeProfileId") REFERENCES "PymeProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ForumPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ForumAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "lawyerId" TEXT,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForumAnswer_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ForumAnswer_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumAnswer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ForumAnswer_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ForumAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ForumVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForumVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ForumVote_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ForumAnswer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LawyerReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT,
    "lawyerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LawyerReview_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LawyerReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_firebaseUid_key" ON "UserRole"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_key" ON "UserRole"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Lawyer_userId_key" ON "Lawyer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Lawyer_licenseNumber_key" ON "Lawyer"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerProfile_lawyerId_key" ON "LawyerProfile"("lawyerId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerSubscription_userId_key" ON "WorkerSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerSubscription_lawyerId_key" ON "LawyerSubscription"("lawyerId");

-- CreateIndex
CREATE UNIQUE INDEX "PymeProfile_userId_key" ON "PymeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumVote_userId_answerId_key" ON "ForumVote"("userId", "answerId");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerReview_caseId_key" ON "LawyerReview"("caseId");
