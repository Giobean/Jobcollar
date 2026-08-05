<?php

declare(strict_types=1);

function handleScoreCheck(array $params): void
{
    requireCsrf();

    $input = getJsonInput();
    $resumeId = (int) ($input['resume_id'] ?? 0);

    if ($resumeId <= 0) {
        jsonError('resume_id is required', 422);
    }

    $db = Database::getInstance();
    $resume = $db->fetch('SELECT * FROM resumes WHERE id = ? AND user_id = ?', [$resumeId, Auth::id()]);
    if (!$resume) {
        jsonError('Resume not found', 404);
    }

    $personal = $db->fetch('SELECT * FROM resume_personal WHERE resume_id = ?', [$resumeId]);
    $summary = $db->fetch('SELECT * FROM resume_summary WHERE resume_id = ?', [$resumeId]);
    $experience = $db->fetchAll('SELECT * FROM resume_experience WHERE resume_id = ?', [$resumeId]);
    $education = $db->fetchAll('SELECT * FROM resume_education WHERE resume_id = ?', [$resumeId]);
    $skills = $db->fetchAll('SELECT * FROM resume_skills WHERE resume_id = ?', [$resumeId]);
    $projects = $db->fetchAll('SELECT * FROM resume_projects WHERE resume_id = ?', [$resumeId]);
    $certifications = $db->fetchAll('SELECT * FROM resume_certifications WHERE resume_id = ?', [$resumeId]);

    $breakdown = [];
    $suggestions = [];

    // --- Completeness (40%) ---
    $completenessChecks = [
        'personal_info' => $personal && $personal['first_name'] !== '' && $personal['email'] !== '',
        'summary'       => $summary && $summary['content'] !== '',
        'experience'    => !empty($experience),
        'education'     => !empty($education),
        'skills'        => count($skills) >= 3,
        'projects'      => !empty($projects),
        'job_title'     => $personal && $personal['job_title'] !== '',
        'phone'         => $personal && $personal['phone'] !== '',
        'location'      => $personal && $personal['location'] !== '',
        'linkedin_or_website' => $personal && ($personal['linkedin'] !== '' || $personal['website'] !== ''),
    ];

    $filledCount = count(array_filter($completenessChecks));
    $completenessScore = ($filledCount / count($completenessChecks)) * 100;
    $breakdown['completeness'] = [
        'score'   => round($completenessScore),
        'details' => $completenessChecks,
    ];

    if (!$completenessChecks['personal_info']) $suggestions[] = 'Add your full name and email';
    if (!$completenessChecks['summary']) $suggestions[] = 'Write a professional summary';
    if (!$completenessChecks['experience']) $suggestions[] = 'Add work experience';
    if (!$completenessChecks['education']) $suggestions[] = 'Add your education';
    if (!$completenessChecks['skills']) $suggestions[] = 'Add at least 3 skills';
    if (!$completenessChecks['linkedin_or_website']) $suggestions[] = 'Add a LinkedIn URL or personal website';

    // --- Achievements (25%) ---
    $actionVerbs = [
        'achieved', 'built', 'created', 'delivered', 'designed', 'developed',
        'drove', 'enhanced', 'established', 'expanded', 'generated', 'grew',
        'implemented', 'improved', 'increased', 'initiated', 'launched', 'led',
        'managed', 'optimized', 'orchestrated', 'pioneered', 'reduced', 'scaled',
        'simplified', 'spearheaded', 'streamlined', 'transformed',
    ];

    $totalVerbs = 0;
    $totalNumbers = 0;
    $totalBullets = 0;

    foreach ($experience as $exp) {
        $lines = array_filter(array_map('trim', explode("\n", $exp['description'])));
        $totalBullets += count($lines);
        foreach ($lines as $line) {
            $firstWord = strtolower(explode(' ', $line)[0] ?? '');
            foreach ($actionVerbs as $verb) {
                if (str_starts_with($firstWord, $verb)) {
                    $totalVerbs++;
                    break;
                }
            }
            if (preg_match('/\d+/', $line)) {
                $totalNumbers++;
            }
        }
    }

    $verbRatio = $totalBullets > 0 ? ($totalVerbs / $totalBullets) * 100 : 0;
    $numberRatio = $totalBullets > 0 ? ($totalNumbers / $totalBullets) * 100 : 0;
    $achievementScore = min(100, ($verbRatio * 0.6) + ($numberRatio * 0.4));

    $breakdown['achievements'] = [
        'score'         => round($achievementScore),
        'action_verbs'  => $totalVerbs,
        'quantified'    => $totalNumbers,
        'total_bullets' => $totalBullets,
    ];

    if ($verbRatio < 50) $suggestions[] = 'Use more action verbs to start your experience bullet points';
    if ($numberRatio < 30) $suggestions[] = 'Quantify more achievements with numbers, percentages, or dollar amounts';

    // --- Keywords (20%) ---
    $skillCount = count($skills);
    $hasCategories = count(array_filter($skills, fn($s) => $s['category'] !== '')) > 0;

    $keywordScore = match (true) {
        $skillCount >= 10 && $hasCategories => 100,
        $skillCount >= 8  => 85,
        $skillCount >= 5  => 65,
        $skillCount >= 3  => 45,
        $skillCount >= 1  => 25,
        default           => 0,
    };

    // Bonus for certifications
    if (!empty($certifications)) {
        $keywordScore = min(100, $keywordScore + 10);
    }

    $breakdown['keywords'] = [
        'score'          => $keywordScore,
        'skill_count'    => $skillCount,
        'has_categories' => $hasCategories,
        'certifications' => count($certifications),
    ];

    if ($skillCount < 8) $suggestions[] = "Add more skills (currently $skillCount, aim for 8+)";
    if (!$hasCategories && $skillCount > 0) $suggestions[] = 'Categorize your skills for better organization';

    // --- Formatting (15%) ---
    $sectionOrder = json_decode($resume['section_order'], true) ?? [];
    $hasSensibleOrder = true;
    $experiencePos = array_search('experience', $sectionOrder);
    $educationPos = array_search('education', $sectionOrder);
    $summaryPos = array_search('summary', $sectionOrder);

    if ($summaryPos !== false && $experiencePos !== false && $summaryPos > $experiencePos) {
        $hasSensibleOrder = false;
    }

    $formatScore = 70;
    if ($hasSensibleOrder) $formatScore += 15;
    if (count($experience) > 0) {
        $avgDescLen = array_sum(array_map(fn($e) => strlen($e['description']), $experience)) / count($experience);
        if ($avgDescLen >= 100 && $avgDescLen <= 600) {
            $formatScore += 15;
        }
    }

    $formatScore = min(100, $formatScore);

    $breakdown['formatting'] = [
        'score'          => $formatScore,
        'sensible_order' => $hasSensibleOrder,
    ];

    if (!$hasSensibleOrder) $suggestions[] = 'Put your summary before experience for better flow';

    // --- Length ---
    $allText = '';
    if ($personal) {
        $allText .= $personal['first_name'] . ' ' . $personal['last_name'] . ' ' . $personal['job_title'] . ' ';
    }
    if ($summary) $allText .= $summary['content'] . ' ';
    foreach ($experience as $e) $allText .= $e['position'] . ' ' . $e['company'] . ' ' . $e['description'] . ' ';
    foreach ($education as $e) $allText .= $e['degree'] . ' ' . $e['institution'] . ' ' . $e['description'] . ' ';
    foreach ($skills as $s) $allText .= $s['name'] . ' ';

    $wordCount = str_word_count($allText);
    $lengthScore = match (true) {
        $wordCount >= 400 && $wordCount <= 800 => 100,
        $wordCount >= 300 && $wordCount < 400  => 75,
        $wordCount > 800 && $wordCount <= 1000 => 75,
        $wordCount >= 200 && $wordCount < 300  => 50,
        $wordCount > 1000                       => 40,
        default                                 => 25,
    };

    $breakdown['length'] = [
        'score'      => $lengthScore,
        'word_count' => $wordCount,
        'ideal'      => '400-800 words',
    ];

    if ($wordCount < 400) $suggestions[] = "Your resume is short ($wordCount words). Aim for 400-800 words.";
    if ($wordCount > 800) $suggestions[] = "Your resume is long ($wordCount words). Consider condensing to 400-800 words.";

    // Final weighted score
    $score = (int) round(
        ($completenessScore * 0.40) +
        ($achievementScore * 0.25) +
        ($keywordScore * 0.20) +
        ($formatScore * 0.15)
    );

    $score = max(0, min(100, $score));

    $db->execute('UPDATE resumes SET resume_score = ? WHERE id = ?', [$score, $resumeId]);

    jsonSuccess([
        'score'       => $score,
        'breakdown'   => $breakdown,
        'suggestions' => array_values(array_unique($suggestions)),
    ]);
}
