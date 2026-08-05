<?php

declare(strict_types=1);

// Section name → table name mapping
function sectionTable(string $section): string
{
    return match ($section) {
        'experience'     => 'resume_experience',
        'education'      => 'resume_education',
        'skills'         => 'resume_skills',
        'projects'       => 'resume_projects',
        'certifications' => 'resume_certifications',
        'awards'         => 'resume_awards',
        'languages'      => 'resume_languages',
        'volunteer'      => 'resume_volunteer',
        'references'     => 'resume_references',
        'custom'         => 'resume_custom_sections',
        default          => throw new InvalidArgumentException("Unknown section: $section"),
    };
}

// Extract the section name from the current request URI
function extractSection(string $uri): string
{
    if (preg_match('#/resumes/\d+/(\w+)#', $uri, $m)) {
        return $m[1];
    }
    throw new InvalidArgumentException('Cannot determine section from URI');
}

// Allowed columns per section table (excludes id, resume_id, sort_order)
function sectionColumns(string $section): array
{
    return match ($section) {
        'experience'     => ['company', 'position', 'location', 'start_date', 'end_date', 'is_current', 'description'],
        'education'      => ['institution', 'degree', 'field', 'location', 'start_date', 'end_date', 'gpa', 'description'],
        'skills'         => ['name', 'level', 'category'],
        'projects'       => ['name', 'url', 'description', 'technologies', 'start_date', 'end_date'],
        'certifications' => ['name', 'issuer', 'date_obtained', 'expiry_date', 'credential_id', 'url'],
        'awards'         => ['title', 'issuer', 'date_received', 'description'],
        'languages'      => ['name', 'proficiency'],
        'volunteer'      => ['organization', 'role', 'location', 'start_date', 'end_date', 'description'],
        'references'     => ['name', 'position', 'company', 'email', 'phone', 'relationship'],
        'custom'         => ['title', 'content'],
        default          => [],
    };
}

function verifyOwnership(int $resumeId): array
{
    $db = Database::getInstance();
    $resume = $db->fetch('SELECT * FROM resumes WHERE id = ? AND user_id = ?', [$resumeId, Auth::id()]);
    if (!$resume) {
        jsonError('Resume not found', 404);
    }
    return $resume;
}

function touchResume(int $resumeId): void
{
    Database::getInstance()->execute(
        "UPDATE resumes SET updated_at = datetime('now') WHERE id = ?",
        [$resumeId]
    );
}

// --- Handlers ---

function handleListResumes(array $params): void
{
    $db = Database::getInstance();
    $resumes = $db->fetchAll(
        'SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC',
        [Auth::id()]
    );
    jsonSuccess($resumes);
}

function handleCreateResume(array $params): void
{
    requireCsrf();
    $input = sanitize(getJsonInput());
    $db = Database::getInstance();

    $title    = $input['title'] ?? 'Untitled Resume';
    $template = $input['template'] ?? 'minimal';
    $color    = $input['color'] ?? '#2563eb';
    $font     = $input['font'] ?? 'Inter';

    $db->execute(
        'INSERT INTO resumes (user_id, title, template, color, font) VALUES (?, ?, ?, ?, ?)',
        [Auth::id(), $title, $template, $color, $font]
    );

    $resumeId = (int) $db->lastInsertId();

    // Create empty personal and summary records
    $db->execute('INSERT INTO resume_personal (resume_id) VALUES (?)', [$resumeId]);
    $db->execute('INSERT INTO resume_summary (resume_id) VALUES (?)', [$resumeId]);

    $resume = $db->fetch('SELECT * FROM resumes WHERE id = ?', [$resumeId]);
    jsonSuccess($resume, 201);
}

function handleGetResume(array $params): void
{
    $resumeId = (int) $params['id'];
    $resume = verifyOwnership($resumeId);
    $db = Database::getInstance();

    $resume['personal'] = $db->fetch('SELECT * FROM resume_personal WHERE resume_id = ?', [$resumeId]);
    $resume['summary'] = $db->fetch('SELECT * FROM resume_summary WHERE resume_id = ?', [$resumeId]);
    $resume['experience'] = $db->fetchAll('SELECT * FROM resume_experience WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);
    $resume['education'] = $db->fetchAll('SELECT * FROM resume_education WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);
    $resume['skills'] = $db->fetchAll('SELECT * FROM resume_skills WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);
    $resume['projects'] = $db->fetchAll('SELECT * FROM resume_projects WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);
    $resume['certifications'] = $db->fetchAll('SELECT * FROM resume_certifications WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);
    $resume['awards'] = $db->fetchAll('SELECT * FROM resume_awards WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);
    $resume['languages'] = $db->fetchAll('SELECT * FROM resume_languages WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);
    $resume['volunteer'] = $db->fetchAll('SELECT * FROM resume_volunteer WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);
    $resume['references'] = $db->fetchAll('SELECT * FROM resume_references WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);
    $resume['custom_sections'] = $db->fetchAll('SELECT * FROM resume_custom_sections WHERE resume_id = ? ORDER BY sort_order', [$resumeId]);

    $resume['section_order'] = json_decode($resume['section_order'], true);

    jsonSuccess($resume);
}

function handleUpdateResume(array $params): void
{
    requireCsrf();
    $resumeId = (int) $params['id'];
    verifyOwnership($resumeId);

    $input = sanitize(getJsonInput());
    $db = Database::getInstance();

    $allowedFields = ['title', 'template', 'color', 'font', 'spacing', 'is_primary'];
    $sets = [];
    $values = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $sets[] = "$field = ?";
            $values[] = $field === 'section_order' ? json_encode($input[$field]) : $input[$field];
        }
    }

    if (array_key_exists('section_order', $input)) {
        $sets[] = 'section_order = ?';
        $values[] = json_encode($input['section_order']);
    }

    if (!empty($sets)) {
        $sets[] = "updated_at = datetime('now')";
        $values[] = $resumeId;
        $db->execute('UPDATE resumes SET ' . implode(', ', $sets) . ' WHERE id = ?', $values);
    }

    $resume = $db->fetch('SELECT * FROM resumes WHERE id = ?', [$resumeId]);
    jsonSuccess($resume);
}

function handleDeleteResume(array $params): void
{
    requireCsrf();
    $resumeId = (int) $params['id'];
    verifyOwnership($resumeId);

    Database::getInstance()->execute('DELETE FROM resumes WHERE id = ?', [$resumeId]);
    jsonSuccess(['message' => 'Resume deleted']);
}

function handleUpdatePersonal(array $params): void
{
    requireCsrf();
    $resumeId = (int) $params['id'];
    verifyOwnership($resumeId);

    $input = sanitize(getJsonInput());
    $db = Database::getInstance();

    $cols = ['first_name', 'last_name', 'email', 'phone', 'location', 'website', 'linkedin', 'github', 'job_title'];
    $sets = [];
    $values = [];

    foreach ($cols as $col) {
        if (array_key_exists($col, $input)) {
            $sets[] = "$col = ?";
            $values[] = $input[$col];
        }
    }

    if (!empty($sets)) {
        $existing = $db->fetch('SELECT id FROM resume_personal WHERE resume_id = ?', [$resumeId]);
        if ($existing) {
            $values[] = $resumeId;
            $db->execute('UPDATE resume_personal SET ' . implode(', ', $sets) . ' WHERE resume_id = ?', $values);
        } else {
            $colNames = array_map(fn($s) => explode(' ', $s)[0], $sets);
            $placeholders = array_fill(0, count($values), '?');
            $values[] = $resumeId;
            $db->execute(
                'INSERT INTO resume_personal (' . implode(', ', $colNames) . ', resume_id) VALUES (' . implode(', ', $placeholders) . ', ?)',
                $values
            );
        }
    }

    touchResume($resumeId);
    $personal = $db->fetch('SELECT * FROM resume_personal WHERE resume_id = ?', [$resumeId]);
    jsonSuccess($personal);
}

function handleUpdateSummary(array $params): void
{
    requireCsrf();
    $resumeId = (int) $params['id'];
    verifyOwnership($resumeId);

    $input = getJsonInput();
    $content = $input['content'] ?? '';
    $db = Database::getInstance();

    $existing = $db->fetch('SELECT id FROM resume_summary WHERE resume_id = ?', [$resumeId]);
    if ($existing) {
        $db->execute('UPDATE resume_summary SET content = ? WHERE resume_id = ?', [$content, $resumeId]);
    } else {
        $db->execute('INSERT INTO resume_summary (resume_id, content) VALUES (?, ?)', [$resumeId, $content]);
    }

    touchResume($resumeId);
    $summary = $db->fetch('SELECT * FROM resume_summary WHERE resume_id = ?', [$resumeId]);
    jsonSuccess($summary);
}

function handleAddEntry(array $params): void
{
    requireCsrf();
    $resumeId = (int) $params['id'];
    verifyOwnership($resumeId);

    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $section = extractSection($uri);
    $table = sectionTable($section);
    $allowedCols = sectionColumns($section);

    $input = sanitize(getJsonInput());
    $db = Database::getInstance();

    // Get next sort order
    $maxOrder = $db->fetch("SELECT COALESCE(MAX(sort_order), -1) as m FROM {$table} WHERE resume_id = ?", [$resumeId]);
    $sortOrder = ($maxOrder['m'] ?? -1) + 1;

    $cols = ['resume_id', 'sort_order'];
    $vals = [$resumeId, $sortOrder];
    $placeholders = ['?', '?'];

    foreach ($allowedCols as $col) {
        if (array_key_exists($col, $input)) {
            $cols[] = $col;
            $vals[] = $col === 'is_current' ? (int) $input[$col] : $input[$col];
            $placeholders[] = '?';
        }
    }

    $db->execute(
        "INSERT INTO {$table} (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")",
        $vals
    );

    $entryId = (int) $db->lastInsertId();
    touchResume($resumeId);

    $entry = $db->fetch("SELECT * FROM {$table} WHERE id = ?", [$entryId]);
    jsonSuccess($entry, 201);
}

function handleUpdateEntry(array $params): void
{
    requireCsrf();
    $resumeId = (int) $params['id'];
    $entryId = (int) $params['entryId'];
    verifyOwnership($resumeId);

    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $section = extractSection($uri);
    $table = sectionTable($section);
    $allowedCols = sectionColumns($section);

    $db = Database::getInstance();

    $entry = $db->fetch("SELECT * FROM {$table} WHERE id = ? AND resume_id = ?", [$entryId, $resumeId]);
    if (!$entry) {
        jsonError('Entry not found', 404);
    }

    $input = sanitize(getJsonInput());
    $sets = [];
    $values = [];

    foreach ($allowedCols as $col) {
        if (array_key_exists($col, $input)) {
            $sets[] = "$col = ?";
            $values[] = $col === 'is_current' ? (int) $input[$col] : $input[$col];
        }
    }

    if (array_key_exists('sort_order', $input)) {
        $sets[] = 'sort_order = ?';
        $values[] = (int) $input['sort_order'];
    }

    if (!empty($sets)) {
        $values[] = $entryId;
        $values[] = $resumeId;
        $db->execute("UPDATE {$table} SET " . implode(', ', $sets) . " WHERE id = ? AND resume_id = ?", $values);
    }

    touchResume($resumeId);
    $updated = $db->fetch("SELECT * FROM {$table} WHERE id = ?", [$entryId]);
    jsonSuccess($updated);
}

function handleDeleteEntry(array $params): void
{
    requireCsrf();
    $resumeId = (int) $params['id'];
    $entryId = (int) $params['entryId'];
    verifyOwnership($resumeId);

    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $section = extractSection($uri);
    $table = sectionTable($section);

    $db = Database::getInstance();
    $entry = $db->fetch("SELECT * FROM {$table} WHERE id = ? AND resume_id = ?", [$entryId, $resumeId]);
    if (!$entry) {
        jsonError('Entry not found', 404);
    }

    $db->execute("DELETE FROM {$table} WHERE id = ? AND resume_id = ?", [$entryId, $resumeId]);
    touchResume($resumeId);

    jsonSuccess(['message' => 'Entry deleted']);
}

function handleReorder(array $params): void
{
    requireCsrf();
    $resumeId = (int) $params['id'];
    verifyOwnership($resumeId);

    $input = getJsonInput();
    $sectionOrder = $input['section_order'] ?? null;

    if (!is_array($sectionOrder)) {
        jsonError('section_order must be an array', 422);
    }

    $db = Database::getInstance();
    $db->execute(
        "UPDATE resumes SET section_order = ?, updated_at = datetime('now') WHERE id = ?",
        [json_encode($sectionOrder), $resumeId]
    );

    // Reorder entries within sections if provided
    if (isset($input['entries']) && is_array($input['entries'])) {
        foreach ($input['entries'] as $section => $ids) {
            if (!is_array($ids)) continue;
            try {
                $table = sectionTable($section);
            } catch (InvalidArgumentException) {
                continue;
            }
            foreach ($ids as $order => $id) {
                $db->execute(
                    "UPDATE {$table} SET sort_order = ? WHERE id = ? AND resume_id = ?",
                    [$order, (int) $id, $resumeId]
                );
            }
        }
    }

    jsonSuccess(['message' => 'Sections reordered']);
}

function handleDuplicate(array $params): void
{
    requireCsrf();
    $resumeId = (int) $params['id'];
    $resume = verifyOwnership($resumeId);

    $db = Database::getInstance();

    $db->beginTransaction();

    try {
        $db->execute(
            'INSERT INTO resumes (user_id, title, template, color, font, spacing, section_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                Auth::id(),
                $resume['title'] . ' (Copy)',
                $resume['template'],
                $resume['color'],
                $resume['font'],
                $resume['spacing'],
                $resume['section_order'],
            ]
        );

        $newId = (int) $db->lastInsertId();

        // Copy personal
        $personal = $db->fetch('SELECT * FROM resume_personal WHERE resume_id = ?', [$resumeId]);
        if ($personal) {
            unset($personal['id']);
            $personal['resume_id'] = $newId;
            $cols = implode(', ', array_keys($personal));
            $placeholders = implode(', ', array_fill(0, count($personal), '?'));
            $db->execute("INSERT INTO resume_personal ($cols) VALUES ($placeholders)", array_values($personal));
        }

        // Copy summary
        $summary = $db->fetch('SELECT * FROM resume_summary WHERE resume_id = ?', [$resumeId]);
        if ($summary) {
            $db->execute('INSERT INTO resume_summary (resume_id, content) VALUES (?, ?)', [$newId, $summary['content']]);
        }

        // Copy all section entries
        $sectionTables = [
            'resume_experience', 'resume_education', 'resume_skills', 'resume_projects',
            'resume_certifications', 'resume_awards', 'resume_languages', 'resume_volunteer',
            'resume_references', 'resume_custom_sections',
        ];

        foreach ($sectionTables as $table) {
            $entries = $db->fetchAll("SELECT * FROM {$table} WHERE resume_id = ? ORDER BY sort_order", [$resumeId]);
            foreach ($entries as $entry) {
                unset($entry['id']);
                $entry['resume_id'] = $newId;
                $cols = implode(', ', array_keys($entry));
                $placeholders = implode(', ', array_fill(0, count($entry), '?'));
                $db->execute("INSERT INTO {$table} ($cols) VALUES ($placeholders)", array_values($entry));
            }
        }

        $db->commit();

        $newResume = $db->fetch('SELECT * FROM resumes WHERE id = ?', [$newId]);
        jsonSuccess($newResume, 201);
    } catch (\Throwable $e) {
        $db->rollBack();
        jsonError('Failed to duplicate resume: ' . $e->getMessage(), 500);
    }
}
