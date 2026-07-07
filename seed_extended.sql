-- =============================================================
-- Unifesto Seed Data — Extended
-- EventCategory, EventTicketType, EventSpeaker,
-- EventAgenda, EventFormField, EventRegistration,
-- EventTicket
-- Depends on: seed.sql
-- =============================================================


-- ========================
-- EVENT CATEGORIES
-- ========================

INSERT INTO event_categories (id, name, slug, description, color, is_active, "order", created_at, updated_at) VALUES
('cccccccc-0000-0000-0000-000000000001', 'Technology',      'technology',      'General tech talks and sessions',             '#6366F1', true, 1, NOW(), NOW()),
('cccccccc-0000-0000-0000-000000000002', 'Workshop',        'workshop',        'Hands-on learning and skill-building',        '#F59E0B', true, 2, NOW(), NOW()),
('cccccccc-0000-0000-0000-000000000003', 'Conference',      'conference',      'Multi-session conferences and summits',       '#10B981', true, 3, NOW(), NOW()),
('cccccccc-0000-0000-0000-000000000004', 'Hackathon',       'hackathon',       'Competitive build events with prizes',        '#EF4444', true, 4, NOW(), NOW()),
('cccccccc-0000-0000-0000-000000000005', 'Community',       'community',       'Meetups, networking, and community catch-ups','#3B82F6', true, 5, NOW(), NOW()),
('cccccccc-0000-0000-0000-000000000006', 'Career',          'career',          'Career growth, job prep, and transitions',    '#8B5CF6', true, 6, NOW(), NOW()),
('cccccccc-0000-0000-0000-000000000007', 'Education',       'education',       'Courses, bootcamps, and study groups',        '#EC4899', true, 7, NOW(), NOW()),
('cccccccc-0000-0000-0000-000000000008', 'Research',        'research',        'Academic and applied research sessions',      '#14B8A6', true, 8, NOW(), NOW()),
('cccccccc-0000-0000-0000-000000000009', 'Product',         'product',         'Product strategy, UX, and teardowns',         '#F97316', true, 9, NOW(), NOW()),
('cccccccc-0000-0000-0000-000000000010', 'Entrepreneurship','entrepreneurship', 'Startup, founder, and business events',      '#64748B', true, 10, NOW(), NOW());


-- ========================
-- EVENT TICKET TYPES
-- (for all TICKETED / MIXED events)
-- ========================

INSERT INTO event_ticket_types (
  id, event_id, name, description, price, currency,
  total_quantity, sold_count,
  sale_starts_at, sale_ends_at,
  per_user_limit, is_visible, is_active, "order", created_at
) VALUES

-- ---- Hackathon: 24-Hour Build Sprint (eeeeeeee-0001-...0002) ----
(
  'tttttttt-0001-0002-0001-000000000001',
  'eeeeeeee-0001-0000-0000-000000000002',
  'Solo Participant', 'Individual entry. Compete alone.',
  299.00, 'INR', 60, 42,
  NOW() - INTERVAL '14 days', NOW() + INTERVAL '24 days',
  1, true, true, 1, NOW() - INTERVAL '15 days'
),
(
  'tttttttt-0001-0002-0002-000000000001',
  'eeeeeeee-0001-0000-0000-000000000002',
  'Team of 2', 'Entry for a team of 2. Both members must register.',
  499.00, 'INR', 60, 36,
  NOW() - INTERVAL '14 days', NOW() + INTERVAL '24 days',
  2, true, true, 2, NOW() - INTERVAL '15 days'
),
(
  'tttttttt-0001-0002-0003-000000000001',
  'eeeeeeee-0001-0000-0000-000000000002',
  'Team of 3-4', 'Entry for a team of 3-4 members.',
  799.00, 'INR', 30, 11,
  NOW() - INTERVAL '14 days', NOW() + INTERVAL '24 days',
  4, true, true, 3, NOW() - INTERVAL '15 days'
),

-- ---- Workshop: System Design for Senior Engineers (eeeeeeee-0001-...0003) ----
(
  'tttttttt-0001-0003-0001-000000000001',
  'eeeeeeee-0001-0000-0000-000000000003',
  'In-Person Seat', 'Attend at Microsoft Reactor. Includes printed workbook and lunch.',
  999.00, 'INR', 60, 45,
  NOW() - INTERVAL '18 days', NOW() + INTERVAL '38 days',
  1, true, true, 1, NOW() - INTERVAL '20 days'
),
(
  'tttttttt-0001-0003-0002-000000000001',
  'eeeeeeee-0001-0000-0000-000000000003',
  'Online Access', 'Live stream + recording access for 30 days.',
  499.00, 'INR', 40, 22,
  NOW() - INTERVAL '18 days', NOW() + INTERVAL '38 days',
  1, true, true, 2, NOW() - INTERVAL '20 days'
),

-- ---- Annual Founder Summit 2026 (eeeeeeee-0002-...0004) ----
(
  'tttttttt-0002-0004-0001-000000000001',
  'eeeeeeee-0002-0000-0000-000000000004',
  'General Pass', '2-day access to all keynotes and tracks. Lunch included.',
  2999.00, 'INR', 500, 312,
  NOW() - INTERVAL '28 days', NOW() + INTERVAL '88 days',
  2, true, true, 1, NOW() - INTERVAL '30 days'
),
(
  'tttttttt-0002-0004-0002-000000000001',
  'eeeeeeee-0002-0000-0000-000000000004',
  'VIP Founder Pass', 'All-access + speaker dinner + private networking lounge.',
  7999.00, 'INR', 100, 71,
  NOW() - INTERVAL '28 days', NOW() + INTERVAL '88 days',
  1, true, true, 2, NOW() - INTERVAL '30 days'
),
(
  'tttttttt-0002-0004-0003-000000000001',
  'eeeeeeee-0002-0000-0000-000000000004',
  'Investor Pass', 'Investors only. Includes deal-flow sessions and founder speed-dating.',
  0.00, 'INR', 50, 38,
  NOW() - INTERVAL '28 days', NOW() + INTERVAL '88 days',
  1, true, true, 3, NOW() - INTERVAL '30 days'
),

-- ---- GTM Masterclass (eeeeeeee-0002-...0003) ----
(
  'tttttttt-0002-0003-0001-000000000001',
  'eeeeeeee-0002-0000-0000-000000000003',
  'Standard', 'Live session + 30-day recording access + templates.',
  1499.00, 'INR', 150, 112,
  NOW() - INTERVAL '8 days', NOW() + INTERVAL '33 days',
  1, true, true, 1, NOW() - INTERVAL '10 days'
),
(
  'tttttttt-0002-0003-0002-000000000001',
  'eeeeeeee-0002-0000-0000-000000000003',
  'With 1:1 Review', 'Standard + 30-min 1:1 GTM strategy review with the instructor.',
  3499.00, 'INR', 20, 14,
  NOW() - INTERVAL '8 days', NOW() + INTERVAL '33 days',
  1, true, true, 2, NOW() - INTERVAL '10 days'
),

-- ---- LLM Fine-Tuning Workshop (eeeeeeee-0003-...0001) ----
(
  'tttttttt-0003-0001-0001-000000000001',
  'eeeeeeee-0003-0000-0000-000000000001',
  'Participant', 'Hands-on seat with GPU access (A100 sponsored). Includes lunch.',
  1999.00, 'INR', 60, 60,
  NOW() - INTERVAL '22 days', NOW() + INTERVAL '12 days',
  1, true, true, 1, NOW() - INTERVAL '25 days'
),
(
  'tttttttt-0003-0001-0002-000000000001',
  'eeeeeeee-0003-0000-0000-000000000001',
  'Online Observer', 'Watch live but no hands-on GPU access.',
  499.00, 'INR', 50, 18,
  NOW() - INTERVAL '22 days', NOW() + INTERVAL '12 days',
  1, true, true, 2, NOW() - INTERVAL '25 days'
),

-- ---- MLOps India Conference 2026 (eeeeeeee-0003-...0003) ----
(
  'tttttttt-0003-0003-0001-000000000001',
  'eeeeeeee-0003-0000-0000-000000000003',
  'Early Bird', 'Full day conference access. Sold out.',
  1499.00, 'INR', 100, 100,
  NOW() - INTERVAL '43 days', NOW() - INTERVAL '10 days',
  2, true, false, 1, NOW() - INTERVAL '45 days'
),
(
  'tttttttt-0003-0003-0002-000000000001',
  'eeeeeeee-0003-0000-0000-000000000003',
  'Standard', 'Full day conference access. Lunch included.',
  2499.00, 'INR', 300, 189,
  NOW() - INTERVAL '10 days', NOW() + INTERVAL '58 days',
  2, true, true, 2, NOW() - INTERVAL '45 days'
),
(
  'tttttttt-0003-0003-0003-000000000001',
  'eeeeeeee-0003-0000-0000-000000000003',
  'Workshop Add-on', 'Conference + afternoon hands-on lab session.',
  3999.00, 'INR', 100, 0,
  NOW() + INTERVAL '10 days', NOW() + INTERVAL '58 days',
  1, true, true, 3, NOW() - INTERVAL '45 days'
),

-- ---- Solidity Bootcamp (eeeeeeee-0004-...0001) ----
(
  'tttttttt-0004-0001-0001-000000000001',
  'eeeeeeee-0004-0000-0000-000000000001',
  'Bootcamp Seat', 'In-person seat with laptop setup support. Tea included.',
  799.00, 'INR', 60, 54,
  NOW() - INTERVAL '16 days', NOW() + INTERVAL '10 days',
  1, true, true, 1, NOW() - INTERVAL '18 days'
),

-- ---- Ethical Hacking Bootcamp (eeeeeeee-0010-...0002) ----
(
  'tttttttt-0010-0002-0001-000000000001',
  'eeeeeeee-0010-0000-0000-000000000002',
  'Standard',    'Full day bootcamp + lunch + lab VM access for 7 days.',
  1499.00, 'INR', 40, 40,
  NOW() - INTERVAL '33 days', NOW() - INTERVAL '2 days',
  1, true, true, 1, NOW() - INTERVAL '35 days'
),

-- ---- Flutter Fest Bangalore 2026 (eeeeeeee-0011-...0001) ----
(
  'tttttttt-0011-0001-0001-000000000001',
  'eeeeeeee-0011-0000-0000-000000000001',
  'General Admission', 'Full day access to all tracks. Lunch + swag bag.',
  999.00, 'INR', 400, 334,
  NOW() - INTERVAL '58 days', NOW() + INTERVAL '43 days',
  2, true, true, 1, NOW() - INTERVAL '60 days'
),
(
  'tttttttt-0011-0001-0002-000000000001',
  'eeeeeeee-0011-0000-0000-000000000001',
  'Speaker / Sponsor', 'Complementary pass for speakers and sponsors.',
  0.00, 'INR', 60, 56,
  NOW() - INTERVAL '58 days', NOW() + INTERVAL '43 days',
  1, false, true, 2, NOW() - INTERVAL '60 days'
),
(
  'tttttttt-0011-0001-0003-000000000001',
  'eeeeeeee-0011-0000-0000-000000000001',
  'Student', 'Discounted ticket for students (valid ID required at entry).',
  299.00, 'INR', 150, 97,
  NOW() - INTERVAL '58 days', NOW() + INTERVAL '43 days',
  1, true, true, 3, NOW() - INTERVAL '60 days'
),

-- ---- Mobile App Security Workshop (eeeeeeee-0011-...0004) ----
(
  'tttttttt-0011-0004-0001-000000000001',
  'eeeeeeee-0011-0000-0000-000000000004',
  'Workshop Seat', 'Hands-on session. Bring your own laptop (macOS preferred for iOS labs).',
  1999.00, 'INR', 60, 41,
  NOW() - INTERVAL '20 days', NOW() + INTERVAL '68 days',
  1, true, true, 1, NOW() - INTERVAL '22 days'
),

-- ---- SQL for Data Scientists (eeeeeeee-0012-...0002) ----
(
  'tttttttt-0012-0002-0001-000000000001',
  'eeeeeeee-0012-0000-0000-000000000002',
  'Live + Recording', 'Attend live + 60-day recording access + exercise dataset.',
  799.00, 'INR', 150, 128,
  NOW() - INTERVAL '26 days', NOW() + INTERVAL '17 days',
  1, true, true, 1, NOW() - INTERVAL '28 days'
),
(
  'tttttttt-0012-0002-0002-000000000001',
  'eeeeeeee-0012-0000-0000-000000000002',
  'Recording Only', '60-day recording access. No live interaction.',
  399.00, 'INR', 100, 34,
  NOW() - INTERVAL '26 days', NOW() + INTERVAL '17 days',
  1, true, true, 2, NOW() - INTERVAL '28 days'
),

-- ---- PM Interview Prep Sprint (eeeeeeee-0007-...0003) ----
(
  'tttttttt-0007-0003-0001-000000000001',
  'eeeeeeee-0007-0000-0000-000000000003',
  '3-Day Sprint Access', 'Live sessions all 3 days + Slack group + mock interview.',
  2499.00, 'INR', 50, 38,
  NOW() - INTERVAL '16 days', NOW() + INTERVAL '53 days',
  1, true, true, 1, NOW() - INTERVAL '18 days'
),

-- ---- Multicloud Architecture Workshop (eeeeeeee-0009-...0002) ----
(
  'tttttttt-0009-0002-0001-000000000001',
  'eeeeeeee-0009-0000-0000-000000000002',
  'Standard Seat', 'Full workshop. Lunch + certificate of completion.',
  1499.00, 'INR', 60, 48,
  NOW() - INTERVAL '26 days', NOW() + INTERVAL '26 days',
  1, true, true, 1, NOW() - INTERVAL '28 days'
);


-- ========================
-- EVENT SPEAKERS
-- ========================

INSERT INTO event_speakers (
  id, event_id, name, bio, avatar_url, designation, company, linkedin_url, "order", created_at
) VALUES

-- BLR Tech Meetup #24 (eeeeeeee-0001-0000-0000-000000000001)
('ssssssss-0001-0001-0001-000000000001', 'eeeeeeee-0001-0000-0000-000000000001',
 'Arjun Mehta', 'Staff Engineer at Razorpay. Building payment infrastructure at scale. Ex-Google.',
 'https://example.com/avatars/arjun-mehta.png', 'Staff Engineer', 'Razorpay',
 'https://linkedin.com/in/arjun-mehta', 1, NOW()),
('ssssssss-0001-0001-0002-000000000001', 'eeeeeeee-0001-0000-0000-000000000001',
 'Priya Iyer', 'Developer Advocate at Anthropic India. Helping developers build with Claude.',
 'https://example.com/avatars/priya-iyer.png', 'Developer Advocate', 'Anthropic',
 'https://linkedin.com/in/priya-iyer-dev', 2, NOW()),
('ssssssss-0001-0001-0003-000000000001', 'eeeeeeee-0001-0000-0000-000000000001',
 'Rahul Verma', 'Founder at Supergig. Previously built AI products at Flipkart.',
 'https://example.com/avatars/rahul-verma.png', 'Founder & CEO', 'Supergig',
 'https://linkedin.com/in/rahul-verma-ai', 3, NOW()),

-- LLM Fine-Tuning Workshop (eeeeeeee-0003-0000-0000-000000000001)
('ssssssss-0003-0001-0001-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Dr. Ananya Krishnamurthy', 'ML Research Lead at Microsoft Research India. PhD from IISc. Focus on efficient fine-tuning.',
 'https://example.com/avatars/ananya-k.png', 'ML Research Lead', 'Microsoft Research India',
 'https://linkedin.com/in/ananya-krishnamurthy', 1, NOW()),
('ssssssss-0003-0001-0002-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Siddharth Rao', 'Senior ML Engineer at Sarvam AI. Specialises in LoRA and quantised models.',
 'https://example.com/avatars/siddharth-rao.png', 'Senior ML Engineer', 'Sarvam AI',
 'https://linkedin.com/in/siddharth-rao-ml', 2, NOW()),

-- Annual Founder Summit 2026 (eeeeeeee-0002-0000-0000-000000000004)
('ssssssss-0002-0004-0001-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Neha Bansal', 'Co-founder & CEO of Kredivo India. Previously General Catalyst Partner.',
 'https://example.com/avatars/neha-bansal.png', 'Co-founder & CEO', 'Kredivo India',
 'https://linkedin.com/in/neha-bansal-vc', 1, NOW()),
('ssssssss-0002-0004-0002-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Vikram Chopra', 'Founder at CARS24. Built India''s largest auto marketplace from 0 to $1B.',
 'https://example.com/avatars/vikram-chopra.png', 'Founder & CEO', 'CARS24',
 'https://linkedin.com/in/vikram-chopra-cars24', 2, NOW()),
('ssssssss-0002-0004-0003-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Divya Gokulnath', 'Co-founder at BYJU''S. Education entrepreneur and TEDx speaker.',
 'https://example.com/avatars/divya-g.png', 'Co-founder', 'BYJU''S',
 'https://linkedin.com/in/divya-gokulnath', 3, NOW()),
('ssssssss-0002-0004-0004-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Rohit Bansal', 'Partner at Sequoia India. 15 years investing in Indian consumer internet.',
 'https://example.com/avatars/rohit-bansal.png', 'Partner', 'Sequoia India',
 'https://linkedin.com/in/rohit-bansal-seq', 4, NOW()),

-- MLOps Conference (eeeeeeee-0003-0000-0000-000000000003)
('ssssssss-0003-0003-0001-000000000001', 'eeeeeeee-0003-0000-0000-000000000003',
 'Karthik Subramaniam', 'Principal Engineer at Swiggy. Runs ML infrastructure for 100M+ users.',
 'https://example.com/avatars/karthik-s.png', 'Principal Engineer', 'Swiggy',
 'https://linkedin.com/in/karthik-subra', 1, NOW()),
('ssssssss-0003-0003-0002-000000000001', 'eeeeeeee-0003-0000-0000-000000000003',
 'Meena Sundaram', 'ML Platform Lead at PhonePe. Speaker at MLConf and Data+AI Summit.',
 'https://example.com/avatars/meena-s.png', 'ML Platform Lead', 'PhonePe',
 'https://linkedin.com/in/meena-sundaram-ml', 2, NOW()),
('ssssssss-0003-0003-0003-000000000001', 'eeeeeeee-0003-0000-0000-000000000003',
 'Ajay Nair', 'Founder of Censius AI (acquired). ML observability and model monitoring expert.',
 'https://example.com/avatars/ajay-nair.png', 'Founder (acquired)', 'Censius AI',
 'https://linkedin.com/in/ajay-nair-mlops', 3, NOW()),

-- Flutter Fest (eeeeeeee-0011-0000-0000-000000000001)
('ssssssss-0011-0001-0001-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Pooja Bhatt', 'Flutter GDE and Senior Mobile Engineer at Meesho. Core Flutter contributor.',
 'https://example.com/avatars/pooja-bhatt.png', 'Flutter GDE & Senior Engineer', 'Meesho',
 'https://linkedin.com/in/pooja-bhatt-flutter', 1, NOW()),
('ssssssss-0011-0001-0002-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Tanveer Sheikh', 'Engineering Manager at Dream11. Leading a 20-person Flutter team.',
 'https://example.com/avatars/tanveer-s.png', 'Engineering Manager', 'Dream11',
 'https://linkedin.com/in/tanveer-sheikh', 2, NOW()),
('ssssssss-0011-0001-0003-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Lakshmi Prasad', 'Staff Software Engineer at Google. Works on Flutter DevTools.',
 'https://example.com/avatars/lakshmi-p.png', 'Staff Software Engineer', 'Google',
 'https://linkedin.com/in/lakshmi-prasad-flutter', 3, NOW()),

-- Ethical Hacking Bootcamp (eeeeeeee-0010-0000-0000-000000000002)
('ssssssss-0010-0002-0001-000000000001', 'eeeeeeee-0010-0000-0000-000000000002',
 'Amit Dubey', 'OSCP certified pentester. 8 years in offensive security. Ex-Deloitte.',
 'https://example.com/avatars/amit-dubey.png', 'Senior Security Consultant', 'Independent',
 'https://linkedin.com/in/amit-dubey-sec', 1, NOW()),
('ssssssss-0010-0002-0002-000000000001', 'eeeeeeee-0010-0000-0000-000000000002',
 'Sneha Kulkarni', 'Bug bounty hunter. Top 50 on HackerOne India. Specialises in API security.',
 'https://example.com/avatars/sneha-k.png', 'Bug Bounty Hunter', 'Independent',
 'https://linkedin.com/in/sneha-kulkarni-sec', 2, NOW()),

-- System Design Workshop (eeeeeeee-0001-0000-0000-000000000003)
('ssssssss-0001-0003-0001-000000000001', 'eeeeeeee-0001-0000-0000-000000000003',
 'Deepak Sharma', 'Principal SDE at Amazon. 12 years designing distributed systems.',
 'https://example.com/avatars/deepak-s.png', 'Principal SDE', 'Amazon',
 'https://linkedin.com/in/deepak-sharma-amzn', 1, NOW()),
('ssssssss-0001-0003-0002-000000000001', 'eeeeeeee-0001-0000-0000-000000000003',
 'Kavya Reddy', 'Engineering Manager at Google Bangalore. Previously Meta (WhatsApp infra).',
 'https://example.com/avatars/kavya-r.png', 'Engineering Manager', 'Google',
 'https://linkedin.com/in/kavya-reddy-eng', 2, NOW());


-- ========================
-- EVENT AGENDA
-- ========================

INSERT INTO event_agenda (
  id, event_id, title, description, start_time, end_time, speaker_name, "order", created_at
) VALUES

-- BLR Tech Meetup #24 (eeeeeeee-0001-0000-0000-000000000001)
-- event starts NOW() + 10 days
('aaaaaaaa-0001-0001-0001-000000000001', 'eeeeeeee-0001-0000-0000-000000000001',
 'Doors Open & Networking',  'Grab a coffee and meet fellow attendees.',
 NOW() + INTERVAL '10 days' + INTERVAL '0 hours',
 NOW() + INTERVAL '10 days' + INTERVAL '30 minutes',
 NULL, 1, NOW()),
('aaaaaaaa-0001-0001-0002-000000000001', 'eeeeeeee-0001-0000-0000-000000000001',
 'Talk 1: Building Production AI with Claude API',
 'A walkthrough of using Claude''s tool-use and prompt caching in a real fintech product.',
 NOW() + INTERVAL '10 days' + INTERVAL '30 minutes',
 NOW() + INTERVAL '10 days' + INTERVAL '60 minutes',
 'Priya Iyer', 2, NOW()),
('aaaaaaaa-0001-0001-0003-000000000001', 'eeeeeeee-0001-0000-0000-000000000001',
 'Talk 2: From Prototype to 10M API Calls/Day',
 'Lessons from scaling an AI feature from weekend hack to production.',
 NOW() + INTERVAL '10 days' + INTERVAL '70 minutes',
 NOW() + INTERVAL '10 days' + INTERVAL '100 minutes',
 'Arjun Mehta', 3, NOW()),
('aaaaaaaa-0001-0001-0004-000000000001', 'eeeeeeee-0001-0000-0000-000000000001',
 'Demo Showcase',  '5-min demos from community members. Sign up at the door.',
 NOW() + INTERVAL '10 days' + INTERVAL '105 minutes',
 NOW() + INTERVAL '10 days' + INTERVAL '150 minutes',
 NULL, 4, NOW()),
('aaaaaaaa-0001-0001-0005-000000000001', 'eeeeeeee-0001-0000-0000-000000000001',
 'Open Networking & Dinner',  'Food, drinks, and conversations.',
 NOW() + INTERVAL '10 days' + INTERVAL '150 minutes',
 NOW() + INTERVAL '10 days' + INTERVAL '180 minutes',
 NULL, 5, NOW()),

-- LLM Fine-Tuning Workshop (eeeeeeee-0003-0000-0000-000000000001)
-- starts NOW() + 14 days, 6 hours long
('aaaaaaaa-0003-0001-0001-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Registration & Setup', 'GPU environment setup and dependency installation.',
 NOW() + INTERVAL '14 days' + INTERVAL '0 hours',
 NOW() + INTERVAL '14 days' + INTERVAL '30 minutes',
 NULL, 1, NOW()),
('aaaaaaaa-0003-0001-0002-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Theory: LoRA, QLoRA, and DPO — Why They Work',
 'Conceptual deep dive into parameter-efficient fine-tuning methods.',
 NOW() + INTERVAL '14 days' + INTERVAL '30 minutes',
 NOW() + INTERVAL '14 days' + INTERVAL '90 minutes',
 'Dr. Ananya Krishnamurthy', 2, NOW()),
('aaaaaaaa-0003-0001-0003-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Hands-on Lab 1: Fine-tune Mistral-7B with LoRA',
 'Start from a base model, prepare your dataset, train and evaluate.',
 NOW() + INTERVAL '14 days' + INTERVAL '90 minutes',
 NOW() + INTERVAL '14 days' + INTERVAL '210 minutes',
 'Siddharth Rao', 3, NOW()),
('aaaaaaaa-0003-0001-0004-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Lunch Break', NULL,
 NOW() + INTERVAL '14 days' + INTERVAL '210 minutes',
 NOW() + INTERVAL '14 days' + INTERVAL '255 minutes',
 NULL, 4, NOW()),
('aaaaaaaa-0003-0001-0005-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Hands-on Lab 2: Merge, Quantise & Deploy',
 'Merge LoRA adapter, quantise with GGUF, serve with Ollama / vLLM.',
 NOW() + INTERVAL '14 days' + INTERVAL '255 minutes',
 NOW() + INTERVAL '14 days' + INTERVAL '345 minutes',
 'Siddharth Rao', 5, NOW()),
('aaaaaaaa-0003-0001-0006-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Q&A and Wrap-up', 'Open Q&A with instructors. Share your trained models.',
 NOW() + INTERVAL '14 days' + INTERVAL '345 minutes',
 NOW() + INTERVAL '14 days' + INTERVAL '360 minutes',
 NULL, 6, NOW()),

-- Annual Founder Summit (eeeeeeee-0002-0000-0000-000000000004)
-- starts NOW() + 90 days, 2 days
('aaaaaaaa-0002-0004-0001-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Opening Keynote: The State of Indian Startups 2026',
 'Where are we, where are we going, and what does the next decade look like.',
 NOW() + INTERVAL '90 days' + INTERVAL '0 hours',
 NOW() + INTERVAL '90 days' + INTERVAL '60 minutes',
 'Neha Bansal', 1, NOW()),
('aaaaaaaa-0002-0004-0002-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Track A: Fundraising in a Tight Market',
 'Panel: What VCs actually want to see at pre-seed, seed, and Series A in 2026.',
 NOW() + INTERVAL '90 days' + INTERVAL '75 minutes',
 NOW() + INTERVAL '90 days' + INTERVAL '135 minutes',
 'Rohit Bansal', 2, NOW()),
('aaaaaaaa-0002-0004-0003-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Track B: Scaling from 1 to 100 Employees',
 'The cultural, operational, and technical inflection points every founder hits.',
 NOW() + INTERVAL '90 days' + INTERVAL '75 minutes',
 NOW() + INTERVAL '90 days' + INTERVAL '135 minutes',
 'Vikram Chopra', 3, NOW()),
('aaaaaaaa-0002-0004-0004-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Networking Lunch & Startup Expo',
 '40+ startups exhibiting. Speed-dating with investors.',
 NOW() + INTERVAL '90 days' + INTERVAL '150 minutes',
 NOW() + INTERVAL '90 days' + INTERVAL '240 minutes',
 NULL, 4, NOW()),
('aaaaaaaa-0002-0004-0005-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Fireside: Building EdTech at Scale',
 'Candid conversation on the highs and lows of building at BYJU''S.',
 NOW() + INTERVAL '90 days' + INTERVAL '240 minutes',
 NOW() + INTERVAL '90 days' + INTERVAL '315 minutes',
 'Divya Gokulnath', 5, NOW()),

-- Flutter Fest (eeeeeeee-0011-0000-0000-000000000001)
('aaaaaaaa-0011-0001-0001-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Registration & Breakfast', NULL,
 NOW() + INTERVAL '45 days' + INTERVAL '0 hours',
 NOW() + INTERVAL '45 days' + INTERVAL '45 minutes',
 NULL, 1, NOW()),
('aaaaaaaa-0011-0001-0002-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Keynote: Flutter in 2026 — Impeller, WASM, and What''s Next',
 'State of Flutter, Impeller rendering engine deep dive, and Flutter Web on WASM.',
 NOW() + INTERVAL '45 days' + INTERVAL '45 minutes',
 NOW() + INTERVAL '45 days' + INTERVAL '105 minutes',
 'Lakshmi Prasad', 2, NOW()),
('aaaaaaaa-0011-0001-0003-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Talk: Flutter at Dream11 — Handling 50M Concurrent Users',
 'Architecture, performance tuning, and the multi-platform journey.',
 NOW() + INTERVAL '45 days' + INTERVAL '120 minutes',
 NOW() + INTERVAL '45 days' + INTERVAL '165 minutes',
 'Tanveer Sheikh', 3, NOW()),
('aaaaaaaa-0011-0001-0004-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Workshop: Advanced Animations with Flutter',
 'Rive, Lottie, custom painters, and shader-based effects.',
 NOW() + INTERVAL '45 days' + INTERVAL '180 minutes',
 NOW() + INTERVAL '45 days' + INTERVAL '270 minutes',
 'Pooja Bhatt', 4, NOW()),
('aaaaaaaa-0011-0001-0005-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Lightning Talks + Community Awards',
 '5 × 7-minute lightning talks. Community voting for best talk.',
 NOW() + INTERVAL '45 days' + INTERVAL '285 minutes',
 NOW() + INTERVAL '45 days' + INTERVAL '390 minutes',
 NULL, 5, NOW()),
('aaaaaaaa-0011-0001-0006-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Networking Dinner & After-Party',
 'Sponsored by Flutter India partners.',
 NOW() + INTERVAL '45 days' + INTERVAL '420 minutes',
 NOW() + INTERVAL '45 days' + INTERVAL '480 minutes',
 NULL, 6, NOW()),

-- System Design Workshop (eeeeeeee-0001-0000-0000-000000000003)
('aaaaaaaa-0001-0003-0001-000000000001', 'eeeeeeee-0001-0000-0000-000000000003',
 'Intro: How to Approach Any System Design Problem',
 'A 3-step framework for structuring any HLD answer.',
 NOW() + INTERVAL '40 days' + INTERVAL '0 hours',
 NOW() + INTERVAL '40 days' + INTERVAL '45 minutes',
 'Deepak Sharma', 1, NOW()),
('aaaaaaaa-0001-0003-0002-000000000001', 'eeeeeeee-0001-0000-0000-000000000003',
 'Case Study 1: Design Instagram',
 'Media storage, CDN, feed generation, real-time notifications.',
 NOW() + INTERVAL '40 days' + INTERVAL '45 minutes',
 NOW() + INTERVAL '40 days' + INTERVAL '105 minutes',
 'Deepak Sharma', 2, NOW()),
('aaaaaaaa-0001-0003-0003-000000000001', 'eeeeeeee-0001-0000-0000-000000000003',
 'Case Study 2: Design a Payment System',
 'Idempotency, distributed transactions, ledger consistency, fraud detection hooks.',
 NOW() + INTERVAL '40 days' + INTERVAL '120 minutes',
 NOW() + INTERVAL '40 days' + INTERVAL '180 minutes',
 'Kavya Reddy', 3, NOW()),
('aaaaaaaa-0001-0003-0004-000000000001', 'eeeeeeee-0001-0000-0000-000000000003',
 'Live Mock: Design Twitter Timeline', 'Audience-driven live system design with panel critique.',
 NOW() + INTERVAL '40 days' + INTERVAL '195 minutes',
 NOW() + INTERVAL '40 days' + INTERVAL '240 minutes',
 NULL, 4, NOW());


-- ========================
-- EVENT FORM FIELDS
-- ========================

INSERT INTO event_form_fields (
  id, event_id, label, type, options, is_required, "order"
) VALUES

-- Hackathon (eeeeeeee-0001-...0002)
('ffffffff-0001-0002-0001-000000000001', 'eeeeeeee-0001-0000-0000-000000000002',
 'Are you registering solo or as part of a team?', 'RADIO',
 ARRAY['Solo', 'Team of 2', 'Team of 3', 'Team of 4'], true, 1),
('ffffffff-0001-0002-0002-000000000001', 'eeeeeeee-0001-0000-0000-000000000002',
 'GitHub profile URL', 'TEXT', ARRAY[]::TEXT[], true, 2),
('ffffffff-0001-0002-0003-000000000001', 'eeeeeeee-0001-0000-0000-000000000002',
 'What is your primary tech stack?', 'CHECKBOX',
 ARRAY['React / Next.js','Node.js','Python','Flutter','Go','Rust','Other'], false, 3),
('ffffffff-0001-0002-0004-000000000001', 'eeeeeeee-0001-0000-0000-000000000002',
 'Dietary preference', 'SELECT',
 ARRAY['Vegetarian','Non-Vegetarian','Vegan','Jain'], true, 4),

-- Annual Founder Summit (eeeeeeee-0002-...0004)
('ffffffff-0002-0004-0001-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Company / Startup name', 'TEXT', ARRAY[]::TEXT[], true, 1),
('ffffffff-0002-0004-0002-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Stage of your startup', 'SELECT',
 ARRAY['Idea','Pre-revenue','Revenue < ₹1Cr','Revenue ₹1–10Cr','Revenue > ₹10Cr'], true, 2),
('ffffffff-0002-0004-0003-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Are you looking to raise funding in the next 6 months?', 'RADIO',
 ARRAY['Yes','No','Already raising'], false, 3),
('ffffffff-0002-0004-0004-000000000001', 'eeeeeeee-0002-0000-0000-000000000004',
 'Which tracks are you most interested in?', 'CHECKBOX',
 ARRAY['Fundraising','Growth & Marketing','Product','Engineering & Tech','Ops & HR'], false, 4),

-- LLM Workshop (eeeeeeee-0003-...0001)
('ffffffff-0003-0001-0001-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Your familiarity with Transformers / LLMs', 'RADIO',
 ARRAY['Beginner (heard of it)','Intermediate (used APIs)','Advanced (trained models)'], true, 1),
('ffffffff-0003-0001-0002-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'Do you have a Hugging Face account?', 'RADIO',
 ARRAY['Yes','No (will create one)'], true, 2),
('ffffffff-0003-0001-0003-000000000001', 'eeeeeeee-0003-0000-0000-000000000001',
 'What use case are you fine-tuning for?', 'TEXTAREA',
 ARRAY[]::TEXT[], false, 3),

-- Flutter Fest (eeeeeeee-0011-...0001)
('ffffffff-0011-0001-0001-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'T-shirt size', 'SELECT',
 ARRAY['XS','S','M','L','XL','XXL'], true, 1),
('ffffffff-0011-0001-0002-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'Are you a Flutter GDE or community leader?', 'RADIO',
 ARRAY['Yes','No'], false, 2),
('ffffffff-0011-0001-0003-000000000001', 'eeeeeeee-0011-0000-0000-000000000001',
 'How long have you been using Flutter?', 'SELECT',
 ARRAY['Less than 6 months','6 months – 1 year','1–2 years','3+ years'], true, 3),

-- Ethical Hacking Bootcamp (eeeeeeee-0010-...0002)
('ffffffff-0010-0002-0001-000000000001', 'eeeeeeee-0010-0000-0000-000000000002',
 'OS on your laptop', 'SELECT',
 ARRAY['macOS','Ubuntu / Debian','Windows (with WSL2)','Kali Linux'], true, 1),
('ffffffff-0010-0002-0002-000000000001', 'eeeeeeee-0010-0000-0000-000000000002',
 'Have you completed any CTF challenges before?', 'RADIO',
 ARRAY['Yes','No'], false, 2),
('ffffffff-0010-0002-0003-000000000001', 'eeeeeeee-0010-0000-0000-000000000002',
 'Any bug bounty experience? If yes, which platforms?', 'TEXTAREA',
 ARRAY[]::TEXT[], false, 3);


-- ========================
-- EVENT REGISTRATIONS
-- (for creator user across multiple events)
-- ========================

INSERT INTO event_registrations (
  id, event_id, user_id, ticket_type_id, quantity,
  total_amount, coins_used, coin_value_inr, razorpay_amount, processing_fee,
  payment_status, payment_id, order_id, paid_at,
  status, is_waitlisted,
  qr_code,
  checked_in_at, checked_in_by,
  form_responses,
  registered_at, cancelled_at
) VALUES

-- 1. BLR Tech Meetup #24 — free RSVP
(
  'rrrrrrrr-0001-0001-0001-000000000001',
  'eeeeeeee-0001-0000-0000-000000000001',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NULL, 1,
  0.00, 0, 0.00, 0.00, 0.00,
  'PAID', NULL, NULL, NULL,
  'REGISTERED', false,
  'QR-BLR-MEETUP24-CB45E236',
  NULL, NULL,
  NULL,
  NOW() - INTERVAL '4 days', NULL
),

-- 2. Hackathon: 24-Hour Build Sprint — paid, solo ticket
(
  'rrrrrrrr-0001-0002-0001-000000000001',
  'eeeeeeee-0001-0000-0000-000000000002',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  'tttttttt-0001-0002-0001-000000000001', 1,
  299.00, 0, 0.00, 299.00, 8.97,
  'PAID', 'pay_QZ1a2b3c4d5e6f', 'order_RZ7g8h9i0j1k2l', NOW() - INTERVAL '10 days',
  'REGISTERED', false,
  'QR-HACKATHON24-CB45E236',
  NULL, NULL,
  '{"Are you registering solo or as part of a team?": "Solo", "GitHub profile URL": "https://github.com/cb45user", "Dietary preference": "Vegetarian"}'::json,
  NOW() - INTERVAL '10 days', NULL
),

-- 3. LLM Fine-Tuning Workshop — paid, participant ticket
(
  'rrrrrrrr-0003-0001-0001-000000000001',
  'eeeeeeee-0003-0000-0000-000000000001',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  'tttttttt-0003-0001-0001-000000000001', 1,
  1999.00, 0, 0.00, 1999.00, 59.97,
  'PAID', 'pay_LLM9a8b7c6d5e4f', 'order_LLM3g2h1i0j9k8l', NOW() - INTERVAL '20 days',
  'REGISTERED', false,
  'QR-LLM-FINETUNE-CB45E236',
  NULL, NULL,
  '{"Your familiarity with Transformers / LLMs": "Advanced (trained models)", "Do you have a Hugging Face account?": "Yes", "What use case are you fine-tuning for?": "Building a domain-specific coding assistant"}'::json,
  NOW() - INTERVAL '20 days', NULL
),

-- 4. Annual Founder Summit — VIP Founder Pass (paid)
(
  'rrrrrrrr-0002-0004-0001-000000000001',
  'eeeeeeee-0002-0000-0000-000000000004',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  'tttttttt-0002-0004-0002-000000000001', 1,
  7999.00, 500, 500.00, 7499.00, 224.97,
  'PAID', 'pay_SUM8a7b6c5d4e3f', 'order_SUM2g1h0i9j8k7l', NOW() - INTERVAL '15 days',
  'REGISTERED', false,
  'QR-FOUNDERSUMMIT-VIP-CB45E236',
  NULL, NULL,
  '{"Company / Startup name": "Unifesto", "Stage of your startup": "Revenue ₹1–10Cr", "Are you looking to raise funding in the next 6 months?": "Yes", "Which tracks are you most interested in?": ["Fundraising","Product","Engineering & Tech"]}'::json,
  NOW() - INTERVAL '15 days', NULL
),

-- 5. Flutter Fest — General Admission (paid)
(
  'rrrrrrrr-0011-0001-0001-000000000001',
  'eeeeeeee-0011-0000-0000-000000000001',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  'tttttttt-0011-0001-0001-000000000001', 1,
  999.00, 0, 0.00, 999.00, 29.97,
  'PAID', 'pay_FLT7a6b5c4d3e2f', 'order_FLT1g0h9i8j7k6l', NOW() - INTERVAL '30 days',
  'REGISTERED', false,
  'QR-FLUTTERFEST-CB45E236',
  NULL, NULL,
  '{"T-shirt size": "L", "Are you a Flutter GDE or community leader?": "No", "How long have you been using Flutter?": "1–2 years"}'::json,
  NOW() - INTERVAL '30 days', NULL
),

-- 6. System Design Workshop — In-Person Seat
(
  'rrrrrrrr-0001-0003-0001-000000000001',
  'eeeeeeee-0001-0000-0000-000000000003',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  'tttttttt-0001-0003-0001-000000000001', 1,
  999.00, 0, 0.00, 999.00, 29.97,
  'PAID', 'pay_SDS6a5b4c3d2e1f', 'order_SDS0g9h8i7j6k5l', NOW() - INTERVAL '5 days',
  'REGISTERED', false,
  'QR-SYSDESIGN-CB45E236',
  NULL, NULL, NULL,
  NOW() - INTERVAL '5 days', NULL
),

-- 7. MLOps Conference — Standard ticket
(
  'rrrrrrrr-0003-0003-0001-000000000001',
  'eeeeeeee-0003-0000-0000-000000000003',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  'tttttttt-0003-0003-0002-000000000001', 1,
  2499.00, 0, 0.00, 2499.00, 74.97,
  'PAID', 'pay_MOP5a4b3c2d1e0f', 'order_MOP9g8h7i6j5k4l', NOW() - INTERVAL '8 days',
  'REGISTERED', false,
  'QR-MLOPS-CONF-CB45E236',
  NULL, NULL, NULL,
  NOW() - INTERVAL '8 days', NULL
),

-- 8. AI Paper Reading Club — free RSVP
(
  'rrrrrrrr-0003-0002-0001-000000000001',
  'eeeeeeee-0003-0000-0000-000000000002',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NULL, 1,
  0.00, 0, 0.00, 0.00, 0.00,
  'PAID', NULL, NULL, NULL,
  'REGISTERED', false,
  'QR-AI-PAPERS-JULY-CB45E236',
  NULL, NULL, NULL,
  NOW() - INTERVAL '2 days', NULL
);


-- ========================
-- EVENT TICKETS
-- (one ticket per registration above)
-- ========================

INSERT INTO event_tickets (
  id, registration_id,
  ticket_code, qr_code,
  attendee_name, attendee_email,
  status, checked_in_at, created_at
) VALUES

-- Ticket for BLR Tech Meetup registration
(
  'tttttttt-reg1-0001-0001-000000000001',
  'rrrrrrrr-0001-0001-0001-000000000001',
  'TCB-M24-00143', 'QR-TCB-M24-00143-TICK',
  'Chai Thallapureddy', 'chaitanya9thallapureddy@gmail.com',
  'ACTIVE', NULL, NOW() - INTERVAL '4 days'
),

-- Ticket for Hackathon registration
(
  'tttttttt-reg2-0001-0002-000000000001',
  'rrrrrrrr-0001-0002-0001-000000000001',
  'HACK24-SOLO-00089', 'QR-HACK24-SOLO-00089-TICK',
  'Chai Thallapureddy', 'chaitanya9thallapureddy@gmail.com',
  'ACTIVE', NULL, NOW() - INTERVAL '10 days'
),

-- Ticket for LLM Workshop registration
(
  'tttttttt-reg3-0003-0001-000000000001',
  'rrrrrrrr-0003-0001-0001-000000000001',
  'LLMWKSP-IN-00060', 'QR-LLMWKSP-IN-00060-TICK',
  'Chai Thallapureddy', 'chaitanya9thallapureddy@gmail.com',
  'ACTIVE', NULL, NOW() - INTERVAL '20 days'
),

-- Ticket for Annual Founder Summit
(
  'tttttttt-reg4-0002-0004-000000000001',
  'rrrrrrrr-0002-0004-0001-000000000001',
  'SFN-SUM26-VIP-00071', 'QR-SFN-SUM26-VIP-00071-TICK',
  'Chai Thallapureddy', 'chaitanya9thallapureddy@gmail.com',
  'ACTIVE', NULL, NOW() - INTERVAL '15 days'
),

-- Ticket for Flutter Fest
(
  'tttttttt-reg5-0011-0001-000000000001',
  'rrrrrrrr-0011-0001-0001-000000000001',
  'FLUTFEST-GA-00334', 'QR-FLUTFEST-GA-00334-TICK',
  'Chai Thallapureddy', 'chaitanya9thallapureddy@gmail.com',
  'ACTIVE', NULL, NOW() - INTERVAL '30 days'
),

-- Ticket for System Design Workshop
(
  'tttttttt-reg6-0001-0003-000000000001',
  'rrrrrrrr-0001-0003-0001-000000000001',
  'SYSDES-IN-00045', 'QR-SYSDES-IN-00045-TICK',
  'Chai Thallapureddy', 'chaitanya9thallapureddy@gmail.com',
  'ACTIVE', NULL, NOW() - INTERVAL '5 days'
),

-- Ticket for MLOps Conference
(
  'tttttttt-reg7-0003-0003-000000000001',
  'rrrrrrrr-0003-0003-0001-000000000001',
  'MLOPS26-STD-00189', 'QR-MLOPS26-STD-00189-TICK',
  'Chai Thallapureddy', 'chaitanya9thallapureddy@gmail.com',
  'ACTIVE', NULL, NOW() - INTERVAL '8 days'
),

-- Ticket for AI Paper Club
(
  'tttttttt-reg8-0003-0002-000000000001',
  'rrrrrrrr-0003-0002-0001-000000000001',
  'AIPPR-JUL26-00187', 'QR-AIPPR-JUL26-00187-TICK',
  'Chai Thallapureddy', 'chaitanya9thallapureddy@gmail.com',
  'ACTIVE', NULL, NOW() - INTERVAL '2 days'
);

-- =============================================================
-- Summary:
--   10 event categories
--   26 ticket types  (across 13 TICKETED/MIXED events)
--   20 speakers      (across 7 events)
--   27 agenda items  (across 5 events)
--   17 form fields   (across 5 events)
--    8 registrations (creator user across 8 events)
--    8 tickets       (one per registration)
-- =============================================================