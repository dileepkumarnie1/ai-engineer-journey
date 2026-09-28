import type { CareerItem, Flashcard, Project, ResumeRewrite } from './schema';

export const projects: Project[] = [
  {
    id: 'capstone',
    title: 'DataSentinel AI',
    icon: 'Trophy',
    summary: 'Agentic data-quality copilot: mapping docs in → executed, explained ETL validations out.',
    stack: ['LangGraph', 'MCP', 'Azure OpenAI', 'Azure AI Search', 'Databricks', 'FastAPI', 'DeepEval', 'Langfuse', 'Docker', 'Container Apps'],
    milestones: [
      { id: 'cap-testgen', title: 'Test-case generator from STTM (structured output)', phaseId: 'p3' },
      { id: 'cap-rag', title: 'RAG over mapping docs & business rules', phaseId: 'p4' },
      { id: 'cap-agents', title: 'Planner / SQL / Executor / Analyst agents in LangGraph', phaseId: 'p5' },
      { id: 'cap-mcp', title: 'Read-only MCP server for DuckDB / Databricks', phaseId: 'p5' },
      { id: 'cap-hitl', title: 'Human-in-the-loop approval before execution', phaseId: 'p5' },
      { id: 'cap-evals', title: 'DeepEval + Ragas suite running in CI', phaseId: 'p6' },
      { id: 'cap-guard', title: 'Langfuse tracing + prompt-injection guardrails', phaseId: 'p6' },
      { id: 'cap-deploy', title: 'Docker → Azure Container Apps with Azure OpenAI + AI Search', phaseId: 'p6' },
      { id: 'cap-databricks', title: 'Run against Databricks sample warehouse', phaseId: 'p7' },
      { id: 'cap-metrics', title: 'Metrics: accuracy, cost per run, time saved', phaseId: 'p7' },
      { id: 'cap-readme', title: 'README with architecture diagram + quick start', phaseId: 'p7' },
      { id: 'cap-launch', title: '3-min demo video + blog + LinkedIn post', phaseId: 'p7' },
    ],
  },
  {
    id: 'mini-1',
    title: 'Mapping → Test Cases CLI',
    icon: 'FileText',
    summary: 'STTM CSV in, validated test cases and runnable SQL out.',
    stack: ['Python', 'Pydantic', 'Gemini / Ollama', 'Instructor', 'DuckDB'],
    milestones: [
      { id: 'm1-parse', title: 'Parse STTM CSV into Pydantic models', phaseId: 'p3' },
      { id: 'm1-prompt', title: 'Prompt v1 → v5 with changelog', phaseId: 'p3' },
      { id: 'm1-structured', title: 'Structured output: list[TestCase]', phaseId: 'p3' },
      { id: 'm1-sql', title: 'Write SQL files and run on DuckDB', phaseId: 'p3' },
      { id: 'm1-readme', title: 'README + demo GIF', phaseId: 'p3' },
    ],
  },
  {
    id: 'mini-2',
    title: 'Data-docs RAG Chatbot',
    icon: 'MessageSquare',
    summary: 'Chat with ADF / Databricks / Informatica docs with citations and eval scores.',
    stack: ['LangChain or LlamaIndex', 'Chroma', 'Streamlit', 'Ragas'],
    milestones: [
      { id: 'm2-ingest', title: 'Ingest & chunk docs', phaseId: 'p4' },
      { id: 'm2-index', title: 'Embed + Chroma index', phaseId: 'p4' },
      { id: 'm2-retrieve', title: 'Retrieval with citations', phaseId: 'p4' },
      { id: 'm2-ui', title: 'Streamlit chat UI', phaseId: 'p4' },
      { id: 'm2-eval', title: '15-question Ragas eval', phaseId: 'p4' },
      { id: 'm2-readme', title: 'README with scores table', phaseId: 'p4' },
    ],
  },
  {
    id: 'mini-3',
    title: 'SQL Validation Agent',
    icon: 'Bot',
    summary: 'LangGraph agent with MCP tools that plans, runs and explains validations.',
    stack: ['LangGraph', 'MCP', 'DuckDB'],
    milestones: [
      { id: 'm3-tools', title: 'Tools: get_schema, run_readonly_sql', phaseId: 'p5' },
      { id: 'm3-react', title: 'ReAct tool-calling agent', phaseId: 'p5' },
      { id: 'm3-graph', title: 'Port to LangGraph', phaseId: 'p5' },
      { id: 'm3-hitl', title: 'Human approval interrupt', phaseId: 'p5' },
      { id: 'm3-mcp', title: 'Move tools into an MCP server', phaseId: 'p5' },
      { id: 'm3-report', title: 'Markdown test report', phaseId: 'p5' },
    ],
  },
];

export const careerChecklist: CareerItem[] = [
  { id: 'li-headline', group: 'Profile', title: "LinkedIn headline: 'AI Engineer | Data Quality | RAG · Agents · Azure'" },
  { id: 'li-about', group: 'Profile', title: 'LinkedIn About rewritten around your AI + data story' },
  { id: 'gh-readme', group: 'Profile', title: 'GitHub profile README' },
  { id: 'gh-pins', group: 'Profile', title: 'Pin capstone + 3 mini-projects on GitHub' },
  { id: 'cv-v1', group: 'Résumé', title: 'AI Engineer résumé v1 (1–2 pages)' },
  { id: 'cv-bullets', group: 'Résumé', title: '3 quantified AI project bullets' },
  { id: 'cv-keywords', group: 'Résumé', title: 'Keywords aligned with 10 target job ads' },
  { id: 'brand-blog', group: 'Brand', title: 'Publish 2 blog posts (mini-project + capstone)' },
  { id: 'brand-posts', group: 'Brand', title: 'Publish 4 LinkedIn learning posts' },
  { id: 'brand-demo', group: 'Brand', title: 'Capstone demo video online' },
  { id: 'net-connect', group: 'Network', title: 'Connect with 20 AI engineers / hiring managers' },
  { id: 'net-meetup', group: 'Network', title: 'Attend 1 AI meetup or online community event' },
  { id: 'net-internal', group: 'Network', title: 'Explore internal AI roles at your current company' },
  { id: 'cred-2', group: 'Credentials', title: 'Earn 2 free credentials (HF / Kaggle / MS Applied Skills)' },
  { id: 'int-pitch', group: 'Interview', title: 'Record your 60-second pitch' },
  { id: 'int-mocks', group: 'Interview', title: '3 mock interviews done' },
];

export const resumeRewrites: ResumeRewrite[] = [
  {
    before: 'Performed end-to-end data validation for ETL pipelines in Informatica and ADF.',
    after: 'Built an agentic LLM system (LangGraph + MCP) that generates and runs ETL validations from mapping docs, cutting test design time by X%.',
  },
  {
    before: 'Wrote SQL queries to verify source-to-target data.',
    after: 'Designed text-to-SQL test generation with structured outputs and a golden-set eval (Y% correctness) on Databricks.',
  },
  {
    before: 'Created automation tools for data validation.',
    after: 'Shipped AI-powered data-quality tooling on Azure (OpenAI, AI Search, Container Apps) with CI evals and Langfuse tracing.',
  },
  {
    before: 'Tested MDM and data warehouse loads.',
    after: 'Applied RAG over data dictionaries and MDM rules to explain data anomalies in plain English for business users.',
  },
];

export const flashcards: Flashcard[] = [
  { q: 'What is RAG and when would you use it?', a: 'Retrieve relevant documents at query time and give them to the LLM. Use it for fresh or private knowledge.' },
  { q: 'RAG vs fine-tuning?', a: 'RAG adds knowledge; fine-tuning changes behaviour/format. Try prompting → RAG → fine-tune, in that order.' },
  { q: 'How do you evaluate a RAG system?', a: 'Golden Q&A set; measure context relevance, faithfulness and answer relevance (e.g. Ragas); track over time in CI.' },
  { q: 'What is an AI agent?', a: 'An LLM in a loop that decides which tools to call, observes results, and continues until the goal is met.' },
  { q: 'Workflow vs agent?', a: 'Workflow: predefined steps. Agent: the model chooses steps. Prefer workflows unless flexibility is required.' },
  { q: 'How do you reduce hallucinations?', a: "Ground with retrieved context, constrain output schema, allow 'I don't know', add evals and citations." },
  { q: 'What is prompt injection and how do you mitigate it?', a: 'Untrusted text overriding instructions. Separate data from instructions, least-privilege tools, output checks, human approval.' },
  { q: 'What is MCP?', a: 'Model Context Protocol: a standard way for AI apps to connect to tools, resources and prompts via servers.' },
  { q: 'How do you control LLM cost?', a: 'Smaller models for easy steps, caching, prompt compression, token limits, batching, and tracing cost per request.' },
  { q: 'Chunk size trade-off?', a: 'Small chunks = precise but lose context; large = more context but diluted relevance and higher cost.' },
  { q: 'What is LLM-as-a-judge?', a: 'Using a model to grade outputs against a rubric. Calibrate it against human labels first.' },
  { q: 'Why is your testing background valuable?', a: 'AI quality is an evaluation problem: test design, golden data, regression, edge cases — exactly my 10 years.' },
];
