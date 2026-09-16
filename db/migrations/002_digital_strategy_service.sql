-- Add the digital strategy service without rewriting the applied initial migration.
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_service_check;
ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_service_check
  CHECK (service IN ('digital-strategy', 'websites', 'digital-products', 'digital-improvements', 'not-sure'));
