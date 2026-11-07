# Changelog

## 1.2.0 – 2026-11-10

First public release. It covers roadmap Phases 0–5.

### Tenants
- Search dorms by name, area, price, gender policy, amenities and vacancy, in a list or on a map.
- Commute search: pick a destination, a travel mode and a time limit to see dorms within reach.
- Dorm pages show photos, room types, a move-in cost calculator, live room status, location and reviews.
- Chat with owners in real time and send booking requests (room type, move-in date, contract length).
- Pay the deposit with a PromptPay QR and attach the transfer slip once the owner holds or confirms a room.
- Get notified when a room type that is full has a vacancy.
- Review a dorm after a confirmed booking, and report suspicious listings.
- Find roommates by province, budget and lifestyle.
- In-app notifications, plus optional LINE notifications.

### Owners
- Create and publish dorms: details, location pin, photos, room types and a floor-by-floor room map.
- Answer booking requests in chat: hold a room for 24–72 hours, confirm or decline. Holds expire automatically.
- Booking settings: a PromptPay id for deposits and an optional AI assistant that answers while the owner is away.
- Insights: page views, chat-to-booking rate, occupancy, and price compared with nearby dorms.
- Owner verification with a Verified badge.

### Accounts and admin
- Sign up with email or Google, as a tenant or an owner. Includes password reset, resend verification, light and dark theme, a data export and account deletion.
- An admin panel for verification requests, reports and taking listings offline.

### Configuration
- Optional keys in `.env.example`: `SUPABASE_SECRET_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `LINE_BOT_BASIC_ID` and `ANTHROPIC_API_KEY`. Without them, LINE and the AI assistant stay off and the rest works.
