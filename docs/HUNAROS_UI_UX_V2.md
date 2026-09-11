# HunarOS v2.1 - UI/UX Requirements and Design System

**Target:** Google AI Studio
**Product:** HunarOS
**Version:** 2.1
**Status:** UX/UI baseline

## 1. UX North Star

HunarOS is an operational tool used repeatedly by staff for fast, accurate data entry and review. The interface must optimize for:
- clarity;
- speed;
- low cognitive load;
- safe actions;
- information density without visual clutter;
- mobile usability;
- predictable interaction patterns.

## 2. Visual Direction

Use a **Swiss-Minimal / flat / grid-disciplined** visual language.
Avoid:
- glassmorphism;
- excessive gradients;
- neumorphism;
- decorative 3D elements;
- oversized card decoration;
- excessive rounded surfaces;
- emoji as interface icons;
- visual effects that reduce readability or performance.

## 2A. HubSpot-Inspired Product Design Direction

Visual & interaction patterns:
- Clean, structured workspaces with clear page headers.
- Contextual action placement and dense operational layouts.
- Clear status badges with readable text and semantic colors (never color-only).
- Consistent forms with clear labels and error feedback.
- Accessible contrast and keyboard ergonomics.

## 3. Typography & Color System

- Primary UI typeface: Inter or IBM Plex Sans.
- Dense numeric & financial data: JetBrains Mono or IBM Plex Mono.
- Neutrals: Crisp slate/gray surfaces with high contrast.
- Semantic accents: Emerald/Green (success/income), Rose/Red (danger/expense), Amber (warning/at-risk), Indigo/Blue (primary action/info).

## 4. Components & Patterns

- Real SVG icons via Lucide React (no emojis as UI buttons).
- Breadcrumbs, global organization selector, top context bar.
- Status badges: neutral, info, success, warning, danger.
- Responsive mobile drawer / desktop sidebar.
- Accessible modals, drawers, confirmation dialogs for high-impact actions.
- Empty states with actionable next steps, skeletons for loading, structured error displays with retry actions.
