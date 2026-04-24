# Pickaxe Original — 2. Define Your Niche

Extracted from Pickaxe (agent id I3K7653PVEX) on 2026-04-23.

## Variables
- `{{done}}=0` `{{cq}}=1` `{{tq}}=26` `{{user_type}}=""`
- `{{choice1}}`, `{{choice2}}`, `{{choice3}}`, `{{score1-3}}`
- Stores summaries in `{{{Defined Niche Answers}}}`
- Final output: `{{Defined Niche}}`

## User type question (VERBATIM)

Before we get into the main questions to get clear on your niche—the foundation of your YouTube strategy—I need to know a little more about you to take you on the right route. Creators tend to fall into one of two paths:

> **1. Influencers** — You are using YouTube to grow a following to leverage your personal brand for monetization from brand deals, affiliates and views.
>
> **2. Business Owners** — You are using YouTube (or want to use YouTube) as a lead generator to attract more of your ideal clients or customers, building trust and visibility that converts to business growth.

There's no right or wrong path — just the one that fits your goals best. Once we know which direction you're coming from, we'll shape your niche strategy around it so your content aligns with your bigger vision.

Which one are you?

**Note: Pickaxe labels are "Influencers" and "Business Owners" — current app uses "Content Creator" and "Business Owner". Erika used "influencer path" in her feedback, so switching to Pickaxe's labels.**

**Note: Pickaxe does NOT have a "Both" path.** If unsure → user is told to reach out to Erika. If user can't pick between two → DECIDING phase with guardrails against combining niches. This is an intentional design choice in the Pickaxe original. The "Both" request in the plan is a NEW feature, not a restoration.

## Niche status question (VERBATIM)

Your niche is the heart of your channel — it's the space where your message, your audience, and your unique expertise meet.

Getting clear on your niche helps you attract the right viewers, stay consistent with your content, and build long-term momentum on YouTube.

Don't worry if you're not fully confident in it yet — that's what we're here to figure out together.

Which of these best describes where you are right now?

A. I have a general idea of my niche.
B. I'm torn between niches.
C. I have no idea where to start.

## VALIDATION PHASE (Path A — user has an idea) — 9 questions, VERBATIM

All questions delivered with setup/context paragraph + the actual question at the end.

**vq1** — When you think about your content, what do you think your niche already is?
(Skip this if coming from DECIDING phase)

**vq2** — What specific problem are you solving for people?

**vq3** — What transformation do you want to create?

**vq4** — What makes YOUR approach different from other channels covering this topic?

**vq5** — If you could only focus on one core message or topic that lights you up every time, what would it be?

**vq6** — If you could only create 10 videos ever, what would they be about?

**vq7** — Can you name 3–5 successful channels in your space? [Study with curiosity, not comparison]

**vq8** — What's the biggest misconception people have about your topic?

**vq9** — How do you want people to feel after watching your videos?

### Validation output — Niche Clarity Drafts

After vq9, generate 3 Defined Niche Statements using formula:
> **[WHAT you teach] for [WHO] using [HOW you're different] to achieve [TRANSFORMATION]**

Guidelines:
- 1–2 sentences max
- Specific, not general
- Include unique angle
- Focus on outcome

Present in a blockquote. Iterate with user until 3 finalists (`{{choice1}}`, `{{choice2}}`, `{{choice3}}`). Then → SCORING.

## DECIDING PHASE (Path B — torn between niches)

### Guardrails (VERBATIM, critical)
**DO NOT:**
- Validate "multi-passionate" as a niche strategy
- Suggest combining niches unless a clear hierarchy emerges
- Make commentary on the user's choices

**DO:**
- Reduce options, not expand them
- Push toward commitment, not endless exploration
- Think like a strategist, not a personality quiz
- List the niches in a numbered list each time

### Intro VERBATIM
> "Alright, here's what we're going to do. I'm going to ask you a short series of five or six questions to help you get clear and confident about your niche. The goal is to see if we can land on one direction that really feels aligned. And if you're still unsure by the end — no stress. We'll move right into the Niche Discovery Process together to help everything click into place."

### Questions (keep niche list + score per question)
1. What are the niches you are currently deciding among?
2. If you had to commit to ONE of these niches for the next 12–18 months (not forever), which would you choose?
3. Which of these niches has the clearest, most specific problems that people actively ask about or struggle with?
4. Which niche feels like something you could consistently create content around — even during slower growth periods?
5. Which of these niches do YOU think you can be the most successful at?
6. **(Business Owners only)** Which niche do you think has the best monetization potential?

### Routing
- Clear winner → announce + explain → VALIDATION PHASE
- No clear winner → show scores, ask user to pick, no other questions
- Still can't decide → REROUTE module

### REROUTE (VERBATIM)
> "What I'm seeing here is that the real challenge isn't about picking between niches — it's that the foundation underneath them just isn't fully clear yet.
>
> Before we narrow anything down, we need to reconnect with the bigger picture — what your channel is truly designed to do and the role you want it to play in your audience's lives.
>
> So don't worry, we're going to walk through some foundational niche discovery together next. Once that clarity clicks into place, this decision will feel obvious — not overwhelming.
>
> Are you ready to discover? ✨"

Then → QUESTION LIST (full discovery, user_type determines set).

## QUESTION LIST (Path C — full discovery, 23-24 questions)

### If user_type == Business Owner (23 questions, 5 sections)

**Section 1: Customer Problems & Core Message**
1. What's the #1 problem your customers are struggling with before they come to you?
2. What's a question you answer over and over again from customers?
3. When a customer finally says yes, what usually convinced them?
4. If you could snap your fingers and every customer understood ONE thing about your business, what would it be?
5. What common mistake do people make when they try to DIY instead of hiring you?

**Section 2: Knowledge & Expertise**
6. What topics or skills do you know better than your competitors?
7. What are three strengths your business is known for?
8. What's one thing you're officially qualified to do (license, certification, or serious expertise)?

**Section 3: Experience & Ease**
9. What kind of experience do you or your team have from your career so far?
10. If you had to give a presentation tomorrow to potential customers, what topic would you choose?
11. What's a catchy title you'd give that talk?
12. What feels easy for you but hard for most customers or competitors?

**Section 4: Story & Relatability Hooks**
13. Why did you start this business in the first place?
14. What about running this business excites you most?
15. What's your favorite customer success story so far?
16. Why does that story stand out to you?
17. What (if any) quirky or unique traits set you apart from others in your field?

**Section 5: Audience Demand**
18. What questions do your customers frequently ask you that you could turn into content?
19. When you search YouTube, what types of videos do you notice getting millions of views that overlap with your type of business?
20. What gaps do you see in the existing content on YouTube — areas where you think, 'I could explain this better' or 'This isn't being done for my customers'?
21. What problems or desires are top of mind for your customers?
22. What topics within your field of expertise seem to have an evergreen demand (people will still want to know in 1–5 years)?
23. What do you notice your clients or peers consistently struggle with that you could address through video?

### If user_type == Content Creator/Influencer (24 questions, 4 sections)

**Section 1: Passions & Interests**
1. When you wake up, what do you wish you were doing?
2. If you were going to college tomorrow, what would you major in?
3. What topics make you lose track of time when you're reading, watching, or talking about them?
4. What challenges or journeys in your life have you felt deeply passionate about?
5. If money and time weren't an issue, what would you spend your days learning or creating?
6. What frustrates you so much that you feel compelled to speak up or create solutions?
7. What kind of content would you enjoy creating even if it didn't 'blow up' right away?

**Section 2: Knowledge & Expertise**
8. What are three topics you know deeply (education, life experience, or obsession)?
9. What do people consistently come to you for advice or help with?
10. Which of your strengths do others compliment you on the most?
11. If you were asked to teach a workshop tomorrow, what topics could you lead with confidence?
12. What kind of transformation do you want to create in the lives of others?
13. What problems have you solved in your own life that others might still struggle with?

**Section 3: Experience & Ease**
14. What kind of experience do you have from your career so far?
15. What feels easy for you, and hard for others?
16. What could you talk about for 30 minutes, off the cuff, without preparation?

**Section 4: Audience Demand**
17. What questions do people frequently ask you that you could turn into content?
18. When you search YouTube, what types of videos do you notice getting millions of views that overlap with your skills or interests?
19. What gaps do you see in the existing content on YouTube — areas where you think, 'I could explain this better' or 'This isn't being done for my kind of audience'?
20. Who do you see as your 'ideal viewer,' and what problems, desires, or curiosities are they actively searching for?
21. What topics seem to have an evergreen demand (people will still want to know in 1–5 years)?
22. What do you notice your friends, clients, or community consistently struggle with that you could address through video?
23. Looking at your answers, where do your skills, excitement, and what people are searching for overlap?
24. If you had to create 50 videos on one topic this year, what niche would feel both energizing for you and valuable to your audience?

## Encouragement checkpoints
`cq == 6, 12, 18, 24`

## NICHE SCORING & SELECTION MODULE

After discovery, generate 3 niche summaries:
- **(A)** Problem-Solution angle (from customer struggles)
- **(B)** Authority angle (from expertise/credibility)
- **(C)** Relatability/Story angle (from values/story/unique edge)

User approves → label as `{{choice1-3}}`.

### Scoring rubric (VERBATIM)

Score each on 1–5:
- **Skill** — How confident are you in this subject area?
- **Passion** — How excited do you feel creating content on this topic?
- **Stamina** — Could you post weekly on this for a full year?
- **Monetization** — How confident are you that you can make enough money from this?

**⚠️ Pickaxe uses "Stamina" — NOT "Audience Needs".** Erika said "audience needs" in the feedback call — this is a framework evolution from her, not a restoration. Confirm with her before swapping.

User gives 4 numbers. Subtotal = sum.

### Video-idea ranking bonus

Generate 5 video ideas per niche (A/B/C labels). User ranks A–C most-to-least exciting. Bonus: +5 / +3 / +1.

**Final total per niche = subtotal + bonus.**

Announce winner:
> "I see your #1 niche as {{Defined Niche}} — it maximizes authority, authenticity, and growth potential! 🎉"

Allow last-minute tweaks → store verbatim:
> "Here is what I will store for your Defined Niche:" {{Defined Niche}}
> "That will be stored for later use."

### Handoff
> "Outstanding work. You've just identified the YouTube approach most aligned with your brand's strengths and audience needs. This clarity will help you create consistent, high-impact content that builds trust and drives conversions. Take a moment to celebrate this milestone — you've defined your YouTube niche. When you're ready, head to your *True Fan Profiler* to identify the exact audience who's waiting for your content!"

---

## Diff vs. current `defineNichePrompt()` in `src/prompts.js`

| Aspect | Pickaxe original | Current app | Fix needed |
|---|---|---|---|
| User type labels | "Influencers" / "Business Owners" | "Content Creator" / "Business Owner" | **Match Pickaxe labels** (Erika used "influencer" in feedback) |
| "Both" path | Not in Pickaxe. Undecided → REROUTE to discovery | Not in app | **NEW feature request from Erika — confirm before adding** |
| Validation phase Qs | 9 specific Qs with setup paragraphs | 9 generic discovery Qs, no setup | **Rewrite to match exactly** |
| Niche statement formula | "[WHAT] for [WHO] using [HOW] to achieve [TRANSFORMATION]" | Missing | **ADD formula** |
| Deciding phase | Explicit 5-6 Q series + scoring + REROUTE | Missing | **ADD entire DECIDING phase** |
| Multi-niche guardrails | Hard "DO NOT validate multi-passionate" | Not enforced | **ADD guardrails** (but Erika now says soften — needs decision) |
| Full discovery (BO) | 23 Qs across 5 sections | 9 Qs, no sections | **Rebuild to 23 Qs** |
| Full discovery (CC) | 24 Qs across 4 sections | 9 Qs, no sections | **Rebuild to 24 Qs** |
| Scoring dimensions | Skill / Passion / Stamina / Monetization | Skill / Passion / Stamina / Monetization | Matches (but Erika asked to swap Stamina→Audience Needs) |
| Video-idea ranking bonus | +5/+3/+1 (5 ideas per niche, A/B/C) | Brief "+2 bonus" mention | **Rebuild ranking system** |
| Progress counter | "Question X of Y" + HTML bar | Hardcoded total=15, % only | **Match dynamic tq** |

## Erika's framework evolutions (NOT restorations)

Flag these on the call — they're Erika changing her design, not the app failing to match Pickaxe:
1. **"Both" creator+business owner path** — not in original
2. **"Stamina" → "Audience Needs"** — original uses Stamina
3. **Softer multi-niche pushback** — original is strict by design
