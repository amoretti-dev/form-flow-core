import { FormFlowRuleEvaluator } from '../src/index';
import type { FieldDefinition, FieldControlState, FormControlState } from '../src/index';

describe("FormFlowRuleEvaluator", () => {
  it("evaluates a single field with no conditions", () => {
    const field: FieldDefinition = { id: "age", label: "Age", type: "number" };
    const result = FormFlowRuleEvaluator.evaluateField(field, { age: 20 });

    expect(result).toEqual<FieldControlState>({
      visible: true,
      required: false,
      disabled: false,
      readonly: false
    });
  });

  it("evaluates multiple fields with simple visibleIf condition", () => {
    const fields: FieldDefinition[] = [
      { id: "age", label: "Age", type: "number" },
      {
        id: "consent",
        label: "Consent",
        type: "checkbox",
        visibleIf: {
          groupId: "1",
          operator: "and",
          ruleType: 'visibleIf',
          rules: [
            { ruleId: "1", conditionFieldId: "age", operator: "lt", value: 18 }
          ]
        },
      }
    ];

    const formData = { age: 16 };
    const evaluated: FormControlState = FormFlowRuleEvaluator.evaluateFields(fields, formData);

    expect(evaluated.age.visible).toBe(true);
    expect(evaluated.consent.visible).toBe(true); // age < 18
  });

  it("evaluates requiredIf correctly", () => {
    const fields: FieldDefinition[] = [
      { id: "age", label: "Age", type: "number" },
      {
        id: "consent",
        label: "Consent",
        type: "checkbox",
        requiredIf: {
          groupId: "1",
          operator: "and",
          ruleType: 'visibleIf',
          rules: [
            { ruleId: "1", conditionFieldId: "age", operator: "lt", value: 18 }
          ]
        },
      }
    ];

    const formData = { age: 20 };
    const evaluated = FormFlowRuleEvaluator.evaluateFields(fields, formData);

    expect(evaluated.consent.required).toBe(false);
  });

  it("handles multiple conditional properties on one field", () => {
    const fields: FieldDefinition[] = [
      { id: "age", label: "Age", type: "number" },
      {
        id: "consent",
        label: "Consent",
        type: "checkbox",
        requiredIf: {
          groupId: "1",
          operator: "and",
          ruleType: 'visibleIf',
          rules: [
            { ruleId: "1", conditionFieldId: "age", operator: "lt", value: 18 }
          ]
        },
        visibleIf: {
          groupId: "1",
          operator: "and",
          ruleType: 'visibleIf',
          rules: [
            { ruleId: "1", conditionFieldId: "age", operator: "lt", value: 18 }
          ]
        },
      }
    ];

    const formData = { age: 16 };
    const evaluated = FormFlowRuleEvaluator.evaluateFields(fields, formData);

    expect(evaluated.consent.visible).toBe(true);
    expect(evaluated.consent.required).toBe(true);
  });

  it("evaluates target fields against nested rule context paths from form data", () => {
    const fields: FieldDefinition[] = [
      {
        id: "deal.goal",
        label: "Deal Goal",
        type: "number",
        visibleIf: {
          groupId: "1",
          operator: "and",
          ruleType: 'visibleIf',
          rules: [
            { ruleId: "1", conditionFieldId: "customer.yearlyEarnings", operator: "gte", value: 1000 }
          ]
        },
      }
    ];

    const evaluated = FormFlowRuleEvaluator.evaluateFields(fields, {
      customer: {
        yearlyEarnings: 1500
      }
    });

    expect(evaluated).toEqual<FormControlState>({
      "deal.goal": {
        visible: true,
        required: false,
        disabled: false,
        readonly: false
      }
    });
    expect(evaluated.customer).toBeUndefined();
  });
});
