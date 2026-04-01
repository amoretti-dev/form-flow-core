import { OperatorRegistry } from "../models/operator-registry";
import { FieldControlType } from "../models/field-definition";
import { RuleOperatorKey } from "../models/operators";
import { FieldRuleDefinition } from "../models/rule";

type DynamicValueRef = {
    var: string;
};

export type RuleBuilderValidationResult = {
    isComplete: boolean;
    requiresValue: boolean;
};

export class RuleValidator {
    static isDynamicValueRef(value: unknown): value is DynamicValueRef {
        if (!value || typeof value !== "object") return false;
        return "var" in (value as Record<string, unknown>);
    }

    static requiresValue(operator: RuleOperatorKey) {
        const op = OperatorRegistry.get(operator);
        return op && op.valueType !== "none";
    }

    static stringIsNotEmpty(value: unknown): boolean {
        return typeof value === "string" && value.trim().length > 0;
    }

    static numberIsValid(value: unknown): boolean {
        return typeof value === "number" && !Number.isNaN(value);
    }

    static validate<TCustom extends string = never>(
        rule: FieldRuleDefinition,
        fieldType: FieldControlType<TCustom>,
    ) {
        if (rule.operator == "lengthEquals") {
            fieldType = "number";
        }

        if (!rule.conditionFieldId) {
            return {
                isComplete: false,
                requiresValue: false,
            };
        }

        const requiresValue = this.requiresValue(rule.operator);

        if (!requiresValue) {
            return {
                isComplete: true,
                requiresValue: false,
            };
        }

        if (this.isDynamicValueRef(rule.value)) {
            return {
                isComplete: this.stringIsNotEmpty(rule.value.var),
                requiresValue: true,
            };
        }

        switch (fieldType) {
            case "text":
            case "date":
            case "singleSelect":
                return {
                    isComplete: this.stringIsNotEmpty(rule.value),
                    requiresValue: true,
                };
            case "number":
                return {
                    isComplete: this.numberIsValid(rule.value),
                    requiresValue: true,
                };
            default:
                return {
                    isComplete: true,
                    requiresValue: false,
                };
        }
    }
}
