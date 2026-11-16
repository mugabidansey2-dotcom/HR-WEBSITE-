/* Visitor ratings (demonstration: ratings are kept in this browser's localStorage).
   - A friendly rating card slides in after a visitor has spent a little time on the site.
   - Each visitor can rate once, and may update their rating later from the footer link.
   - The home page shows the average, a breakdown and the latest comments.
   A real site needs a server or database so ratings from all visitors are collected in one place. */
(function(){
  var KEY='buRatings',MINE='buMyRating',SEEN='buRatingSnooze',DELAY=14000;
  var WORDS=['','Poor','Fair','Good','Very good','Excellent'];
  var PROMPTS=['','Sorry to hear that. What went wrong?','Thanks. How could we do better?','Glad it was useful. Anything to improve?','Wonderful. What did you like most?','Superb. What stood out for you?'];

  function get(s,k,d){try{var v=JSON.parse(s.getItem(k));return v==null?d:v}catch(e){return d}}
  function put(s,k,v){try{s.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function all(){var l=get(localStorage,KEY,[]);return Array.isArray(l)?l.filter(function(r){return r&&r.stars>=1&&r.stars<=5}):[]}
  function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
  function me(){return get(localStorage,MINE,null)}
  function stats(){
    var l=all(),c=[0,0,0,0,0,0],sum=0;
    l.forEach(function(r){c[r.stars]++;sum+=r.stars});
    return{n:l.length,avg:l.length?sum/l.length:0,c:c,list:l};
  }
  function starsHtml(v){
    var h='';for(var i=1;i<=5;i++){var f=Math.max(0,Math.min(1,v-(i-1)));h+='<span class="rs" style="--f:'+Math.round(f*100)+'%">★</span>'}
    return '<span class="rstars" role="img" aria-label="'+(Math.round(v*10)/10)+' out of 5 stars">'+h+'</span>';
  }
  function ago(ts){
    var s=Math.max(0,(Date.now()-ts)/1000);
    if(s<90)return 'just now';if(s<3600)return Math.round(s/60)+' min ago';
    if(s<86400)return Math.round(s/3600)+' h ago';if(s<2592000)return Math.round(s/86400)+' days ago';
    return new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  }

  /* ---------- Rating dialog ---------- */
  var dlg,lastFocus,stars=0;
  function build(){
    if(dlg)return;
    dlg=document.createElement('div');dlg.className='rate-wrap';dlg.hidden=true;
    dlg.innerHTML=
    '<div class="rate-card" role="dialog" aria-modal="false" aria-labelledby="rateTitle" tabindex="-1">'+
      '<button type="button" class="rate-x" aria-label="Close rating box">&times;</button>'+
      '<div class="rate-step" data-step="ask">'+
        '<p class="rate-eyebrow">Your opinion matters</p>'+
        '<h2 id="rateTitle">How was your visit?</h2>'+
        '<form novalidate>'+
          '<fieldset class="rate-stars"><legend class="sr-only">Rate this website from 1 to 5 stars</legend>'+
            [5,4,3,2,1].map(function(n){return '<input type="radio" name="stars" id="rs'+n+'" value="'+n+'"><label for="rs'+n+'" title="'+WORDS[n]+'"><span aria-hidden="true">★</span><span class="sr-only">'+n+' star'+(n>1?'s':'')+', '+WORDS[n]+'</span></label>'}).join('')+
          '</fieldset>'+
          '<p class="rate-word" aria-live="polite">Tap a star to rate</p>'+
          '<div class="rate-more" hidden>'+
            '<label for="rateComment">Comment <span>(optional)</span></label>'+
            '<textarea id="rateComment" name="comment" rows="3" maxlength="300" placeholder=""></textarea>'+
            '<label for="rateName">Your name <span>(optional)</span></label>'+
            '<input id="rateName" name="name" type="text" maxlength="40" autocomplete="name" placeholder="Shown with your comment">'+
          '</div>'+
          '<p class="rate-err" role="alert" hidden>Please choose a star rating first.</p>'+
          '<div class="rate-actions"><button type="submit" class="rate-btn">Submit rating</button><button type="button" class="rate-later">Not now</button></div>'+
        '</form>'+
      '</div>'+
      '<div class="rate-step" data-step="thanks" hidden>'+
        '<div class="rate-check" aria-hidden="true">✓</div>'+
        '<h2>Thank you!</h2>'+
        '<p class="rate-thanks-msg">Your rating helps us improve.</p>'+
        '<div class="rate-actions"><button type="button" class="rate-btn rate-close">Close</button></div>'+
      '</div>'+
    '</div>';
    document.body.appendChild(dlg);

    var card=dlg.querySelector('.rate-card'),form=dlg.querySelector('form'),word=dlg.querySelector('.rate-word'),
        more=dlg.querySelector('.rate-more'),err=dlg.querySelector('.rate-err'),ta=form.elements.comment;
    function pick(n){
      stars=n;word.textContent=WORDS[n];more.hidden=false;err.hidden=true;
      ta.placeholder=PROMPTS[n];
    }
    form.addEventListener('change',function(e){if(e.target.name==='stars')pick(+e.target.value)});
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!stars){err.hidden=false;return}
      var list=all(),mine=me(),entry={id:mine||id(),stars:stars,name:form.elements.name.value.trim().slice(0,40),comment:ta.value.trim().slice(0,300),ts:Date.now()};
      var at=-1;list.forEach(function(r,i){if(r.id===entry.id)at=i});
      if(at>-1)list[at]=entry;else list.push(entry);
      if(!put(localStorage,KEY,list)){err.textContent='Sorry, your browser would not save the rating.';err.hidden=false;return}
      put(localStorage,MINE,entry.id);
      dlg.querySelector('.rate-thanks-msg').textContent=stars>=4?'We are glad you enjoyed your visit.':'We read every comment and will work on it.';
      show('thanks');paintSection();
    });
    function close(){dlg.classList.remove('in');setTimeout(function(){dlg.hidden=true},260);put(sessionStorage,SEEN,1);if(lastFocus&&lastFocus.focus&&document.contains(lastFocus))lastFocus.focus()}
    dlg.querySelector('.rate-x').addEventListener('click',close);
    dlg.querySelector('.rate-later').addEventListener('click',close);
    dlg.querySelector('.rate-close').addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dlg&&!dlg.hidden)close()});
    dlg._close=close;dlg._card=card;
  }
  function show(step){
    Array.prototype.forEach.call(dlg.querySelectorAll('.rate-step'),function(s){s.hidden=s.dataset.step!==step});
  }
  function open(manual){
    build();
    lastFocus=document.activeElement;
    var form=dlg.querySelector('form'),mine=me(),prev=null;
    if(mine)all().forEach(function(r){if(r.id===mine)prev=r});
    form.reset();stars=0;
    dlg.querySelector('.rate-more').hidden=true;dlg.querySelector('.rate-err').hidden=true;
    dlg.querySelector('.rate-word').textContent='Tap a star to rate';
    dlg.querySelector('#rateTitle').textContent=prev?'Update your rating':'How was your visit?';
    dlg.querySelector('.rate-btn').textContent=prev?'Save changes':'Submit rating';
    if(prev){var r=form.querySelector('#rs'+prev.stars);r.checked=true;form.elements.comment.value=prev.comment||'';form.elements.name.value=prev.name||'';stars=prev.stars;dlg.querySelector('.rate-word').textContent=WORDS[prev.stars];dlg.querySelector('.rate-more').hidden=false}
    show('ask');dlg.hidden=false;
    requestAnimationFrame(function(){dlg.classList.add('in')});
    if(manual)dlg._card.focus();
  }
  window.buOpenRating=function(){open(true)};

  /* ---------- Home page: what visitors say ---------- */
  function paintSection(){
    var box=document.getElementById('ratingsSection');if(!box)return;
    var s=stats(),h='';
    if(!s.n){
      h='<div class="rv-empty"><p class="rv-empty-title">No ratings yet</p><p>Be the first to tell us how your visit went.</p><button type="button" class="rate-btn" data-rate>Rate this site</button></div>';
    }else{
      var bars='';for(var k=5;k>=1;k--){var p=Math.round(s.c[k]/s.n*100);bars+='<li><span>'+k+' ★</span><span class="rv-bar"><i style="width:'+p+'%"></i></span><span class="rv-n">'+s.c[k]+'</span></li>'}
      var latest=s.list.filter(function(r){return r.comment}).sort(function(a,b){return b.ts-a.ts}).slice(0,3);
      h='<div class="rv-grid"><div class="rv-score"><div class="rv-avg">'+(Math.round(s.avg*10)/10).toFixed(1)+'</div>'+starsHtml(s.avg)+'<p class="rv-count">'+s.n+' rating'+(s.n>1?'s':'')+'</p><button type="button" class="rate-btn" data-rate>'+(me()?'Update your rating':'Rate this site')+'</button></div>'+
        '<ul class="rv-bars" aria-label="Rating breakdown">'+bars+'</ul></div>'+
        (latest.length?'<div class="rv-list">'+latest.map(function(r){return '<figure class="rv-item">'+starsHtml(r.stars)+'<blockquote>'+esc(r.comment)+'</blockquote><figcaption>'+esc(r.name||'A visitor')+' · '+ago(r.ts)+'</figcaption></figure>'}).join('')+'</div>':'');
    }
    box.querySelector('[data-body]').innerHTML=h;
  }
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-rate]');if(b){e.preventDefault();window.buOpenRating()}});

  /* ---------- Footer link ---------- */
  var fl=document.querySelector('.footer-links');
  if(fl){var a=document.createElement('a');a.href='#';a.setAttribute('data-rate','');a.textContent='★ Rate this site';fl.appendChild(a)}

  /* ---------- Automatic prompt after a short visit ---------- */
  var session=get(sessionStorage,'buSession',null),skip=
    document.body.hasAttribute('data-protected')||document.getElementById('loginForm')||document.getElementById('signupForm')||
    (session&&session.role==='Administrator');
  paintSection();
  if(skip||me()||get(sessionStorage,SEEN,0))return;
  // Count the time spent across pages in this visit, so a quick page change does not restart the wait.
  var spent=get(sessionStorage,'buRatingTime',0),t0=Date.now();
  function remember(){put(sessionStorage,'buRatingTime',spent+Date.now()-t0)}
  window.addEventListener('pagehide',remember);
  setTimeout(function(){
    if(me()||get(sessionStorage,SEEN,0))return;
    if(document.hidden){document.addEventListener('visibilitychange',function f(){if(!document.hidden){document.removeEventListener('visibilitychange',f);open(false)}})}
    else open(false);
  },Math.max(1500,DELAY-spent));
})();
