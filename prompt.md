I asked chatgpt he said this
can leaflet read the exact address of each house on philippines? and ill just use googlemap with their written address to navigate the riders?

Short answer: No — Leaflet cannot reliably read the exact address of each house in the Philippines.
And your idea (Leaflet for pin + Google Maps for navigation) is actually the correct approach used in real apps.

1. What Leaflet + OpenStreetMap can (and cannot) do
What it CAN do:
Show maps
Let users drop a pin (lat/lng)
Reverse geocode to a general address
What it CANNOT reliably do:
Exact house-level addresses (especially in PH)
Unit numbers, subdivisions, informal areas
Consistent, accurate addressing across all regions

Reason:

OpenStreetMap data in the Philippines is incomplete and inconsistent
Many houses are not mapped individually
2. Why this matters for your system

If you rely on OSM address:

You will get:
Missing house numbers
Wrong street names
Generic locations

So: Do NOT rely on it as your primary address

3. Best Practice (What you SHOULD do)
Use a hybrid system:
1. Leaflet (for accuracy)
User drops pin → this is your source of truth
Used for:
Distance calculation (OSRM)
Pricing
Delivery logic
2. User input (for clarity)
User types:
House number
Street
Landmark

This is for human readability only

4. Using Google Maps for rider navigation

Yes — this is exactly right.

You can open navigation using coordinates:

const openGoogleMaps = (lat: number, lng: number) => {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    "_blank"
  );
};
Why this is better:
Google Maps is stronger for navigation
Coordinates are more accurate than typed address
Works even if address is messy
5. Pro setup (used by delivery apps)
Customer side:
Picks pin (Leaflet)
Types address (optional but helpful)
Your system:
Saves:
lat/lng (PRIMARY)
address (DISPLAY ONLY)
Rider side:
Opens Google Maps using:
lat/lng (NOT the text address)
Important Warning

Do NOT:

Trust address for routing
Use address for pricing
Assume address is correct

Always:

Trust the pin
Final Answer
Leaflet cannot reliably get exact house addresses in PH
Your plan is correct:
Use Leaflet (pin) for system logic
Use Google Maps (coordinates) for navigation