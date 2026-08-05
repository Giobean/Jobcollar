<?php

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

            foreach ($rules as $rule) {
                $params = [];
                if (str_contains($rule, ':')) {
                    [$rule, $paramStr] = explode(':', $rule, 2);
                    $params = explode(',', $paramStr);
                }

                $method = 'validate' . ucfirst($rule);
                if (method_exists($this, $method)) {
                    $this->$method($field, $value, $params);
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

    private function validateRequired(string $field, $value, array $params): void
    {
        if ($value === null || $value === '' || (is_array($value) && empty($value))) {
            $this->addError($field, ucfirst(str_replace('_', ' ', $field)) . ' is required.');
        }
    }

    private function validateEmail(string $field, $value, array $params): void
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->addError($field, 'Please enter a valid email address.');
        }
    }

    private function validateMin(string $field, $value, array $params): void
    {
        $min = (int) ($params[0] ?? 0);
        if ($value !== null && $value !== '' && strlen((string) $value) < $min) {
            $this->addError($field, ucfirst(str_replace('_', ' ', $field)) . " must be at least {$min} characters.");
        }
    }

    private function validateMax(string $field, $value, array $params): void
    {
        $max = (int) ($params[0] ?? 255);
        if ($value !== null && $value !== '' && strlen((string) $value) > $max) {
            $this->addError($field, ucfirst(str_replace('_', ' ', $field)) . " must not exceed {$max} characters.");
        }
    }

    private function validateConfirmed(string $field, $value, array $params): void
    {
        $confirmField = $field . '_confirmation';
        $confirmValue = $this->data[$confirmField] ?? null;
        if ($value !== null && $value !== '' && $value !== $confirmValue) {
            $this->addError($field, ucfirst(str_replace('_', ' ', $field)) . ' confirmation does not match.');
        }
    }

    private function validateUnique(string $field, $value, array $params): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $table = $params[0] ?? '';
        $column = $params[1] ?? $field;
        $exceptId = $params[2] ?? null;

        if (empty($table)) {
            return;
        }

        $db = Database::getInstance();

        if ($exceptId) {
            $existing = $db->fetch(
                "SELECT id FROM {$table} WHERE {$column} = ? AND id != ?",
                [$value, $exceptId]
            );
        } else {
            $existing = $db->fetch(
                "SELECT id FROM {$table} WHERE {$column} = ?",
                [$value]
            );
        }

        if ($existing) {
            $this->addError($field, ucfirst(str_replace('_', ' ', $field)) . ' is already taken.');
        }
    }

    private function validateAlpha(string $field, $value, array $params): void
    {
        if ($value !== null && $value !== '' && !preg_match('/^[\pL\pM\s]+$/u', $value)) {
            $this->addError($field, ucfirst(str_replace('_', ' ', $field)) . ' may only contain letters.');
        }
    }

    private function validateNumeric(string $field, $value, array $params): void
    {
        if ($value !== null && $value !== '' && !is_numeric($value)) {
            $this->addError($field, ucfirst(str_replace('_', ' ', $field)) . ' must be a number.');
        }
    }

    private function validateUrl(string $field, $value, array $params): void
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_URL)) {
            $this->addError($field, ucfirst(str_replace('_', ' ', $field)) . ' must be a valid URL.');
        }
    }
}
