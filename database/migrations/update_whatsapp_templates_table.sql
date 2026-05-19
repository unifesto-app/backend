-- Migration to update whatsapp_templates table with new schema
-- This migration adds support for named/positional parameters, components, status tracking, and quality ratings

-- Step 1: Add new columns
ALTER TABLE public.whatsapp_templates 
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en_US',
  ADD COLUMN IF NOT EXISTS template_type TEXT NOT NULL DEFAULT 'DEFAULT' CHECK (template_type IN ('DEFAULT', 'CATALOGUE', 'FLOWS', 'ORDER_DETAILS', 'ORDER_STATUS', 'CALLING_PERMISSIONS_REQUEST')),
  ADD COLUMN IF NOT EXISTS parameter_format TEXT NOT NULL DEFAULT 'positional' CHECK (parameter_format IN ('named', 'positional')),
  ADD COLUMN IF NOT EXISTS components JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS meta_status TEXT NULL CHECK (meta_status IN ('APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED', 'IN_APPEAL', 'PENDING_DELETION', 'DELETED', 'ARCHIVED', 'LIMIT_EXCEEDED')),
  ADD COLUMN IF NOT EXISTS meta_quality_score TEXT NULL CHECK (meta_quality_score IN ('GREEN', 'YELLOW', 'RED', 'UNKNOWN')),
  ADD COLUMN IF NOT EXISTS message_send_ttl_seconds INTEGER NULL CHECK (message_send_ttl_seconds >= 60 AND message_send_ttl_seconds <= 600),
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE NULL;

-- Step 2: Update category column to use proper enum values
ALTER TABLE public.whatsapp_templates 
  DROP CONSTRAINT IF EXISTS whatsapp_templates_category_check;

ALTER TABLE public.whatsapp_templates 
  ADD CONSTRAINT whatsapp_templates_category_check 
  CHECK (category IN ('AUTHENTICATION', 'MARKETING', 'UTILITY'));

-- Step 3: Update existing data to use new category values
UPDATE public.whatsapp_templates 
SET category = 'UTILITY' 
WHERE category NOT IN ('AUTHENTICATION', 'MARKETING', 'UTILITY');

-- Step 4: Remove old columns that are no longer needed
ALTER TABLE public.whatsapp_templates 
  DROP COLUMN IF EXISTS meta_template_name,
  DROP COLUMN IF EXISTS meta_language;

-- Step 5: Drop old unique constraint on name only
DROP INDEX IF EXISTS idx_whatsapp_templates_name_unique;

-- Step 6: Create new unique constraint on name and language combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_templates_name_language_unique 
  ON public.whatsapp_templates(name, language);

-- Step 7: Add new indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_template_type 
  ON public.whatsapp_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_status 
  ON public.whatsapp_templates(meta_status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_language 
  ON public.whatsapp_templates(language);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_parameter_format 
  ON public.whatsapp_templates(parameter_format);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_quality_score 
  ON public.whatsapp_templates(meta_quality_score);

-- Step 8: Update table comment
COMMENT ON TABLE public.whatsapp_templates IS 'Stores WhatsApp message templates with support for named/positional parameters, components, status tracking, and quality ratings';

-- Step 9: Add column comments for documentation
COMMENT ON COLUMN public.whatsapp_templates.language IS 'Template language code (e.g., en_US, es_MX, hi_IN)';
COMMENT ON COLUMN public.whatsapp_templates.template_type IS 'Template type: DEFAULT, CATALOGUE, FLOWS, ORDER_DETAILS, ORDER_STATUS, CALLING_PERMISSIONS_REQUEST';
COMMENT ON COLUMN public.whatsapp_templates.parameter_format IS 'Parameter format: named ({{first_name}}) or positional ({{1}})';
COMMENT ON COLUMN public.whatsapp_templates.components IS 'Template components (header, body, footer, buttons) stored as JSONB';
COMMENT ON COLUMN public.whatsapp_templates.meta_status IS 'Template status from Meta API (APPROVED, PENDING, REJECTED, etc.)';
COMMENT ON COLUMN public.whatsapp_templates.meta_quality_score IS 'Template quality rating from Meta (GREEN, YELLOW, RED, UNKNOWN)';
COMMENT ON COLUMN public.whatsapp_templates.message_send_ttl_seconds IS 'Message validity period in seconds (60-600s for utility messages)';
COMMENT ON COLUMN public.whatsapp_templates.last_synced_at IS 'Timestamp of last sync with Meta API';

-- Step 10: Create a view for active, approved templates
CREATE OR REPLACE VIEW public.active_whatsapp_templates AS
SELECT 
  id,
  name,
  content,
  category,
  template_type,
  language,
  parameter_format,
  components,
  variables,
  meta_template_id,
  meta_status,
  meta_quality_score,
  message_send_ttl_seconds,
  created_at,
  updated_at,
  last_synced_at
FROM public.whatsapp_templates
WHERE is_active = true 
  AND (meta_status = 'APPROVED' OR meta_status IS NULL);

COMMENT ON VIEW public.active_whatsapp_templates IS 'View of active and approved WhatsApp templates ready to be sent';

-- Grant permissions on the view
GRANT SELECT ON public.active_whatsapp_templates TO authenticated;
GRANT SELECT ON public.active_whatsapp_templates TO service_role;
