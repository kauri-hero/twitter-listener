export function buildExplicitQuery(
  keywords: string[], 
  lang: string = 'en', 
  sinceISO: string
): string {
  const keywordClause = keywords.map(k => `"${k}"`).join(' OR ');
  return `(${keywordClause}) lang:${lang} -is:retweet since:${sinceISO}`;
}

export function buildImageOnlyQuery(
  excludeTerms: string[], 
  lang: string = 'en', 
  sinceISO: string
): string {
  const excludeClause = excludeTerms.map(term => {
    if (term.startsWith('@')) {
      return term;
    }
    if (term.startsWith('#')) {
      return term;
    }
    return `"${term}"`; 
  }).join(' OR ');
  
  return `has:images -(${excludeClause}) lang:${lang} -is:retweet since:${sinceISO}`;
}

export function toSinceUTCString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}_UTC`;
}

export function parseTwitterDate(twitterDate: string): Date {
  return new Date(twitterDate);
}

export function isWithinWindow(tweetDate: string, windowStart: Date): boolean {
  const tweetTime = parseTwitterDate(tweetDate);
  return tweetTime >= windowStart;
}
