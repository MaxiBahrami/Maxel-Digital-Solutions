export const services=['websites','digital-products','digital-improvements','not-sure'];
export const budgets=['Not decided yet','Under 10,000 SEK','10,000–30,000 SEK','30,000–75,000 SEK','75,000+ SEK'];
export const timelines=['Flexible / exploring','Within 1 month','Within 1–3 months','More than 3 months'];
export function validateInquiry(raw){
  if(!raw||typeof raw!=='object')return {error:'Please fill in the contact form.'};
  const text=key=>typeof raw[key]==='string'?raw[key].trim():'';
  const data={id:text('id'),name:text('name'),email:text('email').toLowerCase(),company:text('company'),service:text('service'),budget:text('budget'),timeline:text('timeline'),message:text('message'),consent:raw.consent===true};
  if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(data.id))return {error:'Please refresh the page and try again.'};
  if(data.name.length<2||data.name.length>100)return {error:'Please enter a name between 2 and 100 characters.'};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||data.email.length>254)return {error:'Please enter a valid email address.'};
  if(data.company.length>150)return {error:'Company name is too long.'};
  if(!services.includes(data.service)||!budgets.includes(data.budget)||!timelines.includes(data.timeline))return {error:'Please choose a valid service, budget and timeline.'};
  if(data.message.length<20||data.message.length>5000)return {error:'Please enter 20–5,000 characters about your project.'};
  if(!data.consent)return {error:'Please confirm that Maxel may contact you about this inquiry.'};
  if(raw.website)return {error:'Please leave the website field empty.'};
  return {data};
}
