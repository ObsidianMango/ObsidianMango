import { trapDialogFocus } from './accessibility.js';

export class ModalManager {
  constructor(root) { this.root=root; this.current=null; this.returnFocus=null; this.untrap=null; }
  open({title,content,actions=[],dismissible=true,className='',returnFocus=null}) {
    this.close(false);
    const active=document.activeElement;
    this.returnFocus=returnFocus || (active instanceof HTMLElement && active!==document.body ? active : null);
    const backdrop=document.createElement('div'); backdrop.className='modal-backdrop';
    const dialog=document.createElement('section'); dialog.className=`modal-card ${className}`; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true');
    const headingId=`dialog-${Date.now()}`; dialog.setAttribute('aria-labelledby',headingId);
    dialog.innerHTML=`<header class="modal-header"><h2 id="${headingId}">${title}</h2>${dismissible?'<button class="icon-button modal-close" aria-label="Close dialog"><img src="assets/ui/close.svg" alt=""></button>':''}</header><div class="modal-content"></div><footer class="modal-actions"></footer>`;
    const contentRoot=dialog.querySelector('.modal-content');
    if (typeof content==='string') contentRoot.innerHTML=content; else if (content) contentRoot.append(content);
    const footer=dialog.querySelector('.modal-actions');
    for (const action of actions) {
      const button=document.createElement('button'); button.type='button'; button.className=action.className??'button'; button.textContent=action.label; button.disabled=Boolean(action.disabled);
      button.addEventListener('click',action.onClick); footer.append(button);
    }
    backdrop.append(dialog); this.root.append(backdrop); this.current={backdrop,dialog,dismissible};
    dialog.querySelector('.modal-close')?.addEventListener('click',()=>this.close());
    backdrop.addEventListener('pointerdown',event=>{if(dismissible&&event.target===backdrop)this.close();});
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape'&&dismissible){event.preventDefault();this.close();}});
    this.untrap=trapDialogFocus(dialog);
    requestAnimationFrame(()=>dialog.querySelector('button:not([disabled]),input:not([disabled]),[tabindex="0"]')?.focus());
    return dialog;
  }
  close(restore=true) {
    if(!this.current)return;
    this.untrap?.(); this.current.backdrop.remove(); this.current=null;
    const target=this.returnFocus; this.returnFocus=null;
    if(restore&&target?.isConnected)target.focus({preventScroll:true});
  }
}
