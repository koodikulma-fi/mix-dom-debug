var __rest=function(e,t){var o={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(o[n]=e[n]);if(null!=e&&'function'==typeof Object.getOwnPropertySymbols){var r=0;for(n=Object.getOwnPropertySymbols(e);r<n.length;r++)t.indexOf(n[r])<0&&Object.prototype.propertyIsEnumerable.call(e,n[r])&&(o[n[r]]=e[n[r]])}return o};function openMixDOMDebug(e,t,o){let n=Object.assign({console:window.console,addRoot:!0,useFadeIn:!0,windowFeatures:'toolbar=0,scrollbars=0,location=0,resizable=1',windowTarget:'_bank',scriptUrl:'https://unpkg.com/mix-dom-debug/MixDOMDebug.js'},t),{scriptUrl:r,windowFeatures:i,windowTarget:s,onLoad:a}=n,c=__rest(n,['scriptUrl','windowFeatures','windowTarget','onLoad']);void 0===c.cssUrl&&(c.cssUrl=r.slice(0,r.lastIndexOf('/')+1)+'MixDOMDebug.css');const d=window.open(void 0,s,i);if(d){const t=d.document.createElement('script');t.setAttribute('type','text/javascript'),t.setAttribute('src',r),t.addEventListener('load',(()=>{const t=d.MixDOMDebug.startDebug(e,c,o);a&&a(t,e||null,d)})),d.addEventListener('beforeunload',(()=>{d.MixDOMDebug&&d.MixDOMDebug.stopDebug(!0)})),d.document.body.appendChild(t)}return d}export{openMixDOMDebug};