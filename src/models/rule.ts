import { RuleOperatorKey } from "./operators";

export interface FieldRuleDefinition {
    readonly ruleId: string;
    groupId?: string;
    conditionFieldId: string;
    not?: boolean;
    operator: RuleOperatorKey;
    value?: any;
}