import { FieldControlType } from "./field-definition";
import {
    FORM_FLOW_OPERATORS_MAP,
    RuleOperatorKey,
    RuleOperatorMeta,
    RuleOperatorMetaPatch,
    RuleOperatorPatches,
    RuleOperatorsMap,
} from "./operators";

// Mutable copy of the original operator map
let registry: RuleOperatorsMap = { ...FORM_FLOW_OPERATORS_MAP };

export const OperatorRegistry = {
    /**
     * Get the definition of a specific operator by key.
     */
    get: (key: RuleOperatorKey): RuleOperatorMeta | undefined =>
        registry[key] as RuleOperatorMeta,

    /**
     * Get all operator definitions (e.g., for building UI pickers).
     */
    getAll: (): RuleOperatorsMap => registry as RuleOperatorsMap,

    /**
     * Register one or more operator overrides or additions.
     * Existing operators with the same key will be replaced.
     */
    register: (overrides: RuleOperatorsMap) => {
        registry = { ...registry, ...overrides };
    },

    /**
     * Reset the registry to the original default operator map.
     */
    reset: () => {
        registry = { ...FORM_FLOW_OPERATORS_MAP };
    },
    /**
       * Use this for override existing operators even partially.
       * @example OperatorRegistry.patch({
                      eq: { hideFromPicker: true },
                      neq: { hideFromPicker: true },
                  });
       */
    patch: (overrides: RuleOperatorPatches) => {
        const next = { ...registry };

        for (const [key, patch] of Object.entries(overrides) as [
            RuleOperatorKey,
            RuleOperatorMetaPatch,
        ][]) {
            const current = next[key];

            if (!current) {
                throw new Error(
                    `Cannot patch unknown operator "${key}". Use register() instead.`,
                );
            }

            next[key] = {
                ...current,
                ...patch,
            };
        }

        registry = next;
    },

    /**
     * Helper for easily exclude a `fieldType` from multiple operators
     * @example OperatorRegistry.excludeFieldTypes(["switch"], ["isTrue", "isFalse", "truthy"]);
     */
    excludeFieldTypes: (
        fieldTypes: FieldControlType[],
        operators: RuleOperatorKey[],
    ) => {
        const next = { ...registry };

        for (const key of operators) {
            const current = next[key];
            if (!current) continue;

            next[key] = {
                ...current,
                disallowedTypes: [...(current.disallowedTypes ?? []), ...fieldTypes],
            };
        }

        registry = next;
    },
};
