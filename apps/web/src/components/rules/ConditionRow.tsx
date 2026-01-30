import { X } from 'lucide-react';
import type { Condition, ConditionField, Operator } from '@tracearr/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FIELD_DEFINITIONS,
  CATEGORY_LABELS,
  OPERATOR_LABELS,
  getFieldsByCategory,
  getDefaultOperatorForField,
  getDefaultValueForField,
  isArrayOperator,
  type FieldCategory,
} from '@/lib/rules';

interface ConditionRowProps {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
  showRemove?: boolean;
}

export function ConditionRow({
  condition,
  onChange,
  onRemove,
  showRemove = true,
}: ConditionRowProps) {
  const fieldDef = FIELD_DEFINITIONS[condition.field];
  const fieldsByCategory = getFieldsByCategory();

  // Handle field change - reset operator and value
  const handleFieldChange = (newField: ConditionField) => {
    const newFieldDef = FIELD_DEFINITIONS[newField];
    onChange({
      field: newField,
      operator: getDefaultOperatorForField(newField),
      value: getDefaultValueForField(newField),
      ...(newFieldDef.hasWindowHours ? { params: { window_hours: 24 } } : {}),
    });
  };

  // Handle operator change
  const handleOperatorChange = (newOperator: Operator) => {
    // If switching between array and non-array operators, adjust value
    const wasArray = isArrayOperator(condition.operator);
    const isNowArray = isArrayOperator(newOperator);

    let newValue = condition.value;
    if (wasArray && !isNowArray && Array.isArray(condition.value)) {
      newValue = condition.value[0] ?? getDefaultValueForField(condition.field);
    } else if (!wasArray && isNowArray && !Array.isArray(condition.value)) {
      newValue = condition.value ? [condition.value as string] : [];
    }

    onChange({
      ...condition,
      operator: newOperator,
      value: newValue,
    });
  };

  // Handle value change
  const handleValueChange = (newValue: Condition['value']) => {
    onChange({
      ...condition,
      value: newValue,
    });
  };

  // Handle window hours change
  const handleWindowHoursChange = (hours: number) => {
    onChange({
      ...condition,
      params: { ...condition.params, window_hours: hours },
    });
  };

  return (
    <div className="flex items-start gap-2">
      {/* Field Selector */}
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent className="min-w-[240px]">
          {(Object.keys(fieldsByCategory) as FieldCategory[]).map((category) => {
            const fields = fieldsByCategory[category];
            if (fields.length === 0) return null;
            return (
              <SelectGroup key={category}>
                <SelectLabel>{CATEGORY_LABELS[category]}</SelectLabel>
                {fields.map((def) => (
                  <SelectItem key={def.field} value={def.field}>
                    {def.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>

      {/* Operator Selector */}
      <Select value={condition.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent className="min-w-[180px]">
          {fieldDef.operators.map((op) => (
            <SelectItem key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value Input */}
      <div className="min-w-[140px] flex-1">
        <ValueInput
          fieldDef={fieldDef}
          value={condition.value}
          onChange={handleValueChange}
          isArrayOperator={isArrayOperator(condition.operator)}
        />
      </div>

      {/* Window Hours (for velocity fields) */}
      {fieldDef.hasWindowHours && (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-sm whitespace-nowrap">in</span>
          <Input
            type="number"
            className="w-16"
            min={1}
            max={168}
            value={condition.params?.window_hours ?? 24}
            onChange={(e) => handleWindowHoursChange(Number(e.target.value) || 24)}
          />
          <span className="text-muted-foreground text-sm">hrs</span>
        </div>
      )}

      {/* Remove Button */}
      {showRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-10 w-10 shrink-0"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Value input component that adapts based on field type
interface ValueInputProps {
  fieldDef: (typeof FIELD_DEFINITIONS)[ConditionField];
  value: Condition['value'];
  onChange: (value: Condition['value']) => void;
  isArrayOperator: boolean;
}

function ValueInput({ fieldDef, value, onChange, isArrayOperator: isArray }: ValueInputProps) {
  // Boolean
  if (fieldDef.valueType === 'boolean') {
    return (
      <div className="flex h-10 items-center">
        <Switch checked={value === true} onCheckedChange={(checked) => onChange(checked)} />
        <span className="text-muted-foreground ml-2 text-sm">{value === true ? 'Yes' : 'No'}</span>
      </div>
    );
  }

  // Select (single or multi based on operator)
  if (fieldDef.valueType === 'select' || fieldDef.valueType === 'multi-select') {
    if (isArray) {
      return (
        <MultiSelectInput
          options={fieldDef.options ?? []}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          placeholder={fieldDef.placeholder ?? `Select ${fieldDef.label.toLowerCase()}...`}
        />
      );
    }

    const selectValue = Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
    return (
      <Select value={selectValue} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={fieldDef.placeholder ?? 'Select...'} />
        </SelectTrigger>
        <SelectContent className="min-w-[200px]">
          {fieldDef.options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Number
  if (fieldDef.valueType === 'number') {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={fieldDef.min}
          max={fieldDef.max}
          step={fieldDef.step}
          value={value as number}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {fieldDef.unit && (
          <span className="text-muted-foreground text-sm whitespace-nowrap">{fieldDef.unit}</span>
        )}
      </div>
    );
  }

  // Text or CIDR
  return (
    <Input
      type="text"
      placeholder={fieldDef.placeholder ?? ''}
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// Simple multi-select using checkboxes in a popover
interface MultiSelectInputProps {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

function MultiSelectInput({ options, value, onChange, placeholder }: MultiSelectInputProps) {
  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .join(', ');

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <Select value="_multi" onValueChange={(v) => v !== '_multi' && toggleOption(v)}>
      <SelectTrigger>
        <span className={value.length === 0 ? 'text-muted-foreground' : ''}>
          {value.length === 0 ? placeholder : selectedLabels}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded border ${
                  value.includes(opt.value) ? 'bg-primary border-primary' : 'border-input'
                }`}
              >
                {value.includes(opt.value) && (
                  <svg
                    className="text-primary-foreground h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {opt.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default ConditionRow;
