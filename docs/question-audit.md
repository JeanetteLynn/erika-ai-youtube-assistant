# Question Audit — Pickaxe Original vs. Current Cloudflare App

**Audit date:** 2026-04-23
**Pickaxe workspace:** The AI YouTube Assistant (id `33a21001-b7f6-4216-8534-b835ded1a885`)
**Current app:** `C:/Users/Admin/projects/erika-ai-youtube-assistant/src/prompts.js`

Full Pickaxe source: [docs/pickaxe-originals/](./pickaxe-originals/)

---

## TL;DR for Erika

Everything you worked on with John is intact in Pickaxe. Nothing is lost.

The current app drifted from your originals in three big ways:

1. **Whole transition/synthesis modules were dropped.** Pickaxe's True Fan generates 7 mid-step summaries; the app does 0. Pickaxe's Why does two rounds of refinement (5 options → 3 variants of the chosen one); the app does one. These are the biggest reasons "it didn't feel rooted in what we did."
2. **Niche and Why leaked into each other.** Two of your Why questions that reference "your topic" (Q8, Q13) are niche questions, not Why questions. Removing them fixes the "my Why had YouTube in it" problem.
3. **The Blueprint is asking questions instead of delivering.** Pickaxe generates everything from memory and only asks ONE real question (upload frequency). The app has drifted into interrogating users for power words, phrases, values, etc. Fix is to rebuild Step 5 as pure "generate → approve → iterate."

Three things you asked for in the call that are **NOT in your Pickaxe originals** — these are design evolutions you'd be adding, not restorations:

- A "Both" path for Creator + Business Owner (original has no "Both" — undecided users route to REROUTE → discovery)
- "Audience Needs" as a niche-scoring dimension (original uses "Stamina — could you post weekly for a year?")
- Softer multi-niche pushback (original explicitly says "DO NOT validate multi-passionate as a niche strategy")

Need your call on each of those three before we ship.

---

## STEP 1 — WHY STATEMENT

### Overall shape

| | Pickaxe | Current app |
|---|---|---|
| Total questions | 23 (incl. name) | 22 (numbered 1, 3-20, 21, 22 — Q2 missing) |
| Formula | "To [contribution] so that [impact]" — strict DO/DON'T + examples + calibration checks | Mentioned loosely |
| Niche-exclusion rule | Explicit: "Don't include job titles, industries, or specific goals" | Missing |
| Refinement rounds | **2** (5 options → pick → 3 variants of chosen → confirm) | **1** (5 options → pick → confirm) |
| Theme synthesis (Q21) | Format: title (2-5 words) + 1-sentence summary | Brief mention |
| Mid-session reminder (Q10) | Present | Missing |
| Encouragement checkpoints | Q6, 10, 15, 19, 21 | Same |

### Question-by-question

| # | Pickaxe original | Current app | Decision |
|---|---|---|---|
| 1 | What is your name? | (Skip — app has `userName` from auth) | SKIP IN APP, but renumber correctly |
| 2 | 3 elements of your life you're most proud of, and what made them meaningful | Q1: "What are you most proud of in your life so far?" | **EDIT — use Pickaxe version (3 elements + meaning)** |
| 3 | Moment that changed everything, how it changed how you think about your life or role in the world | Q3: "Was there a moment that completely changed the direction of your life?" | **EDIT — deeper framing in Pickaxe** |
| 4 | Tell me how you helped someone or gave of yourself and felt "this is why I'm here" | (missing) | **ADD** |
| 5 | Biggest influence growing up, why | Q4: "Who has influenced you the most — and what did they teach you?" | **EDIT — Pickaxe specifies "growing up"** |
| 6 | What did people naturally come to you for, even when young | Q5: "What's a natural gift or talent people always come to you for?" | **EDIT — Pickaxe specifies "even when young"** |
| 7 | Experience you'd never trade, even if difficult | Q11: "What's a lesson you had to learn the hard way?" | **EDIT — different angle** |
| 8 | When you wake up, what are you most excited about? | Q6: Same | KEEP |
| 9 | Last time you felt truly alive, happy, and carefree. What made it powerful? | Q15: "When you feel most 'in flow,' what are you doing?" | **EDIT — Pickaxe is more specific** |
| 10 | When you made a real difference in someone's life | Q14: "biggest transformation you've helped someone experience" | **EDIT — Pickaxe language** |
| 11 | When you felt completely in flow, time disappeared | (subsumed in current Q15) | **SPLIT — Pickaxe has both flow AND "alive/carefree"** |
| 12 | What do you want to be remembered for — not achievements, but who you were | Q7: "80th birthday party" | **REPLACE — Pickaxe is better framing** |
| 13 | Impact you want to make — big picture, beyond business/content | Q9: "problem in the world that makes you want to stand up" | **EDIT — Pickaxe is bigger scope** |
| 14 | How you want closest people to feel around you | (missing) | **ADD** |
| 15 | Greatest sense of fulfillment | (missing) | **ADD** |
| 16 | Compliments that touch you most | Q17: "recurring compliment you receive that you tend to brush off" | **EDIT — Pickaxe is warmer** |
| 17 | How others describe the best of you at your strongest | (missing) | **ADD** |
| 18 | Moments that gave goosebumps/tears (good way) | (missing) | **ADD** |
| 19 | 3 things you want to change (life or world) | Q8: "topic you could talk about for hours" **← NICHE LEAK** | **REMOVE Q8 (niche leak), ADD Pickaxe Q19** |
| 20 | 3 things that frustrate you most | Q13: "belief about topic most people get wrong" **← NICHE LEAK** | **REMOVE Q13 (niche leak), ADD Pickaxe Q20** |
| 21 | Theme Synthesis | Q21: same idea | **REBUILD with title + summary format** |
| 22 | 5 Why Statements → pick | Q22: same | **ADD strict formula + 2nd refinement round** |
| 23 | Final confirmation | (missing) | **ADD final confirmation step** |

**Current Q10, Q12, Q16, Q18, Q19, Q20** (remembering moments, freedom, one thing to teach, 3-year vision, principle you won't compromise) — NOT in Pickaxe. These are AI additions. **Decision: remove** unless Erika wants to keep any.

### Priority fixes

1. **REMOVE Q8 and Q13** (niche leaks) — solves "my Why referenced YouTube" bug immediately.
2. **ADD niche-exclusion rule** to prompt: "Don't include job titles, industries, or specific goals."
3. **ADD strict formula + calibration checks** to generation step.
4. **ADD 2nd refinement round** (3 variants of chosen statement).
5. **Rebuild question list** to match Pickaxe 1-23 exactly.

---

## STEP 2 — DEFINE YOUR NICHE

### Overall shape

| | Pickaxe | Current app |
|---|---|---|
| Total questions | Dynamic (9 validation / 5-6 deciding / 23-24 discovery) | Fixed 15 (hardcoded) |
| User type labels | **Influencers / Business Owners** | Content Creator / Business Owner |
| "Both" path | **Not present** (undecided → REROUTE → discovery) | Not present |
| Validation phase | 9 specific Qs with setup paragraphs | 9 generic Qs |
| Niche statement formula | **[WHAT] for [WHO] using [HOW] to achieve [TRANSFORMATION]** | Missing |
| Deciding phase | 5-6 Q scoring series + REROUTE module | Missing |
| Multi-niche guardrails | **"DO NOT validate multi-passionate"** (strict) | Not enforced |
| Full discovery (BO) | 23 Qs across 5 sections | 9 Qs |
| Full discovery (CC/Influencer) | 24 Qs across 4 sections | 9 Qs |
| Scoring dimensions | Skill / Passion / **Stamina** / Monetization | Skill / Passion / Stamina / Monetization |
| Video-idea ranking | +5/+3/+1 on 5 ideas per niche | Brief "+2" mention |

### Questions (validation phase — Path A)

| # | Pickaxe original | Current app | Decision |
|---|---|---|---|
| 1 | What do you think your niche already is? | Q1: "3 topics you could create 100 videos about" | **REPLACE with Pickaxe Q1** |
| 2 | What specific problem are you solving? | Q2: "What do people always ask your advice about?" | **REPLACE** |
| 3 | What transformation do you want to create? | Q3: "What YouTube channels do you binge-watch?" | **REPLACE** |
| 4 | What makes YOUR approach different? | Q6: "What makes your perspective unique?" | **EDIT — Pickaxe version** |
| 5 | One core message or topic that lights you up? | (missing) | **ADD** |
| 6 | If you could only create 10 videos ever, what would they be about? | (missing) | **ADD** |
| 7 | Can you name 3-5 successful channels in your space? | Q3: close | **EDIT** |
| 8 | Biggest misconception people have about your topic? | Q5: "problems people face that nobody talks about" | **REPLACE** |
| 9 | How do you want people to feel after watching? | (missing) | **ADD** |

### Deciding phase (Path B — for torn users)

Current app has **no deciding phase at all**. Add:
- Intro verbatim about 5-6 questions
- Questions 1-6 from Pickaxe (including BO-only Q6 monetization)
- Scoring logic per niche
- REROUTE module if still undecided

### Full discovery (Path C)

Current app has 9 generic questions. Pickaxe has 23 for BO / 24 for CC across sections. **Rebuild entirely per Pickaxe spec.**

### Niche Clarity Drafts

Pickaxe generates **3 statements** using formula `[WHAT] for [WHO] using [HOW] to achieve [TRANSFORMATION]` after validation. Current app uses no formula. **ADD formula.**

### Flag for Erika's call

1. **Labels — "Influencers" vs "Content Creator"** — Pickaxe says Influencers, Erika used "influencer" in feedback. **Recommend: switch to "Influencers".**
2. **"Both" path** — Not in Pickaxe. Her feedback asks for it. **Confirm: add as new feature or route through REROUTE?**
3. **"Stamina" vs "Audience Needs"** — Pickaxe uses Stamina. Her feedback asks for Audience Needs. **Confirm: which does she want?**
4. **Multi-niche pushback** — Pickaxe is strict. Her client's fashion+beauty got intended behavior. **Confirm: soften or preserve strict original?**

### Priority fixes

1. **Rewrite validation phase** to Pickaxe's 9 Qs verbatim with setup paragraphs.
2. **Add full deciding phase** with scoring + REROUTE.
3. **Rebuild discovery path** (23 BO / 24 CC).
4. **Add niche statement formula**.
5. **Rebuild video-idea ranking** (5 ideas per niche, A-C, +5/+3/+1 bonus).
6. **Make progress counter dynamic** based on path chosen.

---

## STEP 3 — TRUE FAN PROFILER

### Overall shape

| | Pickaxe | Current app |
|---|---|---|
| Total questions | 29 (26 discovery + 3 generation steps) | 29 flat |
| Section structure | **7 sections with transition summaries** | Flat list, no sections |
| Transition modules | **7** (after Q9, Q12, Q15, Q20, Q21, Q25, Q28) | **0** |
| Mid-step draft framing (Q21) | VERBATIM: "Here is a **draft** of your True Fan Statement..." | Confusing — reads like final |
| Age pushback | **None** | AI-invented insistence |
| 20 video topics | Full spec: topics not titles, archetypes, psychology-rooted | Brief "generate 20 ideas" |
| Final statement generation | **3 alternatives** → pick → profile | 1 statement |
| Final profile | 3-paragraph using 6 variables | Similar |

### The 7 transition modules (all missing from current app)

| Trigger | Module | Stores |
|---|---|---|
| After Q9 (Demographics done) | Demographic Summary | `{{demo}}` |
| After Q12 (Personality done) | 2-sentence Personality Summary | `{{char}}` |
| After Q15 (Values done) | Values Summary Paragraph | `{{vals}}` |
| After Q20 (Lifestyle + start Emotional) | 3-4 sentence "day-in-the-life" | `{{life}}` |
| After Q21 (Emotional Q2) | **Draft True Fan Statement** (w/ VERBATIM framing) | `{{True Fan Statement}}` |
| After Q25 (Audience Research) | Emotional Triggers Summary | `{{needs}}` |
| After Q28 (Research done) | 5 Plausible Audience Frustrations | `{{frust}}` |

**This is the single biggest miss in the current app.** Adding these restores the "rooted in what we did" feeling Erika is missing.

### Questions (29 total)

| # | Pickaxe section | Question |
|---|---|---|
| 1-8 | Demographics | Age range, location, stage of life, relationship status, education/work, gender, ethnicity, 5 physical traits |
| 9-11 | Personality | 5 words, who inspires, life goals |
| 12-14 | Values | 5 core values, religious/spiritual/neither, what matters everyday |
| 15-19 | Lifestyle | Hobbies, TV, podcasts/music, YouTube subs, brands |
| 20-23 | Emotional Triggers | Curiosity, urgent need, desires, struggles |
| 24-26 | Audience Research | Done research?, 1-3 patterns, repeated questions |
| 27 | (gen) | Audience Frustrations |
| 28 | (gen) | 20 Video Topics + pick 5 |
| 29 | (gen) | 3 Statement alternatives → profile |

Current app has 29 flat Qs but **no section labels, no transition summaries, no verbatim intro language for each section.**

### Priority fixes

1. **Restore section structure** with verbatim intro per section.
2. **Add all 7 transition modules** (generate summary + verify + store variable).
3. **Restore draft framing at Q21** VERBATIM: "Here is a draft of your True Fan Statement."
4. **Remove age pushback** (AI-invented, not in Pickaxe).
5. **Rebuild 20 video topics spec** with archetypes + psychology requirements + pick-5.
6. **Restore 3-alternative final statement** → pick → profile flow.
7. **Add `{{archetype}}` storage** when user reacts strongly to a phrase mid-conversation (Erika's new ask, e.g., "Hesitant Star of the Stuck Creator").

---

## STEP 4 — MISSION STATEMENT BUILDER

### Overall shape

| | Pickaxe | Current app |
|---|---|---|
| Total questions | 5 | 5 |
| Version count | 5 (A-E: Belief / Short / Medium / Brand / Creative) | 5 (same names) |
| Q5 framing ("say out loud") | VERBATIM "Could you say them on a podcast or on a stage?" | Missing |
| "Don't show examples unless asked" rule | Explicit | Examples leak in |
| Approval-vs-change rule | **"Don't combine approval and changes in the same question"** | Not enforced |
| Version D rule | Remove "I believe" from beliefs before using | Not specified |
| "The mission with my channel is..." prefix | **Not in Pickaxe** | Missing |

### Questions

| # | Pickaxe | Current app | Decision |
|---|---|---|---|
| 1 | 2-3 strong beliefs/opinions that show up in content | Q1: "What do you believe about your topic that most people get wrong?" | **REPLACE with Pickaxe Q1** |
| 2 | What are you offering — what do they gain? | Q2: "What's the biggest gift you're giving your audience?" | **EDIT — use Pickaxe phrasing** |
| 3 | What makes you different from other creators? | Q3: "What makes your channel different?" | **EDIT** |
| 4 | Transformation/outcome for True Fan | Q4: "What's the ONE transformation you want viewers to walk away with?" | **EDIT** |
| 5 | Generate 5 versions with "say out loud" framing | Q5: similar | **ADD VERBATIM "podcast or stage" framing** |

### Version formats

Pickaxe spec (use these verbatim):

- **A) Belief:** "I believe {beliefs_core}. I help {true_fan_outcome} by {differentiation_core} + {audience_gain}."
- **B) Short Intro (≤15 words):** "[Role] helping [True Fan] [outcome] with [unique edge]."
- **C) Medium About (30-45 words):** "{audience_gain}, and I help {true_fan_outcome}. What sets me apart: [differentiation_core]."
- **D) Brand Positioning (60-85 words):** `{beliefs_core} → {audience_gain} → {true_fan_outcome} → proof of difference from {differentiation_core}` (remove "I believe" from beliefs first)
- **E) Creative/Unique:** Vivid, memorable, 1-2 sentences, no clichés, match user's cadence.

### Flag for Erika's call

**"The mission with my channel is..." prefix** is not in her Pickaxe original. Options:
1. Keep Pickaxe's 5-format structure as-is (recommended)
2. Add a 6th simple "The mission with my channel is..." version (additive, doesn't break A's "I believe")
3. Rewrite all 5 with the prefix (breaks Version A)

**Needs decision.**

### The bug she hit (Mission generated from one True Fan answer)

Pickaxe has strict `{{cq}}=0..5` counter with "Never repeat or skip questions." The current app has no equivalent gate, so the AI generated a mission when she was still in True Fan. **Fix: enforce step-gate at the app level** — if user is in Step 3, Step 4 prompt refuses to run even if triggered.

### Priority fixes

1. **Rewrite all 4 input questions** to Pickaxe phrasing.
2. **Add "say out loud" framing** to Q5.
3. **Specify exact version format templates** in prompt.
4. **Add approval-vs-change rule**.
5. **Add step-gate enforcement** at app level to prevent cross-step generation.

---

## STEP 5 — BRAND BLUEPRINT & MESSAGING GUIDE

### Overall shape (biggest gap of all)

| | Pickaxe | Current app |
|---|---|---|
| Shape | **Delivery-only** (generate from memory → approve → iterate) | Interrogative (10 questions) |
| Real user-input questions | **1** (Q9: upload frequency) | Multiple (power words, phrases, etc.) |
| Per-section coaching intros | **Verbatim for every section** (9 paragraphs) | Missing |
| "Don't add new themes" rule | Explicit | Missing |
| Channel Promise formula | **6-element structured formula** | Brief synthesis |
| Documents | **2 separate docs** (Blueprint + Messaging Guide) with 13 sections | 1 doc |
| PDF typography | Georgia serif + Calibri body | Nunito + Cormorant Garamond |
| PDF palette | Navy #2D3E53 + Gold #C9A77B + Blush #E0BFBD + Silver #c0c0c0 | Tan/gold (different shades) |
| PDF layout | 580px, double-border left dividers, uppercase gold labels | Different |
| ASCII sanitization before render | Explicit step | Missing |

### Section-by-section

| Q | Pickaxe | Current app | Decision |
|---|---|---|---|
| 1 | **Show** Blueprint summary verbatim (Why + True Fan statement+desc + Niche + ALL Mission versions) → approve | Similar, briefer | **EXPAND — include ALL 5 mission versions, not just short** |
| 2 | Video Intros: Short (1 sent) / Medium (2 sent) / Long (~4 sent with context) | Short (5-10s) / Medium (15-20s) / Long (30s) | **Match Pickaxe spec** |
| 3 | 5 banner text options w/ verbatim intro | 5 banner options, no intro | **ADD intro paragraph** |
| 4 | 2 About sections — Option1 from mission, Option2 fresh audience-focused | 2 About options (150-200 words) | **Match Pickaxe spec** |
| 5 | 5 belief statements (messaging pillars) | 5 pillars | **ADD intro + sourcing rules** |
| 6 | 13 power words drawing from Beliefs + Banner + Missions + True Fan | 13 power words from "how they've answered" | **ADD sourcing** |
| 7 | 5 taglines from Beliefs + Power Words | 5 taglines | **ADD sourcing** |
| 8 | 8 "what not to say" from Niche + True Fan + Missions | 8 avoid items | **ADD sourcing** |
| 9 | **Upload frequency** (only real question) | Asked | KEEP |
| 10 | Channel Promise via 6-element formula | Brief "2-3 sentence synthesis" | **ADD full formula** |

### Channel Promise formula (critical ADD)

> "On this channel, I help **[exact who]** **[measurable outcome]** through **[specific method/components]**, without **[big pain]**. I will post new videos every **[day/cadence]** on **[3–4 content pillars]**."

Element sourcing:
- `[exact who]` → compressed descriptor from True Fan description
- `[measurable outcome]` → synthesized from True Fan needs + Niche answers
- `[specific method/components]` → recurring patterns across Mission + Niche (what makes user different)
- `[big pain]` → biggest struggle from True Fan
- `[day/cadence]` → frequency answer
- `[3–4 content pillars]` → synthesized themes across Niche/True Fan/Mission/Messaging

### Branded PDF spec

- **Max-width 580px, 48px padding**
- **Typography**: Georgia/Palatino Linotype serif (headings + italic inline labels), Calibri/Segoe UI body
- **Palette:**
  - Body: `#141623`
  - Navy headings: `#2D3E53`
  - Gold labels (uppercase, letter-spacing 2px): `#C9A77B`
  - Blush sub-heading: `#E0BFBD`
  - Silver dividers: `#c0c0c0`
- **Section dividers**: `border-left: 3px double #c0c0c0`, 14px left padding
- **Footer**: "Erika Vieira" italic serif + "YouTube Channel Producer & Strategist" uppercase gold

### Priority fixes

1. **Restructure Step 5 as "generate → approve" only.** Remove all interrogation questions except Q9.
2. **Add verbatim coaching intros** to all 9 sections.
3. **Add "don't add new themes" rule**.
4. **Add Channel Promise formula** with element sourcing.
5. **Split output into 2 documents** (Blueprint + Messaging Guide).
6. **Rebuild PDF HTML templates** to match Pickaxe palette, typography, layout.
7. **Add ASCII-strip step** before HTML generation.

---

## Summary of fixes by file

### `src/prompts.js`
- **whyStatementPrompt()**: Remove Q8 & Q13 (niche leaks), rebuild 1-23 to Pickaxe spec, add niche-exclusion rule, add formula + calibration, add 2nd refinement round, add Q10 stability reminder.
- **defineNichePrompt()**: Switch to Influencer/BO labels, add deciding + REROUTE phases, add formula, rebuild discovery (23/24 Qs), add multi-niche guardrails. **Hold on Stamina→Audience + Both path until Erika confirms.**
- **trueFanProfilerPrompt()**: Restore 7 transition modules, restore draft framing at Q21, remove age pushback, rebuild 20-topic spec, restore 3-alternative final.
- **missionStatementPrompt()**: Rewrite Q1-Q4 phrasing, add "say out loud" framing, add strict version templates, add approval rule. **Hold on "mission with my channel is" prefix until Erika confirms.**
- **brandBlueprintPrompt()**: Strip to delivery-only, add verbatim intros to 9 sections, add Channel Promise formula, split to 2 documents.

### `public/app.js`
- PDF generation: swap typography (Georgia + Calibri), swap palette (navy/gold/blush/silver), swap layout (580px + double-border dividers + uppercase gold labels), add ASCII-strip.
- Progress bar: add "Question X of Y" text counter, dynamic totals for Niche step.
- Voice input: clear textarea on toggle, not accumulate.

### `src/api.js`
- Add step-gate enforcement so AI can't generate Step N deliverable while user is still in Step N-1.
- Update memory variable names to match Pickaxe conventions (`{{var_why}}`, `{{var_fan}}`, `{{var_niche}}`, `{{var_mission}}`, `{{demo}}`, `{{char}}`, `{{vals}}`, `{{life}}`, `{{needs}}`, `{{frust}}`, `{{True Fan Statement}}`, `{{Defined Niche}}`, `{{selected_why}}`).

---

## Three decisions needed from Erika before code changes

1. **Niche user-type labels:** "Influencers / Business Owners" (Pickaxe original) or keep "Content Creator / Business Owner"?
2. **"Both" path, Stamina vs. Audience Needs, softer multi-niche pushback:** Original design kept, or evolved per call feedback?
3. **Mission prefix "The mission with my channel is...":** Not add (keep 5 original formats) / add as 6th version / rewrite all 5?
