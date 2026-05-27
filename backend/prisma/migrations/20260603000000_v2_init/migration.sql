-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UnitSystem" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'ATHLETE_PRO', 'COACH');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'VOID', 'FAILED');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK_LATS', 'BACK_TRAPS', 'SHOULDERS_FRONT', 'SHOULDERS_SIDE', 'SHOULDERS_REAR', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE_ABS', 'CORE_OBLIQUES', 'GLUTES', 'QUADS', 'HAMSTRINGS', 'CALVES', 'NECK');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'KETTLEBELL', 'BAND', 'OTHER');

-- CreateEnum
CREATE TYPE "MovementPattern" AS ENUM ('PUSH', 'PULL', 'SQUAT', 'HINGE', 'CARRY', 'ROTATION', 'ISOLATION');

-- CreateEnum
CREATE TYPE "SetType" AS ENUM ('WARMUP', 'WORKING', 'DROP', 'RESTPAUSE', 'MYOREP', 'CLUSTER', 'AMRAP');

-- CreateEnum
CREATE TYPE "PRType" AS ENUM ('ONE_RM', 'VOLUME_BEST', 'REP_BEST');

-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('MEAT_PROTEIN', 'SEAFOOD', 'DAIRY', 'EGGS', 'GRAIN', 'VEGETABLE', 'FRUIT', 'NUTS_SEEDS', 'OIL_FAT', 'SAUCE_CONDIMENT', 'BEVERAGE', 'PROTEIN_POWDER', 'MEAL_REPLACEMENT', 'PROCESSED_FOOD', 'FAST_FOOD', 'RESTAURANT', 'OTHER');

-- CreateEnum
CREATE TYPE "MealSlot" AS ENUM ('PRE_WORKOUT', 'INTRA_WORKOUT', 'POST_WORKOUT', 'BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'PRE_DINNER', 'DINNER', 'LATE_NIGHT');

-- CreateEnum
CREATE TYPE "LastValueDomain" AS ENUM ('SET', 'MEAL_ITEM', 'SUPPLEMENT_DOSE');

-- CreateEnum
CREATE TYPE "TargetSource" AS ENUM ('AUTO_PREP', 'MANUAL', 'COACH');

-- CreateEnum
CREATE TYPE "PhotoAngle" AS ENUM ('FRONT', 'BACK', 'SIDE_LEFT', 'SIDE_RIGHT');

-- CreateEnum
CREATE TYPE "PhotoPose" AS ENUM ('RELAXED', 'FRONT_DOUBLE_BICEPS', 'BACK_DOUBLE_BICEPS', 'SIDE_CHEST', 'SIDE_TRICEPS', 'MOST_MUSCULAR', 'ABS_AND_THIGHS', 'QUARTER_TURN_LEFT', 'QUARTER_TURN_RIGHT', 'OTHER');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('SELF_ONLY', 'COACH_VISIBLE', 'PUBLIC_OPT_IN');

-- CreateEnum
CREATE TYPE "PrepPhase" AS ENUM ('OFFSEASON', 'PREP', 'PEAK_WEEK', 'STAGE_DAY', 'REBOUND');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('PENDING', 'SUBMITTED', 'COACH_REVIEWED', 'ACKNOWLEDGED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD_GROCERY', 'DINING_OUT', 'SUPPLEMENT', 'COACH_FEE', 'GYM_MEMBERSHIP', 'EQUIPMENT', 'APPAREL_POSING', 'COMPETITION_FEE', 'TRAVEL_COMPETITION', 'RECOVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurringCycle" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "InviteSource" AS ENUM ('COACH', 'ATHLETE');

-- CreateEnum
CREATE TYPE "CommentTarget" AS ENUM ('CHECK_IN', 'SESSION', 'MEAL', 'PHOTO', 'BODY_RECORD');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('PRE_WORKOUT_30M', 'REST_BETWEEN_SETS', 'MEAL_DUE', 'PROTEIN_DEFICIT_NIGHT', 'CHECKIN_SUNDAY_20', 'COACH_REPLY_RECEIVED', 'PEAK_WEEK_T_MINUS_7');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('PUSH', 'EMAIL');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('OK', 'CONFLICT', 'FAILED');

-- CreateEnum
CREATE TYPE "ControlledViewScope" AS ENUM ('SUMMARY', 'FULL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "gender" "Gender",
    "birth_date" DATE,
    "height_cm" DECIMAL(5,2),
    "initial_weight_kg" DECIMAL(6,2),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "unit_system" "UnitSystem" NOT NULL DEFAULT 'METRIC',
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "is_athlete" BOOLEAN NOT NULL DEFAULT true,
    "is_coach" BOOLEAN NOT NULL DEFAULT false,
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscription_expires_at" TIMESTAMP(3),
    "controlled_module_enabled" BOOLEAN NOT NULL DEFAULT false,
    "controlled_module_pin_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_label" TEXT,
    "user_agent" TEXT,
    "ip" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "rotated_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "user_id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "athlete_capacity" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "subscription_seats" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "athlete_user_id" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "subscription_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "paid_at" TIMESTAMP(3),
    "external_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT,
    "primary_muscle" "MuscleGroup" NOT NULL,
    "secondary_muscles" "MuscleGroup"[],
    "equipment" "Equipment" NOT NULL,
    "movement_pattern" "MovementPattern" NOT NULL,
    "video_url" TEXT,
    "thumbnail_url" TEXT,
    "is_official" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weeks" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_templates" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "day_of_week" INTEGER,
    "estimated_minutes" INTEGER,
    "rest_seconds_default" INTEGER NOT NULL DEFAULT 90,
    "notes" TEXT,

    CONSTRAINT "training_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_exercises" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "target_sets" INTEGER NOT NULL,
    "target_reps_min" INTEGER,
    "target_reps_max" INTEGER,
    "target_rir" DECIMAL(3,1),
    "target_rpe" DECIMAL(3,1),
    "rest_seconds" INTEGER,
    "tempo" TEXT,
    "notes" TEXT,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT,
    "session_date" DATE NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "overall_rpe" DECIMAL(3,1),
    "bodyweight_kg" DECIMAL(6,2),
    "notes" TEXT,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_exercises" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "template_exercise_id" TEXT,
    "notes" TEXT,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_entries" (
    "id" TEXT NOT NULL,
    "session_exercise_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "session_date" DATE NOT NULL,
    "set_index" INTEGER NOT NULL,
    "set_type" "SetType" NOT NULL,
    "weight_kg" DECIMAL(6,2),
    "reps" INTEGER,
    "duration_seconds" INTEGER,
    "distance_m" DECIMAL(8,2),
    "rir" DECIMAL(3,1),
    "rpe" DECIMAL(3,1),
    "tempo" TEXT,
    "rest_seconds" INTEGER,
    "is_failure" BOOLEAN NOT NULL DEFAULT false,
    "is_warmup" BOOLEAN NOT NULL DEFAULT false,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "set_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "record_type" "PRType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "reps" INTEGER,
    "weight_kg" DECIMAL(6,2),
    "achieved_at" TIMESTAMP(3) NOT NULL,
    "set_entry_id" TEXT,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_en" TEXT,
    "brand" TEXT,
    "barcode" TEXT,
    "kcal_per_100g" DECIMAL(8,2) NOT NULL,
    "protein_per_100g" DECIMAL(6,2) NOT NULL,
    "carbs_per_100g" DECIMAL(6,2) NOT NULL,
    "fat_per_100g" DECIMAL(6,2) NOT NULL,
    "fiber_per_100g" DECIMAL(6,2),
    "sugar_per_100g" DECIMAL(6,2),
    "sodium_mg_per_100g" DECIMAL(8,2),
    "potassium_mg_per_100g" DECIMAL(8,2),
    "default_serving_g" DECIMAL(8,2),
    "serving_name" TEXT,
    "category" "FoodCategory" NOT NULL,
    "is_official" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serving_count" INTEGER NOT NULL DEFAULT 1,
    "total_kcal" DECIMAL(8,2),
    "total_protein" DECIMAL(6,2),
    "total_carbs" DECIMAL(6,2),
    "total_fat" DECIMAL(6,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "grams" DECIMAL(8,2) NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meal_slot" "MealSlot" NOT NULL,
    "consumed_at" TIMESTAMP(3) NOT NULL,
    "meal_date" DATE NOT NULL,
    "is_planned" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "total_kcal" DECIMAL(8,2),
    "total_protein" DECIMAL(6,2),
    "total_carbs" DECIMAL(6,2),
    "total_fat" DECIMAL(6,2),
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_items" (
    "id" TEXT NOT NULL,
    "meal_log_id" TEXT NOT NULL,
    "food_id" TEXT,
    "recipe_id" TEXT,
    "grams" DECIMAL(8,2) NOT NULL,
    "snapshot_kcal" DECIMAL(8,2) NOT NULL,
    "snapshot_protein" DECIMAL(6,2) NOT NULL,
    "snapshot_carbs" DECIMAL(6,2) NOT NULL,
    "snapshot_fat" DECIMAL(6,2) NOT NULL,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prep_cycle_id" TEXT,
    "phase_config_id" TEXT,
    "total_kcal" INTEGER NOT NULL,
    "total_protein_g" INTEGER NOT NULL,
    "total_carbs_g" INTEGER NOT NULL,
    "total_fat_g" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "meal_plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_meals" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "meal_slot" "MealSlot" NOT NULL,
    "target_time" TEXT NOT NULL,
    "target_kcal" INTEGER NOT NULL,
    "target_protein_g" INTEGER NOT NULL,
    "target_carbs_g" INTEGER NOT NULL,
    "target_fat_g" INTEGER NOT NULL,
    "recipe_id" TEXT,
    "notes" TEXT,

    CONSTRAINT "scheduled_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_meal_ingredients" (
    "id" TEXT NOT NULL,
    "scheduled_meal_id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "grams" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "scheduled_meal_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ml" INTEGER NOT NULL,
    "consumed_at" TIMESTAMP(3) NOT NULL,
    "log_date" DATE NOT NULL,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electrolyte_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sodium_mg" DECIMAL(8,2),
    "potassium_mg" DECIMAL(8,2),
    "magnesium_mg" DECIMAL(8,2),
    "source" TEXT,
    "consumed_at" TIMESTAMP(3) NOT NULL,
    "log_date" DATE NOT NULL,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "electrolyte_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "last_value_cache" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "domain" "LastValueDomain" NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "last_value_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "macro_targets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_date" DATE NOT NULL,
    "kcal" INTEGER NOT NULL,
    "protein_g" INTEGER NOT NULL,
    "carbs_g" INTEGER NOT NULL,
    "fat_g" INTEGER NOT NULL,
    "source" "TargetSource" NOT NULL,
    "prep_cycle_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "macro_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplement_schedules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "time_slot" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "supplement_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplement_items" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "dose" DECIMAL(8,2),
    "unit" TEXT,
    "notes" TEXT,
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "supplement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplement_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "item_id" TEXT,
    "name" TEXT NOT NULL,
    "dose" DECIMAL(8,2),
    "unit" TEXT,
    "taken_at" TIMESTAMP(3) NOT NULL,
    "log_date" DATE NOT NULL,
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "supplement_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "measurement_date" DATE NOT NULL,
    "morning_weight_kg" DECIMAL(6,2),
    "evening_weight_kg" DECIMAL(6,2),
    "body_fat_percentage" DECIMAL(5,2),
    "muscle_mass_kg" DECIMAL(6,2),
    "visceral_fat_index" DECIMAL(4,1),
    "chest_cm" DECIMAL(6,2),
    "shoulder_cm" DECIMAL(6,2),
    "waist_cm" DECIMAL(6,2),
    "hip_cm" DECIMAL(6,2),
    "arm_left_cm" DECIMAL(6,2),
    "arm_right_cm" DECIMAL(6,2),
    "thigh_left_cm" DECIMAL(6,2),
    "thigh_right_cm" DECIMAL(6,2),
    "calf_left_cm" DECIMAL(6,2),
    "calf_right_cm" DECIMAL(6,2),
    "neck_cm" DECIMAL(6,2),
    "subjective_condition" INTEGER,
    "water_retention_score" INTEGER,
    "sleep_hours" DECIMAL(3,1),
    "energy_score" INTEGER,
    "notes" TEXT,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "body_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_photos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body_record_id" TEXT,
    "weekly_check_in_id" TEXT,
    "photo_date" DATE NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "angle" "PhotoAngle" NOT NULL,
    "pose" "PhotoPose" NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "file_size_kb" INTEGER,
    "visibility" "Visibility" NOT NULL DEFAULT 'SELF_ONLY',
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "federation" TEXT,
    "category" TEXT,
    "stage_date" DATE NOT NULL,
    "location" TEXT,
    "target_weight_kg" DECIMAL(6,2),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "competition_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prep_cycles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "current_phase" "PrepPhase" NOT NULL DEFAULT 'PREP',
    "weeks_total" INTEGER NOT NULL,
    "start_weight_kg" DECIMAL(6,2),
    "start_body_fat_pct" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prep_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_configs" (
    "id" TEXT NOT NULL,
    "prep_cycle_id" TEXT NOT NULL,
    "phase" "PrepPhase" NOT NULL,
    "week_start" INTEGER NOT NULL,
    "week_end" INTEGER NOT NULL,
    "kcal" INTEGER NOT NULL,
    "protein_g" INTEGER NOT NULL,
    "carbs_g" INTEGER NOT NULL,
    "fat_g" INTEGER NOT NULL,
    "cardio_sessions_per_week" INTEGER NOT NULL DEFAULT 0,
    "cardio_minutes_per_session" INTEGER NOT NULL DEFAULT 0,
    "cardio_type" TEXT,
    "daily_steps" INTEGER,
    "refeed_day" INTEGER,
    "notes" TEXT,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phase_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peak_protocol_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "daily_water_ml" INTEGER[],
    "daily_sodium_mg" INTEGER[],
    "daily_carbs_g" INTEGER[],
    "daily_protein_g" INTEGER[],
    "daily_fat_g" INTEGER[],
    "notes_per_day" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peak_protocol_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_check_ins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prep_cycle_id" TEXT,
    "week_index" INTEGER NOT NULL,
    "check_in_date" DATE NOT NULL,
    "avg_morning_weight" DECIMAL(6,2),
    "weight_change_kg" DECIMAL(6,2),
    "avg_kcal_actual" INTEGER,
    "avg_steps" INTEGER,
    "trainings_completed" INTEGER,
    "cardio_minutes_total" INTEGER,
    "subjective_condition" INTEGER,
    "hunger_score" INTEGER,
    "sleep_quality_score" INTEGER,
    "stress_score" INTEGER,
    "athlete_notes" TEXT,
    "coach_response_at" TIMESTAMP(3),
    "coach_notes" TEXT,
    "coach_adjustment_kcal_delta" INTEGER,
    "coach_adjustment_protein_delta_g" INTEGER,
    "coach_adjustment_carbs_delta_g" INTEGER,
    "coach_adjustment_fat_delta_g" INTEGER,
    "coach_adjustment_cardio_min_delta" INTEGER,
    "coach_adjustment_steps_delta" INTEGER,
    "coach_adjustment_effective_from" DATE,
    "status" "CheckInStatus" NOT NULL DEFAULT 'PENDING',
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "weekly_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "description" TEXT,
    "expense_date" DATE NOT NULL,
    "linked_food_id" TEXT,
    "linked_supplement_item_id" TEXT,
    "linked_competition_id" TEXT,
    "recurring_id" TEXT,
    "receipt_photo_url" TEXT,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controlled_expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "controlled_cycle_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "compound" TEXT,
    "description" TEXT,
    "expense_date" DATE NOT NULL,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "controlled_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_months" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_budget" DECIMAL(12,2) NOT NULL,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_months_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_category_lines" (
    "id" TEXT NOT NULL,
    "budget_month_id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "budget_category_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "cycle" "RecurringCycle" NOT NULL,
    "next_run_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_profiles" (
    "user_id" TEXT NOT NULL,
    "certifications" TEXT[],
    "specialties" TEXT[],
    "bio" TEXT,
    "hourly_rate" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "athlete_capacity" INTEGER NOT NULL DEFAULT 25,

    CONSTRAINT "coach_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "coach_athlete_links" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
    "invited_by" "InviteSource" NOT NULL,
    "scope_training" BOOLEAN NOT NULL DEFAULT true,
    "scope_nutrition" BOOLEAN NOT NULL DEFAULT true,
    "scope_body_basic" BOOLEAN NOT NULL DEFAULT true,
    "scope_body_photos" BOOLEAN NOT NULL DEFAULT false,
    "scope_expenses" BOOLEAN NOT NULL DEFAULT false,
    "scope_controlled" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "monthly_fee" DECIMAL(10,2),
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_athlete_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_invitations" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "athlete_email" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "accepted_by" TEXT,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_comments" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "target_type" "CommentTarget" NOT NULL,
    "target_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_actionable" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "coach_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rule_type" "ReminderType" NOT NULL,
    "schedule_expr" TEXT NOT NULL,
    "channel" "ReminderChannel" NOT NULL DEFAULT 'PUSH',
    "payload" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "summary_date" DATE NOT NULL,
    "total_kcal" INTEGER,
    "total_protein" DECIMAL(8,2),
    "total_carbs" DECIMAL(8,2),
    "total_fat" DECIMAL(8,2),
    "total_fiber" DECIMAL(8,2),
    "meals_count" INTEGER NOT NULL DEFAULT 0,
    "workout_minutes" INTEGER NOT NULL DEFAULT 0,
    "total_volume_kg" DECIMAL(12,2),
    "total_sets" INTEGER NOT NULL DEFAULT 0,
    "avg_rpe" DECIMAL(3,1),
    "water_ml" INTEGER NOT NULL DEFAULT 0,
    "morning_weight_kg" DECIMAL(6,2),
    "steps" INTEGER,
    "kcal_target" INTEGER,
    "kcal_target_pct" DECIMAL(5,2),
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_op_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "operation" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "conflict_field" TEXT,
    "resolution" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controlled_cycles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "notes_encrypted" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "controlled_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controlled_protocol_items" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "compound" TEXT NOT NULL,
    "weekly_dose_mg" DECIMAL(8,2),
    "frequency" TEXT,
    "route" TEXT,
    "week_start" INTEGER NOT NULL,
    "week_end" INTEGER NOT NULL,

    CONSTRAINT "controlled_protocol_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controlled_dose_logs" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT,
    "user_id" TEXT NOT NULL,
    "compound" TEXT NOT NULL,
    "dose_mg" DECIMAL(8,2) NOT NULL,
    "route" TEXT,
    "injection_site" TEXT,
    "taken_at" TIMESTAMP(3) NOT NULL,
    "log_date" DATE NOT NULL,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controlled_dose_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloodwork_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cycle_id" TEXT,
    "test_date" DATE NOT NULL,
    "lab_name" TEXT,
    "total_test_ng_dl" DECIMAL(8,2),
    "free_test_pg_ml" DECIMAL(8,2),
    "estradiol_pg_ml" DECIMAL(8,2),
    "hematocrit_pct" DECIMAL(5,2),
    "hemoglobin_g_dl" DECIMAL(5,2),
    "hdl_mg_dl" DECIMAL(6,2),
    "ldl_mg_dl" DECIMAL(6,2),
    "alt_u_l" DECIMAL(6,2),
    "ast_u_l" DECIMAL(6,2),
    "creatinine_mg_dl" DECIMAL(5,2),
    "blood_pressure_sys" INTEGER,
    "blood_pressure_dia" INTEGER,
    "raw_report_url" TEXT,
    "client_op_id" TEXT NOT NULL,
    "client_ts" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bloodwork_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controlled_pin_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "fail_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "controlled_pin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controlled_view_tokens" (
    "id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "scope" "ControlledViewScope" NOT NULL DEFAULT 'SUMMARY',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "controlled_view_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_revoked_at_idx" ON "refresh_tokens"("user_id", "revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_seats_subscription_id_athlete_user_id_key" ON "subscription_seats"("subscription_id", "athlete_user_id");

-- CreateIndex
CREATE INDEX "invoices_subscription_id_period_start_idx" ON "invoices"("subscription_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_en_key" ON "exercises"("name_en");

-- CreateIndex
CREATE INDEX "training_plans_user_id_idx" ON "training_plans"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_exercises_client_op_id_key" ON "template_exercises"("client_op_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_exercises_template_id_order_index_key" ON "template_exercises"("template_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "workout_sessions_client_op_id_key" ON "workout_sessions"("client_op_id");

-- CreateIndex
CREATE INDEX "workout_sessions_user_id_session_date_idx" ON "workout_sessions"("user_id", "session_date");

-- CreateIndex
CREATE UNIQUE INDEX "session_exercises_client_op_id_key" ON "session_exercises"("client_op_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_exercises_session_id_order_index_key" ON "session_exercises"("session_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "set_entries_client_op_id_key" ON "set_entries"("client_op_id");

-- CreateIndex
CREATE INDEX "set_entries_session_exercise_id_set_index_idx" ON "set_entries"("session_exercise_id", "set_index");

-- CreateIndex
CREATE INDEX "set_entries_user_id_session_date_idx" ON "set_entries"("user_id", "session_date");

-- CreateIndex
CREATE INDEX "set_entries_user_id_exercise_id_idx" ON "set_entries"("user_id", "exercise_id");

-- CreateIndex
CREATE INDEX "personal_records_user_id_exercise_id_idx" ON "personal_records"("user_id", "exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "personal_records_user_id_exercise_id_record_type_key" ON "personal_records"("user_id", "exercise_id", "record_type");

-- CreateIndex
CREATE UNIQUE INDEX "foods_barcode_key" ON "foods"("barcode");

-- CreateIndex
CREATE INDEX "foods_name_zh_idx" ON "foods"("name_zh");

-- CreateIndex
CREATE INDEX "foods_barcode_idx" ON "foods"("barcode");

-- CreateIndex
CREATE INDEX "recipes_user_id_idx" ON "recipes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "meal_logs_client_op_id_key" ON "meal_logs"("client_op_id");

-- CreateIndex
CREATE INDEX "meal_logs_user_id_meal_date_idx" ON "meal_logs"("user_id", "meal_date");

-- CreateIndex
CREATE UNIQUE INDEX "meal_items_client_op_id_key" ON "meal_items"("client_op_id");

-- CreateIndex
CREATE UNIQUE INDEX "meal_plan_templates_client_op_id_key" ON "meal_plan_templates"("client_op_id");

-- CreateIndex
CREATE INDEX "meal_plan_templates_user_id_is_active_idx" ON "meal_plan_templates"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_meals_template_id_order_index_key" ON "scheduled_meals"("template_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "water_logs_client_op_id_key" ON "water_logs"("client_op_id");

-- CreateIndex
CREATE INDEX "water_logs_user_id_log_date_idx" ON "water_logs"("user_id", "log_date");

-- CreateIndex
CREATE UNIQUE INDEX "electrolyte_logs_client_op_id_key" ON "electrolyte_logs"("client_op_id");

-- CreateIndex
CREATE INDEX "electrolyte_logs_user_id_log_date_idx" ON "electrolyte_logs"("user_id", "log_date");

-- CreateIndex
CREATE INDEX "last_value_cache_user_id_domain_idx" ON "last_value_cache"("user_id", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "last_value_cache_user_id_domain_key_key" ON "last_value_cache"("user_id", "domain", "key");

-- CreateIndex
CREATE UNIQUE INDEX "macro_targets_user_id_target_date_key" ON "macro_targets"("user_id", "target_date");

-- CreateIndex
CREATE UNIQUE INDEX "supplement_schedules_client_op_id_key" ON "supplement_schedules"("client_op_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplement_logs_client_op_id_key" ON "supplement_logs"("client_op_id");

-- CreateIndex
CREATE INDEX "supplement_logs_user_id_log_date_idx" ON "supplement_logs"("user_id", "log_date");

-- CreateIndex
CREATE UNIQUE INDEX "body_records_client_op_id_key" ON "body_records"("client_op_id");

-- CreateIndex
CREATE INDEX "body_records_user_id_measurement_date_idx" ON "body_records"("user_id", "measurement_date");

-- CreateIndex
CREATE UNIQUE INDEX "body_records_user_id_measurement_date_key" ON "body_records"("user_id", "measurement_date");

-- CreateIndex
CREATE UNIQUE INDEX "progress_photos_client_op_id_key" ON "progress_photos"("client_op_id");

-- CreateIndex
CREATE INDEX "progress_photos_user_id_photo_date_idx" ON "progress_photos"("user_id", "photo_date");

-- CreateIndex
CREATE INDEX "progress_photos_weekly_check_in_id_idx" ON "progress_photos"("weekly_check_in_id");

-- CreateIndex
CREATE UNIQUE INDEX "competition_goals_client_op_id_key" ON "competition_goals"("client_op_id");

-- CreateIndex
CREATE UNIQUE INDEX "prep_cycles_client_op_id_key" ON "prep_cycles"("client_op_id");

-- CreateIndex
CREATE INDEX "prep_cycles_user_id_idx" ON "prep_cycles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "phase_configs_client_op_id_key" ON "phase_configs"("client_op_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_check_ins_client_op_id_key" ON "weekly_check_ins"("client_op_id");

-- CreateIndex
CREATE INDEX "weekly_check_ins_user_id_check_in_date_idx" ON "weekly_check_ins"("user_id", "check_in_date");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_client_op_id_key" ON "expenses"("client_op_id");

-- CreateIndex
CREATE INDEX "expenses_user_id_expense_date_idx" ON "expenses"("user_id", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_user_id_category_idx" ON "expenses"("user_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "controlled_expenses_client_op_id_key" ON "controlled_expenses"("client_op_id");

-- CreateIndex
CREATE INDEX "controlled_expenses_user_id_expense_date_idx" ON "controlled_expenses"("user_id", "expense_date");

-- CreateIndex
CREATE UNIQUE INDEX "budget_months_client_op_id_key" ON "budget_months"("client_op_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_months_user_id_year_month_key" ON "budget_months"("user_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "budget_category_lines_budget_month_id_category_key" ON "budget_category_lines"("budget_month_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_expenses_client_op_id_key" ON "recurring_expenses"("client_op_id");

-- CreateIndex
CREATE INDEX "recurring_expenses_user_id_next_run_date_idx" ON "recurring_expenses"("user_id", "next_run_date");

-- CreateIndex
CREATE UNIQUE INDEX "coach_athlete_links_client_op_id_key" ON "coach_athlete_links"("client_op_id");

-- CreateIndex
CREATE INDEX "coach_athlete_links_coach_id_status_idx" ON "coach_athlete_links"("coach_id", "status");

-- CreateIndex
CREATE INDEX "coach_athlete_links_athlete_id_status_idx" ON "coach_athlete_links"("athlete_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "coach_athlete_links_coach_id_athlete_id_key" ON "coach_athlete_links"("coach_id", "athlete_id");

-- CreateIndex
CREATE UNIQUE INDEX "coach_invitations_invite_code_key" ON "coach_invitations"("invite_code");

-- CreateIndex
CREATE INDEX "coach_invitations_coach_id_idx" ON "coach_invitations"("coach_id");

-- CreateIndex
CREATE INDEX "coach_invitations_invite_code_idx" ON "coach_invitations"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "coach_comments_client_op_id_key" ON "coach_comments"("client_op_id");

-- CreateIndex
CREATE INDEX "coach_comments_athlete_id_target_type_target_id_idx" ON "coach_comments"("athlete_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "coach_comments_coach_id_idx" ON "coach_comments"("coach_id");

-- CreateIndex
CREATE INDEX "reminder_rules_user_id_rule_type_enabled_idx" ON "reminder_rules"("user_id", "rule_type", "enabled");

-- CreateIndex
CREATE INDEX "daily_summaries_user_id_summary_date_idx" ON "daily_summaries"("user_id", "summary_date");

-- CreateIndex
CREATE INDEX "daily_summaries_user_id_is_complete_idx" ON "daily_summaries"("user_id", "is_complete");

-- CreateIndex
CREATE UNIQUE INDEX "daily_summaries_user_id_summary_date_key" ON "daily_summaries"("user_id", "summary_date");

-- CreateIndex
CREATE UNIQUE INDEX "sync_events_client_op_id_key" ON "sync_events"("client_op_id");

-- CreateIndex
CREATE INDEX "sync_events_user_id_received_at_idx" ON "sync_events"("user_id", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "controlled_cycles_client_op_id_key" ON "controlled_cycles"("client_op_id");

-- CreateIndex
CREATE INDEX "controlled_cycles_user_id_idx" ON "controlled_cycles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "controlled_dose_logs_client_op_id_key" ON "controlled_dose_logs"("client_op_id");

-- CreateIndex
CREATE INDEX "controlled_dose_logs_user_id_log_date_idx" ON "controlled_dose_logs"("user_id", "log_date");

-- CreateIndex
CREATE UNIQUE INDEX "bloodwork_results_client_op_id_key" ON "bloodwork_results"("client_op_id");

-- CreateIndex
CREATE INDEX "bloodwork_results_user_id_test_date_idx" ON "bloodwork_results"("user_id", "test_date");

-- CreateIndex
CREATE UNIQUE INDEX "controlled_pin_sessions_token_hash_key" ON "controlled_pin_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "controlled_pin_sessions_user_id_expires_at_idx" ON "controlled_pin_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "controlled_view_tokens_token_hash_key" ON "controlled_view_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "controlled_view_tokens_athlete_id_coach_id_idx" ON "controlled_view_tokens"("athlete_id", "coach_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_seats" ADD CONSTRAINT "subscription_seats_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_templates" ADD CONSTRAINT "training_templates_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "training_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "training_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_entries" ADD CONSTRAINT "set_entries_session_exercise_id_fkey" FOREIGN KEY ("session_exercise_id") REFERENCES "session_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_log_id_fkey" FOREIGN KEY ("meal_log_id") REFERENCES "meal_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_templates" ADD CONSTRAINT "meal_plan_templates_prep_cycle_id_fkey" FOREIGN KEY ("prep_cycle_id") REFERENCES "prep_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_meals" ADD CONSTRAINT "scheduled_meals_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "meal_plan_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_meals" ADD CONSTRAINT "scheduled_meals_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_meal_ingredients" ADD CONSTRAINT "scheduled_meal_ingredients_scheduled_meal_id_fkey" FOREIGN KEY ("scheduled_meal_id") REFERENCES "scheduled_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_meal_ingredients" ADD CONSTRAINT "scheduled_meal_ingredients_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplement_items" ADD CONSTRAINT "supplement_items_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "supplement_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_records" ADD CONSTRAINT "body_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_body_record_id_fkey" FOREIGN KEY ("body_record_id") REFERENCES "body_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_weekly_check_in_id_fkey" FOREIGN KEY ("weekly_check_in_id") REFERENCES "weekly_check_ins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_goals" ADD CONSTRAINT "competition_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prep_cycles" ADD CONSTRAINT "prep_cycles_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "competition_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_configs" ADD CONSTRAINT "phase_configs_prep_cycle_id_fkey" FOREIGN KEY ("prep_cycle_id") REFERENCES "prep_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_check_ins" ADD CONSTRAINT "weekly_check_ins_prep_cycle_id_fkey" FOREIGN KEY ("prep_cycle_id") REFERENCES "prep_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_category_lines" ADD CONSTRAINT "budget_category_lines_budget_month_id_fkey" FOREIGN KEY ("budget_month_id") REFERENCES "budget_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_athlete_links" ADD CONSTRAINT "coach_athlete_links_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_athlete_links" ADD CONSTRAINT "coach_athlete_links_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_rules" ADD CONSTRAINT "reminder_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_protocol_items" ADD CONSTRAINT "controlled_protocol_items_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "controlled_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_dose_logs" ADD CONSTRAINT "controlled_dose_logs_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "controlled_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodwork_results" ADD CONSTRAINT "bloodwork_results_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "controlled_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 中文食材全文搜索（pg_trgm，§13 P1-10）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_food_name_zh_trgm ON foods USING gin (name_zh gin_trgm_ops);
CREATE INDEX idx_food_name_en_trgm ON foods USING gin (name_en gin_trgm_ops);

-- 每个学员同一时刻最多 1 个 ACTIVE 教练（§10.2 P1-13）
CREATE UNIQUE INDEX coach_link_active_one_per_athlete ON coach_athlete_links(athlete_id) WHERE status = 'ACTIVE';
