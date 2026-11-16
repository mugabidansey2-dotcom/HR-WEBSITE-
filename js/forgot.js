/* Forgot password: asks an administrator to reset the account.
   - The request is remembered in this browser so an administrator using the Users page sees "Reset requested".
   - If js/config.js has a contactEndpoint or contactEmail, the request is also sent to the payroll office.
   The answer is the same whether or not the email has an account, so the page cannot be used to find out who has one. */
(function(){
  var f=document.getElementById('forgotForm');if(!f)return;
  var msg=document.getElementById('fpMsg'),next=document.getElementById('fpNext'),CFG=window.BU_CONFIG||{};
  liveValidate(f);
  function users(){try{return JSON.parse(localStorage.getItem('buUsers')||'[]')}catch(e){return[]}}
  function reqs(){try{var r=JSON.parse(localStorage.getItem('buResetRequests')||'[]');return Array.isArray(r)?r:[]}catch(e){return[]}}
  function say(t,ok){msg.textContent=t;msg.className='auth-msg '+(ok?'ok':'bad');msg.hidden=!t}
  f.addEventListener('submit',function(e){
    e.preventDefault();say('');next.hidden=true;
    if(!validate(f)){say('Please enter a valid email address.');return}
    var email=f.elements.email.value.trim().toLowerCase();
    if(users().some(function(u){return String(u.email).toLowerCase()===email})){
      var r=reqs().filter(function(x){return x.email!==email});r.push({email:email,ts:Date.now()});
      try{localStorage.setItem('buResetRequests',JSON.stringify(r))}catch(x){}
    }
    function done(extra){say('Thank you. If there is an account for '+email+', an administrator has been asked to reset its password.'+(extra||''),true);next.hidden=false;f.reset();clearMarks(f)}
    if(CFG.contactEndpoint){
      var b=f.querySelector('button[type=submit]');b.disabled=true;
      fetch(CFG.contactEndpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fields:{form:'password-reset',email:email},files:[]})})
        .then(function(r){return r.json()}).then(function(j){if(!j||!j.ok)throw 0;done()})
        .catch(function(){done(' If you do not hear back, please contact the payroll office.')})
        .then(function(){b.disabled=false});
    }else if(CFG.contactEmail){
      location.href='mailto:'+CFG.contactEmail+'?subject='+encodeURIComponent('Password reset request')+'&body='+encodeURIComponent('Please reset the password for my account: '+email);
      done(' Your email app should open so you can send the request.');
    }else done(' You can also contact the payroll office directly.');
  });
})();
