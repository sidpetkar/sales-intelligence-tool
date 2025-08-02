const salesKeywords = [
  'email', 'emails', 'mail', 'mails', 'gmail', 'inbox', 'subject', 'from', 'to', 'cc', 'bcc', 'attachment', 'thread', 'unread', 'read',
  'sales', 'deal', 'deals', 'lead', 'leads', 'prospect', 'prospects', 'customer', 'customers', 'client', 'clients', 'account', 'accounts',
  'opportunity', 'opportunities', 'pipeline', 'stage', 'stages', 'quote', 'quotes', 'contract', 'contracts', 'negotiation', 'negotiations',
  'close', 'closed', 'won', 'lost', 'churn', 'upsell', 'cross-sell', 'renewal', 'revenue', 'mrr', 'arr',
  'meeting', 'meetings', 'call', 'calls', 'demo', 'demos', 'follow-up', 'follow-ups', 'task', 'tasks', 'activity', 'activities',
  'contact', 'contacts', 'company', 'companies', 'industry', 'industries',
  'hot', 'warm', 'cold', 'priority', 'important', 'urgent',
  'analyze', 'analysis', 'summary', 'summarize', 'overview', 'show', 'find', 'get', 'list', 'search', 'recent', 'latest', 'today',
  'performance', 'metrics', 'kpis', 'report', 'reports', 'forecast', 'forecasting',
  'who', 'what', 'when', 'where', 'why', 'how',
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'did', 'a', 'an', 'the', 'and', 'or', 'but', 'for', 'with', 'on', 'in', 'at', 'of',
  'help', 'draft', 'write', 'create', 'generate', 'template', 'templates', 'personalized',
  'pending', 'overdue', 'upcoming', 'next', 'last', 'past', 'quarter', 'month', 'week', 'year',
  'introduction', 'intro', 'pricing', 'discount', 'objection', 'handling',
  'competitor', 'competitors', 'comparison', 'vs',
  'feedback', 'testimonial', 'case study',
  'linkedin', 'crm', 'salesforce', 'hubspot',
  'sarah', 'johnson', 'david', 'chen', 'acme', 'globex', 'corp', 'inc'
];

const stopWords = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
  'each',
  'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just',
  'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  's', 'same', 'she', 'should', 'so', 'some', 'still', 'such',
  't', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up',
  'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves'
]);

export function extractSalesKeywords(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);

  const keywords = words.filter(word => {
    const isStopWord = stopWords.has(word);
    const isSalesKeyword = salesKeywords.includes(word);
    const isLongerWord = word.length > 2;

    return !isStopWord && (isSalesKeyword || isLongerWord);
  });

  return [...new Set(keywords)];
} 