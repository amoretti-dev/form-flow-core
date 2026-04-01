// packages/core/src/index.ts

// 1. Tipi di campo e strutture
export {
    type BaseFieldDefinition,
    type FieldControlType,
    type FieldDefinition,
    type ConditionalFieldProperty,
    type FieldListOption,
    type FieldControlState,
    type CustomFieldControlType,
    type FormControlState,
    type RuleContextFieldDefinition,
} from './models/field-definition';
export {
    type FormFlowDefinition,
    type FormFlowSchema,
    type FormFlowValues,
} from './models/form-definition';
export {
    type FieldRuleGroupDefinition,
    type FieldRuleNode,
    type LogicalOperator,
} from './models/group';
export { type FieldRuleDefinition } from './models/rule';
export {
    type RuleNodeHelpersResult,
    type RuleNodeState,
} from './rule/rule-node';
export {
    type RulesManagerHelpersResult,
    type RulesManagerState,
} from './rule/field-rule-workspace';

// 3. Valutatore ufficiale del sistema
export { RuleEvaluator as FormFlowRuleEvaluator } from './rule/rule-evaluator';
// 4. (Opzionale) operatori configurabili, se vuoi supportare override dal consumer
export {
    // FORM_FLOW_OPERATORS_MAP,
    type RuleOperatorKey,
    type RuleOperatorMeta,
    type RuleOperatorValueType,
} from './models/operators';

export { OperatorRegistry as FormFlowOperatorRegistry } from './models/operator-registry';
export { DependencyGraph as FormFlowDependencyGraph } from './dependency-graph';
export { EngineRuleFactory as FormFlowEngineRuleFactory } from './rule/engine-rule-factory';
export { createRuleNodeHelpers } from './rule/rule-node';
export { createFieldRuleWorkspaceHelpers } from './rule/field-rule-workspace';
export { RuleMapper as FormFlowRuleMapper } from './utility/rule-mapper';
export { RuleHelper as FormFlowRuleHelper } from './utility/rule-helper';
export { FieldHelper as FormFlowFieldHelper } from './utility/field-helper';
export { RuleValidator as FormFlowRuleValidator } from './utility/rule-validator'
