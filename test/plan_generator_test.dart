import 'package:flutter_test/flutter_test.dart';
import 'package:new_home/models/renovation_project.dart';
import 'package:new_home/services/plan_generator.dart';

void main() {
  const generator = PlanGenerator();

  RenovationProject projectWith(List<Room> rooms, {double budget = 20000}) =>
      RenovationProject(
        name: 'Piso de prueba',
        city: 'Madrid',
        budgetEuros: budget,
        style: DesignStyle.nordic,
        priorities: const ['Más luz'],
        keepItems: const ['Puertas'],
        rooms: rooms,
      );

  test('generates room-specific ranges and total area', () {
    final project = projectWith(const [
      Room(name: 'Cocina', type: RoomType.kitchen, areaSquareMeters: 10),
      Room(name: 'Baño', type: RoomType.bathroom, areaSquareMeters: 5),
      Room(name: 'Salón', type: RoomType.livingRoom, areaSquareMeters: 20),
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
      Room(name: 'Habitación', type: RoomType.bedroom, areaSquareMeters: 12),
      Room(name: 'Pasillo', type: RoomType.hallway, areaSquareMeters: 0),
    ]));

    expect(plan.lineItems, hasLength(2));
    expect(plan.lineItems.first.lowEstimateEuros, 540);
    expect(plan.lineItems.last.title, 'Mediciones pendientes');
  });

  test('flags a budget below the minimum estimate', () {
    final plan = generator.generate(projectWith(
      const [Room(name: 'Baño', type: RoomType.bathroom, areaSquareMeters: 8)],
      budget: 1000,
    ));

    expect(plan.likelyOverBudget, isTrue);
  });

  test('handles an empty project without a false budget warning', () {
    final plan = generator.generate(projectWith(const []));

    expect(plan.lineItems, isEmpty);
    expect(plan.likelyOverBudget, isFalse);
    expect(plan.warnings, contains('Añade al menos una estancia para generar partidas orientativas.'));
  });
}
