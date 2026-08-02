I'm getting multiple errors in my Vite + React + TypeScript + Ionic + React-Leaflet project.

Here are the logs:

[VITE ERROR - 500]
Failed to load resource: the server responded with a status of 500 (Internal Server Error)

[HMR ERROR]
[hmr] Failed to reload /src/pages/customer/Cart.tsx.
This could be due to syntax errors or importing non-existent modules.

[HMR ERROR]
[hmr] Failed to reload /src/pages/customer/OrderTracking.tsx.
This could be due to syntax errors or importing non-existent modules.

[LEAFLET RUNTIME ERROR]
Uncaught TypeError: Cannot read properties of undefined (reading 'appendChild')
    at NewClass._initContainer
    at NewClass.onAdd
    at NewClass._layerAdd
    at NewClass.whenReady
    at NewClass.addLayer
    at addLayer (react-leaflet)

[REACT ERROR]
An error occurred in the <ForwardRef(LeafComponent)> component.
Consider adding an error boundary.

[SECOND LEAFLET ERROR]
Uncaught TypeError: Cannot read properties of undefined (reading 'appendChild')
    at NewClass._initIcon
    at NewClass.onAdd
    at NewClass._layerAdd
    at NewClass.whenReady
    at NewClass.addLayer

Tech stack:
- Vite
- React + TypeScript
- Ionic React
- React-Leaflet
- Firebase

Problem:
- Pages like Cart.tsx and OrderTracking.tsx fail with 500 error
- Hot reload keeps failing
- Leaflet map crashes with appendChild undefined error

What I need:
- Find root cause of 500 error
- Fix React-Leaflet crash properly
- Ensure compatibility with Ionic layout
- Provide corrected code if needed

Assume the issue is caused by:
- improper Leaflet mounting
- missing container height
- invalid marker/icon setup
- or rendering before DOM is ready

Give a step-by-step fix and corrected code.