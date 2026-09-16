# AttendX 300px Mobile & Responsive Design System Guide

This document establishes the UI/UX responsive architecture implemented across AttendX, guaranteeing seamless operation down to **300px width viewports** (compact phones, foldable cover displays, and low-resolution mobile devices) with touch-first accessibility.

---

## 1. Core Principles

1. **Zero Viewport Horizontal Scroll**:
   - The document root (`html`, `body`, `#root`) must never scroll horizontally.
   - Elements with extensive column data (such as data tables, roster lists, or comparison matrixes) must be encapsulated in their own isolated `overflow-x-auto` wrappers.

2. **Touch-First Accessibility (No Hover Gates)**:
   - On desktop, action icons (Edit, Delete, Manage, Unlock) often use `opacity-0 group-hover:opacity-100` for visual cleanliness.
   - On touch devices (smartphones and tablets), hover interactions do not exist. Therefore, all action buttons must use:
     ```html
     className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
     ```
   - This ensures buttons are immediately visible and tappable on touch screens without compromising desktop aesthetics.

3. **Fluid Card Padding**:
   - Fixed large paddings (`p-6` or `p-8`) consume 48px to 64px of space, leaving insufficient room for content on a 300px screen.
   - All standard cards and containers use fluid responsive paddings:
     ```css
     p-3 sm:p-5 md:p-6
     ```

---

## 2. Component Implementation Patterns

### A. Responsive Table Wrappers
Whenever displaying tabular data, wrap the `<table>` element with an explicit horizontal scroll container:

```jsx
<div className="w-full overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/40">
  <table className="w-full min-w-[500px] text-left text-sm text-slate-300">
    <thead className="bg-slate-800/80 text-xs uppercase text-slate-400">
      <tr>
        <th className="px-3 py-2.5 sm:px-4 sm:py-3">Roll No</th>
        <th className="px-3 py-2.5 sm:px-4 sm:py-3">Name</th>
        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-right">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-800">
      {/* rows */}
    </tbody>
  </table>
</div>
```

### B. Header Dropdown Menus & Popups
Dropdown menus (e.g., `ProfileDropdown`, `NotificationCenter`) must never exceed the mobile viewport width:

```jsx
<div className="absolute right-0 mt-2 w-[280px] sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50">
  {/* Menu items */}
</div>
```

### C. Dynamic Camera Viewfinder (`Html5Qrcode`)
In [ScanAttendance.jsx](file:///j:/Programming/MERN%20Projects/AttendX/AttendX/CSIT_AMS/frontend/src/pages/student/ScanAttendance.jsx), the camera scanner bounding box uses dynamic runtime sizing to adapt to the device screen:

```javascript
qrbox: (viewfinderWidth, viewfinderHeight) => {
  const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
  const size = Math.max(160, Math.floor(minEdge * 0.72));
  return { width: size, height: size };
}
```

### D. Multi-Column Stat Cards & Form Grids
Grids must collapse down gracefully:
- **Dashboard Stats**: `grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6`
- **Filter Bars**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **Modal Dialogs**: `w-full max-w-lg mx-2 sm:mx-auto`
- **Action Buttons**: `flex-col sm:flex-row w-full sm:w-auto`

---

## 3. Responsive Breakpoint Standards

| Prefix | Viewport Min-Width | Target Devices |
|---|---|---|
| *None* | `0px – 359px` | Ultra-compact mobiles, Galaxy Z Flip cover screen, 300px test emulation |
| `min-[360px]:` | `360px` | Standard compact smartphones (iPhone SE, Galaxy A-series) |
| `sm:` | `640px` | Large smartphones in landscape, small tablets |
| `md:` | `768px` | Standard tablets (iPad Mini, Surface Duo) |
| `lg:` | `1024px` | Laptops, small desktops |
| `xl:` | `1280px` | Full high-definition monitors |
