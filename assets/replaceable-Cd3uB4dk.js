import{C as e,S as t,rt as n,v as r}from"./runtime-core.esm-bundler-DJah_3DO.js";import{F as i,P as a,p as o,y as s}from"./Button-o7s-ziHf.js";import{t as c}from"./toString-DqsmOaJa.js";import{t as l}from"./_hasUnicode-B8HRQxzF.js";function u(e,t,n){var r=-1,i=e.length;t<0&&(t=-t>i?0:i+t),n=n>i?i:n,n<0&&(n+=i),i=t>n?0:n-t>>>0,t>>>=0;for(var a=Array(i);++r<i;)a[r]=e[r+t];return a}function d(e,t,n){var r=e.length;return n=n===void 0?r:n,!t&&n>=r?e:u(e,t,n)}function f(e){return e.split(``)}var p=`\\ud800-\\udfff`,m=`\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff`,h=`\\ufe0e\\ufe0f`,g=`[`+p+`]`,_=`[`+m+`]`,v=`\\ud83c[\\udffb-\\udfff]`,y=`(?:`+_+`|`+v+`)`,b=`[^`+p+`]`,x=`(?:\\ud83c[\\udde6-\\uddff]){2}`,S=`[\\ud800-\\udbff][\\udc00-\\udfff]`,C=`\\u200d`,w=y+`?`,T=`[`+h+`]?`,E=`(?:`+C+`(?:`+[b,x,S].join(`|`)+`)`+T+w+`)*`,D=T+w+E,O=`(?:`+[b+_+`?`,_,x,S,g].join(`|`)+`)`,k=RegExp(v+`(?=`+v+`)|`+O+D,`g`);function A(e){return e.match(k)||[]}function j(e){return l(e)?A(e):f(e)}function M(e){return function(t){t=c(t);var n=l(t)?j(t):void 0,r=n?n[0]:t.charAt(0),i=n?d(n,1).join(``):t.slice(1);return r[e]()+i}}var N=M(`toUpperCase`),P=i(`base-icon`,`
 height: 1em;
 width: 1em;
 line-height: 1em;
 text-align: center;
 display: inline-block;
 position: relative;
 fill: currentColor;
`,[a(`svg`,`
 height: 1em;
 width: 1em;
 `)]),F=r({name:`BaseIcon`,props:{role:String,ariaLabel:String,ariaDisabled:{type:Boolean,default:void 0},ariaHidden:{type:Boolean,default:void 0},clsPrefix:{type:String,required:!0},onClick:Function,onMousedown:Function,onMouseup:Function},setup(e){o(`-base-icon`,P,n(e,`clsPrefix`))},render(){return t(`i`,{class:`${this.clsPrefix}-base-icon`,onClick:this.onClick,onMousedown:this.onMousedown,onMouseup:this.onMouseup,role:this.role,"aria-label":this.ariaLabel,"aria-hidden":this.ariaHidden,"aria-disabled":this.ariaDisabled},this.$slots)}});function I(n,i){let a=r({render(){return i()}});return r({name:N(n),setup(){let r=e(s,null)?.mergedIconsRef;return()=>{let e=r?.value?.[n];return e?e():t(a,null)}}})}export{F as n,I as t};