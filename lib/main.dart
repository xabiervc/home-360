import 'package:flutter/material.dart';

import 'models/renovation_project.dart';
import 'services/plan_generator.dart';

void main() => runApp(const Home360App());

class Home360App extends StatelessWidget {
  const Home360App({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Home 360',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF287A68),
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFFF7F7F3),
          inputDecorationTheme: const InputDecorationTheme(
            border: OutlineInputBorder(),
          ),
        ),
        home: const ProjectSetupPage(),
      );
}

class ProjectSetupPage extends StatefulWidget {
  const ProjectSetupPage({super.key});

  @override
  State<ProjectSetupPage> createState() => _ProjectSetupPageState();
}

class _ProjectSetupPageState extends State<ProjectSetupPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController(text: 'My renovation');
  final _city = TextEditingController(text: 'Madrid');
  final _budget = TextEditingController(text: '30000');
  final _roomName = TextEditingController();
  final _area = TextEditingController();
  final _priority = TextEditingController();
  final List<Room> _rooms = [];
  final List<String> _priorities = [];
  final List<String> _keepItems = [];
  RoomType _roomType = RoomType.livingRoom;
  DesignStyle _style = DesignStyle.nordic;

  @override
  void dispose() {
    _name.dispose();
    _city.dispose();
    _budget.dispose();
    _roomName.dispose();
    _area.dispose();
    _priority.dispose();
    super.dispose();
  }

  void _addRoom() {
    final name = _roomName.text.trim();
    final area = double.tryParse(_area.text.replaceAll(',', '.'));
    if (name.isEmpty || area == null || area <= 0 || area > 250) {
      _showMessage('Enter a room name and an area between 0 and 250 m².');
      return;
    }
    setState(() {
      _rooms.add(Room(name: name, type: _roomType, areaSquareMeters: area));
      _roomName.clear();
      _area.clear();
    });
  }

  void _addPriority() {
    final value = _priority.text.trim();
    if (value.isEmpty) return;
    setState(() {
      _priorities.add(value);
      _priority.clear();
    });
  }

  void _showMessage(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  void _generatePlan() {
    if (!_formKey.currentState!.validate()) return;
    final project = RenovationProject(
      name: _name.text.trim(),
      city: _city.text.trim(),
      budgetEuros: double.parse(_budget.text.replaceAll(',', '.')),
      style: _style,
      priorities: List.unmodifiable(_priorities),
      keepItems: List.unmodifiable(_keepItems),
      rooms: List.unmodifiable(_rooms),
    );
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => PlanPage(project: project)),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Home 360'), centerTitle: false),
        body: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              Text('Plan your renovation', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              const Text('Tell us what you would like to change. This prototype creates an initial local estimate without uploading your data.'),
              const SizedBox(height: 20),
              _sectionTitle(context, '1. The project'),
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Project name'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Enter a project name.' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _city,
                decoration: const InputDecoration(labelText: 'City'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _budget,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Maximum budget', prefixText: '€ '),
                validator: (value) {
                  final amount = double.tryParse((value ?? '').replaceAll(',', '.'));
                  return amount == null || amount <= 0 ? 'Enter a valid budget.' : null;
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<DesignStyle>(
                value: _style,
                decoration: const InputDecoration(labelText: 'Preferred style'),
                items: DesignStyle.values.map((style) => DropdownMenuItem(value: style, child: Text(style.label))).toList(),
                onChanged: (value) => setState(() => _style = value ?? _style),
              ),
              const SizedBox(height: 24),
              _sectionTitle(context, '2. Your priorities'),
              Row(children: [
                Expanded(child: TextField(controller: _priority, decoration: const InputDecoration(hintText: 'More light, storage…'))),
                IconButton(onPressed: _addPriority, icon: const Icon(Icons.add_circle_outline), tooltip: 'Add priority'),
              ]),
              if (_priorities.isEmpty) const Padding(padding: EdgeInsets.only(top: 8), child: Text('No priorities added yet.')),
              Wrap(spacing: 8, children: _priorities.map((item) => InputChip(label: Text(item), onDeleted: () => setState(() => _priorities.remove(item)))).toList()),
              const SizedBox(height: 12),
              Wrap(spacing: 8, children: [
                for (final item in ['Flooring', 'Doors', 'Furniture'])
                  FilterChip(
                    label: Text('Keep $item'),
                    selected: _keepItems.contains(item),
                    onSelected: (selected) => setState(() => selected ? _keepItems.add(item) : _keepItems.remove(item)),
                  ),
              ]),
              const SizedBox(height: 24),
              _sectionTitle(context, '3. Rooms and measurements'),
              Row(children: [
                Expanded(
                  flex: 3,
                  child: TextField(
                    controller: _roomName,
                    decoration: const InputDecoration(labelText: 'Room'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: DropdownButtonFormField<RoomType>(
                    value: _roomType,
                    decoration: const InputDecoration(labelText: 'Type'),
                    items: RoomType.values.map((type) => DropdownMenuItem(value: type, child: Text(type.label, overflow: TextOverflow.ellipsis))).toList(),
                    onChanged: (value) => setState(() => _roomType = value ?? _roomType),
                  ),
                ),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: TextField(controller: _area, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Area', suffixText: 'm²')),
                const SizedBox(width: 12),
                FilledButton.icon(onPressed: _addRoom, icon: const Icon(Icons.add), label: const Text('Add')),
              ]),
              const SizedBox(height: 8),
              if (_rooms.isEmpty)
                const Text('Add rooms and confirm their areas.', style: TextStyle(color: Colors.black54))
              else
                ..._rooms.asMap().entries.map((entry) {
                  final index = entry.key;
                  final room = entry.value;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.meeting_room_outlined),
                    title: Text(room.name),
                    subtitle: Text('${room.type.label} · ${room.areaSquareMeters.toStringAsFixed(1)} m²'),
                    trailing: IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() => _rooms.removeAt(index))),
                  );
                }),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: _generatePlan,
                icon: const Icon(Icons.auto_awesome),
                label: const Padding(padding: EdgeInsets.symmetric(vertical: 14), child: Text('Generate an indicative plan')),
              ),
              const SizedBox(height: 12),
              const Text('The app does not analyse video yet. Estimates are not a professional quote or technical project.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.black54)),
            ],
          ),
        ),
      );

  Widget _sectionTitle(BuildContext context, String title) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(title, style: Theme.of(context).textTheme.titleLarge),
      );
}

class PlanPage extends StatelessWidget {
  const PlanPage({required this.project, super.key});

  final RenovationProject project;
  static const _generator = PlanGenerator();

  String _euros(double amount) => '${amount.toStringAsFixed(0)} €';

  @override
  Widget build(BuildContext context) {
    final plan = _generator.generate(project);
    return Scaffold(
      appBar: AppBar(title: const Text('Your initial plan')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(plan.projectName, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text('${plan.style.label} · ${project.totalAreaSquareMeters.toStringAsFixed(1)} m² · ${project.city}'),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Preliminary range', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text('${_euros(plan.lowTotalEuros)} – ${_euros(plan.highTotalEuros)}', style: Theme.of(context).textTheme.headlineSmall),
                Text('Stated budget: ${_euros(plan.budgetEuros)}'),
                if (plan.likelyOverBudget) const Text('The stated limit is below even the low end of this estimate.', style: TextStyle(color: Colors.red)),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          Text('Line items', style: Theme.of(context).textTheme.titleLarge),
          if (plan.lineItems.isEmpty) const ListTile(title: Text('No line items: add rooms with valid measurements.')),
          ...plan.lineItems.map((item) => Card(
                child: ListTile(
                  title: Text(item.title),
                  subtitle: Text('${item.description}\n${item.assumption}'),
                  isThreeLine: true,
                  trailing: Text('${_euros(item.lowEstimateEuros)}\n–\n${_euros(item.highEstimateEuros)}', textAlign: TextAlign.end),
                ),
              )),
          const SizedBox(height: 16),
          Text('Assumptions', style: Theme.of(context).textTheme.titleLarge),
          ...plan.assumptions.map((item) => ListTile(leading: const Icon(Icons.info_outline), title: Text(item))),
          const SizedBox(height: 8),
          Text('Feasibility warnings', style: Theme.of(context).textTheme.titleLarge),
          ...plan.warnings.map((item) => ListTile(leading: const Icon(Icons.warning_amber_outlined), title: Text(item))),
        ],
      ),
    );
  }
}
