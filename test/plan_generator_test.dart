import 'package:flutter_test/flutter_test.dart';
import 'package:home_360/models/renovation_project.dart';
import 'package:home_360/services/plan_generator.dart';

void main() {
  const generator = PlanGenerator();

  RenovationProject projectWith(List<Room> rooms, {double budget = 20000}) =>
      RenovationProject(
        name: 'Test flat',
        city: 'Madrid',
        budgetEuros: budget,
        style: DesignStyle.nordic,
        priorities: const ['More light'],
        keepItems: const ['Doors'],
        rooms: rooms,
      );

  test('generates room-specific ranges and total area', () {
    final project = projectWith(const [
      Room(name: 'Kitchen', type: RoomType.kitchen, areaSquareMeters: 10),
      Room(name: 'Bathroom', type: RoomType.bathroom, areaSquareMeters: 5),
      Room(name: 'Living room', type: RoomType.livingRoom, areaSquareMeters: 20),
    ]);
    final plan = generator.generate(project);

    expect(project.totalAreaSquareMeters, 35);
    expect(plan.lineItems, hasLength(3));
    expect(plan.lowTotalEuros, 10 * 280 + 5 * 350 + 20 * 45);
    expect(plan.highTotalEuros, 10 * 650 + 5 * 800 + 20 * 130);
    expect(plan.warnings, isNotEmpty);
  });

  test('omits invalid areas and reports pending measurements', () {
    final plan = generator.generate(projectWith(const [
      Room(name: 'Bedroom', type: RoomType.bedroom, areaSquareMeters: 12),
      Room(name: 'Hallway', type: RoomType.hallway, areaSquareMeters: 0),
    ]));

    expect(plan.lineItems, hasLength(2));
    expect(plan.lineItems.first.lowEstimateEuros, 540);
    expect(plan.lineItems.last.title, 'Measurements pending');
  });

  test('flags a budget below the minimum estimate', () {
    final plan = generator.generate(projectWith(
      const [Room(name: 'Bathroom', type: RoomType.bathroom, areaSquareMeters: 8)],
      budget: 1000,
    ));

    expect(plan.likelyOverBudget, isTrue);
  });

  test('handles an empty project without a false budget warning', () {
    final plan = generator.generate(projectWith(const []));

    expect(plan.lineItems, isEmpty);
    expect(plan.likelyOverBudget, isFalse);
    expect(plan.warnings, contains('Add at least one room to generate indicative line items.'));
  });
}
