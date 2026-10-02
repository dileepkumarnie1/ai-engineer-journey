import type { ExperienceLevel, Settings, SkillArea } from '@/db/db';

export const SKILL_AREAS: { id: SkillArea; label: string; emoji: string; phaseId: string; hint: string }[] = [
  { id: 'python', label: 'Python & APIs', emoji: '🐍', phaseId: 'p1', hint: 'OOP, typing, pytest, async, FastAPI' },
  { id: 'ml', label: 'ML & deep learning', emoji: '🧠', phaseId: 'p2', hint: 'Train/test, metrics, neural nets, embeddings' },
  { id: 'llm', label: 'LLMs & prompting', emoji: '✨', phaseId: 'p3', hint: 'Prompting, structured output, tool calling' },
  { id: 'rag', label: 'RAG & vector DBs', emoji: '📚', phaseId: 'p4', hint: 'Chunking, retrieval, RAG evals' },
  { id: 'agents', label: 'AI agents', emoji: '🤖', phaseId: 'p5', hint: 'ReAct, LangGraph, multi-agent, MCP' },
  { id: 'ops', label: 'LLMOps & cloud', emoji: '☁️', phaseId: 'p6', hint: 'Evals, guardrails, Docker, Azure' },
];

export const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 0, label: 'New to it' },
  { value: 1, label: 'Some' },
  { value: 2, label: 'Solid' },
];

/** The skill area a learner rated "solid" for this phase, if any: its learn modules can be tested out of. */
export const testOutArea = (experience: Settings['experience'], phaseId: string) =>
  SKILL_AREAS.find((a) => a.phaseId === phaseId && experience?.[a.id] === 2);
