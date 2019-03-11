const Dialog = (function () {
    return class Dialog {
        _reject = null;
        _resolve = null;

        constructor ({
                         title,
                         content = '',
                         open = false,
                         container = document.body,
                         dismissible = true,
                         cancelText = 'Cancel',
                         successText = 'Save',
                         onOpen = null,
                         onSave = null,
        } = {}) {
            // validate the container
            if(!(container instanceof HTMLElement)) {
                let element = document.querySelector(container);
                if(!element) throw new Error(`Could not find the container: ${container}`);
                container = element;
            }

            this.title = title;
            this._content = content;
            this.container = container;
            this.dismissible = dismissible;
            this.cancelText = cancelText;
            this.successText = successText;
            this.onOpen = onOpen;
            this.onSave = onSave;

            // dom elements
            this.element = this.dom();
            this.overlay = this.overlayDom();

            this.container.appendChild(this.element);
            this.container.appendChild(this.overlay);

            // auto open the dialog
            if(open) this.open();

            this.promise = new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            });
        }

        static Button ({text = '', type = 'button', css, icon, iconCss, click, style = ''} = {}) {
            let btn = document.createElement('button');
            btn.classList.add('btn', 'waves-effect', 'waves-light');
            btn.setAttribute('type', type);

            if(css && Array.isArray(css))
                btn.classList.add(...css);
            else if(css) btn.classList.add(css);

            if(icon) {
                let iconElement = document.createElement('i');
                iconElement.classList.add('material-icons');

                if(iconCss && Array.isArray(iconCss)) iconElement.classList.add(...iconCss);
                else if(iconCss) iconElement.classList.add(iconCss);
                else if(text) iconElement.classList.add('right');

                iconElement.innerText = icon;
                btn.appendChild(iconElement)
            }

            if(text) btn.innerText = text;

            if(typeof click === 'function')
                btn.addEventListener('click', click);

            if(style) btn.style = style;

            return btn;
        }

        dom () {
            let dialog = document.createElement('div');
            dialog.classList.add('modal');

            dialog.appendChild(this.content());
            dialog.appendChild(this.footer());


            return dialog;
        }

        overlayDom () {
            let div  = document.createElement('div');
            div.classList.add('modal-overlay');

            if(this.dismissible) div.addEventListener('click', this.cancel.bind(this));
            return div;
        }

        content () {
            let content = document.createElement('div');
            content.classList.add('modal-content');

            let title = document.createElement('h4');
            title.innerText = this.title;
            content.appendChild(title);

            if(this._content instanceof HTMLElement)
                content.appendChild(this._content);
            else {
                let text = document.createElement('p');
                text.innerText = this._content;
                content.appendChild(text);
            }

            return content;
        }

        footer () {
            let footer = document.createElement('footer');
            footer.classList.add('modal-footer');

            if(this.dismissible)
                footer.appendChild(Dialog.Button({
                    text: this.cancelText,
                    css: ['red', 'left'],
                    icon: 'close',
                    click: this.cancel.bind(this)
                }));

            footer.appendChild(Dialog.Button({
                text: this.successText,
                css: 'cyan',
                icon: 'send',
                click: this.save.bind(this)
            }));

            return footer;
        }

        open () {
            this.overlay.setAttribute('style', 'z-index: 1002; display: block; opacity: 0.5;');

            this.element.classList.add('open');
            this.element.setAttribute('style', 'z-index: 1003; display: block; opacity: 1; top: 10%; transform: scaleX(1) scaleY(1);');

            if(typeof this.onOpen === 'function') this.onOpen();
        }

        close () {
            this.overlay.setAttribute('style', '');

            this.element.classList.remove('open');
            this.element.setAttribute('style', '');
        }

        cancel () {
            this.close();
            this._reject(new Error('User closed dialog.'));
        }

        save () {
            if(typeof this.onSave === 'function') this.onSave();

            this.close();
            this._resolve(true);
        }
    }
})();