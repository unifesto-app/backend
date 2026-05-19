-- Create whatsapp_templates table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  meta_template_id TEXT NULL,
  meta_template_name TEXT NULL,
  meta_language TEXT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON public.whatsapp_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_is_active ON public.whatsapp_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_created_at ON public.whatsapp_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_id ON public.whatsapp_templates(meta_template_id);

-- Create unique constraint on name
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_templates_name_unique ON public.whatsapp_templates(name);

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
