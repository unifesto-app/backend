-- Enable Realtime for whatsapp_messages table
-- This allows the frontend to receive real-time updates when messages are sent or received

-- Enable Realtime replication for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- Verify Realtime is enabled (optional check)
-- You can run this query to confirm:
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime' AND tablename = 'whatsapp_messages';

-- Note: If you get an error that the publication doesn't exist, you may need to create it first:
-- CREATE PUBLICATION supabase_realtime;
-- Then run the ALTER PUBLICATION command above again.
