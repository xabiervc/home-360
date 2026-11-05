import 'renovation_project.dart';

class PlanLineItem {
  const PlanLineItem({
    required this.title,
    required this.description,
    required this.lowEstimateEuros,
    required this.highEstimateEuros,
    required this.assumption,
  });

  final String title;
  final String description;
  final double lowEstimateEuros;
  final double highEstimateEuros;
  final String assumption;
}

class RenovationPlan {
  const RenovationPlan({
    required this.projectName,
    required this.style,
    required this.lineItems,
    required this.warnings,
    required this.assumptions,
    required this.budgetEuros,
  });

  final String projectName;
  final DesignStyle style;
  final List<PlanLineItem> lineItems;
  final List<String> warnings;
  final List<String> assumptions;
  final double budgetEuros;

  double get lowTotalEuros => lineItems.fold(0, (sum, item) => sum + item.lowEstimateEuros);

  double get highTotalEuros => lineItems.fold(0, (sum, item) => sum + item.highEstimateEuros);

  bool get likelyOverBudget => budgetEuros > 0 && lowTotalEuros * 1.15 > budgetEuros;
}