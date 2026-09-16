const menu=document.querySelector('.static-menu');
if(menu){
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>menu.open=false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
  document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
}
const form=document.getElementById('project-brief');
if(form){
  const service=document.getElementById('service');
  const requestedService=new URLSearchParams(location.search).get('service');
  if([...service.options].some(option=>option.value===requestedService))service.value=requestedService;
  const result=document.getElementById('brief-result');
  const text=document.getElementById('brief-text');
  const status=document.getElementById('brief-status');
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const values=new FormData(form);
    text.value=[
      'MAXEL DIGITAL SOLUTIONS — PROJECT BRIEF','',
      `Name: ${values.get('name').trim()}`,`Email: ${values.get('email').trim()}`,
      `Company: ${values.get('company').trim()||'Not specified'}`,
      `Service: ${service.selectedOptions[0].textContent}`,
      `Budget: ${values.get('budget')}`,`Timing: ${values.get('timeline')}`,
      '', 'PROJECT DETAILS', values.get('message').trim(),
    ].join('\n');
    const email=form.dataset.contactEmail;
    const emailLink=document.getElementById('email-brief');
    if(email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      const uri='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('Project inquiry — Maxel Digital Solutions')+'&body='+encodeURIComponent(text.value);
      // Long drafts exceed URL limits in some mail applications: keep copy/download available.
      if(uri.length<1800){emailLink.href=uri;emailLink.hidden=false;}else{emailLink.removeAttribute('href');emailLink.hidden=true;}
    }
    result.hidden=false;status.textContent='Ready to copy or download. Nothing has been sent.';result.focus();
  });
  document.getElementById('copy-brief').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(text.value);status.textContent='Brief copied. Paste it into your message to Maximilian.';}
    catch{text.focus();text.select();status.textContent='Automatic copying is unavailable. The brief is selected — use your device’s Copy command.';}
  });
  document.getElementById('download-brief').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([text.value],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='maxel-project-brief.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='The download was requested. Check your downloads folder.';
  });
  form.addEventListener('input',()=>{if(!result.hidden){result.hidden=true;status.textContent='';}});
  document.getElementById('prepare-brief').disabled=false;
}
