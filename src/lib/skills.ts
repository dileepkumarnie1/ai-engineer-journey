import { getModule } from '@/content';
import type { CourseProgress, ModuleProgress } from '@/db/db';
import { moduleCompletion } from './progress';

export interface Skill {
  id: string;
  label: string;
  emoji: string;
  /** What job postings typically ask for under this skill. */
  posting: string;
  modules: string[];
}

export const SKILLS: Skill[] = [
  { id: 'python', label: 'Python & APIs', emoji: '🐍', posting: 'Production Python, REST APIs, testing', modules: ['p0-setup', 'p1-core', 'p1-modern', 'p1-apis', 'p1-fastapi'] },
  { id: 'llm', label: 'LLMs & prompting', emoji: '✨', posting: 'Prompt design, structured output, model trade-offs', modules: ['p2-ml', 'p2-nn', 'p2-embed', 'p3-llm', 'p3-prompt', 'p3-structured', 'p8-finetune'] },
  { id: 'rag', label: 'RAG & retrieval', emoji: '📚', posting: 'Embeddings, vector search, RAG pipelines', modules: ['p2-embed', 'p4-vector', 'p4-rag', 'p4-advanced', 'p4-mini2'] },
  { id: 'agents', label: 'Agents & tool use', emoji: '🤖', posting: 'Tool calling, LangGraph, MCP, multi-agent', modules: ['p3-structured', 'p5-agents', 'p5-agentic', 'p5-langgraph', 'p5-multi', 'p5-mcp', 'p5-mini3'] },
  { id: 'evals', label: 'Evals & quality', emoji: '🧪', posting: 'Eval suites, LLM-as-judge, golden datasets', modules: ['p3-mini1', 'p4-advanced', 'p6-evals', 'p7-prove'] },
  { id: 'ops', label: 'LLMOps & safety', emoji: '🛡️', posting: 'Guardrails, tracing, cost control, system design', modules: ['p6-safety', 'p7-integrate', 'p8-sysdesign'] },
  { id: 'cloud', label: 'Cloud & shipping', emoji: '☁️', posting: 'Docker, Azure deployment, demos', modules: ['p6-docker', 'p6-azure', 'p7-launch'] },
];

/** 0–1: completion 40%, best quiz 40%, confidence 20%. Proven knowledge beats ticked boxes. */
export const moduleMastery = (moduleId: string, mp: Map<string, ModuleProgress>, cp: Map<string, CourseProgress>) => {
  const m = getModule(moduleId);
  if (!m) return 0;
  const p = mp.get(moduleId);
  return 0.4 * moduleCompletion(m, mp, cp) + 0.4 * ((p?.quizScore ?? 0) / 100) + 0.2 * ((p?.confidence ?? 0) / 5);
};

export const skillScores = (mp: Map<string, ModuleProgress>, cp: Map<string, CourseProgress>) =>
  SKILLS.map((s) => ({
    ...s,
    score: Math.round((s.modules.reduce((sum, id) => sum + moduleMastery(id, mp, cp), 0) / s.modules.length) * 100),
  }));

export const skillLevel = (score: number) =>
  score >= 80 ? 'Job-ready' : score >= 50 ? 'Practising' : score >= 20 ? 'Learning' : 'Not started';
