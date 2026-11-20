export const SCIENCE_SOURCES = ['https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm','https://aapor.org/statements/understanding-a-credibility-interval-and-how-it-differs-from-the-margin-of-sampling-error-in-a-public-opinion-poll/'];
export const planSample = (population, margin = 5) => {
  const N=Number(population), e=Number(margin)/100;
  if(!Number.isSafeInteger(N)||N<2||!(e>0&&e<1))return null;
  const n0=1.96**2*.25/e**2;
  return Math.min(N,Math.ceil(n0/(1+(n0-1)/N)));
};
export const wilson = (successes,n) => {
  if(!n)return null;
  const z=1.96,p=successes/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
  return [Math.max(0,c-h),Math.min(1,c+h)];
};
export const analyzeSurvey = survey => {
  const all=survey.responses || [], valid=all.filter(response=>!response.excluded), eligible=survey.sample?.length || 0;
  const probability=survey.sampling==='random' && eligible>0;
  const questions=survey.questions.map(question=>{
    const answered=valid.filter(row=>row.answers[question.id]!==undefined&&row.answers[question.id]!==''),n=answered.length;
    const result={...question,n,missing:valid.length-n};
    // Choice drafts retain option inputs when switched to text or rating.
    delete result.options;
    if(['single','multi'].includes(question.type)) result.options=question.options.map(option=>{const count=answered.filter(row=>question.type==='multi' ? row.answers[question.id].includes(option) : row.answers[question.id]===option).length;return {label:option,count,percent:n ? count/n*100 : 0,interval:probability&&n ? wilson(count,n) : null};});
    if(question.type==='rating'){const values=answered.map(row=>Number(row.answers[question.id]));result.mean=n ? values.reduce((a,b)=>a+b,0)/n : null;const sorted=[...values].sort((a,b)=>a-b);result.median=n ? (sorted[Math.floor((n-1)/2)]+sorted[Math.floor(n/2)])/2 : null;result.distribution=[1,2,3,4,5].map(value=>({label:String(value),count:values.filter(x=>x===value).length}));}
    if(question.type==='text')result.comments=answered.map(row=>row.answers[question.id]);
    return result;
  });
  return {total:all.length,valid:valid.length,excluded:all.length-valid.length,eligible,participation:eligible ? all.length/eligible*100 : null,probability,questions,limitations:probability ? 'Intervals are 95% Wilson intervals under simple random sampling. They do not cover nonresponse, coverage or measurement error. No weighting is applied.' : 'Non-probability sample: these findings describe respondents only. No margin of error or population inference is reported.'};
};
export const validateQuestionnaire = questions => {
  if(!Array.isArray(questions)||!questions.length||questions.length>20)return 'Add 1–20 questions.';
  if(new Set(questions.map(q=>q.id)).size!==questions.length)return 'Question IDs must be unique.';
  for(const q of questions){if(!q.id||!q.text?.trim()||q.text.length>300||!['single','multi','rating','text'].includes(q.type))return 'Check question wording and type.';if(['single','multi'].includes(q.type)&&(!Array.isArray(q.options)||q.options.length<2||q.options.length>12||q.options.some(o=>typeof o!=='string'||!o.trim()||o.length>120)||new Set(q.options).size!==q.options.length))return 'Use 2–12 distinct choices.';}
  return '';
};
export const validateAnswers = (questions,answers) => {
  if(!answers||typeof answers!=='object')return 'Enter answers.';
  for(const q of questions){const value=answers[q.id];if(value===undefined||value===''){if(q.required)return `Answer: ${q.text}`;continue;}if(q.type==='single'&&!q.options.includes(value))return 'Choose a listed answer.';if(q.type==='multi'&&(!Array.isArray(value)||!value.length||value.some(v=>!q.options.includes(v))||new Set(value).size!==value.length))return 'Check multiple-choice answers.';if(q.type==='rating'&&(!Number.isInteger(Number(value))||Number(value)<1||Number(value)>5))return 'Ratings must be 1–5.';if(q.type==='text'&&(typeof value!=='string'||value.length>2000))return 'Text answers are too long.';}
  return '';
};
