# Contributing to Kinetik

Thanks for helping out. This guide covers how the repo is laid out, how to try a change, the code
conventions, and how to send a pull request.

## Contents

- [Ways to contribute](#ways-to-contribute)
- [How this repo works](#how-this-repo-works)
- [Set up a playground](#set-up-a-playground)
- [Making a change](#making-a-change)
- [Code conventions](#code-conventions)
- [Adding a new component](#adding-a-new-component)
- [Sending a pull request](#sending-a-pull-request)
- [Reporting bugs](#reporting-bugs)

---

## Ways to contribute

| You want to | Do this |
| --- | --- |
| Report a bug | [Open an issue](https://github.com/GOURAVSINGH19/kinetik-free/issues/new) (see [Reporting bugs](#reporting-bugs)) |
| Fix a bug or typo | Send a pull request straight away |
| Improve an existing component | Open an issue first if it changes the props or the look; small fixes can go straight to a PR |
| Propose a new component | Open an issue with a short description and, ideally, a sketch or video. Wait for a thumbs up before building it |
| Improve the docs | Send a pull request |

Kinetik Pro components are not in this repo, so changes to them can't be accepted here. If you find a
bug in one, an issue is still welcome.

---

## How this repo works

Kinetik is source code you copy, not a package you install, so this repo has no build step and no
`package.json`. It holds the files that the shadcn CLI and the docs site hand out:

```
components/          Every free component
  segmented-nav.tsx    Small components are a single file
  menubar/             Larger ones are a folder
    index.tsx            Re-exports the public API
    menubar.tsx          The main component
    types.ts             Props, types and motion constants
    ...                  Sub-parts and hooks
lib/utils.ts         The cn() helper
styles/tokens.css    Design tokens (colours, radii, shadows) as --ui-* CSS variables
public/previews/     Screenshots used in the README
```

The docs site at [kinetikui.vercel.app](https://kinetikui.vercel.app) is built from the main Kinetik
source. When a pull request here is merged, the maintainer applies the same change there so it reaches
the docs and the shadcn registry too.

---

## Set up a playground

Because the repo has no app of its own, test your change inside a small Next.js app.

1. **Fork and clone** this repo:

   ```bash
   git clone https://github.com/<your-username>/kinetik-free.git
   ```

2. **Create a playground** next to it, with Tailwind CSS v4 and the `@/` import alias:

   ```bash
   npx create-next-app@latest kinetik-playground --typescript --tailwind --app --import-alias "@/*"
   ```

3. **Install the shared packages** the components use:

   ```bash
   cd kinetik-playground
   npm install clsx tailwind-merge framer-motion lucide-react class-variance-authority
   ```

   Some components need more (Radix UI, Hugeicons, `border-beam`). Check the imports at the top of the
   component you are working on and install what's missing.

4. **Link the source** so edits in the clone show up in the playground right away. From the playground
   folder, replace its `components` and `lib` folders with links to the clone:

   ```bash
   # macOS / Linux
   ln -s ../kinetik-free/components components
   ln -s ../kinetik-free/lib lib
   ```

   ```powershell
   # Windows (PowerShell)
   New-Item -ItemType Junction -Path components -Target ..\kinetik-free\components
   New-Item -ItemType Junction -Path lib -Target ..\kinetik-free\lib
   ```

   If your playground uses a `src/` folder, create the links inside `src/` instead.

5. **Load the design tokens.** Add these lines to `app/globals.css`, below the Tailwind import. The
   `@source` line makes Tailwind scan the linked components for class names:

   ```css
   @import "../../kinetik-free/styles/tokens.css";
   @source "../../kinetik-free/components";
   ```

6. **Render the component** in `app/page.tsx` and run `npm run dev`.

---

## Making a change

1. Create a branch from `main` with a short, descriptive name, e.g. `fix/menubar-focus` or
   `feat/sliding-tabs-vertical`.
2. Make your change in `components/`, `lib/` or `styles/`.
3. Check it in the playground:
   - in light **and** dark mode
   - with the keyboard only (Tab, Shift+Tab, Enter, Escape, arrow keys where it makes sense)
   - with reduced motion turned on in your OS settings
   - at a phone width (around 375px)
4. Make sure the playground has no TypeScript errors (`npx tsc --noEmit`) and no console warnings.
5. Commit with a clear message, e.g. `Fix menubar losing focus after closing a submenu`.

---

## Code conventions

Match the code around you. In particular:

**Files and structure**
- Small components are one `kebab-case.tsx` file. Once a component needs sub-parts or hooks, make it a
  folder with an `index.tsx` that re-exports its public API, and keep types in `types.ts`.
- Mark files that use state, effects or event handlers with `"use client"` at the top.
- Prefer named exports (`export function Menubar`) over default exports.

**Imports**
- Import shared code with the `@/` alias: `import { cn } from "@/lib/utils"` and
  `import { Button } from "@/components/button/button"`.
- Inside a component folder, use relative imports (`./types`).
- Don't add a new npm dependency without discussing it in an issue first. Every package becomes a
  dependency for everyone who installs the component.

**Styling**
- Style with Tailwind classes and merge `className` props through `cn()`.
- Use the design tokens (`var(--ui-...)`) for colours, radii and shadows instead of hard-coded values, so
  components follow the theme and work in dark mode.
- Accept a `className` prop on the root element so people can adjust layout.

**Motion**
- Use `framer-motion` for animation. Keep durations short and prefer springs for things the user touches.
- Respect `prefers-reduced-motion`: use `useReducedMotion()` from `framer-motion` and drop or shorten
  movement when it's on.

**Accessibility**
- Use real elements (`button`, `a`, `input`) or the right ARIA roles.
- Everything you can do with a mouse should work with the keyboard, with a visible focus style.
- Give icon-only buttons an `aria-label`.

**TypeScript**
- Type every prop and document non-obvious ones with a short `/** ... */` comment; these show up in
  editors.
- Avoid `any`.

**Formatting**
- Two-space indentation, double quotes, and no semicolons at the end of statements.
- Use LF line endings.

---

## Adding a new component

Please open an issue first. Once it's agreed:

1. Add it under `components/`, following the structure and conventions above.
2. Keep the public API small: sensible defaults, a `className` prop, and props for the things people
   will actually want to change.
3. Add it to the right group in the [README](./README.md#-components).
4. In the pull request, include a short screen recording or GIF of it in light and dark mode.

The maintainer will add the docs page and the shadcn registry entry when it's merged.

---

## Sending a pull request

1. Push your branch to your fork and open a pull request against `main`.
2. In the description, say:
   - **what** changed and **why** (link the issue if there is one)
   - **how** you tested it
   - a **screenshot or recording** for anything visual
3. Keep each pull request to one fix or feature. Smaller PRs get reviewed faster.
4. Be ready for a round of feedback. If a change is requested, push new commits to the same branch.

---

## Reporting bugs

A good bug report gets fixed much faster. Please include:

- the component and the version or date you copied it
- what you expected to happen, and what happened instead
- steps to reproduce it, ideally a small code sample or a CodeSandbox / StackBlitz link
- your browser and OS
- a screenshot or recording if it's visual

---

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
