# lifelog
PWA for logging life for later analysis or studies for patterns learning or sheduling enhancement

A minimal Progressive Web App (PWA) for quick daily check-ins.

Requirements:
- Mobile-first, extremely simple UI
- Single-page app (no routing)
- Works offline (use service worker + localStorage or IndexedDB)

Core Features:
1. Quick log entry (under 10 seconds):
   - Auto timestamp
   - "Planned" (short text, optional)
   - "Actual" (short text)
   - "State" (1-2 words, optional)

2. Save and display entries:
   - Show most recent entries first
   - Display timestamp clearly
   - Clean, minimal layout

3. Time awareness:
   - Show "Last entry: X hours ago"
   - No streaks, no gamification, no pressure messages

4. Gap-friendly:
   - Allow simple "catch-up" entries (no validation rules)

5. Export:
   - Allow exporting the accumulated data into a useable format that's easy to use in other software, like json or csv

Technical Constraints:
- Use plain HTML, CSS, and JavaScript (no frameworks)
- Keep code under ~300 lines if possible
- No authentication, no backend
- Store all data locally

PWA Requirements:
- Manifest file
- Service worker for offline use
- Installable on mobile

Design:
- Very minimal, calm colors
- No clutter
- Optimized for low mental effort

Output:
- Include instructions to run locally and deploy easily
