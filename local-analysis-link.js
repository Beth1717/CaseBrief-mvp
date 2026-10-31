// Same-origin local development navigation only. No model or runtime calls from the demo.
if(typeof location!=='undefined'&&location.hostname==='127.0.0.1'&&location.port==='8780'){
 const controls=document.querySelector('.topbar .controls');
 if(controls){const link=document.createElement('a');link.className='btn';link.href='/analysis/';link.textContent='Compare fictional documents';controls.append(link)}
}
