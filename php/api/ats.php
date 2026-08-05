<?php

declare(strict_types=1);

function handleAtsCheck(array $params): void
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
    $awards = $db->fetchAll('SELECT * FROM resume_awards WHERE resume_id = ?', [$resumeId]);
    $languages = $db->fetchAll('SELECT * FROM resume_languages WHERE resume_id = ?', [$resumeId]);
    $volunteer = $db->fetchAll('SELECT * FROM resume_volunteer WHERE resume_id = ?', [$resumeId]);

    $checks = [];
    $suggestions = [];

    // 1. Section completeness (30%)
    $totalSections = 7; // personal, summary, experience, education, skills, projects, certifications
    $filledSections = 0;

    $hasPersonal = $personal && ($personal['first_name'] !== '' || $personal['last_name'] !== '');
    if ($hasPersonal) $filledSections++;

    $hasSummary = $summary && $summary['content'] !== '';
    if ($hasSummary) $filledSections++;

    if (!empty($experience)) $filledSections++;
    if (!empty($education)) $filledSections++;
    if (!empty($skills)) $filledSections++;
    if (!empty($projects)) $filledSections++;
    if (!empty($certifications)) $filledSections++;

    $completenessScore = ($filledSections / $totalSections) * 100;
    $checks['section_completeness'] = [
        'score' => round($completenessScore),
        'filled' => $filledSections,
        'total' => $totalSections,
        'pass' => $completenessScore >= 70,
    ];

    if ($completenessScore < 70) {
        if (!$hasPersonal) $suggestions[] = 'Add your personal/contact information';
        if (!$hasSummary) $suggestions[] = 'Write a professional summary';
        if (empty($experience)) $suggestions[] = 'Add work experience';
        if (empty($education)) $suggestions[] = 'Add education details';
        if (empty($skills)) $suggestions[] = 'List your skills';
    }

    // 2. Action verbs in experience (20%)
    $actionVerbs = [
        'achieved', 'administered', 'analyzed', 'built', 'collaborated', 'completed',
        'conducted', 'created', 'decreased', 'delivered', 'designed', 'developed',
        'directed', 'drove', 'enhanced', 'established', 'executed', 'expanded',
        'generated', 'grew', 'identified', 'implemented', 'improved', 'increased',
        'initiated', 'introduced', 'launched', 'led', 'managed', 'mentored',
        'negotiated', 'optimized', 'orchestrated', 'organized', 'oversaw', 'partnered',
        'pioneered', 'planned', 'produced', 'reduced', 'restructured', 'revamped',
        'scaled', 'simplified', 'spearheaded', 'streamlined', 'strengthened',
        'supervised', 'transformed', 'utilized',
    ];

    $verbCount = 0;
    $totalDescLines = 0;
    foreach ($experience as $exp) {
        $lines = array_filter(explode("\n", $exp['description']));
        $totalDescLines += count($lines);
        foreach ($lines as $line) {
            $firstWord = strtolower(trim(explode(' ', trim($line))[0]));
            // Check if the first word starts with any action verb
            foreach ($actionVerbs as $verb) {
                if (str_starts_with($firstWord, $verb)) {
                    $verbCount++;
                    break;
                }
            }
        }
    }

    $actionVerbScore = $totalDescLines > 0 ? min(100, ($verbCount / max($totalDescLines, 1)) * 100) : 0;
    $checks['action_verbs'] = [
        'score' => round($actionVerbScore),
        'count' => $verbCount,
        'total_lines' => $totalDescLines,
        'pass' => $actionVerbScore >= 50,
    ];

    if ($actionVerbScore < 50) {
        $suggestions[] = 'Start more bullet points with strong action verbs (e.g., Led, Developed, Implemented)';
    }

    // 3. Quantified achievements (15%)
    $numberCount = 0;
    foreach ($experience as $exp) {
        $numberCount += preg_match_all('/\d+[%$+]|\$\d+|\d+\s*(users|customers|clients|projects|team|members|revenue|sales|percent)|\d+x/i', $exp['description']);
    }

    $numbersScore = min(100, ($numberCount / max(count($experience), 1)) * 50);
    $checks['numbers'] = [
        'score' => round($numbersScore),
        'quantified_achievements' => $numberCount,
        'pass' => $numbersScore >= 40,
    ];

    if ($numbersScore < 40) {
        $suggestions[] = 'Add more quantified achievements (numbers, percentages, dollar amounts)';
    }

    // 4. Proper length (10%)
    $allText = '';
    if ($personal) {
        $allText .= implode(' ', array_values(array_filter([$personal['first_name'], $personal['last_name'], $personal['job_title']])));
    }
    if ($summary) $allText .= ' ' . $summary['content'];
    foreach ($experience as $e) $allText .= ' ' . $e['position'] . ' ' . $e['company'] . ' ' . $e['description'];
    foreach ($education as $e) $allText .= ' ' . $e['degree'] . ' ' . $e['institution'] . ' ' . $e['description'];
    foreach ($skills as $s) $allText .= ' ' . $s['name'];

    $wordCount = str_word_count($allText);
    $lengthScore = match (true) {
        $wordCount >= 400 && $wordCount <= 800 => 100,
        $wordCount >= 300 && $wordCount < 400  => 70,
        $wordCount > 800 && $wordCount <= 1000 => 70,
        $wordCount >= 200 && $wordCount < 300  => 40,
        $wordCount > 1000 && $wordCount <= 1200 => 40,
        default => 20,
    };

    $checks['length'] = [
        'score' => $lengthScore,
        'word_count' => $wordCount,
        'ideal_range' => '400-800 words',
        'pass' => $lengthScore >= 70,
    ];

    if ($wordCount < 400) {
        $suggestions[] = "Resume is too short ($wordCount words). Aim for 400-800 words.";
    } elseif ($wordCount > 800) {
        $suggestions[] = "Resume may be too long ($wordCount words). Consider trimming to 400-800 words.";
    }

    // 5. Skills count (10%)
    $skillCount = count($skills);
    $skillsScore = match (true) {
        $skillCount >= 8 => 100,
        $skillCount >= 5 => 70,
        $skillCount >= 3 => 50,
        $skillCount >= 1 => 30,
        default => 0,
    };

    $checks['keyword_density'] = [
        'score' => $skillsScore,
        'skill_count' => $skillCount,
        'pass' => $skillsScore >= 70,
    ];

    if ($skillCount < 5) {
        $suggestions[] = "Add more skills ($skillCount listed, recommend at least 8)";
    }

    // 6. Formatting (10%)
    $formatScore = 100;
    $formatIssues = [];

    if ($personal && $personal['email'] === '') {
        $formatScore -= 25;
        $formatIssues[] = 'Missing contact email';
    }
    if ($personal && $personal['phone'] === '') {
        $formatScore -= 15;
        $formatIssues[] = 'Missing phone number';
    }
    if ($personal && $personal['location'] === '') {
        $formatScore -= 10;
        $formatIssues[] = 'Missing location';
    }

    $sectionOrder = json_decode($resume['section_order'], true) ?? [];
    $expectedOrder = ['personal', 'summary', 'experience', 'education', 'skills'];
    $orderMatch = true;
    foreach ($expectedOrder as $i => $sec) {
        $pos = array_search($sec, $sectionOrder);
        if ($pos === false || $pos !== $i) {
            $orderMatch = false;
            break;
        }
    }
    if (!$orderMatch) {
        $formatScore -= 20;
        $formatIssues[] = 'Consider standard section ordering (Personal > Summary > Experience > Education > Skills)';
    }

    $formatScore = max(0, $formatScore);
    $checks['formatting'] = [
        'score' => $formatScore,
        'issues' => $formatIssues,
        'pass' => $formatScore >= 70,
    ];
    $suggestions = array_merge($suggestions, $formatIssues);

    // 7. Readability (5%)
    $readabilityScore = 100;
    if ($summary && strlen($summary['content']) > 500) {
        $readabilityScore -= 30;
        $suggestions[] = 'Keep your summary under 500 characters for readability';
    }

    $longDescriptions = 0;
    foreach ($experience as $exp) {
        if (strlen($exp['description']) > 1000) {
            $longDescriptions++;
        }
    }
    if ($longDescriptions > 0) {
        $readabilityScore -= $longDescriptions * 15;
        $suggestions[] = 'Some experience descriptions are very long. Keep them concise.';
    }

    $readabilityScore = max(0, $readabilityScore);
    $checks['readability'] = [
        'score' => $readabilityScore,
        'pass' => $readabilityScore >= 70,
    ];

    // Final score: weighted average
    $score = (int) round(
        ($completenessScore * 0.30) +
        ($actionVerbScore * 0.20) +
        ($numbersScore * 0.15) +
        ($lengthScore * 0.10) +
        ($skillsScore * 0.10) +
        ($formatScore * 0.10) +
        ($readabilityScore * 0.05)
    );

    $score = max(0, min(100, $score));

    $db->execute('UPDATE resumes SET ats_score = ? WHERE id = ?', [$score, $resumeId]);

    jsonSuccess([
        'score' => $score,
        'checks' => $checks,
        'suggestions' => array_values(array_unique($suggestions)),
    ]);
}
