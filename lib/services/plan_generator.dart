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
            '${room.name}: actualización de cocina',
            'Acabados y renovación ligera; no presupone cambio de distribución.',
            room.areaSquareMeters * 280,
            room.areaSquareMeters * 650,
            'Estimación orientativa por superficie. No incluye electrodomésticos ni cambios de instalaciones.',
          ));
        case RoomType.bathroom:
          items.add(_item(
            '${room.name}: actualización de baño',
            'Acabados y renovación ligera; verificar impermeabilización e instalaciones.',
            room.areaSquareMeters * 350,
            room.areaSquareMeters * 800,
            'Estimación orientativa por superficie. El estado de fontanería puede cambiar sustancialmente el coste.',
          ));
        case RoomType.livingRoom:
        case RoomType.bedroom:
        case RoomType.hallway:
        case RoomType.other:
          items.add(_item(
            '${room.name}: pintura y acabados',
            'Mejora estética conservando la distribución existente.',
            room.areaSquareMeters * 45,
            room.areaSquareMeters * 130,
            'Rango preliminar por superficie; depende del estado actual y de los materiales elegidos.',
          ));
      }
    }

    if (project.rooms.any((room) => !room.hasValidArea)) {
      items.add(const PlanLineItem(
        title: 'Mediciones pendientes',
        description: 'Confirma las superficies de las estancias antes de afinar el cálculo.',
        lowEstimateEuros: 0,
        highEstimateEuros: 0,
        assumption: 'Se han omitido estancias con superficies no válidas.',
      ));
    }

    final warnings = <String>[
      'Estimación demostrativa: no equivale a presupuesto de contratista ni proyecto técnico.',
      'El vídeo o las medidas aportadas no permiten confirmar estructura, instalaciones ocultas ni permisos.',
    ];
    if (project.rooms.isEmpty) {
      warnings.add('Añade al menos una estancia para generar partidas orientativas.');
    }
    if (project.keepItems.isNotEmpty) {
      warnings.add('Se intentará conservar: ${project.keepItems.join(', ')}. Confirma su estado y medidas.');
    }

    return RenovationPlan(
      projectName: project.name,
      style: project.style,
      lineItems: items,
      warnings: warnings,
      assumptions: [
        'Estilo elegido: ${project.style.label}.',
        'Prioridades indicadas: ${project.priorities.isEmpty ? 'ninguna todavía' : project.priorities.join(', ')}.',
        'Ubicación declarada: ${project.city.isEmpty ? 'sin especificar' : project.city}.',
        'Los rangos usan tarifas ficticias de prototipo y no reflejan precios locales actualizados.',
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
