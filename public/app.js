// =====================================================
// AI YouTube Assistant — Frontend Application
// =====================================================

const API = '';  // Same origin
let token = localStorage.getItem('token');
let user = null;
let currentStep = 1;
let completedSteps = [];
let isLoading = false;

const stepInfo = {
  1: { title: 'Step 1: Discover Your Why', subtitle: 'Your YouTube Why is the spark that makes you magnetic, memorable, and built to last.', totalQuestions: 22 },
  2: { title: 'Step 2: Define Your Niche', subtitle: 'Find the sweet spot where your passion, skills, and audience demand meet.', totalQuestions: 15 },
  3: { title: 'Step 3: True Fan Profiler', subtitle: 'Build a vivid, detailed picture of your ideal viewer — your True Fan.', totalQuestions: 29 },
  4: { title: 'Step 4: Mission Statement', subtitle: 'Distill everything into one powerful mission statement.', totalQuestions: 5 },
  5: { title: 'Step 5: Brand Blueprint', subtitle: 'Generate your personalized YouTube Brand Blueprint & Messaging Guide.', totalQuestions: 10 },
};

// =====================================================
// Initialization
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  setupAuthUI();
  setupChatUI();
  setupSidebar();
  setupDocumentsModal();

  if (token) {
    checkAuth();
  }
});

// =====================================================
// Auth
// =====================================================

function setupAuthUI() {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
    });
  });

  // Login
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';

    try {
      const res = await api('/api/auth/login', { email, password });
      token = res.token;
      user = res.user;
      localStorage.setItem('token', token);
      showApp();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  // Register
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errEl = document.getElementById('register-error');
    errEl.textContent = '';

    try {
      const res = await api('/api/auth/register', { name, email, password });
      token = res.token;
      user = res.user;
      localStorage.setItem('token', token);
      showApp();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await api('/api/auth/logout', {}); } catch {}
    token = null;
    user = null;
    localStorage.removeItem('token');
    showAuth();
  });
}

async function checkAuth() {
  try {
    const res = await api('/api/auth/me', {});
    user = res.user;
    showApp();
  } catch {
    token = null;
    localStorage.removeItem('token');
    showAuth();
  }
}

function showAuth() {
  document.getElementById('auth-screen').classList.add('active');
  document.getElementById('app-screen').classList.remove('active');
}

function showApp() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  document.getElementById('user-name').textContent = user.name;
  loadProgress();
}

// =====================================================
// Progress & Steps
// =====================================================

async function loadProgress() {
  try {
    const res = await api('/api/progress', null, 'GET');
    currentStep = res.step;
    completedSteps = res.completedSteps || [];
    updateStepUI();
    loadConversation(currentStep);
  } catch (err) {
    console.error('Failed to load progress:', err);
  }
}

function updateStepUI() {
  // Update sidebar
  document.querySelectorAll('.step-item').forEach(item => {
    const step = parseInt(item.dataset.step);
    item.classList.remove('active', 'completed');
    if (step === currentStep) item.classList.add('active');
    if (completedSteps.includes(step)) item.classList.add('completed');
  });

  // Update header
  const info = stepInfo[currentStep];
  document.getElementById('step-title').textContent = info.title;
  document.getElementById('step-subtitle').textContent = info.subtitle;

  // Update progress bar
  updateProgressBar();
}

function updateProgressBar() {
  const info = stepInfo[currentStep];
  // Count user messages in the current chat as a proxy for questions answered
  const userMessages = document.querySelectorAll('#chat-messages .message.user').length;
  const pct = Math.min(Math.round((userMessages / info.totalQuestions) * 100), 100);
  const fill = document.getElementById('step-progress-fill');
  if (fill) fill.style.width = pct + '%';
}

async function switchStep(step) {
  if (step === currentStep) return;
  currentStep = step;

  await api('/api/progress/step', { step, completedSteps });
  updateStepUI();
  loadConversation(step);
}

async function markStepComplete(completedStep) {
  if (!completedSteps.includes(completedStep)) {
    completedSteps.push(completedStep);
    // Save completed steps but DON'T change the user's current step position
    await api('/api/progress/step', { step: currentStep, completedSteps });
    updateStepUI();
  }
}

// =====================================================
// Sidebar
// =====================================================

function setupSidebar() {
  // Step navigation
  document.querySelectorAll('.step-item').forEach(item => {
    item.addEventListener('click', () => {
      const step = parseInt(item.dataset.step);
      switchStep(step);
      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  // Mobile toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Close sidebar on chat area click (mobile)
  document.getElementById('chat-area').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });
}

// =====================================================
// Chat
// =====================================================

function setupChatUI() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg || isLoading) return;
    sendMessage(msg);
    input.value = '';
    input.style.height = 'auto';
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
  });

  // Enter to send (Shift+Enter for newline)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit'));
    }
  });
}

async function loadConversation(step) {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  clearQuickReplies();

  try {
    const res = await api(`/api/conversations/${step}`, null, 'GET');
    if (res.messages && res.messages.length > 0) {
      res.messages.forEach(msg => {
        appendMessage(msg.role, msg.content, false);
      });
    } else {
      // Start conversation with an empty message to trigger intro
      sendMessage("Hi! I'm ready to start.");
    }
  } catch (err) {
    console.error('Failed to load conversation:', err);
  }
}

async function sendMessage(text) {
  if (isLoading) return;
  isLoading = true;

  // CRITICAL: Capture the step at send time to prevent race conditions.
  // Without this, async responses can arrive after currentStep has changed
  // (e.g., from a progress reload), causing messages to route to wrong steps.
  const stepAtSendTime = currentStep;

  document.getElementById('send-btn').disabled = true;
  clearQuickReplies();

  // Show user message
  appendMessage('user', text);

  // Show typing indicator
  const typing = showTyping();

  try {
    const res = await api('/api/chat', { message: text, step: stepAtSendTime });
    typing.remove();

    // Only append if we're still on the same step
    if (currentStep === stepAtSendTime) {
      appendMessage('assistant', res.message);
    }

    // Check for step completion — ONLY mark the step we sent to
    const msg = res.message;
    const handoffPatterns = {
      1: /(?:move on to|head to|click|ready for).*(?:Step 2|Define Your Niche|Defining your Niche)/i,
      2: /(?:move on to|head to|click|ready for).*(?:Step 3|True Fan Profiler)/i,
      3: /(?:move on to|head to|click|ready for).*(?:Step 4|Mission Statement)/i,
      4: /(?:move on to|head to|click|ready for).*(?:Step 5|Brand Blueprint)/i,
      5: /(?:download|Download PDF|documents are complete)/i,
    };
    const pattern = handoffPatterns[stepAtSendTime];
    if (pattern && pattern.test(msg)) {
      markStepComplete(stepAtSendTime);
      if (stepAtSendTime === 5) showDownloadButtons();
    }
  } catch (err) {
    typing.remove();
    if (currentStep === stepAtSendTime) {
      appendMessage('assistant', 'Sorry, something went wrong. Please try again.');
    }
    console.error('Chat error:', err);
  }

  isLoading = false;
  document.getElementById('send-btn').disabled = false;
}

function appendMessage(role, content, scroll = true) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = formatMessage(content);
  div.appendChild(bubble);

  container.appendChild(div);
  if (scroll) container.scrollTop = container.scrollHeight;
  updateProgressBar();
}

function formatMessage(text) {
  if (!text) return '';
  // Convert markdown-like formatting to HTML
  let html = text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Bullet lists
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines
    .replace(/\n/g, '<br>');

  // Wrap in paragraph
  html = '<p>' + html + '</p>';

  // Wrap consecutive numbered <li> in <ol>, bullets in <ul>
  // First handle numbered lists (1. 2. 3. etc)
  html = html.replace(/(<li>[\s\S]*?<\/li>(\s*<br>)*)+/g, (match) => {
    const cleaned = match.replace(/<br>/g, '');
    // Check if the original text had numbered items
    if (/^\d+\.\s/.test(match.replace(/<\/?li>/g, '').trim())) {
      return '<ol>' + cleaned + '</ol>';
    }
    return '<ul>' + cleaned + '</ul>';
  });

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function showTyping() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function clearQuickReplies() {
  document.getElementById('quick-replies').innerHTML = '';
}

function showQuickReply(text) {
  const container = document.getElementById('quick-replies');
  const btn = document.createElement('button');
  btn.className = 'quick-reply';
  btn.textContent = text;
  btn.addEventListener('click', () => {
    sendMessage(text);
  });
  container.appendChild(btn);
}

function showDownloadButtons() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message assistant';
  div.innerHTML = `
    <div class="message-bubble" style="display:flex;gap:12px;flex-wrap:wrap;">
      <button class="btn btn-download" onclick="generatePDF('blueprint')">📄 Download Brand Blueprint</button>
      <button class="btn btn-download" onclick="generatePDF('messaging')">📄 Download Messaging Guide</button>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// =====================================================
// PDF Generation
// =====================================================

async function generatePDF(type) {
  // Get memory to populate the PDF
  const res = await api('/api/memory', null, 'GET');
  const memory = res.memory || {};

  let html;
  if (type === 'blueprint') {
    html = buildBlueprintHTML(memory);
  } else {
    html = buildMessagingHTML(memory);
  }

  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  // Generate PDF
  const opt = {
    margin: [0.5, 0.6],
    filename: type === 'blueprint' ? 'YouTube-Brand-Blueprint.pdf' : 'YouTube-Messaging-Guide.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
  };

  await html2pdf().set(opt).from(container).save();
  document.body.removeChild(container);
}

function pdfPageStyles() {
  return `
    <style>
      .pdf-page { position: relative; font-family: 'Nunito', Calibri, sans-serif; color: #203B4F; line-height: 1.7; padding: 50px 55px 80px; max-width: 700px; margin: 0 auto; background: #fff; }
      .pdf-page::after { content: ''; position: absolute; bottom: 0; left: 55px; right: 55px; height: 50px; display: flex; align-items: center; }
      .pdf-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; width: 400px; pointer-events: none; z-index: 0; }
      .pdf-footer { position: absolute; bottom: 18px; left: 55px; right: 55px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #BF9476; border-top: 1px solid #ede7e2; padding-top: 10px; }
      .pdf-section-label { font-family: Georgia, serif; font-size: 11px; color: #C9A77B; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; font-weight: 400; }
      .pdf-section-label-alt { font-family: Georgia, serif; font-size: 11px; color: #BF9476; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; font-weight: 400; }
      .pdf-card { margin-bottom: 28px; padding: 22px 20px; border-radius: 10px; position: relative; z-index: 1; }
      .pdf-card-warm { background: linear-gradient(135deg, #FBF8F5 0%, #f5ede6 100%); border-left: 4px solid #C9A77B; }
      .pdf-card-plain { background: #fff; border: 1px solid #ede7e2; }
      .pdf-card-tan { background: linear-gradient(135deg, #FBF8F5 0%, #f0e4db 100%); border-left: 4px solid #BF9476; }
      .pdf-card-red { background: linear-gradient(135deg, #FBF8F5 0%, #f5ede6 100%); border-left: 4px solid #CD3F42; }
      .pdf-mission-label { font-size: 10px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0; }
      .pdf-mission-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0ebe6; }
      .pdf-mission-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    </style>`;
}

function pdfFooter(docTitle) {
  return `<div class="pdf-footer"><span>${docTitle}</span><span>Erika Vieira &mdash; YouTube Channel Producer &amp; Strategist &mdash; erikavieira.net</span></div>`;
}

function buildBlueprintHTML(m) {
  const name = m.userName || 'You';
  return `
    ${pdfPageStyles()}

    <!-- PAGE 1: INTRO / COVER -->
    <div class="pdf-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 750px;">
      <img src="/assets/erika-logo.png" alt="Erika Vieira" style="height: 55px; margin-bottom: 24px;" crossorigin="anonymous">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">
      <h1 style="font-family: Georgia, serif; font-size: 32px; color: #203B4F; margin: 0 0 8px 0; letter-spacing: 1px;">YouTube Brand Blueprint</h1>
      <div style="width: 60px; height: 3px; background: #C9A77B; margin: 0 auto 20px;"></div>
      <p style="font-size: 16px; color: #666; margin: 0 0 32px 0;">Prepared exclusively for <strong style="color: #203B4F;">${name}</strong></p>
      <div style="max-width: 440px; margin: 0 auto;">
        <p style="font-size: 14px; color: #666; line-height: 1.8;">This blueprint is the foundation of your YouTube brand. Inside you will find your Why Statement, your defined niche, your True Fan profile, your mission statements, and your top video ideas. Everything here was built from YOUR story, YOUR voice, and YOUR vision.</p>
        <p style="font-size: 14px; color: #666; line-height: 1.8; margin-top: 16px;">Use this document every time you plan content, write a description, update your channel, or pitch a collaboration. This is your north star.</p>
      </div>
      ${pdfFooter('YouTube Brand Blueprint')}
    </div>

    <!-- PAGE 2+: CONTENT -->
    <div class="pdf-page">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">

      <!-- Why Statement -->
      <div class="pdf-card pdf-card-warm">
        <p class="pdf-section-label">Your Why Statement</p>
        <p style="font-size: 16px; font-style: italic; margin: 0; line-height: 1.7;">"${m.whyStatement || 'Complete Step 1 to discover your Why.'}"</p>
      </div>

      <!-- Niche -->
      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label">Your Defined Niche</p>
        <p style="font-size: 15px; margin: 0 0 6px 0;">${m.definedNiche || 'Complete Step 2 to define your niche.'}</p>
        ${m.nicheType ? `<p style="font-size: 12px; color: #999; margin: 0;"><strong>Creator Type:</strong> ${m.nicheType}</p>` : ''}
      </div>

      <!-- True Fan -->
      <div class="pdf-card pdf-card-tan">
        <p class="pdf-section-label-alt">Your True Fan</p>
        ${m.trueFanStatement ? `<p style="font-size: 15px; font-weight: 700; margin: 0 0 10px 0;">${m.trueFanStatement}</p>` : ''}
        ${m.trueFanProfile ? `<p style="font-size: 13px; margin: 0; line-height: 1.7; color: #444;">${m.trueFanProfile}</p>` : '<p style="font-size: 14px;">Complete Step 3 to build your True Fan profile.</p>'}
      </div>

      <!-- Mission Statements -->
      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label">Your Mission Statements</p>
        ${m.missionBelief ? `<div class="pdf-mission-item"><p class="pdf-mission-label">A &mdash; Belief Version</p><p style="font-size: 14px; margin: 0;">${m.missionBelief}</p></div>` : ''}
        ${m.missionShort ? `<div class="pdf-mission-item"><p class="pdf-mission-label">B &mdash; Short Intro</p><p style="font-size: 14px; margin: 0;">${m.missionShort}</p></div>` : ''}
        ${m.missionMedium ? `<div class="pdf-mission-item"><p class="pdf-mission-label">C &mdash; About Section</p><p style="font-size: 14px; margin: 0;">${m.missionMedium}</p></div>` : ''}
        ${m.missionBrand ? `<div class="pdf-mission-item"><p class="pdf-mission-label">D &mdash; Brand Positioning</p><p style="font-size: 14px; margin: 0;">${m.missionBrand}</p></div>` : ''}
        ${m.missionCreative ? `<div class="pdf-mission-item"><p class="pdf-mission-label">E &mdash; Creative / Unique</p><p style="font-size: 14px; margin: 0; font-style: italic;">${m.missionCreative}</p></div>` : ''}
        ${!m.missionBelief ? '<p style="font-size: 14px;">Complete Step 4 to craft your mission statements.</p>' : ''}
      </div>

      ${m.videoIdeas ? `
      <div class="pdf-card pdf-card-red">
        <p style="font-family: Georgia, serif; font-size: 11px; color: #CD3F42; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Your Top Video Ideas</p>
        <p style="font-size: 14px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.videoIdeas}</p>
      </div>` : ''}

      ${pdfFooter('YouTube Brand Blueprint')}
    </div>

    <!-- LAST PAGE: CTA -->
    <div class="pdf-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 750px;">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">
      <img src="https://erikavieira.net/wp-content/uploads/2023/06/Erika-Home-Hero-6.png" alt="Erika Vieira" style="width: 180px; height: 180px; border-radius: 50%; object-fit: cover; object-position: center top; margin-bottom: 24px; border: 4px solid #C9A77B;" crossorigin="anonymous">
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #203B4F; margin: 0 0 12px 0;">Ready to Bring This Blueprint to Life?</h2>
      <div style="width: 40px; height: 3px; background: #C9A77B; margin: 0 auto 20px;"></div>
      <p style="font-size: 14px; color: #666; line-height: 1.8; max-width: 420px; margin: 0 auto 24px;">Your brand foundation is set. Now it is time to build the channel. Inside the <strong style="color: #203B4F;">Zero to Influence YouTube Bootcamp</strong>, I will walk you through everything: content strategy, thumbnails, growth systems, monetization, and the mindset to keep going when it gets hard.</p>
      <a href="https://masterclass.erikavieira.net/bootcamp-waitlist" style="display: inline-block; background: #CD3F42; color: #fff; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 30px; text-decoration: none; letter-spacing: 0.5px;">JOIN THE BOOTCAMP WAITLIST &rarr;</a>
      <div style="margin-top: 32px;">
        <p style="font-size: 12px; color: #BF9476; margin: 0 0 4px 0;">Follow Erika</p>
        <p style="font-size: 12px; color: #666; margin: 0;">Instagram: @youryoutubecoach &bull; YouTube: @YourYouTubeCoach</p>
        <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Podcast: The YouTube Power Hour</p>
      </div>
      ${pdfFooter('YouTube Brand Blueprint')}
    </div>
  `;
}

function buildMessagingHTML(m) {
  const name = m.userName || 'You';
  return `
    ${pdfPageStyles()}

    <!-- PAGE 1: INTRO / COVER -->
    <div class="pdf-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 750px;">
      <img src="/assets/erika-logo.png" alt="Erika Vieira" style="height: 55px; margin-bottom: 24px;" crossorigin="anonymous">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">
      <h1 style="font-family: Georgia, serif; font-size: 32px; color: #203B4F; margin: 0 0 8px 0; letter-spacing: 1px;">YouTube Messaging Guide</h1>
      <div style="width: 60px; height: 3px; background: #C9A77B; margin: 0 auto 20px;"></div>
      <p style="font-size: 16px; color: #666; margin: 0 0 32px 0;">Prepared exclusively for <strong style="color: #203B4F;">${name}</strong></p>
      <div style="max-width: 440px; margin: 0 auto;">
        <p style="font-size: 14px; color: #666; line-height: 1.8;">This guide is your messaging toolkit. It contains your video intros, channel banner copy, about section, messaging pillars, power words, taglines, and everything you need to speak directly to your True Fan every single time you create.</p>
        <p style="font-size: 14px; color: #666; line-height: 1.8; margin-top: 16px;">Keep this document open when you write titles, descriptions, emails, and social posts. Consistency builds trust, and trust builds a community.</p>
      </div>
      ${pdfFooter('YouTube Messaging Guide')}
    </div>

    <!-- PAGE 2+: CONTENT -->
    <div class="pdf-page">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">

      <!-- Channel Banner -->
      <div style="margin-bottom: 28px; padding: 28px 24px; background: linear-gradient(135deg, #203B4F 0%, #2d5068 100%); border-radius: 10px; text-align: center;">
        <p style="font-size: 10px; color: #C9A77B; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Your Channel Banner</p>
        <p style="font-family: Georgia, serif; font-size: 20px; color: #fff; margin: 0; font-style: italic;">"${m.channelBanner || 'Complete Step 5'}"</p>
      </div>

      <!-- Channel Promise -->
      <div class="pdf-card pdf-card-warm">
        <p class="pdf-section-label">Channel Promise</p>
        <p style="font-size: 15px; margin: 0; line-height: 1.7;">${m.channelPromise || 'Complete Step 5 to generate your channel promise.'}</p>
      </div>

      ${m.videoIntroScripts ? `
      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label-alt">Video Intro Scripts</p>
        <p style="font-size: 13px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.videoIntroScripts}</p>
      </div>` : ''}

      ${m.aboutSection ? `
      <div class="pdf-card pdf-card-tan">
        <p class="pdf-section-label-alt">About Section Copy</p>
        <p style="font-size: 13px; margin: 0; line-height: 1.7;">${m.aboutSection}</p>
      </div>` : ''}

      ${pdfFooter('YouTube Messaging Guide')}
    </div>

    <!-- PAGE 3: MORE CONTENT -->
    <div class="pdf-page">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">

      ${m.messagingPillars ? `
      <div class="pdf-card pdf-card-warm">
        <p class="pdf-section-label">Messaging Pillars</p>
        <p style="font-size: 13px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.messagingPillars}</p>
      </div>` : ''}

      ${m.powerWords ? `
      <div class="pdf-card pdf-card-red">
        <p style="font-family: Georgia, serif; font-size: 11px; color: #CD3F42; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Power Words &amp; Phrases</p>
        <p style="font-size: 13px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.powerWords}</p>
      </div>` : ''}

      ${m.taglines ? `
      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label">Taglines &amp; Signature Phrases</p>
        <p style="font-size: 13px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.taglines}</p>
      </div>` : ''}

      ${m.whatNotToSay ? `
      <div style="margin-bottom: 28px; padding: 22px 20px; background: linear-gradient(135deg, #fff5f5 0%, #fef0f0 100%); border-radius: 10px; border-left: 4px solid #CD3F42; position: relative; z-index: 1;">
        <p style="font-family: Georgia, serif; font-size: 11px; color: #CD3F42; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">What Not to Say</p>
        <p style="font-size: 13px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.whatNotToSay}</p>
      </div>` : ''}

      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label">Upload Schedule</p>
        <p style="font-size: 15px; font-weight: 700; margin: 0;">${m.uploadFrequency || 'Not yet defined'}</p>
      </div>

      ${pdfFooter('YouTube Messaging Guide')}
    </div>

    <!-- LAST PAGE: CTA -->
    <div class="pdf-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 750px;">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">
      <img src="https://erikavieira.net/wp-content/uploads/2023/06/Erika-Home-Hero-6.png" alt="Erika Vieira" style="width: 180px; height: 180px; border-radius: 50%; object-fit: cover; object-position: center top; margin-bottom: 24px; border: 4px solid #C9A77B;" crossorigin="anonymous">
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #203B4F; margin: 0 0 12px 0;">Your Words Are Ready. Your Channel Is Waiting.</h2>
      <div style="width: 40px; height: 3px; background: #C9A77B; margin: 0 auto 20px;"></div>
      <p style="font-size: 14px; color: #666; line-height: 1.8; max-width: 420px; margin: 0 auto 24px;">You have the blueprint. You have the words. Now it is time to hit record. Inside the <strong style="color: #203B4F;">Zero to Influence YouTube Bootcamp</strong>, I will help you build, grow, and monetize a channel that changes lives, starting with yours.</p>
      <a href="https://masterclass.erikavieira.net/bootcamp-waitlist" style="display: inline-block; background: #CD3F42; color: #fff; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 30px; text-decoration: none; letter-spacing: 0.5px;">JOIN THE BOOTCAMP WAITLIST &rarr;</a>
      <div style="margin-top: 32px;">
        <p style="font-size: 12px; color: #BF9476; margin: 0 0 4px 0;">Follow Erika</p>
        <p style="font-size: 12px; color: #666; margin: 0;">Instagram: @youryoutubecoach &bull; YouTube: @YourYouTubeCoach</p>
        <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Podcast: The YouTube Power Hour</p>
      </div>
      ${pdfFooter('YouTube Messaging Guide')}
    </div>
  `;
}

// =====================================================
// Documents Modal
// =====================================================

function setupDocumentsModal() {
  const modal = document.getElementById('documents-modal');
  const btn = document.getElementById('my-documents-btn');
  const close = modal.querySelector('.modal-close');

  btn.addEventListener('click', async () => {
    modal.classList.add('active');
    await loadDocuments();
  });

  close.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

async function loadDocuments() {
  const container = document.getElementById('documents-list');
  try {
    const memory = (await api('/api/memory', null, 'GET')).memory || {};
    const hasBlueprint = memory.whyStatement && memory.definedNiche;
    const hasMessaging = memory.brandBlueprint || memory.messagingGuide;

    if (!hasBlueprint && !hasMessaging) {
      container.innerHTML = '<p class="empty-state">Complete the steps to generate your Brand Blueprint and Messaging Guide.</p>';
      return;
    }

    container.innerHTML = '';

    if (hasBlueprint) {
      container.innerHTML += `
        <div class="document-card">
          <h4>YouTube Brand Blueprint</h4>
          <p>Your Why, Niche, True Fan, and Mission Statements</p>
          <div class="document-actions">
            <button class="btn btn-download" onclick="generatePDF('blueprint')">Download PDF</button>
          </div>
        </div>
      `;
    }

    if (hasMessaging) {
      container.innerHTML += `
        <div class="document-card">
          <h4>YouTube Messaging Guide</h4>
          <p>Intros, Banner, About Section, Pillars, Power Words, and More</p>
          <div class="document-actions">
            <button class="btn btn-download" onclick="generatePDF('messaging')">Download PDF</button>
          </div>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load documents.</p>';
  }
}

// =====================================================
// API Helper
// =====================================================

async function api(path, body, method = 'POST') {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}
