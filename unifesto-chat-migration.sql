CREATE TYPE "ChatGroupType" AS ENUM ('EVENT');
CREATE TYPE "ChatGroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED');
CREATE TYPE "ChatParticipantRole" AS ENUM ('ORGANISER', 'CO_ORGANISER', 'ATTENDEE');
CREATE TYPE "ChatMessageStatus" AS ENUM ('VISIBLE', 'BLOCKED', 'REMOVED_ADMIN', 'DELETED_USER');
CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'IMAGE', 'SYSTEM');
CREATE TYPE "ModerationFlagReason" AS ENUM ('ADULT_TEXT', 'ADULT_IMAGE', 'KEYWORD_MATCH', 'API_FLAGGED');
CREATE TYPE "ModerationActionType" AS ENUM ('DISMISSED', 'WARNED', 'MESSAGE_REMOVED', 'USER_SUSPENDED');

CREATE TABLE "chat_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "type" "ChatGroupType" NOT NULL DEFAULT 'EVENT',
    "status" "ChatGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),
    CONSTRAINT "chat_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chat_groups_event_id_key" ON "chat_groups"("event_id");

CREATE TABLE "chat_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chat_group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ChatParticipantRole" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "notifications_muted" BOOLEAN NOT NULL DEFAULT false,
    "admin_muted_until" TIMESTAMP(3),
    "last_read_at" TIMESTAMP(3),
    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chat_participants_chat_group_id_user_id_key" ON "chat_participants"("chat_group_id", "user_id");
CREATE INDEX "chat_participants_user_id_idx" ON "chat_participants"("user_id");

CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chat_group_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "type" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
    "ciphertext" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "auth_tag" BYTEA NOT NULL,
    "media_url" TEXT,
    "status" "ChatMessageStatus" NOT NULL DEFAULT 'VISIBLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(3),
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "chat_messages_chat_group_id_created_at_idx" ON "chat_messages"("chat_group_id", "created_at");
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");

CREATE TABLE "chat_moderation_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "reason" "ModerationFlagReason" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "matched_term" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_moderation_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_moderation_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "action_type" "ModerationActionType" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_moderation_actions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chat_moderation_actions_flag_id_key" ON "chat_moderation_actions"("flag_id");

CREATE TABLE "notification_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "chat_messages" BOOLEAN NOT NULL DEFAULT true,
    "event_reminders" BOOLEAN NOT NULL DEFAULT true,
    "registration_updates" BOOLEAN NOT NULL DEFAULT true,
    "wallet_updates" BOOLEAN NOT NULL DEFAULT true,
    "space_updates" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_settings_user_id_key" ON "notification_settings"("user_id");

ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_group_id_fkey"
    FOREIGN KEY ("chat_group_id") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_group_id_fkey"
    FOREIGN KEY ("chat_group_id") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_moderation_flags" ADD CONSTRAINT "chat_moderation_flags_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_moderation_actions" ADD CONSTRAINT "chat_moderation_actions_flag_id_fkey"
    FOREIGN KEY ("flag_id") REFERENCES "chat_moderation_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
