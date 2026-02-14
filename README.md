The backend of this project is designed as a High-Scale Ingestion Engine that follows the Lambda Architecture principles—separating real-time updates from long-term analytical storage.

1. The "Smart Front Door" (Polymorphic Ingestion)
Imagine a single delivery window at a warehouse that can handle both heavy crates (Smart Meters) and small envelopes (Electric Vehicles).

One Entry Point: Instead of building ten different routes, we have one "Ingestion Layer".

Identification: When data arrives, the backend looks at the "label". If it sees a meterId, it follows the logic for electricity from the grid. If it sees a vehicleId, it follows the logic for the car’s battery.

2. The "Dual-Path" Storage Strategy
We don't put everything in one giant pile. That would make finding anything impossible once you have 14 million records a day. We split the data into two paths:

The Live Path (The "Now" Folder):

Logic: We use a trick called an UPSERT.

How it works: If Car A sends its battery status at 10:01 PM, we update its record. When it sends a new update at 10:02 PM, we don't add a new line; we just overwrite the old battery percentage. This keeps the dashboard fast because it only ever has to look at 10,000 records to see the current status of the whole fleet.

The History Path (The "Forever" Archive):

Logic: This is Append-only (INSERT).

How it works: We save every single heartbeat here. We never delete or update these. This builds an "audit trail" so we can look back and see how a car performed three weeks ago.

3. The "Efficiency" Calculation (The Analytics)
The backend's most important job is to spot "Energy Leakage". It compares two numbers:

AC Consumed: What the grid sent to the charger.

DC Delivered: What actually made it into the car’s battery.

Because of heat and conversion, you always lose a little power, but if the Efficiency Ratio (DC / AC) drops below 85%, the backend flags it as a hardware fault.
