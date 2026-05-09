<?php

declare(strict_types=1);

final class JobRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function search(array $filters): array
    {
        $limit = max(1, min((int)($filters['limit'] ?? 25), 50));
        $offset = max(0, (int)($filters['offset'] ?? 0));
        [$where, $params] = $this->buildWhere($filters);

        $count = $this->pdo->prepare('SELECT COUNT(*) FROM jobs ' . $where);
        $count->execute($params);
        $total = (int)$count->fetchColumn();

        $sql = 'SELECT * FROM jobs ' . $where . ' ORDER BY COALESCE(posted_at, last_seen_at) DESC, id DESC LIMIT :limit OFFSET :offset';
        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'jobs' => array_map([$this, 'formatJob'], $stmt->fetchAll()),
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => $offset + $limit < $total,
        ];
    }

    public function stats(): array
    {
        $row = $this->pdo->query(
            "SELECT
                COUNT(*) AS active_jobs,
                COUNT(DISTINCT source_id) AS sources,
                COUNT(DISTINCT category) AS categories,
                MAX(last_seen_at) AS refreshed_at
            FROM jobs
            WHERE is_active = 1"
        )->fetch() ?: [];

        return [
            'active_jobs' => (int)($row['active_jobs'] ?? 0),
            'sources' => (int)($row['sources'] ?? 0),
            'categories' => (int)($row['categories'] ?? 0),
            'refreshed_at' => $row['refreshed_at'] ?? null,
        ];
    }

    public function facets(): array
    {
        $categories = $this->pdo->query(
            "SELECT category, COUNT(*) AS total
            FROM jobs
            WHERE is_active = 1
            GROUP BY category
            ORDER BY total DESC, category"
        )->fetchAll();

        $trades = $this->pdo->query(
            "SELECT trade, COUNT(*) AS total
            FROM jobs
            WHERE is_active = 1
            GROUP BY trade
            ORDER BY total DESC, trade
            LIMIT 60"
        )->fetchAll();

        $locations = $this->pdo->query(
            "SELECT location, COUNT(*) AS total
            FROM jobs
            WHERE is_active = 1 AND location <> ''
            GROUP BY location
            ORDER BY total DESC, location
            LIMIT 40"
        )->fetchAll();

        return [
            'categories' => $categories,
            'trades' => $trades,
            'locations' => $locations,
        ];
    }

    private function buildWhere(array $filters): array
    {
        $clauses = ['is_active = 1'];
        $params = [];

        foreach (['category', 'trade'] as $field) {
            if (!empty($filters[$field])) {
                $clauses[] = $field . ' = :' . $field;
                $params[':' . $field] = trim((string)$filters[$field]);
            }
        }

        if (!empty($filters['location'])) {
            $clauses[] = 'location LIKE :location';
            $params[':location'] = '%' . trim((string)$filters['location']) . '%';
        }

        if (!empty($filters['q'])) {
            $query = '%' . trim((string)$filters['q']) . '%';
            $clauses[] = '(title LIKE :q OR company LIKE :q OR description LIKE :q OR tags_json LIKE :q)';
            $params[':q'] = $query;
        }

        if (isset($filters['min_ai_score']) && $filters['min_ai_score'] !== '') {
            $clauses[] = 'ai_proof_score >= :min_ai_score';
            $params[':min_ai_score'] = (int)$filters['min_ai_score'];
        }

        return ['WHERE ' . implode(' AND ', $clauses), $params];
    }

    private function formatJob(array $job): array
    {
        $description = trim(strip_tags((string)$job['description']));
        if (strlen($description) > 260) {
            $description = rtrim(substr($description, 0, 257)) . '...';
        }

        return [
            'id' => (int)$job['id'],
            'title' => $job['title'],
            'company' => $job['company'],
            'location' => $job['location'],
            'category' => $job['category'],
            'trade' => $job['trade'],
            'description' => $description,
            'url' => $job['url'],
            'salary_min' => $job['salary_min'] !== null ? (float)$job['salary_min'] : null,
            'salary_max' => $job['salary_max'] !== null ? (float)$job['salary_max'] : null,
            'salary_text' => $job['salary_text'],
            'posted_at' => $job['posted_at'],
            'source_name' => $job['source_name'],
            'ai_proof_score' => (int)$job['ai_proof_score'],
            'ai_proof_notes' => $job['ai_proof_notes'],
            'tags' => json_decode($job['tags_json'] ?: '[]', true) ?: [],
            'last_seen_at' => $job['last_seen_at'],
        ];
    }
}
