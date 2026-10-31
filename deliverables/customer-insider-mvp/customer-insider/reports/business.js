// Shared, deterministic layout: the HTML preview, download and email use the same content and measurements.
export function businessRuntime() {
  const widths=[[278,278,355,556,556,889,667,222,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,222,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584],[278,333,474,556,556,889,722,278,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,278,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]];
  const clean=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—·]/g,'-').replace(/[^\x20-\x7E]/g,'?');
  const measure=(s,size,bold=false)=>[...clean(s)].reduce((n,c)=>n+(widths[bold?1:0][c.charCodeAt(0)-32]||600)*size/1000,0);
  const wrap=(s,width,size=11,bold=false)=>{
    const lines=[];
    for(const paragraph of String(s).split('\n')){
      let line='';
      for(const word of paragraph.trim().split(/\s+/)){
        if(measure(word,size,bold)>width){
          if(line){lines.push(line);line='';}
          for(const c of word){if(measure(line+c,size,bold)>width){lines.push(line);line='';}line+=c;}
        }else if(measure((line+' '+word).trim(),size,bold)>width){lines.push(line);line=word;}
        else line=(line+' '+word).trim();
      }
      if(line)lines.push(line);
    }
    return lines;
  };
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function layout(r){
    const text=[],rules=[],rows=[];const ink='#365367',body='#384a43';
    const add=(s,x,y,width,size=11,bold=false,color=body)=>{const lines=wrap(s,width,size,bold);lines.forEach((line,i)=>text.push({text:line,x,y:y+i*(size===11?13.5:size*1.12),size,bold,color}));return lines.length*(size===11?13.5:size*1.12);};
    let titleSize=23;while(titleSize>15&&wrap(r.title,362,titleSize).length>3)titleSize--;
    const titleLines=wrap(r.title,362,titleSize);if(titleLines.length>8)throw Error('Business title is too long.');
    const titleHeight=titleLines.length*titleSize*1.12;
    const subtitle=wrap(r.businessName,362);const banner=Math.max(132,24+titleHeight+9+subtitle.length*13.5+20);
    add(r.title,28,24,362,titleSize,false,ink);add(r.businessName,28,24+titleHeight+9,362);
    let y=banner+20;
    const section=(heading,content)=>{add(heading,28,y,539,15,true,ink);y+=23;rules.push({y:y-6,x:28,end:567,color:'#edf1d6'});y+=add(content,28,y,539)+11;};
    section('Your Business Today',r.content.today);
    add('Your Biggest Opportunity',28,y,539,13,true,ink);y+=22;
    rules.push({y:y-5,x:28,end:567,color:'#a7b7bc'});y+=add(r.content.opportunity,35,y+3,525)+19;
    for(const [heading,content] of [
      ['How to Reach More Buyers',r.content.buyers],
      ['What May Be Holding You Back',r.content.blockers],
      ['Your Next 3 Actions',r.content.actions.map((a,i)=>(i+1)+'. '+a.what+' '+a.when+' Measure: '+a.measure).join('\n')],
      ['What to Automate First',r.content.automation]
    ]){
      const start=y;rules.push({y,x:28,end:567,color:'#a7b7bc'});
      const label=add(heading,35,y+9,125,11,true,ink);
      const height=add(content,174,y+9,386);
      y+=Math.max(label,height)+18;rows.push({heading,content,start,height:y-start});
    }
    rules.push({y,x:28,end:567,color:'#a7b7bc'});y+=16;
    const firstStart=y;section('Your First Step',r.content.firstStep);
    if(y>820)throw Error('Plan exceeds one A4 page at 11pt. Shorten the content.');
    return {text,rules,rows,banner,firstStart,bottom:y};
  }
  function html(r){
    const l=layout(r);const text=t=>'<span style="position:absolute;left:'+t.x+'pt;top:'+t.y+'pt;font-size:'+t.size+'pt;line-height:'+(t.size===11?13.5:t.size*1.12)+'pt;font-weight:'+(t.bold?700:400)+';color:'+t.color+';white-space:pre">'+escape(t.text)+'</span>';
    // The table is semantic; visual lines are placed from the same measured layout used in the PDF.
    const table='<table aria-label="Business action plan" style="position:absolute;left:28pt;top:'+l.rows[0].start+'pt;width:539pt;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:139pt"><col></colgroup><tbody>'+l.rows.map(row=>'<tr style="height:'+row.height+'pt"><th scope="row"><span class="sr-only">'+escape(row.heading)+'</span></th><td><span class="sr-only">'+escape(row.content)+'</span></td></tr>').join('')+'</tbody></table>';
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:"><title>'+escape(r.title)+'</title><style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#f0f1f5;font-family:Arial,Helvetica,sans-serif;color:#384a43;font-size:11pt}.page{position:relative;width:595pt;height:841pt;margin:auto;background:#fff;border-radius:16px 16px 0 0;overflow:hidden}.banner{position:absolute;inset:0 0 auto;height:'+l.banner+'pt;background:#f5f6e9}.symbol{position:absolute;right:25pt;top:4pt;width:125pt;height:122.97pt}.rule{position:absolute;height:0;border-top:1pt solid}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}th,td{padding:0}@page{size:A4;margin:0}@media print{body{padding:0;background:white;print-color-adjust:exact;-webkit-print-color-adjust:exact}.page{border-radius:0;width:595pt;height:841pt;margin:0}}</style></head><body><article class="page" aria-label="'+escape(r.title)+'"><header class="banner"><h1 class="sr-only">'+escape(r.title)+'</h1><svg class="symbol" viewBox="0 0 246 242" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#c0d36c" stroke-width="9"><circle cx="123" cy="80" r="72"/><circle cx="164" cy="121" r="72"/><circle cx="123" cy="162" r="72"/><circle cx="82" cy="121" r="72"/></g></svg></header><main><div class="sr-only"><h2>Your Business Today</h2><p>'+escape(r.content.today)+'</p><h2>Your Biggest Opportunity</h2><p>'+escape(r.content.opportunity)+'</p></div>'+table+l.rules.map(rule=>'<div class="rule" style="left:'+rule.x+'pt;top:'+rule.y+'pt;width:'+(rule.end-rule.x)+'pt;border-color:'+rule.color+'"></div>').join('')+'<div aria-hidden="true">'+l.text.map(text).join('')+'</div><section class="sr-only"><h2>Your First Step</h2><p>'+escape(r.content.firstStep)+'</p></section></main></article></body></html>';
  }
  function pdf(r){
    const l=layout(r),rgb=hex=>[1,3,5].map(i=>(parseInt(hex.slice(i,i+2),16)/255).toFixed(4)).join(' ');
    let stream=rgb('#f5f6e9')+' rg 0 '+(842-l.banner)+' 595 '+l.banner+' re f\n';
    // Original four-circle green symbol from the supplied HTML template.
    const sx=125/246,sy=125/246,ox=445,oy=4,k=.5522847498;
    stream+=rgb('#c0d36c')+' RG '+(9*sx)+' w\n';
    for(const [cx,cy] of [[123,80],[164,121],[123,162],[82,121]]){
      const x=ox+cx*sx,y=842-oy-cy*sy,rx=72*sx,ry=72*sy;
      stream+=[x+rx,y,'m',x+rx,y+k*ry,x+k*rx,y+ry,x,y+ry,'c',x-k*rx,y+ry,x-rx,y+k*ry,x-rx,y,'c',x-rx,y-k*ry,x-k*rx,y-ry,x,y-ry,'c',x+k*rx,y-ry,x+rx,y-k*ry,x+rx,y,'c S'].join(' ')+'\n';
    }
    for(const rule of l.rules)stream+=rgb(rule.color)+' RG 1 w '+rule.x+' '+(842-rule.y)+' m '+rule.end+' '+(842-rule.y)+' l S\n';
    const literal=s=>clean(s).replace(/([\\()])/g,'\\$1');
    for(const t of l.text)stream+=rgb(t.color)+' rg BT /'+(t.bold?'F2':'F1')+' '+t.size+' Tf '+t.x+' '+(842-t.y-t.size*.93).toFixed(2)+' Td ('+literal(t.text)+') Tj ET\n';
    const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>','<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream'];
    let output='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(output.length);output+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});const x=output.length;output+='xref\n0 7\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n'+x+'\n%%EOF';return new TextEncoder().encode(output);
  }
  return {layout,html,pdf};
}
export const businessRenderer=businessRuntime();
// Verified against Salesforce's original 2026 report, pp. 3 and 8, on 2026-10-30.
// Survey fieldwork: August–September 2025; 4,050 sales professionals in 22 countries.
export const approvedSalesStatistics={
  'selling-time-2026':{text:'Survey context: Sales reps reported spending 40% of their workweek selling.',relevance:'Only for a stated problem with manual sales work, admin or limited selling time.',pattern:'manual|typing|admin|spreadsheet|data entry|busy|time'},
  'buyer-education-2026':{text:'Survey context: 67% of sales professionals said their customers needed extensive education.',relevance:'Only for a stated problem explaining an offer or helping buyers understand its value.',pattern:'explain|educat|understand|unclear|message|offer|value'},
  'buyer-decisions-2026':{text:'Survey context: 57% of sales professionals said customers took longer to decide than before.',relevance:'Only for stated slow buyer decisions or gaps in lead follow-up.',pattern:'follow.?up|enquir|lead|prospect|slow|decid'}
};
const statisticSource={title:'Salesforce, State of Sales, 7th edition (2026), pp. 3, 8',url:'https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/reports/sales/salesforce-state-of-sales-report-2026.pdf',checkedAt:'2026-10-30',survey:'4,050 sales professionals in 22 countries; fieldwork Aug–Sep 2025'};
export const businessKeys=['today','opportunity','buyers','blockers','automation','firstStep'];
export const businessSchema={type:'object',properties:Object.fromEntries([
  ...businessKeys.map(key=>[key,{type:'string',description:'Plain text. Concise, specific, simple English. No links or markup.'}]),
  ['statisticId',{type:'string',enum:['none',...Object.keys(approvedSalesStatistics)],description:'Choose one relevant approved survey statistic or none. Do not repeat its percentage in the prose.'}],
  ['actions',{type:'array',minItems:3,maxItems:3,items:{type:'object',properties:{what:{type:'string'},when:{type:'string'},measure:{type:'string'}},required:['what','when','measure'],additionalProperties:false}}]
]),required:[...businessKeys,'actions','statisticId'],additionalProperties:false};
export function createBusinessReport(value,answers,model){
  if(!value||typeof value!=='object')throw Error('Invalid plan.');
  const check=(s,max)=>{if(typeof s!=='string'||!s.trim()||s.length>max||/https?:|www\./i.test(s))throw Error('Invalid plan content.');return s.trim();};
  const content=Object.fromEntries(businessKeys.map(key=>[key,check(value[key],key==='firstStep'?400:1000)]));
  if(!Array.isArray(value.actions)||value.actions.length!==3)throw Error('Three actions required.');
  content.actions=value.actions.map(a=>({what:check(a?.what,400),when:check(a?.when,100),measure:check(a?.measure,180)}));
  const selected=value.statisticId||'none';
  if(selected!=='none'&&!Object.hasOwn(approvedSalesStatistics,selected))throw Error('Unknown statistic source.');
  const supplied=JSON.stringify(answers).toLowerCase().replace(/\s+/g,'');
  const prose=[...businessKeys.map(key=>content[key]),...content.actions.flatMap(a=>[a.what,a.when,a.measure])].join(' ');
  for(const claim of prose.match(/\b\d+(?:\.\d+)?\s*(?:%|per\s*cent\b)/gi)||[])if(!supplied.includes(claim.toLowerCase().replace(/\s+/g,'')))throw Error('Business percentages must come from supplied answers; use a verified statistic ID for survey claims.');
  const approved=approvedSalesStatistics[selected];
  const relevant=approved&&new RegExp(approved.pattern,'i').test(answers.criticalContext||'');
  const statistic=relevant?{id:selected,text:approved.text,...statisticSource}:null;
  if(statistic)content.blockers+='\n'+statistic.text+' Source: '+statistic.title+'. '+statistic.survey+'. General context, not a result for your business.';
  const words=[...businessKeys.map(key=>content[key]),...content.actions.flatMap(a=>[a.what,a.when,a.measure])].join(' ').split(/\s+/).length;if(words>450)throw Error('Plan is too long.');
  const report={template:'business-v1',businessName:answers.businessName,title:answers.businessName+' Business Growth Plan',content,sections:[['Your Business Today',content.today],['Your Biggest Opportunity',content.opportunity],['How to Reach More Buyers',content.buyers],['What May Be Holding You Back',content.blockers],['Your Next 3 Actions',content.actions.map((a,i)=>(i+1)+'. '+a.what+' '+a.when+' Measure: '+a.measure).join('\n')],['What to Automate First',content.automation],['Your First Step',content.firstStep]],note:'Based only on your answers. Confirm possible gaps before acting.',provider:'gemini',model,statistic};
  report.html=businessRenderer.html(report);return report;
}
