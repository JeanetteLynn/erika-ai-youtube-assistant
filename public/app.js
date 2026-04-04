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
  1: { title: 'Step 1: Discover Your Why', subtitle: 'Your YouTube Why is the spark that makes you magnetic, memorable, and built to last.' },
  2: { title: 'Step 2: Define Your Niche', subtitle: 'Find the sweet spot where your passion, skills, and audience demand meet.' },
  3: { title: 'Step 3: True Fan Profiler', subtitle: 'Build a vivid, detailed picture of your ideal viewer — your True Fan.' },
  4: { title: 'Step 4: Mission Statement', subtitle: 'Distill everything into one powerful mission statement.' },
  5: { title: 'Step 5: Brand Blueprint', subtitle: 'Generate your personalized YouTube Brand Blueprint & Messaging Guide.' },
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
}

async function switchStep(step) {
  if (step === currentStep) return;
  currentStep = step;

  await api('/api/progress/step', { step, completedSteps });
  updateStepUI();
  loadConversation(step);
}

async function markStepComplete(step) {
  if (!completedSteps.includes(step)) {
    completedSteps.push(step);
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
  document.getElementById('send-btn').disabled = true;
  clearQuickReplies();

  // Show user message
  appendMessage('user', text);

  // Show typing indicator
  const typing = showTyping();

  try {
    const res = await api('/api/chat', { message: text, step: currentStep });
    typing.remove();
    appendMessage('assistant', res.message);

    // Check for step completion hints in the response
    if (res.message.includes('locked in') || res.message.includes('complete') || res.message.includes('Congratulations')) {
      if (res.message.includes('Step 2') || res.message.includes('Define Your Niche') || res.message.includes('Defining your Niche')) {
        markStepComplete(1);
      } else if (res.message.includes('Step 3') || res.message.includes('True Fan')) {
        markStepComplete(2);
      } else if (res.message.includes('Step 4') || res.message.includes('Mission')) {
        markStepComplete(3);
      } else if (res.message.includes('Step 5') || res.message.includes('Brand Blueprint')) {
        markStepComplete(4);
      } else if (res.message.includes('download') || res.message.includes('Download PDF')) {
        markStepComplete(5);
        showDownloadButtons();
      }
    }
  } catch (err) {
    typing.remove();
    appendMessage('assistant', 'Sorry, something went wrong. Please try again.');
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
}

function formatMessage(text) {
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

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(\s*<br>)?)+/g, (match) => {
    return '<ul>' + match.replace(/<br>/g, '') + '</ul>';
  });

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  // Progress indicator
  html = html.replace(/Question (\d+) of (\d+) ✓/g, (_, current, total) => {
    const pct = (parseInt(current) / parseInt(total) * 100).toFixed(0);
    return `<div style="margin-top:8px;font-size:0.85rem;color:#666">Question ${current} of ${total} ✓</div>
    <div class="progress-bar-container"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
  });

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
  return `
    <div class="pdf-document">
      <div class="pdf-header">
        <h1>YouTube Brand Blueprint</h1>
        <p>Prepared for ${m.userName || 'You'} by Erika Vieira</p>
      </div>

      <div class="pdf-section">
        <h2>Your Why Statement</h2>
        <p>${m.whyStatement || 'Complete Step 1 to generate your Why Statement.'}</p>
      </div>

      <div class="pdf-section">
        <h2>Your Defined Niche</h2>
        <p>${m.definedNiche || 'Complete Step 2 to define your niche.'}</p>
        ${m.nicheType ? `<p><strong>Type:</strong> ${m.nicheType}</p>` : ''}
      </div>

      <div class="pdf-section">
        <h2>Your True Fan</h2>
        <p><strong>True Fan Statement:</strong> ${m.trueFanStatement || 'Complete Step 3 to build your True Fan profile.'}</p>
        ${m.trueFanProfile ? `<p>${m.trueFanProfile}</p>` : ''}
      </div>

      <div class="pdf-section">
        <h2>Your Mission Statements</h2>
        ${m.missionBelief ? `<p><strong>Belief Version:</strong> ${m.missionBelief}</p>` : ''}
        ${m.missionShort ? `<p><strong>Short Intro:</strong> ${m.missionShort}</p>` : ''}
        ${m.missionMedium ? `<p><strong>About Section:</strong> ${m.missionMedium}</p>` : ''}
        ${m.missionBrand ? `<p><strong>Brand Positioning:</strong> ${m.missionBrand}</p>` : ''}
        ${m.missionCreative ? `<p><strong>Creative Version:</strong> ${m.missionCreative}</p>` : ''}
        ${!m.missionBelief ? '<p>Complete Step 4 to craft your mission statements.</p>' : ''}
      </div>

      ${m.videoIdeas ? `
      <div class="pdf-section">
        <h2>Your Top Video Ideas</h2>
        <p>${m.videoIdeas}</p>
      </div>` : ''}

      <div class="pdf-footer">
        Erika Vieira — YouTube Channel Producer & Strategist<br>
        erikavieira.net
      </div>
    </div>
  `;
}

function buildMessagingHTML(m) {
  return `
    <div class="pdf-document">
      <div class="pdf-header">
        <h1>YouTube Messaging Guide</h1>
        <p>Prepared for ${m.userName || 'You'} by Erika Vieira</p>
      </div>

      <div class="pdf-section">
        <h2>Channel Banner</h2>
        <p>${m.channelBanner || 'Complete Step 5 to generate your banner options.'}</p>
      </div>

      <div class="pdf-section">
        <h2>Channel Promise</h2>
        <p>${m.channelPromise || 'Complete Step 5 to generate your channel promise.'}</p>
      </div>

      <div class="pdf-section">
        <h2>Brand Blueprint Summary</h2>
        <p>${m.brandBlueprint || 'Complete Step 5 to generate your full blueprint.'}</p>
      </div>

      <div class="pdf-section">
        <h2>Messaging Guide</h2>
        <p>${m.messagingGuide || 'Complete Step 5 to generate your messaging guide.'}</p>
      </div>

      <div class="pdf-section">
        <h2>Upload Schedule</h2>
        <p>${m.uploadFrequency || 'Not yet defined'}</p>
      </div>

      <div class="pdf-footer">
        Erika Vieira — YouTube Channel Producer & Strategist<br>
        erikavieira.net
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
