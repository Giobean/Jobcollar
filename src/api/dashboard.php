<?php

function handleDashboard(): void
{
    $db = Database::getInstance();
    $userId = Auth::id();

    $totalResumes = $db->fetch(
        'SELECT COUNT(*) as count FROM resumes WHERE user_id = ?',
        [$userId]
    );

    $recentResumes = $db->fetchAll(
        'SELECT id, title, slug, template, score, last_edited_at, created_at FROM resumes WHERE user_id = ? ORDER BY last_edited_at DESC LIMIT 5',
        [$userId]
    );

    jsonResponse([
        'total_resumes' => (int) ($totalResumes['count'] ?? 0),
        'recent_resumes' => $recentResumes,
    ]);
}
