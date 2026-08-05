<?php

declare(strict_types=1);

function handleListApplications(array $params): void
{
    $db = Database::getInstance();
    $userId = Auth::id();

    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? '';
    $sort = $_GET['sort'] ?? 'created_at';
    $order = strtoupper($_GET['order'] ?? 'DESC');
    $archived = $_GET['archived'] ?? '0';

    $allowedSort = ['created_at', 'updated_at', 'company', 'position', 'date_applied'];
    if (!in_array($sort, $allowedSort, true)) {
        $sort = 'created_at';
    }
    $order = $order === 'ASC' ? 'ASC' : 'DESC';

    $sql = 'SELECT a.*, js.name as status_name, js.color as status_color
            FROM applications a
            LEFT JOIN job_statuses js ON a.status_id = js.id
            WHERE a.user_id = ? AND a.is_archived = ?';
    $bindings = [$userId, (int) $archived];

    if ($search !== '') {
        $sql .= ' AND (a.company LIKE ? OR a.position LIKE ? OR a.location LIKE ?)';
        $like = "%{$search}%";
        $bindings[] = $like;
        $bindings[] = $like;
        $bindings[] = $like;
    }

    if ($status !== '' && is_numeric($status)) {
        $sql .= ' AND a.status_id = ?';
        $bindings[] = (int) $status;
    }

    $sql .= " ORDER BY a.{$sort} {$order}";

    $applications = $db->fetchAll($sql, $bindings);
    jsonSuccess($applications);
}

function handleCreateApplication(array $params): void
{
    requireCsrf();

    $input = sanitize(getJsonInput());
    $db = Database::getInstance();
    $userId = Auth::id();

    $validator = Validator::make($input, [
        'company'  => 'required|max:255',
        'position' => 'required|max:255',
    ]);

    if ($validator->fails()) {
        jsonResponse(['error' => $validator->firstError(), 'errors' => $validator->errors(), 'status' => 422], 422);
    }

    $db->execute(
        'INSERT INTO applications (user_id, company, position, salary_min, salary_max, location, work_type, url, date_applied, recruiter_name, recruiter_email, notes, status_id, resume_id, cover_letter_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $userId,
            $input['company'],
            $input['position'],
            isset($input['salary_min']) ? (int) $input['salary_min'] : null,
            isset($input['salary_max']) ? (int) $input['salary_max'] : null,
            $input['location'] ?? '',
            $input['work_type'] ?? 'onsite',
            $input['url'] ?? '',
            $input['date_applied'] ?? date('Y-m-d'),
            $input['recruiter_name'] ?? '',
            $input['recruiter_email'] ?? '',
            $input['notes'] ?? '',
            isset($input['status_id']) ? (int) $input['status_id'] : null,
            isset($input['resume_id']) ? (int) $input['resume_id'] : null,
            isset($input['cover_letter_id']) ? (int) $input['cover_letter_id'] : null,
        ]
    );

    $id = (int) $db->lastInsertId();
    $app = $db->fetch(
        'SELECT a.*, js.name as status_name, js.color as status_color
         FROM applications a LEFT JOIN job_statuses js ON a.status_id = js.id
         WHERE a.id = ?',
        [$id]
    );

    jsonSuccess($app, 201);
}

function handleUpdateApplication(array $params): void
{
    requireCsrf();

    $id = (int) $params['id'];
    $db = Database::getInstance();
    $userId = Auth::id();

    $app = $db->fetch('SELECT * FROM applications WHERE id = ? AND user_id = ?', [$id, $userId]);
    if (!$app) {
        jsonError('Application not found', 404);
    }

    $input = sanitize(getJsonInput());
    $allowed = ['company', 'position', 'salary_min', 'salary_max', 'location', 'work_type',
                'url', 'date_applied', 'recruiter_name', 'recruiter_email', 'notes',
                'status_id', 'resume_id', 'cover_letter_id'];

    $sets = [];
    $values = [];

    foreach ($allowed as $field) {
        if (array_key_exists($field, $input)) {
            $sets[] = "$field = ?";
            $val = $input[$field];
            if (in_array($field, ['salary_min', 'salary_max', 'status_id', 'resume_id', 'cover_letter_id'])) {
                $val = $val !== null && $val !== '' ? (int) $val : null;
            }
            $values[] = $val;
        }
    }

    if (!empty($sets)) {
        $sets[] = "updated_at = datetime('now')";
        $values[] = $id;
        $values[] = $userId;
        $db->execute('UPDATE applications SET ' . implode(', ', $sets) . ' WHERE id = ? AND user_id = ?', $values);
    }

    $updated = $db->fetch(
        'SELECT a.*, js.name as status_name, js.color as status_color
         FROM applications a LEFT JOIN job_statuses js ON a.status_id = js.id
         WHERE a.id = ?',
        [$id]
    );
    jsonSuccess($updated);
}

function handleDeleteApplication(array $params): void
{
    requireCsrf();

    $id = (int) $params['id'];
    $db = Database::getInstance();
    $userId = Auth::id();

    $app = $db->fetch('SELECT * FROM applications WHERE id = ? AND user_id = ?', [$id, $userId]);
    if (!$app) {
        jsonError('Application not found', 404);
    }

    $db->execute('DELETE FROM applications WHERE id = ? AND user_id = ?', [$id, $userId]);
    jsonSuccess(['message' => 'Application deleted']);
}

function handleArchiveApplication(array $params): void
{
    requireCsrf();

    $id = (int) $params['id'];
    $db = Database::getInstance();
    $userId = Auth::id();

    $app = $db->fetch('SELECT * FROM applications WHERE id = ? AND user_id = ?', [$id, $userId]);
    if (!$app) {
        jsonError('Application not found', 404);
    }

    $newArchived = $app['is_archived'] ? 0 : 1;
    $db->execute(
        "UPDATE applications SET is_archived = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
        [$newArchived, $id, $userId]
    );

    $updated = $db->fetch(
        'SELECT a.*, js.name as status_name, js.color as status_color
         FROM applications a LEFT JOIN job_statuses js ON a.status_id = js.id
         WHERE a.id = ?',
        [$id]
    );
    jsonSuccess($updated);
}
