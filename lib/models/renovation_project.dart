enum DesignStyle { contemporary, nordic, mediterranean, industrial, japandi }

enum RoomType { livingRoom, kitchen, bedroom, bathroom, hallway, other }

extension DesignStyleLabel on DesignStyle {
  String get label => switch (this) {
        DesignStyle.contemporary => 'Contemporáneo',
        DesignStyle.nordic => 'Nórdico',
        DesignStyle.mediterranean => 'Mediterráneo',
        DesignStyle.industrial => 'Industrial',
        DesignStyle.japandi => 'Japandi',
      };
}

extension RoomTypeLabel on RoomType {
  String get label => switch (this) {
        RoomType.livingRoom => 'Salón',
        RoomType.kitchen => 'Cocina',
        RoomType.bedroom => 'Dormitorio',
        RoomType.bathroom => 'Baño',
        RoomType.hallway => 'Pasillo',
        RoomType.other => 'Otra estancia',
      };
}

class Room {
  const Room({
    required this.name,
    required this.type,
    required this.areaSquareMeters,
    this.ceilingHeightMeters,
    this.notes = '',
  });

  final String name;
  final RoomType type;
  final double areaSquareMeters;
  final double? ceilingHeightMeters;
  final String notes;

  bool get hasValidArea => areaSquareMeters > 0 && areaSquareMeters <= 250;
}

class RenovationProject {
  const RenovationProject({
    required this.name,
    required this.city,
    required this.budgetEuros,
    required this.style,
    required this.priorities,
    required this.keepItems,
    required this.rooms,
  });

  final String name;
  final String city;
  final double budgetEuros;
  final DesignStyle style;
  final List<String> priorities;
  final List<String> keepItems;
  final List<Room> rooms;

  double get totalAreaSquareMeters =>
      rooms.fold(0, (total, room) => total + room.areaSquareMeters);
}

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

  double get lowTotalEuros =>
      lineItems.fold(0, (total, item) => total + item.lowEstimateEuros);

  double get highTotalEuros =>
      lineItems.fold(0, (total, item) => total + item.highEstimateEuros);

  bool get likelyOverBudget => lowTotalEuros > budgetEuros;
}
