<?php

function verifyResumeOwnership(string $resumeId): array
{
    $db = Database::getInstance();
    $resume = $db->fetch('SELECT * FROM resumes WHERE id = ? AND user_id = ?', [$resumeId, Auth::id()]);
    if (!$resume) {
        jsonError('Resume not found', 404);
    }
    return $resume;
}

function getTableForSection(string $section): string
{
    $map = [
        'experience' => 'resume_experience',
        'education' => 'resume_education',
        'skills' => 'resume_skills',
        'projects' => 'resume_projects',
        'certifications' => 'resume_certifications',
        'awards' => 'resume_awards',
        'languages' => 'resume_languages',
        'volunteer' => 'resume_volunteer',
        'references' => 'resume_references',
        'custom' => 'resume_custom_sections',
    ];
    return $map[$section] ?? '';
}

function handleListResumes(): void
{
    $db = Database::getInstance();
    $resumes = $db->fetchAll(
        'SELECT id, title, slug, template, score, last_edited_at, created_at FROM resumes WHERE user_id = ? ORDER BY last_edited_at DESC',
        [Auth::id()]
    );
    jsonResponse($resumes);
}

function handleCreateResume(): void
{
    $input = getJsonInput();
    $db = Database::getInstance();

    $title = htmlspecialchars(strip_tags(trim($input['title'] ?? 'Untitled Resume')), ENT_QUOTES, 'UTF-8');
    $template = $input['template'] ?? 'professional';
    $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $title)) . '-' . substr(bin2hex(random_bytes(4)), 0, 8);

    $db->execute(
        'INSERT INTO resumes (user_id, title, slug, template) VALUES (?, ?, ?, ?)',
        [Auth::id(), $title, $slug, $template]
    );

    $resumeId = $db->lastInsertId();

    $db->execute('INSERT INTO resume_personal (resume_id) VALUES (?)', [$resumeId]);
    $db->execute('INSERT INTO resume_summary (resume_id) VALUES (?)', [$resumeId]);

    $resume = $db->fetch('SELECT * FROM resumes WHERE id = ?', [$resumeId]);
    jsonResponse($resume, 201);
}

function handleGetResume(string $id): void
{
    $resume = verifyResumeOwnership($id);
    $db = Database::getInstance();

    $resume['personal'] = $db->fetch('SELECT * FROM resume_personal WHERE resume_id = ?', [$id]);
    $resume['summary'] = $db->fetch('SELECT * FROM resume_summary WHERE resume_id = ?', [$id]);
    $resume['experience'] = $db->fetchAll('SELECT * FROM resume_experience WHERE resume_id = ? ORDER BY sort_order', [$id]);
    $resume['education'] = $db->fetchAll('SELECT * FROM resume_education WHERE resume_id = ? ORDER BY sort_order', [$id]);
    $resume['skills'] = $db->fetchAll('SELECT * FROM resume_skills WHERE resume_id = ? ORDER BY sort_order', [$id]);
    $resume['projects'] = $db->fetchAll('SELECT * FROM resume_projects WHERE resume_id = ? ORDER BY sort_order', [$id]);
    $resume['certifications'] = $db->fetchAll('SELECT * FROM resume_certifications WHERE resume_id = ? ORDER BY sort_order', [$id]);
    $resume['awards'] = $db->fetchAll('SELECT * FROM resume_awards WHERE resume_id = ? ORDER BY sort_order', [$id]);
    $resume['languages'] = $db->fetchAll('SELECT * FROM resume_languages WHERE resume_id = ? ORDER BY sort_order', [$id]);
    $resume['volunteer'] = $db->fetchAll('SELECT * FROM resume_volunteer WHERE resume_id = ? ORDER BY sort_order', [$id]);
    $resume['references'] = $db->fetchAll('SELECT * FROM resume_references WHERE resume_id = ? ORDER BY sort_order', [$id]);
    $resume['custom_sections'] = $db->fetchAll('SELECT * FROM resume_custom_sections WHERE resume_id = ? ORDER BY sort_order', [$id]);

    // Decode JSON fields
    foreach ($resume['experience'] as &$exp) {
        $exp['highlights'] = json_decode($exp['highlights'] ?? '[]', true);
    }
    foreach ($resume['projects'] as &$proj) {
        $proj['highlights'] = json_decode($proj['highlights'] ?? '[]', true);
    }
    $resume['section_order'] = json_decode($resume['section_order'] ?? '[]', true);

    jsonResponse($resume);
}

function handleUpdateResume(string $id): void
{
    verifyResumeOwnership($id);
    $input = getJsonInput();
    $db = Database::getInstance();

    $allowedFields = ['title', 'template', 'color_scheme', 'font_family', 'font_size', 'line_spacing', 'margin', 'is_public'];
    $sets = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $value = $input[$field];
            if (is_string($value)) {
                $value = htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
            }
            $sets[] = "{$field} = ?";
            $params[] = $value;
        }
    }

    if (isset($input['section_order']) && is_array($input['section_order'])) {
        $sets[] = 'section_order = ?';
        $params[] = json_encode($input['section_order']);
    }

    if (empty($sets)) {
        jsonError('No valid fields to update', 422);
    }

    $sets[] = "last_edited_at = datetime('now')";
    $sets[] = "updated_at = datetime('now')";
    $params[] = $id;

    $db->execute('UPDATE resumes SET ' . implode(', ', $sets) . ' WHERE id = ?', $params);

    $resume = $db->fetch('SELECT * FROM resumes WHERE id = ?', [$id]);
    $resume['section_order'] = json_decode($resume['section_order'] ?? '[]', true);
    jsonResponse($resume);
}

function handleDeleteResume(string $id): void
{
    verifyResumeOwnership($id);
    $db = Database::getInstance();
    $db->execute('DELETE FROM resumes WHERE id = ? AND user_id = ?', [$id, Auth::id()]);
    jsonResponse(['message' => 'Resume deleted successfully.']);
}

function handleDuplicateResume(string $id): void
{
    $resume = verifyResumeOwnership($id);
    $db = Database::getInstance();

    $newSlug = $resume['slug'] . '-copy-' . substr(bin2hex(random_bytes(4)), 0, 8);
    $newTitle = $resume['title'] . ' (Copy)';

    $db->transaction(function (Database $db) use ($resume, $id, $newTitle, $newSlug) {
        $db->execute(
            'INSERT INTO resumes (user_id, title, slug, template, color_scheme, font_family, font_size, line_spacing, margin, section_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [Auth::id(), $newTitle, $newSlug, $resume['template'], $resume['color_scheme'], $resume['font_family'], $resume['font_size'], $resume['line_spacing'], $resume['margin'], $resume['section_order']]
        );
        $newId = $db->lastInsertId();

        // Copy personal
        $personal = $db->fetch('SELECT * FROM resume_personal WHERE resume_id = ?', [$id]);
        if ($personal) {
            unset($personal['id'], $personal['resume_id']);
            $cols = array_keys($personal);
            $placeholders = implode(', ', array_fill(0, count($cols), '?'));
            $db->execute(
                'INSERT INTO resume_personal (resume_id, ' . implode(', ', $cols) . ') VALUES (?, ' . $placeholders . ')',
                array_merge([$newId], array_values($personal))
            );
        } else {
            $db->execute('INSERT INTO resume_personal (resume_id) VALUES (?)', [$newId]);
        }

        // Copy summary
        $summary = $db->fetch('SELECT content FROM resume_summary WHERE resume_id = ?', [$id]);
        $db->execute('INSERT INTO resume_summary (resume_id, content) VALUES (?, ?)', [$newId, $summary['content'] ?? '']);

        // Copy list sections
        $sections = [
            'resume_experience' => ['company', 'position', 'location', 'start_date', 'end_date', 'is_current', 'description', 'highlights', 'sort_order'],
            'resume_education' => ['institution', 'degree', 'field_of_study', 'location', 'start_date', 'end_date', 'is_current', 'gpa', 'description', 'sort_order'],
            'resume_skills' => ['name', 'level', 'category', 'sort_order'],
            'resume_projects' => ['name', 'description', 'url', 'technologies', 'start_date', 'end_date', 'highlights', 'sort_order'],
            'resume_certifications' => ['name', 'issuer', 'date_issued', 'date_expires', 'credential_id', 'url', 'sort_order'],
            'resume_awards' => ['title', 'issuer', 'date', 'description', 'sort_order'],
            'resume_languages' => ['language', 'proficiency', 'sort_order'],
            'resume_volunteer' => ['organization', 'role', 'location', 'start_date', 'end_date', 'is_current', 'description', 'sort_order'],
            'resume_references' => ['name', 'company', 'position', 'email', 'phone', 'relationship', 'sort_order'],
            'resume_custom_sections' => ['title', 'content', 'sort_order'],
        ];

        foreach ($sections as $table => $cols) {
            $rows = $db->fetchAll("SELECT * FROM {$table} WHERE resume_id = ?", [$id]);
            foreach ($rows as $row) {
                $values = [$newId];
                foreach ($cols as $col) {
                    $values[] = $row[$col] ?? null;
                }
                $placeholders = implode(', ', array_fill(0, count($cols), '?'));
                $db->execute(
                    "INSERT INTO {$table} (resume_id, " . implode(', ', $cols) . ") VALUES (?, {$placeholders})",
                    $values
                );
            }
        }

        return $newId;
    });

    $newResume = $db->fetch('SELECT * FROM resumes WHERE slug = ?', [$newSlug]);
    $newResume['section_order'] = json_decode($newResume['section_order'] ?? '[]', true);
    jsonResponse($newResume, 201);
}

function handleUpdatePersonal(string $id): void
{
    verifyResumeOwnership($id);
    $input = getJsonInput();
    $db = Database::getInstance();

    $allowedFields = ['first_name', 'last_name', 'email', 'phone', 'location', 'website', 'linkedin', 'github', 'portfolio', 'job_title'];
    $sets = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $sets[] = "{$field} = ?";
            $params[] = htmlspecialchars(strip_tags(trim((string) $input[$field])), ENT_QUOTES, 'UTF-8');
        }
    }

    if (!empty($sets)) {
        $params[] = $id;
        $db->execute('UPDATE resume_personal SET ' . implode(', ', $sets) . ' WHERE resume_id = ?', $params);
        $db->execute("UPDATE resumes SET last_edited_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [$id]);
    }

    $personal = $db->fetch('SELECT * FROM resume_personal WHERE resume_id = ?', [$id]);
    jsonResponse($personal);
}

function handleUpdateSummary(string $id): void
{
    verifyResumeOwnership($id);
    $input = getJsonInput();
    $db = Database::getInstance();

    $content = trim($input['content'] ?? '');

    $db->execute('UPDATE resume_summary SET content = ? WHERE resume_id = ?', [$content, $id]);
    $db->execute("UPDATE resumes SET last_edited_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [$id]);

    $summary = $db->fetch('SELECT * FROM resume_summary WHERE resume_id = ?', [$id]);
    jsonResponse($summary);
}

function handleReorderSections(string $id): void
{
    verifyResumeOwnership($id);
    $input = getJsonInput();
    $db = Database::getInstance();

    if (!isset($input['section_order']) || !is_array($input['section_order'])) {
        jsonError('section_order array is required', 422);
    }

    $db->execute(
        "UPDATE resumes SET section_order = ?, last_edited_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        [json_encode($input['section_order']), $id]
    );

    jsonResponse(['section_order' => $input['section_order']]);
}

function handleCreateEntry(string $resumeId, string $section): void
{
    verifyResumeOwnership($resumeId);
    $input = getJsonInput();
    $db = Database::getInstance();
    $table = getTableForSection($section);

    if (!$table) {
        jsonError('Invalid section', 400);
    }

    $maxOrder = $db->fetch("SELECT COALESCE(MAX(sort_order), -1) as max_order FROM {$table} WHERE resume_id = ?", [$resumeId]);
    $sortOrder = ($maxOrder['max_order'] ?? -1) + 1;

    $columns = getColumnsForSection($section);
    $values = [$resumeId];
    $colNames = ['resume_id'];

    foreach ($columns as $col) {
        if ($col === 'sort_order') {
            $colNames[] = $col;
            $values[] = $sortOrder;
        } elseif (array_key_exists($col, $input)) {
            $colNames[] = $col;
            $val = $input[$col];
            if (is_array($val)) {
                $values[] = json_encode($val);
            } elseif (is_string($val)) {
                $values[] = htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
            } else {
                $values[] = $val;
            }
        }
    }

    $placeholders = implode(', ', array_fill(0, count($colNames), '?'));
    $db->execute("INSERT INTO {$table} (" . implode(', ', $colNames) . ") VALUES ({$placeholders})", $values);

    $entryId = $db->lastInsertId();
    $db->execute("UPDATE resumes SET last_edited_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [$resumeId]);

    $entry = $db->fetch("SELECT * FROM {$table} WHERE id = ?", [$entryId]);
    if (isset($entry['highlights'])) {
        $entry['highlights'] = json_decode($entry['highlights'] ?? '[]', true);
    }
    jsonResponse($entry, 201);
}

function handleUpdateEntry(string $resumeId, string $section, string $entryId): void
{
    verifyResumeOwnership($resumeId);
    $input = getJsonInput();
    $db = Database::getInstance();
    $table = getTableForSection($section);

    if (!$table) {
        jsonError('Invalid section', 400);
    }

    $entry = $db->fetch("SELECT * FROM {$table} WHERE id = ? AND resume_id = ?", [$entryId, $resumeId]);
    if (!$entry) {
        jsonError('Entry not found', 404);
    }

    $columns = getColumnsForSection($section);
    $sets = [];
    $params = [];

    foreach ($columns as $col) {
        if (array_key_exists($col, $input)) {
            $val = $input[$col];
            if (is_array($val)) {
                $sets[] = "{$col} = ?";
                $params[] = json_encode($val);
            } elseif (is_string($val)) {
                $sets[] = "{$col} = ?";
                $params[] = htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
            } else {
                $sets[] = "{$col} = ?";
                $params[] = $val;
            }
        }
    }

    if (!empty($sets)) {
        $params[] = $entryId;
        $params[] = $resumeId;
        $db->execute("UPDATE {$table} SET " . implode(', ', $sets) . " WHERE id = ? AND resume_id = ?", $params);
        $db->execute("UPDATE resumes SET last_edited_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [$resumeId]);
    }

    $entry = $db->fetch("SELECT * FROM {$table} WHERE id = ?", [$entryId]);
    if (isset($entry['highlights'])) {
        $entry['highlights'] = json_decode($entry['highlights'] ?? '[]', true);
    }
    jsonResponse($entry);
}

function handleDeleteEntry(string $resumeId, string $section, string $entryId): void
{
    verifyResumeOwnership($resumeId);
    $db = Database::getInstance();
    $table = getTableForSection($section);

    if (!$table) {
        jsonError('Invalid section', 400);
    }

    $entry = $db->fetch("SELECT * FROM {$table} WHERE id = ? AND resume_id = ?", [$entryId, $resumeId]);
    if (!$entry) {
        jsonError('Entry not found', 404);
    }

    $db->execute("DELETE FROM {$table} WHERE id = ? AND resume_id = ?", [$entryId, $resumeId]);
    $db->execute("UPDATE resumes SET last_edited_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [$resumeId]);

    jsonResponse(['message' => 'Entry deleted successfully.']);
}

function getColumnsForSection(string $section): array
{
    return match ($section) {
        'experience' => ['company', 'position', 'location', 'start_date', 'end_date', 'is_current', 'description', 'highlights', 'sort_order'],
        'education' => ['institution', 'degree', 'field_of_study', 'location', 'start_date', 'end_date', 'is_current', 'gpa', 'description', 'sort_order'],
        'skills' => ['name', 'level', 'category', 'sort_order'],
        'projects' => ['name', 'description', 'url', 'technologies', 'start_date', 'end_date', 'highlights', 'sort_order'],
        'certifications' => ['name', 'issuer', 'date_issued', 'date_expires', 'credential_id', 'url', 'sort_order'],
        'awards' => ['title', 'issuer', 'date', 'description', 'sort_order'],
        'languages' => ['language', 'proficiency', 'sort_order'],
        'volunteer' => ['organization', 'role', 'location', 'start_date', 'end_date', 'is_current', 'description', 'sort_order'],
        'references' => ['name', 'company', 'position', 'email', 'phone', 'relationship', 'sort_order'],
        'custom' => ['title', 'content', 'sort_order'],
        default => [],
    };
}
