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
      rail.style.setProperty('--mx-process-progress',cards.length>1?((active/(cards.length-1))*100)+'%':'0%');
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


if(typeof document.querySelectorAll==='function'){
  const workShowcases=document.querySelectorAll('[data-work-showcase]');
  workShowcases.forEach(showcase=>{
    const stage=showcase.querySelector('.mx-work2__stage');
    const tabs=Array.from(showcase.querySelectorAll('[data-work-tab]'));
    const title=showcase.querySelector('[data-work-title]');
    const kicker=showcase.querySelector('[data-work-kicker]');
    const index=showcase.querySelector('[data-work-index]');
    const detailWrap=showcase.querySelector('[data-work-detail-wrap]');
    const selector=showcase.querySelector('[data-work-selector]');
    const viewport=showcase.querySelector('[data-work-selector-viewport]');
    const track=showcase.querySelector('[data-work-selector-track]');
    const cards=Array.from(showcase.querySelectorAll('.mx-worknav__card'));
    const projectButtons=Array.from(showcase.querySelectorAll('[data-project-select]'));
    const prev=showcase.querySelector('[data-work-selector-prev]');
    const next=showcase.querySelector('[data-work-selector-next]');
    const count=showcase.querySelector('[data-work-selector-count]');
    const progress=showcase.querySelector('[data-work-selector-progress]');

    if(stage&&tabs.length){
      const copy={
        student:['STUDENT EXPERIENCE','Learning that feels clear.','01 / 03'],
        teacher:['TEACHER EXPERIENCE','Teaching with less friction.','02 / 03'],
        admin:['ADMIN EXPERIENCE','Operations in one place.','03 / 03']
      };
      const setWork=state=>{
        stage.dataset.workState=state;
        tabs.forEach(tab=>tab.classList.toggle('is-active',tab.dataset.workTab===state));
        if(copy[state]){
          if(kicker)kicker.textContent=copy[state][0];
          if(title)title.textContent=copy[state][1];
          if(index)index.textContent=copy[state][2];
        }
      };
      tabs.forEach(tab=>tab.addEventListener('click',()=>setWork(tab.dataset.workTab)));
      setWork('student');
    }

    if(selector&&viewport&&track&&cards.length){
      showcase.classList.add('is-selector-enhanced');
      if(detailWrap){
        detailWrap.classList.remove('is-open');
        detailWrap.setAttribute('aria-hidden','true');
        if('inert' in detailWrap)detailWrap.inert=true;
      }

      const updateRail=()=>{
        const max=Math.max(1,viewport.scrollWidth-viewport.clientWidth);
        const ratio=Math.max(0,Math.min(1,viewport.scrollLeft/max));
        if(progress)progress.style.transform='scaleX('+ratio+')';

        const center=viewport.scrollLeft+(viewport.clientWidth/2);
        let nearest=0;
        let nearestDistance=Infinity;
        cards.forEach((card,i)=>{
          const cardCenter=card.offsetLeft+(card.offsetWidth/2);
          const normalized=Math.max(-1,Math.min(1,(cardCenter-center)/(viewport.clientWidth*.72)));
          const distance=Math.abs(normalized);
          if(distance<nearestDistance){nearestDistance=distance;nearest=i;}
          card.style.setProperty('--work-card-x',String(normalized));
          card.style.setProperty('--work-card-scale',String(1-(distance*.055)));
          card.classList.toggle('is-near',distance<.34);
        });
        if(count)count.textContent=String(nearest+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
        if(prev)prev.disabled=viewport.scrollLeft<=4;
        if(next)next.disabled=viewport.scrollLeft>=max-4;
      };

      const scrollCard=index=>{
        const card=cards[Math.max(0,Math.min(cards.length-1,index))];
        if(card)viewport.scrollTo({left:Math.max(0,card.offsetLeft-18),behavior:'smooth'});
      };

      if(prev)prev.addEventListener('click',()=>{
        const width=cards[0]?.offsetWidth||viewport.clientWidth*.75;
        const current=Math.round(viewport.scrollLeft/(width+16));
        scrollCard(current-1);
      });
      if(next)next.addEventListener('click',()=>{
        const width=cards[0]?.offsetWidth||viewport.clientWidth*.75;
        const current=Math.round(viewport.scrollLeft/(width+16));
        scrollCard(current+1);
      });

      const closeButtons=Array.from(showcase.querySelectorAll('[data-work-close]'));

      const setProjectOpen=(button,open,shouldScroll=true)=>{
        showcase.classList.toggle('has-open-case',open);
        projectButtons.forEach(item=>{
          const selected=item===button&&open;
          item.classList.toggle('is-selected',selected);
          item.setAttribute('aria-expanded',String(selected));
          const action=item.querySelector('.mx-worknav__open');
          if(action){
            action.firstChild.textContent=selected?'Close case ':'Open case ';
            const arrow=action.querySelector('i');
            if(arrow)arrow.textContent=selected?'↑':'↓';
          }
        });

        if(!detailWrap)return;

        if(open){
          detailWrap.removeAttribute('aria-hidden');
          if('inert' in detailWrap)detailWrap.inert=false;
          if(typeof requestAnimationFrame==='function'){
            requestAnimationFrame(()=>detailWrap.classList.add('is-open'));
          }else{
            detailWrap.classList.add('is-open');
          }
          if(shouldScroll&&typeof detailWrap.scrollIntoView==='function'){
            setTimeout(()=>detailWrap.scrollIntoView({behavior:'smooth',block:'start'}),120);
          }
        }else{
          detailWrap.classList.remove('is-open');
          detailWrap.setAttribute('aria-hidden','true');
          if('inert' in detailWrap)detailWrap.inert=true;

          const about=showcase.querySelector('[data-edufy-about]');
          const aboutToggle=showcase.querySelector('[data-edufy-about-toggle]');
          const aboutPanel=showcase.querySelector('[data-edufy-about-panel]');
          if(about)about.classList.remove('is-open');
          if(aboutToggle)aboutToggle.setAttribute('aria-expanded','false');
          if(aboutPanel)aboutPanel.setAttribute('aria-hidden','true');

          if(shouldScroll&&button&&typeof button.scrollIntoView==='function'){
            setTimeout(()=>button.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}),180);
          }
        }
      };

      projectButtons.forEach(button=>button.addEventListener('click',()=>{
        const isOpen=button.getAttribute('aria-expanded')==='true';
        setProjectOpen(button,!isOpen,true);
      }));

      closeButtons.forEach(closeButton=>closeButton.addEventListener('click',()=>{
        const activeButton=projectButtons.find(button=>button.getAttribute('aria-expanded')==='true')||projectButtons[0];
        setProjectOpen(activeButton,false,true);
      }));

      let dragging=false;
      let startX=0;
      let startScroll=0;
      viewport.addEventListener('pointerdown',event=>{
        if(event.pointerType==='mouse'){
          dragging=true;
          startX=event.clientX;
          startScroll=viewport.scrollLeft;
          viewport.classList.add('is-dragging');
          if(typeof viewport.setPointerCapture==='function')viewport.setPointerCapture(event.pointerId);
        }
      });
      viewport.addEventListener('pointermove',event=>{
        if(!dragging)return;
        viewport.scrollLeft=startScroll-(event.clientX-startX);
      });
      const endDrag=()=>{
        dragging=false;
        viewport.classList.remove('is-dragging');
      };
      viewport.addEventListener('pointerup',endDrag);
      viewport.addEventListener('pointercancel',endDrag);
      viewport.addEventListener('scroll',updateRail,{passive:true});
      if(typeof window!=='undefined'&&typeof window.addEventListener==='function')window.addEventListener('resize',updateRail,{passive:true});
      updateRail();
    }
  });
}

if(typeof document.querySelectorAll==='function'){
  const edufyAboutBlocks=document.querySelectorAll('[data-edufy-about]');
  edufyAboutBlocks.forEach(block=>{
    const toggle=block.querySelector('[data-edufy-about-toggle]');
    const panel=block.querySelector('[data-edufy-about-panel]');
    if(!toggle||!panel)return;

    block.classList.add('is-about-enhanced');

    const setOpen=open=>{
      block.classList.toggle('is-open',open);
      toggle.setAttribute('aria-expanded',String(open));
      if(open)panel.removeAttribute('aria-hidden');
      else panel.setAttribute('aria-hidden','true');
    };

    toggle.addEventListener('click',()=>{
      setOpen(toggle.getAttribute('aria-expanded')!=='true');
    });

    setOpen(false);
  });
}


if(typeof window!=='undefined'&&typeof document!=='undefined'){
  const root=document.documentElement;
  const header=document.querySelector?document.querySelector('.site-header'):null;
  const updatePageProgress=()=>{
    const doc=document.documentElement;
    const max=Math.max(1,(doc.scrollHeight||0)-(window.innerHeight||0));
    const progress=Math.max(0,Math.min(1,(window.scrollY||0)/max));
    root.style.setProperty('--mx-page-progress',String(progress));
    if(header)header.classList.toggle('is-scrolled',(window.scrollY||0)>24);
  };
  if(typeof window.addEventListener==='function'){
    window.addEventListener('scroll',updatePageProgress,{passive:true});
    window.addEventListener('resize',updatePageProgress,{passive:true});
  }
  updatePageProgress();
}
