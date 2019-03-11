(function(){
    // variables
    let pomodoro = null;

    // methods
    function main () {
        // init the pomodoro
        pomodoro = new Pomodoro('#container', '#pomodoro-form', 'nav', '#addBtn');
    }

    // waits for the dom to load
    document.addEventListener('DOMContentLoaded', main);
})();