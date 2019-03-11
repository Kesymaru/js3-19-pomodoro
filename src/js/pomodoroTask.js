const PomodoroTask = (function () {
    // private vars
    const PREFIX = 'POMODORO_TASK';
    let id = 0;

    return class PomodoroTask {

        // availabel pomodoro task subscriptions topics
        static Subscritions = Object.freeze({
            ADDED: `${PREFIX}_ADDED`,
            REMOVE: `${PREFIX}_REMOVE`,
            REMOVED: `${PREFIX}_REMOVED`,
            FINISHED: `${PREFIX}_FINISHED`,
        });

        finished = false;
        removed = false;

        _interval = null;
        _element = null;
        _time = 0;
        _timeElement = null;

        /**
         * Validates the name, description (optional) and time
         * @param {String} name
         * @param {String} description optional
         * @param {Number} time
         */
        constructor (name, description, time) {
            if(!name) throw new Error(`Invalid name: ${name}`);
            if(description && typeof description !== 'string')
                throw new Error(`Invalid description type must be String: ${description}`);

            if(!time) throw new Error(`Invalid time: ${time}`);

            time = parseInt(time);
            if(isNaN(time) || !time || typeof time !== 'number')
                throw new Error(`Invalid time type must be Number: ${time}`);

            this.name = name;
            this.description = description;
            this._time = time;
            this._originalTime = time;
            this.id = id++;

            // compose the task dom and start it
            this._element = this.dom();
            this.start();
        }

        get time () {
            return PomodoroTask.FormatTime(this._time);
        }

        get originalTime () {
            return PomodoroTask.FormatTime(this._originalTime);
        }

        get element () {
            if(!this._element) this._element = this.dom();
            return this._element;
        }

        /**
         * Format a seconds time into HH:MM:SS
         * @param {Number} time in seconds
         * @returns {string} time formatted
         */
        static FormatTime (time = 0) {
            if(time === 0) return '00:00:00';
            let secs = Math.round(time);
            let hours = Math.floor(secs / (60 * 60));

            let minutesDivisor = secs % (60 * 60);
            let minutes = Math.floor(minutesDivisor / 60);

            let secondsDivisor = minutesDivisor % 60;
            let seconds = Math.ceil(secondsDivisor);

            hours = hours ? (hours < 10 ? `0${hours}` : hours) : '00';
            minutes = minutes ? (minutes < 10 ? `0${minutes}` : minutes) : '00';
            seconds = seconds < 10 ? `0${seconds}` : seconds;

            return `${hours}:${minutes}:${seconds}`;
        }

        /**
         * Compose the task dom element
         * @returns {HTMLElement}
         */
        dom () {
            let col = document.createElement('div');
            col.classList.add('col', 's12', 'm6', 'l4', 'xl3');
            col.setAttribute('pomodoro-id', this.id);

            let card = document.createElement('div');
            card.classList.add('card', 'cyan', 'accent-4');

            card.appendChild(this.header());
            card.appendChild(this.footer());

            col.appendChild(card);
            return col;
        }

        /**
         * Compose the task header
         * @returns {HTMLElement}
         */
        header () {
            let content = document.createElement('div');
            content.classList.add('card-content', 'white-text');

            let title = document.createElement('span');
            title.classList.add('card-title');
            title.innerText = this.name;
            content.appendChild(title)

            if(this.description) {
                let description = document.createElement('p');
                description.innerText = this.description;
                content.appendChild(description);
            }

            let timer = document.createElement('h4');
            timer.classList.add('center');
            timer.innerText = this.time;
            this._timeElement = timer;
            content.appendChild(timer);

            return content;
        }

        /**
         * Compose the task footer
         * @returns {HTMLElement}
         */
        footer () {
            let actions = document.createElement('div');
            actions.classList.add('card-action');

            actions.appendChild(Dialog.Button({
                // text: 'Stop',
                css: 'cyan',
                icon: 'stop',
                iconCss: 'center',
                click: this.stop.bind(this)
            }));
            actions.appendChild(Dialog.Button({
                css: ['red', 'right'],
                icon: 'close',
                click: this.remove.bind(this)
            }));

            return actions;
        }

        /**
         * Start the countdown
         * @returns {boolean}
         */
        start () {
            if(this._interval) return false;

            this._interval = setInterval(() => {
                this._time = --this._time;

                // task finished
                if(this._time <= 0 ) this.finish();

                // update the timer
                this._timeElement.innerText = this.time;
            }, 1000);
        }

        /**
         * Stop the task and clear the interval
         */
        stop () {
            clearInterval(this._interval);
        }

        clear () {
            this._time = 0;
        }

        /**
         * Finish the task
         */
        finish () {
            this.stop();
            this.finished = true;
            Mediator.Publish(PomodoroTask.Subscritions.FINISHED, this);
        }

        /**
         * Remove the task
         */
        remove () {
            this.removed = true;
            Mediator.Publish(PomodoroTask.Subscritions.REMOVE, this)
        }
    }
})();