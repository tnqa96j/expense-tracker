---
applyTo: "**"
---

# Project Conventions
## Tech Stack

| Category | Tools |
|----------|-------|
| Core | TypeScript, Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| UI | shadcn/ui (Base UI), lucide-react icons |
| Data | TanStack Query v5 |
| Forms | react-hook-form + zod (via `@hookform/resolvers/zod`) |
| State | nuqs (filters in the URL) |
| Modals | @ebay/nice-modal-react |
| Formatting | dayjs (dates), numeral (numbers) |
| Logic | ts-pattern |
| Styling | clsx + tailwind-merge, tw-animate-css |
| Testing | Vitest + Testing Library (unit and component tests), Playwright (a few key e2e flows only) |
| Tooling | pnpm, Biome (`pnpm lint` + `pnpm format` — **not** ESLint/Prettier) |

## Project Structure

```
src/app/          → file-based routing (Next.js App Router)
src/components/   → shared UI components (shadcn primitives in ui/)
src/hooks/        → shared custom React hooks
src/lib/          → shared helpers, types, constants
src/providers/    → context providers
src/services/     → data access functions (the only place that reads/writes local storage)
```

### Colocation

Keep code next to the route that uses it. Route-private folders are prefixed with `_` so the App Router excludes them from routing:

```
src/app/transactions/
├── page.tsx
├── _components/   → route-only components
├── _hooks/        → route-only hooks
└── _lib/          → route-only helpers, types, constants
```

- Use only these names: `_components`, `_hooks`, `_lib`. Don't add `_utils`, `_types`, or `_helpers`; that code goes in `_lib`.
- Create a folder only when it has content. Don't scaffold empty folders.
- Never import from another route's `_` folders. Once a second route needs the code, move it to the shared `src/components`, `src/hooks`, or `src/lib`.
- The shared `src/` folders hold only code used by 2+ routes or app-wide (layout, providers, `ui/`).

## Constraints

> Never violate these rules.

- Place `"use client"` at the very top of client components — no imports above it
- Never use `useEffect` for data fetching — always use `useQuery`
- Never use ESLint or Prettier — Biome only
- All UI elements must use shadcn/ui components — no raw HTML controls or other UI libraries
- Keep filters (and pagination, if any) in the URL with nuqs — never in `useState`
- Commit messages follow Conventional Commits (see `copilot-instructions.md`)

## Conventions

### App root setup

Mount these providers once in the root layout (a `"use client"` wrapper component):

```tsx
"use client";
import NiceModal from "@ebay/nice-modal-react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NiceModal.Provider>
        <NuqsAdapter>{children}</NuqsAdapter>
      </NiceModal.Provider>
    </QueryClientProvider>
  );
}
```

### TypeScript types

Define domain types as zod schemas and derive the TypeScript type with `z.infer`. Share the same schema between forms and services. Don't hand-write a type that duplicates a schema.

```ts
import { z } from "zod";

const itemSchema = z.object({ id: z.string(), name: z.string().min(1) });
type Item = z.infer<typeof itemSchema>;
```

### Conditional logic

Use `ts-pattern` for complex conditionals instead of `if/else` chains or `switch` statements.

```ts
import { match, P } from "ts-pattern";

const message = match(result)
  .with({ type: "loading" }, () => "Loading...")
  .with({ type: "error" }, ({ error }) => `Error: ${error.message}`)
  .with({ type: "ok", data: P.select() }, (data) => data)
  .exhaustive();
```

Use `.exhaustive()` whenever matching a discriminated union — it ensures all cases are handled at compile time. Use `.otherwise(() => ...)` when a fallback is intentional.

### Data fetching

Put every data access in a typed function in `src/services/<resource>.ts`. Reading and writing local storage happens only there; components never touch storage directly.

Call services from `useQuery`; `queryKey` format: `["<resource>", payload]`.

```ts
// src/services/items.ts
export async function listItems(payload: ListItemsPayload): Promise<Item[]> {
  // read from local storage, apply the payload's filters
}

// component
const { data } = useQuery({
  queryKey: ["items", payload],
  queryFn: () => listItems(payload),
});
```

### Mutations

Use `useMutation`; always call `queryClient.invalidateQueries` on success to keep data fresh.

```ts
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data: CreateItemInput) => createItem(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
});
```

### Modals

Use `nice-modal-react` (`NiceModal.show/hide`) for modals triggered imperatively (e.g. from buttons, actions, or outside the component tree). Use local state only for simple inline toggles that are tightly coupled to a single component.

```tsx
import NiceModal, { useModal } from "@ebay/nice-modal-react";

const ConfirmModal = NiceModal.create<{ message: string }>(({ message }) => {
  const modal = useModal();
  return (
    <Dialog open={modal.visible} onOpenChange={() => modal.hide()}>
      <DialogContent>
        <p>{message}</p>
        <Button onClick={() => { modal.resolve(true); modal.hide(); }}>Confirm</Button>
      </DialogContent>
    </Dialog>
  );
});

// Show by component reference — no registration needed
NiceModal.show(ConfirmModal, { message: "Delete this item?" }).then(() => deleteItem());
```

### Filter views

Keep filters in the URL with nuqs `useQueryStates`, so refresh, back/forward, and shared links restore the same view. Define the parsers once per page (in `_lib/` if reused), and derive the query payload from them.

- Select/checkbox filters write to the URL directly.
- If the view is paginated, any filter change resets `page` to 1.
- Use `.withDefault()` on every parser so defaults stay out of the URL and values are never `null`.

```ts
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const STATUSES = ["ALL", "ACTIVE", "PAUSED"] as const;

const filterParsers = {
  keyword: parseAsString.withDefault(""),
  status: parseAsStringLiteral(STATUSES).withDefault("ALL"),
};

const [filters, setFilters] = useQueryStates(filterParsers);

// select filter
<Select value={filters.status} onValueChange={(status) => setFilters({ status })} />

const payload = { ...filters };
```

### Forms

Use `react-hook-form` with `zod` (via `zodResolver`) for validation. Build layouts with the `Field` primitives (`FieldGroup`, `Field`, `FieldLabel`, `FieldError`) from `@/components/ui/field` instead of raw `<label>`/`<p>` elements. Use `Controller` (not `register`) since shadcn/Base UI inputs (`Select`, `Combobox`, `Checkbox`, etc.) aren't plain `<input>` elements.

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

function ExampleForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
      <FieldGroup>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input id={field.name} {...field} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
```

### Date formatting

Use `dayjs`, imported directly. Use `dayjs.unix()` for Unix timestamps (seconds) and `.unix()` to convert back. Fall back to `"-"` when the value may be missing:

```ts
value ? dayjs(value).format("YYYY-MM-DD") : "-"
value ? dayjs.unix(value).format("YYYY/MM/DD HH:mm") : "-"
```

### Number formatting

Use `numeral`, imported directly: `"0,0"` for counts, `"0%"` for ratios, `"0.[0]a"` for compact stats/badges (`1.5m`, `300k`). Guard values that may be `undefined` or `0`:

```ts
value ? numeral(value).format("0.[0]a") : undefined
```

## After implementing

Run `pnpm lint` then `pnpm format`.