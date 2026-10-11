enum DesignStyle { contemporary, nordic, mediterranean, industrial, japandi }

enum RoomType { livingRoom, kitchen, bedroom, bathroom, hallway, other }

extension DesignStyleLabel on DesignStyle {
  String get label => switch (this) {
        DesignStyle.contemporary => 'Contemporary',
        DesignStyle.nordic => 'Nordic',
        DesignStyle.mediterranean => 'Mediterranean',
        DesignStyle.industrial => 'Industrial',
        DesignStyle.japandi => 'Japandi',
      };
}

extension RoomTypeLabel on RoomType {
  String get label => switch (this) {
        RoomType.livingRoom => 'Living room',
        RoomType.kitchen => 'Kitchen',
        RoomType.bedroom => 'Bedroom',
        RoomType.bathroom => 'Bathroom',
        RoomType.hallway => 'Hallway',
        RoomType.other => 'Other room',
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
