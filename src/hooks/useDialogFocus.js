import { useEffect, useRef } from 'react';
export const useDialogFocus = (onClose, blocked = false, open = true) => {
  const ref=useRef(null),callback=useRef(onClose);
  useEffect(()=>{callback.current=onClose;});
  useEffect(()=>{
    if(!open)return;
    const prior=document.activeElement;
    const node=ref.current;
    const controls=()=>[...node.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(item=>!item.disabled && item.getClientRects().length);
    controls()[0]?.focus();
    const key=event=>{if(event.key==='Escape'&&!blocked)callback.current();if(event.key==='Tab'){const all=controls();if(event.shiftKey&&document.activeElement===all[0]){event.preventDefault();all.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===all.at(-1)){event.preventDefault();all[0]?.focus();}}};
    node.addEventListener('keydown',key);return()=>{node.removeEventListener('keydown',key);prior?.focus();};
  },[open,blocked]);
  return ref;
};
