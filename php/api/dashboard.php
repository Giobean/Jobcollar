<?php

declare(strict_types=1);

function handleDashboard(array $params): void
{
    $db = Database::getInstance();
    $userId = Auth::id();

    $totalApps = $db->fetch(
        'SELECT COUNT(*) as cnt FROM applications WHERE user_id = ? AND is_archived = 0',
        [$userId]
    )['cnt'];

    $interviewStatusId = $db->fetch(
        "SELECT id FROM job_statuses WHERE user_id = ? AND name = 'Interview'",
        [$userId]
    );
    $totalInterviews = 0;
    if ($interviewStatusId) {
        $totalInterviews = $db->fetch(
            'SELECT COUNT(*) as cnt FROM applications WHERE user_id = ? AND status_id = ? AND is_archived = 0',
            [$userId, $interviewStatusId['id']]
        )['cnt'];
    }

    $offerStatusId = $db->fetch(
        "SELECT id FROM job_statuses WHERE user_id = ? AND name = 'Offer'",
        [$userId]
    );
    $totalOffers = 0;
    if ($offerStatusId) {
        $totalOffers = $db->fetch(
            'SELECT COUNT(*) as cnt FROM applications WHERE user_id = ? AND status_id = ? AND is_archived = 0',
            [$userId, $offerStatusId['id']]
        )['cnt'];
    }

    $totalResumes = $db->fetch(
        'SELECT COUNT(*) as cnt FROM resumes WHERE user_id = ?',
        [$userId]
    )['cnt'];

    $avgResume = $db->fetch(
        'SELECT AVG(resume_score) as avg_score FROM resumes WHERE user_id = ? AND resume_score IS NOT NULL',
        [$userId]
    );
    $resumeScore = $avgResume['avg_score'] !== null ? round((float) $avgResume['avg_score']) : null;

    $avgAts = $db->fetch(
        'SELECT AVG(ats_score) as avg_score FROM resumes WHERE user_id = ? AND ats_score IS NOT NULL',
        [$userId]
    );
    $atsScore = $avgAts['avg_score'] !== null ? round((float) $avgAts['avg_score']) : null;

    $recentResumes = $db->fetchAll(
        'SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5',
        [$userId]
    );

    $recentApplications = $db->fetchAll(
        'SELECT a.*, js.name as status_name, js.color as status_color
         FROM applications a
         LEFT JOIN job_statuses js ON a.status_id = js.id
         WHERE a.user_id = ? AND a.is_archived = 0
         ORDER BY a.created_at DESC LIMIT 5',
        [$userId]
    );

    $statusCounts = $db->fetchAll(
        'SELECT js.name, js.color, COUNT(a.id) as count
         FROM job_statuses js
         LEFT JOIN applications a ON a.status_id = js.id AND a.user_id = ? AND a.is_archived = 0
         WHERE js.user_id = ?
         GROUP BY js.id
         ORDER BY js.sort_order',
        [$userId, $userId]
    );

    jsonSuccess([
        'total_applications' => (int) $totalApps,
        'total_interviews'   => (int) $totalInterviews,
        'total_offers'       => (int) $totalOffers,
        'total_resumes'      => (int) $totalResumes,
        'resume_score'       => $resumeScore,
        'ats_score'          => $atsScore,
        'recent_resumes'     => $recentResumes,
        'recent_applications' => $recentApplications,
        'status_counts'      => $statusCounts,
    ]);
}
