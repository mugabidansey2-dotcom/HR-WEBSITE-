/* Shows the vacancies from js/vacancies.js. Closed vacancies (past their deadline) are hidden. */
(function(){
  var box=document.getElementById('vacList');if(!box)return;
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  var today=new Date().toISOString().slice(0,10);
  var list=(window.BU_VACANCIES||[]).filter(function(v){return v&&v.title&&(!v.deadline||v.deadline>=today)})
    .sort(function(a,b){return (a.deadline||'9999')<(b.deadline||'9999')?-1:1});
  if(!list.length){box.innerHTML='<div class="vac-empty"><p class="vac-empty-title">No vacancies right now</p><p>Please check again soon, or <a href="job-application.html">send an application</a> to be considered for future roles.</p></div>';return}
  box.innerHTML=list.map(function(v){
    var d=v.deadline?new Date(v.deadline+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'Open until filled';
    var url='job-application.html?position='+encodeURIComponent(v.title)+(v.department?'&department='+encodeURIComponent(v.department):'');
    return '<article class="vac-card"><div class="vac-head"><div><h2>'+esc(v.title)+'</h2><p class="vac-meta">'+esc(v.department||'')+(v.type?' · '+esc(v.type):'')+'</p></div><span class="vac-deadline">Apply by<strong>'+d+'</strong></span></div>'+
      (v.summary?'<p>'+esc(v.summary)+'</p>':'')+
      (v.requirements&&v.requirements.length?'<h3>Requirements</h3><ul class="check-list">'+v.requirements.map(function(r){return '<li>'+esc(r)+'</li>'}).join('')+'</ul>':'')+
      '<a class="button button-blue" href="'+url+'">Apply for this job</a></article>';
  }).join('');
})();
