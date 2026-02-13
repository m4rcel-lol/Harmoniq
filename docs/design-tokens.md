# Harmoniq Material — Design Tokens

The Harmoniq Material design system provides a consistent visual language across all platforms. Tokens are defined as CSS custom properties and exported as a Tailwind preset.

---

## Color Tokens

### Base Palette

| Token                     | Light              | Dark               |
|---------------------------|---------------------|---------------------|
| `--hq-bg-primary`        | `#FFFFFF`           | `#1A1A2E`           |
| `--hq-bg-secondary`      | `#F5F5FA`           | `#16213E`           |
| `--hq-bg-tertiary`       | `#EEEEF4`           | `#0F3460`           |
| `--hq-text-primary`      | `#1A1A2E`           | `#E8E8F0`           |
| `--hq-text-secondary`    | `#6B7280`           | `#9CA3AF`           |
| `--hq-text-muted`        | `#9CA3AF`           | `#6B7280`           |
| `--hq-border`            | `#E5E7EB`           | `#2D2D44`           |
| `--hq-divider`           | `#F3F4F6`           | `#232340`           |

### Accent Palettes

Three built-in accent themes. Users choose one in settings.

#### Aurora (Default)

| Token                     | Value               |
|---------------------------|---------------------|
| `--hq-accent-50`         | `#EEF2FF`           |
| `--hq-accent-100`        | `#C7D2FE`           |
| `--hq-accent-200`        | `#A5B4FC`           |
| `--hq-accent-300`        | `#818CF8`           |
| `--hq-accent-400`        | `#6366F1`           |
| `--hq-accent-500`        | `#4F46E5`           |
| `--hq-accent-600`        | `#4338CA`           |
| `--hq-accent-700`        | `#3730A3`           |

#### Sunset

| Token                     | Value               |
|---------------------------|---------------------|
| `--hq-accent-50`         | `#FFF7ED`           |
| `--hq-accent-100`        | `#FFEDD5`           |
| `--hq-accent-200`        | `#FED7AA`           |
| `--hq-accent-300`        | `#FDBA74`           |
| `--hq-accent-400`        | `#FB923C`           |
| `--hq-accent-500`        | `#F97316`           |
| `--hq-accent-600`        | `#EA580C`           |
| `--hq-accent-700`        | `#C2410C`           |

#### Night

| Token                     | Value               |
|---------------------------|---------------------|
| `--hq-accent-50`         | `#F0FDF4`           |
| `--hq-accent-100`        | `#DCFCE7`           |
| `--hq-accent-200`        | `#BBF7D0`           |
| `--hq-accent-300`        | `#86EFAC`           |
| `--hq-accent-400`        | `#4ADE80`           |
| `--hq-accent-500`        | `#22C55E`           |
| `--hq-accent-600`        | `#16A34A`           |
| `--hq-accent-700`        | `#15803D`           |

### Semantic Colors

| Token                     | Value               | Usage               |
|---------------------------|---------------------|---------------------|
| `--hq-success`           | `#22C55E`           | Confirmations       |
| `--hq-warning`           | `#F59E0B`           | Warnings            |
| `--hq-error`             | `#EF4444`           | Errors, destructive |
| `--hq-info`              | `#3B82F6`           | Informational       |
| `--hq-online`            | `#22C55E`           | User online         |
| `--hq-idle`              | `#F59E0B`           | User idle           |
| `--hq-dnd`               | `#EF4444`           | Do not disturb      |
| `--hq-offline`           | `#6B7280`           | User offline        |

---

## Typography

**Font Family:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

**Code Font:** `"JetBrains Mono", "Fira Code", monospace`

### Scale

| Token             | Size   | Weight | Line Height | Usage               |
|-------------------|--------|--------|-------------|---------------------|
| `--hq-h1`        | 28px   | 700    | 1.25        | Page titles          |
| `--hq-h2`        | 22px   | 600    | 1.3         | Section headers      |
| `--hq-h3`        | 18px   | 600    | 1.35        | Subsections          |
| `--hq-body`      | 15px   | 400    | 1.5         | Body text            |
| `--hq-body-sm`   | 13px   | 400    | 1.45        | Secondary text       |
| `--hq-caption`   | 11px   | 500    | 1.4         | Timestamps, labels   |
| `--hq-code`      | 13px   | 400    | 1.5         | Code blocks          |

### Font Weights

| Token               | Weight |
|----------------------|--------|
| `--hq-font-regular` | 400    |
| `--hq-font-medium`  | 500    |
| `--hq-font-semibold`| 600    |
| `--hq-font-bold`    | 700    |

---

## Spacing Scale

Based on a 4px base unit. Use multiples for consistent spacing.

| Token          | Value | Pixels |
|----------------|-------|--------|
| `--hq-sp-1`   | 0.25rem | 4px  |
| `--hq-sp-2`   | 0.5rem  | 8px  |
| `--hq-sp-3`   | 0.75rem | 12px |
| `--hq-sp-4`   | 1rem    | 16px |
| `--hq-sp-5`   | 1.25rem | 20px |
| `--hq-sp-6`   | 1.5rem  | 24px |
| `--hq-sp-8`   | 2rem    | 32px |
| `--hq-sp-10`  | 2.5rem  | 40px |
| `--hq-sp-12`  | 3rem    | 48px |
| `--hq-sp-16`  | 4rem    | 64px |

**Grid:** Content areas align to a 4 / 8 / 12 / 16 px grid.

---

## Border Radius

| Token              | Value  | Usage                  |
|--------------------|--------|------------------------|
| `--hq-radius-sm`  | 4px    | Badges, chips          |
| `--hq-radius-md`  | 8px    | Cards, inputs          |
| `--hq-radius-lg`  | 12px   | Modals, panels         |
| `--hq-radius-xl`  | 16px   | Large containers       |
| `--hq-radius-full`| 9999px | Avatars, pills         |

---

## Elevation / Shadows

Three levels of elevation for layered UI elements.

| Token               | Value                                            | Usage                     |
|----------------------|--------------------------------------------------|---------------------------|
| `--hq-shadow-sm`   | `0 1px 2px rgba(0, 0, 0, 0.06)`                 | Subtle lift (cards)       |
| `--hq-shadow-md`   | `0 4px 12px rgba(0, 0, 0, 0.10)`                | Dropdowns, popovers      |
| `--hq-shadow-lg`   | `0 12px 32px rgba(0, 0, 0, 0.16)`               | Modals, floating panels   |

In dark mode, shadows use lower opacity and are supplemented with a `1px` border to maintain visual separation.

---

## Motion / Transitions

| Token                   | Duration | Easing                        | Usage                    |
|-------------------------|----------|-------------------------------|--------------------------|
| `--hq-motion-hover`    | 180ms    | `ease-out`                    | Hover states, focus      |
| `--hq-motion-panel`    | 320ms    | `cubic-bezier(0.4, 0, 0.2, 1)` | Panel slide, collapse  |
| `--hq-motion-scroll`   | 500ms    | `cubic-bezier(0.0, 0, 0.2, 1)` | Smooth scroll, page nav |
| `--hq-motion-fade`     | 200ms    | `ease-in-out`                 | Fade in/out              |

**Reduced Motion:** When `prefers-reduced-motion: reduce` is active, all transitions collapse to `0ms` and animations are disabled.

---

## Component Specifications

### Button

| Variant    | Height | Padding (h) | Font        | Radius          |
|------------|--------|-------------|-------------|-----------------|
| Primary    | 40px   | 16px        | body / 600  | `--hq-radius-md` |
| Secondary  | 40px   | 16px        | body / 500  | `--hq-radius-md` |
| Ghost      | 36px   | 12px        | body / 500  | `--hq-radius-md` |
| Icon-only  | 36px   | 8px         | —           | `--hq-radius-full` |
| Danger     | 40px   | 16px        | body / 600  | `--hq-radius-md` |

States: `default → hover (180ms) → active → disabled (0.5 opacity)`.

### Avatar

| Size   | Dimension | Radius              | Usage               |
|--------|-----------|----------------------|---------------------|
| xs     | 24px      | `--hq-radius-full`  | Inline mentions     |
| sm     | 32px      | `--hq-radius-full`  | Message list        |
| md     | 40px      | `--hq-radius-full`  | Member sidebar      |
| lg     | 64px      | `--hq-radius-full`  | Profile card        |
| xl     | 96px      | `--hq-radius-full`  | Profile page        |

Presence dot: 25% of avatar size, positioned bottom-right with a 2px bg-colored border.

### Modal

- Max width: `480px` (small), `640px` (medium), `800px` (large)
- Padding: `--hq-sp-6`
- Radius: `--hq-radius-lg`
- Shadow: `--hq-shadow-lg`
- Backdrop: `rgba(0, 0, 0, 0.5)` with `--hq-motion-fade`

### Message Bubble

- Padding: `--hq-sp-2` vertical, `--hq-sp-3` horizontal
- Radius: `--hq-radius-md`
- Author name: `--hq-body-sm` / semibold / accent color
- Timestamp: `--hq-caption` / muted
- Hover: show action bar (reply, react, more) with `--hq-motion-hover`

### Sidebar / Server List

- Server icon: 48px, `--hq-radius-xl` (rounds to circle on hover)
- Active indicator: 4px pill, left edge, accent color
- Channel list item height: 32px
- Category header: `--hq-caption` / uppercase / muted

---

## Layout Rules

### Breakpoints

| Name     | Min Width | Columns | Sidebar |
|----------|-----------|---------|---------|
| Desktop  | 1024px    | 3       | Visible |
| Tablet   | 768px     | 2       | Collapsible overlay |
| Mobile   | 0px       | 1       | Hidden (drawer) |

### Desktop Layout (≥ 1024px)

```
┌──────────┬────────────────┬──────────────┐
│ Server   │  Channel /     │  Member      │
│ rail     │  Chat area     │  sidebar     │
│ (72px)   │  (flex-1)      │  (240px)     │
└──────────┴────────────────┴──────────────┘
```

### Tablet Layout (768px – 1023px)

- Server rail + channel list collapse into a hamburger overlay.
- Member sidebar hidden; accessible via icon toggle.

### Mobile Layout (< 768px)

- Single-column view: chat fills the screen.
- Server and channel navigation via bottom sheet or swipe gesture.
- Compose bar pins to the bottom.

---

## Accessibility

- **Contrast:** All text meets WCAG 2.1 AA (4.5:1 body, 3:1 large text).
- **Focus indicators:** 2px solid `--hq-accent-400` outline with 2px offset on all interactive elements.
- **Keyboard navigation:** Full keyboard support. `Tab` for focus order, `Escape` to close overlays, `Arrow keys` for lists.
- **Screen readers:** All icons have `aria-label`. Live regions (`aria-live="polite"`) announce new messages.
- **Reduced motion:** Animations respect `prefers-reduced-motion`.
- **Color independence:** Status indicators use both color and shape (filled circle, half-moon, minus, hollow circle).
