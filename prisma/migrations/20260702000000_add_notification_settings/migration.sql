CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  event_reminders BOOLEAN NOT NULL DEFAULT true,
  new_events BOOLEAN NOT NULL DEFAULT true,
  referral_updates BOOLEAN NOT NULL DEFAULT true,
  promotions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX notification_settings_user_id_key ON notification_settings(user_id);
