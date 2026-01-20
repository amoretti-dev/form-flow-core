# @form-flow/core

![npm](https://img.shields.io/npm/v/@form-flow/core) ![NPM License](https://img.shields.io/npm/l/%40form-flow%2Fcore)
 ![build](https://img.shields.io/github/actions/workflow/status/amoretti-dev/form-flow-core/ci.yml)

> **Framework-agnostic TypeScript engine for conditional form field behavior**  
> Define when fields should be visible, required, disabled, or readonly based on other field values—no framework lock-in.

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
// Field with conditional rules
type FieldDefinition<T = any> = {
  id: string;
  type: string;
  label: string;
  visibleIf?: FieldRuleGroupDefinition;
  requiredIf?: FieldRuleGroupDefinition;
  disabledIf?: FieldRuleGroupDefinition;
  readonlyIf?: FieldRuleGroupDefinition;
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

If this library saves you time, consider supporting its development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?logo=buy-me-a-coffee)](https://buymeacoffee.com/andrea.moretti)

---

## 🔗 Links

- [📦 npm Package](https://www.npmjs.com/package/@form-flow/core)
- [🐛 Report Issues](https://github.com/amoretti-dev/form-flow-core/issues)
- [💬 Discussions](https://github.com/amoretti-dev/form-flow-core/discussions)

---

**Made with ❤️ by the open-source community**
