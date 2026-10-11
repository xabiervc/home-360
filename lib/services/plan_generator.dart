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
            '${room.name}: kitchen refresh',
            'Finishes and light renovation; no layout change is assumed.',
            room.areaSquareMeters * 280,
            room.areaSquareMeters * 650,
            'Illustrative area-based estimate. Appliances and utility changes are excluded.',
          ));
        case RoomType.bathroom:
          items.add(_item(
            '${room.name}: bathroom refresh',
            'Finishes and light renovation; verify waterproofing and utilities.',
            room.areaSquareMeters * 350,
            room.areaSquareMeters * 800,
            'Illustrative area-based estimate. Plumbing condition may significantly change the cost.',
          ));
        case RoomType.livingRoom:
        case RoomType.bedroom:
        case RoomType.hallway:
        case RoomType.other:
          items.add(_item(
            '${room.name}: painting and finishes',
            'Cosmetic improvement while retaining the existing layout.',
            room.areaSquareMeters * 45,
            room.areaSquareMeters * 130,
            'Preliminary area-based range; depends on current condition and selected materials.',
          ));
      }
    }

    if (project.rooms.any((room) => !room.hasValidArea)) {
      items.add(const PlanLineItem(
        title: 'Measurements pending',
        description: 'Confirm room areas before refining the calculation.',
        lowEstimateEuros: 0,
        highEstimateEuros: 0,
        assumption: 'Rooms with invalid areas have been omitted.',
      ));
    }

    final warnings = <String>[
      'Demonstration estimate: not a contractor quote or technical project.',
      'Video or user-provided measurements cannot verify structure, hidden utilities, or permits.',
    ];
    if (project.rooms.isEmpty) {
      warnings.add('Add at least one room to generate indicative line items.');
    }
    if (project.keepItems.isNotEmpty) {
      warnings.add('Items to retain: ${project.keepItems.join(', ')}. Confirm their condition and measurements.');
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
        'Ranges use fictional prototype rates and do not reflect current local prices.',
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
