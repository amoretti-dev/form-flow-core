import { FieldDefinition, ConditionalFieldProperty } from "../models/field-definition";
import { FieldRuleGroupDefinition, FieldRuleNode, LogicalOperator } from "../models/group";
import { FieldRuleDefinition } from "../models/rule";
import { Draft, immerable, produce } from "immer";
import { RuleHelper } from "../utility/rule-helper";
import { StateClass } from "../models/shared";

export type FieldRuleBuilderState = {
    rootGroup: FieldRuleGroupDefinition;
    rules: FieldRuleDefinition[];
    groups: FieldRuleGroupDefinition[];
}

export type FieldRuleBuilderHelpersResult = {
    state: FieldRuleBuilderState;
}

export const createFieldRuleBuilderHelpers = <TFieldControlType extends string = never>() => {
    const createState = (params?: {
        rootGroup?: FieldRuleGroupDefinition;
        ruleType?: ConditionalFieldProperty;
    }): FieldRuleBuilderState => {
        const ruleType = params?.ruleType ?? "visibleIf";
        const rootGroup = params?.rootGroup ?? RuleHelper.createGroup(ruleType);

        return {
            rootGroup,
            rules: RuleHelper.getRules(rootGroup),
            groups: RuleHelper.getGroups(rootGroup),
        };
    };

    const findGroup = (
        state: FieldRuleBuilderState,
        groupId: string,
        rootGroup: FieldRuleGroupDefinition = state.rootGroup,
    ) => RuleHelper.findGroup(groupId, rootGroup);

    const updateRootGroup = (
        state: FieldRuleBuilderState,
        recipe: (draft: Draft<FieldRuleGroupDefinition>) => void,
    ): FieldRuleBuilderHelpersResult => {
        const nextRootGroup = produce(state.rootGroup, recipe);

        return {
            state: createState({
                rootGroup: nextRootGroup,
                ruleType: nextRootGroup.ruleType,
            }),
        };
    };

    const mutateGroup = (
        state: FieldRuleBuilderState,
        groupId: string,
        recipe: (group: FieldRuleGroupDefinition) => void,
    ): FieldRuleBuilderHelpersResult =>
        updateRootGroup(state, (draft) => {
            const group = findGroup(state, groupId, draft);
            if (!group) return;

            recipe(group);
        });

    const rewriteGroupRules = (
        state: FieldRuleBuilderState,
        groupId: string,
        rewrite: (rules: FieldRuleNode[]) => FieldRuleNode[],
    ): FieldRuleBuilderHelpersResult =>
        mutateGroup(state, groupId, (group) => {
            group.rules = rewrite(group.rules);
        });

    const getGroupRules = (
        state: FieldRuleBuilderState,
        groupId: string,
    ): FieldRuleNode[] => findGroup(state, groupId)?.rules ?? [];

    const updateGroupAndNestedGroups = (
        group: FieldRuleGroupDefinition,
        newRuleType: ConditionalFieldProperty,
    ): FieldRuleGroupDefinition => {
        const updatedGroup = { ...group, ruleType: newRuleType };

        const updatedRules: FieldRuleNode[] = updatedGroup.rules.map((rule) => {
            if (RuleHelper.isGroup(rule)) {
                return updateGroupAndNestedGroups(rule, newRuleType);
            }

            return rule;
        });

        return { ...updatedGroup, rules: updatedRules };
    };

    const addGroupOrRule = (
        state: FieldRuleBuilderState,
        parentGroupId: string,
        groupOrRule: FieldRuleNode,
    ): FieldRuleBuilderHelpersResult & { rules: FieldRuleNode[] } => {
        const result = mutateGroup(state, parentGroupId, (group) => {
            group.rules.push(groupOrRule);
        });

        return {
            ...result,
            rules: getGroupRules(result.state, parentGroupId),
        };
    };

    const addRule = (
        field: FieldDefinition<TFieldControlType>,
        state: FieldRuleBuilderState,
        parentGroupId: string,
    ): FieldRuleBuilderHelpersResult & {
        rule: FieldRuleDefinition;
        rules: FieldRuleNode[];
    } => {
        const rule = RuleHelper.createRule(field);
        const result = addGroupOrRule(state, parentGroupId, rule);

        return {
            ...result,
            rule,
        };
    };

    const addGroup = <TCustom extends string = never>(
        ruleType: ConditionalFieldProperty,
        state: FieldRuleBuilderState,
        parentGroupId: string,
        field?: FieldDefinition<TCustom>
    ): FieldRuleBuilderHelpersResult & {
        group: FieldRuleGroupDefinition;
        rules: FieldRuleNode[];
    } => {
        const group = RuleHelper.createGroup(ruleType);
        if (field) {
            group.rules.push(RuleHelper.createRule<TCustom>(field))
        }
        const result = addGroupOrRule(state, parentGroupId, group);

        return {
            ...result,
            group,
        };
    };

    const updateRule = (
        state: FieldRuleBuilderState,
        parentGroupId: string,
        rule: FieldRuleDefinition,
    ): FieldRuleBuilderHelpersResult & { rootGroup: FieldRuleGroupDefinition } => {
        const result = rewriteGroupRules(state, parentGroupId, (rules) =>
            rules.map((currentRule) =>
                RuleHelper.isGroup(currentRule)
                    ? currentRule
                    : currentRule.ruleId === rule.ruleId
                        ? rule
                        : currentRule
            )
        );

        return {
            ...result,
            rootGroup: result.state.rootGroup,
        };
    };

    const removeGroup = (
        state: FieldRuleBuilderState,
        parentGroupId: string,
        groupToRemove: FieldRuleGroupDefinition,
    ): FieldRuleBuilderHelpersResult & { rules: FieldRuleNode[] } => {
        const result = rewriteGroupRules(state, parentGroupId, (rules) =>
            rules.filter((rule) =>
                RuleHelper.isGroup(rule) ? rule.groupId !== groupToRemove.groupId : true
            )
        );

        return {
            ...result,
            rules: getGroupRules(result.state, parentGroupId),
        };
    };

    const removeRule = (
        state: FieldRuleBuilderState,
        parentGroupId: string,
        ruleToRemove: FieldRuleDefinition,
    ): FieldRuleBuilderHelpersResult & { rules: FieldRuleNode[] } => {
        const result = rewriteGroupRules(state, parentGroupId, (rules) =>
            rules.filter((rule) =>
                RuleHelper.isGroup(rule) || rule.ruleId !== ruleToRemove.ruleId
            )
        );

        return {
            ...result,
            rules: getGroupRules(result.state, parentGroupId),
        };
    };

    const updateGroupOperator = (
        state: FieldRuleBuilderState,
        groupId: string,
        operator: LogicalOperator,
    ): FieldRuleBuilderHelpersResult =>
        mutateGroup(state, groupId, (group) => {
            group.operator = operator;
        });

    const updateGroupNot = (
        state: FieldRuleBuilderState,
        groupId: string,
        not: boolean,
    ): FieldRuleBuilderHelpersResult =>
        mutateGroup(state, groupId, (group) => {
            group.not = not;
        });

    const toggleGroupNot = (
        state: FieldRuleBuilderState,
        groupId: string,
    ): FieldRuleBuilderHelpersResult =>
        mutateGroup(state, groupId, (group) => {
            group.not = !group.not;
        });

    const updateRootGroupRuleType = (
        state: FieldRuleBuilderState,
        newRuleType: ConditionalFieldProperty,
    ): FieldRuleBuilderHelpersResult & { rootGroup: FieldRuleGroupDefinition } => {
        const rootGroup = updateGroupAndNestedGroups(state.rootGroup, newRuleType);

        return {
            state: createState({
                rootGroup,
                ruleType: newRuleType,
            }),
            rootGroup,
        };
    };

    const updateRootGroupOperator = (
        state: FieldRuleBuilderState,
        operator: LogicalOperator,
    ): FieldRuleBuilderHelpersResult =>
        updateRootGroup(state, (draft) => {
            draft.operator = operator;
        });

    const toggleRootGroupNot = (
        state: FieldRuleBuilderState,
        not?: boolean,
    ): FieldRuleBuilderHelpersResult =>
        updateRootGroup(state, (draft) => {
            draft.not = not != undefined ? not : !draft.not;
        });

    return {
        createState,
        findGroup,
        updateRootGroup,
        mutateGroup,
        rewriteGroupRules,
        getGroupRules,
        updateGroupAndNestedGroups,
        addGroupOrRule,
        addRule,
        addGroup,
        updateRule,
        removeGroup,
        removeRule,
        updateGroupOperator,
        updateGroupNot,
        toggleGroupNot,
        updateRootGroupRuleType,
        updateRootGroupOperator,
        toggleRootGroupNot,
    };
};

export class FieldRuleBuilder<TFieldControlType extends string = never> extends StateClass<FieldRuleBuilderState> {

    [immerable] = true;

    private _field: FieldDefinition<TFieldControlType>;
    private _ruleType: ConditionalFieldProperty;
    private _state: FieldRuleBuilderState;
    private _helpers = createFieldRuleBuilderHelpers<TFieldControlType>();

    constructor(
        field: FieldDefinition<TFieldControlType>,
        ruleType: ConditionalFieldProperty = "visibleIf",
        rootGroup?: FieldRuleGroupDefinition,
    ) {
        super();
        this._field = field;
        this._ruleType = ruleType;
        this._state = this._helpers.createState({
            rootGroup,
            ruleType,
        });
    }

    getSnapshot() {
        return this._state;
    }
    get state() { return this._state };
    get rules() { return this._state.rules };
    get groups() { return this._state.groups };

    private setState(state: FieldRuleBuilderState) {
        this._state = state;
        this.emit();
    }

    updateRootGroup(recipe: (draft: Draft<FieldRuleGroupDefinition>) => void) {
        const result = this._helpers.updateRootGroup(this._state, recipe);
        this.setState(result.state);
    }

    private getGroupRules(groupId: string): FieldRuleNode[] {
        return this._helpers.getGroupRules(this._state, groupId);
    }

    updateGroupAndNestedGroups = (group: FieldRuleGroupDefinition, newRuleType: ConditionalFieldProperty) => {
        return this._helpers.updateGroupAndNestedGroups(group, newRuleType);
    }

    addRule(parentGroupId: string) {
        const result = this._helpers.addRule(this._field, this._state, parentGroupId);
        this.setState(result.state);
        return result.rules;
    };

    addGroup(parentGroupId: string) {
        const result = this._helpers.addGroup(this._ruleType, this._state, parentGroupId);
        this.setState(result.state);
        return result.rules;
    };

    addGroupOrRule(parentGroupId: string, groupOrRule: FieldRuleNode): FieldRuleNode[] {
        const result = this._helpers.addGroupOrRule(this._state, parentGroupId, groupOrRule);
        this.setState(result.state);
        return result.rules;
    };

    updateRule(parentGroupId: string, rule: FieldRuleDefinition): FieldRuleGroupDefinition {
        const result = this._helpers.updateRule(this._state, parentGroupId, rule);
        this.setState(result.state);
        return result.rootGroup;
    }

    removeGroup(parentGroupId: string, groupToRemove: FieldRuleGroupDefinition): FieldRuleNode[] {
        const result = this._helpers.removeGroup(this._state, parentGroupId, groupToRemove);
        this.setState(result.state);
        return result.rules;
    }

    removeRule(parentGroupId: string, ruleToRemove: FieldRuleDefinition) {
        const result = this._helpers.removeRule(this._state, parentGroupId, ruleToRemove);
        this.setState(result.state);
        return result.rules;
    }

    updateGroupOperator(groupId: string, operator: LogicalOperator) {
        const result = this._helpers.updateGroupOperator(this._state, groupId, operator);
        this.setState(result.state);
    }

    updateGroupNot(groupId: string, not: boolean) {
        const result = this._helpers.updateGroupNot(this._state, groupId, not);
        this.setState(result.state);
    }

    toggleGroupNot(groupId: string) {
        const result = this._helpers.toggleGroupNot(this._state, groupId);
        this.setState(result.state);
    }

    updateRootGroupRuleType(newRuleType: ConditionalFieldProperty) {
        this._ruleType = newRuleType;
        const result = this._helpers.updateRootGroupRuleType(this._state, newRuleType);
        this.setState(result.state);
        return result.rootGroup;
    }

    updateRootGroupOperator(op: LogicalOperator) {
        const result = this._helpers.updateRootGroupOperator(this._state, op);
        this.setState(result.state);
    }

    toggleRootGroupNot(not?: boolean) {
        const result = this._helpers.toggleRootGroupNot(this._state, not);
        this.setState(result.state);
    }
}
