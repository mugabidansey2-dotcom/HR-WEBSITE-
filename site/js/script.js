/* Mobile menu */
var mb=document.getElementById('menuBtn'),menu=document.getElementById('menu');
mb.addEventListener('click',function(){var o=menu.classList.toggle('open');mb.setAttribute('aria-expanded',o)});

/* Shared helpers */
function fmt(n){return Math.round(n).toLocaleString('en-UG')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/* Live validation: a field glows green when correct and red when wrong */
function rule(el){
  var v=el.value.trim(),n=el.name;
  if(el.required&&!v)return 'This field is required.';
  if(!v)return '';
  if(el.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return 'Enter a valid email address, for example name@example.com.';
  if(el.type==='number'){
    if(isNaN(v)||Number(v)<0)return 'Enter a number that is 0 or more.';
    if(n==='basic'&&Number(v)<=0)return 'Basic salary must be more than 0.';
  }
  if(n==='name'&&!/^[A-Za-z][A-Za-z .'\-]+$/.test(v))return 'Use letters only, at least 2 characters.';
  if(n==='id'&&!/^[A-Za-z0-9\/\-]{3,20}$/.test(v))return 'Use 3 to 20 letters, numbers, / or -. Example: BU-0142.';
  if(el.minLength>0&&v.length<el.minLength)return 'Enter at least '+el.minLength+' characters.';
  return '';
}
function paint(el,show){
  if(!el.name)return true;
  var msg=rule(el),empty=!el.value.trim(),err=el.parentNode.nextElementSibling;
  el.classList.remove('is-valid','is-invalid');
  if(!(empty&&!el.required)||msg){el.classList.add(msg?'is-invalid':'is-valid')}
  if(err&&err.className==='err')err.textContent=(msg&&show)?msg:'';
  return !msg;
}
function validate(form){
  var ok=true;
  Array.prototype.forEach.call(form.elements,function(el){if(el.name){el.dataset.touched='1';if(!paint(el,true))ok=false}});
  return ok;
}
function liveValidate(form){
  ['input','change','focusout'].forEach(function(ev){form.addEventListener(ev,function(e){
    var el=e.target;if(!el.name)return;
    if(ev==='focusout')el.dataset.touched='1';
    if(el.dataset.touched||ev!=='input')el.dataset.touched='1';
    if(el.dataset.touched)paint(el,true);
  })});
}
function clearMarks(form){
  Array.prototype.forEach.call(form.elements,function(el){el.classList.remove('is-valid','is-invalid');delete el.dataset.touched;
    var err=el.parentNode&&el.parentNode.nextElementSibling;if(err&&err.className==='err')err.textContent=''});
}

/* Payroll rules (demonstration rates, UGX per month) */
function paye(g){
  var t=0;
  if(g>10000000)t+=(g-10000000)*0.1;
  if(g>410000)t+=25000+(Math.min(g,Infinity)-410000)*0.3;
  else if(g>335000)t+=10000+(g-335000)*0.2;
  else if(g>235000)t+=(g-235000)*0.1;
  return t;
}
function calc(d){
  var gross=d.basic+d.housing+d.transport+d.other,nssf=gross*0.05,tax=paye(gross),total=nssf+tax+d.ded;
  return{gross:gross,nssf:nssf,paye:tax,total:total,net:gross-total};
}

/* Contact form */
var cf=document.getElementById('contactForm');if(cf)liveValidate(cf);
if(cf)cf.addEventListener('submit',function(e){
  e.preventDefault();
  var ok=validate(cf);document.getElementById('contactOk').hidden=!ok;
  if(ok){cf.reset();clearMarks(cf)}
});

/* Payroll page */
var pf=document.getElementById('payForm');
if(pf){
  liveValidate(pf);
  var rows=[],tb=document.querySelector('#summary tbody'),tf=document.querySelector('#summary tfoot');
  try{rows=JSON.parse(localStorage.getItem('buPayroll')||'[]')}catch(x){rows=[]}
  function save(){try{localStorage.setItem('buPayroll',JSON.stringify(rows))}catch(x){}}
  function slip(r){
    var m=new Date(r.month+'-01').toLocaleDateString('en-GB',{month:'long',year:'numeric'});
    document.getElementById('payslip').innerHTML='<h3>Bugema University</h3><p class="sub">Excellence in Service</p>'+
    '<p><strong>'+esc(r.name)+'</strong> ('+esc(r.id)+')<br>'+esc(r.title)+', '+esc(r.dept)+'<br>Payslip for '+m+'</p>'+
    '<table><tr><th colspan="2">Earnings</th></tr>'+
    '<tr><td>Basic salary</td><td class="n">'+fmt(r.basic)+'</td></tr>'+
    '<tr><td>Housing allowance</td><td class="n">'+fmt(r.housing)+'</td></tr>'+
    '<tr><td>Transport allowance</td><td class="n">'+fmt(r.transport)+'</td></tr>'+
    '<tr><td>Other allowances</td><td class="n">'+fmt(r.other)+'</td></tr>'+
    '<tr><td><strong>Gross pay</strong></td><td class="n"><strong>'+fmt(r.gross)+'</strong></td></tr>'+
    '<tr><th colspan="2">Deductions</th></tr>'+
    '<tr><td>NSSF (5%)</td><td class="n">'+fmt(r.nssf)+'</td></tr>'+
    '<tr><td>PAYE</td><td class="n">'+fmt(r.paye)+'</td></tr>'+
    '<tr><td>Other deductions</td><td class="n">'+fmt(r.ded)+'</td></tr>'+
    '<tr><td><strong>Total deductions</strong></td><td class="n"><strong>'+fmt(r.total)+'</strong></td></tr>'+
    '<tr class="net"><td>Net pay (UGX)</td><td class="n">'+fmt(r.net)+'</td></tr></table>';
    document.getElementById('printBtn').hidden=false;
  }
  function render(){
    var q=document.getElementById('search').value.toLowerCase(),h='',g=0,t=0,n=0,shown=0;
    rows.forEach(function(r,i){
      if((r.name+' '+r.id+' '+r.dept).toLowerCase().indexOf(q)<0)return;
      shown++;g+=r.gross;t+=r.total;n+=r.net;
      h+='<tr><td>'+esc(r.name)+'<br><small>'+esc(r.id)+' | '+esc(r.dept)+'</small></td><td>'+esc(r.month)+'</td><td class="n">'+fmt(r.gross)+'</td><td class="n">'+fmt(r.total)+'</td><td class="n">'+fmt(r.net)+'</td><td><button class="link" data-v="'+i+'">View</button> <button class="link" data-d="'+i+'">Delete</button></td></tr>';
    });
    tb.innerHTML=h||'<tr><td colspan="6">'+(rows.length?'No employees match your search.':'No payroll records yet. Add an employee using the form.')+'</td></tr>';
    tf.innerHTML=shown?'<tr><td>Total ('+shown+')</td><td></td><td class="n">'+fmt(g)+'</td><td class="n">'+fmt(t)+'</td><td class="n">'+fmt(n)+'</td><td></td></tr>':'';
  }
  pf.addEventListener('submit',function(e){
    e.preventDefault();
    if(!validate(pf))return;
    var f=pf.elements,d={name:f.name.value.trim(),id:f.id.value.trim(),dept:f.dept.value.trim(),title:f.title.value.trim(),month:f.month.value,
      basic:+f.basic.value,housing:+f.housing.value||0,transport:+f.transport.value||0,other:+f.other.value||0,ded:+f.ded.value||0};
    var r=Object.assign(d,calc(d));rows.push(r);save();slip(r);render();pf.reset();clearMarks(pf);
    ['housing','transport','other','ded'].forEach(function(k){f[k].value=0});
  });
  tb.addEventListener('click',function(e){
    var b=e.target;
    if(b.dataset.v!==undefined)slip(rows[b.dataset.v]);
    if(b.dataset.d!==undefined){rows.splice(b.dataset.d,1);save();render()}
  });
  document.getElementById('search').addEventListener('input',render);
  document.getElementById('clearBtn').addEventListener('click',function(){if(rows.length&&confirm('Delete all payroll records?')){rows=[];save();render()}});
  document.getElementById('printBtn').addEventListener('click',function(){window.print()});
  render();
}

/* Home page slideshow: changes slide automatically every 4.5 seconds */
(function(){
  var box=document.querySelector('.slider');if(!box)return;
  var slides=box.querySelectorAll('.slide'),dots=box.querySelectorAll('.dot'),pb=box.querySelector('.pause'),i=0,timer=null,paused=false;
  function show(n){slides[i].classList.remove('on');dots[i].classList.remove('on');i=(n+slides.length)%slides.length;slides[i].classList.add('on');dots[i].classList.add('on')}
  function start(){stop();if(!paused)timer=setInterval(function(){show(i+1)},4500)}
  function stop(){if(timer){clearInterval(timer);timer=null}}
  box.querySelector('.prev').addEventListener('click',function(){show(i-1);start()});
  box.querySelector('.next').addEventListener('click',function(){show(i+1);start()});
  dots.forEach(function(d,k){d.addEventListener('click',function(){show(k);start()})});
  pb.addEventListener('click',function(){paused=!paused;pb.textContent=paused?'Play':'Pause';pb.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');paused?stop():start()});
  box.addEventListener('mouseenter',stop);box.addEventListener('mouseleave',start);
  box.addEventListener('focusin',stop);box.addEventListener('focusout',start);
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){paused=true;pb.textContent='Play'}
  start();
})();
