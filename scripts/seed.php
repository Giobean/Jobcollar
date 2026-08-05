<?php

declare(strict_types=1);

$dbPath = dirname(__DIR__) . '/storage/database/jobcollar.sqlite';

if (!file_exists($dbPath)) {
    echo "ERROR: Database not found. Run init_db.php first.\n";
    exit(1);
}

$pdo = new PDO("sqlite:{$dbPath}", null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$pdo->exec('PRAGMA foreign_keys = ON');

echo "Seeding database...\n";

// Create demo user
$password = password_hash('password', PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,
    'time_cost' => 4,
    'threads' => 3,
]);

$pdo->prepare('INSERT OR IGNORE INTO users (name, email, password) VALUES (?, ?, ?)')
    ->execute(['Demo User', 'demo@jobcollar.com', $password]);

$userId = $pdo->query("SELECT id FROM users WHERE email = 'demo@jobcollar.com'")->fetchColumn();
echo "  Created demo user (demo@jobcollar.com / password)\n";

// --- Resume 1: Software Engineer ---
$pdo->prepare('INSERT INTO resumes (user_id, title, slug, template, score, section_order) VALUES (?, ?, ?, ?, ?, ?)')
    ->execute([$userId, 'Senior Software Engineer', 'senior-software-engineer-a1b2c3d4', 'technical', 92, '["personal","summary","experience","skills","projects","education","certifications","languages"]']);

$resume1Id = $pdo->lastInsertId();

$pdo->prepare('INSERT INTO resume_personal (resume_id, first_name, last_name, email, phone, location, website, linkedin, github, job_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([$resume1Id, 'Alex', 'Thompson', 'alex.thompson@email.com', '+1 (415) 555-0192', 'San Francisco, CA', 'https://alexthompson.dev', 'https://linkedin.com/in/alexthompson', 'https://github.com/alexthompson', 'Senior Software Engineer']);

$pdo->prepare('INSERT INTO resume_summary (resume_id, content) VALUES (?, ?)')
    ->execute([$resume1Id, "Senior Software Engineer with 7+ years of experience building scalable distributed systems and leading high-performing engineering teams. Specialized in cloud-native architectures, microservices design, and real-time data processing pipelines that serve millions of users.\n\nPassionate about clean code, developer experience, and mentoring junior engineers. Track record of delivering complex features ahead of schedule while maintaining 99.99% uptime SLAs. Open source contributor with 2,000+ GitHub stars across personal projects."]);

// Experience
$experiences = [
    [
        $resume1Id, 'Stripe', 'Senior Software Engineer', 'San Francisco, CA',
        '2021-03', '', 1,
        'Leading the Payments Infrastructure team responsible for processing $500B+ in annual transaction volume. Architected and shipped the new real-time settlement engine that reduced payment processing latency by 40%.',
        '["Designed and implemented a distributed ledger system handling 50,000+ transactions per second with sub-100ms latency","Led migration of monolithic payment processing to event-driven microservices architecture, reducing deployment time from hours to minutes","Mentored 4 junior engineers through promotion cycles, with 100% success rate","Reduced infrastructure costs by 35% through intelligent auto-scaling and resource optimization","Implemented comprehensive observability stack with custom Datadog dashboards and PagerDuty alerting"]',
        0
    ],
    [
        $resume1Id, 'Airbnb', 'Software Engineer II', 'San Francisco, CA',
        '2018-06', '2021-02', 0,
        'Core member of the Search & Discovery team, building ML-powered recommendation systems that directly impacted booking conversion rates.',
        '["Built real-time personalization engine serving 100M+ daily active users, increasing booking conversion by 12%","Developed A/B testing framework used across 15+ engineering teams for feature experimentation","Optimized Elasticsearch cluster performance, reducing p99 search latency from 800ms to 200ms","Collaborated with data science team to deploy ML models to production using custom serving infrastructure","Received Airbnb Engineering Excellence Award for Q3 2020"]',
        1
    ],
    [
        $resume1Id, 'Microsoft', 'Software Engineer', 'Redmond, WA',
        '2016-08', '2018-05', 0,
        'Member of Azure Cloud Services team working on core platform infrastructure and developer tools.',
        '["Contributed to Azure Functions runtime, implementing cold-start optimization that reduced startup time by 60%","Built internal developer CLI tool adopted by 500+ engineers across Azure org","Implemented distributed caching layer for Azure App Service, handling 10M+ requests daily","Participated in on-call rotation for Tier-1 Azure services with 99.99% SLA requirements"]',
        2
    ],
];

$stmtExp = $pdo->prepare('INSERT INTO resume_experience (resume_id, company, position, location, start_date, end_date, is_current, description, highlights, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($experiences as $exp) {
    $stmtExp->execute($exp);
}

// Education
$stmtEdu = $pdo->prepare('INSERT INTO resume_education (resume_id, institution, degree, field_of_study, location, start_date, end_date, gpa, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmtEdu->execute([$resume1Id, 'Stanford University', 'Master of Science', 'Computer Science', 'Stanford, CA', '2014-09', '2016-06', '3.9', 'Focus on Distributed Systems and Machine Learning. Teaching Assistant for CS229 (Machine Learning).', 0]);
$stmtEdu->execute([$resume1Id, 'University of Michigan', 'Bachelor of Science', 'Computer Science & Engineering', 'Ann Arbor, MI', '2010-09', '2014-05', '3.85', 'Dean\'s List all semesters. President of ACM student chapter.', 1]);

// Skills
$skills = [
    [$resume1Id, 'Go', 'expert', 'Languages', 0],
    [$resume1Id, 'TypeScript', 'expert', 'Languages', 1],
    [$resume1Id, 'Python', 'advanced', 'Languages', 2],
    [$resume1Id, 'Rust', 'intermediate', 'Languages', 3],
    [$resume1Id, 'Kubernetes', 'expert', 'Infrastructure', 4],
    [$resume1Id, 'AWS/GCP', 'expert', 'Infrastructure', 5],
    [$resume1Id, 'PostgreSQL', 'advanced', 'Databases', 6],
    [$resume1Id, 'Redis', 'advanced', 'Databases', 7],
    [$resume1Id, 'Apache Kafka', 'advanced', 'Infrastructure', 8],
    [$resume1Id, 'gRPC/Protobuf', 'advanced', 'Infrastructure', 9],
    [$resume1Id, 'React', 'advanced', 'Frontend', 10],
    [$resume1Id, 'System Design', 'expert', 'Architecture', 11],
];

$stmtSkill = $pdo->prepare('INSERT INTO resume_skills (resume_id, name, level, category, sort_order) VALUES (?, ?, ?, ?, ?)');
foreach ($skills as $skill) {
    $stmtSkill->execute($skill);
}

// Projects
$stmtProj = $pdo->prepare('INSERT INTO resume_projects (resume_id, name, description, url, technologies, start_date, end_date, highlights, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmtProj->execute([$resume1Id, 'StreamDB', 'Open-source distributed streaming database optimized for time-series data with SQL-compatible query interface.', 'https://github.com/alexthompson/streamdb', 'Go, Raft Consensus, RocksDB, gRPC', '2022-01', '', '["1,400+ GitHub stars and 200+ forks","Featured in Go Weekly newsletter and InfoQ article","Handles 100K+ writes/second on commodity hardware"]', 0]);
$stmtProj->execute([$resume1Id, 'KubeFlow Operator', 'Kubernetes operator for managing ML training pipelines with automatic resource scaling and experiment tracking.', 'https://github.com/alexthompson/kubeflow-operator', 'Go, Kubernetes, Python, TensorFlow', '2021-06', '2022-03', '["Adopted by 3 Fortune 500 companies for internal ML infrastructure","Presented at KubeCon NA 2022","Reduces ML pipeline setup time from days to hours"]', 1]);

// Certifications
$stmtCert = $pdo->prepare('INSERT INTO resume_certifications (resume_id, name, issuer, date_issued, date_expires, credential_id, url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
$stmtCert->execute([$resume1Id, 'AWS Solutions Architect Professional', 'Amazon Web Services', '2023-01', '2026-01', 'AWS-SAP-2023-7842', 'https://aws.amazon.com/verification', 0]);
$stmtCert->execute([$resume1Id, 'Certified Kubernetes Administrator (CKA)', 'Cloud Native Computing Foundation', '2022-06', '2025-06', 'CKA-2200-4521', 'https://training.linuxfoundation.org/certification/verify', 1]);

// Languages
$stmtLang = $pdo->prepare('INSERT INTO resume_languages (resume_id, language, proficiency, sort_order) VALUES (?, ?, ?, ?)');
$stmtLang->execute([$resume1Id, 'English', 'native', 0]);
$stmtLang->execute([$resume1Id, 'Spanish', 'professional', 1]);
$stmtLang->execute([$resume1Id, 'Mandarin', 'conversational', 2]);

echo "  Created resume: Senior Software Engineer (score: 92)\n";

// --- Resume 2: Marketing Manager ---
$pdo->prepare('INSERT INTO resumes (user_id, title, slug, template, score, section_order) VALUES (?, ?, ?, ?, ?, ?)')
    ->execute([$userId, 'Marketing Manager', 'marketing-manager-e5f6g7h8', 'professional', 88, '["personal","summary","experience","education","skills","projects","certifications","languages"]']);

$resume2Id = $pdo->lastInsertId();

$pdo->prepare('INSERT INTO resume_personal (resume_id, first_name, last_name, email, phone, location, website, linkedin, job_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([$resume2Id, 'Jordan', 'Rivera', 'jordan.rivera@email.com', '+1 (212) 555-0847', 'New York, NY', 'https://jordanrivera.co', 'https://linkedin.com/in/jordanrivera', 'Senior Marketing Manager']);

$pdo->prepare('INSERT INTO resume_summary (resume_id, content) VALUES (?, ?)')
    ->execute([$resume2Id, "Results-driven Marketing Manager with 6+ years of experience scaling B2B SaaS brands from startup to market leader. Expert in demand generation, content strategy, and marketing analytics with a proven track record of delivering 3x pipeline growth while maintaining efficient CAC:LTV ratios.\n\nCombines creative storytelling with data-driven decision making to build marketing engines that consistently exceed revenue targets. Experience managing cross-functional teams of 8+ people and annual budgets exceeding \$2M."]);

// Experience
$mktExperiences = [
    [
        $resume2Id, 'HubSpot', 'Senior Marketing Manager', 'New York, NY',
        '2022-01', '', 1,
        'Leading the Enterprise Demand Generation team responsible for $45M in annual pipeline. Managing a team of 6 marketers across content, paid media, and events.',
        '["Grew enterprise pipeline by 180% YoY through integrated ABM campaigns targeting Fortune 1000 accounts","Launched podcast series reaching 50K monthly listeners, generating 200+ enterprise leads per quarter","Optimized paid acquisition channels reducing CAC by 28% while increasing lead quality scores by 35%","Built and managed relationships with 15+ strategic partners driving 20% of total pipeline","Implemented attribution modeling that improved marketing ROI measurement accuracy by 60%"]',
        0
    ],
    [
        $resume2Id, 'Notion', 'Marketing Manager', 'San Francisco, CA',
        '2019-08', '2021-12', 0,
        'Owned the full-funnel marketing strategy for the SMB segment, driving product-led growth through content marketing and community building.',
        '["Scaled organic blog traffic from 200K to 1.2M monthly visitors through SEO-first content strategy","Created viral template gallery that drove 500K+ new signups in 6 months","Managed $800K quarterly ad budget across Google, LinkedIn, and Twitter with 4.2x ROAS","Launched community ambassador program with 300+ active members generating authentic word-of-mouth","Designed and executed product launch campaigns for 4 major feature releases"]',
        1
    ],
    [
        $resume2Id, 'WeWork', 'Marketing Coordinator', 'New York, NY',
        '2017-06', '2019-07', 0,
        'Supported the global marketing team in executing brand campaigns and managing local market activations across 15+ cities.',
        '["Coordinated 40+ member events per quarter, averaging 85% attendance and 92% satisfaction scores","Managed social media accounts growing following by 150% over 18 months to 280K followers","Produced monthly marketing analytics reports informing C-suite strategic decisions","Assisted in rebranding initiative that won a Webby Award for Best Visual Design"]',
        2
    ],
];

foreach ($mktExperiences as $exp) {
    $stmtExp->execute($exp);
}

// Education
$stmtEdu->execute([$resume2Id, 'New York University', 'Master of Business Administration', 'Marketing & Strategy', 'New York, NY', '2020-09', '2022-05', '3.8', 'Stern School of Business. Marketing Club President. Case competition finalist.', 0]);
$stmtEdu->execute([$resume2Id, 'Boston University', 'Bachelor of Science', 'Communications & Marketing', 'Boston, MA', '2013-09', '2017-05', '3.7', 'Magna Cum Laude. Editor of student marketing journal. Study abroad at LSE.', 1]);

// Skills
$mktSkills = [
    [$resume2Id, 'Demand Generation', 'expert', 'Strategy', 0],
    [$resume2Id, 'Content Strategy', 'expert', 'Strategy', 1],
    [$resume2Id, 'Marketing Analytics', 'expert', 'Analytics', 2],
    [$resume2Id, 'ABM (Account-Based Marketing)', 'advanced', 'Strategy', 3],
    [$resume2Id, 'HubSpot', 'expert', 'Tools', 4],
    [$resume2Id, 'Salesforce', 'advanced', 'Tools', 5],
    [$resume2Id, 'Google Analytics', 'expert', 'Analytics', 6],
    [$resume2Id, 'SEO/SEM', 'advanced', 'Digital', 7],
    [$resume2Id, 'Figma', 'intermediate', 'Design', 8],
    [$resume2Id, 'SQL', 'intermediate', 'Analytics', 9],
    [$resume2Id, 'Team Leadership', 'expert', 'Management', 10],
    [$resume2Id, 'Budget Management', 'advanced', 'Management', 11],
];

foreach ($mktSkills as $skill) {
    $stmtSkill->execute($skill);
}

// Projects
$stmtProj->execute([$resume2Id, 'SaaS Growth Playbook', 'Authored comprehensive 80-page guide on B2B SaaS marketing strategies, distributed to 10,000+ marketing professionals.', 'https://jordanrivera.co/playbook', 'Content Marketing, Research, Design', '2023-03', '2023-06', '["Downloaded 10,000+ times in first 3 months","Featured in MarketingProfs and Content Marketing Institute","Generated 800+ qualified leads for consulting services"]', 0]);
$stmtProj->execute([$resume2Id, 'Marketing Analytics Dashboard', 'Built custom marketing attribution dashboard connecting HubSpot, Google Analytics, and Salesforce data for executive reporting.', 'https://jordanrivera.co/portfolio/dashboard', 'Looker, SQL, HubSpot API, Python', '2022-08', '2022-11', '["Reduced monthly reporting time from 20 hours to 2 hours","Adopted by 3 other marketing teams within the organization","Enabled real-time budget reallocation based on channel performance"]', 1]);

// Certifications
$stmtCert->execute([$resume2Id, 'HubSpot Inbound Marketing Certification', 'HubSpot Academy', '2023-02', '2025-02', 'HIMC-2023-9921', 'https://academy.hubspot.com/verify', 0]);
$stmtCert->execute([$resume2Id, 'Google Analytics 4 Certification', 'Google', '2023-05', '2025-05', 'GA4-7788-2023', 'https://skillshop.google.com/verify', 1]);

// Languages
$stmtLang->execute([$resume2Id, 'English', 'native', 0]);
$stmtLang->execute([$resume2Id, 'Portuguese', 'professional', 1]);
$stmtLang->execute([$resume2Id, 'French', 'conversational', 2]);

echo "  Created resume: Marketing Manager (score: 88)\n";
echo "\nSeeding complete! Demo account ready.\n";
echo "  Email: demo@jobcollar.com\n";
echo "  Password: password\n";
