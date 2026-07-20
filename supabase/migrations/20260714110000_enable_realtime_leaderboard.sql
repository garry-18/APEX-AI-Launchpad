-- Migration: Enable realtime replication for profiles and points_audit_logs tables
-- Target File: supabase/migrations/20260714110000_enable_realtime_leaderboard.sql

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.points_audit_logs;

-- Set replica identity to full to ensure complete payloads are sent
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.points_audit_logs REPLICA IDENTITY FULL;
