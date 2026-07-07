-- =============================================================
-- Unifesto Seed Data
-- Creator user ID: cb45e236-3d65-46e2-83d4-13d2e0d87b21
-- 12 Spaces + 40 Events
-- =============================================================

-- ========================
-- SPACES
-- ========================

INSERT INTO spaces (
  id, name, slug, description, website_url,
  logo_url, banner_url,
  city, state, country,
  tags, visibility, type,
  parent_space_id, parent_request_pending, requested_parent_id,
  plan, plan_activated_at, plan_expires_at,
  co_organiser_limit,
  status, submitted_at, approved_at,
  created_by, created_at, updated_at
) VALUES

-- 1. Tech Community Bangalore
(
  '11111111-1111-1111-1111-111111111101',
  'Tech Community Bangalore', 'tech-community-bangalore',
  'The largest tech community in Bangalore connecting developers, designers, and innovators. Monthly meetups, hackathons, and workshops.',
  'https://techcommunity.bangalore.in',
  'https://example.com/logos/tcb.png', 'https://example.com/banners/tcb.png',
  'Bangalore', 'Karnataka', 'India',
  ARRAY['technology','developers','innovation','networking','bangalore'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'PRO', NOW() - INTERVAL '6 months', NOW() + INTERVAL '6 months',
  10,
  'ACTIVE', NOW() - INTERVAL '7 months', NOW() - INTERVAL '6 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '7 months', NOW()
),

-- 2. Startup Founders Network
(
  '11111111-1111-1111-1111-111111111102',
  'Startup Founders Network', 'startup-founders-network',
  'A curated community for startup founders to share learnings, get funding advice, and build together. From zero to one.',
  'https://sfn.in',
  'https://example.com/logos/sfn.png', 'https://example.com/banners/sfn.png',
  'Mumbai', 'Maharashtra', 'India',
  ARRAY['startups','entrepreneurship','funding','founders','vc'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'GROWTH', NOW() - INTERVAL '3 months', NOW() + INTERVAL '9 months',
  8,
  'ACTIVE', NOW() - INTERVAL '4 months', NOW() - INTERVAL '3 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '4 months', NOW()
),

-- 3. AI/ML India
(
  '11111111-1111-1111-1111-111111111103',
  'AI/ML India', 'ai-ml-india',
  'India''s premier community for AI and Machine Learning practitioners, researchers, and enthusiasts. We bridge theory and production.',
  'https://aiml.india.dev',
  'https://example.com/logos/aiml.png', 'https://example.com/banners/aiml.png',
  'Hyderabad', 'Telangana', 'India',
  ARRAY['artificial-intelligence','machine-learning','deep-learning','llm','research'],
  'PUBLIC', 'SUPER',
  NULL, false, NULL,
  'ENTERPRISE', NOW() - INTERVAL '1 year', NOW() + INTERVAL '1 year',
  20,
  'ACTIVE', NOW() - INTERVAL '13 months', NOW() - INTERVAL '12 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '13 months', NOW()
),

-- 4. Web3 Builders India
(
  '11111111-1111-1111-1111-111111111104',
  'Web3 Builders India', 'web3-builders-india',
  'Building the decentralized future together. A community for blockchain developers, DeFi hackers, and Web3 product thinkers.',
  'https://web3builders.in',
  'https://example.com/logos/web3.png', 'https://example.com/banners/web3.png',
  'Pune', 'Maharashtra', 'India',
  ARRAY['web3','blockchain','crypto','defi','solidity'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'GROWTH', NOW() - INTERVAL '5 months', NOW() + INTERVAL '7 months',
  8,
  'ACTIVE', NOW() - INTERVAL '6 months', NOW() - INTERVAL '5 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '6 months', NOW()
),

-- 5. Women in Tech India
(
  '11111111-1111-1111-1111-111111111105',
  'Women in Tech India', 'women-in-tech-india',
  'Empowering women in technology through mentorship, networking, and skill-building. Safe, inclusive, supportive.',
  'https://womenintech.in',
  'https://example.com/logos/wit.png', 'https://example.com/banners/wit.png',
  'Delhi', 'Delhi', 'India',
  ARRAY['women-in-tech','diversity','inclusion','mentorship','leadership'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'PRO', NOW() - INTERVAL '8 months', NOW() + INTERVAL '4 months',
  10,
  'ACTIVE', NOW() - INTERVAL '9 months', NOW() - INTERVAL '8 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '9 months', NOW()
),

-- 6. DevOps Engineers Guild
(
  '11111111-1111-1111-1111-111111111106',
  'DevOps Engineers Guild', 'devops-engineers-guild',
  'Where SREs, platform engineers, and DevOps practitioners share war stories, tools, and best practices.',
  'https://devopsguild.in',
  'https://example.com/logos/devops.png', 'https://example.com/banners/devops.png',
  'Chennai', 'Tamil Nadu', 'India',
  ARRAY['devops','sre','kubernetes','cicd','platform-engineering','terraform'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'STARTER', NULL, NULL,
  5,
  'ACTIVE', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '2 months', NOW()
),

-- 7. Product Managers Hub
(
  '11111111-1111-1111-1111-111111111107',
  'Product Managers Hub', 'product-managers-hub',
  'A community for product managers across India to learn, share strategy, and grow careers in product.',
  'https://pmhub.in',
  'https://example.com/logos/pm.png', 'https://example.com/banners/pm.png',
  'Bangalore', 'Karnataka', 'India',
  ARRAY['product-management','ux','strategy','roadmapping','agile'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'GROWTH', NOW() - INTERVAL '4 months', NOW() + INTERVAL '8 months',
  8,
  'ACTIVE', NOW() - INTERVAL '5 months', NOW() - INTERVAL '4 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '5 months', NOW()
),

-- 8. Open Source India
(
  '11111111-1111-1111-1111-111111111108',
  'Open Source India', 'open-source-india',
  'Contributing to open source together. Space for OSS contributors, maintainers, GSoC mentors, and first-time contributors.',
  'https://opensource.india.dev',
  'https://example.com/logos/osi.png', 'https://example.com/banners/osi.png',
  'Kolkata', 'West Bengal', 'India',
  ARRAY['open-source','github','oss','gsoc','hacktoberfest'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'STARTER', NULL, NULL,
  5,
  'ACTIVE', NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '3 months', NOW()
),

-- 9. Cloud Architects India
(
  '11111111-1111-1111-1111-111111111109',
  'Cloud Architects India', 'cloud-architects-india',
  'For cloud engineers and architects working across AWS, GCP, Azure and multicloud. Deep dives, certifications, and architecture reviews.',
  'https://cloudarchitects.in',
  'https://example.com/logos/cloud.png', 'https://example.com/banners/cloud.png',
  'Hyderabad', 'Telangana', 'India',
  ARRAY['cloud','aws','gcp','azure','architecture','finops'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'PRO', NOW() - INTERVAL '10 months', NOW() + INTERVAL '2 months',
  10,
  'ACTIVE', NOW() - INTERVAL '11 months', NOW() - INTERVAL '10 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '11 months', NOW()
),

-- 10. Cybersecurity Circle
(
  '11111111-1111-1111-1111-111111111110',
  'Cybersecurity Circle', 'cybersecurity-circle',
  'Security professionals, ethical hackers, and CTF enthusiasts unite. Stay sharp, stay secure. Weekly CTF practice and workshops.',
  'https://cybersec.circle.in',
  'https://example.com/logos/cyber.png', 'https://example.com/banners/cyber.png',
  'Pune', 'Maharashtra', 'India',
  ARRAY['cybersecurity','ethical-hacking','ctf','infosec','pentesting'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'GROWTH', NOW() - INTERVAL '6 months', NOW() + INTERVAL '6 months',
  8,
  'ACTIVE', NOW() - INTERVAL '7 months', NOW() - INTERVAL '6 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '7 months', NOW()
),

-- 11. Mobile Dev India (SUPER)
(
  '11111111-1111-1111-1111-111111111111',
  'Mobile Dev India', 'mobile-dev-india',
  'Flutter, React Native, iOS, Android — all mobile developers welcome. The umbrella community for mobile tech in India.',
  'https://mobiledev.in',
  'https://example.com/logos/mobile.png', 'https://example.com/banners/mobile.png',
  'Bangalore', 'Karnataka', 'India',
  ARRAY['mobile','flutter','react-native','ios','android','swift','kotlin'],
  'PUBLIC', 'SUPER',
  NULL, false, NULL,
  'ENTERPRISE', NOW() - INTERVAL '2 years', NOW() + INTERVAL '1 year',
  20,
  'ACTIVE', NOW() - INTERVAL '25 months', NOW() - INTERVAL '24 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '25 months', NOW()
),

-- 12. Data Science Community
(
  '11111111-1111-1111-1111-111111111112',
  'Data Science Community', 'data-science-community',
  'From EDA and analytics to advanced ML pipelines — a space for data scientists, analysts, and data engineers at all levels.',
  'https://datascience.community.in',
  'https://example.com/logos/ds.png', 'https://example.com/banners/ds.png',
  'Chennai', 'Tamil Nadu', 'India',
  ARRAY['data-science','analytics','python','sql','visualization','pandas'],
  'PUBLIC', 'REGULAR',
  NULL, false, NULL,
  'PRO', NOW() - INTERVAL '9 months', NOW() + INTERVAL '3 months',
  10,
  'ACTIVE', NOW() - INTERVAL '10 months', NOW() - INTERVAL '9 months',
  'cb45e236-3d65-46e2-83d4-13d2e0d87b21', NOW() - INTERVAL '10 months', NOW()
);


-- ========================
-- EVENTS
-- ========================

INSERT INTO events (
  id, title, slug, description, cover_image_url,
  type, registration_type,
  start_date_time, end_date_time, timezone,
  venue_name, venue_address, city, state, country, latitude, longitude,
  online_url, online_platform,
  capacity, registered_count, waitlist_enabled, waitlist_count,
  is_free, tags, category, visibility, status,
  is_recurring, recurring_rule,
  space_id, created_by,
  published_at, created_at, updated_at
) VALUES

-- ========================
-- Space 1: Tech Community Bangalore (4 events)
-- ========================

(
  'eeeeeeee-0001-0000-0000-000000000001',
  'BLR Tech Meetup #24 – Building with AI APIs',
  'blr-tech-meetup-24-building-with-ai-apis',
  'Monthly tech meetup focused on building production apps with OpenAI, Anthropic, and Gemini APIs. Talks + demos + networking.',
  'https://example.com/covers/tcb-e1.png',
  'IN_PERSON', 'RSVP',
  NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  'WeWork Prestige Central', 'No. 36, Infantry Road', 'Bangalore', 'Karnataka', 'India', 12.9716, 77.5946,
  NULL, NULL,
  200, 143, false, 0,
  true, ARRAY['ai','apis','networking','talks'], 'Technology', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111101', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days', NOW()
),
(
  'eeeeeeee-0001-0000-0000-000000000002',
  'Hackathon: 24-Hour Build Sprint',
  'blr-hackathon-24-hour-build-sprint',
  '24 hours. 1 prompt. Build something remarkable. Open to all skill levels. Prizes worth ₹1.5L. Food and snacks provided.',
  'https://example.com/covers/tcb-e2.png',
  'IN_PERSON', 'TICKETED',
  NOW() + INTERVAL '25 days', NOW() + INTERVAL '26 days', 'Asia/Kolkata',
  'NASSCOM 10000 Startups', 'Domlur, Bangalore', 'Bangalore', 'Karnataka', 'India', 12.9612, 77.6387,
  NULL, NULL,
  150, 89, true, 12,
  false, ARRAY['hackathon','prizes','build','team'], 'Hackathon', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111101', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '15 days', NOW()
),
(
  'eeeeeeee-0001-0000-0000-000000000003',
  'Workshop: System Design for Senior Engineers',
  'workshop-system-design-senior-engineers-blr',
  'Hands-on 4-hour deep dive into distributed systems design. HLD, LLD, trade-offs, and real-world case studies from FAANG engineers.',
  'https://example.com/covers/tcb-e3.png',
  'HYBRID', 'TICKETED',
  NOW() + INTERVAL '40 days', NOW() + INTERVAL '40 days' + INTERVAL '4 hours', 'Asia/Kolkata',
  'Microsoft Reactor Bangalore', 'Prestige Platina, Koramangala', 'Bangalore', 'Karnataka', 'India', 12.9352, 77.6245,
  'https://meet.google.com/xyz-abc-def', 'Google Meet',
  100, 67, true, 8,
  false, ARRAY['system-design','distributed-systems','workshop','career'], 'Workshop', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111101', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '20 days', NOW()
),
(
  'eeeeeeee-0001-0000-0000-000000000004',
  'BLR Tech Meetup #23 – WebAssembly Deep Dive',
  'blr-tech-meetup-23-webassembly-deep-dive',
  'Past event: We explored WebAssembly in production, WASM runtimes, and the future of near-native web performance.',
  'https://example.com/covers/tcb-e4.png',
  'IN_PERSON', 'RSVP',
  NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  'WeWork Galaxy', '43, Residency Road', 'Bangalore', 'Karnataka', 'India', 12.9726, 77.6031,
  NULL, NULL,
  200, 178, false, 0,
  true, ARRAY['webassembly','wasm','performance','web'], 'Technology', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111101', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '30 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '18 days'
),

-- ========================
-- Space 2: Startup Founders Network (4 events)
-- ========================

(
  'eeeeeeee-0002-0000-0000-000000000001',
  'Founder Fireside: Lessons from Failed Startups',
  'founder-fireside-lessons-from-failed-startups',
  'Honest conversations with founders who have failed and come back stronger. No fluff, just real stories and real learnings.',
  'https://example.com/covers/sfn-e1.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us06web.zoom.us/j/123456789', 'Zoom',
  500, 312, false, 0,
  true, ARRAY['founders','failure','learnings','fireside'], 'Entrepreneurship', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111102', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '12 days', NOW()
),
(
  'eeeeeeee-0002-0000-0000-000000000002',
  'Pitch Night Mumbai – Pre-Seed Edition',
  'pitch-night-mumbai-pre-seed-edition',
  'Selected early-stage founders pitch to a panel of seed investors. 5 minutes pitch + 5 minutes Q&A. Apply to present.',
  'https://example.com/covers/sfn-e2.png',
  'IN_PERSON', 'RSVP',
  NOW() + INTERVAL '18 days', NOW() + INTERVAL '18 days' + INTERVAL '4 hours', 'Asia/Kolkata',
  'BKC Clubhouse', 'Bandra Kurla Complex', 'Mumbai', 'Maharashtra', 'India', 19.0596, 72.8656,
  NULL, NULL,
  120, 98, false, 0,
  true, ARRAY['pitch','investors','seed','startup'], 'Entrepreneurship', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111102', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '20 days', NOW()
),
(
  'eeeeeeee-0002-0000-0000-000000000003',
  'GTM Masterclass: Zero to 1000 Customers',
  'gtm-masterclass-zero-to-1000-customers',
  'A practical 3-hour workshop on go-to-market strategy for B2B SaaS founders. From ICP definition to outbound motion.',
  'https://example.com/covers/sfn-e3.png',
  'ONLINE', 'TICKETED',
  NOW() + INTERVAL '35 days', NOW() + INTERVAL '35 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us06web.zoom.us/j/987654321', 'Zoom',
  200, 134, false, 0,
  false, ARRAY['gtm','saas','sales','marketing','b2b'], 'Workshop', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111102', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '10 days', NOW()
),
(
  'eeeeeeee-0002-0000-0000-000000000004',
  'Annual Founder Summit 2026',
  'startup-founders-annual-summit-2026',
  'Our biggest event of the year. 2 days, 30+ speakers, 800 founders. Tracks for growth, fundraising, product, and ops.',
  'https://example.com/covers/sfn-e4.png',
  'IN_PERSON', 'TICKETED',
  NOW() + INTERVAL '90 days', NOW() + INTERVAL '91 days', 'Asia/Kolkata',
  'Jio World Convention Centre', 'BKC, Mumbai', 'Mumbai', 'Maharashtra', 'India', 19.0633, 72.8651,
  NULL, NULL,
  800, 421, true, 34,
  false, ARRAY['summit','conference','founders','annual'], 'Conference', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111102', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '30 days', NOW()
),

-- ========================
-- Space 3: AI/ML India (4 events)
-- ========================

(
  'eeeeeeee-0003-0000-0000-000000000001',
  'LLM Fine-Tuning Workshop: From Theory to Deployment',
  'llm-fine-tuning-workshop-theory-to-deployment',
  'Hands-on workshop covering LoRA, QLoRA, DPO and RLHF. You will fine-tune a 7B model and deploy it by end of day.',
  'https://example.com/covers/aiml-e1.png',
  'HYBRID', 'TICKETED',
  NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '6 hours', 'Asia/Kolkata',
  'T-Hub', 'Plot No. 1/C, Sy No. 83/1, Raidurg', 'Hyderabad', 'Telangana', 'India', 17.4474, 78.3762,
  'https://meet.google.com/llm-workshop-hyd', 'Google Meet',
  80, 78, true, 21,
  false, ARRAY['llm','fine-tuning','transformers','gpu','deployment'], 'Workshop', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111103', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '7 days', NOW() - INTERVAL '25 days', NOW()
),
(
  'eeeeeeee-0003-0000-0000-000000000002',
  'AI Research Paper Reading Club – July 2026',
  'ai-research-paper-reading-club-july-2026',
  'Monthly paper reading session. This month: Attention Is All You Need follow-ups and recent advances in state-space models.',
  'https://example.com/covers/aiml-e2.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us02web.zoom.us/j/ai-paper-club', 'Zoom',
  300, 187, false, 0,
  true, ARRAY['research','papers','ml','reading-club','ssm'], 'Research', 'PUBLIC', 'PUBLISHED',
  true, 'FREQ=MONTHLY;BYDAY=2SA',
  '11111111-1111-1111-1111-111111111103', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '14 days', NOW()
),
(
  'eeeeeeee-0003-0000-0000-000000000003',
  'MLOps India Conference 2026',
  'mlops-india-conference-2026',
  'A full-day conference on operationalizing ML at scale. Topics: model monitoring, data pipelines, feature stores, and governance.',
  'https://example.com/covers/aiml-e3.png',
  'IN_PERSON', 'TICKETED',
  NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days' + INTERVAL '8 hours', 'Asia/Kolkata',
  'HICC', 'Novotel Hyderabad Convention Centre, Madhapur', 'Hyderabad', 'Telangana', 'India', 17.4522, 78.3864,
  NULL, NULL,
  500, 289, false, 0,
  false, ARRAY['mlops','devops','ml','monitoring','feature-store'], 'Conference', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111103', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '45 days', NOW()
),
(
  'eeeeeeee-0003-0000-0000-000000000004',
  'Kaggle Hackathon Kickoff: Computer Vision Challenge',
  'kaggle-hackathon-kickoff-computer-vision-challenge',
  'Kick off our 2-week Kaggle team challenge on satellite image segmentation. Form teams, get baseline code, and strategize.',
  'https://example.com/covers/aiml-e4.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://meet.google.com/kaggle-kickoff', 'Google Meet',
  200, 156, false, 0,
  true, ARRAY['kaggle','computer-vision','competition','team'], 'Hackathon', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111103', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '8 days', NOW()
),

-- ========================
-- Space 4: Web3 Builders India (3 events)
-- ========================

(
  'eeeeeeee-0004-0000-0000-000000000001',
  'Solidity Bootcamp: Build a DeFi Protocol',
  'solidity-bootcamp-build-defi-protocol',
  '3-hour intensive workshop. Write, test, and deploy an AMM-style DeFi contract on a testnet. Bring your laptop.',
  'https://example.com/covers/web3-e1.png',
  'IN_PERSON', 'TICKETED',
  NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  'CoWork Cafe Pune', 'Baner Road, Baner', 'Pune', 'Maharashtra', 'India', 18.5590, 73.7868,
  NULL, NULL,
  60, 54, true, 9,
  false, ARRAY['solidity','defi','ethereum','smart-contracts','workshop'], 'Workshop', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111104', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '18 days', NOW()
),
(
  'eeeeeeee-0004-0000-0000-000000000002',
  'Web3 Monthly Catch-Up – July 2026',
  'web3-monthly-catchup-july-2026',
  'Monthly check-in on the ecosystem: market updates, protocol launches, regulatory news, and open Q&A.',
  'https://example.com/covers/web3-e2.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days' + INTERVAL '90 minutes', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://meet.google.com/web3-monthly', 'Google Meet',
  400, 211, false, 0,
  true, ARRAY['web3','ecosystem','defi','news','community'], 'Community', 'PUBLIC', 'PUBLISHED',
  true, 'FREQ=MONTHLY;BYDAY=2TU',
  '11111111-1111-1111-1111-111111111104', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '7 days', NOW()
),
(
  'eeeeeeee-0004-0000-0000-000000000003',
  'Web3 India Hackathon – Build on Cosmos',
  'web3-india-hackathon-build-on-cosmos',
  '48-hour hackathon building dApps on the Cosmos ecosystem. ₹3L+ in prizes. Supported by Cosmos India.',
  'https://example.com/covers/web3-e3.png',
  'HYBRID', 'RSVP',
  NOW() + INTERVAL '50 days', NOW() + INTERVAL '52 days', 'Asia/Kolkata',
  'Bhau Institute', 'College of Engineering Pune Campus', 'Pune', 'Maharashtra', 'India', 18.5204, 73.8567,
  'https://us06web.zoom.us/j/cosmos-hack', 'Zoom',
  250, 132, false, 0,
  true, ARRAY['cosmos','hackathon','ibc','dapps','prizes'], 'Hackathon', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111104', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '30 days', NOW()
),

-- ========================
-- Space 5: Women in Tech India (3 events)
-- ========================

(
  'eeeeeeee-0005-0000-0000-000000000001',
  'Resume & LinkedIn Masterclass for Women in Tech',
  'resume-linkedin-masterclass-women-in-tech',
  'Practical session with senior recruiters from top tech companies. Get live feedback on your resume and LinkedIn profile.',
  'https://example.com/covers/wit-e1.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us02web.zoom.us/j/wit-resume', 'Zoom',
  300, 267, false, 0,
  true, ARRAY['career','resume','linkedin','women-in-tech','job-search'], 'Career', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111105', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '14 days', NOW()
),
(
  'eeeeeeee-0005-0000-0000-000000000002',
  'Leadership Panel: Women Leading Engineering Teams',
  'leadership-panel-women-leading-engineering-teams-delhi',
  'Panel discussion with 4 women engineering leaders from Flipkart, PhonePe, Google, and Microsoft. Networking dinner to follow.',
  'https://example.com/covers/wit-e2.png',
  'IN_PERSON', 'RSVP',
  NOW() + INTERVAL '22 days', NOW() + INTERVAL '22 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  'Google Delhi Office', 'DLF Cyber City, Gurugram', 'Delhi', 'Delhi', 'India', 28.4989, 77.0891,
  NULL, NULL,
  150, 142, true, 23,
  true, ARRAY['leadership','panel','women','engineering-managers'], 'Community', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111105', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '25 days', NOW()
),
(
  'eeeeeeee-0005-0000-0000-000000000003',
  'Breaking Into Product: From Engineer to PM',
  'breaking-into-product-engineer-to-pm-wit',
  'How do you transition from SWE to PM? Hear from women who made the jump and get a step-by-step roadmap.',
  'https://example.com/covers/wit-e3.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us06web.zoom.us/j/wit-pm', 'Zoom',
  500, 198, false, 0,
  true, ARRAY['career','product-management','women-in-tech','transition'], 'Career', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111105', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 days', NOW()
),

-- ========================
-- Space 6: DevOps Engineers Guild (3 events)
-- ========================

(
  'eeeeeeee-0006-0000-0000-000000000001',
  'Kubernetes Troubleshooting Live Session',
  'kubernetes-troubleshooting-live-session-chennai',
  'Live debugging of real K8s issues: OOMKilled pods, CrashLoopBackOff, network policies, and PVC nightmares. Bring your kubeconfigs.',
  'https://example.com/covers/devops-e1.png',
  'HYBRID', 'RSVP',
  NOW() + INTERVAL '9 days', NOW() + INTERVAL '9 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  'Zoho Chennai Office', 'SIPCOT IT Park, Siruseri', 'Chennai', 'Tamil Nadu', 'India', 12.8413, 80.2244,
  'https://meet.google.com/k8s-troubleshoot', 'Google Meet',
  100, 72, false, 0,
  true, ARRAY['kubernetes','k8s','debugging','devops','sre'], 'Workshop', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111106', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '16 days', NOW()
),
(
  'eeeeeeee-0006-0000-0000-000000000002',
  'Platform Engineering: Internal Developer Platforms 101',
  'platform-engineering-internal-developer-platforms-101',
  'What is an IDP? How to build one with Backstage, Crossplane, and ArgoCD. Real-world implementation war stories.',
  'https://example.com/covers/devops-e2.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us02web.zoom.us/j/platform-eng', 'Zoom',
  400, 183, false, 0,
  true, ARRAY['platform-engineering','backstage','argocd','idp','devops'], 'Technology', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111106', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '10 days', NOW()
),
(
  'eeeeeeee-0006-0000-0000-000000000003',
  'FinOps Chennai: Cutting Your Cloud Bill in Half',
  'finops-chennai-cutting-cloud-bill-in-half',
  'Real strategies for cloud cost optimization: rightsizing, reserved instances, spot fleets, and FinOps culture.',
  'https://example.com/covers/devops-e3.png',
  'IN_PERSON', 'RSVP',
  NOW() + INTERVAL '38 days', NOW() + INTERVAL '38 days' + INTERVAL '2 hours 30 minutes', 'Asia/Kolkata',
  'Freshworks Chennai HQ', 'GST Road, Guindy', 'Chennai', 'Tamil Nadu', 'India', 13.0067, 80.2206,
  NULL, NULL,
  80, 51, false, 0,
  true, ARRAY['finops','cloud-cost','aws','optimization','devops'], 'Technology', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111106', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '20 days', NOW()
),

-- ========================
-- Space 7: Product Managers Hub (3 events)
-- ========================

(
  'eeeeeeee-0007-0000-0000-000000000001',
  'PM Office Hours: AMA with a CPO',
  'pm-office-hours-ama-with-cpo-bangalore',
  'Monthly open Q&A session with a CPO or VP Product. This month: Kiran Patel, CPO at a Series-C fintech. No agenda, ask anything.',
  'https://example.com/covers/pm-e1.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days' + INTERVAL '90 minutes', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://meet.google.com/pm-ama-july', 'Google Meet',
  200, 167, false, 0,
  true, ARRAY['ama','cpo','product','office-hours','career'], 'Community', 'PUBLIC', 'PUBLISHED',
  true, 'FREQ=MONTHLY;BYDAY=1TH',
  '11111111-1111-1111-1111-111111111107', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '9 days', NOW()
),
(
  'eeeeeeee-0007-0000-0000-000000000002',
  'Product Teardown: Dissecting Zepto''s Retention Mechanics',
  'product-teardown-zepto-retention-mechanics',
  'Live teardown of Zepto''s product and retention strategy. Notifications, loyalty, gamification, and dark patterns.',
  'https://example.com/covers/pm-e2.png',
  'IN_PERSON', 'RSVP',
  NOW() + INTERVAL '16 days', NOW() + INTERVAL '16 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  'Awfis Koramangala', '80 Feet Road, 6th Block, Koramangala', 'Bangalore', 'Karnataka', 'India', 12.9310, 77.6180,
  NULL, NULL,
  80, 63, false, 0,
  true, ARRAY['product-teardown','retention','ux','quick-commerce'], 'Product', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111107', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '22 days', NOW()
),
(
  'eeeeeeee-0007-0000-0000-000000000003',
  'PM Interview Prep Sprint – 3 Days',
  'pm-interview-prep-sprint-3-days',
  'Intensive 3-day online sprint for PM interview prep. Product sense, estimation, analytical, and behavioral rounds covered.',
  'https://example.com/covers/pm-e3.png',
  'ONLINE', 'TICKETED',
  NOW() + INTERVAL '55 days', NOW() + INTERVAL '57 days', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us02web.zoom.us/j/pm-prep-sprint', 'Zoom',
  50, 38, false, 0,
  false, ARRAY['pm-interview','career','product','prep'], 'Career', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111107', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 days', NOW()
),

-- ========================
-- Space 8: Open Source India (3 events)
-- ========================

(
  'eeeeeeee-0008-0000-0000-000000000001',
  'First PR Workshop: Contribute to a Real OSS Project',
  'first-pr-workshop-contribute-oss-project',
  'Beginners-friendly workshop. You will make your first meaningful contribution to an open source project by end of session.',
  'https://example.com/covers/osi-e1.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '11 days', NOW() + INTERVAL '11 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://meet.google.com/oss-first-pr', 'Google Meet',
  300, 212, false, 0,
  true, ARRAY['open-source','github','first-pr','beginners','git'], 'Workshop', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111108', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '11 days', NOW()
),
(
  'eeeeeeee-0008-0000-0000-000000000002',
  'Hacktoberfest India Kickoff 2026',
  'hacktoberfest-india-kickoff-2026',
  'Official Hacktoberfest kickoff event for Indian contributors. Register, find repos to contribute to, and form accountability groups.',
  'https://example.com/covers/osi-e2.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '85 days', NOW() + INTERVAL '85 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us06web.zoom.us/j/hacktoberfest-india', 'Zoom',
  1000, 543, false, 0,
  true, ARRAY['hacktoberfest','open-source','october','community'], 'Community', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111108', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '40 days', NOW()
),
(
  'eeeeeeee-0008-0000-0000-000000000003',
  'OSS Maintainers Roundtable',
  'oss-maintainers-roundtable-kolkata',
  'A small, invite-style gathering for maintainers of OSS projects with 100+ GitHub stars. Burnout, governance, and sustainability.',
  'https://example.com/covers/osi-e3.png',
  'IN_PERSON', 'RSVP',
  NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  'IIM Calcutta Innovation Park', 'Diamond Harbour Road', 'Kolkata', 'West Bengal', 'India', 22.5144, 88.3432,
  NULL, NULL,
  30, 22, false, 0,
  true, ARRAY['open-source','maintainers','sustainability','governance'], 'Community', 'SPACE_ONLY', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111108', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '14 days', NOW()
),

-- ========================
-- Space 9: Cloud Architects India (3 events)
-- ========================

(
  'eeeeeeee-0009-0000-0000-000000000001',
  'AWS Solutions Architect Study Group – Session 8',
  'aws-sa-study-group-session-8-hyderabad',
  'Bi-weekly study group for SAA-C03 certification prep. This week: VPC deep dive, Transit Gateway, and PrivateLink.',
  'https://example.com/covers/cloud-e1.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://meet.google.com/aws-study-group', 'Google Meet',
  150, 93, false, 0,
  true, ARRAY['aws','certification','saa','vpc','study-group'], 'Education', 'PUBLIC', 'PUBLISHED',
  true, 'FREQ=WEEKLY;BYDAY=MO,TH',
  '11111111-1111-1111-1111-111111111109', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days', NOW()
),
(
  'eeeeeeee-0009-0000-0000-000000000002',
  'Multicloud Architecture Patterns – Workshop',
  'multicloud-architecture-patterns-workshop-hyd',
  'Hands-on workshop on designing resilient multicloud architectures. Active-active, active-passive, and disaster recovery patterns.',
  'https://example.com/covers/cloud-e2.png',
  'IN_PERSON', 'TICKETED',
  NOW() + INTERVAL '28 days', NOW() + INTERVAL '28 days' + INTERVAL '5 hours', 'Asia/Kolkata',
  'Microsoft Hyderabad Campus', 'Gachibowli', 'Hyderabad', 'Telangana', 'India', 17.4480, 78.3479,
  NULL, NULL,
  60, 48, true, 7,
  false, ARRAY['multicloud','architecture','aws','gcp','azure','disaster-recovery'], 'Workshop', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111109', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '28 days', NOW()
),
(
  'eeeeeeee-0009-0000-0000-000000000003',
  'Cloud Cost Benchmark Report Launch – India 2026',
  'cloud-cost-benchmark-report-launch-india-2026',
  'Launch event for our annual cloud spending benchmark across 200 Indian startups. Live Q&A with report authors.',
  'https://example.com/covers/cloud-e3.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days' + INTERVAL '90 minutes', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us06web.zoom.us/j/cloud-report-launch', 'Zoom',
  500, 334, false, 0,
  true, ARRAY['cloud','finops','benchmarks','report','startups'], 'Community', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111109', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '20 days', NOW()
),

-- ========================
-- Space 10: Cybersecurity Circle (3 events)
-- ========================

(
  'eeeeeeee-0010-0000-0000-000000000001',
  'CTF Night: Weekly Capture The Flag',
  'ctf-night-weekly-capture-the-flag-pune-july',
  'Weekly in-person CTF night at our Pune hub. Mixed difficulty challenges across web, pwn, reversing, and crypto. All skill levels.',
  'https://example.com/covers/cyber-e1.png',
  'IN_PERSON', 'RSVP',
  NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '4 hours', 'Asia/Kolkata',
  'Innov8 Baner', 'Baner Road, Pune', 'Pune', 'Maharashtra', 'India', 18.5590, 73.7868,
  NULL, NULL,
  50, 44, false, 0,
  true, ARRAY['ctf','hacking','security','competition','weekly'], 'Community', 'PUBLIC', 'PUBLISHED',
  true, 'FREQ=WEEKLY;BYDAY=WE',
  '11111111-1111-1111-1111-111111111110', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '10 days', NOW()
),
(
  'eeeeeeee-0010-0000-0000-000000000002',
  'Ethical Hacking Bootcamp: Web Application Pentesting',
  'ethical-hacking-bootcamp-web-app-pentesting',
  'Full-day bootcamp on web app security. OWASP Top 10, Burp Suite, SQLi, XSS, SSRF, and hands-on labs on intentionally vulnerable apps.',
  'https://example.com/covers/cyber-e2.png',
  'IN_PERSON', 'TICKETED',
  NOW() + INTERVAL '33 days', NOW() + INTERVAL '33 days' + INTERVAL '7 hours', 'Asia/Kolkata',
  'Symbiosis Institute of Technology', 'Lavale, Pune', 'Pune', 'Maharashtra', 'India', 18.5200, 73.7890,
  NULL, NULL,
  40, 40, true, 15,
  false, ARRAY['pentesting','web-security','burpsuite','owasp','ethical-hacking'], 'Workshop', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111110', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '35 days', NOW()
),
(
  'eeeeeeee-0010-0000-0000-000000000003',
  'Bug Bounty Stories: Hunters Share Their Best Finds',
  'bug-bounty-stories-hunters-share-best-finds',
  'Panel of 4 bug bounty hunters walk through their highest-paid findings. Technical deep dives, tools, and methodology.',
  'https://example.com/covers/cyber-e3.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us06web.zoom.us/j/bug-bounty-panel', 'Zoom',
  600, 398, false, 0,
  true, ARRAY['bug-bounty','security','panel','hacking'], 'Community', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111110', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '15 days', NOW()
),

-- ========================
-- Space 11: Mobile Dev India (4 events)
-- ========================

(
  'eeeeeeee-0011-0000-0000-000000000001',
  'Flutter Fest Bangalore 2026',
  'flutter-fest-bangalore-2026',
  'A full day of Flutter: talks on performance, animations, Platform Views, and the Impeller rendering engine. Biggest Flutter event in India.',
  'https://example.com/covers/mobile-e1.png',
  'IN_PERSON', 'TICKETED',
  NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days' + INTERVAL '8 hours', 'Asia/Kolkata',
  'KTPO Trade Centre', 'Whitefield, Bangalore', 'Bangalore', 'Karnataka', 'India', 12.9716, 77.7499,
  NULL, NULL,
  600, 487, true, 56,
  false, ARRAY['flutter','dart','mobile','ui','conference'], 'Conference', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111111', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '8 days', NOW() - INTERVAL '60 days', NOW()
),
(
  'eeeeeeee-0011-0000-0000-000000000002',
  'React Native Deep Dive: Architecture 2.0',
  'react-native-deep-dive-architecture-2',
  'Technical deep dive into the new React Native architecture: JSI, Turbo Modules, Fabric renderer, and bridgeless mode.',
  'https://example.com/covers/mobile-e2.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '13 days', NOW() + INTERVAL '13 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us02web.zoom.us/j/rn-arch', 'Zoom',
  400, 287, false, 0,
  true, ARRAY['react-native','jsi','turbo-modules','fabric','mobile'], 'Technology', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111111', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '12 days', NOW()
),
(
  'eeeeeeee-0011-0000-0000-000000000003',
  'iOS 20 & Swift 6 What''s New',
  'ios-20-swift-6-whats-new',
  'Quick breakdown of every relevant iOS 20 and Swift 6 feature for Indian app developers. With live code demos.',
  'https://example.com/covers/mobile-e3.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days' + INTERVAL '2 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://meet.google.com/ios-20-swift-6', 'Google Meet',
  300, 201, false, 0,
  true, ARRAY['ios','swift','apple','wwdc','mobile'], 'Technology', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111111', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 days', NOW()
),
(
  'eeeeeeee-0011-0000-0000-000000000004',
  'Mobile App Security: Reverse Engineering & Hardening',
  'mobile-app-security-reverse-engineering-hardening',
  'How do attackers reverse engineer your APK/IPA? And how do you harden against it? Hands-on with jadx, frida, and objection.',
  'https://example.com/covers/mobile-e4.png',
  'IN_PERSON', 'TICKETED',
  NOW() + INTERVAL '70 days', NOW() + INTERVAL '70 days' + INTERVAL '5 hours', 'Asia/Kolkata',
  'Amazon India HQ', 'Brigade Gateway Campus, Rajajinagar', 'Bangalore', 'Karnataka', 'India', 12.9983, 77.5541,
  NULL, NULL,
  60, 41, false, 0,
  false, ARRAY['mobile-security','reverse-engineering','android','ios','frida'], 'Workshop', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111111', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '22 days', NOW()
),

-- ========================
-- Space 12: Data Science Community (4 events)
-- ========================

(
  'eeeeeeee-0012-0000-0000-000000000001',
  'Data Science Chennai Meetup #18',
  'data-science-chennai-meetup-18',
  'Monthly Chennai meetup. This month: talks on time-series forecasting at scale and using DuckDB for local analytics.',
  'https://example.com/covers/ds-e1.png',
  'IN_PERSON', 'RSVP',
  NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  'PayU India Office', 'Nungambakkam High Road', 'Chennai', 'Tamil Nadu', 'India', 13.0569, 80.2425,
  NULL, NULL,
  120, 87, false, 0,
  true, ARRAY['data-science','forecasting','duckdb','python','meetup'], 'Community', 'PUBLIC', 'PUBLISHED',
  true, 'FREQ=MONTHLY;BYDAY=2MO',
  '11111111-1111-1111-1111-111111111112', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '15 days', NOW()
),
(
  'eeeeeeee-0012-0000-0000-000000000002',
  'SQL for Data Scientists: Advanced Patterns',
  'sql-for-data-scientists-advanced-patterns',
  'Window functions, CTEs, lateral joins, recursive queries, and query optimization. Not your average SQL tutorial.',
  'https://example.com/covers/ds-e2.png',
  'ONLINE', 'TICKETED',
  NOW() + INTERVAL '19 days', NOW() + INTERVAL '19 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us02web.zoom.us/j/adv-sql', 'Zoom',
  200, 162, false, 0,
  false, ARRAY['sql','analytics','data-engineering','postgres','bigquery'], 'Education', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111112', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '28 days', NOW()
),
(
  'eeeeeeee-0012-0000-0000-000000000003',
  'DataViz Challenge: Make the Ugly Beautiful',
  'dataviz-challenge-make-ugly-beautiful',
  'We give everyone the same messy dataset. You have 2 hours to produce the most insightful, beautiful visualization. Prizes for top 3.',
  'https://example.com/covers/ds-e3.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '29 days', NOW() + INTERVAL '29 days' + INTERVAL '3 hours', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://meet.google.com/dataviz-challenge', 'Google Meet',
  300, 194, false, 0,
  true, ARRAY['visualization','dataviz','matplotlib','d3','competition'], 'Community', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111112', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '11 days', NOW()
),
(
  'eeeeeeee-0012-0000-0000-000000000004',
  'Career in Data: Analyst → Scientist → Engineer',
  'career-in-data-analyst-to-scientist-to-engineer',
  'Panel of data practitioners at different career stages talk about growth, skills, salaries, and what to focus on next.',
  'https://example.com/covers/ds-e4.png',
  'ONLINE', 'RSVP',
  NOW() + INTERVAL '44 days', NOW() + INTERVAL '44 days' + INTERVAL '90 minutes', 'Asia/Kolkata',
  NULL, NULL, NULL, NULL, 'India', NULL, NULL,
  'https://us06web.zoom.us/j/data-career-panel', 'Zoom',
  500, 271, false, 0,
  true, ARRAY['career','data-science','panel','salary','growth'], 'Career', 'PUBLIC', 'PUBLISHED',
  false, NULL,
  '11111111-1111-1111-1111-111111111112', 'cb45e236-3d65-46e2-83d4-13d2e0d87b21',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 days', NOW()
);

-- =============================================================
-- Summary:
--   12 spaces  (2 SUPER, 10 REGULAR | STARTER/GROWTH/PRO/ENTERPRISE)
--   40 events  (IN_PERSON / ONLINE / HYBRID, free & paid, recurring)
--   All created_by: cb45e236-3d65-46e2-83d4-13d2e0d87b21
-- =============================================================cclear

