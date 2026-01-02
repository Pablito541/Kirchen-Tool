
-- Add start_date column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS start_date date;
