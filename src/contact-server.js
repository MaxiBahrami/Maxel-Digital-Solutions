(()=>{
const form=document.getElementById('server-contact');
if(form){
  let id=crypto.randomUUID();let busy=false;
  const button=document.getElementById('send-inquiry');const result=document.getElementById('contact-result');
  const service=document.getElementById('service');const requested=new URLSearchParams(location.search).get('service');
  if([...service.options].some(o=>o.value===requested))service.value=requested;
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||!form.reportValidity())return;
    const data=Object.fromEntries(new FormData(form));data.id=id;data.consent=document.getElementById('consent').checked;
    busy=true;button.disabled=true;result.textContent='Saving your inquiry…';
    try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const body=await response.json();if(!response.ok)throw new Error(body.error??'Your inquiry could not be saved.');
      result.textContent=`Your inquiry has been saved. Reference: ${body.reference}. Maximilian can review it and follow up by email. No automatic email is sent.`;form.reset();id=crypto.randomUUID();result.focus();
    }catch(error){result.textContent=error.message+' Your details are still in the form. Please try again.';}finally{busy=false;button.disabled=false;}
  });button.disabled=false;
}

})();
