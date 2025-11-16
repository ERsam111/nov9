-- Add data_preparation module type to existing enum
ALTER TYPE module_type ADD VALUE IF NOT EXISTS 'data_preparation';

-- Create table for tracking SQL transformations
CREATE TABLE IF NOT EXISTS public.data_transformation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  sql_query TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE public.data_transformation_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view transformations for their scenarios"
ON public.data_transformation_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM scenarios s
    WHERE s.id = data_transformation_history.scenario_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create transformations for their scenarios"
ON public.data_transformation_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scenarios s
    WHERE s.id = data_transformation_history.scenario_id
    AND s.user_id = auth.uid()
  )
  AND auth.uid() = created_by
);

-- Create index for better query performance
CREATE INDEX idx_transformation_history_scenario ON public.data_transformation_history(scenario_id);
CREATE INDEX idx_transformation_history_sequence ON public.data_transformation_history(scenario_id, sequence_order);