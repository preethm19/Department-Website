-- Add original_filename columns to preserve original file names
ALTER TABLE documents ADD COLUMN original_filename VARCHAR(255);
ALTER TABLE materials ADD COLUMN original_filename VARCHAR(255);
ALTER TABLE submissions ADD COLUMN original_filename VARCHAR(255);
ALTER TABLE assignments ADD COLUMN original_filename VARCHAR(255);

-- Update existing records with default filenames (optional)
UPDATE documents SET original_filename = 'document' WHERE original_filename IS NULL;
UPDATE materials SET original_filename = 'material' WHERE original_filename IS NULL;
UPDATE submissions SET original_filename = 'submission' WHERE original_filename IS NULL;
UPDATE assignments SET original_filename = 'assignment' WHERE original_filename IS NULL;
