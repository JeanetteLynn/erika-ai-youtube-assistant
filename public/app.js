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
      <button class="btn btn-download" onclick="previewPDF('blueprint')">Preview Brand Blueprint</button>
      <button class="btn btn-download" onclick="previewPDF('messaging')">Preview Messaging Guide</button>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// =====================================================
// PDF Generation
// =====================================================

async function previewPDF(type) {
  const res = await api('/api/memory', null, 'GET');
  const memory = res.memory || {};

  const html = type === 'blueprint' ? buildBlueprintHTML(memory) : buildMessagingHTML(memory);
  const title = type === 'blueprint' ? 'YouTube Brand Blueprint' : 'YouTube Messaging Guide';
  const filename = type === 'blueprint' ? 'YouTube-Brand-Blueprint.pdf' : 'YouTube-Messaging-Guide.pdf';

  // Build preview modal
  const overlay = document.createElement('div');
  overlay.id = 'pdf-preview-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(32,59,79,0.7);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;max-width:820px;width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:1px solid #ede7e2;flex-shrink:0;">
        <h3 style="font-size:1.1rem;font-weight:800;color:#203B4F;margin:0;">${title} — Preview</h3>
        <div style="display:flex;gap:10px;align-items:center;">
          <button onclick="downloadPDF('${type}')" class="btn btn-primary" style="font-size:0.85rem;padding:10px 24px;">Download Full PDF</button>
          <button onclick="document.getElementById('pdf-preview-overlay').remove()" style="background:none;border:none;font-size:1.5rem;color:#999;cursor:pointer;padding:4px 8px;">&times;</button>
        </div>
      </div>
      <div style="overflow-y:auto;padding:24px;" id="pdf-preview-content">
        ${html}
      </div>
      <div style="padding:16px 28px;border-top:1px solid #ede7e2;text-align:center;flex-shrink:0;background:#FBF8F5;border-radius:0 0 20px 20px;">
        <p style="font-size:0.85rem;color:#666;margin:0 0 10px 0;">This is a preview. Download to see the full formatted document with print-ready styling.</p>
        <button onclick="downloadPDF('${type}')" class="btn btn-primary" style="font-size:0.95rem;padding:12px 32px;">Download ${title} PDF</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

async function downloadPDF(type) {
  const res = await api('/api/memory', null, 'GET');
  const memory = res.memory || {};

  const html = type === 'blueprint' ? buildBlueprintHTML(memory) : buildMessagingHTML(memory);
  const title = type === 'blueprint' ? 'YouTube Brand Blueprint' : 'YouTube Messaging Guide';

  // Open a new window with the PDF content and trigger print (Save as PDF)
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
      ${pdfPageStyles()}
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .pdf-page { page-break-before: always; padding: 40px 50px 70px; }
          .pdf-page:first-child { page-break-before: avoid; }
          .no-print { display: none !important; }
          @page { margin: 0.3in; size: letter; }
        }
        body { font-family: 'Nunito', Calibri, sans-serif; margin: 0; background: #f5f5f5; }
        .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #203B4F; color: #fff; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 100; font-family: 'Nunito', sans-serif; }
        .print-bar button { background: #CD3F42; color: #fff; border: none; padding: 10px 24px; border-radius: 20px; font-weight: 700; font-size: 14px; cursor: pointer; font-family: 'Nunito', sans-serif; }
        .print-bar button:hover { background: #b5373a; }
        .content-wrap { padding-top: 60px; }
      </style>
    </head>
    <body>
      <div class="print-bar no-print">
        <span style="font-weight:700;">${title} — Ready to save</span>
        <div>
          <button onclick="window.print()">Save as PDF</button>
          <button onclick="window.close()" style="background:transparent;border:1px solid rgba(255,255,255,0.3);margin-left:8px;">Close</button>
        </div>
      </div>
      <div class="content-wrap">
        ${html}
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Keep old name as alias for the documents modal
async function generatePDF(type) { return previewPDF(type); }

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

function nl2br(text) {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
}

// Format numbered items (1. foo 2. bar) into styled list cards
function formatNumberedList(text, opts = {}) {
  if (!text) return '';
  const { color = '#C9A77B', showExplanation = true } = opts;
  // Split on numbered patterns: "1. " or "1) " at start or after newline/space
  const items = text.split(/(?:^|\n|(?<=\.\s))(?=\d+[\.\)]\s)/).filter(s => s.trim());

  if (items.length <= 1) {
    // Not a numbered list, try splitting on numbered pattern inline
    const inlineItems = text.split(/\s*\d+[\.\)]\s+/).filter(s => s.trim());
    if (inlineItems.length <= 1) return `<p style="font-size:14px;line-height:1.8;margin:0;">${nl2br(text)}</p>`;
    return inlineItems.map((item, i) => formatListItem(item, i + 1, color, showExplanation)).join('');
  }
  return items.map((item, i) => {
    const cleaned = item.replace(/^\d+[\.\)]\s*/, '').trim();
    return formatListItem(cleaned, i + 1, color, showExplanation);
  }).join('');
}

function formatListItem(text, num, color, showExplanation) {
  // Split on " — " or " - " to separate title from explanation
  const dashMatch = text.match(/^(.+?)(?:\s[—–-]\s)(.+)$/);
  if (dashMatch && showExplanation) {
    return `<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f0ebe6;">
      <span style="flex-shrink:0;width:28px;height:28px;background:${color};color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">${num}</span>
      <div><p style="font-size:14px;font-weight:700;margin:0 0 2px 0;color:#203B4F;">${dashMatch[1].trim()}</p><p style="font-size:12px;color:#666;margin:0;line-height:1.6;">${dashMatch[2].trim()}</p></div>
    </div>`;
  }
  return `<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
    <span style="flex-shrink:0;width:28px;height:28px;background:${color};color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">${num}</span>
    <p style="font-size:14px;margin:0;line-height:1.7;padding-top:3px;">${text.trim()}</p>
  </div>`;
}

// Format comma-separated words into styled tags/chips
function formatWordChips(text, color = '#BF9476') {
  if (!text) return '';
  const words = text.split(/,\s*/).filter(s => s.trim());
  if (words.length <= 1) return `<p style="font-size:14px;margin:0;">${text}</p>`;
  return `<div style="display:flex;flex-wrap:wrap;gap:8px;">${words.map(w =>
    `<span style="display:inline-block;padding:6px 14px;background:${color}15;color:${color};border:1px solid ${color}30;border-radius:20px;font-size:13px;font-weight:600;">${w.trim()}</span>`
  ).join('')}</div>`;
}

// Format a block of text into a styled quotebox
function formatQuoteBox(text) {
  if (!text) return '';
  return `<div style="padding:16px 20px;background:#FBF8F5;border-radius:8px;border-left:3px solid #C9A77B;margin:8px 0;"><p style="font-size:14px;font-style:italic;line-height:1.7;margin:0;color:#333;">${nl2br(text)}</p></div>`;
}

// Format pipe-separated key:value pairs into a 2-column grid
function formatKeyValueGrid(text) {
  if (!text) return '';
  const clean = text.replace(/^["']|["']$/g, ''); // strip wrapping quotes
  const pairs = clean.split(/\s*\|\s*/).filter(s => s.trim());
  if (pairs.length <= 1) return `<p style="font-size:14px;margin:0;">${nl2br(text)}</p>`;
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${pairs.map(pair => {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) return `<div style="grid-column:1/-1;padding:10px 14px;background:#FBF8F5;border-radius:8px;font-size:13px;">${pair.trim()}</div>`;
    const label = pair.substring(0, colonIdx).trim();
    const value = pair.substring(colonIdx + 1).trim();
    return `<div style="padding:10px 14px;background:#FBF8F5;border-radius:8px;">
      <p style="font-size:10px;color:#BF9476;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px 0;">${label}</p>
      <p style="font-size:13px;color:#203B4F;font-weight:600;margin:0;">${value}</p>
    </div>`;
  }).join('')}</div>`;
}

// Format labeled sections (Short: text | Medium: text | Long: text) into cards
function formatLabeledSections(text) {
  if (!text) return '';
  const clean = text.replace(/^["']|["']$/g, '');
  // Try splitting on pipe first
  let sections = clean.split(/\s*\|\s*/).filter(s => s.trim());
  // If no pipes, try splitting on label patterns (Short:, Medium:, Long:, etc.)
  if (sections.length <= 1) {
    sections = clean.split(/(?=(?:Short|Medium|Long|Short \(|Medium \(|Long \())/i).filter(s => s.trim());
  }
  if (sections.length <= 1) return formatQuoteBox(clean);

  const colors = ['#C9A77B', '#BF9476', '#CD3F42'];
  return sections.map((section, i) => {
    const colonIdx = section.indexOf(':');
    let label = '', body = section;
    if (colonIdx !== -1 && colonIdx < 40) {
      label = section.substring(0, colonIdx).trim();
      body = section.substring(colonIdx + 1).trim();
    }
    const color = colors[i % colors.length];
    return `<div style="margin-bottom:14px;padding:16px 18px;background:#fff;border-radius:10px;border:1px solid #ede7e2;border-left:4px solid ${color};">
      ${label ? `<p style="font-size:10px;color:${color};font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px 0;">${label}</p>` : ''}
      <p style="font-size:13px;line-height:1.7;margin:0;color:#333;">${nl2br(body)}</p>
    </div>`;
  }).join('');
}

// Format pipe-separated items into styled bullet cards
function formatPipeBullets(text) {
  if (!text) return '';
  const clean = text.replace(/^["']|["']$/g, '');
  const items = clean.split(/\s*\|\s*/).filter(s => s.trim());
  if (items.length <= 1) return `<p style="font-size:14px;line-height:1.8;margin:0;">${nl2br(clean)}</p>`;
  return items.map(item => {
    // Check for parenthetical sub-items: (1) text (2) text
    const hasSubItems = /\(\d+\)/.test(item);
    if (hasSubItems) {
      const mainPart = item.split(/\(\d+\)/)[0].trim();
      const subItems = item.match(/\(\d+\)\s*[^(]+/g) || [];
      return `<div style="margin-bottom:12px;padding:12px 16px;background:#FBF8F5;border-radius:8px;border-left:3px solid #BF9476;">
        ${mainPart ? `<p style="font-size:14px;font-weight:600;margin:0 0 8px 0;color:#203B4F;">${mainPart}</p>` : ''}
        ${subItems.map(sub => {
          const cleaned = sub.replace(/^\(\d+\)\s*/, '').trim();
          return `<p style="font-size:13px;color:#555;margin:0 0 4px 0;padding-left:12px;">&#8226; ${cleaned}</p>`;
        }).join('')}
      </div>`;
    }
    return `<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;">
      <span style="flex-shrink:0;width:6px;height:6px;background:#BF9476;border-radius:50%;margin-top:7px;"></span>
      <p style="font-size:13px;line-height:1.7;margin:0;color:#333;">${item.trim()}</p>
    </div>`;
  }).join('');
}

// Universal smart formatter — auto-detects pattern and applies the right formatter
function formatSmartText(text, opts = {}) {
  if (!text) return '';
  const { color = '#C9A77B' } = opts;
  const clean = text.replace(/^["']|["']$/g, '').trim();

  // Detect numbered list: "1. " or "1) "
  if (/(?:^|\n)\s*\d+[\.\)]\s/.test(clean)) {
    return formatNumberedList(clean, { color, showExplanation: true });
  }
  // Detect parenthetical numbers with pipe: "(1) text | (2) text" or "text | text (1) sub"
  if (/\|/.test(clean) && /\(\d+\)/.test(clean)) {
    return formatPipeBullets(clean);
  }
  // Detect pipe-separated key:value pairs
  if (/\|/.test(clean) && /\w+:\s/.test(clean)) {
    // Check if most items have colons (key:value) vs just occasional colons
    const parts = clean.split(/\s*\|\s*/);
    const withColons = parts.filter(p => /^\w[\w\s]*:/.test(p.trim())).length;
    if (withColons > parts.length / 2) {
      return formatKeyValueGrid(clean);
    }
    return formatPipeBullets(clean);
  }
  // Detect plain pipe-separated items
  if (/\|/.test(clean)) {
    return formatPipeBullets(clean);
  }
  // Detect comma-separated short items (power words style)
  const commaItems = clean.split(/,\s*/);
  if (commaItems.length >= 4 && commaItems.every(i => i.trim().split(/\s+/).length <= 5)) {
    return formatWordChips(clean, color);
  }
  // Default: styled paragraph
  return `<p style="font-size:14px;line-height:1.8;margin:0;color:#333;">${nl2br(clean)}</p>`;
}

function buildBlueprintHTML(m) {
  const name = m.userName || 'You';
  return `
    ${pdfPageStyles()}

    <!-- PAGE 1: COVER -->
    <div class="pdf-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 750px;">
      <img src="/assets/erika-logo.png" alt="Erika Vieira" style="height: 55px; margin-bottom: 24px;" crossorigin="anonymous">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">
      <h1 style="font-family: Georgia, serif; font-size: 32px; color: #203B4F; margin: 0 0 8px 0; letter-spacing: 1px;">YouTube Brand Blueprint</h1>
      <div style="width: 60px; height: 3px; background: #C9A77B; margin: 0 auto 20px;"></div>
      <p style="font-size: 16px; color: #666; margin: 0 0 32px 0;">Prepared exclusively for <strong style="color: #203B4F;">${name}</strong></p>
      <div style="max-width: 440px; margin: 0 auto;">
        <p style="font-size: 14px; color: #666; line-height: 1.8;">This blueprint is the complete foundation of your YouTube brand, built from your answers across five guided sessions with Aria. Inside you will find your Why Statement, your defined niche, your complete True Fan profile, all five of your mission statement versions, and your top video ideas.</p>
        <p style="font-size: 14px; color: #666; line-height: 1.8; margin-top: 16px;">Keep this document open every time you plan content, write a description, design a thumbnail, update your channel, or pitch a collaboration. This is your north star.</p>
      </div>
      <div style="margin-top: 40px; padding: 16px 28px; background: #FBF8F5; border-radius: 10px; text-align: left; max-width: 380px; width: 100%;">
        <p style="font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0;">What's Inside</p>
        <p style="font-size: 13px; color: #444; margin: 0; line-height: 2;">
          1. Your Why Statement<br>
          2. Your Defined Niche<br>
          3. Your True Fan Profile<br>
          4. Your Mission Statements (5 Versions)<br>
          5. Your Top Video Ideas
        </p>
      </div>
      ${pdfFooter('YouTube Brand Blueprint')}
    </div>

    <!-- PAGE 2: WHY + NICHE -->
    <div class="pdf-page">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">

      <div class="pdf-card pdf-card-warm">
        <p class="pdf-section-label">1. Your Why Statement</p>
        <p style="font-size: 17px; font-style: italic; margin: 0 0 16px 0; line-height: 1.7; color: #203B4F;">"${m.whyStatement || 'Complete Step 1 to discover your Why.'}"</p>
        ${m.whyAnswers ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(201,167,123,0.3);"><p style="font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">The Themes Behind Your Why</p>${formatSmartText(m.whyAnswers)}</div>` : ''}
      </div>

      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label">2. Your Defined Niche</p>
        <p style="font-size: 16px; font-weight: 700; margin: 0 0 8px 0; color: #203B4F;">${m.definedNiche || 'Complete Step 2 to define your niche.'}</p>
        ${m.nicheType ? `<p style="font-size: 13px; color: #888; margin: 0 0 12px 0;">Creator Type: ${m.nicheType}</p>` : ''}
        ${m.nicheAnswers ? `<div style="margin-top: 8px; padding-top: 12px; border-top: 1px solid #ede7e2;"><p style="font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Why This Niche</p>${formatSmartText(m.nicheAnswers)}</div>` : ''}
      </div>

      ${pdfFooter('YouTube Brand Blueprint')}
    </div>

    <!-- PAGE 3: TRUE FAN (FULL PROFILE) -->
    <div class="pdf-page">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">

      <div class="pdf-card pdf-card-tan" style="margin-bottom: 20px;">
        <p class="pdf-section-label-alt">3. Your True Fan</p>
        <p style="font-size: 15px; font-weight: 700; margin: 0 0 4px 0; color: #203B4F;">True Fan Statement</p>
        ${m.trueFanStatement ? `<p style="font-size: 14px; margin: 0; line-height: 1.7;">${nl2br(m.trueFanStatement)}</p>` : '<p>Complete Step 3.</p>'}
      </div>

      ${m.trueFanDemographics ? `
      <div class="pdf-card pdf-card-plain">
        <p style="font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">Demographics</p>
        ${formatKeyValueGrid(m.trueFanDemographics)}
      </div>` : ''}

      ${m.trueFanProfile ? `
      <div class="pdf-card pdf-card-warm">
        <p style="font-size: 11px; color: #C9A77B; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Full Profile</p>
        <p style="font-size: 13px; margin: 0; line-height: 1.8; color: #444;">${nl2br(m.trueFanProfile)}</p>
      </div>` : ''}

      ${m.trueFanEmotionalTriggers ? `
      <div class="pdf-card pdf-card-red">
        <p style="font-family: Georgia, serif; font-size: 11px; color: #CD3F42; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Emotional Triggers &amp; Pain Points</p>
        ${formatSmartText(m.trueFanEmotionalTriggers, { color: '#CD3F42' })}
      </div>` : ''}

      ${pdfFooter('YouTube Brand Blueprint')}
    </div>

    <!-- PAGE 4: MISSION STATEMENTS -->
    <div class="pdf-page">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">

      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label">4. Your Mission Statements</p>
        <p style="font-size: 13px; color: #888; margin: 0 0 16px 0;">Five versions for different contexts. Copy and paste the one you need.</p>

        ${m.missionBelief ? `<div class="pdf-mission-item"><p class="pdf-mission-label">A &mdash; Belief Version</p><p style="font-size: 10px; color: #999; margin: 0 0 6px 0;">USE IN: manifestos, about pages, passionate pitches</p>${formatQuoteBox(m.missionBelief)}</div>` : ''}
        ${m.missionShort ? `<div class="pdf-mission-item"><p class="pdf-mission-label">B &mdash; Short Intro (15 words max)</p><p style="font-size: 10px; color: #999; margin: 0 0 6px 0;">USE IN: YouTube intros, Instagram bio, elevator pitches, email signatures</p>${formatQuoteBox(m.missionShort)}</div>` : ''}
        ${m.missionMedium ? `<div class="pdf-mission-item"><p class="pdf-mission-label">C &mdash; About Section (30-45 words)</p><p style="font-size: 10px; color: #999; margin: 0 0 6px 0;">USE IN: YouTube About section, social media bios, speaker introductions</p>${formatQuoteBox(m.missionMedium)}</div>` : ''}
        ${m.missionBrand ? `<div class="pdf-mission-item"><p class="pdf-mission-label">D &mdash; Brand Positioning (60-85 words)</p><p style="font-size: 10px; color: #999; margin: 0 0 6px 0;">USE IN: website homepage, media kit, collaboration pitches, press bios</p>${formatQuoteBox(m.missionBrand)}</div>` : ''}
        ${m.missionCreative ? `<div class="pdf-mission-item"><p class="pdf-mission-label">E &mdash; Creative / Unique</p><p style="font-size: 10px; color: #999; margin: 0 0 6px 0;">USE IN: thumbnails, hooks, social posts, merch, anywhere you want to stop scrolls</p>${formatQuoteBox(m.missionCreative)}</div>` : ''}
        ${!m.missionBelief ? '<p style="font-size: 14px;">Complete Step 4 to craft your mission statements.</p>' : ''}
      </div>

      ${m.videoIdeas ? `
      <div class="pdf-card pdf-card-red">
        <p style="font-family: Georgia, serif; font-size: 11px; color: #CD3F42; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">5. Your Top Video Ideas</p>
        <p style="font-size: 11px; color: #999; margin: 0 0 14px 0;">These came directly from your True Fan's emotional triggers and frustrations. Start here.</p>
        ${formatNumberedList(m.videoIdeas, { color: '#CD3F42', showExplanation: false })}
      </div>` : ''}

      ${pdfFooter('YouTube Brand Blueprint')}
    </div>

    <!-- LAST PAGE: CTA -->
    <div class="pdf-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 750px;">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">
      <img src="/assets/erika-headshot.png" alt="Erika Vieira" style="width: 180px; height: 180px; border-radius: 50%; object-fit: cover; object-position: center top; margin-bottom: 24px; border: 4px solid #C9A77B;" crossorigin="anonymous">
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

    <!-- PAGE 1: COVER -->
    <div class="pdf-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 750px;">
      <img src="/assets/erika-logo.png" alt="Erika Vieira" style="height: 55px; margin-bottom: 24px;" crossorigin="anonymous">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">
      <h1 style="font-family: Georgia, serif; font-size: 32px; color: #203B4F; margin: 0 0 8px 0; letter-spacing: 1px;">YouTube Messaging Guide</h1>
      <div style="width: 60px; height: 3px; background: #C9A77B; margin: 0 auto 20px;"></div>
      <p style="font-size: 16px; color: #666; margin: 0 0 32px 0;">Prepared exclusively for <strong style="color: #203B4F;">${name}</strong></p>
      <div style="max-width: 440px; margin: 0 auto;">
        <p style="font-size: 14px; color: #666; line-height: 1.8;">This is your complete messaging toolkit, built from your brand foundation. Every word, phrase, tagline, and script inside was crafted specifically for you and your True Fan. This is not generic advice. This is YOUR voice, distilled and ready to use.</p>
        <p style="font-size: 14px; color: #666; line-height: 1.8; margin-top: 16px;">Keep this document open every time you write a title, film an intro, draft a description, send an email, or post on social media. Consistency builds trust, and trust builds a community.</p>
      </div>
      <div style="margin-top: 40px; padding: 16px 28px; background: #FBF8F5; border-radius: 10px; text-align: left; max-width: 380px; width: 100%;">
        <p style="font-size: 11px; color: #BF9476; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0;">What's Inside</p>
        <p style="font-size: 13px; color: #444; margin: 0; line-height: 2;">
          1. Channel Banner &amp; Promise<br>
          2. Video Intro Scripts (3 lengths)<br>
          3. About Section Copy<br>
          4. Messaging Pillars<br>
          5. Power Words &amp; Phrases<br>
          6. Taglines &amp; Signature Phrases<br>
          7. What NOT to Say<br>
          8. Upload Schedule
        </p>
      </div>
      ${pdfFooter('YouTube Messaging Guide')}
    </div>

    <!-- PAGE 2: BANNER + PROMISE + INTROS -->
    <div class="pdf-page">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">

      <div style="margin-bottom: 28px; padding: 28px 24px; background: linear-gradient(135deg, #203B4F 0%, #2d5068 100%); border-radius: 10px; text-align: center;">
        <p style="font-size: 10px; color: #C9A77B; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">1. Your Channel Banner</p>
        <p style="font-family: Georgia, serif; font-size: 22px; color: #fff; margin: 0; font-style: italic;">"${m.channelBanner || 'Complete Step 5'}"</p>
        <p style="font-size: 11px; color: rgba(255,255,255,0.5); margin: 8px 0 0 0;">Copy this text directly onto your YouTube banner image.</p>
      </div>

      <div class="pdf-card pdf-card-warm">
        <p class="pdf-section-label">2. Channel Promise</p>
        <p style="font-size: 11px; color: #999; margin: 0 0 10px 0;">Read this before every video. It is the heartbeat of your channel.</p>
        ${m.channelPromise ? formatQuoteBox(m.channelPromise) : '<p style="font-size:14px;margin:0;">Complete Step 5 to generate your channel promise.</p>'}
      </div>

      ${m.videoIntroScripts ? `
      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label-alt">3. Video Intro Scripts</p>
        <p style="font-size: 11px; color: #999; margin: 0 0 14px 0;">Three lengths for different formats. Copy-paste into your script doc or read directly from here.</p>
        ${formatLabeledSections(m.videoIntroScripts)}
      </div>` : ''}

      ${pdfFooter('YouTube Messaging Guide')}
    </div>

    <!-- PAGE 3: ABOUT + PILLARS -->
    <div class="pdf-page">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">

      ${m.aboutSection ? `
      <div class="pdf-card pdf-card-tan">
        <p class="pdf-section-label-alt">4. About Section Copy</p>
        <p style="font-size: 11px; color: #999; margin: 0 0 10px 0;">Copy this into your YouTube About section. Update the upload schedule if it changes.</p>
        ${formatQuoteBox(m.aboutSection)}
      </div>` : ''}

      ${m.messagingPillars ? `
      <div class="pdf-card pdf-card-warm">
        <p class="pdf-section-label">5. Messaging Pillars</p>
        <p style="font-size: 11px; color: #999; margin: 0 0 14px 0;">These are the core beliefs your content returns to again and again. Every video, email, and post should connect to at least one of these.</p>
        ${formatNumberedList(m.messagingPillars, { color: '#C9A77B' })}
      </div>` : ''}

      ${pdfFooter('YouTube Messaging Guide')}
    </div>

    <!-- PAGE 4: POWER WORDS + TAGLINES + WHAT NOT TO SAY + SCHEDULE -->
    <div class="pdf-page">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">

      ${m.powerWords ? `
      <div class="pdf-card pdf-card-red">
        <p style="font-family: Georgia, serif; font-size: 11px; color: #CD3F42; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">6. Power Words &amp; Phrases</p>
        <p style="font-size: 11px; color: #999; margin: 0 0 14px 0;">Weave these into your titles, thumbnails, descriptions, and scripts. These are the words that feel like YOU.</p>
        ${formatWordChips(m.powerWords, '#CD3F42')}
      </div>` : ''}

      ${m.taglines ? `
      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label">7. Taglines &amp; Signature Phrases</p>
        <p style="font-size: 11px; color: #999; margin: 0 0 14px 0;">Use these in intros, outros, thumbnails, merch, social posts, anywhere you want to be remembered.</p>
        ${formatNumberedList(m.taglines, { color: '#C9A77B', showExplanation: false })}
      </div>` : ''}

      ${m.whatNotToSay ? `
      <div style="margin-bottom: 28px; padding: 22px 20px; background: linear-gradient(135deg, #fff5f5 0%, #fef0f0 100%); border-radius: 10px; border-left: 4px solid #CD3F42; position: relative; z-index: 1;">
        <p style="font-family: Georgia, serif; font-size: 11px; color: #CD3F42; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">8. What NOT to Say</p>
        <p style="font-size: 11px; color: #999; margin: 0 0 14px 0;">These phrases undermine your brand. Avoid them in your content, emails, and conversations.</p>
        ${formatNumberedList(m.whatNotToSay, { color: '#CD3F42', showExplanation: true })}
      </div>` : ''}

      <div class="pdf-card pdf-card-plain">
        <p class="pdf-section-label">9. Upload Schedule</p>
        <p style="font-size: 16px; font-weight: 700; margin: 0; color: #203B4F;">${m.uploadFrequency || 'Not yet defined'}</p>
        <p style="font-size: 12px; color: #999; margin: 6px 0 0 0;">Consistency matters more than frequency. Pick a schedule you can keep for 6 months.</p>
      </div>

      ${pdfFooter('YouTube Messaging Guide')}
    </div>

    <!-- LAST PAGE: CTA -->
    <div class="pdf-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 750px;">
      <img class="pdf-watermark" src="/assets/erika-logo.png" alt="" crossorigin="anonymous">
      <img src="/assets/erika-headshot.png" alt="Erika Vieira" style="width: 180px; height: 180px; border-radius: 50%; object-fit: cover; object-position: center top; margin-bottom: 24px; border: 4px solid #C9A77B;" crossorigin="anonymous">
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
    const hasAnyData = memory.whyStatement || memory.definedNiche || memory.trueFanStatement;
    const hasMessagingData = memory.channelBanner || memory.videoIntroScripts || memory.messagingPillars || memory.brandBlueprint || memory.messagingGuide;

    container.innerHTML = '';

    // Always show Blueprint card — it populates progressively as steps complete
    const blueprintStatus = memory.whyStatement ? 'Ready to preview' : 'Complete Steps 1-4 to build';
    container.innerHTML += `
      <div class="document-card">
        <h4>YouTube Brand Blueprint</h4>
        <p>Your Why, Niche, True Fan, Mission Statements, and Video Ideas</p>
        <p style="font-size:0.8rem;color:${memory.whyStatement ? '#5cb85c' : '#999'};margin-bottom:12px;">${blueprintStatus}</p>
        <div class="document-actions">
          <button class="btn btn-download" onclick="previewPDF('blueprint')" ${!memory.whyStatement ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Preview Document</button>
        </div>
      </div>
    `;

    // Always show Messaging Guide card
    const messagingStatus = hasMessagingData ? 'Ready to preview' : 'Complete Step 5 to build';
    container.innerHTML += `
      <div class="document-card">
        <h4>YouTube Messaging Guide</h4>
        <p>Video Intros, Banner, About Section, Pillars, Power Words, Taglines, and More</p>
        <p style="font-size:0.8rem;color:${hasMessagingData ? '#5cb85c' : '#999'};margin-bottom:12px;">${messagingStatus}</p>
        <div class="document-actions">
          <button class="btn btn-download" onclick="previewPDF('messaging')" ${!hasMessagingData ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Preview Document</button>
        </div>
      </div>
    `;
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
