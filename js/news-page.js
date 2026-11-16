/* Shows the announcements from js/news.js on the home page, newest first. */
(function(){
  var box=document.getElementById('newsSection');if(!box)return;
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  var draft=null;try{draft=JSON.parse(localStorage.getItem('buNewsDraft'))}catch(e){}
  var list=(Array.isArray(draft)?draft:(window.BU_NEWS||[])).filter(function(n){return n&&n.title&&/^\d{4}-\d{2}-\d{2}$/.test(n.date||'')}).sort(function(a,b){return a.date<b.date?1:-1}).slice(0,4);
  if(!list.length)return;
  box.querySelector('[data-body]').innerHTML=list.map(function(n){
    var d=new Date(n.date+'T00:00:00');
    return '<article class="news-item"><time datetime="'+n.date+'"><strong>'+d.getDate()+'</strong>'+d.toLocaleDateString('en-GB',{month:'short',year:'numeric'})+'</time><div><h3>'+esc(n.title)+'</h3>'+(n.text?'<p>'+esc(n.text)+'</p>':'')+'</div></article>';
  }).join('');
  box.hidden=false;
})();
