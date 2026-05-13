-- Run this script to create the additional info tables
-- Execute: psql -U your_user -d your_database -f run_additional_info_migration.sql

\echo 'Starting migration: Create Event Additional Info Tables'
\echo '======================================================='

\i ../migrations/20260513_create_event_additional_info_tables.sql

\echo ''
\echo '======================================================='
\echo 'Migration completed successfully!'
\echo ''
\echo 'Created tables:'
\echo '  - event_agenda'
\echo '  - event_speakers'
\echo '  - event_prizes'
\echo '  - event_faq'
\echo ''
\echo 'You can now use the Additional Info APIs in the organiser app.'
