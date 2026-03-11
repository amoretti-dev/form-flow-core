import {
  FormFlowDependencyGraph,
  FormFlowRuleEvaluator,
  type FieldDefinition,
  type FormFlowDefinition,
  type RuleContextFieldDefinition,
} from '../src/index';

describe('FormFlowDependencyGraph', () => {
  it('remains backward compatible when instantiated with target fields only', () => {
    const fields: FieldDefinition[] = [
      { id: 'deal.goal', label: 'Deal Goal', type: 'number' },
      {
        id: 'deal.stage',
        label: 'Deal Stage',
        type: 'text',
        visibleIf: {
          groupId: 'stage-visible',
          operator: 'and',
          ruleType: 'visibleIf',
          rules: [
            { ruleId: '1', conditionFieldId: 'deal.goal', operator: 'gte', value: 1000 }
          ]
        }
      }
    ];

    const graph = new FormFlowDependencyGraph(fields);

    expect(graph.getDependentFields('deal.goal')).toEqual(new Set(['deal.stage']));
  });

  it('tracks rule context field paths as source dependencies without treating them as targets', () => {
    const fields: FieldDefinition[] = [
      {
        id: 'deal.goal',
        label: 'Deal Goal',
        type: 'number',
        visibleIf: {
          groupId: 'goal-visible',
          operator: 'and',
          ruleType: 'visibleIf',
          rules: [
            { ruleId: '1', conditionFieldId: 'customer.yearlyEarnings', operator: 'gte', value: 1000 }
          ]
        }
      }
    ];
    const ruleContextFields: RuleContextFieldDefinition[] = [
      {
        id: 'customer.yearlyEarnings',
        label: 'Customer Yearly Earnings',
        type: 'number'
      }
    ];
    const definition: FormFlowDefinition = {
      formId: 'deal-form',
      fields,
      ruleContextFields
    };

    const graph = new FormFlowDependencyGraph(definition);
    const evaluated = FormFlowRuleEvaluator.evaluateDependentsFields(
      'customer.yearlyEarnings',
      definition.fields,
      { customer: { yearlyEarnings: 1200 } },
      graph
    );

    expect(graph.getDependentFields('customer.yearlyEarnings')).toEqual(new Set(['deal.goal']));
    expect(evaluated).toEqual({
      'deal.goal': {
        visible: true,
        required: false,
        disabled: false,
        readonly: false
      }
    });
    expect('customer.yearlyEarnings' in evaluated).toBe(false);
  });
});
