// Same-origin local development navigation only. No model or runtime calls from the demo.
if(document.documentElement?.dataset?.analysisHost==='true'){
 const controls=document.querySelector('.topbar .controls');
 if(controls){const link=document.createElement('a');link.className='btn';link.href='/analysis/';link.textContent='Compare fictional documents';controls.append(link)}
}
