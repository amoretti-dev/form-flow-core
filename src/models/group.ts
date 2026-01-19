import { ConditionalFieldProperty } from "./field-definition";
import { FieldRuleDefinition } from "./rule";

export type LogicalOperator = "and" | "or";
export type FieldRuleNode = FieldRuleDefinition | FieldRuleGroupDefinition;
export interface FieldRuleGroupDefinition {
    groupId: string;
    ruleType: ConditionalFieldProperty;
    operator: LogicalOperator;
    not?: boolean;
    rules: FieldRuleNode[]; // Regole o gruppi annidati
}