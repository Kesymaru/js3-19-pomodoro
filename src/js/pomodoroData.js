/**
 * Singleton to shared the pomodoro data
 */
const PomodoroData = (function () {
    // private variables
    const PREFIX = 'POMODORO_DATA';
    const DATA = [];
    
    let instance = null;

    return class PomodoroData {

        constructor () {
            return instance ? instance : this;
        }

        /**
         * Gets the private data
         * @returns {Array} data
         */
        get data () {
            return DATA;
        }

        /**
         * Add a new PomodoroTask
         * @param {} {PomodoroTask} task
         */
        add (task) {
            if(!task || !(task instanceof PomodoroTask))
                throw new Error(`Invalid task: ${task}`);

            DATA.push(task);

            // publish the task added
            Mediator.Publish(PomodoroTask.Subscritions.ADDED, task);
        }

        /**
         * Remove a PomodoroTask
         * @param {PomodoroTask} task
         */
        remove (task) {
            if(!task || !(task instanceof PomodoroTask))
                throw new Error(`Invalid task: ${task}`);

            let index = DATA.findIndex(t => t === task);
            if(index > -1 ) DATA.splice(index, 1);

            Mediator.Publish(PomodoroTask.Subscritions.REMOVED, task);
        }
    }
})();