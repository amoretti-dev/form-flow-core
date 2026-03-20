# @form-flow/core
![GitHub repo size](https://img.shields.io/github/repo-size/amoretti-dev/form-flow-core)
![NPM Downloads](https://img.shields.io/npm/dw/%40form-flow%2Fcore)


> **Framework-agnostic TypeScript engine for conditional form field behavior**  
> Define when fields should be visible, required, disabled, or readonly based on other field values—no framework lock-in.
> Form-flow rules are based on [json-logic-js](https://github.com/jwadhams/json-logic-js)

---

## ✨ Features

- 🎯 **Conditional rendering logic** – Show/hide fields based on form state
- ✅ **Dynamic validation** – Make fields required/optional conditionally
- 🔒 **Smart field states** – Disable or set readonly based on rules
- 🧩 **Framework agnostic** – Works with React, Vue, Angular, Svelte, or vanilla JS
- 🗄️ **Easy w/r configuration** - Save and load field definitions from database or datasets
- 🪶 **Zero dependencies** – Lightweight and tree-shakeable
- 📘 **Full TypeScript support** – Type-safe rule definitions
- 🧪 **Battle-tested** – Comprehensive test coverage with Jest

---

## 🚀 Installation

```bash
npm install @form-flow/core
# or
yarn add @form-flow/core
# or
pnpm add @form-flow/core
```

---


## Breaking Changes v2.0.0 20/03/2026

### `FieldControlType` is now generic

`FieldControlType` no longer represents only the built-in control types. It now accepts custom control types through a generic parameter.

```ts
type FieldControlType<TCustom extends string = never> =
  BuiltInFieldControlType | Exclude<TCustom, BuiltInFieldControlType>;
```

This means:

- use `BuiltInFieldControlType` when you need the built-in union only
- use `FieldControlType<"myCustomType" | "anotherType">` for built-in + custom types
- stop using `CustomFieldControlType` in new code; it is still exported only as a deprecated compatibility alias

Migration examples:

```ts
// Before
type BuiltInOnly = FieldControlType;
type AllControls = CustomFieldControlType<"rating" | "currency">;

// After
type BuiltInOnly = BuiltInFieldControlType;
type AllControls = FieldControlType<"rating" | "currency">;
```

Custom field definition example:

```ts
type AppFieldTypes = "switch" | "slider" | "radio";

const fields: FieldDefinition<AppFieldTypes>[] = [

];
```

If your code relied on `FieldControlType` being built-in only, this is a breaking change and you should migrate those usages to `BuiltInFieldControlType`.

### `FORM_FLOW_OPERATORS_MAP` is no longer publicly exported

The package root no longer exposes `FORM_FLOW_OPERATORS_MAP` as part of the public API.

Use `FormFlowOperatorRegistry` instead:

```ts
import { FormFlowOperatorRegistry } from "@form-flow/core";

const operators = FormFlowOperatorRegistry.getAll();
const eqOperator = FormFlowOperatorRegistry.get("eq");
```

If you were importing `FORM_FLOW_OPERATORS_MAP` from `@form-flow/core`, this is a breaking change and you should migrate those usages to `FormFlowOperatorRegistry`.

---

## 🆕 Patch Updates v2.x

### `v2.0.1`

- Improved type safety for `FormFlowOperatorRegistry.get()` and `FormFlowOperatorRegistry.getAll()`
- Better generic inference when working with custom field control types

### `v2.0.2`

- Added `disallowedTypes` to `RuleOperatorMeta`
- You can now keep an operator broadly available with `allowedTypes` and explicitly exclude specific control types

```ts
const operators = FormFlowOperatorRegistry.getAll<"switch">();

operators.truthy = {
  label: "Is truthy",
  allowedTypes: "all",
  disallowedTypes: ["switch"]
};
```

### `v2.0.3`

- Patch release for the `2.0.2` operator filtering improvements
- No additional public API changes compared to `v2.0.2`

### Next patch in current branch

Based on the most recent commits after `v2.0.3`, the next `2.x` patch will also include:

- `FormFlowOperatorRegistry.patch()` to partially override existing operators without redefining the full object
- `FormFlowOperatorRegistry.excludeFieldTypes()` to exclude one or more field types from multiple operators in a single call

```ts
import { FormFlowOperatorRegistry } from "@form-flow/core";

FormFlowOperatorRegistry.patch({
  eq: { hideFromPicker: true },
  neq: { hideFromPicker: true }
});

FormFlowOperatorRegistry.excludeFieldTypes(
  ["switch"],
  ["isTrue", "isFalse", "truthy"]
);
```

---

## 📖 Quick Start

### Basic Example

```ts
import { FieldDefinition, RuleEvaluator } from "@form-flow/core";

// Define your fields
const ageField: FieldDefinition = {
  id: "age",
  type: "number",
  label: "Your Age"
};

const consentField: FieldDefinition = {
  id: "parentalConsent",
  type: "checkbox",
  label: "Parental Consent Required",
  
  // Show this field only when age < 18
  visibleIf: {
    groupId: "visibility-group",
    operator: "and",
    ruleType: "visibleIf",
    rules: [
      { ruleId: "1", conditionFieldId: "age", operator: "lt", value: 18 }
    ]
  },
  
  // Make it required when visible
  requiredIf: {
    groupId: "required-group",
    operator: "and",
    ruleType: "requiredIf",
    rules: [
      { ruleId: "2", conditionFieldId: "age", operator: "lt", value: 18 }
    ]
  }
};

// Evaluate rules against current form data
const formData = { age: 16 };
const fieldStates = RuleEvaluator.evaluateFields(
  [ageField, consentField],
  formData
);

console.log(fieldStates.parentalConsent.visible);   // true
console.log(fieldStates.parentalConsent.required);  // true

const formData2 = { age: 21 };
const fieldStates2 = RuleEvaluator.evaluateFields(
  [ageField, consentField],
  formData2
);

console.log(fieldStates2.parentalConsent.visible);   // false
console.log(fieldStates2.parentalConsent.required);  // false
```

### Advanced: Complex Rules

```ts
const emailField: FieldDefinition = {
  id: "workEmail",
  type: "email",
  label: "Work Email",
  
  // Show if (employed AND age >= 18) OR freelancer
  visibleIf: {
    groupId: "email-visibility",
    operator: "or",
    ruleType: "visibleIf",
    rules: [
      {
        groupId: "employed-adult",
        operator: "and",
        ruleType: "visibleIf",
        rules: [
          { ruleId: "1", conditionFieldId: "employmentStatus", operator: "eq", value: "employed" },
          { ruleId: "2", conditionFieldId: "age", operator: "gte", value: 18 }
        ]
      },
      { ruleId: "3", conditionFieldId: "employmentStatus", operator: "eq", value: "freelancer" }
    ]
  },
  
  // Readonly if verified
  readonlyIf: {
    groupId: "verified-check",
    operator: "and",
    ruleType: "readonlyIf",
    rules: [
      { ruleId: "4", conditionFieldId: "emailVerified", operator: "eq", value: true }
    ]
  }
};
```

---

## 🛠️ API Reference

### `RuleEvaluator.evaluateFields()`

Evaluates all conditional rules for your form fields.

```ts
const state: FormControlState = RuleEvaluator.evaluateFields(
  fields: FieldDefinition[],
  formData: Record<string, any>
);
```

**Returns:** `FormControlState` – Map of field IDs to their computed states

```ts
{
  [fieldId: string]: {
    visible: boolean;
    required: boolean;
    disabled: boolean;
    readonly: boolean;
  }
}
```

### Rule context fields

Use `definition.ruleContextFields` to expose source-only paths that can be referenced in rules without promoting them to target form fields.

```ts
const definition = {
  formId: "deal-form",
  fields: [
    {
      id: "deal.goal",
      type: "number",
      label: "Deal Goal",
      visibleIf: {
        groupId: "goal-visible",
        operator: "and",
        ruleType: "visibleIf",
        rules: [
          {
            ruleId: "1",
            conditionFieldId: "customer.yearlyEarnings",
            operator: "gte",
            value: 1000
          }
        ]
      }
    }
  ],
  ruleContextFields: [
    {
      id: "customer.yearlyEarnings",
      type: "number",
      label: "Customer Yearly Earnings"
    }
  ]
};
```

### `FieldHelper.getAvailableRuleTypes()`

Get which rule types can still be added to a field.

```ts
import { FieldHelper } from "@form-flow/core";

const availableRules = FieldHelper.getAvailableRuleTypes(consentField);
console.log(availableRules); // ["disabledIf", "readonlyIf"]
```

---

## 📚 Core Concepts

### Rule Types

| Rule Type | Purpose | Example |
|-----------|---------|---------|
| `visibleIf` | Control field visibility | Show "Company Name" if employment is "employed" |
| `requiredIf` | Make field conditionally required | Require "Tax ID" if revenue > 50000 |
| `disabledIf` | Disable field interaction | Disable "Submit" until terms are accepted |
| `readonlyIf` | Make field read-only | Lock "Email" after verification |

### Operators

- **Comparison:** `eq`, `neq`, `lt`, `lte`, `gt`, `gte`
- **String:** `contains`, `startsWith`, `endsWith`
- **Logical:** `and`, `or` (for grouping rules)

### Type Definitions

```ts
type BuiltInFieldControlType =
  | "text"
  | "number"
  | "date"
  | "singleSelect"
  | "multipleSelect"
  | "checkbox";

type FieldControlType<TCustom extends string = never> =
  BuiltInFieldControlType | Exclude<TCustom, BuiltInFieldControlType>;

type BaseFieldDefinition<TCustom extends string = never> = {
  id: string;
  type: FieldControlType<TCustom>;
  label: string;
};

// Field with conditional rules
type FieldDefinition<TCustom extends string = never> = BaseFieldDefinition<TCustom> & {
  visibleIf?: FieldRuleGroupDefinition;
  requiredIf?: FieldRuleGroupDefinition;
  disabledIf?: FieldRuleGroupDefinition;
  readonlyIf?: FieldRuleGroupDefinition;
};

type RuleContextFieldDefinition<TCustom extends string = never> = BaseFieldDefinition<TCustom>;

type FormFlowDefinition<TCustom extends string = never> = {
  formId: string;
  fields: FieldDefinition<TCustom>[];
  ruleContextFields?: RuleContextFieldDefinition<TCustom>[];
};

// Atomic rule
type FieldRuleDefinition = {
  ruleId: string;
  conditionFieldId: string;
  operator: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "contains" | "startsWith" | "endsWith";
  value: any;
};

// Rule group (supports nesting)
type FieldRuleGroupDefinition = {
  groupId: string;
  operator: "and" | "or";
  ruleType: ConditionalFieldProperty;
  rules: Array<FieldRuleDefinition | FieldRuleGroupDefinition>;
};
```

---

## 🧪 Testing

```bash
npm run test
# or
yarn test
```

Tests are written with **Jest** and cover both `RuleEvaluator` and `FieldHelper` with comprehensive test coverage.

---

## 🗺️💡 Roadmap & Ideas

- [ ] **Visual Rule Builder** – Drag-and-drop UI for creating rules (React version in development)
- [ ] **Rule Templates** – Pre-built common patterns (age verification, address forms, etc.)
- [ ] **Async Rules** – Support for API-based conditions
- [ ] **Rule Debugging** – Dev tools for visualizing rule evaluation
- [ ] **Performance Optimizations** – Memoization and selective re-evaluation

---

<!--## 🤝 Contributing

Contributions are welcome! Please check out the [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---
-->

## 📄 License

MIT © [Andrea Moretti]

---

## ☕ Support

If this library saves you time, or you just like my work you can just

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-blue?logo=buy-me-a-coffee)](https://buymeacoffee.com/andrea.moretti)

---

## 🔗 Links

- [📦 npm Package](https://www.npmjs.com/package/@form-flow/core)
- [🐛 Report Issues](https://github.com/amoretti-dev/form-flow-core/issues)
- [💬 Discussions](https://github.com/amoretti-dev/form-flow-core/discussions)

---

**Made with ❤️ by the open-source community**
