import '../models/renovation_project.dart';

/// Produces a transparent, deterministic early-stage estimate.
/// Rates are placeholders, not a live local price catalogue or a contractor quote.
class PlanGenerator {
  const PlanGenerator();

  RenovationPlan generate(RenovationProject project) {
    final items = <PlanLineItem>[];

    for (final room in project.rooms) {
      if (!room.hasValidArea) continue;

      switch (room.type) {
        case RoomType.kitchen:
          items.add(_item(
            '${room.name}: kitchen finish refresh',
            'Light finish updates; no layout change is assumed.',
            room.areaSquareMeters * 280,
            room.areaSquareMeters * 650,
            'Illustrative area-based range. Excludes appliances and changes to building services.',
          ));
        case RoomType.bathroom:
          items.add(_item(
            '${room.name}: bathroom finish refresh',
            'Light finish updates; check waterproofing and services.',
            room.areaSquareMeters * 350,
            room.areaSquareMeters * 800,
            'Illustrative area-based range. Plumbing condition may materially change the cost.',
          ));
        case RoomType.livingRoom:
        case RoomType.bedroom:
        case RoomType.hallway:
        case RoomType.other:
          items.add(_item(
            '${room.name}: paint and finishes',
            'Cosmetic improvement while keeping the existing layout.',
            room.areaSquareMeters * 45,
            room.areaSquareMeters * 130,
            'Preliminary area-based range; depends on current condition and chosen materials.',
          ));
      }
    }

    if (project.rooms.any((room) => !room.hasValidArea)) {
      items.add(const PlanLineItem(
        title: 'Measurements to confirm',
        description: 'Confirm room areas before refining the calculation.',
        lowEstimateEuros: 0,
        highEstimateEuros: 0,
        assumption: 'Rooms with invalid areas have been omitted.',
      ));
    }

    final warnings = <String>[
      'Demonstration estimate only; not a contractor quote or technical project.',
      'A video or user-entered areas cannot confirm structure, hidden services, or permits.',
    ];
    if (project.rooms.isEmpty) {
      warnings.add('Add at least one room to generate indicative line items.');
    }
    if (project.keepItems.isNotEmpty) {
      warnings.add('Items to keep: ${project.keepItems.join(', ')}. Confirm their condition and dimensions.');
    }

    return RenovationPlan(
      projectName: project.name,
      style: project.style,
      lineItems: items,
      warnings: warnings,
      assumptions: [
        'Selected style: ${project.style.label}.',
        'Stated priorities: ${project.priorities.isEmpty ? 'none yet' : project.priorities.join(', ')}.',
        'Stated location: ${project.city.isEmpty ? 'not specified' : project.city}.',
        'Ranges use fictional prototype rates and are not current local prices.',
      ],
      budgetEuros: project.budgetEuros,
    );
  }

  PlanLineItem _item(
    String title,
    String description,
    double low,
    double high,
    String assumption,
  ) =>
      PlanLineItem(
        title: title,
        description: description,
        lowEstimateEuros: low,
        highEstimateEuros: high,
        assumption: assumption,
      );
}
