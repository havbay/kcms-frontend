# KCMS Landing Page Redesign Prompt (Floating Bento Card + Morphing Dynamic Navbar)

> **Design Inspiration:** 
> 1. **Hero:** Bento.me / Linear-style clean, spacious aesthetic featuring a bold centered headline, high-contrast pill CTA, and scattered floating interactive social media / comment / reaction cards.
> 2. **Navbar:** Dynamic Island-style morphing floating navbar (inspired by Smean/Linear) that smoothly transitions from an expansive rounded floating bar at top-of-page to a compact floating pill on scroll, with smooth `cubic-bezier(0.4,0,0.2,1)` transitions and **never sharp 90° corners**.

---

## 🎯 Master Prompt for AI / Frontend Engineer

```markdown
You are a Senior Principal Frontend Engineer and World-Class Product Designer (ex-Google, Bento.me, Linear).

Your mission is to redesign the KCMS (Khmer Content Moderation System) landing page (`LandingPage.tsx`) using the **"Floating Interactive Social Cards"** hero aesthetic with a **Scroll-Adaptive Morphing Floating Navbar**.

---

### 🎨 Strict Brand Color & Typography System
- **Primary Color:** `#00A99D` (Vibrant Teal / Jade) — **Core brand identity driving all primary UI elements:**
  - Primary Hero CTA Button: `bg-[#00A99D] hover:bg-[#008F85] text-white shadow-lg shadow-[#00A99D]/30`
  - Brand Mark & Logo Accent: `#00A99D`
  - Active Pills & Badges: `bg-[#00A99D]/10 text-[#00A99D] border border-[#00A99D]/20`
  - Focus & Hover Rings: `focus-visible:ring-[#00A99D] ring-offset-2`
  - Subtle Ambient Glow: `radial-gradient(ellipse at center, rgba(0, 169, 157, 0.12) 0%, transparent 70%)`

- **Typography System (Featuring Kantumruy Pro):**
  - **Khmer Font:** `'Kantumruy Pro'` (Loaded locally from `/flags/fonts/KantumruyPro-VariableFont_wght.ttf` and `/flags/fonts/KantumruyPro-Italic-VariableFont_wght.ttf`).
    - Applied to all Khmer comments, auto-replies, and headings for an ultra-modern editorial aesthetic.
    - Set `@font-face` in `styles.css`:
      ```css
      @font-face {
        font-family: 'Kantumruy Pro';
        src: url('/flags/fonts/KantumruyPro-VariableFont_wght.ttf') format('truetype');
        font-weight: 100 900;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Kantumruy Pro';
        src: url('/flags/fonts/KantumruyPro-Italic-VariableFont_wght.ttf') format('truetype');
        font-weight: 100 900;
        font-style: italic;
        font-display: swap;
      }
      ```
  - **Latin Font:** `'Google Sans Variable'`, `'Manrope Variable'`, or clean geometric sans-serif.
  - **Font Stack Hierarchy:** `'Kantumruy Pro', 'Google Sans Variable', 'Manrope Variable', system-ui, sans-serif`.

---

### 🛸 Morphing Floating Navbar (Scroll-Adaptive Pill Animation)

Implement a sticky/fixed navbar that smoothly morphs based on `window.scrollY > 20`:
> **CRITICAL RULE FOR CORNERS:** Never use sharp 90-degree corners (`rounded-none`). The navbar must always maintain smooth rounded corners (`rounded-full` or `rounded-2xl`) both when fully expanded at the top and when compact during scroll!

#### 1. State A: At Top (`scrollY <= 20`):
- **Outer Wrapper:**
  ```html
  <div class="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-3.5 sm:px-6 sm:pt-4 transition-[padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none">
  ```
- **Inner Nav Bar (Expanded Floating Squircle/Pill):**
  ```html
  <header class="pointer-events-auto flex items-center justify-between overflow-hidden backdrop-blur-md transition-[max-width,border-radius,padding,gap,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] w-full max-w-[76rem] gap-6 rounded-full border border-slate-200/85 bg-white/90 px-6 py-3.5 shadow-sm md:px-8">
  ```
- **Content:** Full brand mark with `#00A99D` accent, navigation links (`Product`, `How It Works`, `Pricing`, `Safety`), bilingual switcher (`ភាសាខ្មែរ` / `English`), sign in link, and `#00A99D` CTA button.

#### 2. State B: Scrolled (`scrollY > 20`):
- **Outer Wrapper:**
  ```html
  <div class="fixed top-0 inset-x-0 z-50 flex justify-center px-3 pt-2.5 sm:px-4 sm:pt-3 transition-[padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none">
  ```
- **Inner Nav Bar (Compact Floating Pill):**
  ```html
  <header class="pointer-events-auto flex items-center justify-between overflow-hidden backdrop-blur-md transition-[max-width,border-radius,padding,gap,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] w-full max-w-[64rem] gap-4 rounded-full border border-slate-200/95 bg-white/96 px-5 py-2.5 shadow-[0_10px_35px_-10px_rgba(0,169,157,0.16)] sm:px-6">
  ```
- **Content:** Streamlined logo mark, condensed single-line nav links with subtle hover underlines, compact bilingual icon, and vibrant `#00A99D` `Start Free` pill button.

#### 3. Strict Layout, Grouping & Focus Rules:
- **No Text Wrapping (`whitespace-nowrap`):** All `.brand`, `.nav-link`, `.language-toggle`, and `.button` elements MUST be strictly `whitespace-nowrap` and `flex-shrink-0` so link titles and actions NEVER wrap into multiple awkward lines.
- **Nav Groups Separation:**
  - `.nav-links-group`: Flex container for core anchor links (`#how-it-works`, `#responsible-moderation`, `#early-access`).
  - `.nav-actions-group`: Flex container for language toggle + auth buttons (`/sign-in`, `/sign-up`).
- **Brand Themed Focus Ring:** Never display heavy browser default or orange outlines. All interactive navbar controls must use `outline: 2px solid #00A99D; outline-offset: 2px;` on `:focus-visible`.
- **Responsive Breakpoint:** Use `1024px` for mobile drawer sheet navigation, ensuring desktop horizontal view is always spacious and never cramped.

---

### 🖼️ Hero Layout Hierarchy (Bento.me Centered Style)

1. **Centered Hero Typography (The Anchor):**
   - **Headline:** Large, bold, modern sans-serif in Kantumruy Pro / Google Sans:
     > *"Every Khmer Comment, Beautifully Moderated."* (or locale-synced heading)
   - **Narrative Subtitle:** Refined slate body text (`text-slate-600 max-w-xl mx-auto`):
     > *"Pairing instant dialect detection with 100% human-in-the-loop control to protect your Facebook Pages from scams, spam, and toxicity."*
   - **Centered Primary Pill CTA:** Bold, rounded-full pill button in primary `#00A99D`:
     > `rounded-full px-8 py-3.5 bg-[#00A99D] hover:bg-[#008F85] text-white font-semibold text-base shadow-lg shadow-[#00A99D]/30 hover:shadow-[#00A99D]/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto`

2. **Scattered Floating Cards Orbiting the Center:**
   Surround the centered text with 5–6 distinct, tilted, floating squircle cards (`rounded-3xl shadow-xl border border-slate-100/80 backdrop-blur-sm p-4`), each with subtle rotation angles (`-rotate-3`, `rotate-6`, `-rotate-6`, `rotate-4`) and gentle floating physics (`motion/react` or CSS `@keyframes float`):

   - **Card 1: Incoming Khmer Facebook Comment (Left - Top/Mid)**
     - *Visual:* Soft white/cream card with Facebook logo badge, user avatar, and sample Khmer comment styled in **Kantumruy Pro**: `"ចុចតំណនេះទទួលលុយ $500 ថ្ងៃនេះ!"` (Phishing scam sample).
     - *Badge:* Red pill tag `🚨 98% Scam Risk`.
     - *Action Button:* Small interactive pill button `[Hide Comment]`.
     - *Tilt:* `rotate-[-4deg]`.

    - **Card 2: Facebook Live Activity & Reactions (Left - Bottom)**
      - *Visual:* Soft pastel card integrating the live Facebook activity animation via `@lottiefiles/dotlottie-react` (`<DotLottieReact src="/animation/Facebookactivity.lottie" loop autoplay />`) alongside animated Lottie reaction emojis:
        - ❤️ Love: `<DotLottieReact src="/animation/Emojis - Love.lottie" loop autoplay />`
        - 👍 Like: `<DotLottieReact src="/animation/Emojis - Like.lottie" loop autoplay />`
        - 😡 Angry: `<DotLottieReact src="/animation/Angry Emoji.lottie" loop autoplay />`
      - *Interactive Element:* Clicking reactions triggers live counter increments (e.g., `❤️ Love · 1.4k`) with micro-bounce animations.
      - *Tilt:* `rotate-[-8deg]`.

   - **Card 3: Auto-Reply & Smart Assistant (Right - Top)**
     - *Visual:* Soft warm amber card with chat icon.
     - *Content:* Telegram/Facebook Messenger auto-reply bubble in **Kantumruy Pro**: `"សូមអរគុណ! ក្រុមការងារនឹងឆ្លើយតបឆាប់ៗនេះ"` ("Thank you! Our team will reply shortly").
     - *Pill Button:* `[Auto-Replied ✓]` in primary `#00A99D`.
     - *Tilt:* `rotate-[6deg]`.

   - **Card 4: Connected Social Channels Control (Right - Bottom)**
     - *Visual:* Soft cyan card with Facebook Page icon.
     - *Content:* `"Official Business Page"` with a live green pulsing beacon `🟢 Live Webhook · 0.3s sync`.
     - *Pill Button:* `[Connected]` pill button in primary `#00A99D` (`bg-[#00A99D] text-white`).
     - *Tilt:* `rotate-[3deg]`.

   - **Card 5: Human Verification Safeguard Badge (Floating Top / Accent)**
     - *Visual:* Minimalist yellow/gold support card with shield icon: `"100% Human-Approved Safeguard"`.
     - *Pill Button:* `[Verified Safe]` in primary `#00A99D` or deep indigo.

---

### ⚡ Interactive Behaviors & Animations
- **Navbar Scroll Morphing:** Driven by React scroll listener:
  ```tsx
  const [isScrolled, setIsScrolled] = useState(false)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  ```
- **Hero Card Floating Physics:** Use `motion/react` so each floating card sways up and down on offset loops (4s, 5s, 6s). Hovering straightens the tilt: `hover:rotate-0 hover:scale-105 hover:shadow-2xl transition-all duration-300`.
- **Lottie Activity Animation:** Use `@lottiefiles/dotlottie-react` with `src="/animation/Facebookactivity.lottie" loop autoplay` embedded inside the live reactions/activity floating card.

---

### 🛠 Tech Stack
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Primary Color:** `#00A99D`
- **Khmer Font:** `Kantumruy Pro` (`/flags/fonts/KantumruyPro-VariableFont_wght.ttf`)
- **Animation:** `motion` (`motion/react`) + `@lottiefiles/dotlottie-react`
- **Lottie Assets:** `/animation/Facebookactivity.lottie`
- **Internationalization:** Compatible with existing bilingual `copy.ts` (`en` and `km`).

---

### 📦 Output Deliverables
1. Complete, production-ready code for `LandingPage.tsx` with:
   - The morphing floating navbar (with rounded corners in all states).
   - The Bento floating cards hero section.
2. `@font-face` configuration for `Kantumruy Pro` in `styles.css`.
3. Modular floating card components (`FloatingCommentCard`, `FloatingReactionCard` with `DotLottieReact`, `FloatingChannelCard`, `FloatingReplyCard`, `FloatingTrustCard`).
```

---

## ⚡ Short / Quick-Paste Version

```markdown
Act as a Google / Bento.me Principal Frontend Designer. Redesign the KCMS landing page in `LandingPage.tsx` using React 19, TypeScript, and Tailwind CSS v4.

Brand Color & Typography:
- Primary Color: `#00A99D` (Vibrant Teal / Jade) for primary CTA buttons, badges, and glows.
- Font Family: 'Kantumruy Pro' (`/flags/fonts/KantumruyPro-VariableFont_wght.ttf`) for Khmer text alongside Google Sans for Latin text.

1. Morphing Floating Navbar (Scroll-Adaptive):
   - Never use sharp 90-degree corners (`rounded-none`). Always maintain smooth rounded-full pill corners!
   - Top State: Wide floating pill (`max-w-[76rem] rounded-full border border-slate-200/85 bg-white/90 px-6 py-3.5 backdrop-blur-md shadow-sm`).
   - Scrolled State (`scrollY > 20`): Morph smoothly into compact floating pill (`max-w-[64rem] rounded-full border border-slate-200/95 bg-white/96 px-5 py-2.5 shadow-[0_10px_35px_-10px_rgba(0,169,157,0.16)]`) with `transition-[max-width,padding,gap] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`.
   - Layout & Quality Rules: Strictly `whitespace-nowrap` on all nav links, brand, and buttons to prevent text wrapping. Group into `.nav-links-group` and `.nav-actions-group`. Use teal `outline: 2px solid #00A99D` focus rings.
   - Action CTA: `#00A99D` "Start Free" button.

2. Bento.me Floating Hero:
   - Centered headline in Kantumruy Pro / Google Sans: "Every Khmer Comment, Beautifully Moderated."
   - Primary Pill CTA button in `#00A99D`.
   - Floating cards orbiting the center with subtle tilts (-4deg, 6deg, -8deg):
     * Facebook comment in Khmer with "98% Scam" badge and interactive "[Hide]" button.
     * Facebook live activity card powered by `@lottiefiles/dotlottie-react` (`Facebookactivity.lottie`) with interactive animated Lottie emojis (`Emojis - Love.lottie`, `Emojis - Like.lottie`, `Angry Emoji.lottie`).
     * Connected Facebook Page card with live pulse indicator and "[Connected]" pill.
     * Automated reply card in Khmer with "[Auto-Replied ✓]" pill.
     * "100% Human-Approved Safeguard" trust badge.
```