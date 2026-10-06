# Radio Trucker — Game Design Document (Draft v0.2)

> Working title. All names (game, "Likes", characters) are placeholders.

## 1. Pitch

You are a truck driver who finds work by listening to the radio. Tune the dial, catch a signal, and decide: **drive to the job, rebroadcast the tip, or ignore it.**

Every tip you rebroadcast earns **Likes**, and Likes extend your radio's reach. But sharing a tip means other drivers hear it too, and they take most of the cargo before you get there.

**Core dilemma:** *Sharing makes your radio stronger, but leaves less work for you.*

## 2. Target Experience

- **Platforms:** mobile and PC.
- **Session length:** ~15 minutes on mobile; on PC, a game you alt-tab to while doing something else.
- **Input:** clicks/taps only.
- **Tone:** cozy, lonely, late-night road atmosphere. No fail state; the world keeps going at your pace.
- **Multiplayer:** asynchronous by default.

## 3. Core Loop

1. **Tune** — turn the radio dial to find a signal through the static.
2. **Listen** — hear the transmission and judge its quality and reliability.
3. **Decide:**
   - **Go** — drive to the location, load cargo, deliver, get paid.
   - **Rebroadcast** — share the tip, earn Likes, but the available cargo at that location drops sharply.
   - **Ignore** — let it pass.
4. **Progress** — spend money on the truck and radio gear; spend Likes on range.
5. Repeat.

## 4. Choices and Their Costs

| Choice | Gain | Cost |
|---|---|---|
| **Go** | Money from delivered cargo | Fuel, travel time |
| **Rebroadcast** | Likes (more radio range) | Cargo available at that location drops by a large amount; other drivers take it |
| **Ignore** | Nothing | Nothing; the opportunity is lost |

- **Fuel cost is the same** whether or not the tip was rebroadcast. Rebroadcasting only shrinks the cargo, so a shared tip can turn a profitable trip into a bad one.
- **Rebroadcast then go?** Allowed, but you arrive to a smaller load. The player must decide if the Likes are worth the reduced pay.
- **Bad tips:** some signals are outdated, exaggerated, or scams. Each rebroadcast collects a pool of likes and unlikes from other drivers; the player gains `likes − unlikes` only when it is positive. A bad tip draws mostly unlikes, so it earns nothing, but a rebroadcast never takes Likes away. Careful listening is a skill.

## 5. Radio and Tuning

Tuning is the main physical interaction.

### 5.1 The Dial
- The player drags a radio dial (knob or slider) across the band.
- Signals appear as a peak through static: audio clears and a signal meter rises as you approach the right frequency.
- Fine-tuning improves clarity; a poorly tuned signal may lose parts of the message (location, cargo type, pay).

### 5.2 Real Radio Limits
The radio follows real-world constraints. Each one is a reason to upgrade and a factor in each decision.

- **Battery / power supply**
  - Transmitting and receiving draw current. A battery that can't supply enough amperes gives weak reception and short rebroadcast range.
  - Long listening sessions drain the battery; the engine recharges it while driving.
- **Antenna**
  - Different antennas suit different bands and ranges (short local whip vs. long-range antenna).
  - Wrong antenna for a band = weak or no signal on that band.
- **Bands**
  - Separate bands with different purposes (e.g., local chatter, long-distance traffic, weather, special/rare channels).
  - New bands unlock with better gear.
- **Time of day**
  - Signal propagation changes with the hour. Some bands carry farther at night; others are best during the day.
  - Different people broadcast at different hours (morning dispatchers, night owls, late-night mystery broadcasts).
  - Businesses have opening hours, so a tip heard at night may only be useful in the morning.
- **Terrain and weather**
  - Mountains, cities, and storms add static and reduce range.
- **Interference**
  - Crowded areas have overlapping signals that need finer tuning.

## 6. Progression

There is **no fail state**. Like Stardew Valley, a player who plays poorly simply progresses slowly; they can always keep going.

### 6.1 Money (from deliveries)
- **Radio gear:** batteries with higher amperage, antennas for specific bands and ranges, decoders, filters to cut static.
- **Truck:** bigger fuel tank, higher cargo capacity, better fuel efficiency.
- **Licenses:** special cargo types (fragile, refrigerated, hazardous) that pay more.

### 6.2 Likes (from rebroadcasting)
- A rebroadcast earns `likes − unlikes` from its reaction pool when that is positive, and nothing otherwise. The Likes total never goes down.
- Increase the radio's base range, letting you hear farther signals and new regions.
- Reputation: high Likes make other drivers more likely to share good tips with you.

### 6.3 World
- New map regions open as range grows.
- New bands and broadcasters open as gear improves.

## 7. Characters

Recurring voices give players a reason to return beyond the economy. Each has a schedule, a band, and a small story arc.

- **The Truck Stop Waitress** — works at the central truck stop. Kind, knows everyone, passes along gossip and the occasional good tip. A home base presence.
- **The Dispatcher** — morning voice with reliable but low-paying jobs.
- **The Rival Driver** — competes for the same jobs; sometimes helps, sometimes takes your cargo.
- **The Scammer** — sends tips too good to be true.
- **The Late-Night Broadcaster** — appears only at night on a hard-to-reach band. Starts a light mystery thread.

*(More characters to define.)*

## 8. Session and Real-Time Design

- **Real-time travel:** the truck drives while the player is away. Trips take real minutes or hours.
- **Signals while away:** broadcasts keep arriving during trips; the player checks in when they want.
- **Signal log:** missed broadcasts can be replayed from a log (like a "say again" feature), though some details may degrade over time and the cargo may already be gone.
- **Shifts:** a session can be framed as one shift with a clear start and end, fitting a 15-minute mobile session.
- **Notifications (mobile):** optional alerts for arrivals, strong signals, and character broadcasts.
- **PC alt-tab mode:** compact window, audio cues for signal peaks and arrivals.

## 9. Asynchronous Multiplayer

Async is the default mode.

- **Real player broadcasts:** when a player rebroadcasts a tip, it can appear in other players' radios as a signal.
- **Likes from real players:** players who act on your broadcast give you Likes.
- **Cargo competition:** a rebroadcast tip loses cargo as other drivers (players and NPCs) take it.
- **NPC fill:** NPC drivers keep the world alive when few players are online, so the Likes economy and competition always work.
- **Safety:** broadcasts use structured content (location, cargo, pay, chosen phrases) instead of free text to avoid moderation problems.

## 10. Audio and Presentation

- Audio is central: static, tuning sweeps, engine hum, voice clips.
- Voice options to evaluate: full voice acting (costly), short barks plus text, or stylized/processed voice.
- Visual focus: the radio panel and dashboard, with a simple map for routes.

## 11. Open Questions

- Final name for "Likes".
- How much cargo is lost per rebroadcast, and how fast does it disappear?
- Exact real-time trip lengths for mobile vs. PC.
- How real are the radio rules? Accurate simulation vs. simplified "feels right" rules.
- Monetization model (premium, free with cosmetics, etc.).
- Setting: real country/region or fictional map.

## 12. Next Step

Paper or spreadsheet prototype of the core decision: one map, a set of tips (distance, cargo, pay, reliability), fuel costs, and the Go / Rebroadcast / Ignore choice. Validate that the dilemma is interesting before building tuning, audio, or art.
