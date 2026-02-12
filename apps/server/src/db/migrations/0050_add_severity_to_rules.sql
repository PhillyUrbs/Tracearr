DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rules' AND column_name = 'severity'
  ) THEN
    ALTER TABLE "rules" ADD COLUMN "severity" varchar(20) DEFAULT 'warning' NOT NULL;
  END IF;
END $$;--> statement-breakpoint

-- Backfill severity from existing create_violation actions in the JSONB
UPDATE rules
SET severity = COALESCE(
  (
    SELECT elem->>'severity'
    FROM jsonb_array_elements(actions->'actions') AS elem
    WHERE elem->>'type' = 'create_violation'
    LIMIT 1
  ),
  'warning'
)
WHERE actions IS NOT NULL
  AND actions->'actions' @> '[{"type":"create_violation"}]';--> statement-breakpoint

-- Remove create_violation entries from actions JSONB
UPDATE rules
SET actions = jsonb_set(
  actions,
  '{actions}',
  (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(actions->'actions') AS elem
    WHERE elem->>'type' != 'create_violation'
  )
)
WHERE actions IS NOT NULL
  AND actions->'actions' @> '[{"type":"create_violation"}]';
