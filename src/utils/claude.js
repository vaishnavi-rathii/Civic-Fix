// Legacy helpers — now delegate to the main simulator in src/lib/claude.js
import { askClaude } from '../lib/claude';

export async function analyzeIssue(title, description, category) {
  const raw = await askClaude(
    'You are CivicFix AI, a civic issue analysis assistant. Return formalComplaint and evidenceChecklist.',
    `Title: ${title}\nDescription: ${description}\nCategory: ${category}`,
    512
  );
  return JSON.parse(raw);
}

export async function generateAdminReport(issues) {
  const lines = issues.map(i => `[${i.status}] ${i.title} (${i.category}) @ ${i.location?.address}`).join('\n');
  const raw = await askClaude(
    'You are a civic analytics assistant. Return {"score":0-100,"label":"...","color":"#hex","narrative":"..."}',
    `Total:${issues.length}, Resolved:${issues.filter(i=>i.status==='resolved').length}, Issues:\n${lines}`,
    800
  );
  return JSON.parse(raw);
}

export async function chatWithBot(userMessage, issues, history = []) {
  const ctx = issues.slice(0, 30).map(i => `• [${i.status}] ${i.title} (${i.category}) — ${i.location?.address}`).join('\n');
  return askClaude(
    `You are CivicFix Assistant, an AI helper for Indian citizens. Current issues:\n${ctx}`,
    userMessage,
    300
  );
}
