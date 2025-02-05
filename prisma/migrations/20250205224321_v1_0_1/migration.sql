/*
  Warnings:

  - You are about to drop the column `activityId` on the `scores` table. All the data in the column will be lost.
  - You are about to drop the column `courseStudentId` on the `scores` table. All the data in the column will be lost.
  - You are about to drop the column `activityId` on the `time_spend` table. All the data in the column will be lost.
  - You are about to drop the column `courseStudentId` on the `time_spend` table. All the data in the column will be lost.
  - Added the required column `activity_id` to the `scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_student_id` to the `scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_student_id` to the `time_spend` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "scores" DROP CONSTRAINT "scores_activityId_fkey";

-- DropForeignKey
ALTER TABLE "scores" DROP CONSTRAINT "scores_courseStudentId_fkey";

-- DropForeignKey
ALTER TABLE "time_spend" DROP CONSTRAINT "time_spend_activityId_fkey";

-- DropForeignKey
ALTER TABLE "time_spend" DROP CONSTRAINT "time_spend_courseStudentId_fkey";

-- AlterTable
ALTER TABLE "scores" DROP COLUMN "activityId",
DROP COLUMN "courseStudentId",
ADD COLUMN     "activity_id" TEXT NOT NULL,
ADD COLUMN     "course_student_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "time_spend" DROP COLUMN "activityId",
DROP COLUMN "courseStudentId",
ADD COLUMN     "activity_id" TEXT,
ADD COLUMN     "course_student_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_course_student_id_fkey" FOREIGN KEY ("course_student_id") REFERENCES "courses_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_spend" ADD CONSTRAINT "time_spend_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_spend" ADD CONSTRAINT "time_spend_course_student_id_fkey" FOREIGN KEY ("course_student_id") REFERENCES "courses_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
