import {
    FieldDefinition,
    ConditionalFieldProperty,
} from "../models/field-definition";
import {
    FieldRuleGroupDefinition,
    FieldRuleNode,
    LogicalOperator,
} from "../models/group";
import { FieldRuleDefinition } from "../models/rule";
import { Draft, produce } from "immer";
import { RuleHelper } from "../utility/rule-helper";

export type RuleBuilderState = {
    rootGroup: FieldRuleGroupDefinition;
    rules: FieldRuleDefinition[];
    groups: FieldRuleGroupDefinition[];
};

export type RuleBuilderHelpersResult = {
    state: RuleBuilderState;
};

export const createRuleBuilderHelpers = () => {
    const createState = (params?: {
        rootGroup?: FieldRuleGroupDefinition;
        ruleType?: ConditionalFieldProperty;
    }): RuleBuilderState => {
        const ruleType = params?.ruleType ?? "visibleIf";
        const rootGroup = params?.rootGroup ?? RuleHelper.createGroup(ruleType);

        return {
            rootGroup,
            rules: RuleHelper.getRules(rootGroup),
            groups: RuleHelper.getGroups(rootGroup),
        };
    };

    const findGroup = (
        state: RuleBuilderState,
        groupId: string,
        rootGroup: FieldRuleGroupDefinition = state.rootGroup,
    ) => RuleHelper.findGroup(groupId, rootGroup);

    const updateRootGroup = (
        state: RuleBuilderState,
        recipe: (draft: Draft<FieldRuleGroupDefinition>) => void,
    ): RuleBuilderHelpersResult => {
        const nextRootGroup = produce(state.rootGroup, recipe);

        return {
            state: createState({
                rootGroup: nextRootGroup,
                ruleType: nextRootGroup.ruleType,
            }),
        };
    };

    const mutateGroup = (
        state: RuleBuilderState,
        groupId: string,
        recipe: (group: FieldRuleGroupDefinition) => void,
    ): RuleBuilderHelpersResult =>
        updateRootGroup(state, (draft) => {
            const group = findGroup(state, groupId, draft);
            if (!group) return;

            recipe(group);
        });

    const rewriteGroupRules = (
        state: RuleBuilderState,
        groupId: string,
        rewrite: (rules: FieldRuleNode[]) => FieldRuleNode[],
    ): RuleBuilderHelpersResult =>
        mutateGroup(state, groupId, (group) => {
            group.rules = rewrite(group.rules);
        });

    const getGroupRules = (
        state: RuleBuilderState,
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
        state: RuleBuilderState,
        parentGroupId: string,
        groupOrRule: FieldRuleNode,
    ): RuleBuilderHelpersResult & { rules: FieldRuleNode[] } => {
        const result = mutateGroup(state, parentGroupId, (group) => {
            group.rules.push(groupOrRule);
        });

        return {
            ...result,
            rules: getGroupRules(result.state, parentGroupId),
        };
    };

    const addRule = (
        field: FieldDefinition,
        state: RuleBuilderState,
        parentGroupId: string,
    ): RuleBuilderHelpersResult & {
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

    const addGroup = (
        ruleType: ConditionalFieldProperty,
        state: RuleBuilderState,
        parentGroupId: string,
        field?: FieldDefinition,
    ): RuleBuilderHelpersResult & {
        group: FieldRuleGroupDefinition;
        rules: FieldRuleNode[];
    } => {
        const group = RuleHelper.createGroup(ruleType);
        if (field) {
            group.rules.push(RuleHelper.createRule(field));
        }
        const result = addGroupOrRule(state, parentGroupId, group);

        return {
            ...result,
            group,
        };
    };

    const updateRule = (
        state: RuleBuilderState,
        parentGroupId: string,
        rule: FieldRuleDefinition,
    ): RuleBuilderHelpersResult & { rootGroup: FieldRuleGroupDefinition } => {
        const result = rewriteGroupRules(state, parentGroupId, (rules) =>
            rules.map((currentRule) =>
                RuleHelper.isGroup(currentRule)
                    ? currentRule
                    : currentRule.ruleId === rule.ruleId
                        ? rule
                        : currentRule,
            ),
        );

        return {
            ...result,
            rootGroup: result.state.rootGroup,
        };
    };

    const removeGroup = (
        state: RuleBuilderState,
        parentGroupId: string,
        groupToRemove: FieldRuleGroupDefinition,
    ): RuleBuilderHelpersResult & { rules: FieldRuleNode[] } => {
        const result = rewriteGroupRules(state, parentGroupId, (rules) =>
            rules.filter((rule) =>
                RuleHelper.isGroup(rule)
                    ? rule.groupId !== groupToRemove.groupId
                    : true,
            ),
        );

        return {
            ...result,
            rules: getGroupRules(result.state, parentGroupId),
        };
    };

    const removeRule = (
        state: RuleBuilderState,
        parentGroupId: string,
        ruleToRemove: FieldRuleDefinition,
    ): RuleBuilderHelpersResult & { rules: FieldRuleNode[] } => {
        const result = rewriteGroupRules(state, parentGroupId, (rules) =>
            rules.filter(
                (rule) =>
                    RuleHelper.isGroup(rule) || rule.ruleId !== ruleToRemove.ruleId,
            ),
        );

        return {
            ...result,
            rules: getGroupRules(result.state, parentGroupId),
        };
    };

    const updateGroupOperator = (
        state: RuleBuilderState,
        groupId: string,
        operator: LogicalOperator,
    ): RuleBuilderHelpersResult =>
        mutateGroup(state, groupId, (group) => {
            group.operator = operator;
        });

    const updateGroupNot = (
        state: RuleBuilderState,
        groupId: string,
        not: boolean,
    ): RuleBuilderHelpersResult =>
        mutateGroup(state, groupId, (group) => {
            group.not = not;
        });

    const toggleGroupNot = (
        state: RuleBuilderState,
        groupId: string,
    ): RuleBuilderHelpersResult =>
        mutateGroup(state, groupId, (group) => {
            group.not = !group.not;
        });

    const updateRootGroupRuleType = (
        state: RuleBuilderState,
        newRuleType: ConditionalFieldProperty,
    ): RuleBuilderHelpersResult & { rootGroup: FieldRuleGroupDefinition } => {
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
        state: RuleBuilderState,
        operator: LogicalOperator,
    ): RuleBuilderHelpersResult =>
        updateRootGroup(state, (draft) => {
            draft.operator = operator;
        });

    const toggleRootGroupNot = (
        state: RuleBuilderState,
        not?: boolean,
    ): RuleBuilderHelpersResult =>
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
