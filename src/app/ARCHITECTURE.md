# Application Architecture

## Component Hierarchy (Atomic Design)

```
src/app/
├── components/
│   ├── atom/       # Smallest reusable units
│   ├── molecule/   # Atoms combined
│   └── organism/   # Complex sections
├── pages/          # Full routed views
└── shared/         # Cross-cutting utilities
```

### atom/
Single-purpose, stateless UI elements.

**Examples:** Button, Input, Icon, Badge, Label, Spinner

**Characteristics:**
- No business logic
- Configurable via @Input
- Emit events via @Output
- No service dependencies

### molecule/
Combinations of 2-3 atoms forming functional units.

**Examples:** FormField (label + input + error), Card, SearchBar, Tooltip

**Characteristics:**
- Compose atoms only
- Minimal internal state
- Single responsibility

### organism/
Complex components with state and business logic.

**Examples:** Header, Sidebar, DataTable, MapViewer, ChartPanel

**Characteristics:**
- May inject services
- Can contain molecules and atoms
- Handle user interactions
- Connect to state stores

### pages/
Full views bound to routes.

**Examples:** DashboardPage, SettingsPage, ReportsPage

**Characteristics:**
- Registered in app.routes.ts
- Compose organisms
- Handle route parameters
- Coordinate data fetching

## Shared Module

```
shared/
├── models/     # TypeScript interfaces
├── services/   # Injectable services
└── utils/      # Pure helper functions
```

### models/
TypeScript interfaces and types.

**Naming:** `{entity}.model.ts`

```typescript
// user.model.ts
export interface User {
  id: string;
  email: string;
  role: UserRole;
}
```

### services/
Singleton services for data and functionality.

**Naming:** `{name}.service.ts`

```typescript
// api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService { ... }
```

### utils/
Pure functions with no side effects.

**Naming:** `{domain}.utils.ts`

```typescript
// date.utils.ts
export function formatDate(date: Date): string { ... }
```

## Placement Guidelines

| Question | Answer |
|----------|--------|
| Single HTML element? | atom |
| Combines 2-3 atoms? | molecule |
| Has complex state/logic? | organism |
| Is a routed view? | pages |
| Used across features? | shared |

## File Naming

- **Components:** `{name}.ts`, `{name}.html`, `{name}.scss`
- **Selector:** `app-{name}` (kebab-case)
- **Class:** PascalCase without suffix

```typescript
// button.ts
@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss'
})
export class Button { }
```
