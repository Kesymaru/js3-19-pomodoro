/**
 * Module for the Pomodoro class
 * This class manages the pomodoros
 */
const Pomodoro = (function () {
    // private vars
    const DATA = new PomodoroData();

    // Pomodoro class
    return class Pomodoro {

        formOpen = true;

        /**
         * Init the Pomodoro
         * @param {String|HTMLElement} container
         */
        constructor (container, addBtn) {
            // valid the container
            if(typeof container === 'string'){
                let element = document.querySelector(container);
                if(!element) throw new Error(`Container not found: ${container}`);
                container = element;
            }
            if(!(container instanceof HTMLElement))
                throw new Error(`Invalid container: ${container}`);

            // valid the addBtn
            if(typeof addBtn === 'string'){
                let element = document.querySelector(addBtn);
                if(!element) throw new Error(`Add button not found: ${addBtn}`);
                addBtn = element;
            }
            if(!(addBtn instanceof HTMLElement))
                throw new Error(`Invalid add button: ${addBtn}`);

            this.container = container;
            this.form = this.container.querySelector('form');
            this.addBtn = addBtn;
            this.addBtnIcon = this.addBtn.querySelector('i');

            this.list = this.dom();
            this.container.appendChild(this.list);

            // events
            this.form.addEventListener('submit', this.formSubmit.bind(this));
            this.form.time.addEventListener('focus', this.timePicker.bind(this));
            this.addBtn.addEventListener('click', this.formToggle.bind(this));

            window.addEventListener('resize', this.resize.bind(this));

            // register the pomodoro data subscriptions
            this._registerSubscritions();

            this.resize();
        }

        /**
         * Compose pomodoro list container
         * @returns {HTMLElement}
         */
        dom () {
            let div  = document.createElement('div');
            div.classList.add('row');

            return div;
        }

        /**
         * Register all the subscriptions for the PomodoroTask
         * @private
         */
        _registerSubscritions () {
            for(let sub in PomodoroTask.Subscritions){
                switch (sub) {
                    case 'ADDED':
                        Mediator.Subscribe(PomodoroTask.Subscritions.ADDED, this.added.bind(this));
                        break;
                    case 'FINISHED':
                        Mediator.Subscribe(PomodoroTask.Subscritions.FINISHED, this.finished.bind(this));
                        break;
                    case 'REMOVE':
                        Mediator.Subscribe(PomodoroTask.Subscritions.REMOVE, this.remove.bind(this));
                        break;
                    case 'REMOVED':
                        Mediator.Subscribe(PomodoroTask.Subscritions.REMOVED, this.onRemoved.bind(this));
                        break;
                    default:
                        break;
                }
            }
        }

        /**
         * Method called when the window is resized
         */
        resize () {
            let witdh = window.innerWidth;
            if(witdh <= 600) this.container.classList.remove('container');
            else this.container.classList.add('container');

            if(!this.formOpen){
                this.form.classList.add('done');
                this.form.style.marginTop = `-${this.form.offsetHeight}px`;

                setTimeout(() => {
                    this.form.classList.remove('done');
                }, 1000);
            }
        }

        /**
         * Method to submit the form
         * @param {Event} event
         */
        formSubmit (event) {
            event.preventDefault();

            let name = this.form.name.value;
            let description = this.form.description.value;
            let time = this.form.time.value;

            try {
                let task = new PomodoroTask(name, description, time);
                DATA.add(task);
                this.formToggle();
            } catch (err) {
                this.formError(err);
            }

            // reset
            this.formReset()
        }

        /**
         * Reset the form values
         */
        formReset () {
            this.form.name.value = '';
            this.form.description.value = '';
            this.form.time.value = '';
        }

        /**
         * Toogle the form show/hide
         * Add the class to start the CSS3 animation
         */
        formToggle () {
            this.formOpen = !this.formOpen;

            this.addBtnIcon.innerText = this.formOpen ? 'close' : 'add';

            // this.form.classList.toggle('open');
            if(!this.formOpen) this.form.style.marginTop = `-${this.form.offsetHeight}px`;
            else this.form.style.marginTop = '0px';

            if(this.formOpen) this.form.name.focus();
        }

        /**
         * Logs the form errors
         * @param error
         */
        formError (error) {
            console.error(error);
        }

        /**
         * Display a dialog sowing the time picker
         * Set the time into theform time input value
         */
        timePicker (event) {
            event.preventDefault();

            let form = this.timePickerForm();
            form.name = 'timePicker';

            // on submit/enter
            form.addEventListener('submit', savePicker.bind(this));
            form.addEventListener('keydown', event => event.keyCode === 13 ? savePicker.bind(this)() : '');

            let dialog = new Dialog({
                title: 'Pick Time',
                content: form,
                open: true,
                onOpen: () => form.hours.focus(),
                onSave: savePicker.bind(this)
            });

            // method for the save and submit
            function savePicker (event = null) {
                if(event) event.preventDefault();

                let hours = parseInt(form.hours.value || 0);
                let minutes = parseInt(form.minutes.value || 0);
                let seconds = parseInt(form.seconds.value || 0);

                let time = (hours * 3600) + (minutes * 60) + seconds;
                if(time) {
                    this.form.time.value = time;
                    dialog.close();

                    // focus the save button
                    this.form.save.focus();
                }
            }

            dialog.promise
                .catch(err => console.error(err));
        }

        /**
         * Compose the time picker form dom
         * @returns {HTMLElement}
         */
        timePickerForm () {
            let time = PomodoroTask.FormatTime(this.form.time.value).split(':');
            time = time.map(t => parseInt(t));

            let form = document.createElement('form');
            form.classList.add('row');

            let col = document.createElement('div');
            col.classList.add('col', 's12');
            col.innerText = 'Choose the time for the task';
            form.appendChild(col);

            form.appendChild(this.timePickerInput('hours', 'Hours', time[0], 0, 24));
            form.appendChild(this.timePickerInput('minutes', 'Minutes', time[1], 0, 59));
            form.appendChild(this.timePickerInput('seconds', 'Seconds', time[2], 0, 59));

            return form;
        }

        /**
         * Compose a time picker input witht he buttons to increse and decrese the values
         * @param {String} name
         * @param {String} placeholder
         * @param {Number} value
         * @param {Number} min
         * @param {Number} max
         * @returns {HTMLElement}
         */
        timePickerInput(name, placeholder, value, min, max) {
            let col = document.createElement('div');
            col.classList.add('col', 's4');

            let input = document.createElement('input');
            input.classList.add('center');
            input.type = 'number';
            input.name = name;
            input.value = value ? value : '';
            input.placeholder = placeholder || name;
            input.min = min;
            input.max = max;
            input.required = true;

            let btnUp = Dialog.Button({
                css: ['btn-flat', 'center'],
                style: 'width: 100%;',
                icon: 'keyboard_arrow_up',
                click: () => {
                    let value = parseInt(input.value === '' ? 0 : input.value) + 1;
                    if(value >= min && value <= max)
                        input.value = value;
                }
            });
            btnUp.setAttribute('tabindex', -1);
            let btnDown = Dialog.Button({
                css: ['btn-flat', 'center'],
                style: 'width: 100%;',
                icon: 'keyboard_arrow_down',
                click: () => {
                    let value = parseInt(input.value === '' ? 0 : input.value) - 1;
                    if(value >= min && value <= max)
                        input.value = value;
                }
            });
            btnDown.setAttribute('tabindex', -1);

            col.appendChild(btnUp);
            col.appendChild(input);
            col.appendChild(btnDown);
            return col;
        }

        /**
         * When a task has been added
         * @param {PomodoroTask} task
         */
        added (task) {
            if(!task || !(task instanceof PomodoroTask))
                throw new Error(`Invalid task: ${task}`);

            // render the new task inside the container
            this.list.appendChild(task.element);
        }

        /**
         * When a task has been finished
         * @param task
         */
        finished (task) {
            if(!task || !(task instanceof PomodoroTask))
                throw new Error(`Invalid task: ${task}`);

            let dialog = new Dialog({
                title: 'Task Finished',
                content: `Task ${task.name} has finished!`,
                open: true,
                dismissible: false,
                successText: 'OK',
            });
        }

        /**
         * Remove a task
         * @param {PomodoroTask} task
         */
        remove (task) {
            if(!task || !(task instanceof PomodoroTask))
                throw new Error(`Invalid task: ${task}`);

            let content = document.createElement('div');
            let message = document.createElement('p');
            message.innerText = `Are you sure you want to reamove the task: ${task.name}.
            This action will remove permantly the task.`;

            content.appendChild(message);

            let dialog = new Dialog({
                title: 'Remove Task',
                content,
                open: true,
                successText: 'Remove',
            });
            dialog.promise
                .then(r => this.destroy(task))
                .catch(err => console.error(err));
        }

        /**
         * Remove a task from the container DOM
         * @param {PomodoroTask} task
         */
        destroy (task) {
            if(!task || !(task instanceof PomodoroTask))
                throw new Error(`Invalid task: ${task}`);

            task.stop();
            DATA.remove(task);

            this.list.removeChild(task.element);
        }

        /**
         * Display the form when there are no more task
         * @param task
         */
        onRemoved (task) {
            if(!DATA.data.length) this.formToggle();
        }
    };
})();