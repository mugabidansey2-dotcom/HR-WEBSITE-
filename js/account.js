/* "My account": a logged-in person sees their own payslips and can change their password.
   Payslips are matched by the email address on the payroll record. (Demonstration: data lives in this browser.) */
(function(){
  var A=window.buAuth;if(!A||!A.me)return;
  var me=A.me,email=String(me.email||'').toLowerCase();
  var who=document.getElementById('acctWho');if(who)who.textContent=me.name+' · '+me.role+' · '+me.email;

  /* Payslips */
  var rows=[];try{rows=JSON.parse(localStorage.getItem('buPayroll')||'[]')}catch(e){rows=[]}
  var mine=rows.filter(function(r){return r&&r.email&&String(r.email).toLowerCase()===email}).sort(function(a,b){return a.month<b.month?1:-1});
  var box=document.getElementById('slipList'),view=document.getElementById('payslip'),pb=document.getElementById('printBtn');
  function show(i){view.innerHTML=slipHtml(mine[i]);pb.hidden=false;
    Array.prototype.forEach.call(box.querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',b.dataset.i==i)})}
  if(!mine.length){
    box.innerHTML='<p class="muted">No payslips found for '+esc(me.email)+'. Ask the payroll office to add your email address to your payroll record.</p>';
  }else{
    box.innerHTML='<ul class="slip-list">'+mine.map(function(r,i){
      var m=new Date(r.month+'-01').toLocaleDateString('en-GB',{month:'long',year:'numeric'});
      return '<li><button type="button" data-i="'+i+'" aria-pressed="false"><span>'+m+'</span><strong>UGX '+fmt(r.net)+'</strong></button></li>'}).join('')+'</ul>';
    box.addEventListener('click',function(e){var b=e.target.closest('button[data-i]');if(b)show(+b.dataset.i)});
    show(0);
  }
  pb.addEventListener('click',function(){window.print()});

  /* Change password */
  var f=document.getElementById('pwForm'),msg=document.getElementById('pwMsg');
  function say(t,ok){msg.textContent=t;msg.className='auth-msg '+(ok?'ok':'bad');msg.hidden=!t}
  var sp=document.getElementById('showpw');
  if(sp)sp.addEventListener('change',function(){document.querySelectorAll('input[data-pw]').forEach(function(i){i.type=sp.checked?'text':'password'})});
  if(!f)return;
  liveValidate(f);
  f.addEventListener('submit',function(e){
    e.preventDefault();say('');
    if(!validate(f)){say('Please fix the highlighted fields.');return}
    var list=A.users(),u=list.filter(function(x){return x.email===me.email})[0];
    if(!u){say('Your account could not be found. Please log in again.');return}
    A.sha(u.salt+f.elements.current.value).then(function(h){
      if(h!==u.hash){f.elements.current.classList.remove('is-valid');f.elements.current.classList.add('is-invalid');say('Your current password is not correct.');return}
      var salt=A.rand();
      return A.sha(salt+f.elements.newpassword.value).then(function(nh){
        u.salt=salt;u.hash=nh;A.save(list);f.reset();clearMarks(f);say('Password changed. Use the new one next time you log in.',true);
      });
    });
  });
})();
