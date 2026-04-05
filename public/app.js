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

function buildBlueprintHTML(m) {
  const name = m.userName || 'You';
  return `
    <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 700px; margin: 0 auto; padding: 40px 50px; color: #203B4F; line-height: 1.8; background: #fff;">

      <!-- Header with logo -->
      <div style="text-align: center; padding-bottom: 30px; margin-bottom: 30px; border-bottom: 3px solid #C9A77B;">
        <img src="/assets/erika-logo.png" alt="Erika Vieira" style="height: 50px; margin-bottom: 16px;" crossorigin="anonymous">
        <h1 style="font-family: Georgia, serif; font-size: 28px; color: #203B4F; margin: 0 0 6px 0; letter-spacing: 1px;">YouTube Brand Blueprint</h1>
        <p style="color: #C9A77B; font-size: 14px; font-style: italic; margin: 0;">Prepared exclusively for ${name}</p>
      </div>

      <!-- Why Statement -->
      <div style="margin-bottom: 32px; padding: 24px 20px; background: linear-gradient(135deg, #FBF8F5 0%, #f5ede6 100%); border-radius: 12px; border-left: 5px solid #C9A77B;">
        <h2 style="font-family: Georgia, serif; font-size: 18px; color: #C9A77B; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px; font-size: 13px;">Your Why Statement</h2>
        <p style="font-family: 'Nunito', Calibri, sans-serif; font-size: 16px; font-style: italic; margin: 0; line-height: 1.7;">"${m.whyStatement || 'Complete Step 1 to discover your Why.'}"</p>
      </div>

      <!-- Niche -->
      <div style="margin-bottom: 32px; padding: 24px 20px; background: #fff; border-radius: 12px; border: 1px solid #ede7e2;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #C9A77B; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">Your Defined Niche</h2>
        <p style="font-family: 'Nunito', Calibri, sans-serif; font-size: 15px; margin: 0 0 8px 0;">${m.definedNiche || 'Complete Step 2 to define your niche.'}</p>
        ${m.nicheType ? `<p style="font-family: 'Nunito', sans-serif; font-size: 13px; color: #999; margin: 0;"><strong>Creator Type:</strong> ${m.nicheType}</p>` : ''}
      </div>

      <!-- True Fan -->
      <div style="margin-bottom: 32px; padding: 24px 20px; background: linear-gradient(135deg, #FBF8F5 0%, #f0e4db 100%); border-radius: 12px; border-left: 5px solid #BF9476;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #BF9476; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">Your True Fan</h2>
        ${m.trueFanStatement ? `<p style="font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 700; margin: 0 0 12px 0;">${m.trueFanStatement}</p>` : ''}
        ${m.trueFanProfile ? `<p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0; line-height: 1.7; color: #444;">${m.trueFanProfile}</p>` : '<p style="font-family: sans-serif; font-size: 14px;">Complete Step 3 to build your True Fan profile.</p>'}
      </div>

      <!-- Mission Statements -->
      <div style="margin-bottom: 32px; padding: 24px 20px; background: #fff; border-radius: 12px; border: 1px solid #ede7e2;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #C9A77B; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 2px;">Your Mission Statements</h2>
        ${m.missionBelief ? `
          <div style="margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0ebe6;">
            <p style="font-family: 'Nunito', sans-serif; font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">A — Belief Version</p>
            <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0;">${m.missionBelief}</p>
          </div>` : ''}
        ${m.missionShort ? `
          <div style="margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0ebe6;">
            <p style="font-family: 'Nunito', sans-serif; font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">B — Short Intro (for bios &amp; intros)</p>
            <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0;">${m.missionShort}</p>
          </div>` : ''}
        ${m.missionMedium ? `
          <div style="margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0ebe6;">
            <p style="font-family: 'Nunito', sans-serif; font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">C — About Section</p>
            <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0;">${m.missionMedium}</p>
          </div>` : ''}
        ${m.missionBrand ? `
          <div style="margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0ebe6;">
            <p style="font-family: 'Nunito', sans-serif; font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">D — Brand Positioning</p>
            <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0;">${m.missionBrand}</p>
          </div>` : ''}
        ${m.missionCreative ? `
          <div style="margin-bottom: 14px;">
            <p style="font-family: 'Nunito', sans-serif; font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">E — Creative / Unique</p>
            <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0; font-style: italic;">${m.missionCreative}</p>
          </div>` : ''}
        ${!m.missionBelief ? '<p style="font-family: sans-serif; font-size: 14px;">Complete Step 4 to craft your mission statements.</p>' : ''}
      </div>

      ${m.videoIdeas ? `
      <!-- Video Ideas -->
      <div style="margin-bottom: 32px; padding: 24px 20px; background: linear-gradient(135deg, #FBF8F5 0%, #f5ede6 100%); border-radius: 12px; border-left: 5px solid #CD3F42;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #CD3F42; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">Your Top Video Ideas</h2>
        <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0; line-height: 1.8;">${m.videoIdeas}</p>
      </div>` : ''}

      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 2px solid #C9A77B;">
        <img src="/assets/erika-logo.png" alt="Erika Vieira" style="height: 35px; margin-bottom: 8px; opacity: 0.6;" crossorigin="anonymous">
        <p style="color: #C9A77B; font-size: 12px; font-style: italic; margin: 0;">Erika Vieira — YouTube Channel Producer &amp; Strategist</p>
        <p style="color: #999; font-size: 11px; margin: 4px 0 0 0;">erikavieira.net</p>
      </div>
    </div>
  `;
}

function buildMessagingHTML(m) {
  const name = m.userName || 'You';
  return `
    <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 700px; margin: 0 auto; padding: 40px 50px; color: #203B4F; line-height: 1.8; background: #fff;">

      <!-- Header with logo -->
      <div style="text-align: center; padding-bottom: 30px; margin-bottom: 30px; border-bottom: 3px solid #C9A77B;">
        <img src="/assets/erika-logo.png" alt="Erika Vieira" style="height: 50px; margin-bottom: 16px;" crossorigin="anonymous">
        <h1 style="font-family: Georgia, serif; font-size: 28px; color: #203B4F; margin: 0 0 6px 0; letter-spacing: 1px;">YouTube Messaging Guide</h1>
        <p style="color: #C9A77B; font-size: 14px; font-style: italic; margin: 0;">Prepared exclusively for ${name}</p>
      </div>

      <!-- Channel Banner -->
      <div style="margin-bottom: 28px; padding: 24px 20px; background: linear-gradient(135deg, #203B4F 0%, #2d5068 100%); border-radius: 12px; text-align: center;">
        <p style="font-family: 'Nunito', sans-serif; font-size: 11px; color: #C9A77B; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Your Channel Banner</p>
        <p style="font-family: Georgia, serif; font-size: 20px; color: #fff; margin: 0; font-style: italic;">"${m.channelBanner || 'Complete Step 5'}"</p>
      </div>

      <!-- Channel Promise -->
      <div style="margin-bottom: 28px; padding: 24px 20px; background: linear-gradient(135deg, #FBF8F5 0%, #f5ede6 100%); border-radius: 12px; border-left: 5px solid #C9A77B;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #C9A77B; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">Channel Promise</h2>
        <p style="font-family: 'Nunito', sans-serif; font-size: 15px; margin: 0; line-height: 1.7;">${m.channelPromise || 'Complete Step 5 to generate your channel promise.'}</p>
      </div>

      <!-- Video Intros -->
      ${m.videoIntroScripts ? `
      <div style="margin-bottom: 28px; padding: 24px 20px; background: #fff; border-radius: 12px; border: 1px solid #ede7e2;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #BF9476; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">Video Intro Scripts</h2>
        <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.videoIntroScripts}</p>
      </div>` : ''}

      <!-- About Section -->
      ${m.aboutSection ? `
      <div style="margin-bottom: 28px; padding: 24px 20px; background: linear-gradient(135deg, #FBF8F5 0%, #f0e4db 100%); border-radius: 12px; border-left: 5px solid #BF9476;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #BF9476; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">About Section Copy</h2>
        <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0; line-height: 1.7;">${m.aboutSection}</p>
      </div>` : ''}

      <!-- Messaging Pillars -->
      ${m.messagingPillars ? `
      <div style="margin-bottom: 28px; padding: 24px 20px; background: #fff; border-radius: 12px; border: 1px solid #ede7e2;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #C9A77B; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">Messaging Pillars</h2>
        <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.messagingPillars}</p>
      </div>` : ''}

      <!-- Power Words -->
      ${m.powerWords ? `
      <div style="margin-bottom: 28px; padding: 24px 20px; background: linear-gradient(135deg, #FBF8F5 0%, #f5ede6 100%); border-radius: 12px; border-left: 5px solid #CD3F42;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #CD3F42; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">Power Words &amp; Phrases</h2>
        <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.powerWords}</p>
      </div>` : ''}

      <!-- Taglines -->
      ${m.taglines ? `
      <div style="margin-bottom: 28px; padding: 24px 20px; background: #fff; border-radius: 12px; border: 1px solid #ede7e2;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #C9A77B; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">Taglines &amp; Signature Phrases</h2>
        <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.taglines}</p>
      </div>` : ''}

      <!-- What Not to Say -->
      ${m.whatNotToSay ? `
      <div style="margin-bottom: 28px; padding: 24px 20px; background: linear-gradient(135deg, #fff5f5 0%, #fef0f0 100%); border-radius: 12px; border-left: 5px solid #CD3F42;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #CD3F42; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">What Not to Say</h2>
        <p style="font-family: 'Nunito', sans-serif; font-size: 14px; margin: 0; line-height: 1.8; white-space: pre-line;">${m.whatNotToSay}</p>
      </div>` : ''}

      <!-- Upload Frequency -->
      <div style="margin-bottom: 28px; padding: 24px 20px; background: #fff; border-radius: 12px; border: 1px solid #ede7e2;">
        <h2 style="font-family: Georgia, serif; font-size: 13px; color: #C9A77B; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">Upload Schedule</h2>
        <p style="font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 700; margin: 0;">${m.uploadFrequency || 'Not yet defined'}</p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 2px solid #C9A77B;">
        <img src="/assets/erika-logo.png" alt="Erika Vieira" style="height: 35px; margin-bottom: 8px; opacity: 0.6;" crossorigin="anonymous">
        <p style="color: #C9A77B; font-size: 12px; font-style: italic; margin: 0;">Erika Vieira — YouTube Channel Producer &amp; Strategist</p>
        <p style="color: #999; font-size: 11px; margin: 4px 0 0 0;">erikavieira.net</p>
      </div>
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
