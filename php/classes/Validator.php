<?php

declare(strict_types=1);

class Validator
{
    private array $errors = [];
    private array $data;
    private array $rules;

    public function __construct(array $data, array $rules)
    {
        $this->data = $data;
        $this->rules = $rules;
    }

    public static function make(array $data, array $rules): self
    {
        $validator = new self($data, $rules);
        $validator->validate();
        return $validator;
    }

    public function validate(): bool
    {
        $this->errors = [];

        foreach ($this->rules as $field => $ruleSet) {
            $rules = is_string($ruleSet) ? explode('|', $ruleSet) : $ruleSet;
            $value = $this->data[$field] ?? null;
            $label = ucfirst(str_replace('_', ' ', $field));

            foreach ($rules as $rule) {
                $params = [];
                if (str_contains($rule, ':')) {
                    [$rule, $paramStr] = explode(':', $rule, 2);
                    $params = explode(',', $paramStr);
                }

                $method = 'validate' . ucfirst($rule);
                if (method_exists($this, $method)) {
                    $this->$method($field, $value, $params, $label);
                }
            }
        }

        return empty($this->errors);
    }

    public function fails(): bool
    {
        return !empty($this->errors);
    }

    public function errors(): array
    {
        return $this->errors;
    }

    public function firstError(): ?string
    {
        foreach ($this->errors as $fieldErrors) {
            if (!empty($fieldErrors)) {
                return $fieldErrors[0];
            }
        }
        return null;
    }

    private function addError(string $field, string $message): void
    {
        $this->errors[$field][] = $message;
    }

    private function validateRequired(string $field, mixed $value, array $params, string $label): void
    {
        if ($value === null || $value === '' || (is_array($value) && empty($value))) {
            $this->addError($field, "$label is required");
        }
    }

    private function validateEmail(string $field, mixed $value, array $params, string $label): void
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->addError($field, "$label must be a valid email address");
        }
    }

    private function validateMin(string $field, mixed $value, array $params, string $label): void
    {
        $min = (int) ($params[0] ?? 0);
        if ($value !== null && $value !== '' && mb_strlen((string) $value) < $min) {
            $this->addError($field, "$label must be at least $min characters");
        }
    }

    private function validateMax(string $field, mixed $value, array $params, string $label): void
    {
        $max = (int) ($params[0] ?? 255);
        if ($value !== null && $value !== '' && mb_strlen((string) $value) > $max) {
            $this->addError($field, "$label must not exceed $max characters");
        }
    }

    private function validateConfirmed(string $field, mixed $value, array $params, string $label): void
    {
        $confirmField = $field . '_confirmation';
        $confirmValue = $this->data[$confirmField] ?? null;
        if ($value !== $confirmValue) {
            $this->addError($field, "$label confirmation does not match");
        }
    }

    private function validateUnique(string $field, mixed $value, array $params, string $label): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $table = $params[0] ?? '';
        $column = $params[1] ?? $field;
        $exceptId = $params[2] ?? null;

        $db = Database::getInstance();

        $sql = "SELECT COUNT(*) as cnt FROM {$table} WHERE {$column} = ?";
        $bindings = [$value];

        if ($exceptId !== null) {
            $sql .= ' AND id != ?';
            $bindings[] = $exceptId;
        }

        $result = $db->fetch($sql, $bindings);
        if ($result && (int) $result['cnt'] > 0) {
            $this->addError($field, "$label has already been taken");
        }
    }

    private function validateNumeric(string $field, mixed $value, array $params, string $label): void
    {
        if ($value !== null && $value !== '' && !is_numeric($value)) {
            $this->addError($field, "$label must be a number");
        }
    }

    private function validateIn(string $field, mixed $value, array $params, string $label): void
    {
        if ($value !== null && $value !== '' && !in_array($value, $params, true)) {
            $this->addError($field, "$label must be one of: " . implode(', ', $params));
        }
    }

    private function validateUrl(string $field, mixed $value, array $params, string $label): void
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_URL)) {
            $this->addError($field, "$label must be a valid URL");
        }
    }
}
