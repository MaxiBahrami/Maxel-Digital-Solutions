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


if(typeof document.querySelectorAll==='function'){
  const motionSections=document.querySelectorAll('.motion-section');
  if(motionSections.length){
    if(typeof IntersectionObserver!=='undefined'){
      const motionObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add('is-visible');
            motionObserver.unobserve(entry.target);
          }
        });
      },{threshold:.16});
      motionSections.forEach(section=>motionObserver.observe(section));
    }else{
      motionSections.forEach(section=>section.classList.add('is-visible'));
    }
  }
}


if(typeof document.querySelectorAll==='function'){
  const serviceSystems=document.querySelectorAll('[data-service-system]');
  serviceSystems.forEach(system=>{
    const rows=Array.from(system.querySelectorAll('.mx-ss__item'));
    const visual=system.querySelector('.mx-ss__visual');
    if(!rows.length||!visual)return;

    const visualIndex=visual.querySelector('[data-service-index]');
    const visualKicker=visual.querySelector('[data-service-kicker]');
    const visualTitle=visual.querySelector('[data-service-title]');

    const activate=row=>{
      rows.forEach(item=>item.classList.toggle('is-active',item===row));
      visual.dataset.state=row.dataset.state;
      if(visualIndex)visualIndex.textContent=(row.dataset.index||'01')+' / 04';
      if(visualKicker)visualKicker.textContent=row.dataset.kicker||'';
      if(visualTitle)visualTitle.textContent=row.dataset.title||'';
    };

    rows.forEach(row=>{
      row.addEventListener('mouseenter',()=>activate(row));
      row.addEventListener('focusin',()=>activate(row));
    });

    if(typeof IntersectionObserver!=='undefined'){
      const observer=new IntersectionObserver(entries=>{
        const visible=entries
          .filter(entry=>entry.isIntersecting)
          .sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
        if(visible.length)activate(visible[0].target);
      },{
        threshold:[.35,.55,.75],
        rootMargin:'-18% 0px -38% 0px'
      });
      rows.forEach(row=>observer.observe(row));
    }
  });
}


if(typeof document.querySelectorAll==='function'){
  const processRails=document.querySelectorAll('[data-process-rail]');
  processRails.forEach(rail=>{
    const track=rail.querySelector('[data-process-track]');
    const cards=Array.from(rail.querySelectorAll('[data-process-step]'));
    const prev=rail.querySelector('[data-process-prev]');
    const next=rail.querySelector('[data-process-next]');
    const dots=Array.from(rail.querySelectorAll('.mx-pr__dots span'));
    if(!track||!cards.length)return;

    let active=0;
    const setActive=index=>{
      active=Math.max(0,Math.min(cards.length-1,index));
      cards.forEach((card,i)=>card.classList.toggle('is-active',i===active));
      dots.forEach((dot,i)=>dot.classList.toggle('is-active',i===active));
      if(prev)prev.disabled=active===0;
      if(next)next.disabled=active===cards.length-1;
    };

    const goTo=index=>{
      const card=cards[Math.max(0,Math.min(cards.length-1,index))];
      if(card&&typeof card.scrollIntoView==='function'){
        card.scrollIntoView({behavior:'smooth',block:'nearest',inline:'start'});
      }
      setActive(index);
    };

    cards.forEach((card,index)=>{
      card.addEventListener('mouseenter',()=>setActive(index));
      card.addEventListener('focusin',()=>setActive(index));
    });
    if(prev)prev.addEventListener('click',()=>goTo(active-1));
    if(next)next.addEventListener('click',()=>goTo(active+1));

    if(typeof IntersectionObserver!=='undefined'){
      const observer=new IntersectionObserver(entries=>{
        const visible=entries
          .filter(entry=>entry.isIntersecting)
          .sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
        if(visible.length){
          const index=cards.indexOf(visible[0].target);
          if(index>=0)setActive(index);
        }
      },{root:track,threshold:[.55,.75,.9]});
      cards.forEach(card=>observer.observe(card));
    }
    setActive(0);
  });
}
