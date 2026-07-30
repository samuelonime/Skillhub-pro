// Static, owned question bank — no external API. Each question carries
// expectedKeywords used by the rubric scorer, and category flags whether
// STAR-structure is expected (behavioral) or not (technical/factual).

const BEHAVIORAL_QUESTIONS = [
  {
    id: 'b-01',
    text: 'Tell me about a time you faced a difficult technical problem. How did you approach it?',
    category: 'behavioral',
    expectedKeywords: ['problem', 'approach', 'solution', 'result', 'learned'],
  },
  {
    id: 'b-02',
    text: 'Describe a situation where you disagreed with a teammate. How did you resolve it?',
    category: 'behavioral',
    expectedKeywords: ['disagree', 'communicate', 'compromise', 'team', 'outcome'],
  },
  {
    id: 'b-03',
    text: 'Tell me about a project you are most proud of and why.',
    category: 'behavioral',
    expectedKeywords: ['project', 'built', 'impact', 'challenge', 'result'],
  },
  {
    id: 'b-04',
    text: 'Describe a time you had to learn a new skill quickly to complete a task.',
    category: 'behavioral',
    expectedKeywords: ['learn', 'quickly', 'resource', 'apply', 'deadline'],
  },
  {
    id: 'b-05',
    text: 'Tell me about a time you missed a deadline or made a mistake. What did you do?',
    category: 'behavioral',
    expectedKeywords: ['mistake', 'responsibility', 'fix', 'learned', 'prevent'],
  },
];

// Role-specific technical/factual questions — no STAR expected, scored on
// keyword coverage and depth instead.
const ROLE_QUESTIONS = {
  'Backend Developer': [
    { id: 't-be-01', text: 'Explain the difference between SQL and NoSQL databases, and when you would choose each.', category: 'technical', expectedKeywords: ['relational', 'schema', 'scalability', 'document', 'consistency'] },
    { id: 't-be-02', text: 'How would you design a REST API for a resource that supports pagination?', category: 'technical', expectedKeywords: ['pagination', 'limit', 'offset', 'endpoint', 'response'] },
    { id: 't-be-03', text: 'What is the purpose of database indexing, and what are its trade-offs?', category: 'technical', expectedKeywords: ['index', 'query', 'speed', 'write', 'storage'] },
  ],
  'Frontend Developer': [
    { id: 't-fe-01', text: 'Explain the difference between state and props in a component-based framework.', category: 'technical', expectedKeywords: ['state', 'props', 'component', 'render', 'data'] },
    { id: 't-fe-02', text: 'How do you approach making a web page accessible?', category: 'technical', expectedKeywords: ['accessibility', 'aria', 'contrast', 'keyboard', 'screen reader'] },
    { id: 't-fe-03', text: 'What strategies do you use to optimize front-end performance?', category: 'technical', expectedKeywords: ['performance', 'lazy', 'bundle', 'cache', 'load'] },
  ],
  'Data Scientist': [
    { id: 't-ds-01', text: 'How do you handle missing data in a dataset?', category: 'technical', expectedKeywords: ['missing', 'impute', 'drop', 'bias', 'data'] },
    { id: 't-ds-02', text: 'Explain the difference between overfitting and underfitting.', category: 'technical', expectedKeywords: ['overfit', 'underfit', 'generalize', 'variance', 'bias'] },
    { id: 't-ds-03', text: 'How would you evaluate a classification model?', category: 'technical', expectedKeywords: ['accuracy', 'precision', 'recall', 'f1', 'confusion matrix'] },
  ],
  'Project Manager': [
    { id: 't-pm-01', text: 'How do you prioritize tasks when a project has competing deadlines?', category: 'technical', expectedKeywords: ['priority', 'deadline', 'stakeholder', 'risk', 'impact'] },
    { id: 't-pm-02', text: 'How do you handle scope creep on a project?', category: 'technical', expectedKeywords: ['scope', 'change', 'stakeholder', 'document', 'timeline'] },
  ],
  'Marketing Specialist': [
    { id: 't-mk-01', text: 'How do you measure the success of a marketing campaign?', category: 'technical', expectedKeywords: ['metric', 'conversion', 'roi', 'engagement', 'audience'] },
    { id: 't-mk-02', text: 'How would you approach targeting a new audience segment?', category: 'technical', expectedKeywords: ['segment', 'audience', 'research', 'channel', 'persona'] },
  ],
};

const GENERIC_TECHNICAL = [
  { id: 't-gen-01', text: 'Walk me through how you would approach learning a new tool or technology required for a role.', category: 'technical', expectedKeywords: ['learn', 'research', 'practice', 'apply', 'resource'] },
  { id: 't-gen-02', text: 'How do you prioritize your work when everything feels urgent?', category: 'technical', expectedKeywords: ['priority', 'urgent', 'important', 'plan', 'deadline'] },
];

function getQuestionSet(role) {
  const technical = ROLE_QUESTIONS[role] || GENERIC_TECHNICAL;
  // 3 behavioral + up to 3 role-specific technical = a realistic short mock interview
  return [...BEHAVIORAL_QUESTIONS.slice(0, 3), ...technical.slice(0, 3)];
}

module.exports = { BEHAVIORAL_QUESTIONS, ROLE_QUESTIONS, GENERIC_TECHNICAL, getQuestionSet };