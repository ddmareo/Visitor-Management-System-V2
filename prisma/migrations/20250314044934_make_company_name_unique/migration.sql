-- CreateEnum
CREATE TYPE "entry_method_enum" AS ENUM ('Walking', 'Vehicle_Roda_Dua', 'Vehicle_Roda_Empat');

-- CreateEnum
CREATE TYPE "user_role_enum" AS ENUM ('user', 'security', 'admin', 'sec_admin');

-- CreateEnum
CREATE TYPE "new_visit_category_enum" AS ENUM ('Meeting & Visits', 'Delivery', 'Working (Project & Repair)', 'VIP');

-- CreateTable
CREATE TABLE "employee" (
    "employee_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "department" VARCHAR(255),
    "position" VARCHAR(255),

    CONSTRAINT "employee_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "security" (
    "security_id" SERIAL NOT NULL,
    "security_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "security_pkey" PRIMARY KEY ("security_id")
);

-- CreateTable
CREATE TABLE "teammember" (
    "team_member_id" SERIAL NOT NULL,
    "visit_id" INTEGER,
    "member_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "teammember_pkey" PRIMARY KEY ("team_member_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "user_role_enum" NOT NULL,
    "employee_id" INTEGER,
    "security_id" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notif_id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mark_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notif_id")
);

-- CreateTable
CREATE TABLE "visit" (
    "visit_id" SERIAL NOT NULL,
    "visitor_id" INTEGER,
    "employee_id" INTEGER,
    "security_id" INTEGER,
    "visit_category" "new_visit_category_enum" NOT NULL,
    "entry_method" "entry_method_enum" NOT NULL,
    "vehicle_number" VARCHAR(20),
    "check_in_time" TIMESTAMP(6),
    "check_out_time" TIMESTAMP(6),
    "qr_code" VARCHAR(255),
    "verification_status" BOOLEAN DEFAULT false,
    "safety_permit" BYTEA,
    "brings_team" BOOLEAN DEFAULT false,
    "team_members_quantity" INTEGER,
    "entry_start_date" DATE NOT NULL,

    CONSTRAINT "visit_pkey" PRIMARY KEY ("visit_id")
);

-- CreateTable
CREATE TABLE "visitor" (
    "visitor_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "company_id" INTEGER NOT NULL,
    "id_number" VARCHAR(255) NOT NULL,
    "contact_phone" VARCHAR(15) NOT NULL,
    "contact_email" VARCHAR(100),
    "address" TEXT,
    "registration_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id_card" BYTEA,

    CONSTRAINT "visitor_pkey" PRIMARY KEY ("visitor_id")
);

-- CreateTable
CREATE TABLE "company" (
    "company_id" SERIAL NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "FormConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "fields" JSONB NOT NULL,

    CONSTRAINT "FormConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_name_key" ON "employee"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_email_key" ON "employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "unique_id_number" ON "visitor"("id_number");

-- CreateIndex
CREATE UNIQUE INDEX "company_company_name_key" ON "company"("company_name");

-- AddForeignKey
ALTER TABLE "teammember" ADD CONSTRAINT "teammember_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visit"("visit_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "security"("security_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit" ADD CONSTRAINT "visit_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "visit" ADD CONSTRAINT "visit_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "security"("security_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "visit" ADD CONSTRAINT "visit_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitor"("visitor_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "visitor" ADD CONSTRAINT "visitor_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE SET NULL ON UPDATE NO ACTION;
