# Clock Redesign + Username Widget (Revised)

## Summary of Changes from Your Feedback

- ❌ No orange/amber color — clock text matches the page foreground color
- ✅ All three clock types show seconds on the landing page
- ✅ Three clock types: **Casio**, **Digital**, **Flip**

## Clock Type Designs

| Type | Style | Seconds |
|------|-------|---------|
| **Casio** | Clean segmented digits, no box/case. Like image 1 but with seconds. `HH:MM:SS` all same size | Same size as HH:MM |
| **Digital** | Bold modern digits. Like image 2. `HH:MM` large, `:SS` small to the upper-right | Smaller, upper-right |
| **Flip** | Split-flap cards. Three card pairs for `HH`, `MM`, `SS` | Same size as HH:MM |

## Clock Behavior

- **Landing page:** Shows whichever clock style is selected in Settings (all three are available). On **hover**, transitions to Casio style. On **click**, docks into dashboard.
- **Header (dashboard):** Always shows simple **Casio-style** digits — never flip cards.

## Proposed Changes

### [MODIFY] [flipclock.js](file:///c:/GhoshCode%20Workspace/Cool%20Startup%20Page/js/flipclock.js)

- **Casio builder:** Update to include `HH:MM:SS` (currently `HH:MM` only). All digits same size.
- **Hover behavior:** On `mouseenter`, crossfade the landing clock to Casio style in-place (not dock).
- **Click behavior:** Opens dashboard (dock) as before.
- **Header mini clock:** Stays as Casio (no change).

### [MODIFY] [style.css](file:///c:/GhoshCode%20Workspace/Cool%20Startup%20Page/css/style.css)

- `.dg-skin-led` (Casio): Remove orange color. Use `var(--foreground)` to match page text. Remove the `.casio` box wrapper (border, background). Keep it clean bare digits only.
- Ensure all three styles have proper sizing for landing (`fc-lg`) with seconds.

### Username Widget

> [!NOTE]
> Already fully implemented. Settings → Widgets has Display Name (with 🗑 delete) and GitHub Username (with 🗑 delete). The header greeting shows Display Name, falling back to GitHub username. **No changes needed.**

## Verification Plan

### Manual Verification
1. All three clock types show `HH:MM:SS` on the landing page
2. Clock text color matches page foreground (no orange)
3. Casio: clean digits, no surrounding box
4. Digital: bold digits with small seconds to the upper-right
5. Flip: three card pairs with seconds
6. Hover on landing clock → transitions to Casio
7. Click → docks into dashboard
8. Header always shows Casio-style mini clock
