/* YouTube Iframe API
 *
 * pulled from:
 *   s.ytimg.com/yts/jsbin/www-widgetapi-vflh4Q3pb/www-widgetapi.js
 * at:
 *   Thu Sep 22 17:21:48 EDT 2016
 * by:
 *   @meandavejustice
 *
 * Bundled for stability, security, and performance.
*/

(function(){var g,k=this;function l(a){a=a.split(".");for(var b=k,c;c=a.shift();)if(null!=b[c])b=b[c];else return null;return b}
function aa(){}
function n(){throw Error("unimplemented abstract method");}
function p(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b}
function q(a){var b=p(a);return"array"==b||"object"==b&&"number"==typeof a.length}
function r(a){return"string"==typeof a}
function ba(a){var b=typeof a;return"object"==b&&null!=a||"function"==b}
var t="closure_uid_"+(1E9*Math.random()>>>0),ca=0;function da(a,b,c){return a.call.apply(a.bind,arguments)}
function ea(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}
function u(a,b,c){u=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?da:ea;return u.apply(null,arguments)}
var fa=Date.now||function(){return+new Date};
function v(a,b){a=a.split(".");var c=k;a[0]in c||!c.execScript||c.execScript("var "+a[0]);for(var d;a.length&&(d=a.shift());)a.length||void 0===b?c[d]?c=c[d]:c=c[d]={}:c[d]=b}
function w(a,b){function c(){}
c.prototype=b.prototype;a.D=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.W=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}}
;var ga=String.prototype.trim?function(a){return a.trim()}:function(a){return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")},ha=/&/g,ia=/</g,ja=/>/g,ka=/"/g,la=/'/g,ma=/\x00/g,na=/[\x00&<>"']/;
function x(a,b){return a<b?-1:a>b?1:0}
;var oa=Array.prototype.indexOf?function(a,b,c){return Array.prototype.indexOf.call(a,b,c)}:function(a,b,c){c=null==c?0:0>c?Math.max(0,a.length+c):c;
if(r(a))return r(b)&&1==b.length?a.indexOf(b,c):-1;for(;c<a.length;c++)if(c in a&&a[c]===b)return c;return-1},y=Array.prototype.forEach?function(a,b,c){Array.prototype.forEach.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=r(a)?a.split(""):a,f=0;f<d;f++)f in e&&b.call(c,e[f],f,a)};
function pa(a,b){a:{for(var c=a.length,d=r(a)?a.split(""):a,e=0;e<c;e++)if(e in d&&b.call(void 0,d[e],e,a)){b=e;break a}b=-1}return 0>b?null:r(a)?a.charAt(b):a[b]}
function qa(a){return Array.prototype.concat.apply(Array.prototype,arguments)}
function z(a){var b=a.length;if(0<b){for(var c=Array(b),d=0;d<b;d++)c[d]=a[d];return c}return[]}
;function ra(a){var b=A,c;for(c in b)if(a.call(void 0,b[c],c,b))return c}
;var B;a:{var sa=k.navigator;if(sa){var ta=sa.userAgent;if(ta){B=ta;break a}}B=""}function C(a){return-1!=B.indexOf(a)}
;function ua(a,b){var c=va;Object.prototype.hasOwnProperty.call(c,a)||(c[a]=b(a))}
;var wa=C("Opera"),D=C("Trident")||C("MSIE"),xa=C("Edge"),E=C("Gecko")&&!(-1!=B.toLowerCase().indexOf("webkit")&&!C("Edge"))&&!(C("Trident")||C("MSIE"))&&!C("Edge"),ya=-1!=B.toLowerCase().indexOf("webkit")&&!C("Edge");function za(){var a=k.document;return a?a.documentMode:void 0}
var Aa;a:{var Ba="",Ca=function(){var a=B;if(E)return/rv\:([^\);]+)(\)|;)/.exec(a);if(xa)return/Edge\/([\d\.]+)/.exec(a);if(D)return/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);if(ya)return/WebKit\/(\S+)/.exec(a);if(wa)return/(?:Version)[ \/]?(\S+)/.exec(a)}();
Ca&&(Ba=Ca?Ca[1]:"");if(D){var Da=za();if(null!=Da&&Da>parseFloat(Ba)){Aa=String(Da);break a}}Aa=Ba}var Ea=Aa,va={};
function Fa(a){ua(a,function(){for(var b=0,c=ga(String(Ea)).split("."),d=ga(String(a)).split("."),e=Math.max(c.length,d.length),f=0;0==b&&f<e;f++){var h=c[f]||"",m=d[f]||"";do{h=/(\d*)(\D*)(.*)/.exec(h)||["","","",""];m=/(\d*)(\D*)(.*)/.exec(m)||["","","",""];if(0==h[0].length&&0==m[0].length)break;b=x(0==h[1].length?0:parseInt(h[1],10),0==m[1].length?0:parseInt(m[1],10))||x(0==h[2].length,0==m[2].length)||x(h[2],m[2]);h=h[3];m=m[3]}while(0==b)}return 0<=b})}
var Ga;var Ha=k.document;Ga=Ha&&D?za()||("CSS1Compat"==Ha.compatMode?parseInt(Ea,10):5):void 0;var Ia;if(!(Ia=!E&&!D)){var Ja;if(Ja=D)Ja=9<=Number(Ga);Ia=Ja}Ia||E&&Fa("1.9.1");D&&Fa("9");function Ka(a){var b,c,d,e;b=document;if(b.querySelectorAll&&b.querySelector&&a)return b.querySelectorAll(""+(a?"."+a:""));if(a&&b.getElementsByClassName){var f=b.getElementsByClassName(a);return f}f=b.getElementsByTagName("*");if(a){e={};for(c=d=0;b=f[c];c++){var h=b.className,m;if(m="function"==typeof h.split)m=0<=oa(h.split(/\s+/),a);m&&(e[d++]=b)}e.length=d;return e}return f}
function La(a,b){for(var c=0;a;){if(b(a))return a;a=a.parentNode;c++}return null}
;var Ma=k.JSON.parse,Na=k.JSON.stringify;function Oa(a){k.setTimeout(function(){throw a;},0)}
var Pa;
function Qa(){var a=k.MessageChannel;"undefined"===typeof a&&"undefined"!==typeof window&&window.postMessage&&window.addEventListener&&!C("Presto")&&(a=function(){var a=document.createElement("IFRAME");a.style.display="none";a.src="";document.documentElement.appendChild(a);var b=a.contentWindow,a=b.document;a.open();a.write("");a.close();var c="callImmediate"+Math.random(),d="file:"==b.location.protocol?"*":b.location.protocol+"//"+b.location.host,a=u(function(a){if(("*"==d||a.origin==d)&&a.data==
c)this.port1.onmessage()},this);
b.addEventListener("message",a,!1);this.port1={};this.port2={postMessage:function(){b.postMessage(c,d)}}});
if("undefined"!==typeof a&&!C("Trident")&&!C("MSIE")){var b=new a,c={},d=c;b.port1.onmessage=function(){if(void 0!==c.next){c=c.next;var a=c.G;c.G=null;a()}};
return function(a){d.next={G:a};d=d.next;b.port2.postMessage(0)}}return"undefined"!==typeof document&&"onreadystatechange"in document.createElement("SCRIPT")?function(a){var b=document.createElement("SCRIPT");
b.onreadystatechange=function(){b.onreadystatechange=null;b.parentNode.removeChild(b);b=null;a();a=null};
document.documentElement.appendChild(b)}:function(a){k.setTimeout(a,0)}}
;function Ra(a,b,c){this.f=c;this.c=a;this.g=b;this.b=0;this.a=null}
Ra.prototype.get=function(){var a;0<this.b?(this.b--,a=this.a,this.a=a.next,a.next=null):a=this.c();return a};function Sa(){this.b=this.a=null}
var Ua=new Ra(function(){return new Ta},function(a){a.reset()},100);
Sa.prototype.remove=function(){var a=null;this.a&&(a=this.a,this.a=this.a.next,this.a||(this.b=null),a.next=null);return a};
function Ta(){this.next=this.b=this.a=null}
Ta.prototype.set=function(a,b){this.a=a;this.b=b;this.next=null};
Ta.prototype.reset=function(){this.next=this.b=this.a=null};function Va(a){F||Wa();Xa||(F(),Xa=!0);var b=Ya,c=Ua.get();c.set(a,void 0);b.b?b.b.next=c:b.a=c;b.b=c}
var F;function Wa(){var a=k.Promise;if(-1!=String(a).indexOf("[native code]")){var b=a.resolve(void 0);F=function(){b.then(Za)}}else F=function(){var a=Za;
"function"!=p(k.setImmediate)||k.Window&&k.Window.prototype&&!C("Edge")&&k.Window.prototype.setImmediate==k.setImmediate?(Pa||(Pa=Qa()),Pa(a)):k.setImmediate(a)}}
var Xa=!1,Ya=new Sa;function Za(){for(var a;a=Ya.remove();){try{a.a.call(a.b)}catch(c){Oa(c)}var b=Ua;b.g(a);b.b<b.f&&(b.b++,a.next=b.a,b.a=a)}Xa=!1}
;function G(){this.c=this.c;this.f=this.f}
G.prototype.c=!1;G.prototype.dispose=function(){this.c||(this.c=!0,this.A())};
G.prototype.A=function(){if(this.f)for(;this.f.length;)this.f.shift()()};function H(a){G.call(this);this.s=1;this.g=[];this.h=0;this.a=[];this.b={};this.v=!!a}
w(H,G);g=H.prototype;g.subscribe=function(a,b,c){var d=this.b[a];d||(d=this.b[a]=[]);var e=this.s;this.a[e]=a;this.a[e+1]=b;this.a[e+2]=c;this.s=e+3;d.push(e);return e};
function $a(a,b,c){var d=I;if(a=d.b[a]){var e=d.a;(a=pa(a,function(a){return e[a+1]==b&&e[a+2]==c}))&&d.F(a)}}
g.F=function(a){var b=this.a[a];if(b){var c=this.b[b];if(0!=this.h)this.g.push(a),this.a[a+1]=aa;else{if(c){var d=oa(c,a);0<=d&&Array.prototype.splice.call(c,d,1)}delete this.a[a];delete this.a[a+1];delete this.a[a+2]}}return!!b};
g.I=function(a,b){var c=this.b[a];if(c){for(var d=Array(arguments.length-1),e=1,f=arguments.length;e<f;e++)d[e-1]=arguments[e];if(this.v)for(e=0;e<c.length;e++){var h=c[e];ab(this.a[h+1],this.a[h+2],d)}else{this.h++;try{for(e=0,f=c.length;e<f;e++)h=c[e],this.a[h+1].apply(this.a[h+2],d)}finally{if(this.h--,0<this.g.length&&0==this.h)for(;c=this.g.pop();)this.F(c)}}return 0!=e}return!1};
function ab(a,b,c){Va(function(){a.apply(b,c)})}
g.clear=function(a){if(a){var b=this.b[a];b&&(y(b,this.F,this),delete this.b[a])}else this.a.length=0,this.b={}};
g.A=function(){H.D.A.call(this);this.clear();this.g.length=0};var bb=/^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;function cb(a,b,c){if("array"==p(b))for(var d=0;d<b.length;d++)cb(a,String(b[d]),c);else null!=b&&c.push("&",a,""===b?"":"=",encodeURIComponent(String(b)))}
function db(a){var b=[],c;for(c in a)cb(c,a[c],b);b[0]="";return b.join("")}
var eb=/#|$/;var J=window.yt&&window.yt.config_||window.ytcfg&&window.ytcfg.data_||{};v("yt.config_",J);v("yt.tokens_",window.yt&&window.yt.tokens_||{});var fb=window.yt&&window.yt.msgs_||l("window.ytcfg.msgs")||{};v("yt.msgs_",fb);function gb(a){var b=arguments;if(1<b.length){var c=b[0];J[c]=b[1]}else for(c in b=b[0],b)J[c]=b[c]}
function hb(a){"function"==p(a)&&(a=ib(a));return window.setInterval(a,250)}
function ib(a){return a&&window.yterr?function(){try{return a.apply(this,arguments)}catch(b){throw jb(b),b;}}:a}
function jb(a,b){var c=l("yt.logging.errors.log");c?c(a,b,void 0,void 0,void 0):(c=[],c="ERRORS"in J?J.ERRORS:c,c.push([a,b,void 0,void 0,void 0]),gb("ERRORS",c))}
;var kb=l("yt.dom.getNextId_");if(!kb){kb=function(){return++lb};
v("yt.dom.getNextId_",kb);var lb=0};function K(a){this.type="";this.source=this.data=this.currentTarget=this.relatedTarget=this.target=null;this.charCode=this.keyCode=0;this.shiftKey=this.ctrlKey=this.altKey=!1;this.clientY=this.clientX=0;if(a=a||window.event){this.a=a;for(var b in a)b in mb||(this[b]=a[b]);(b=a.target||a.srcElement)&&3==b.nodeType&&(b=b.parentNode);this.target=b;if(b=a.relatedTarget)try{b=b.nodeName?b:null}catch(c){b=null}else"mouseover"==this.type?b=a.fromElement:"mouseout"==this.type&&(b=a.toElement);this.relatedTarget=
b;this.clientX=void 0!=a.clientX?a.clientX:a.pageX;this.clientY=void 0!=a.clientY?a.clientY:a.pageY;this.keyCode=a.keyCode?a.keyCode:a.which;this.charCode=a.charCode||("keypress"==this.type?this.keyCode:0);this.altKey=a.altKey;this.ctrlKey=a.ctrlKey;this.shiftKey=a.shiftKey}}
K.prototype.preventDefault=function(){this.a&&(this.a.returnValue=!1,this.a.preventDefault&&this.a.preventDefault())};
K.prototype.stopPropagation=function(){this.a&&(this.a.cancelBubble=!0,this.a.stopPropagation&&this.a.stopPropagation())};
K.prototype.stopImmediatePropagation=function(){this.a&&(this.a.cancelBubble=!0,this.a.stopImmediatePropagation&&this.a.stopImmediatePropagation())};
var mb={stopImmediatePropagation:1,stopPropagation:1,preventMouseEvent:1,preventManipulation:1,preventDefault:1,layerX:1,layerY:1,scale:1,rotation:1,webkitMovementX:1,webkitMovementY:1};var A=l("yt.events.listeners_")||{};v("yt.events.listeners_",A);var nb=l("yt.events.counter_")||{count:0};v("yt.events.counter_",nb);function ob(a,b,c){a.addEventListener&&("mouseenter"!=b||"onmouseenter"in document?"mouseleave"!=b||"onmouseenter"in document?"mousewheel"==b&&"MozBoxSizing"in document.documentElement.style&&(b="MozMousePixelScroll"):b="mouseout":b="mouseover");return ra(function(d){return d[0]==a&&d[1]==b&&d[2]==c&&0==d[4]})}
function pb(a,b,c){if(a&&(a.addEventListener||a.attachEvent)){var d=ob(a,b,c);if(!d){var d=++nb.count+"",e=!("mouseenter"!=b&&"mouseleave"!=b||!a.addEventListener||"onmouseenter"in document),f;f=e?function(d){d=new K(d);if(!La(d.relatedTarget,function(b){return b==a}))return d.currentTarget=a,d.type=b,c.call(a,d)}:function(b){b=new K(b);
b.currentTarget=a;return c.call(a,b)};
f=ib(f);a.addEventListener?("mouseenter"==b&&e?b="mouseover":"mouseleave"==b&&e?b="mouseout":"mousewheel"==b&&"MozBoxSizing"in document.documentElement.style&&(b="MozMousePixelScroll"),a.addEventListener(b,f,!1)):a.attachEvent("on"+b,f);A[d]=[a,b,c,f,!1]}}}
function qb(a){a&&("string"==typeof a&&(a=[a]),y(a,function(a){if(a in A){var b=A[a],d=b[0],e=b[1],f=b[3],b=b[4];d.removeEventListener?d.removeEventListener(e,f,b):d.detachEvent&&d.detachEvent("on"+e,f);delete A[a]}}))}
;var rb={};function sb(a){return rb[a]||(rb[a]=String(a).replace(/\-([a-z])/g,function(a,c){return c.toUpperCase()}))}
;var L={},tb=[],I=new H,ub={};function vb(){y(tb,function(a){a()})}
function wb(a){var b=z(document.getElementsByTagName("yt:"+a));a="yt-"+a;var c=document;a=z(c.querySelectorAll&&c.querySelector?c.querySelectorAll("."+a):Ka(a));return qa(b,a)}
function M(a,b){return"yt:"==a.tagName.toLowerCase().substr(0,3)?a.getAttribute(b):a?a.dataset?a.dataset[sb(b)]:a.getAttribute("data-"+b):null}
function xb(a,b){I.I.apply(I,arguments)}
;function N(a,b,c){this.b=b;this.h=this.a=null;this.g=this[t]||(this[t]=++ca);this.c=0;this.B=!1;this.w=[];this.f=null;this.s=c;this.v={};b=document;if(a=r(a)?b.getElementById(a):a)if("iframe"!=a.tagName.toLowerCase()&&(b=yb(this,a),this.h=a,(c=a.parentNode)&&c.replaceChild(b,a),a=b),this.a=a,this.a.id||(b=a=this.a,b=b[t]||(b[t]=++ca),a.id="widget"+b),L[this.a.id]=this,window.postMessage){this.f=new H;zb(this);a=O(this.b,"events");for(var d in a)a.hasOwnProperty(d)&&this.addEventListener(d,a[d]);for(var e in ub)Ab(this,
e)}}
g=N.prototype;g.S=function(a,b){this.a.width=a;this.a.height=b;return this};
g.R=function(){return this.a};
g.J=function(a){this.l(a.event,a)};
g.addEventListener=function(a,b){var c=b;"string"==typeof b&&(c=function(){window[b].apply(window,arguments)});
this.f.subscribe(a,c);Bb(this,a);return this};
function Ab(a,b){b=b.split(".");if(2==b.length){var c=b[1];a.s==b[0]&&Bb(a,c)}}
g.P=function(){this.a.id&&(L[this.a.id]=null);var a=this.f;a&&"function"==typeof a.dispose&&a.dispose();if(this.h){var a=this.a,b=a.parentNode;b&&b.replaceChild(this.h,a)}else(a=this.a)&&a.parentNode&&a.parentNode.removeChild(a);P&&(P[this.g]=null);this.b=null;var a=this.a,c;for(c in A)A[c][0]==a&&qb(c);this.h=this.a=null};
g.o=n;g.u=function(){return{}};
function Q(a,b,c){c=c||[];c=Array.prototype.slice.call(c);b={event:"command",func:b,args:c};a.B?a.C(b):a.w.push(b)}
g.l=function(a,b){this.f.c||(b={target:this,data:b},this.f.I(a,b),xb(this.s+"."+a,b))};
function yb(a,b){var c=document.createElement("iframe");b=b.attributes;for(var d=0,e=b.length;d<e;d++){var f=b[d].value;null!=f&&""!=f&&"null"!=f&&c.setAttribute(b[d].name,f)}c.setAttribute("frameBorder",0);c.setAttribute("allowfullscreen",1);c.setAttribute("title","YouTube "+O(a.b,"title"));(b=O(a.b,"width"))&&c.setAttribute("width",b);(b=O(a.b,"height"))&&c.setAttribute("height",b);var h=a.u();h.enablejsapi=window.postMessage?1:0;window.location.host&&(h.origin=window.location.protocol+"//"+window.location.host);
h.widgetid=a.g;window.location.href&&y(["debugjs","debugcss"],function(a){var b;b=window.location.href;var c=b.search(eb),d;b:{d=0;for(var e=a.length;0<=(d=b.indexOf(a,d))&&d<c;){var f=b.charCodeAt(d-1);if(38==f||63==f)if(f=b.charCodeAt(d+e),!f||61==f||38==f||35==f)break b;d+=e+1}d=-1}if(0>d)b=null;else{e=b.indexOf("&",d);if(0>e||e>c)e=c;d+=a.length+1;b=decodeURIComponent(b.substr(d,e-d).replace(/\+/g," "))}null===b||(h[a]=b)});
c.src=O(a.b,"host")+a.o()+"?"+db(h);return c}
g.H=function(){this.a&&this.a.contentWindow?this.C({event:"listening"}):window.clearInterval(this.c)};
function zb(a){Cb(a.b,a,a.g);a.c=hb(u(a.H,a));pb(a.a,"load",u(function(){window.clearInterval(this.c);this.c=hb(u(this.H,this))},a))}
function Bb(a,b){a.v[b]||(a.v[b]=!0,Q(a,"addEventListener",[b]))}
g.C=function(a){a.id=this.g;a.channel="widget";a=Na(a);var b;b=this.b;var c,d=this.a.src.match(bb);c=d[1];var e=d[2],f=d[3],d=d[4],h="";c&&(h+=c+":");f&&(h+="//",e&&(h+=e+"@"),h+=f,d&&(h+=":"+d));c=h;b=0==c.indexOf("https:")?[c]:b.b?[c.replace("http:","https:")]:b.f?[c]:[c,c.replace("http:","https:")];for(c=0;c<b.length;c++)try{this.a.contentWindow.postMessage(a,b[c])}catch(m){if(m.name&&"SyntaxError"==m.name)jb(m,"WARNING");else throw m;}};var R="StopIteration"in k?k.StopIteration:{message:"StopIteration",stack:""};function S(){}
S.prototype.next=function(){throw R;};
S.prototype.m=function(){return this};
function Db(a){if(a instanceof S)return a;if("function"==typeof a.m)return a.m(!1);if(q(a)){var b=0,c=new S;c.next=function(){for(;;){if(b>=a.length)throw R;if(b in a)return a[b++];b++}};
return c}throw Error("Not implemented");}
function Eb(a,b){if(q(a))try{y(a,b,void 0)}catch(c){if(c!==R)throw c;}else{a=Db(a);try{for(;;)b.call(void 0,a.next(),void 0,a)}catch(c){if(c!==R)throw c;}}}
function Fb(a){if(q(a))return z(a);a=Db(a);var b=[];Eb(a,function(a){b.push(a)});
return b}
;function T(){}
T.prototype.set=n;T.prototype.get=n;T.prototype.remove=n;function U(){}
w(U,T);U.prototype.m=n;U.prototype.clear=function(){var a=Fb(this.m(!0)),b=this;y(a,function(a){b.remove(a)})};function V(a){this.a=a}
w(V,U);function Gb(a){if(a.a)try{a.a.setItem("__sak","1"),a.a.removeItem("__sak")}catch(b){}}
g=V.prototype;g.set=function(a,b){try{this.a.setItem(a,b)}catch(c){if(0==this.a.length)throw"Storage mechanism: Storage disabled";throw"Storage mechanism: Quota exceeded";}};
g.get=function(a){a=this.a.getItem(a);if(!r(a)&&null!==a)throw"Storage mechanism: Invalid value was encountered";return a};
g.remove=function(a){this.a.removeItem(a)};
g.m=function(a){var b=0,c=this.a,d=new S;d.next=function(){if(b>=c.length)throw R;var d=c.key(b++);if(a)return d;d=c.getItem(d);if(!r(d))throw"Storage mechanism: Invalid value was encountered";return d};
return d};
g.clear=function(){this.a.clear()};
g.key=function(a){return this.a.key(a)};function Hb(){var a=null;try{a=window.localStorage||null}catch(b){}this.a=a}
w(Hb,V);function Ib(){var a=null;try{a=window.sessionStorage||null}catch(b){}this.a=a}
w(Ib,V);Gb(new Hb);Gb(new Ib);function Jb(a){return(0==a.search("cue")||0==a.search("load"))&&"loadModule"!=a}
function Kb(a){return 0==a.search("get")||0==a.search("is")}
;function W(a){this.c=a||{};this.a={};this.a.host="http://www.youtube.com";this.a.title="";this.f=this.b=!1;a=document.getElementById("www-widgetapi-script");if(this.b=!!("https:"==document.location.protocol||a&&0==a.src.indexOf("https:"))){a=[this.c,window.YTConfig||{},this.a];for(var b=0;b<a.length;b++)a[b].host&&(a[b].host=a[b].host.replace("http://","https://"))}}
var P=null;function O(a,b){a=[a.c,window.YTConfig||{},a.a];for(var c=0;c<a.length;c++){var d=a[c][b];if(void 0!=d)return d}return null}
function Cb(a,b,c){P||(P={},pb(window,"message",u(a.g,a)));P[c]=b}
W.prototype.g=function(a){if(a.origin==O(this,"host")||a.origin==O(this,"host").replace(/^http:/,"https:")){var b;try{b=Ma(a.data)}catch(c){return}this.f=!0;this.b||0!=a.origin.indexOf("https:")||(this.b=!0);if(a=P[b.id])a.B=!0,a.B&&(y(a.w,a.C,a),a.w.length=0),a.J(b)}};function Lb(a){W.call(this,a);this.a.title="video player";this.a.videoId="";this.a.width=640;this.a.height=360}
w(Lb,W);function X(a,b){b=new Lb(b);N.call(this,a,b,"player");this.i={};this.j={}}
w(X,N);function Mb(a){if("iframe"!=a.tagName.toLowerCase()){var b=M(a,"videoid");if(b){var c=M(a,"width"),d=M(a,"height");new X(a,{videoId:b,width:c,height:d})}}}
g=X.prototype;g.o=function(){return"/embed/"+O(this.b,"videoId")};
g.u=function(){var a=O(this.b,"playerVars");if(a){var b={},c;for(c in a)b[c]=a[c];a=b}else a={};window!=window.top&&document.referrer&&(a.widget_referrer=document.referrer.substring(0,256));return a};
g.J=function(a){var b=a.event;a=a.info;switch(b){case "apiInfoDelivery":if(ba(a))for(var c in a)this.i[c]=a[c];break;case "infoDelivery":Nb(this,a);break;case "initialDelivery":window.clearInterval(this.c);this.j={};this.i={};Ob(this,a.apiInterface);Nb(this,a);break;default:this.l(b,a)}};
function Nb(a,b){if(ba(b))for(var c in b)a.j[c]=b[c]}
function Ob(a,b){y(b,function(a){this[a]||("getCurrentTime"==a?this[a]=function(){var a=this.j.currentTime;if(1==this.j.playerState){var b=(fa()/1E3-this.j.currentTimeLastUpdated_)*this.j.playbackRate;0<b&&(a+=Math.min(b,1))}return a}:Jb(a)?this[a]=function(){this.j={};
this.i={};Q(this,a,arguments);return this}:Kb(a)?this[a]=function(){var b=0;
0==a.search("get")?b=3:0==a.search("is")&&(b=2);return this.j[a.charAt(b).toLowerCase()+a.substr(b+1)]}:this[a]=function(){Q(this,a,arguments);
return this})},a)}
g.V=function(){var a=O(this.b,"host")+this.o(),b='<iframe width="'+parseInt(O(this.b,"width"),10)+'" height="'+parseInt(O(this.b,"height"),10)+'" src="';na.test(a)&&(-1!=a.indexOf("&")&&(a=a.replace(ha,"&amp;")),-1!=a.indexOf("<")&&(a=a.replace(ia,"&lt;")),-1!=a.indexOf(">")&&(a=a.replace(ja,"&gt;")),-1!=a.indexOf('"')&&(a=a.replace(ka,"&quot;")),-1!=a.indexOf("'")&&(a=a.replace(la,"&#39;")),-1!=a.indexOf("\x00")&&(a=a.replace(ma,"&#0;")));return b+a+'" frameborder="0" allowfullscreen></iframe>'};
g.U=function(a){return this.i.namespaces?a?this.i[a].options||[]:this.i.namespaces||[]:[]};
g.T=function(a,b){if(this.i.namespaces&&a&&b)return this.i[a][b]};function Pb(a){W.call(this,a);this.a.title="Thumbnail";this.a.videoId="";this.a.width=120;this.a.height=68}
w(Pb,W);function Y(a,b){b=new Pb(b);N.call(this,a,b,"thumbnail")}
w(Y,N);function Qb(a){if("iframe"!=a.tagName.toLowerCase()){var b=M(a,"videoid");if(b){b={videoId:b,events:{}};b.width=M(a,"width");b.height=M(a,"height");b.thumbWidth=M(a,"thumb-width");b.thumbHeight=M(a,"thumb-height");b.thumbAlign=M(a,"thumb-align");var c=M(a,"onclick");c&&(b.events.onClick=c);new Y(a,b)}}}
Y.prototype.o=function(){return"/embed/"+O(this.b,"videoId")};
Y.prototype.u=function(){return{player:0,thumb_width:O(this.b,"thumbWidth"),thumb_height:O(this.b,"thumbHeight"),thumb_align:O(this.b,"thumbAlign")}};
Y.prototype.l=function(a,b){Y.D.l.call(this,a,b?b.info:void 0)};function Rb(a){W.call(this,a);this.a.host="https://www.youtube.com";this.a.title="upload widget";this.a.width=640;this.a.height=.67*O(this,"width")}
w(Rb,W);function Z(a,b){b=new Rb(b);N.call(this,a,b,"upload")}
w(Z,N);g=Z.prototype;g.o=function(){return"/upload_embed"};
g.u=function(){var a={},b=O(this.b,"webcamOnly");null!=b&&(a.webcam_only=b);return a};
g.l=function(a,b){Z.D.l.call(this,a,b);"onApiReady"==a&&Q(this,"hostWindowReady")};
g.K=function(a){Q(this,"setVideoDescription",arguments)};
g.M=function(a){Q(this,"setVideoKeywords",arguments)};
g.N=function(a){Q(this,"setVideoPrivacy",arguments)};
g.L=function(a){Q(this,"setVideoDraftPrivacy",arguments)};
g.O=function(a){Q(this,"setVideoTitle",arguments)};v("YT.PlayerState.UNSTARTED",-1);v("YT.PlayerState.ENDED",0);v("YT.PlayerState.PLAYING",1);v("YT.PlayerState.PAUSED",2);v("YT.PlayerState.BUFFERING",3);v("YT.PlayerState.CUED",5);v("YT.UploadWidgetEvent.API_READY","onApiReady");v("YT.UploadWidgetEvent.UPLOAD_SUCCESS","onUploadSuccess");v("YT.UploadWidgetEvent.PROCESSING_COMPLETE","onProcessingComplete");v("YT.UploadWidgetEvent.STATE_CHANGE","onStateChange");v("YT.UploadWidgetState.IDLE",0);v("YT.UploadWidgetState.PENDING",1);
v("YT.UploadWidgetState.ERROR",2);v("YT.UploadWidgetState.PLAYBACK",3);v("YT.UploadWidgetState.RECORDING",4);v("YT.UploadWidgetState.STOPPED",5);v("YT.get",function(a){return L[a]});
v("YT.scan",vb);v("YT.subscribe",function(a,b,c){I.subscribe(a,b,c);ub[a]=!0;for(var d in L)Ab(L[d],a)});
v("YT.unsubscribe",function(a,b,c){$a(a,b,c)});
v("YT.Player",X);v("YT.Thumbnail",Y);v("YT.UploadWidget",Z);N.prototype.destroy=N.prototype.P;N.prototype.setSize=N.prototype.S;N.prototype.getIframe=N.prototype.R;N.prototype.addEventListener=N.prototype.addEventListener;X.prototype.getVideoEmbedCode=X.prototype.V;X.prototype.getOptions=X.prototype.U;X.prototype.getOption=X.prototype.T;Z.prototype.setVideoDescription=Z.prototype.K;Z.prototype.setVideoKeywords=Z.prototype.M;Z.prototype.setVideoPrivacy=Z.prototype.N;Z.prototype.setVideoTitle=Z.prototype.O;
Z.prototype.setVideoDraftPrivacy=Z.prototype.L;tb.push(function(){var a=wb("player");y(a,Mb)});
tb.push(function(){var a=wb("thumbnail");y(a,Qb)});
"undefined"!=typeof YTConfig&&YTConfig.parsetags&&"onload"!=YTConfig.parsetags||vb();var Sb=l("onYTReady");Sb&&Sb();var Tb=l("onYouTubeIframeAPIReady");Tb&&Tb();var Ub=l("onYouTubePlayerAPIReady");Ub&&Ub();})();
