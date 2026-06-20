import{$ as e,C as t,F as n,G as r,I as i,K as a,L as o,P as s,R as c,S as l,St as u,W as d,_ as f,at as p,c as m,d as h,f as g,g as _,h as v,i as y,j as b,k as x,l as S,m as C,rt as w,u as T,v as E,wt as D,x as O,xt as k}from"./runtime-core.esm-bundler-DJah_3DO.js";import{t as A}from"./runtime-dom.esm-bundler-DFVbD1kG.js";import{B as j,C as M,E as N,F as P,I as F,L as I,P as L,R,T as z,V as ee,_ as B,f as V,h as te,o as ne,s as re,t as ie,v as H,w as ae,x as oe,z as U}from"./Button-o7s-ziHf.js";import{a as se,i as ce,n as W,t as G}from"./fade-in.cssr-CkBvnNhL.js";import{r as K}from"./warn-D98-BO36.js";import{a as le,c as ue,s as de,t as fe,v as pe,y as q}from"./index-YdcH_wlr.js";import{t as J}from"./_plugin-vue_export-helper-DGA9ry_j.js";function me(e,t){return m(()=>{for(let n of t)if(e[n]!==void 0)return e[n];return e[t[t.length-1]]})}var he={color:Object,type:{type:String,default:`default`},round:Boolean,size:String,closable:Boolean,disabled:{type:Boolean,default:void 0}},ge=P(`tag`,`
 --n-close-margin: var(--n-close-margin-top) var(--n-close-margin-right) var(--n-close-margin-bottom) var(--n-close-margin-left);
 white-space: nowrap;
 position: relative;
 box-sizing: border-box;
 cursor: default;
 display: inline-flex;
 align-items: center;
 flex-wrap: nowrap;
 padding: var(--n-padding);
 border-radius: var(--n-border-radius);
 color: var(--n-text-color);
 background-color: var(--n-color);
 transition: 
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 line-height: 1;
 height: var(--n-height);
 font-size: var(--n-font-size);
`,[I(`strong`,`
 font-weight: var(--n-font-weight-strong);
 `),F(`border`,`
 pointer-events: none;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-border);
 transition: border-color .3s var(--n-bezier);
 `),F(`icon`,`
 display: flex;
 margin: 0 4px 0 0;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 font-size: var(--n-avatar-size-override);
 `),F(`avatar`,`
 display: flex;
 margin: 0 6px 0 0;
 `),F(`close`,`
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `),I(`round`,`
 padding: 0 calc(var(--n-height) / 3);
 border-radius: calc(var(--n-height) / 2);
 `,[F(`icon`,`
 margin: 0 4px 0 calc((var(--n-height) - 8px) / -2);
 `),F(`avatar`,`
 margin: 0 6px 0 calc((var(--n-height) - 8px) / -2);
 `),I(`closable`,`
 padding: 0 calc(var(--n-height) / 4) 0 calc(var(--n-height) / 3);
 `)]),I(`icon, avatar`,[I(`round`,`
 padding: 0 calc(var(--n-height) / 3) 0 calc(var(--n-height) / 2);
 `)]),I(`disabled`,`
 cursor: not-allowed !important;
 opacity: var(--n-opacity-disabled);
 `),I(`checkable`,`
 cursor: pointer;
 box-shadow: none;
 color: var(--n-text-color-checkable);
 background-color: var(--n-color-checkable);
 `,[R(`disabled`,[L(`&:hover`,`background-color: var(--n-color-hover-checkable);`,[R(`checked`,`color: var(--n-text-color-hover-checkable);`)]),L(`&:active`,`background-color: var(--n-color-pressed-checkable);`,[R(`checked`,`color: var(--n-text-color-pressed-checkable);`)])]),I(`checked`,`
 color: var(--n-text-color-checked);
 background-color: var(--n-color-checked);
 `,[R(`disabled`,[L(`&:hover`,`background-color: var(--n-color-checked-hover);`),L(`&:active`,`background-color: var(--n-color-checked-pressed);`)])])])]),_e=Object.assign(Object.assign(Object.assign({},V.props),he),{bordered:{type:Boolean,default:void 0},checked:Boolean,checkable:Boolean,strong:Boolean,triggerClickOnClose:Boolean,onClose:[Array,Function],onMouseenter:Function,onMouseleave:Function,"onUpdate:checked":Function,onUpdateChecked:Function,internalCloseFocusable:{type:Boolean,default:!0},internalCloseIsButtonTag:{type:Boolean,default:!0},onCheckedChange:Function}),Y=K(`n-tag`);E({name:`Tag`,props:_e,slots:Object,setup(t){let r=e(null),{mergedBorderedRef:i,mergedClsPrefixRef:a,inlineThemeDisabled:o,mergedRtlRef:s,mergedComponentPropsRef:c}=H(t),l=m(()=>t.size||c?.value?.Tag?.size||`medium`),u=V(`Tag`,`-tag`,ge,de,t,a);n(Y,{roundRef:w(t,`round`)});function d(){if(!t.disabled&&t.checkable){let{checked:e,onCheckedChange:n,onUpdateChecked:r,"onUpdate:checked":i}=t;r&&r(!e),i&&i(!e),n&&n(!e)}}function f(e){if(t.triggerClickOnClose||e.stopPropagation(),!t.disabled){let{onClose:n}=t;n&&ae(n,e)}}let p={setTextContent(e){let{value:t}=r;t&&(t.textContent=e)}},h=te(`Tag`,s,a),g=m(()=>{let{type:e,color:{color:n,textColor:r}={}}=t,a=l.value,{common:{cubicBezierEaseInOut:o},self:{padding:s,closeMargin:c,borderRadius:d,opacityDisabled:f,textColorCheckable:p,textColorHoverCheckable:m,textColorPressedCheckable:h,textColorChecked:g,colorCheckable:_,colorHoverCheckable:v,colorPressedCheckable:y,colorChecked:b,colorCheckedHover:x,colorCheckedPressed:S,closeBorderRadius:C,fontWeightStrong:w,[U(`colorBordered`,e)]:T,[U(`closeSize`,a)]:E,[U(`closeIconSize`,a)]:D,[U(`fontSize`,a)]:O,[U(`height`,a)]:k,[U(`color`,e)]:A,[U(`textColor`,e)]:j,[U(`border`,e)]:M,[U(`closeIconColor`,e)]:N,[U(`closeIconColorHover`,e)]:P,[U(`closeIconColorPressed`,e)]:F,[U(`closeColorHover`,e)]:I,[U(`closeColorPressed`,e)]:L}}=u.value,R=ce(c);return{"--n-font-weight-strong":w,"--n-avatar-size-override":`calc(${k} - 8px)`,"--n-bezier":o,"--n-border-radius":d,"--n-border":M,"--n-close-icon-size":D,"--n-close-color-pressed":L,"--n-close-color-hover":I,"--n-close-border-radius":C,"--n-close-icon-color":N,"--n-close-icon-color-hover":P,"--n-close-icon-color-pressed":F,"--n-close-icon-color-disabled":N,"--n-close-margin-top":R.top,"--n-close-margin-right":R.right,"--n-close-margin-bottom":R.bottom,"--n-close-margin-left":R.left,"--n-close-size":E,"--n-color":n||(i.value?T:A),"--n-color-checkable":_,"--n-color-checked":b,"--n-color-checked-hover":x,"--n-color-checked-pressed":S,"--n-color-hover-checkable":v,"--n-color-pressed-checkable":y,"--n-font-size":O,"--n-height":k,"--n-opacity-disabled":f,"--n-padding":s,"--n-text-color":r||j,"--n-text-color-checkable":p,"--n-text-color-checked":g,"--n-text-color-hover-checkable":m,"--n-text-color-pressed-checkable":h}}),_=o?B(`tag`,m(()=>{let e=``,{type:n,color:{color:r,textColor:a}={}}=t;return e+=n[0],e+=l.value[0],r&&(e+=`a${z(r)}`),a&&(e+=`b${z(a)}`),i.value&&(e+=`c`),e}),g,t):void 0;return Object.assign(Object.assign({},p),{rtlEnabled:h,mergedClsPrefix:a,contentRef:r,mergedBordered:i,handleClick:d,handleCloseClick:f,cssVars:o?void 0:g,themeClass:_?.themeClass,onRender:_?.onRender})},render(){var e;let{mergedClsPrefix:t,rtlEnabled:n,closable:r,color:{borderColor:i}={},round:a,onRender:o,$slots:s}=this;o?.();let c=M(s.avatar,e=>e&&l(`div`,{class:`${t}-tag__avatar`},e)),u=M(s.icon,e=>e&&l(`div`,{class:`${t}-tag__icon`},e));return l(`div`,{class:[`${t}-tag`,this.themeClass,{[`${t}-tag--rtl`]:n,[`${t}-tag--strong`]:this.strong,[`${t}-tag--disabled`]:this.disabled,[`${t}-tag--checkable`]:this.checkable,[`${t}-tag--checked`]:this.checkable&&this.checked,[`${t}-tag--round`]:a,[`${t}-tag--avatar`]:c,[`${t}-tag--icon`]:u,[`${t}-tag--closable`]:r}],style:this.cssVars,onClick:this.handleClick,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},u||c,l(`span`,{class:`${t}-tag__content`,ref:`contentRef`},(e=this.$slots).default?.call(e)),!this.checkable&&r?l(ue,{clsPrefix:t,class:`${t}-tag__close`,disabled:this.disabled,onClick:this.handleCloseClick,focusable:this.internalCloseFocusable,round:a,isButtonTag:this.internalCloseIsButtonTag,absolute:!0}):null,!this.checkable&&this.mergedBordered?l(`div`,{class:`${t}-tag__border`,style:{borderColor:i}}):null)}});var ve=N&&`loading`in document.createElement(`img`);function ye(e={}){let{root:t=null}=e;return{hash:`${e.rootMargin||`0px 0px 0px 0px`}-${Array.isArray(e.threshold)?e.threshold.join(`,`):e.threshold??`0`}`,options:Object.assign(Object.assign({},e),{root:(typeof t==`string`?document.querySelector(t):t)||document.documentElement})}}var X=new WeakMap,Z=new WeakMap,Q=new WeakMap,be=(e,t,n)=>{if(!e)return()=>{};let r=ye(t),{root:i}=r.options,a,o=X.get(i);o?a=o:(a=new Map,X.set(i,a));let s,c;a.has(r.hash)?(c=a.get(r.hash),c[1].has(e)||(s=c[0],c[1].add(e),s.observe(e))):(s=new IntersectionObserver(e=>{e.forEach(e=>{if(e.isIntersecting){let t=Z.get(e.target),n=Q.get(e.target);t&&t(),n&&(n.value=!0)}})},r.options),s.observe(e),c=[s,new Set([e])],a.set(r.hash,c));let l=!1,u=()=>{l||(Z.delete(e),Q.delete(e),l=!0,c[1].has(e)&&(c[0].unobserve(e),c[1].delete(e)),c[1].size<=0&&a.delete(r.hash),a.size||X.delete(i))};return Z.set(e,u),Q.set(e,n),u},xe=K(`n-avatar-group`),Se=P(`avatar`,`
 width: var(--n-merged-size);
 height: var(--n-merged-size);
 color: #FFF;
 font-size: var(--n-font-size);
 display: inline-flex;
 position: relative;
 overflow: hidden;
 text-align: center;
 border: var(--n-border);
 border-radius: var(--n-border-radius);
 --n-merged-color: var(--n-color);
 background-color: var(--n-merged-color);
 transition:
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
`,[j(L(`&`,`--n-merged-color: var(--n-color-modal);`)),ee(L(`&`,`--n-merged-color: var(--n-color-popover);`)),L(`img`,`
 width: 100%;
 height: 100%;
 `),F(`text`,`
 white-space: nowrap;
 display: inline-block;
 position: absolute;
 left: 50%;
 top: 50%;
 `),P(`icon`,`
 vertical-align: bottom;
 font-size: calc(var(--n-merged-size) - 6px);
 `),F(`text`,`line-height: 1.25`)]),Ce=E({name:`Avatar`,props:Object.assign(Object.assign({},V.props),{size:[String,Number],src:String,circle:{type:Boolean,default:void 0},objectFit:String,round:{type:Boolean,default:void 0},bordered:{type:Boolean,default:void 0},onError:Function,fallbackSrc:String,intersectionObserverOptions:Object,lazy:Boolean,onLoad:Function,renderPlaceholder:Function,renderFallback:Function,imgProps:Object,color:String}),slots:Object,setup(n){let{mergedClsPrefixRef:i,inlineThemeDisabled:a}=H(n),o=e(!1),s=null,c=e(null),l=e(null),u=()=>{let{value:e}=c;if(e&&(s===null||s!==e.innerHTML)){s=e.innerHTML;let{value:t}=l;if(t){let{offsetWidth:n,offsetHeight:r}=t,{offsetWidth:i,offsetHeight:a}=e,o=.9,s=Math.min(n/i*o,r/a*o,1);e.style.transform=`translateX(-50%) translateY(-50%) scale(${s})`}}},f=t(xe,null),p=m(()=>{let{size:e}=n;if(e)return e;let{size:t}=f||{};return t||`medium`}),h=V(`Avatar`,`-avatar`,Se,le,n,i),g=t(Y,null),_=m(()=>{if(f)return!0;let{round:e,circle:t}=n;return e!==void 0||t!==void 0?e||t:g?g.roundRef.value:!1}),v=m(()=>f?!0:n.bordered||!1),y=m(()=>{let e=p.value,t=_.value,r=v.value,{color:i}=n,{self:{borderRadius:a,fontSize:o,color:s,border:c,colorModal:l,colorPopover:u},common:{cubicBezierEaseInOut:d}}=h.value,f;return f=typeof e==`number`?`${e}px`:h.value.self[U(`height`,e)],{"--n-font-size":o,"--n-border":r?c:`none`,"--n-border-radius":t?`50%`:a,"--n-color":i||s,"--n-color-modal":i||l,"--n-color-popover":i||u,"--n-bezier":d,"--n-merged-size":`var(--n-avatar-size-override, ${f})`}}),S=a?B(`avatar`,m(()=>{let e=p.value,t=_.value,r=v.value,{color:i}=n,a=``;return e&&(typeof e==`number`?a+=`a${e}`:a+=e[0]),t&&(a+=`b`),r&&(a+=`c`),i&&(a+=z(i)),a}),y,n):void 0,C=e(!n.lazy);b(()=>{if(n.lazy&&n.intersectionObserverOptions){let e,t=r(()=>{e?.(),e=void 0,n.lazy&&(e=be(l.value,n.intersectionObserverOptions,C))});x(()=>{t(),e?.()})}}),d(()=>n.src||n.imgProps?.src,()=>{o.value=!1});let w=e(!n.lazy);return{textRef:c,selfRef:l,mergedRoundRef:_,mergedClsPrefix:i,fitTextTransform:u,cssVars:a?void 0:y,themeClass:S?.themeClass,onRender:S?.onRender,hasLoadError:o,shouldStartLoading:C,loaded:w,mergedOnError:e=>{if(!C.value)return;o.value=!0;let{onError:t,imgProps:{onError:r}={}}=n;t?.(e),r?.(e)},mergedOnLoad:e=>{let{onLoad:t,imgProps:{onLoad:r}={}}=n;t?.(e),r?.(e),w.value=!0}}},render(){var e;let{$slots:t,src:n,mergedClsPrefix:r,lazy:i,onRender:a,loaded:o,hasLoadError:s,imgProps:c={}}=this;a?.();let u,d=!o&&!s&&(this.renderPlaceholder?this.renderPlaceholder():(e=this.$slots).placeholder?.call(e));return u=this.hasLoadError?this.renderFallback?this.renderFallback():oe(t.fallback,()=>[l(`img`,{src:this.fallbackSrc,style:{objectFit:this.objectFit}})]):M(t.default,e=>{if(e)return l(W,{onResize:this.fitTextTransform},{default:()=>l(`span`,{ref:`textRef`,class:`${r}-avatar__text`},e)});if(n||c.src){let e=this.src||c.src;return l(`img`,Object.assign(Object.assign({},c),{loading:ve&&!this.intersectionObserverOptions&&i?`lazy`:`eager`,src:i&&this.intersectionObserverOptions?this.shouldStartLoading?e:void 0:e,"data-image-src":e,onLoad:this.mergedOnLoad,onError:this.mergedOnError,style:[c.style||``,{objectFit:this.objectFit},d?{height:`0`,width:`0`,visibility:`hidden`,position:`absolute`}:``]}))}}),l(`span`,{ref:`selfRef`,class:[`${r}-avatar`,this.themeClass],style:this.cssVars},u,i&&d)}}),we=L([L(`@keyframes spin-rotate`,`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),P(`spin-container`,`
 position: relative;
 `,[P(`spin-body`,`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[G()])]),P(`spin-body`,`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),P(`spin`,`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[I(`rotate`,`
 animation: spin-rotate 2s linear infinite;
 `)]),P(`spin-description`,`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),P(`spin-content`,`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[I(`spinning`,`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),Te={small:20,medium:18,large:16},Ee=E({name:`Spin`,props:Object.assign(Object.assign(Object.assign({},V.props),{contentClass:String,contentStyle:[Object,String],description:String,size:{type:[String,Number],default:`medium`},show:{type:Boolean,default:!0},rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),re),slots:Object,setup(t){let{mergedClsPrefixRef:n,inlineThemeDisabled:i}=H(t),a=V(`Spin`,`-spin`,we,fe,t,n),o=m(()=>{let{size:e}=t,{common:{cubicBezierEaseInOut:n},self:r}=a.value,{opacitySpinning:i,color:o,textColor:s}=r;return{"--n-bezier":n,"--n-opacity-spinning":i,"--n-size":typeof e==`number`?se(e):r[U(`size`,e)],"--n-color":o,"--n-text-color":s}}),s=i?B(`spin`,m(()=>{let{size:e}=t;return typeof e==`number`?String(e):e[0]}),o,t):void 0,c=me(t,[`spinning`,`show`]),l=e(!1);return r(e=>{let n;if(c.value){let{delay:r}=t;if(r){n=window.setTimeout(()=>{l.value=!0},r),e(()=>{clearTimeout(n)});return}}l.value=c.value}),{mergedClsPrefix:n,active:l,mergedStrokeWidth:m(()=>{let{strokeWidth:e}=t;if(e!==void 0)return e;let{size:n}=t;return Te[typeof n==`number`?`medium`:n]}),cssVars:i?void 0:o,themeClass:s?.themeClass,onRender:s?.onRender}},render(){var e;let{$slots:t,mergedClsPrefix:n,description:r}=this,i=t.icon&&this.rotate,a=(r||t.description)&&l(`div`,{class:`${n}-spin-description`},r||t.description?.call(t)),o=t.icon?l(`div`,{class:[`${n}-spin-body`,this.themeClass]},l(`div`,{class:[`${n}-spin`,i&&`${n}-spin--rotate`],style:t.default?``:this.cssVars},t.icon()),a):l(`div`,{class:[`${n}-spin-body`,this.themeClass]},l(ne,{clsPrefix:n,style:t.default?``:this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,radius:this.radius,scale:this.scale,class:`${n}-spin`}),a);return(e=this.onRender)==null||e.call(this),t.default?l(`div`,{class:[`${n}-spin-container`,this.themeClass],style:this.cssVars},l(`div`,{class:[`${n}-spin-content`,this.active&&`${n}-spin-content--spinning`,this.contentClass],style:this.contentStyle},t),l(A,{name:`fade-in-transition`},{default:()=>this.active?o:null})):o}}),De={class:`slot-frame-layout-container`},Oe={key:0,class:`top`},ke={class:`center`},Ae={class:`bottom`},je=J(E({name:`LayoutSlotFrame`,__name:`SlotFrame`,setup(e){return(e,t)=>(s(),g(`div`,De,[e.$slots.top?(s(),g(`div`,Oe,[o(e.$slots,`top`,{},void 0,!0)])):h(``,!0),S(`div`,ke,[o(e.$slots,`center`,{},void 0,!0)]),S(`div`,Ae,[o(e.$slots,`bottom`,{},void 0,!0)])]))}}),[[`__scopeId`,`data-v-1e480dbf`]]),Me=[`href`],Ne=J(E({__name:`NavOctocat`,setup(t){let n=e(`https://github.com/pdsuwwz/chatgpt-vue3-light-mvp`);return(e,t)=>(s(),g(`a`,{class:`octocat-link c-#71717a dark:c-#666 hover-c-#3f3f46 dark:hover-c-#f6f5f7`,target:`_blank`,href:p(n)},[...t[0]||=[S(`svg`,{width:`22`,height:`22`,viewBox:`0 0 14 14`,fill:`none`,xmlns:`http://www.w3.org/2000/svg`},[S(`path`,{"fill-rule":`evenodd`,"clip-rule":`evenodd`,d:`M7.02751 0.333496C3.34571 0.333496 0.333332 3.40836 0.333332 7.16653C0.333332 10.1845 2.23002 12.7468 4.90769 13.6579C5.2424 13.7149 5.35397 13.4871 5.35397 13.3163C5.35397 13.1454 5.35397 12.7468 5.35397 12.1774C3.51307 12.576 3.12257 11.2664 3.12257 11.2664C2.84365 10.4692 2.39737 10.2414 2.39737 10.2414C1.72795 9.8428 2.39737 9.8428 2.39737 9.8428C3.06679 9.89974 3.4015 10.5261 3.4015 10.5261C4.01513 11.5511 4.96347 11.2664 5.35397 11.0955C5.40975 10.64 5.57711 10.3553 5.80024 10.1845C4.29405 10.0136 2.73208 9.44421 2.73208 6.82488C2.73208 6.08463 3.011 5.45827 3.4015 5.00274C3.4015 4.77497 3.12257 4.09166 3.51307 3.18059C3.51307 3.18059 4.07091 3.00977 5.35397 3.8639C5.91181 3.69307 6.46966 3.63613 7.02751 3.63613C7.58536 3.63613 8.14321 3.69307 8.70105 3.8639C9.98411 2.95283 10.542 3.18059 10.542 3.18059C10.9324 4.14861 10.6535 4.83191 10.5977 5.00274C11.044 5.45827 11.2672 6.08463 11.2672 6.82488C11.2672 9.44421 9.70518 10.0136 8.19899 10.1845C8.42213 10.4122 8.64527 10.8108 8.64527 11.4372C8.64527 12.3482 8.64527 13.0885 8.64527 13.3163C8.64527 13.4871 8.75684 13.7149 9.09155 13.6579C11.7692 12.7468 13.6659 10.1845 13.6659 7.16653C13.7217 3.40836 10.7093 0.333496 7.02751 0.333496Z`,fill:`currentColor`})],-1)]],8,Me))}}),[[`__scopeId`,`data-v-000fb00c`]]),Pe={class:`container`},Fe={class:`text`},Ie=[`href`],Le=J(E({__name:`NavFooter`,props:{showBorder:{type:Boolean,default:!1}},setup(t){let n=e(`https://github.com/pdsuwwz`);return(e,r)=>{let i=Ne;return s(),g(`footer`,{class:k([`footer`,{"b-t b-t-solid b-t-#dcdfe6 dark:b-t-#444":t.showBorder}])},[S(`div`,Pe,[S(`p`,Fe,[f(i),r[0]||=_(` MIT Licensed | Copyright © 2020-PRESENT `,-1),S(`a`,{target:`_blank`,href:p(n),class:`github-link c-#555 dark:c-#fff b-b b-b-solid b-b-#3c3c43:12 dark:b-b-#666:12`},` Wisdom `,8,Ie)])])],2)}}}),[[`__scopeId`,`data-v-2d5cc114`]]),Re={"w-full":``,"h-full":``,"overflow-hidden":``,class:`panel-shadow`},ze={key:0,flex:`~ col`,"w-300":``,"h-full":``,"overflow-hidden":``},Be={flex:`1`,"h-full":``,"overflow-hidden":``},Ve=J(E({__name:`SlotCenterPanel`,props:{loading:{type:Boolean,default:!1}},setup(e){return(t,n)=>{let r=Ee,i=Le,c=je;return s(),T(c,{class:k([`bg-no-repeat bg-cover bg-center`])},{center:a(()=>[S(`div`,Re,[f(r,{"w-full":``,"h-full":``,"content-class":`w-full h-full flex`,show:e.loading,rotate:!1,class:`bg-#fefbff`,style:{"--n-opacity-spinning":`0`}},{icon:a(()=>[...n[0]||=[S(`div`,{class:`i-svg-spinners:pulse-3`},null,-1)]]),default:a(()=>[t.$slots.left?(s(),g(`section`,ze,[o(t.$slots,`left`,{},void 0,!0)])):h(``,!0),S(`section`,Be,[o(t.$slots,`default`,{},void 0,!0)])]),_:3},8,[`show`])])]),bottom:a(()=>[f(i)]),_:3})}}}),[[`__scopeId`,`data-v-2476c65d`]]),He={},Ue={"min-h-0":``,flex:`1 ~ col`,class:k([`select-none`,`bg-no-repeat bg-cover bg-right`,`bg-transparent`]),style:{background:`radial-gradient(circle at top left, rgba(113, 135, 255, 0.1), transparent 34%), linear-gradient(180deg, #fbfcff 0%, #f4f7fb 100%)`}},We={key:0,py:`2px`},Ge={flex:`1`,pl:`16px`,pr:`8px`,pt:`20px`,pb:`0`,"overflow-hidden":``},Ke={key:1,py:`14px`,pl:`16px`,pr:`8px`,pb:`24px`},qe={"h-full":``,bg:`#fefbff`};function Je(e,t){let n=Ve;return s(),T(n,u(O(e.$attrs)),C({default:a(()=>[S(`div`,qe,[o(e.$slots,`default`)])]),_:2},[e.$slots.sidebar?{name:`left`,fn:a(()=>[S(`div`,Ue,[e.$slots[`sidebar-header`]?(s(),g(`div`,We,[o(e.$slots,`sidebar-header`)])):h(``,!0),S(`div`,Ge,[o(e.$slots,`sidebar`)]),e.$slots[`sidebar-action`]?(s(),g(`div`,Ke,[o(e.$slots,`sidebar-action`)])):h(``,!0)])]),key:`0`}:void 0]),1040)}var $=J(He,[[`render`,Je]]),Ye={class:`workspace-header`},Xe={class:`header-actions`},Ze={class:`profile-pill`},Qe=J(E({__name:`WorkbenchHeader`,setup(e){let t=q(),n=()=>{t.push({name:`SpaceOdysseyShowcase`})},r=()=>{t.push({name:`MockInterviewSpaceShowcase`})};return(e,t)=>{let i=Ce;return s(),g(`header`,Ye,[t[4]||=S(`div`,{class:`header-search`},[S(`span`,{class:`i-lucide-search search-icon`}),S(`input`,{type:`text`,placeholder:`搜索资料、知识点或历史训练...`})],-1),S(`div`,Xe,[S(`button`,{type:`button`,class:`showcase-entry`,onClick:n},[...t[0]||=[S(`span`,{class:`i-lucide-orbit showcase-entry-icon`},null,-1),S(`span`,null,`Space Demo`,-1)]]),S(`button`,{type:`button`,class:`showcase-entry showcase-entry-secondary`,onClick:r},[...t[1]||=[S(`span`,{class:`i-lucide-messages-square showcase-entry-icon`},null,-1),S(`span`,null,`Interview Mock`,-1)]]),t[3]||=S(`button`,{type:`button`,class:`header-action-btn`},[S(`span`,{class:`i-lucide-bell`})],-1),S(`div`,Ze,[f(i,{round:``,size:34,src:`https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80`}),t[2]||=S(`div`,null,[S(`div`,{class:`profile-name`},`Nicholas Turner`),S(`div`,{class:`profile-role`},`Frontend Candidate`)],-1)])])])}}}),[[`__scopeId`,`data-v-697688bf`]]),$e={class:`sidebar-shell`},et={class:`sidebar-scroll`},tt={class:`sidebar-menu`},nt=[`onClick`],rt={class:`sidebar-item-label`},it={key:0,class:`sidebar-item-badge`},at=J(E({__name:`WorkbenchSidebar`,props:{items:{},activePath:{}},emits:[`navigate`],setup(e,{emit:t}){let n=e,r=t,o=e=>{r(`navigate`,e)},c=e=>n.activePath===e;return(t,n)=>{let r=ie;return s(),g(`div`,$e,[n[3]||=v(`<div class="sidebar-brand" data-v-b6e56332><div class="brand-mark" data-v-b6e56332><span class="i-lucide-brain-circuit" data-v-b6e56332></span></div><div data-v-b6e56332><div class="brand-title" data-v-b6e56332>PrepChain</div><div class="brand-subtitle" data-v-b6e56332>AI 面试训练台</div></div></div>`,1),f(r,{type:`primary`,size:`large`,round:``,class:`sidebar-cta`},{icon:a(()=>[...n[0]||=[S(`span`,{class:`i-lucide-play`},null,-1)]]),default:a(()=>[n[1]||=_(` 开始训练 `,-1)]),_:1}),S(`div`,et,[S(`div`,tt,[(s(!0),g(y,null,i(e.items,e=>(s(),g(`button`,{key:e.key,type:`button`,class:k([`sidebar-item`,{"is-active":c(e.path)}]),onClick:t=>o(e.path)},[S(`span`,{class:k([`sidebar-item-icon`,e.icon])},null,2),S(`span`,rt,D(e.label),1),e.badge?(s(),g(`span`,it,D(e.badge),1)):h(``,!0)],10,nt))),128))]),n[2]||=v(`<div class="sidebar-footer" data-v-b6e56332><div class="sidebar-footer-card" data-v-b6e56332><div class="sidebar-footer-title" data-v-b6e56332>当前训练主题</div><div class="sidebar-footer-value" data-v-b6e56332>前端开发 / 社招一面</div><div class="sidebar-footer-meta" data-v-b6e56332>偏重项目表达 + 框架原理</div></div></div>`,1)])])}}}),[[`__scopeId`,`data-v-b6e56332`]]),ot=[{key:`overview`,label:`总览`,icon:`i-lucide-layout-dashboard`,path:`/workspace/overview`,badge:`3`},{key:`library`,label:`资料库`,icon:`i-lucide-folder-open`,path:`/workspace/library`},{key:`mock`,label:`模拟面试`,icon:`i-lucide-message-circle-more`,path:`/workspace/mock-interview`},{key:`practice`,label:`专项刷题`,icon:`i-lucide-scroll-text`,path:`/workspace/practice`},{key:`report`,label:`复盘报告`,icon:`i-lucide-chart-column-big`,path:`/workspace/report`},{key:`history`,label:`训练历史`,icon:`i-lucide-history`,path:`/workspace/history`}],st={class:`workspace`},ct=J(E({__name:`layout`,setup(e){let t=pe(),n=q(),r=e=>{t.path!==e&&n.push(e)};return(e,n)=>{let i=c(`RouterView`),o=$;return s(),T(o,{loading:!1},{sidebar:a(()=>[f(at,{items:p(ot),"active-path":p(t).path,onNavigate:r},null,8,[`items`,`active-path`])]),default:a(()=>[S(`div`,st,[f(Qe),f(i)])]),_:1})}}}),[[`__scopeId`,`data-v-cda5c930`]]);export{ct as default};