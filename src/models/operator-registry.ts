// operator-registry.ts
import { FORM_FLOW_OPERATORS_MAP, RuleOperatorKey, RuleOperatorMeta, RuleOperatorsMap } from "./operators";

// Mutable copy of the original operator map
let registry: RuleOperatorsMap = { ...FORM_FLOW_OPERATORS_MAP };

export const OperatorRegistry = {
    /**
     * Get the definition of a specific operator by key.
     */
    get: (key: RuleOperatorKey): RuleOperatorMeta | undefined => registry[key],

    /**
     * Get all operator definitions (e.g., for building UI pickers).
     */
    getAll: (): RuleOperatorsMap => registry,

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
};
