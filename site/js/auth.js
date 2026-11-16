/* Demonstration login, sign-up and admin access control.
   Accounts live only in this browser (localStorage). A real system must check passwords and roles on a server. */
(function(){
  var ADMIN_EMAIL='admin@bugemauniversity.ac.ug',ADMIN='Administrator';
  /* The first administrator is stored as a salted hash, so the password is not written in this file. */
  var ADMIN_SALT='311ca40728a5927e1aae4e9b2af40cd8',ADMIN_HASH='f1cf07d1e8e8f239a82ec7fbb51fdaa9cff382ccebd142a65d904e5fbc3bae40';
  function get(store,k,d){try{return JSON.parse(store.getItem(k))||d}catch(e){return d}}
  function put(store,k,v){try{store.setItem(k,JSON.stringify(v))}catch(e){}}
  function users(){return get(localStorage,'buUsers',[])}
  function rand(){var a=new Uint8Array(16);if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(a);else for(var i=0;i<16;i++)a[i]=Math.floor(Math.random()*256);return Array.prototype.map.call(a,function(x){return('0'+x.toString(16)).slice(-2)}).join('')}
  function sha(t){
    if(window.crypto&&crypto.subtle&&window.TextEncoder)
      return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')});
    var h=5381;for(var i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return Promise.resolve('weak'+h);
  }
  var me=get(sessionStorage,'buSession',null),isAdmin=!!me&&me.role===ADMIN;
  window.buAuth={sha:sha,rand:rand,users:users,save:function(l){return put(localStorage,'buUsers',l)},me:me};

  /* "My account" link for anyone who is logged in */
  var pn=document.getElementById('primary-nav'),here=location.pathname.split('/').pop();
  if(me&&pn){
    var ma=document.createElement('a');ma.href='account.html';ma.innerHTML='<span class="ico" aria-hidden="true">☻</span>My account';
    if(here==='account.html'){ma.className='active';ma.setAttribute('aria-current','page')}
    var adm=pn.querySelector('[data-admin]');
    if(me.role==='Accountant'){var pa=document.createElement('a');pa.href='form.html';pa.innerHTML='<span class="ico" aria-hidden="true">▣</span>Payroll';
      if(here==='form.html'){pa.className='active';pa.setAttribute('aria-current','page')}pn.insertBefore(pa,adm)}
    pn.insertBefore(ma,adm);
  }

  /* Sidebar menu (mobile) and footer year */
  var sb=document.getElementById('sidebar'),sc=document.querySelector('.scrim'),mt=document.querySelector('.menu-toggle');
  function toggle(open){sb.classList.toggle('open',open);sc.classList.toggle('open',open);mt.setAttribute('aria-expanded',open)}
  if(sb&&mt){mt.addEventListener('click',function(){toggle(!sb.classList.contains('open'))});sc.addEventListener('click',function(){toggle(false)});document.addEventListener('keydown',function(e){if(e.key==='Escape')toggle(false)})}
  document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear()});

  /* Show or hide sidebar items by role */
  document.querySelectorAll('[data-admin]').forEach(function(e){e.hidden=!isAdmin});
  if(isAdmin){
    var rq=get(localStorage,'buResetRequests',[]),us0=users(),pend=(Array.isArray(rq)?rq:[]).filter(function(q){return us0.some(function(u){return String(u.email).toLowerCase()===q.email})}).length;
    document.querySelectorAll('[data-reset-count]').forEach(function(b){if(pend){b.className='count-badge';b.textContent=pend;b.setAttribute('title',pend+' password reset request'+(pend>1?'s':''));b.setAttribute('aria-label',pend+' password reset request'+(pend>1?'s':''))}});
  }
  document.querySelectorAll('[data-guest]').forEach(function(e){e.hidden=!!me});
  document.querySelectorAll('[data-user]').forEach(function(e){e.hidden=!me});
  var su0=document.getElementById('sideUser');if(su0&&me)su0.textContent=me.name+' · '+me.role;
  var lo=document.getElementById('logoutLink');
  if(lo)lo.addEventListener('click',function(e){e.preventDefault();try{sessionStorage.removeItem('buSession')}catch(x){}location.href='login.html'});

  /* Make sure the default administrator account exists */
  var ready=(function(){
    if(users().some(function(u){return u.email===ADMIN_EMAIL}))return Promise.resolve();
    var l=users();l.push({name:'System Administrator',email:ADMIN_EMAIL,role:ADMIN,salt:ADMIN_SALT,hash:ADMIN_HASH});put(localStorage,'buUsers',l);
    return Promise.resolve();
  })();

  /* Admin-only pages */
  if(document.body.hasAttribute('data-protected')){
    if(!me){location.replace('login.html?next='+location.pathname.split('/').pop());return}
    var okRoles=(document.body.dataset.roles||ADMIN).split(','),allowed=okRoles.indexOf(me.role)>-1;
    if(!allowed&&!document.body.hasAttribute('data-members')){
      var m=document.getElementById('main');
      m.innerHTML='<section class="page-hero"><div class="container"><p class="eyebrow eyebrow-light">Restricted</p><h1>'+(okRoles.length>1?'Administrators and accountants only':'Administrators only')+'</h1><p>This section is not available for your role. An administrator can change your role on the Users page.</p></div></section><section class="section container"><div class="callout red">You are signed in as '+esc(me.name)+' ('+esc(me.role)+'). Ask an administrator to change your role if you need access.</div><a class="button button-blue" href="index.html">Back to home</a></section>';
    }
    document.body.classList.add('authed');
    var who=document.getElementById('whoami');if(who&&allowed)who.textContent='Signed in as '+me.name+' ('+me.role+'). ';
  }

  var sp=document.getElementById('showpw');
  if(sp)sp.addEventListener('change',function(){document.querySelectorAll('input[data-pw]').forEach(function(i){i.type=sp.checked?'text':'password'})});
  function msg(t,ok){var m=document.getElementById('authMsg');if(!m)return;m.textContent=t;m.className='auth-msg '+(ok?'ok':'bad');m.hidden=!t}

  /* Sign up (new accounts are never administrators) */
  var su=document.getElementById('signupForm');
  if(su&&typeof liveValidate==='function'){
    liveValidate(su);
    su.addEventListener('submit',function(e){
      e.preventDefault();msg('');
      if(!validate(su)){msg('Please fix the highlighted fields.');return}
      var f=su.elements,email=f.email.value.trim().toLowerCase();
      ready.then(function(){
        if(users().some(function(u){return u.email===email})){f.email.classList.remove('is-valid');f.email.classList.add('is-invalid');f.email.parentNode.nextElementSibling.textContent='An account with this email already exists.';msg('That email is already registered. Try logging in.');return}
        var salt=rand();
        sha(salt+f.newpassword.value).then(function(h){
          var list=users();list.push({name:f.name.value.trim(),email:email,role:'Staff member',requested:f.role.value,salt:salt,hash:h});put(localStorage,'buUsers',list);
          location.href='login.html?registered=1';
        });
      });
    });
  }

  /* Log in */
  var li=document.getElementById('loginForm');
  if(li&&typeof liveValidate==='function'){
    liveValidate(li);
    if(/registered=1/.test(location.search))msg('Account created. Please log in.',true);
    else if(/next=account/.test(location.search))msg('Please log in to see your account.');
    else if(/next=/.test(location.search))msg('Please log in with an administrator account to open that page.');
    li.addEventListener('submit',function(e){
      e.preventDefault();msg('');
      if(!validate(li)){msg('Enter your email and password.');return}
      var f=li.elements,email=f.email.value.trim().toLowerCase();
      function fail(){['email','password'].forEach(function(n){f[n].classList.remove('is-valid');f[n].classList.add('is-invalid')});msg('Incorrect email or password.')}
      ready.then(function(){
        var u=users().filter(function(x){return x.email===email})[0];
        if(!u){fail();return}
        sha(u.salt+f.password.value).then(function(h){
          if(h!==u.hash){fail();return}
          put(sessionStorage,'buSession',{name:u.name,email:u.email,role:u.role});
          var n=(/[?&]next=([\w.-]+)/.exec(location.search)||[])[1],ok=['admin.html','form.html','users.html'];
          location.href=n==='account.html'?n:u.role===ADMIN?(ok.indexOf(n)>-1?n:'admin.html'):(u.role==='Accountant'&&n==='form.html'?n:'index.html');
        });
      });
    });
  }
})();
