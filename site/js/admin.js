/* Admin dashboard and user management (demonstration, browser storage only) */
(function(){
  function get(s,k,d){try{return JSON.parse(s.getItem(k))||d}catch(e){return d}}
  var me=get(sessionStorage,'buSession',null);
  if(!me||me.role!=='Administrator')return;
  var stats=document.getElementById('stats');
  if(stats){
    var rows=get(localStorage,'buPayroll',[]),g=0,t=0,n=0;
    rows.forEach(function(r){g+=r.gross;t+=r.total;n+=r.net});
    var us=get(localStorage,'buUsers',[]);
    function ratingText(){var r=get(localStorage,'buRatings',[]).filter(function(x){return x&&x.stars>=1&&x.stars<=5});if(!r.length)return 'No ratings yet';var t=0;r.forEach(function(x){t+=x.stars});return (Math.round(t/r.length*10)/10).toFixed(1)+' / 5 ('+r.length+')'}
    function card(l,v){return '<div class="stat"><span>'+l+'</span><strong>'+v+'</strong></div>'}
    stats.innerHTML=card('Employees on payroll',rows.length)+card('Total gross pay (UGX)',fmt(g))+card('Total deductions (UGX)',fmt(t))+card('Total net pay (UGX)',fmt(n))+card('Registered users',us.length)+card('Average visitor rating',ratingText());

    /* Password reset requests (only for emails that have an account) */
    function pendingResets(){var rq=get(localStorage,'buResetRequests',[]);return Array.isArray(rq)?rq.filter(function(q){return us.some(function(u){return String(u.email).toLowerCase()===q.email})}):[]}
    stats.insertAdjacentHTML('beforeend',card('Password reset requests',pendingResets().length));

    /* Visitor ratings with moderation */
    var ar=document.getElementById('adminRatings');
    function paintRatings(){
      var l=get(localStorage,'buRatings',[]).filter(function(x){return x&&x.stars>=1&&x.stars<=5}),c=[0,0,0,0,0,0],sum=0;
      l.forEach(function(x){c[x.stars]++;sum+=x.stars});
      if(!l.length){ar.innerHTML='<p>No ratings yet. They appear here after visitors rate the site.</p>';return}
      var bars='';for(var k=5;k>=1;k--){var p=Math.round(c[k]/l.length*100);bars+='<li><span>'+k+' ★</span><span class="rv-bar"><i style="width:'+p+'%"></i></span><span class="rv-n">'+c[k]+'</span></li>'}
      var recent=l.slice().sort(function(a,b){return b.ts-a.ts}).slice(0,8);
      ar.innerHTML='<div class="rv-grid"><div class="rv-score"><div class="rv-avg">'+(Math.round(sum/l.length*10)/10).toFixed(1)+'</div><p class="rv-count">from '+l.length+' rating'+(l.length>1?'s':'')+'</p></div><ul class="rv-bars" aria-label="Rating breakdown">'+bars+'</ul></div>'+
        '<h3 style="margin-top:26px">Latest ratings</h3><div class="scroll"><table><thead><tr><th>Stars</th><th>Name</th><th>Comment</th><th>When</th><th></th></tr></thead><tbody>'+
        recent.map(function(x){return '<tr><td>'+x.stars+' / 5</td><td>'+esc(x.name||'A visitor')+'</td><td>'+(x.comment?esc(x.comment):'<small>No comment</small>')+'</td><td>'+new Date(x.ts).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+'</td><td><button class="link" data-rdel="'+esc(x.id)+'">Remove</button></td></tr>'}).join('')+'</tbody></table></div>'+
        '<p class="note">Ratings shown here were entered in this browser. Remove a comment if it is abusive or spam.</p>';
    }
    if(ar){paintRatings();ar.addEventListener('click',function(e){var id=e.target.dataset&&e.target.dataset.rdel;if(!id)return;
      if(!confirm('Remove this rating?'))return;
      var l=get(localStorage,'buRatings',[]).filter(function(x){return x.id!==id});try{localStorage.setItem('buRatings',JSON.stringify(l))}catch(x){}
      var s=document.querySelector('#stats');paintRatings()})}

    /* Announcements: a draft kept in this browser, downloadable as js/news.js */
    var af=document.getElementById('annForm');
    if(af){
      liveValidate(af);
      var al=document.getElementById('annList'),am=document.getElementById('annMsg');
      function draft(){var d=get(localStorage,'buNewsDraft',null);return Array.isArray(d)?d:(window.BU_NEWS||[]).map(function(n){return{date:n.date,title:n.title,text:n.text||''}})}
      function saveDraft(l){try{localStorage.setItem('buNewsDraft',JSON.stringify(l))}catch(e){}}
      function sayA(t,bad){am.textContent=t;am.className='auth-msg '+(bad?'bad':'ok');am.hidden=!t}
      function paintAnn(){
        var l=draft().slice().sort(function(a,b){return a.date<b.date?1:-1});
        al.innerHTML=l.length?'<div class="scroll"><table><thead><tr><th>Date</th><th>Title</th><th>Details</th><th></th></tr></thead><tbody>'+l.map(function(n){
          return '<tr><td>'+esc(n.date)+'</td><td>'+esc(n.title)+'</td><td>'+(n.text?esc(n.text):'<small>None</small>')+'</td><td><button class="link" data-adel="'+esc(n.date)+'|'+esc(n.title)+'">Remove</button></td></tr>'}).join('')+'</tbody></table></div>':'<p>No announcements yet.</p>';
      }
      paintAnn();
      af.addEventListener('submit',function(e){
        e.preventDefault();sayA('');
        if(!validate(af)){sayA('Please fix the highlighted fields.',true);return}
        var f=af.elements,n={date:f.date.value,title:f.title.value.trim().slice(0,80),text:f.text.value.trim().slice(0,300)};
        if(!/^\d{4}-\d{2}-\d{2}$/.test(n.date)){sayA('Please choose a date.',true);return}
        var l=draft();l.push(n);saveDraft(l);af.reset();clearMarks(af);paintAnn();
        sayA('Added to your draft. Press Download news.js to publish it for all visitors.');
      });
      al.addEventListener('click',function(e){var k=e.target.dataset&&e.target.dataset.adel;if(!k)return;
        if(!confirm('Remove this announcement from the draft?'))return;
        saveDraft(draft().filter(function(n){return (n.date+'|'+n.title)!==k}));paintAnn();sayA('Removed from your draft.')});
      document.getElementById('annDownload').addEventListener('click',function(){
        var l=draft().slice().sort(function(a,b){return a.date<b.date?1:-1});
        var body='/* ANNOUNCEMENTS shown on the home page: pay dates, deadlines, notices.\n   Made on the admin dashboard. Upload this file to the js folder to publish it.\n   Each item: date (YYYY-MM-DD), title, text (optional). An empty list hides the section. */\nwindow.BU_NEWS='+JSON.stringify(l,null,2).replace(/</g,'\\u003c')+';\n';
        var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/javascript;charset=utf-8'}));a.download='news.js';
        document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
        sayA('news.js downloaded with '+l.length+' announcement'+(l.length===1?'':'s')+'. Upload it to the js folder of your site, replacing the old file.');
      });
      document.getElementById('annReset').addEventListener('click',function(){
        if(!confirm('Discard your draft and go back to the announcements in the published news.js?'))return;
        try{localStorage.removeItem('buNewsDraft')}catch(e){}paintAnn();sayA('Draft discarded.');
      });
    }

    /* Site content overview */
    var ct=document.querySelector('#contentTable tbody');
    if(ct){
      var today=new Date().toISOString().slice(0,10),vac=window.BU_VACANCIES||[],live=vac.filter(function(v){return v&&(!v.deadline||v.deadline>=today)}).length,
          news=(window.BU_NEWS||[]).length,rules=(window.BU_RULES||[]).slice().sort(function(a,b){return a.from<b.from?1:-1}),cf=window.BU_CONFIG||{};
      function row(a,b,c){return '<tr><td>'+a+'</td><td>'+b+'</td><td><code>'+c+'</code></td></tr>'}
      ct.innerHTML=
        row('Vacancies',live+' open of '+vac.length+' listed (closed ones hide by themselves)','js/vacancies.js')+
        row('Announcements',(news?news+' published on the home page':'None published, so the section is hidden')+(get(localStorage,'buNewsDraft',null)?' (you also have an unpublished draft)':''),'js/news.js')+
        row('Tax and NSSF rules',rules.length?esc(rules[0].label)+' is the newest set (from '+esc(rules[0].from)+')':'Built-in rates','js/rules.js')+
        row('Contact settings',[cf.contactEmail?'email set':'no email',cf.contactWhatsapp?'WhatsApp set':'no WhatsApp',cf.contactEndpoint?'send address set':'no send address'].join(', '),'js/config.js');
    }
    var rb=document.querySelector('#recent tbody');
    rb.innerHTML=rows.length?rows.slice(-5).reverse().map(function(r){return '<tr><td>'+esc(r.name)+'<br><small>'+esc(r.id)+' | '+esc(r.dept)+'</small></td><td>'+esc(r.month)+'</td><td class="n">'+fmt(r.gross)+'</td><td class="n">'+fmt(r.net)+'</td></tr>'}).join(''):'<tr><td colspan="4">No payroll records yet. Open Payroll to add an employee.</td></tr>';
  }
  var ub=document.getElementById('usersBody');
  if(ub){
    var ROLES=['Staff member','HR officer','Accountant','Administrator'],note=document.getElementById('usersMsg');
    function list(){return get(localStorage,'buUsers',[])}
    function save(l){try{localStorage.setItem('buUsers',JSON.stringify(l))}catch(e){}}
    function say(t,bad){note.textContent=t;note.className='auth-msg '+(bad?'bad':'ok');note.hidden=!t}
    function admins(l){return l.filter(function(u){return u.role==='Administrator'}).length}
    function render(){
      ub.innerHTML=list().map(function(u,i){var self=u.email===me.email;
        return '<tr><td>'+esc(u.name)+'</td><td>'+esc(u.email)+'</td><td><select class="role" data-i="'+i+'" aria-label="Role for '+esc(u.name)+'"'+(self?' disabled':'')+'>'+ROLES.map(function(r){return '<option'+(r===u.role?' selected':'')+'>'+r+'</option>'}).join('')+'</select>'+(u.requested&&u.requested!==u.role?'<br><small>Asked for: '+esc(u.requested)+'</small>':'')+(wantsReset(u.email)?'<br><small class="flag">Password reset requested</small>':'')+'</td><td>'+(self?'<small>You</small>':'<button class="link" data-r="'+i+'">Reset password</button> <button class="link" data-d="'+i+'">Delete</button>')+'</td></tr>'}).join('');
    }
    function resets(){try{var r=JSON.parse(localStorage.getItem('buResetRequests')||'[]');return Array.isArray(r)?r:[]}catch(e){return[]}}
    function wantsReset(e){return resets().some(function(x){return x.email===String(e).toLowerCase()})}
    ub.addEventListener('change',function(e){
      var i=e.target.dataset.i;if(i===undefined)return;var l=list(),u=l[i];
      if(u.role==='Administrator'&&e.target.value!=='Administrator'&&admins(l)<2){say('There must be at least one administrator.',true);render();return}
      u.role=e.target.value;save(l);say(u.name+' is now '+u.role+'.');
    });
    ub.addEventListener('click',function(e){
      var ri=e.target.dataset.r;
      if(ri!==undefined){
        var rl=list(),ru=rl[ri],A=window.buAuth;if(!ru||!A)return;
        if(!confirm('Reset the password for '+ru.name+'? Their old password will stop working.'))return;
        var L='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz',D='23456789',tmp='',b=new Uint8Array(11);
        (window.crypto||{getRandomValues:function(x){for(var k=0;k<x.length;k++)x[k]=Math.floor(Math.random()*256)}}).getRandomValues(b);
        for(var k=0;k<11;k++)tmp+=k<8?L[b[k]%L.length]:D[b[k]%D.length];
        var salt=A.rand();
        A.sha(salt+tmp).then(function(h){ru.salt=salt;ru.hash=h;save(rl);try{localStorage.setItem('buResetRequests',JSON.stringify(resets().filter(function(x){return x.email!==String(ru.email).toLowerCase()})))}catch(x){}render();say('Temporary password for '+ru.name+': '+tmp+'  Share it privately. They can change it under My account.')});
        return;
      }
      var i=e.target.dataset.d;if(i===undefined)return;var l=list(),u=l[i];
      if(u.role==='Administrator'&&admins(l)<2){say('There must be at least one administrator.',true);return}
      if(confirm('Delete the account for '+u.name+'?')){l.splice(i,1);save(l);say('Account deleted.');render()}
    });
    render();
  }
})();
