-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TEACHER', 'ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "TypeContent" AS ENUM ('TEXT', 'IMAGE');

-- CreateEnum
CREATE TYPE "TypeActivity" AS ENUM ('YES_NO', 'QUIZ', 'OPEN_ANSWERS', 'OPEN_TEXT', 'CROSSWORD', 'ALPHABET_SOUP');

-- CreateEnum
CREATE TYPE "TypeMultimedia" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "user" VARCHAR(50) NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "genre" VARCHAR(1),
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "identification" VARCHAR(15),
    "birth_date" DATE NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_pending" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "city" VARCHAR(150) NOT NULL,
    "interests" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "have_dyslexia" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses_students" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "custom_prompt" TEXT,
    "problems" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "courses_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "goals" TEXT NOT NULL,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "course_id" TEXT NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readings" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "goals" TEXT NOT NULL,
    "length" VARCHAR(50),
    "status" BOOLEAN NOT NULL DEFAULT true,
    "level_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "autogenerate" BOOLEAN NOT NULL DEFAULT false,
    "custom_prompt" TEXT,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_readings" (
    "id" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "front_page_id" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "audio_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "number_of_images" INTEGER,

    CONSTRAINT "detail_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students_on_readings" (
    "course_student_id" TEXT NOT NULL,
    "detail_reading_id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "students_on_readings_pkey" PRIMARY KEY ("course_student_id","detail_reading_id")
);

-- CreateTable
CREATE TABLE "contents_lecture" (
    "id" TEXT NOT NULL,
    "detail_lecture_id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "type" "TypeContent" NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "image_id" TEXT,

    CONSTRAINT "contents_lecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type_activity" "TypeActivity" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "detail_lecture_id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_activities" (
    "id" TEXT NOT NULL,
    "question" VARCHAR(255) NOT NULL,
    "activity_id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "question_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_activities" (
    "id" TEXT NOT NULL,
    "answer" VARCHAR(255) NOT NULL,
    "is_correct" BOOLEAN DEFAULT false,
    "question_id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "answer_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multimedia" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "type" "TypeMultimedia" NOT NULL,
    "file_name" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "detail_reading_audio_id" TEXT,

    CONSTRAINT "multimedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "recommendation" TEXT,
    "reponses" JSON[] DEFAULT ARRAY[]::JSON[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "activityId" TEXT NOT NULL,
    "courseStudentId" TEXT NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_spend" (
    "id" TEXT NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "detail_lecture_id" TEXT,
    "activityId" TEXT,
    "courseStudentId" TEXT NOT NULL,

    CONSTRAINT "time_spend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_key" ON "users"("user");

-- CreateIndex
CREATE UNIQUE INDEX "users_identification_key" ON "users"("identification");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "detail_readings_audio_id_key" ON "detail_readings"("audio_id");

-- CreateIndex
CREATE UNIQUE INDEX "multimedia_detail_reading_audio_id_key" ON "multimedia"("detail_reading_audio_id");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses_students" ADD CONSTRAINT "courses_students_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses_students" ADD CONSTRAINT "courses_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_readings" ADD CONSTRAINT "detail_readings_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "readings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_readings" ADD CONSTRAINT "detail_readings_front_page_id_fkey" FOREIGN KEY ("front_page_id") REFERENCES "multimedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_readings" ADD CONSTRAINT "detail_readings_audio_id_fkey" FOREIGN KEY ("audio_id") REFERENCES "multimedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_on_readings" ADD CONSTRAINT "students_on_readings_course_student_id_fkey" FOREIGN KEY ("course_student_id") REFERENCES "courses_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_on_readings" ADD CONSTRAINT "students_on_readings_detail_reading_id_fkey" FOREIGN KEY ("detail_reading_id") REFERENCES "detail_readings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents_lecture" ADD CONSTRAINT "contents_lecture_detail_lecture_id_fkey" FOREIGN KEY ("detail_lecture_id") REFERENCES "detail_readings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents_lecture" ADD CONSTRAINT "contents_lecture_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "multimedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_detail_lecture_id_fkey" FOREIGN KEY ("detail_lecture_id") REFERENCES "detail_readings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_activities" ADD CONSTRAINT "question_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_activities" ADD CONSTRAINT "answer_activities_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_courseStudentId_fkey" FOREIGN KEY ("courseStudentId") REFERENCES "courses_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_spend" ADD CONSTRAINT "time_spend_detail_lecture_id_fkey" FOREIGN KEY ("detail_lecture_id") REFERENCES "detail_readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_spend" ADD CONSTRAINT "time_spend_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_spend" ADD CONSTRAINT "time_spend_courseStudentId_fkey" FOREIGN KEY ("courseStudentId") REFERENCES "courses_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
