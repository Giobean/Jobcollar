<?php

declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));

require_once BASE_PATH . '/php/classes/Database.php';

// Initialize DB first
$schemaFile = BASE_PATH . '/storage/database/schema.sql';
if (!file_exists($schemaFile)) {
    fwrite(STDERR, "Error: schema.sql not found\n");
    exit(1);
}

$db = Database::getInstance();
$db->getPdo()->exec(file_get_contents($schemaFile));

echo "Database initialized. Seeding data...\n";

// --- Demo User ---
$passwordHash = password_hash('password123', PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,
    'time_cost'   => 4,
    'threads'     => 1,
]);

$existing = $db->fetch('SELECT id FROM users WHERE email = ?', ['demo@jobcollar.com']);
if ($existing) {
    $db->execute('DELETE FROM users WHERE id = ?', [$existing['id']]);
    echo "Removed existing demo user.\n";
}

$db->execute(
    'INSERT INTO users (email, password_hash, name, theme, autosave) VALUES (?, ?, ?, ?, ?)',
    ['demo@jobcollar.com', $passwordHash, 'Alex Johnson', 'system', 1]
);
$userId = (int) $db->lastInsertId();
echo "Created demo user: demo@jobcollar.com / password123 (id: $userId)\n";

// --- Default Job Statuses ---
$statuses = [
    ['Wishlist', '#8b5cf6', 0],
    ['Applied', '#3b82f6', 1],
    ['Viewed', '#06b6d4', 2],
    ['Assessment', '#f59e0b', 3],
    ['Interview', '#f97316', 4],
    ['Offer', '#22c55e', 5],
    ['Rejected', '#ef4444', 6],
    ['Withdrawn', '#6b7280', 7],
    ['Ghosted', '#9ca3af', 8],
    ['Hired', '#10b981', 9],
];

$statusIds = [];
foreach ($statuses as [$name, $color, $order]) {
    $db->execute(
        'INSERT INTO job_statuses (user_id, name, color, sort_order, is_system) VALUES (?, ?, ?, ?, 1)',
        [$userId, $name, $color, $order]
    );
    $statusIds[$name] = (int) $db->lastInsertId();
}
echo "Created " . count($statuses) . " job statuses.\n";

// --- Resume 1: Software Engineer ---
$db->execute(
    'INSERT INTO resumes (user_id, title, template, color, font, is_primary) VALUES (?, ?, ?, ?, ?, ?)',
    [$userId, 'Software Engineer Resume', 'minimal', '#2563eb', 'Inter', 1]
);
$resume1 = (int) $db->lastInsertId();

$db->execute(
    'INSERT INTO resume_personal (resume_id, first_name, last_name, email, phone, location, website, linkedin, github, job_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [$resume1, 'Alex', 'Johnson', 'alex.johnson@email.com', '+1 (555) 123-4567', 'San Francisco, CA', 'https://alexjohnson.dev', 'https://linkedin.com/in/alexjohnson', 'https://github.com/alexjohnson', 'Senior Software Engineer']
);

$db->execute(
    'INSERT INTO resume_summary (resume_id, content) VALUES (?, ?)',
    [$resume1, 'Results-driven Senior Software Engineer with 6+ years of experience building scalable web applications and distributed systems. Proven track record of leading cross-functional teams, improving system performance by 40%, and delivering products used by millions of users. Passionate about clean code, developer experience, and mentoring junior engineers.']
);

// Experience
$experiences = [
    ['Stripe', 'Senior Software Engineer', 'San Francisco, CA', '2022-03', '', 1,
     "Led the development of a new payment processing pipeline that handles 50,000+ transactions per second\nArchitected microservices migration reducing deployment time by 60%\nMentored 4 junior engineers, with 2 earning promotions within 12 months\nImplemented automated testing framework increasing code coverage from 65% to 94%", 0],
    ['Airbnb', 'Software Engineer', 'San Francisco, CA', '2020-01', '2022-02', 0,
     "Developed real-time pricing algorithm that increased revenue by 15% across 100,000+ listings\nBuilt React component library used by 30+ frontend engineers across 5 teams\nOptimized database queries reducing average API response time from 800ms to 120ms\nSpearheaded accessibility initiative bringing platform to WCAG 2.1 AA compliance", 1],
    ['Twilio', 'Junior Software Engineer', 'San Francisco, CA', '2018-06', '2019-12', 0,
     "Designed and built REST APIs serving 10 million requests daily\nCreated automated deployment pipeline reducing release cycles from 2 weeks to 2 days\nCollaborated with product team to launch 3 features that grew user base by 25%", 2],
];

foreach ($experiences as [$company, $position, $location, $start, $end, $current, $desc, $order]) {
    $db->execute(
        'INSERT INTO resume_experience (resume_id, company, position, location, start_date, end_date, is_current, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$resume1, $company, $position, $location, $start, $end, $current, $desc, $order]
    );
}

// Education
$educations = [
    ['Stanford University', 'Bachelor of Science', 'Computer Science', 'Stanford, CA', '2014-09', '2018-05', '3.8', 'Dean\'s List, ACM Programming Competition finalist', 0],
    ['Coursera / Google', 'Professional Certificate', 'Cloud Architecture', 'Online', '2021-01', '2021-06', '', 'Google Cloud Professional Cloud Architect certification prep', 1],
];

foreach ($educations as [$inst, $degree, $field, $loc, $start, $end, $gpa, $desc, $order]) {
    $db->execute(
        'INSERT INTO resume_education (resume_id, institution, degree, field, location, start_date, end_date, gpa, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$resume1, $inst, $degree, $field, $loc, $start, $end, $gpa, $desc, $order]
    );
}

// Skills
$skillsData = [
    ['TypeScript', 'expert', 'Programming Languages'],
    ['Python', 'expert', 'Programming Languages'],
    ['React', 'expert', 'Frontend'],
    ['Node.js', 'advanced', 'Backend'],
    ['PostgreSQL', 'advanced', 'Databases'],
    ['AWS', 'advanced', 'Cloud & DevOps'],
    ['Docker', 'advanced', 'Cloud & DevOps'],
    ['GraphQL', 'intermediate', 'APIs'],
];

foreach ($skillsData as $i => [$name, $level, $category]) {
    $db->execute(
        'INSERT INTO resume_skills (resume_id, name, level, category, sort_order) VALUES (?, ?, ?, ?, ?)',
        [$resume1, $name, $level, $category, $i]
    );
}

// Projects
$projectsData = [
    ['DevMetrics Dashboard', 'https://github.com/alexjohnson/devmetrics', 'Open-source developer productivity dashboard with GitHub integration. Tracks PR cycle time, code review velocity, and deployment frequency. 500+ GitHub stars.', 'React, TypeScript, D3.js, Node.js', '2023-01', '2023-06'],
    ['CloudSync', 'https://github.com/alexjohnson/cloudsync', 'Multi-cloud file synchronization tool supporting AWS S3, GCP Cloud Storage, and Azure Blob. Handles 10TB+ datasets with incremental sync and conflict resolution.', 'Go, gRPC, Docker, Terraform', '2022-06', '2022-12'],
];

foreach ($projectsData as $i => [$name, $url, $desc, $tech, $start, $end]) {
    $db->execute(
        'INSERT INTO resume_projects (resume_id, name, url, description, technologies, start_date, end_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [$resume1, $name, $url, $desc, $tech, $start, $end, $i]
    );
}

// Certifications
$certsData = [
    ['AWS Solutions Architect Professional', 'Amazon Web Services', '2023-03', '2026-03', 'SAP-C02-12345', 'https://aws.amazon.com/certification/'],
    ['Google Cloud Professional Cloud Architect', 'Google', '2021-08', '2024-08', 'GCP-PCA-67890', 'https://cloud.google.com/certification'],
];

foreach ($certsData as $i => [$name, $issuer, $obtained, $expiry, $credId, $url]) {
    $db->execute(
        'INSERT INTO resume_certifications (resume_id, name, issuer, date_obtained, expiry_date, credential_id, url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [$resume1, $name, $issuer, $obtained, $expiry, $credId, $url, $i]
    );
}

// Awards
$db->execute(
    'INSERT INTO resume_awards (resume_id, title, issuer, date_received, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [$resume1, 'Engineering Excellence Award', 'Stripe', '2023-06', 'Awarded for outstanding contributions to payment infrastructure reliability', 0]
);

// Languages
$languagesData = [
    ['English', 'native', 0],
    ['Spanish', 'professional', 1],
    ['Mandarin', 'conversational', 2],
];

foreach ($languagesData as [$name, $prof, $order]) {
    $db->execute(
        'INSERT INTO resume_languages (resume_id, name, proficiency, sort_order) VALUES (?, ?, ?, ?)',
        [$resume1, $name, $prof, $order]
    );
}

echo "Created Resume 1: Software Engineer Resume (id: $resume1)\n";

// --- Resume 2: Product Manager ---
$db->execute(
    'INSERT INTO resumes (user_id, title, template, color, font) VALUES (?, ?, ?, ?, ?)',
    [$userId, 'Product Manager Resume', 'modern', '#7c3aed', 'Poppins']
);
$resume2 = (int) $db->lastInsertId();

$db->execute(
    'INSERT INTO resume_personal (resume_id, first_name, last_name, email, phone, location, website, linkedin, github, job_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [$resume2, 'Alex', 'Johnson', 'alex.johnson@email.com', '+1 (555) 123-4567', 'San Francisco, CA', 'https://alexjohnson.dev', 'https://linkedin.com/in/alexjohnson', '', 'Senior Product Manager']
);

$db->execute(
    'INSERT INTO resume_summary (resume_id, content) VALUES (?, ?)',
    [$resume2, 'Customer-obsessed Product Manager with 5+ years of experience shipping B2B SaaS products. Expert at translating complex technical requirements into intuitive user experiences. Successfully launched 8 products generating $12M+ in ARR. Strong background in data-driven decision making and agile methodologies.']
);

$pm_experiences = [
    ['Figma', 'Senior Product Manager', 'San Francisco, CA', '2022-01', '', 1,
     "Led product strategy for collaboration features used by 4M+ designers\nDrove 35% increase in team workspace adoption through improved onboarding\nManaged roadmap for a 12-person cross-functional team across 3 time zones", 0],
    ['Notion', 'Product Manager', 'San Francisco, CA', '2020-03', '2021-12', 0,
     "Launched database relations feature generating \$3M in new enterprise revenue\nConducted 200+ user interviews to identify top pain points and opportunities\nReduced churn by 18% through targeted feature improvements", 1],
    ['Asana', 'Associate Product Manager', 'San Francisco, CA', '2018-08', '2020-02', 0,
     "Shipped timeline view feature adopted by 500,000+ teams in first quarter\nDesigned A/B testing framework improving experiment velocity by 3x\nCollaborated with engineering to reduce feature delivery time by 40%", 2],
];

foreach ($pm_experiences as [$company, $position, $location, $start, $end, $current, $desc, $order]) {
    $db->execute(
        'INSERT INTO resume_experience (resume_id, company, position, location, start_date, end_date, is_current, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$resume2, $company, $position, $location, $start, $end, $current, $desc, $order]
    );
}

$pm_educations = [
    ['UC Berkeley', 'Master of Business Administration', 'Technology Management', 'Berkeley, CA', '2016-08', '2018-05', '3.9', 'Haas School of Business, Technology Club President', 0],
    ['UCLA', 'Bachelor of Arts', 'Economics', 'Los Angeles, CA', '2012-09', '2016-06', '3.7', 'Cum Laude, Economics Honors Society', 1],
];

foreach ($pm_educations as [$inst, $degree, $field, $loc, $start, $end, $gpa, $desc, $order]) {
    $db->execute(
        'INSERT INTO resume_education (resume_id, institution, degree, field, location, start_date, end_date, gpa, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$resume2, $inst, $degree, $field, $loc, $start, $end, $gpa, $desc, $order]
    );
}

$pm_skills = [
    ['Product Strategy', 'expert', 'Product'],
    ['User Research', 'expert', 'Product'],
    ['Data Analysis', 'advanced', 'Analytics'],
    ['SQL', 'advanced', 'Technical'],
    ['Figma', 'advanced', 'Design'],
    ['A/B Testing', 'advanced', 'Analytics'],
    ['Agile/Scrum', 'expert', 'Process'],
    ['Jira', 'expert', 'Tools'],
];

foreach ($pm_skills as $i => [$name, $level, $category]) {
    $db->execute(
        'INSERT INTO resume_skills (resume_id, name, level, category, sort_order) VALUES (?, ?, ?, ?, ?)',
        [$resume2, $name, $level, $category, $i]
    );
}

$pm_projects = [
    ['Product Analytics Framework', '', 'Built an internal analytics framework to standardize product metrics across 5 product teams. Reduced metric definition inconsistencies by 80%.', 'Amplitude, SQL, Looker', '2022-06', '2022-09'],
    ['Customer Journey Mapping Tool', '', 'Created a visual customer journey mapping tool adopted by the entire product org. Improved feature prioritization alignment by 45%.', 'Miro, Notion, Custom Scripts', '2021-03', '2021-08'],
];

foreach ($pm_projects as $i => [$name, $url, $desc, $tech, $start, $end]) {
    $db->execute(
        'INSERT INTO resume_projects (resume_id, name, url, description, technologies, start_date, end_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [$resume2, $name, $url, $desc, $tech, $start, $end, $i]
    );
}

$pm_certs = [
    ['Certified Scrum Product Owner (CSPO)', 'Scrum Alliance', '2020-05', '2024-05', 'CSPO-2020-1234', 'https://www.scrumalliance.org'],
    ['Google Analytics Certified', 'Google', '2021-02', '2024-02', 'GA-2021-5678', 'https://skillshop.withgoogle.com'],
];

foreach ($pm_certs as $i => [$name, $issuer, $obtained, $expiry, $credId, $url]) {
    $db->execute(
        'INSERT INTO resume_certifications (resume_id, name, issuer, date_obtained, expiry_date, credential_id, url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [$resume2, $name, $issuer, $obtained, $expiry, $credId, $url, $i]
    );
}

$db->execute(
    'INSERT INTO resume_awards (resume_id, title, issuer, date_received, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [$resume2, 'Product Leader of the Year', 'Figma', '2023-01', 'Recognized for driving highest-impact product initiative of 2022', 0]
);

foreach ($languagesData as [$name, $prof, $order]) {
    $db->execute(
        'INSERT INTO resume_languages (resume_id, name, proficiency, sort_order) VALUES (?, ?, ?, ?)',
        [$resume2, $name, $prof, $order]
    );
}

echo "Created Resume 2: Product Manager Resume (id: $resume2)\n";

// --- Job Applications ---
$applications = [
    ['Google', 'Senior Software Engineer', 80000, 120000, 'Mountain View, CA', 'hybrid', 'https://careers.google.com/jobs/123', '2024-01-15', 'Sarah Chen', 'sarah@google.com', 'Phone screen scheduled for next week', 'Interview'],
    ['Meta', 'Staff Engineer', 90000, 140000, 'Menlo Park, CA', 'remote', 'https://metacareers.com/jobs/456', '2024-01-10', '', '', 'Completed online assessment', 'Assessment'],
    ['Netflix', 'Senior Software Engineer', 100000, 150000, 'Los Gatos, CA', 'onsite', 'https://jobs.netflix.com/789', '2024-01-05', 'Mike Davis', 'mike@netflix.com', 'Offer received! Negotiating salary.', 'Offer'],
    ['Apple', 'Software Engineer', 75000, 110000, 'Cupertino, CA', 'onsite', 'https://jobs.apple.com/101', '2024-01-20', '', '', 'Applied through referral', 'Applied'],
    ['Microsoft', 'Principal Engineer', 95000, 145000, 'Redmond, WA', 'hybrid', 'https://careers.microsoft.com/202', '2024-01-08', 'Lisa Park', 'lisa@microsoft.com', 'Rejected after final round', 'Rejected'],
    ['Amazon', 'SDE III', 85000, 130000, 'Seattle, WA', 'onsite', 'https://amazon.jobs/303', '2024-01-25', '', '', 'Interested in the team, will apply soon', 'Wishlist'],
    ['Spotify', 'Backend Engineer', 70000, 105000, 'New York, NY', 'remote', 'https://lifeatspotify.com/404', '2024-01-12', 'Tom Wilson', 'tom@spotify.com', 'Application viewed by recruiter', 'Viewed'],
    ['Uber', 'Software Engineer II', 72000, 108000, 'San Francisco, CA', 'hybrid', 'https://uber.com/careers/505', '2024-01-18', '', '', 'Withdrew to focus on other opportunities', 'Withdrawn'],
    ['Stripe', 'Staff Engineer', 95000, 150000, 'San Francisco, CA', 'hybrid', 'https://stripe.com/jobs/606', '2023-12-20', 'Emma Brown', 'emma@stripe.com', 'Got hired! Starting next month!', 'Hired'],
    ['Coinbase', 'Senior Engineer', 80000, 125000, 'Remote', 'remote', 'https://coinbase.com/careers/707', '2024-01-02', '', '', 'No response after 3 weeks', 'Ghosted'],
];

foreach ($applications as [$company, $position, $salMin, $salMax, $location, $workType, $url, $date, $recruiterName, $recruiterEmail, $notes, $statusName]) {
    $statusId = $statusIds[$statusName] ?? null;
    $db->execute(
        'INSERT INTO applications (user_id, company, position, salary_min, salary_max, location, work_type, url, date_applied, recruiter_name, recruiter_email, notes, status_id, resume_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$userId, $company, $position, $salMin, $salMax, $location, $workType, $url, $date, $recruiterName, $recruiterEmail, $notes, $statusId, $resume1]
    );
}

echo "Created 10 job applications.\n";
echo "\nSeeding complete!\n";
echo "Login: demo@jobcollar.com / password123\n";
