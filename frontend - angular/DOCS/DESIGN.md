---
name: Enterprise BPM Design System
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383940'
  surface-container-lowest: '#0d0e14'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#282a31'
  surface-container-highest: '#33343c'
  on-surface: '#e3e1eb'
  on-surface-variant: '#c4c5d5'
  inverse-surface: '#e3e1eb'
  inverse-on-surface: '#2f3037'
  outline: '#8e909f'
  outline-variant: '#444653'
  surface-tint: '#b8c4ff'
  primary: '#b8c4ff'
  on-primary: '#002584'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#3755c3'
  secondary: '#b9c7df'
  on-secondary: '#233144'
  secondary-container: '#3c4a5e'
  on-secondary-container: '#abb9d1'
  tertiary: '#ffb59a'
  on-tertiary: '#5a1b00'
  tertiary-container: '#872d00'
  on-tertiary-container: '#ffa583'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#802a00'
  background: '#12131a'
  on-background: '#e3e1eb'
  surface-variant: '#33343c'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-mono:
    fontFamily: Roboto Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base_unit: 4px
  container_margin: 24px
  gutter: 16px
  stack_sm: 8px
  stack_md: 16px
  stack_lg: 24px
---

## Brand & Style
This design system is engineered for high-density enterprise environments where operational efficiency and clarity are paramount. The brand personality is authoritative, reliable, and invisible; the UI exists to facilitate complex decision-making without adding cognitive load.

The design style follows a **Corporate / Modern** movement, utilizing a structured information hierarchy and a "utility-first" aesthetic. It emphasizes high contrast to ensure readability during long working sessions and relies on a disciplined application of color to signal status and priority within business process management workflows.

## Colors
The palette is anchored by **Deep Blue (#1E40AF)**, used exclusively for primary actions and active states to maintain focus. The UI structure is built on a scale of **Slate Grays**, providing a neutral backdrop that permits semantic colors to stand out.

This system is designed with a **Native Dark Mode** as the primary interface. **Semantic logic is strictly enforced:**
- **Success (#15803D):** Completed tasks and approved stages.
- **Warning (#B45309):** Approaching deadlines or non-blocking issues.
- **Error (#B91C1C):** System failures or validation errors.
- **Critical SLA (#991B1B):** Reserved specifically for breached or near-breach Service Level Agreements to trigger immediate visual urgency.

The system utilizes a fidelity-based color mapping to ensure WCAG 2.1 AA contrast ratios (minimum 4.5:1 for text) are maintained in dark environments.

## Typography
This design system utilizes **Inter** for all UI elements to ensure maximum legibility across different screen densities. Its tall x-height and tight apertures make it ideal for data-heavy BPM dashboards.

Headlines use a tighter letter-spacing for a modern executive look, while labels use an uppercase tracking increase for distinct categorization. For technical metadata or process IDs, use a monospaced font like **Roboto Mono** to distinguish strings of alphanumeric data from standard prose.

## Layout & Spacing
The layout follows a **12-column fluid grid** system optimized for desktop productivity. Content is organized into functional zones: a global navigation sidebar (fixed), a contextual utility bar, and a flexible main workspace.

A strict **4px baseline grid** governs all spacing. Vertical rhythm is maintained through standardized stack spacing:
- **8px (sm):** Related elements (label and input).
- **16px (md):** Elements within a card or section.
- **24px (lg):** Spacing between major layout sections or cards.

Margins are kept at a consistent 24px to ensure the UI feels expansive yet organized.

## Elevation & Depth
Depth is communicated through **Tonal Layering** rather than heavy shadows to maintain a clean, professional profile and prevent visual "muddying" in dark mode.

- **Surface (Level 0):** The main background (Deep Slate).
- **Container (Level 1):** Elevated cards or panels that use slightly lighter hex values to indicate proximity.
- **Overlay (Level 2):** Modals or dropdowns, which utilize a soft, neutral ambient shadow to indicate they sit above the workspace.

Avoid backdrop blurs; use solid fills to ensure the high-contrast requirements for enterprise accessibility are met.

## Shapes
The shape language is disciplined and geometric. All interactive elements—including buttons, input fields, and cards—must use an **8px corner radius**. 

This specific radius provides a "Rounded" professional look that balances the "heavy" nature of a dark-mode enterprise UI with more modern, rounded contours. This consistency reinforces the "contained" nature of modular BPM workflow steps.

## Components
Consistent component behavior is vital for productivity.

- **Buttons:** Primary buttons use Deep Blue (#1E40AF) with white text. Secondary buttons use a Slate-700 border with high-contrast text. Use an 8px radius.
- **Input Fields:** Maintain a 40px height for standard inputs. Use Slate-700 for borders, shifting to Deep Blue on focus.
- **Status Chips:** Use subtle background tints of the semantic colors (e.g., 20% opacity) with high-contrast bold text of the same hue for maximum clarity in dark mode.
- **Data Tables:** High-density rows (32px or 40px height) with subtle dark-scale zebra-striping. Headers must be high-contrast with Label-Caps typography.
- **Workflow Cards:** Feature an 8px radius and a 1px Slate-700 border. Use a left-edge color accent (4px width) to denote the current status or SLA priority.
- **SLA Indicators:** For Critical SLA red (#991B1B), utilize a pulsing dot icon or a high-contrast badge to draw immediate attention.