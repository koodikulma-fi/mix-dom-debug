var __rest=function(e,n){var t={};for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&n.indexOf(i)<0&&(t[i]=e[i]);if(null!=e&&'function'==typeof Object.getOwnPropertySymbols){var r=0;for(i=Object.getOwnPropertySymbols(e);r<i.length;r++)n.indexOf(i[r])<0&&Object.prototype.propertyIsEnumerable.call(e,i[r])&&(t[i[r]]=e[i[r]])}return t};window.openMixDOMDebug=function openMixDOMDebug(e,n,t){let i=Object.assign({console:window.console,addRoot:!0,useFadeIn:!0,windowFeatures:'toolbar=0,scrollbars=0,location=0,resizable=1',windowTarget:'_blank',scriptUrl:'https://unpkg.com/mix-dom-debug/MixDOMDebug.js'},n),{scriptUrl:r,windowFeatures:o,windowTarget:l}=i,c=__rest(i,['scriptUrl','windowFeatures','windowTarget']);void 0===c.cssUrl&&(c.cssUrl=r.slice(0,r.lastIndexOf('/')+1)+'MixDOMDebug.css');const s=window.open(void 0,l,o);if(s){const n=s.document;n.body.style.cssText='margin: 0; padding: 0; position: relative;';const i=n.createElement('style');i.innerHTML='\n.loading-icon {\n    -webkit-animation: loading-spinner 2s linear infinite;\n    -moz-animation: loading-spinner 2s linear infinite;\n    animation: loading-spinner 2s linear infinite;\n}\n@-moz-keyframes loading-spinner { \n    100% { -moz-transform: rotate(360deg); } \n}\n@-webkit-keyframes loading-spinner { \n    100% { -webkit-transform: rotate(360deg); } \n}\n@keyframes loading-spinner { \n    100% { \n        -webkit-transform: rotate(360deg); \n        transform:rotate(360deg); \n    }\n}\n';const o=document.createElementNS('http://www.w3.org/2000/svg','svg');o.classList.add('loading-icon'),o.style.cssText='width: 100px; height: 100px; color: #abd; position: absolute;',o.innerHTML='\n<svg version="1.1" viewBox="0 0 768 768" xml:space="preserve">\n\t<circle cx="587.6" cy="180.4" r="41.6" fill="currentColor" fill-opacity=".65" />\n\t<circle cx="672" cy="384" r="44.8" fill="currentColor" fill-opacity=".7" />\n\t<circle cx="587.6" cy="587.6" r="48" fill="currentColor" fill-opacity=".75" />\n\t<circle cx="384" cy="672" r="51.2" fill="currentColor" fill-opacity=".8" />\n\t<circle cx="180.4" cy="587.6" r="54.4" fill="currentColor" fill-opacity=".85" />\n\t<circle cx="96" cy="384" r="57.6" fill="currentColor" fill-opacity=".9" />\n\t<circle cx="180.4" cy="180.4" r="60.8" fill="currentColor" fill-opacity=".95" />\n\t<circle cx="384" cy="96" r="64" fill="currentColor" fill-opacity="1" />\n</svg>';const l=document.createElement('div');l.style.cssText='display: flex; z-index: 10000; align-items: center; justify-content: center; position: absolute; background: #111; inset: 0; overflow: hidden; transition: opacity 200ms ease-in-out; opacity: 1;',l.appendChild(i),l.appendChild(o),n.body.appendChild(l);const a=n.createElement('script');a.setAttribute('type','text/javascript'),a.setAttribute('src',r),a.addEventListener('load',(()=>{l.style.setProperty('opacity','0'),setTimeout((()=>{l.remove(),i.remove()}),200),s.MixDOMDebug.startDebug(e,c,t)})),s.addEventListener('beforeunload',(()=>{s.MixDOMDebug&&s.MixDOMDebug.stopDebug(!0)})),n.body.appendChild(a)}return s};
