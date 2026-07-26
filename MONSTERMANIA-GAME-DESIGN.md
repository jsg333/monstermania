# MONSTERMANIA 🟢🍄💥
### Official Game Design Document
**Game designer: Ethan** · Written up with Claude · July 25, 2026
*Version 2 — updated with Ethan's first round of rulings (see the bottom of this doc)*

---

## Hey Ethan — read this part first

Your idea is good. The best thing in it is **Ickio's hole** — a monster you jump *into*. I've never played a platformer that does that, and I've played a lot of them. So this whole design is built around making that the star.

Everything you invented is still in here. I added the missing pieces: **why** you're running, **what** you're trying to reach, and how to make Gogio and Fungy feel different instead of just "bouncy" and "less bouncy."

There are boxes marked **🎨 ETHAN DECIDES** all through this doc. Those are on purpose. Fill them in — you're the designer.

---

## The Big Idea (one sentence)

You can't do anything special — you can only run and jump — so the **monsters are your superpowers**, and every level is a puzzle about which monster to use and when.

## What makes Monstermania special

Most platformers give the player powers: double jump, dash, glide. **Monstermania gives you nothing.** All your moves come from monsters standing in the level. Want to fly high? Find Gogio. Want to cross a huge gap? Dive into Ickio.

That's the rule that makes this game yours. **Monsters aren't enemies. Monsters are your moves.**

---

## The Monsters 🟢

### Ickio — the Hole Monster ⭐ THE STAR

Vibrant lime green. He has a hole in him you can actually see. You jump in.

**Here's the big upgrade:** Ickios come in **matching pairs**. Two lime Ickios in a level are connected. Dive into one, shoot out of the other.

And the most important rule in the whole game:

> **Ickio does NOT slow you down. He burps you out just as fast as you went in.**

That means if you fall a LONG way into an Ickio, you come rocketing out the other one. Fall from high up → launch super far. That's the trick great players will practice for hours. That one rule is worth more than ten new monsters.

Later levels can have **other colors** of Ickio — an orange pair, a purple pair — so you have to pick the right hole.

| Ickio type | What he does | Show up in |
|---|---|---|
| Lime Ickio (normal) | Standard linked pair | World 1 |
| Colored Ickios | Multiple pairs, pick the right one | World 2 |
| Sleepy Ickio | His hole opens and closes — time it! | World 3 |
| **Big Ickio** | The level EXIT. Dive in to win the level | Every level |

**That last one matters:** every level ends by diving into a giant Ickio. Your invention isn't just a gadget — it's the goal.

### Gogio — the Big Bouncer

Very, very, very, very bouncy. Stand on top of him and you go **way** up. Straight up — you steer yourself in the air.

**The upgrade:** Gogio gets tired. Bounce him three times in a row and he squishes flatter each time — smaller and smaller bounce — until he takes a breath and puffs back up. So you can't just sit there bouncing forever. You have to **use the big bounce at the right moment.**

### ⚠️ Land on TOP, or the spikes get you — Ethan's rule

Every bouncing monster has **spikes around his lower sides**. Land cleanly on his head and he throws you. Walk into him, or clip his side on the way down, and you're out.

This changes what the monsters are. They aren't just friendly furniture any more — they're **tools that bite**. Using one is a decision with a risk attached, and that's what makes a jump exciting instead of automatic.

**The catch to watch:** Monstermania is already strict — no coyote time, no jump buffer — and now the things you *must* use can also kill you. That's three hard rules stacked on top of each other. So the top of every monster is a deliberately **big, forgiving target** (`LANDING_BAND` in config), and the spikes are shaved in on each side. If playtesters start rage-quitting on Fungy, that number is the dial to turn — not the rule.

### Fungy — the Little Hopper 🍄

Looks like a mushroom. Less bouncy than Gogio.

**The upgrade:** don't make him just "worse Gogio." Make him different:

- Gogio launches you **UP**. Huge, but tiring.
- Fungy launches you **the way you're already running** — a low, fast, forward skip. And he **never gets tired.**

Now they're two different tools instead of a good one and a bad one. A row of Fungies = a speed run across a pit. One Gogio = the way to reach the high ledge.

### Stickio — the Wall Walker 🕷️ ✅ Ethan approved

Touch Stickio and you stick to him. While you're stuck to him you can **walk on walls and ceilings**. Jump off and you're normal again.

This one changes the shape of a level completely — suddenly "up" is a direction you can walk. Save him for World 2 so players have mastered the basics first.

### Slowmo — the Floaty One 🪂 ✅ Ethan approved

He puffs a cloud of slime. Fall through it and you **float down slowly**, like a parachute.

Slowmo is the opposite of Ickio: Ickio is about going **fast**, Slowmo is about going **slow and careful**. Great above a pit full of Grumps you need to steer between. Save him for World 3.

### ❌ Chompy — cut

*Ethan said no. Cutting your own ideas is a real designer skill — a monster that sends you somewhere random takes control away from the player, and players hate that. Good call.*

---

## Hazards ⚠️

You had spikes. Spikes are a great start — but a spike that never moves stops being scary after about three levels. So the spikes are **alive**:

**Grumps** — grumpy little monsters who scrunch up into a ball of spikes.

| Grump | What he does |
|---|---|
| Stuck Grump | Sits in the floor forever. (Your original spikes!) |
| Walking Grump | Waddles slowly back and forth on a platform |
| Ceiling Grump | Hangs above you and drops when you walk under |
| Rolling Grump | Rolls downhill toward you — run! |

### You die and go back to the last checkpoint 💀 — Ethan's call

Touch a Grump or fall in a pit and you're **out** — you vanish in a puff of green smoke with a funny sound, and you restart at your last checkpoint.

**Two rules that go with this** (these are what keep it fun instead of frustrating):

- **No lives and no game over.** You restart instantly, as many times as you want. Losing a run is fine; losing your *progress* is what makes kids quit.
- **Respawn is instant.** No slow death animation, no "you died" screen to click through. You should be running again in under a second. The fun of a platformer is trying the hard jump twenty times — anything between attempt 6 and attempt 7 is the enemy.

**Checkpoints:** a sleepy little **Snoozer** — a tiny purple monster curled up asleep on the ground. Touch him, he wakes up and smiles — that's your save spot. Put one before every hard part.

(Don't make the checkpoint a Fungy. If two monsters look alike but do different things, players get confused and blame the game.)

---

## Platforms 🧱

Flat on top, exactly like you said. And your "different designs for different taste" idea becomes **Theme Packs** — the whole level changes look:

| World | Theme | Looks like |
|---|---|---|
| 1 | **Slime Lab** | Green goo, pipes, bubbling tanks |
| 2 | **Gluetown** | Everything sticks — Stickio's world, where walls are floors |
| 3 | **Cloud Castle** | High, floaty and a long way down — Slowmo's world |
| 4 | **Monster Mountain** | Everything at once. Good luck. |

Ethan picked these on 25 July 2026. Three things make them work, and they're worth remembering when naming anything else in this game:

- **Short beats clever.** "Gluetown" survives being shouted across a room. "The Adhesive Caverns" does not.
- **Say what it's made of.** "Slime Lab" tells you what the place looks like before you get there.
- **Match the monster.** World 2 is Stickio's, so a sticky name does free work — the theme and the mechanic back each other up.

**Moving platforms** should show up in World 2: ones that slide side to side, ones that fall a second after you land on them.

---

## Goo Drops 💧 — the collectible

Shiny green blobs hidden through every level. **Three per level**, tucked in tricky spots you have to go out of your way for. A little counter shows "2 / 3" so you know when you missed one.

Ethan's call: they unlock **two** things, and stacking them like this is smart, because they reward two different kinds of player.

| Goo Drops | You get | Who this is for |
|---|---|---|
| Every few drops | **A new character part** — a hat, eye style, color, body | *Everyone.* A small win every single level, and it makes YOUR guy cooler. |
| 15 · 30 · 45 · 60 | **A secret bonus level** 🔒 | *The pros.* Short, brutal, no checkpoints. Bragging rights. |

Why both works: the parts are a steady drip so nobody ever feels like they're collecting for nothing, and the bonus levels are the big milestone you can see coming from a mile away. A game needs both — the little reward and the far-away one.

**Bonus levels should be short.** 20 seconds of the hardest jumping in the game. Beat one and you get a **golden character part** that only bonus-level players can have, so everyone can see you did it.

---

## The Controls 🎮

You said "**any button and right click**" for jump. I love that, so let's make it an official rule:

> **Monstermania is a one-button game.** Arrows or A/D to move. *Any* other button jumps — spacebar, right-click, left-click, tap the screen.

That means it works on a phone or tablet with just two thumbs, and any friend can pick it up in two seconds without a tutorial.

**Hold longer = jump higher.** Tap = little hop. Hold = big jump. This one's in.

### Ethan's ruling: no coyote time, no jump buffer ⚖️

I suggested two invisible helpers. Ethan said no to both:

- **Coyote time** — you can still jump for a split second after running off a ledge
- **Jump buffer** — if you press jump just before landing, the game remembers and jumps as you touch down

> **Ethan's rule: "If you don't jump in time, you fall."**

Fair — it's an honest game, and honest games feel good to *master*. So we build it his way.

**But here's the designer move:** put both helpers in the code behind an **on/off switch** in `src/data/`, set to OFF. Then run a playtest. If friends keep saying *"I swear I pressed jump!"* — that's the game lying to them, and it's worth flipping the switch on and seeing if they notice. If nobody complains, Ethan was right and we leave it off forever.

Don't argue about it. Test it. That's how real studios settle this exact fight.

**Diving into Ickio needs no button at all** — just touch the hole and in you go. Keeps the one-button promise.

---

## Levels 🗺️

You said you'd make the main levels. Here's how the pros do it — and it's a rule you can use forever:

> ### 🔑 The Teach → Test → Twist rule
> Every level does three things, in this order:
> 1. **Teach** — show the new thing somewhere completely safe. No spikes. Let the player mess around with it.
> 2. **Test** — now make them use it for real, with a pit or a Grump.
> 3. **Twist** — combine the new thing with something from an earlier level.

**World 1 — Slime Lab (6 levels).** Build this one first and make it *great*.

| Level | Teaches | Twist |
|---|---|---|
| 1-1 | Running, jumping, Big Ickio exit | — |
| 1-2 | Fungy (forward skip) | Skip across a pit |
| 1-3 | Gogio (big up-bounce, gets tired) | Reach a high ledge before he flattens |
| 1-4 | Stuck Grumps + checkpoints | Gogio bounce *over* the spikes |
| 1-5 | Ickio pairs (linked holes) | Use Fungy speed → dive in → shoot out far |
| 1-6 | **Boss: Big Gogio** | See below |

**Keep every level 30 to 90 seconds long.** Short levels are the secret. A kid who beats a level in a minute wants to play "just one more." A kid stuck on a five-minute level quits.

**World 2 — Stickio.** Walls and ceilings become floors. Moving platforms. Walking Grumps.
**World 3 — Slowmo.** Long falls, floaty steering, Sleepy Ickios that open and close.
**World 4 — everything at once.** No new monsters. The hardest levels, built from all four.

Notice the pattern: **one new idea per world, then a world that combines them all.** Adding a new monster every single level would overwhelm players — and you'd run out of ideas by level 10.

### How hard is Monstermania? 📈 — Ethan's call

**Easy start, hard finish.** World 1 should be beatable by a 6-year-old. World 4 and the bonus levels should be genuinely tough.

What that means when we're actually building levels:

| | Should feel like |
|---|---|
| **World 1** | You basically can't fail. Wide platforms, few Grumps, a checkpoint before anything scary. |
| **World 2** | You'll die a few times. That's the point — it's where players learn that dying is cheap. |
| **World 3** | Real challenge. Long stretches between checkpoints. |
| **World 4** | Hard. Everything at once, no hand-holding. |
| **Bonus levels** | Brutal. 20 seconds, no checkpoints, for show-offs only. |

**The rule that makes this work:** never make a level harder than the one before it *by accident*. If level 2-4 is harder than 2-5, players get stuck and quit on the wrong level. Test them in order.

And remember — Ethan cut coyote time and jump buffer, which makes this game **stricter than most kids' games already**. So World 1 has to be extra generous with its *level design* to make up for it: wider ledges, shorter gaps, more checkpoints.

---

## 🥊 BOSS: BIG GOGIO (end of World 1)

**Ethan's design:** Big Gogio moves around a lot. Tap him at the right moment and his health goes down.

| Part | How it works |
|---|---|
| **Him** | A giant Gogio who bounces around the arena, fast and unpredictable |
| **Hurting him** | **Land on top of him** at the right moment — you bounce off, his health drops. (Ethan's call: it's a jump, not a mouse click — the boss should test the skill you've spent five levels learning.) |
| **His health** | A bar at the top of the screen. **3 hits** for a first boss (any more and it drags) |
| **Getting harder** | Every time he loses health he gets **angrier and faster** — so hit 3 is much scarier than hit 1 |
| **The danger** | If he lands on *you*, you're out and restart at the checkpoint right outside the arena |
| **Winning** | He gets dizzy, giggles, and flops over — then he's your friend and rolls away |

**One rule that makes boss fights fun:** give him a **wind-up**. Before every big jump, Big Gogio squishes down for half a second. That's the player's tell — the fair warning that lets a good player dodge. A boss with no wind-up just feels random and unfair.

---

## The Story 📖

Keep it short — kids skip cutscenes.

> Monstermania is a world where kids and monsters play together. But the **Grumps** got grumpy and scrunched up into spikes all over everything. You're a kid who's not scared of monsters, and your monster friends are helping you get across.

### Who are you? **You decide.** — Ethan's call

Ethan's ruling: **the player names their own character and builds their own look.** There is no fixed hero.

That's a strong choice. Kids play way harder for a character they made themselves.

**The Monster Maker (first screen of the game):**

- **Type a name** — that name shows up in the game ("Nice one, Zoggy!")
- **Build your look from parts** — pick a body shape, a color, eyes, a mouth, and a hat

Build-a-character from parts is the right call over free drawing: it's much faster to make, every combination still looks good, and there's no way to make something ugly or accidentally rude. More parts unlock as you collect Goo Drops — a reason to keep hunting them.

**🎨 ETHAN DECIDES:** How many of each part at the start? *Recommended: 4 bodies, 8 colors, 4 eyes, 4 mouths, 6 hats.* That's 3,072 combinations from only 26 drawings.

---

## The Level Maker 🛠️ (Phase 2 — after the game is fun)

Your tabs idea is exactly how real level editors work. This gets built **after** World 1 is finished and fun, because there's no point letting kids build levels out of pieces that don't feel good yet.

**Tabs:** 🟢 Monsters · ⚠️ Hazards · 🧱 Platforms · 🎨 Themes

Plus two things every editor needs:
- A **Play button** that drops you into your own level instantly, and a Back button that returns you to editing at the same spot
- A **share code** — a short code your friends type in to play your level

---

## What I Changed, and Why (the honest list)

Being able to explain *why* you changed something is the actual skill of a game designer. Here's mine:

| What I changed | Why |
|---|---|
| Added a goal (dive into Big Ickio to finish) | A platformer with no finish line is a toy, not a game. And this makes YOUR invention the goal. |
| Ickios come in linked pairs | A hole that goes nowhere is a trap. A hole that goes *somewhere* is a puzzle. |
| Ickio keeps your speed | This one rule adds hundreds of hours of skill to learn. Cheapest great idea in the doc. |
| Gogio gets tired | Otherwise you just bounce forever and nothing is ever hard. |
| Fungy launches forward, never tires | Two bouncers that only differ by *how much* is one wasted monster. Now both matter. |
| Spikes became living Grumps | Nothing in your first draft could move or chase you. Levels get boring fast without that. |
| Levels are 30–90 seconds | "One more level" is the whole reason anyone keeps playing. |
| One-button controls (your idea, made official) | Works on a phone. Any friend can play instantly. |
| Level maker moved to Phase 2 | Build the fun first. Nobody wants to make levels out of boring pieces. |

## Your Original Ideas — All Still Here ✅

- ✅ Ickio, vibrant lime green, with a visible hole you jump into
- ✅ Gogio, very very very very very bouncy on top
- ✅ Fungy, a mushroom, bouncy but different
- ✅ Flat-topped platforms
- ✅ Different platform designs for different tastes
- ✅ Spike hazards
- ✅ Objects sorted into tabs: monsters, hazards, platforms
- ✅ Jump with any button or right-click
- ✅ Lots of levels, and you make the main ones
- ✅ It's a platformer

---

## ⚖️ Ethan's Rulings — July 25, 2026

The designer has spoken. These beat anything else in this document.

| # | Ruling | Status |
|---|---|---|
| 1 | **Stickio and Slowmo are in. Chompy is cut.** | ✅ In the doc |
| 2 | **You die and restart at the last checkpoint.** No "bonking." | ✅ In the doc |
| 3 | **No coyote time.** "If you don't jump in time, you fall." | ✅ Built as a switch, set OFF |
| 4 | **No jump buffer.** Same reason. | ✅ Built as a switch, set OFF |
| 5 | **Big Gogio moves around a lot; tap him in time and his health drops.** | ✅ Full boss design added |
| 6 | **The player names and builds their own character.** | ✅ Monster Maker added |
| 7 | **You hit Big Gogio by landing on his head** — jumping, not clicking. | ✅ In the boss design |
| 8 | **Goo Drops unlock character parts AND secret bonus levels.** Both. | ✅ Goo Drops section added |
| 9 | **Easy start, hard finish.** World 1 for everyone, World 4 for pros. | ✅ Difficulty plan added |
| 10 | **The monsters should look scarier.** | ✅ Spikes, glaring eyes, jagged grins |
| 11 | **You must land on TOP of a monster — his sides have spikes.** | ✅ Built, with a generous top |
| 12 | **The prize on the high shelf is a coin, not a checkpoint.** Goo Drops buy character perks. | ✅ Built |

Two of these overruled me, and Ethan was right to make the call — it's his game. Rulings 3 and 4 are the ones we'll test with real players before anyone declares victory.

---

## Still to decide 🙋

One question at a time, always with a recommendation. Answers get written in here as they come.

- [ ] Names for the four theme packs
- [ ] How many character parts to start with
- [ ] What the Monstermania music sounds like

**Everything needed to start building World 1 is now decided.** The rest can be answered while the code is being written.
