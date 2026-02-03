-- Add 'buyers_only' to the messaging_privacy enum
ALTER TYPE public.messaging_privacy ADD VALUE IF NOT EXISTS 'buyers_only';