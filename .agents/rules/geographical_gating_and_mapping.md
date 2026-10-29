# Geographical Gating & Lightweight Vector Mapping Invariants

## 1. Geographic Scoping Invariants
- **Fail-Closed by Default**: If an entity, query, or user assignment has missing or unrecognized geographic metadata, deny access. Never default to 'Nairobi' or 'Mombasa'.
- **Locked Jurisdiction Badges**: Gated roles (Governor, Senator, MP, MCA, Coordinators) must NEVER see an active `<select>` dropdown for their assigned boundary level. Replace the selector with a locked read-only badge (`📍 [Name] 🔒 [Locked]`).
- **Sub-Unit Selectors Only**: Dropdowns may only contain sub-units strictly within the permitted boundary (e.g., Governor can only browse constituencies within their assigned county; MP can only browse wards within their assigned constituency).
- **Access Denied on Cross-Scope Searches**: If a search term or direct lookup matches an out-of-scope entity (station, tally, agent), render an explicit "Access Denied: Out of Assigned Jurisdiction" notice and withhold all data.

## 2. Lightweight Mapping Invariants
- **Zero Server Overhead**: Do not introduce server-side tile rendering or heavy external tile servers. Use client-side SVG / TopoJSON vector geometries.
- **Hierarchical Lazy-Loading**: Load national/county outlines first (~85 KB). Lazy-load constituency and ward vectors on-demand when a county or constituency is drilled down.
- **Offline-First PWA Cache**: All base vector boundaries must be cacheable by the Service Worker for 100% offline usability in polling stations and rural tallying centers.
- **Auto-Framing for Gated Users**: When a scoped user opens the map, automatically zoom and frame directly into their assigned boundary, muting out-of-scope regions.
