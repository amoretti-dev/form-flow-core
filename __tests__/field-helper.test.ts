import type { FieldDefinition } from '../src/index';
import { FormFlowFieldHelper } from '../src/index';

describe("FieldHelper", () => {
  it("getAvailableRuleTypes returns all types if none are set", () => {
    const field: FieldDefinition = {
      id: "username",
      type: "text",
      label: "Username"
    };

    const available = FormFlowFieldHelper.getAvailableRuleTypes(field);
    expect(available).toEqual(["visibleIf", "disabledIf", "requiredIf", "readonlyIf"]);
  });

  it("getAvailableRuleTypes excludes already set types", () => {
    const field: FieldDefinition = {
      id: "password",
      label: "Password",
      type: "text",
      visibleIf: {
        groupId: "1",
        operator: "and",
        ruleType: 'visibleIf',
        rules: [
          { ruleId: "1", conditionFieldId: "username", operator: "eq", value: "admin" }
        ]
      },
    };

    const available = FormFlowFieldHelper.getAvailableRuleTypes(field);
    expect(available).toEqual(["disabledIf", "requiredIf", "readonlyIf"]);
  });

  it("returns empty array if all conditional properties are set", () => {
    const field: FieldDefinition = {
      id: "email",
      label: "Email",
      type: "text",
      visibleIf: {
        groupId: "1",
        operator: "and",
        ruleType: 'visibleIf',
        rules: [
          { ruleId: "1", conditionFieldId: "username", operator: "eq", value: "admin" }
        ]
      },
      requiredIf: {
        groupId: "1",
        operator: "and",
        ruleType: 'visibleIf',
        rules: [
          { ruleId: "1", conditionFieldId: "username", operator: "neq", value: "guest" }
        ]
      },
      disabledIf: {
        groupId: "1",
        operator: "and",
        ruleType: 'visibleIf',
        rules: [
          { ruleId: "1", conditionFieldId: "role", operator: "eq", value: "viewer" }
        ]
      },
      readonlyIf: {
        groupId: "1",
        operator: "and",
        ruleType: 'visibleIf',
        rules: [
          { ruleId: "1", conditionFieldId: "role", operator: "eq", value: "editor" }
        ]
      },
    };

    const available = FormFlowFieldHelper.getAvailableRuleTypes(field);
    expect(available).toEqual([]);
  });
});