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
  if(n==='newpassword'&&!(v.length>=8&&/[A-Za-z]/.test(v)&&/\d/.test(v)))return 'Use at least 8 characters with a letter and a number.';
  if(n==='confirm'&&el.form&&v!==el.form.elements.newpassword.value)return 'Passwords do not match.';
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
    if(el.name==='newpassword'&&form.elements.confirm&&form.elements.confirm.dataset.touched)paint(form.elements.confirm,true);
  })});
}
function clearMarks(form){
  Array.prototype.forEach.call(form.elements,function(el){el.classList.remove('is-valid','is-invalid');delete el.dataset.touched;
    var err=el.parentNode&&el.parentNode.nextElementSibling;if(err&&err.className==='err')err.textContent=''});
}

/* Payroll rules: the figures live in js/rules.js. The set that applies depends on the pay month. */
var FALLBACK_RULE={from:'2000-01',label:'Built-in rates',nssfEmployee:5,nssfEmployer:10,bands:[[335000,0],[410000,20],[485000,25],[10000000,30],[null,40]]};
function rulesFor(month){
  var list=(window.BU_RULES&&window.BU_RULES.length?window.BU_RULES:[FALLBACK_RULE]).slice().sort(function(x,y){return x.from<y.from?-1:1}),pick=list[0];
  list.forEach(function(r){if(month&&month>=r.from)pick=r});
  return pick;
}
function payeFor(g,bands){
  var tax=0,lo=0;
  for(var i=0;i<bands.length;i++){
    var hi=bands[i][0]==null?Infinity:bands[i][0];
    if(g>lo)tax+=(Math.min(g,hi)-lo)*bands[i][1]/100;
    lo=hi;if(g<=hi)break;
  }
  return tax;
}
function calc(d){
  var rule=rulesFor(d.month),gross=d.basic+d.housing+d.transport+d.other,
      nssf=gross*rule.nssfEmployee/100,tax=payeFor(gross,rule.bands),total=nssf+tax+d.ded;
  return{gross:gross,nssf:nssf,nssfRate:rule.nssfEmployee,nssfEr:gross*rule.nssfEmployer/100,nssfErRate:rule.nssfEmployer,paye:tax,total:total,net:gross-total};
}

/* Payslip markup (shared by the payroll page and the staff "My account" page) */
function slipHtml(r){
  var m=new Date(r.month+'-01').toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  return '<h3>Bugema University</h3><p class="sub">Excellence in Service</p>'+
  '<p><strong>'+esc(r.name)+'</strong> ('+esc(r.id)+')<br>'+esc(r.title)+', '+esc(r.dept)+'<br>Payslip for '+m+'</p>'+
  '<table><tr><th colspan="2">Earnings</th></tr>'+
  '<tr><td>Basic salary</td><td class="n">'+fmt(r.basic)+'</td></tr>'+
  '<tr><td>Housing allowance</td><td class="n">'+fmt(r.housing)+'</td></tr>'+
  '<tr><td>Transport allowance</td><td class="n">'+fmt(r.transport)+'</td></tr>'+
  '<tr><td>Other allowances</td><td class="n">'+fmt(r.other)+'</td></tr>'+
  '<tr><td><strong>Gross pay</strong></td><td class="n"><strong>'+fmt(r.gross)+'</strong></td></tr>'+
  '<tr><th colspan="2">Deductions</th></tr>'+
  '<tr><td>NSSF ('+(r.nssfRate||5)+'%)</td><td class="n">'+fmt(r.nssf)+'</td></tr>'+
  '<tr><td>PAYE</td><td class="n">'+fmt(r.paye)+'</td></tr>'+
  '<tr><td>Other deductions</td><td class="n">'+fmt(r.ded)+'</td></tr>'+
  '<tr><td><strong>Total deductions</strong></td><td class="n"><strong>'+fmt(r.total)+'</strong></td></tr>'+
  '<tr class="net"><td>Net pay (UGX)</td><td class="n">'+fmt(r.net)+'</td></tr></table>'+
  (r.nssfEr?'<p class="note">Employer NSSF contribution ('+(r.nssfErRate||10)+'%), paid by the university and not deducted from your pay: UGX '+fmt(r.nssfEr)+'</p>':'');
}

/* Calculation rules page: shows the sets from js/rules.js */
var rb=document.getElementById('rulesBox');
if(rb){
  var sets=(window.BU_RULES&&window.BU_RULES.length?window.BU_RULES:[FALLBACK_RULE]).slice().sort(function(x,y){return x.from<y.from?1:-1}),h='';
  sets.forEach(function(r){
    var lo=0,rows=r.bands.map(function(b){
      var hi=b[0],txt=hi==null?'Above '+fmt(lo):(lo===0?'Up to '+fmt(hi):fmt(lo+1)+' to '+fmt(hi)),row='<tr><td>'+txt+'</td><td>'+b[1]+'%</td></tr>';lo=hi;return row}).join('');
    h+='<h3 style="margin-top:28px">'+esc(r.label)+'</h3><div class="scroll"><table><thead><tr><th>Monthly pay (UGX)</th><th>PAYE rate on that part</th></tr></thead><tbody>'+rows+
       '<tr><td>NSSF paid by the employee</td><td>'+r.nssfEmployee+'% of gross pay</td></tr><tr><td>NSSF paid by the employer</td><td>'+r.nssfEmployer+'% of gross pay</td></tr></tbody></table></div>';
  });
  rb.innerHTML=h;
}

/* Contact form: sends through the settings in js/config.js (Google Apps Script link, or the visitor's email app) */
var cf=document.getElementById('contactForm');if(cf)liveValidate(cf);
if(cf){
  var CFG=window.BU_CONFIG||{},cnote=document.getElementById('contactNote'),cok=document.getElementById('contactOk'),cerr=document.getElementById('contactErr');
  if(cnote)cnote.textContent=CFG.contactEndpoint?'Your message goes straight to the payroll office.':CFG.contactEmail?'Your email app will open with your message ready to send.':'This form is not connected yet. Please use the Gmail or WhatsApp buttons instead.';
  var oi=document.getElementById('officeInfo');if(oi&&(CFG.officeHours||CFG.officeAddress)){oi.innerHTML=(CFG.officeAddress?'<strong>Payroll office:</strong> '+esc(CFG.officeAddress)+'<br>':'')+(CFG.officeHours?'<strong>Open:</strong> '+esc(CFG.officeHours):'');oi.hidden=false}
  var gm=document.getElementById('gmailLink'),wa=document.getElementById('waLink');
  if(gm&&CFG.contactEmail)gm.href='https://mail.google.com/mail/?view=cm&to='+encodeURIComponent(CFG.contactEmail);
  if(wa&&CFG.contactWhatsapp)wa.href='https://wa.me/'+String(CFG.contactWhatsapp).replace(/\D/g,'');
  function cdone(){cok.hidden=false;cerr.hidden=true;cf.reset();clearMarks(cf)}
  function cfail(t){cerr.textContent=t;cerr.hidden=false;cok.hidden=true}
  cf.addEventListener('submit',function(e){
    e.preventDefault();cok.hidden=true;cerr.hidden=true;
    if(!validate(cf))return;
    var f=cf.elements,d={name:f.name.value.trim(),email:f.email.value.trim(),subject:f.subject.value.trim(),message:f.message.value.trim()};
    if(CFG.contactEndpoint){
      var b=cf.querySelector('button[type=submit]'),lab=b.textContent;b.disabled=true;b.textContent='Sending…';
      fetch(CFG.contactEndpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fields:Object.assign({form:'contact'},d),files:[]})})
        .then(function(r){return r.json()}).then(function(j){if(!j||!j.ok)throw 0;cdone()})
        .catch(function(){cfail('Sorry, your message could not be sent. Please check your connection or use Gmail or WhatsApp.')})
        .then(function(){b.disabled=false;b.textContent=lab});
    }else if(CFG.contactEmail){
      location.href='mailto:'+CFG.contactEmail+'?subject='+encodeURIComponent(d.subject)+'&body='+encodeURIComponent(d.message+'\n\n'+d.name+'\n'+d.email);
      cdone();
    }else cfail('This form is not connected yet. Please use the Gmail or WhatsApp buttons on this page.');
  });
}

/* Payroll page */
var pf=document.getElementById('payForm');
if(pf){
  liveValidate(pf);
  var rows=[],tb=document.querySelector('#summary tbody'),tf=document.querySelector('#summary tfoot'),editing=-1,
      saveBtn=document.getElementById('saveBtn'),cancelBtn=document.getElementById('cancelEdit'),pmsg=document.getElementById('payMsg');
  try{rows=JSON.parse(localStorage.getItem('buPayroll')||'[]')}catch(x){rows=[]}
  function save(){try{localStorage.setItem('buPayroll',JSON.stringify(rows))}catch(x){}}
  function say(t){pmsg.textContent=t}
  function slip(r){document.getElementById('payslip').innerHTML=slipHtml(r);document.getElementById('printBtn').hidden=false}
  function render(){
    var q=document.getElementById('search').value.toLowerCase(),h='',g=0,t=0,n=0,shown=0;
    rows.forEach(function(r,i){
      if((r.name+' '+r.id+' '+r.dept).toLowerCase().indexOf(q)<0)return;
      shown++;g+=r.gross;t+=r.total;n+=r.net;
      h+='<tr><td>'+esc(r.name)+'<br><small>'+esc(r.id)+' | '+esc(r.dept)+'</small></td><td>'+esc(r.month)+'</td><td class="n">'+fmt(r.gross)+'</td><td class="n">'+fmt(r.total)+'</td><td class="n">'+fmt(r.net)+'</td><td class="acts"><button class="link" data-v="'+i+'">View</button> <button class="link" data-e="'+i+'">Edit</button> <button class="link" data-d="'+i+'">Delete</button></td></tr>';
    });
    tb.innerHTML=h||'<tr><td colspan="6">'+(rows.length?'No employees match your search.':'No payroll records yet. Add an employee using the form.')+'</td></tr>';
    tf.innerHTML=shown?'<tr><td>Total ('+shown+')</td><td></td><td class="n">'+fmt(g)+'</td><td class="n">'+fmt(t)+'</td><td class="n">'+fmt(n)+'</td><td></td></tr>':'';
  }
  function resetForm(){
    editing=-1;pf.reset();clearMarks(pf);
    ['housing','transport','other','ded'].forEach(function(k){pf.elements[k].value=0});
    saveBtn.textContent='Calculate and add to payroll';cancelBtn.hidden=true;
  }
  pf.addEventListener('submit',function(e){
    e.preventDefault();
    if(!validate(pf))return;
    var f=pf.elements,d={name:f.name.value.trim(),id:f.id.value.trim(),email:f.email.value.trim().toLowerCase(),dept:f.dept.value.trim(),title:f.title.value.trim(),month:f.month.value,
      basic:+f.basic.value,housing:+f.housing.value||0,transport:+f.transport.value||0,other:+f.other.value||0,ded:+f.ded.value||0};
    var dup=rows.some(function(r,i){return i!==editing&&r.id.toLowerCase()===d.id.toLowerCase()&&r.month===d.month});
    if(dup&&!confirm('A payslip for '+d.id+' in '+d.month+' already exists. Add another one anyway?'))return;
    var r=Object.assign(d,calc(d));
    if(editing>-1){rows[editing]=r;say('Record for '+r.name+' updated.')}else{rows.push(r);say('Record for '+r.name+' added.')}
    save();slip(r);render();resetForm();
  });
  cancelBtn.addEventListener('click',function(){resetForm();say('Edit cancelled.')});
  tb.addEventListener('click',function(e){
    var b=e.target;
    if(b.dataset.v!==undefined)slip(rows[b.dataset.v]);
    if(b.dataset.e!==undefined){
      var r=rows[b.dataset.e],f=pf.elements;editing=+b.dataset.e;clearMarks(pf);
      ['name','id','email','dept','title','month','basic','housing','transport','other','ded'].forEach(function(k){f[k].value=r[k]==null?'':r[k]});
      saveBtn.textContent='Save changes';cancelBtn.hidden=false;slip(r);say('Editing '+r.name+'. Change the details and press Save changes.');
      pf.scrollIntoView({behavior:'smooth',block:'start'});f.name.focus();
    }
    if(b.dataset.d!==undefined){
      if(confirm('Delete the record for '+rows[b.dataset.d].name+'?')){rows.splice(b.dataset.d,1);save();if(editing>-1)resetForm();render()}
    }
  });
  document.getElementById('search').addEventListener('input',render);
  document.getElementById('clearBtn').addEventListener('click',function(){if(rows.length&&confirm('Delete all payroll records?')){rows=[];save();resetForm();render()}});
  document.getElementById('printBtn').addEventListener('click',function(){window.print()});

  /* Export every record as a CSV file that opens in Excel */
  document.getElementById('csvBtn').addEventListener('click',function(){
    if(!rows.length){say('There are no records to export yet.');return}
    function cell(v){v=v==null?'':String(v);if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'}
    var head=['Name','Employee ID','Email','Department','Job title','Month','Basic salary','Housing','Transport','Other allowances','Gross pay','NSSF (employee)','NSSF (employer)','PAYE','Other deductions','Total deductions','Net pay'];
    var keys=['name','id','email','dept','title','month','basic','housing','transport','other','gross','nssf','nssfEr','paye','ded','total','net'];
    var lines=[head.map(cell).join(',')].concat(rows.map(function(r){return keys.map(function(k,i){return i>5?Math.round(r[k]||0):cell(r[k])}).join(',')}));
    var blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='bugema-payroll-'+new Date().toISOString().slice(0,10)+'.csv';
    document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
    say('Exported '+rows.length+' record'+(rows.length>1?'s':'')+'.');
  });

  /* Month roll-over: copy the latest month's records into the next month in one click */
  document.getElementById('rollBtn').addEventListener('click',function(){
    if(!rows.length){say('Add at least one employee first.');return}
    var latest=rows.reduce(function(m,r){return r.month>m?r.month:m},'0000-00'),p=latest.split('-'),d=new Date(+p[0],+p[1],1),
        next=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);
    var src=rows.filter(function(r){return r.month===latest}),added=0;
    src.forEach(function(r){
      if(rows.some(function(x){return x.id.toLowerCase()===r.id.toLowerCase()&&x.month===next}))return;
      var c=Object.assign({},r,{month:next});Object.assign(c,calc(c));rows.push(c);added++;
    });
    if(!added){say('Everyone from '+latest+' already has a record for '+next+'.');return}
    save();render();say('Copied '+added+' employee'+(added>1?'s':'')+' from '+latest+' to '+next+'. Edit any record that changed.');
  });

  /* Recalculate every record with the rules in js/rules.js */
  document.getElementById('recalcBtn').addEventListener('click',function(){
    if(!rows.length){say('There are no records yet.');return}
    if(!confirm('Recalculate all '+rows.length+' records using the current rates? Payslip amounts may change.'))return;
    rows=rows.map(function(r){return Object.assign({},r,calc(r))});save();render();say('All records recalculated with the current rates.');
  });

  /* Monthly report by department */
  var rm=document.getElementById('repMonth'),rt=document.getElementById('repTable');
  function renderReport(){
    var months=[];rows.forEach(function(r){if(months.indexOf(r.month)<0)months.push(r.month)});months.sort().reverse();
    var cur=rm.value;rm.innerHTML=months.map(function(m){return '<option>'+m+'</option>'}).join('')||'<option value="">No months yet</option>';
    if(months.indexOf(cur)>-1)rm.value=cur;
    var by={},tot={n:0,g:0,d:0,net:0,er:0};
    rows.filter(function(r){return r.month===rm.value}).forEach(function(r){
      var k=r.dept||'(none)',x=by[k]=by[k]||{n:0,g:0,d:0,net:0,er:0};
      [x,tot].forEach(function(t){t.n++;t.g+=r.gross;t.d+=r.total;t.net+=r.net;t.er+=(r.nssfEr||0)});
    });
    var keys=Object.keys(by).sort();
    rt.querySelector('tbody').innerHTML=keys.length?keys.map(function(k){var x=by[k];return '<tr><td>'+esc(k)+'</td><td class="n">'+x.n+'</td><td class="n">'+fmt(x.g)+'</td><td class="n">'+fmt(x.d)+'</td><td class="n">'+fmt(x.net)+'</td><td class="n">'+fmt(x.er)+'</td></tr>'}).join(''):'<tr><td colspan="6">No records for this month.</td></tr>';
    rt.querySelector('tfoot').innerHTML=keys.length?'<tr><td>Total</td><td class="n">'+tot.n+'</td><td class="n">'+fmt(tot.g)+'</td><td class="n">'+fmt(tot.d)+'</td><td class="n">'+fmt(tot.net)+'</td><td class="n">'+fmt(tot.er)+'</td></tr>':'';
  }
  rm.addEventListener('change',renderReport);
  var baseRender=render;render=function(){baseRender();renderReport()};

  /* Import employees from a CSV file (also restores a file exported from this page) */
  function parseCsv(t){
    var out=[],row=[],f='',q=false;t=t.replace(/^﻿/,'');
    for(var i=0;i<t.length;i++){var c=t[i];
      if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
      else if(c==='"')q=true;
      else if(c===','){row.push(f);f=''}
      else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);f='';if(row.some(function(x){return x.trim()!==''}))out.push(row);row=[]}
      else f+=c}
    row.push(f);if(row.some(function(x){return x.trim()!==''}))out.push(row);return out;
  }
  document.getElementById('tplBtn').addEventListener('click',function(){
    var t='Name,Employee ID,Email,Department,Job title,Month,Basic salary,Housing,Transport,Other allowances,Other deductions\r\nGrace Namusoke,BU-0142,grace@example.com,Finance,Accountant,2026-11,1500000,300000,100000,0,0\r\n';
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+t],{type:'text/csv;charset=utf-8'}));a.download='payroll-import-template.csv';
    document.body.appendChild(a);a.click();a.remove();
  });
  document.getElementById('csvFile').addEventListener('change',function(e){
    var file=e.target.files[0];e.target.value='';if(!file)return;
    if(file.size>2*1024*1024){say('That file is too large. Please keep it under 2 MB.');return}
    var rd=new FileReader();
    rd.onload=function(){
      var t=parseCsv(String(rd.result));
      if(t.length<2){say('The file has no employee rows. Download the template to see the format.');return}
      var head=t[0].map(function(x){return x.trim().toLowerCase()});
      function col(){for(var i=0;i<arguments.length;i++){var k=head.indexOf(arguments[i]);if(k>-1)return k}return -1}
      var C={name:col('name','full name'),id:col('employee id','id'),email:col('email'),dept:col('department'),title:col('job title','title'),month:col('month','pay month'),
             basic:col('basic salary','basic'),housing:col('housing','housing allowance'),transport:col('transport','transport allowance'),other:col('other allowances','other'),ded:col('other deductions','deductions')};
      var miss=['name','id','month','basic'].filter(function(k){return C[k]<0});
      if(miss.length){say('The file is missing these columns: '+miss.join(', ')+'. Download the template to see the format.');return}
      if(t.length>2001){say('That file has more than 2,000 rows. Please split it.');return}
      var added=0,skipped=0,bad=[];
      function num(r,k){if(C[k]<0)return 0;var v=String(r[C[k]]||'').replace(/[,\s]/g,'');if(v==='')return 0;var n=Number(v);return isFinite(n)&&n>=0?n:NaN}
      t.slice(1).forEach(function(r,i){
        var line=i+2,d={name:(r[C.name]||'').trim(),id:(r[C.id]||'').trim(),email:C.email<0?'':(r[C.email]||'').trim().toLowerCase(),dept:C.dept<0?'':(r[C.dept]||'').trim(),title:C.title<0?'':(r[C.title]||'').trim(),
          month:(r[C.month]||'').trim(),basic:num(r,'basic'),housing:num(r,'housing'),transport:num(r,'transport'),other:num(r,'other'),ded:num(r,'ded')};
        if(!d.name||!d.id||!/^\d{4}-(0[1-9]|1[0-2])$/.test(d.month)||[d.basic,d.housing,d.transport,d.other,d.ded].some(isNaN)||(d.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email))){bad.push(line);return}
        if(rows.some(function(x){return x.id.toLowerCase()===d.id.toLowerCase()&&x.month===d.month})){skipped++;return}
        rows.push(Object.assign(d,calc(d)));added++;
      });
      if(added){save();render()}
      say('Imported '+added+' record'+(added===1?'':'s')+'.'+(skipped?' Skipped '+skipped+' that already exist.':'')+(bad.length?' Could not read row'+(bad.length>1?'s':'')+' '+bad.slice(0,12).join(', ')+(bad.length>12?'…':'')+' (check name, ID, month like 2026-11, and numbers).':''));
    };
    rd.readAsText(file);
  });
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
