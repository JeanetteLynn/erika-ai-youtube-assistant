import { authenticate } from './auth.js';
import { getSystemPrompt } from './prompts.js';

export async function handleAPI(request, env, url) {
  const user = await authenticate(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // Chat endpoint
  if (url.pathname === '/api/chat' && request.method === 'POST') {
    return handleChat(request, env, user);
  }

  // Get progress
  if (url.pathname === '/api/progress' && request.method === 'GET') {
    return getProgress(env, user);
  }

  // Update step
  if (url.pathname === '/api/progress/step' && request.method === 'POST') {
    return updateStep(request, env, user);
  }

  // Get conversation history for a step
  if (url.pathname.startsWith('/api/conversations/') && request.method === 'GET') {
    const step = parseInt(url.pathname.split('/').pop());
    return getConversations(env, user, step);
  }

  // Memory endpoints
  if (url.pathname === '/api/memory' && request.method === 'GET') {
    return getMemory(env, user);
  }
  if (url.pathname === '/api/memory' && request.method === 'POST') {
    return setMemory(request, env, user);
  }

  // Documents
  if (url.pathname === '/api/documents' && request.method === 'GET') {
    return getDocuments(env, user);
  }
  if (url.pathname === '/api/documents' && request.method === 'POST') {
    return saveDocument(request, env, user);
  }

  // Reset a step
  if (url.pathname.startsWith('/api/reset/') && request.method === 'POST') {
    const step = parseInt(url.pathname.split('/').pop());
    return resetStep(env, user, step);
  }

  return json({ error: 'Not found' }, 404);
}

async function handleChat(request, env, user) {
  const { message, step } = await request.json();
  if (!message || !step) return json({ error: 'Message and step are required' }, 400);

  // Check if this is a returning/system message (don't save these to history)
  const isReturningMessage = message.startsWith('[RETURNING TO ');

  // Save user message (skip system messages)
  if (!isReturningMessage) {
    await env.DB.prepare(
      'INSERT INTO conversations (user_id, step, role, content) VALUES (?, ?, ?, ?)'
    ).bind(user.id, step, 'user', message).run();
  }

  // Get conversation history for this step
  const history = await env.DB.prepare(
    'SELECT role, content FROM conversations WHERE user_id = ? AND step = ? ORDER BY created_at ASC'
  ).bind(user.id, step).all();

  // Get all user memory (cross-step data)
  const memoryRows = await env.DB.prepare(
    'SELECT key, value FROM user_memory WHERE user_id = ?'
  ).bind(user.id).all();

  const memory = {};
  for (const row of memoryRows.results) {
    memory[row.key] = row.value;
  }

  // Always inject the user's account name so the AI never needs to ask
  if (!memory.userName && user.name) {
    memory.userName = user.name.split(' ')[0]; // Use first name
  }

  // Build the system prompt with memory injected
  const systemPrompt = getSystemPrompt(step, memory);

  // Build messages for Claude
  let messages;
  if (isReturningMessage) {
    // For returning messages, only send the last few exchanges + the returning message
    // This avoids token limits on long conversations while giving the AI enough context
    const recent = history.results.slice(-6);
    messages = recent.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));
    messages.push({ role: 'user', content: message });
  } else {
    messages = history.results.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));
  }

  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Claude API error:', err);
    return json({ error: 'AI service error. Please try again.' }, 502);
  }

  const data = await response.json();
  const aiMessage = data.content[0].text;

  // Check if AI wants to store memory (look for [STORE:key=value] patterns)
  // Do this BEFORE saving so we can save the cleaned version
  const storePattern = /\[STORE:(\w+)=([\s\S]*?)\]/g;
  let match;
  while ((match = storePattern.exec(aiMessage)) !== null) {
    const [, key, value] = match;
    await env.DB.prepare(
      'INSERT INTO user_memory (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = ?, updated_at = datetime(\'now\')'
    ).bind(user.id, key, value.trim(), value.trim()).run();
  }

  // Clean the store tags — save the CLEAN version to DB so tags never appear on reload
  const cleanMessage = aiMessage.replace(/\[STORE:\w+=[\s\S]*?\]/g, '').trim();

  // Save the cleaned assistant message (skip responses to returning messages)
  if (!isReturningMessage) {
    await env.DB.prepare(
      'INSERT INTO conversations (user_id, step, role, content) VALUES (?, ?, ?, ?)'
    ).bind(user.id, step, 'assistant', cleanMessage).run();
  }

  return json({ message: cleanMessage });
}

async function getProgress(env, user) {
  const progress = await env.DB.prepare(
    'SELECT step, step_question, completed_steps FROM user_progress WHERE user_id = ?'
  ).bind(user.id).first();

  if (!progress) {
    await env.DB.prepare(
      'INSERT INTO user_progress (user_id, step, step_question) VALUES (?, 1, 0)'
    ).bind(user.id).run();
    return json({ step: 1, stepQuestion: 0, completedSteps: [] });
  }

  return json({
    step: progress.step,
    stepQuestion: progress.step_question,
    completedSteps: JSON.parse(progress.completed_steps || '[]'),
  });
}

async function updateStep(request, env, user) {
  const { step, stepQuestion, completedSteps } = await request.json();

  await env.DB.prepare(
    'UPDATE user_progress SET step = ?, step_question = ?, completed_steps = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
  ).bind(step, stepQuestion || 0, JSON.stringify(completedSteps || []), user.id).run();

  return json({ ok: true });
}

async function getConversations(env, user, step) {
  const rows = await env.DB.prepare(
    'SELECT role, content, created_at FROM conversations WHERE user_id = ? AND step = ? ORDER BY created_at ASC'
  ).bind(user.id, step).all();

  // Strip any [STORE:] tags that may exist in older messages (safety net)
  const cleaned = rows.results.map(msg => ({
    ...msg,
    content: msg.content ? msg.content.replace(/\[STORE:\w+=[\s\S]*?\]/g, '').trim() : msg.content,
  }));

  return json({ messages: cleaned });
}

async function getMemory(env, user) {
  const rows = await env.DB.prepare(
    'SELECT key, value FROM user_memory WHERE user_id = ?'
  ).bind(user.id).all();

  const memory = {};
  for (const row of rows.results) {
    memory[row.key] = row.value;
  }
  return json({ memory });
}

async function setMemory(request, env, user) {
  const { key, value } = await request.json();
  await env.DB.prepare(
    'INSERT INTO user_memory (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = ?, updated_at = datetime(\'now\')'
  ).bind(user.id, key, value, value).run();
  return json({ ok: true });
}

async function getDocuments(env, user) {
  const rows = await env.DB.prepare(
    'SELECT id, doc_type, title, content, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();
  return json({ documents: rows.results });
}

async function saveDocument(request, env, user) {
  const { docType, title, content } = await request.json();
  const result = await env.DB.prepare(
    'INSERT INTO documents (user_id, doc_type, title, content) VALUES (?, ?, ?, ?)'
  ).bind(user.id, docType, title, content).run();
  return json({ id: result.meta.last_row_id });
}

async function resetStep(env, user, step) {
  await env.DB.prepare(
    'DELETE FROM conversations WHERE user_id = ? AND step = ?'
  ).bind(user.id, step).run();
  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
