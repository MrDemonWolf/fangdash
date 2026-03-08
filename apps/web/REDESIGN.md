# FangDash — Google Stitch Redesign Prompts

## Context
FangDash is a multiplayer endless runner game for Twitch streamers. Players race as wolves, dodge obstacles, and compete for scores. Current design is dark navy/cyan cyberpunk. These prompts cover every major screen for a full UI redesign via Google Stitch.

---

## Prompt 1 — Home / Landing Page

```
Design a dark gaming landing page for "FangDash," a multiplayer endless runner game for Twitch streamers. Players race as wolves.

Layout:
- Sticky top navigation bar with logo on the left ("FangDash" wordmark with a wolf paw icon), nav links in the center (Play, Race, Leaderboard, Skins, Achievements), and a "Sign In with Twitch" button on the right
- Full-viewport hero section with a pixel-art forest scrolling background (dark trees, hills, sky layers), large headline "Run. Race. Dominate." with a glowing subheading, and two CTA buttons: a primary "Play Now" button and a secondary "Sign In to Save Progress" button
- A 4-column features grid below the hero: cards for "Solo Play," "Multiplayer Racing," "Wolf Skins," and "Achievements" — each with an icon, title, and 1-sentence description
- A stats bar showing live numbers: Total Players, Races Run, Top Score
- A dark footer with GitHub link and copyright

Style:
- Color palette: deep navy #091533 background, electric cyan #0FACED as primary accent, pure white text, orange #FF6B2B for highlights
- Buttons: solid cyan with dark text for primary; outlined cyan for secondary
- Cards: dark navy with subtle cyan border glow, rounded-xl corners
- Typography: bold sans-serif headings, regular body text, monospace for stat numbers
- Pixel-art aesthetic with modern card-based layout
- Subtle glow and neon effects on interactive elements
- Mobile responsive
```

---

## Prompt 2 — Solo Play Page (Game Canvas + HUD)

```
Design a full-screen game page for "FangDash," a 2D endless runner.

Layout:
- Full-viewport dark canvas area (the game renders here — show a placeholder dark rectangle)
- Top-left HUD overlay showing: Score (large monospace number with cyan glow, labeled "SCORE"), Distance in meters, and elapsed Time — all in small uppercase labels above white numbers
- Top-right HUD: Mute/unmute speaker icon button and a volume slider, plus a settings gear icon
- Bottom-center: A countdown overlay (large number "3" then "2" then "1" then "GO!") shown before the game starts, with a glowing pulsing effect

Game Over Modal (shown over dark blurred backdrop):
- Centered modal card with "GAME OVER" title in orange glow
- Stats grid: Final Score, Distance, Obstacles Avoided, Time Survived
- "Play Again" primary button and "Back to Home" text link
- Optional achievement unlock notification badge at the bottom

Style:
- Dark background #0f0f1a for game area
- HUD text: white with monospace font, uppercase tiny labels in gray
- Modal: dark navy #091533 card with cyan border, scanline texture overlay for retro feel
- Glow effects on Score number and Game Over heading
- Minimal HUD to avoid obscuring gameplay
```

---

## Prompt 3 — Race Lobby Page

```
Design a multiplayer lobby page for "FangDash," where players create or join a race room.

Layout:
- Centered content within a dark page (same navy background as the rest of the app)
- Page heading: "Race Mode" with a small lightning bolt icon
- Two large cards side by side:
  1. "Create Room" card: a single "Create Race" button that generates a room code; shows the 6-character room code in a monospace display box with a copy icon after creation
  2. "Join Room" card: six individual single-character input boxes in a row for entering the room code, followed by a "Join Race" button
- Below the cards: a small note "Share your room code with friends to race together"
- If not signed in: a banner at the top saying "Sign in to save your race results" with a Twitch login button

Style:
- Same dark navy/cyan theme as the rest of the app
- Room code display: large monospace font, uppercase, letter-spaced, cyan border box
- Single-character inputs: square boxes, monospace, uppercase, cyan focus ring
- Cards: dark navy bg with subtle cyan border glow
- Clean, minimal layout centered vertically and horizontally on the page
```

---

## Prompt 4 — Multiplayer Race Page

```
Design an active multiplayer race page for "FangDash."

Layout:
- Full-screen game canvas (same as solo play — dark placeholder rectangle)
- Top HUD showing:
  - Left: Your Score and Distance
  - Center: Race position indicator "1st / 4 Players" with a small trophy icon
  - Right: Connected players mini-list (avatars + usernames + their scores, live updating)
- Bottom: A thin horizontal "ghost player" status bar showing all race participants as small wolf icons along a progress track
- On race end: A "Race Results" modal with final standings table (Rank, Username, Score, Distance), medals for top 3, and "Play Again" and "Back to Lobby" buttons

Style:
- HUD darker and more compact than solo mode to show more info
- Player position badges: gold for 1st, silver for 2nd, bronze for 3rd, gray for others
- Results modal: dark navy card with gradient header showing winner info prominently
- Live player list: small avatar circles with colored dot for connection status
```

---

## Prompt 5 — Profile Page

```
Design a user profile page for "FangDash."

Layout:
- Top profile header card: user's Twitch avatar (circular, with a cyan ring), display name in large bold text, email/username in small gray text, and their equipped wolf skin shown as a small pixelated sprite badge
- Stats grid (2x2 or 4 across): Games Played, High Score, Total Races, Races Won — each in a dark card with a large monospace number and a small label
- "Recent Achievements" section: a row of 5 achievement badge icons with names below, showing locked vs unlocked states
- "Recent Scores" section: a compact table with Date, Score, Distance columns, last 10 entries, with the highest score row highlighted in cyan

Style:
- Same dark navy/cyan palette
- Avatar: circular with subtle cyan drop shadow glow
- Stat cards: dark navy with cyan accent top border
- Achievement badges: colored when unlocked, grayscale + 40% opacity when locked
- Compact table with alternating subtle row backgrounds
- Responsive: profile header stacks vertically on mobile
```

---

## Prompt 6 — Leaderboard Page

```
Design a leaderboard page for "FangDash."

Layout:
- Page heading "Leaderboard" with a trophy icon
- Three tab buttons at the top: "Daily," "Weekly," "All Time"
- Desktop: Full-width table with columns: Rank, Player (avatar + username), Score, Distance, Date
- Mobile: Stacked cards, one per player, showing the same info
- Top 3 rows highlighted: gold background tint for #1, silver for #2, bronze for #3, with matching rank badge icons (crown, medal, medal)
- Current signed-in user's row highlighted with a cyan left border and subtle cyan background tint
- Pagination or "Load More" button at the bottom

Style:
- Dark navy table with subtle row hover state
- Rank badges: circular icon, gold/silver/bronze colors for top 3, plain number for the rest
- Monospace font for Score and Distance numbers
- Tabs: inactive = ghost style, active = cyan underline + text
- Avatar: small circular images with username next to them
```

---

## Prompt 7 — Skins Gallery Page

```
Design a wolf skins gallery page for "FangDash."

Layout:
- Page heading "Wolf Skins" with a paw print icon
- Responsive grid of skin cards (3 columns on desktop, 2 on tablet, 1 on mobile)
- Each skin card contains:
  - A pixelated wolf sprite preview (centered in a dark square)
  - Skin name in bold
  - A rarity badge (Common = gray, Uncommon = green, Rare = blue, Epic = purple, Legendary = yellow/gold)
  - Unlock condition text in small gray text (e.g., "Reach 5,000 points")
  - An "Equip" button if unlocked, or a locked padlock icon + condition if not

Style:
- Skin cards: dark navy bg, rounded-xl, subtle border. Border color matches rarity (gray/green/blue/purple/gold)
- Equipped skin: card has a bright cyan glow border and "Equipped" badge in top-right corner
- Locked skins: dimmed overlay, padlock icon
- Rarity badge: small pill/chip in top-left of card, colored by rarity
- Pixelated sprite rendering (crisp pixel art, no blur)
- Hover state: card lifts slightly with enhanced glow
```

---

## Prompt 8 — Achievements Page

```
Design an achievements page for "FangDash."

Layout:
- Page heading "Achievements" with a star icon
- Category filter tabs: All, Score, Distance, Games, Skill, Social
- Grid of achievement cards (3 columns desktop, 2 tablet, 1 mobile)
- Each achievement card contains:
  - An icon or emoji representing the achievement
  - Achievement name in bold
  - A category badge (color-coded by category)
  - Description/condition in small gray text (e.g., "Score 10,000 points in a single run")
  - Unlock date in tiny text if unlocked
  - A skin reward badge if the achievement unlocks a skin
  - Locked vs unlocked visual state

Style:
- Unlocked cards: full color, bright border, name in white
- Locked cards: grayscale icon, dimmed text, subtle lock overlay
- Category badges: small colored pills (Score = orange, Distance = green, Games = blue, Skill = purple, Social = pink)
- Skin reward tag: small gold badge "Unlocks: Wolf Skin Name"
- Category tabs: inactive ghost style, active cyan underline and text
- Consistent dark navy card style with glow on unlocked achievements
```

---

## Prompt 9 — Pause Menu (In-Game Overlay)

```
Design an in-game pause menu overlay for "FangDash."

Layout:
- Full-screen dark semi-transparent backdrop blurring the game behind it
- A centered panel with two columns:
  - Left: vertical tab list with icons — Audio, Skins, Stats, Leaderboard, Controls, Quit
  - Right: content panel that changes based on selected tab
- Tab content examples:
  - Audio: mute toggle switch + master volume slider labeled "Volume"
  - Skins: horizontal scrollable row of skin thumbnails, click to equip, shows "Equipped" badge on current
  - Stats: simple stats list (Games Played, High Score, Total Distance)
  - Controls: a two-column list of key bindings (Action + Key), e.g., "Jump = Space / Up Arrow"
  - Quit: centered confirmation "Return to Home?" with Yes and No buttons

Style:
- Panel: dark navy #091533 with cyan border, ~700px wide centered
- Tab list: left sidebar style, inactive = white/40 text, active = cyan text + left accent bar
- Content area: clean, minimal, consistent padding
- No visual clutter — the pause menu should feel focused and calm vs the fast-paced game
- "Resume" button prominently at the top of the left sidebar
```

---

## Usage Notes for Google Stitch
- Paste each numbered prompt as its own separate screen/frame
- If Stitch asks for a theme, specify "dark mode"
- The hex color values (#091533, #0FACED, #FF6B2B) are included in each prompt for accuracy
- If Stitch asks for style keywords: "retro pixel art meets modern glassmorphism gaming UI"
- Screens to prioritize first: Home, Play (Game HUD), Leaderboard, Profile
