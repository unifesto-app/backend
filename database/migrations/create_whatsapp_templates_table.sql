-- Create whatsapp_templates table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'UTILITY' CHECK (category IN ('AUTHENTICATION', 'MARKETING', 'UTILITY')),
  template_type TEXT NOT NULL DEFAULT 'DEFAULT' CHECK (template_type IN ('DEFAULT', 'CATALOGUE', 'FLOWS', 'ORDER_DETAILS', 'ORDER_STATUS', 'CALLING_PERMISSIONS_REQUEST')),
  language TEXT NOT NULL DEFAULT 'en_US',
  parameter_format TEXT NOT NULL DEFAULT 'positional' CHECK (parameter_format IN ('named', 'positional')),
  
  -- Template components stored as JSONB for flexibility
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Variables/parameters
  variables TEXT[] DEFAULT '{}',
  
  -- Meta template information
  meta_template_id TEXT NULL,
  meta_status TEXT NULL CHECK (meta_status IN ('APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED', 'IN_APPEAL', 'PENDING_DELETION', 'DELETED', 'ARCHIVED', 'LIMIT_EXCEEDED')),
  meta_quality_score TEXT NULL CHECK (meta_quality_score IN ('GREEN', 'YELLOW', 'RED', 'UNKNOWN')),
  
  -- Message validity period (TTL) in seconds
  message_send_ttl_seconds INTEGER NULL CHECK (message_send_ttl_seconds >= 60 AND message_send_ttl_seconds <= 600),
  
  -- Status and activation
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON public.whatsapp_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_template_type ON public.whatsapp_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_is_active ON public.whatsapp_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_created_at ON public.whatsapp_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_id ON public.whatsapp_templates(meta_template_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_status ON public.whatsapp_templates(meta_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_language ON public.whatsapp_templates(language);

-- Create unique constraint on name and language combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_templates_name_language_unique ON public.whatsapp_templates(name, language);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_templates_updated_at();

-- Enable Row Level Security
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for super_admin users to access all templates
CREATE POLICY "Super admins can view all templates"
  ON public.whatsapp_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert templates"
  ON public.whatsapp_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update templates"
  ON public.whatsapp_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete templates"
  ON public.whatsapp_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO service_role;

-- Add comment
COMMENT ON TABLE public.whatsapp_templates IS 'Stores reusable WhatsApp message templates with variable support';
