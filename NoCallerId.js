// ==UserScript==
// @name         📞NoCallerIdBot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds an overlay with settings and call counter to `voice.google.com` that allows for No Caller Id Spam!
// @author       g44t
// @match        *://voice.google.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Create the HTML structure for the overlay, menu, and call counter
    const overlayHTML = `
    <div id="mainGUI" class="main-gui">
        <div class="menu">
            <h2>Settings Menu</h2>
            <div class="form-group">
                <label for="numberInput">Enter Number</label>
                <input type="text" id="numberInput" placeholder="Enter number">
            </div>
            <div class="form-group">
                <label for="loopInput">Enter Number of Loops</label>
                <input type="text" id="loopInput" placeholder="Enter number of loops">
            </div>
            <div class="form-group">
                <label for="numberDelaySlider">Delay for Number Input (ms)</label>
                <input type="range" id="numberDelaySlider" min="1" max="1000" value="1" step="1">
                <span id="numberDelayValue">1 ms</span>
            </div>
            <div class="form-group">
                <label for="waitTimeSlider">Wait Time between Actions (s)</label>
                <input type="range" id="waitTimeSlider" min="1" max="10" value="2.45" step="0.05">
                <span id="waitTimeValue">2.45 s</span>
            </div>
            <div class="button-group">
                <button id="startButton">Start</button>
                <button id="clearButton">Clear</button>
            </div>
        </div>
    </div>
    <button id="settingsButton">Settings</button>
    <div id="callCounter" class="call-counter">Calls: 0</div>
    `;

    // Inject the HTML structure into the body
    document.body.insertAdjacentHTML('beforeend', overlayHTML);

    // Add CSS styles
    const style = document.createElement('style');
    style.innerHTML = `
    /* General Styling */
    body, html {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background: #000;
        overflow: hidden;
    }

    .main-gui {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(30, 30, 30, 0.9);
        color: white;
        padding: 30px;
        border-radius: 10px;
        width: 400px; /* Increased width */
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.5s;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: stretch; /* Adjust alignment */
        opacity: 0;
        visibility: hidden; /* Initially hidden */
    }

    /* Animation */
    @keyframes slideIn {
        from {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
            visibility: visible;
        }
        to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }

    .menu h2 {
        margin-top: 0;
        color: #228b22; /* Forest Green */
        text-align: center;
        margin-bottom: 20px; /* Space between title and form groups */
    }

    .form-group {
        margin-bottom: 20px; /* Increased spacing between form groups */
    }

    .form-group label {
        display: block;
        margin-bottom: 10px; /* Increased margin below labels */
    }

    .form-group input {
        width: calc(100% - 20px); /* Full width with padding adjustment */
        padding: 12px; /* Increased padding */
        border: 1px solid #333;
        border-radius: 6px; /* Larger border radius */
        background: #2c2c2c;
        color: #e0e0e0;
        transition: background-color 0.3s;
    }

    .button-group {
        display: flex;
        gap: 10px; /* Space between buttons */
    }

    .button-group button {
        background-color: #228b22; /* Forest Green */
        color: white;
        border: none;
        cursor: pointer;
        padding: 12px 20px; /* Increased padding */
        border-radius: 6px; /* Larger border radius */
        transition: transform 0.3s;
    }

    .button-group button:hover {
        transform: scale(1.1);
    }

    /* Settings Button Styling */
    #settingsButton {
        position: fixed;
        top: 20px; /* Increased distance from the top */
        right: 20px; /* Increased distance from the right */
        padding: 12px 20px;
        background: #228b22; /* Forest Green */
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        z-index: 1001;
        transition: transform 0.3s;
    }

    #settingsButton:hover {
        transform: scale(1.1);
    }

    /* Call Counter Styling */
    #callCounter {
        position: fixed;
        top: 20px; /* Increased distance from the top */
        left: 20px; /* Increased distance from the left */
        background: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 10px 20px; /* Increased padding */
        border-radius: 6px; /* Larger border radius */
        z-index: 1001;
    }

    /* Hidden class for toggling visibility */
    .hidden {
        display: none;
    }
    `;
    document.head.appendChild(style);

    // JavaScript for overlay functionality
    const mainGUI = document.getElementById('mainGUI');
    const settingsButton = document.getElementById('settingsButton');
    const startButton = document.getElementById('startButton');
    const clearButton = document.getElementById('clearButton');
    const numberInput = document.getElementById('numberInput');
    const loopInput = document.getElementById('loopInput');
    const numberDelaySlider = document.getElementById('numberDelaySlider');
    const numberDelayValue = document.getElementById('numberDelayValue');
    const waitTimeSlider = document.getElementById('waitTimeSlider');
    const waitTimeValue = document.getElementById('waitTimeValue');
    const callCounter = document.getElementById('callCounter');

    let callCount = 0;

    settingsButton.addEventListener('click', () => {
        if (mainGUI.classList.contains('hidden')) {
            mainGUI.classList.remove('hidden');
            mainGUI.style.opacity = '1';
            mainGUI.style.visibility = 'visible';
            mainGUI.style.animation = 'slideIn 0.5s forwards';
        } else {
            mainGUI.style.opacity = '0';
            mainGUI.style.visibility = 'hidden';
            mainGUI.classList.add('hidden');
        }
    });

    startButton.addEventListener('click', () => {
        const number = numberInput.value.trim();
        const loops = parseInt(loopInput.value.trim(), 10);
        const numberDelay = parseInt(numberDelaySlider.value, 10);
        const waitTime = parseFloat(waitTimeSlider.value);

        if (number && loops > 0) {
            console.log(`Starting execution with number: ${number}, loops: ${loops}, numberDelay: ${numberDelay}ms, waitTime: ${waitTime}s`);
            executeLoop(number, loops, numberDelay, waitTime)
                .catch(error => console.error(error));
        } else {
            console.error('No number entered or invalid number of loops.');
        }
    });

    clearButton.addEventListener('click', () => {
        numberInput.value = '';
        loopInput.value = '';
        callCount = 0;
        updateCallCounter();
    });

    numberDelaySlider.addEventListener('input', () => {
        numberDelayValue.textContent = `${numberDelaySlider.value} ms`;
    });

    waitTimeSlider.addEventListener('input', () => {
        waitTimeValue.textContent = `${waitTimeSlider.value} s`;
    });

    function updateCallCounter() {
        callCounter.textContent = `Calls: ${callCount}`;
    }

    // Function to execute the loop
    function executeLoop(number, loops, numberDelay, waitTime) {
        let promise = Promise.resolve();
        for (let i = 0; i < loops; i++) {
            promise = promise
                .then(() => {
                    if (i > 0) { // Add delay only after the first call
                        return waitForDelay(0.8, 1);
                    }
                })
                .then(() => clickSequence('*67' + number, numberDelay))
                .then(() => clickButton('button[gv-test-id="new-call-button"]', 0))
                .then(() => waitForDelay(waitTime, waitTime))
                .then(() => clickButton('button[gv-test-id="in-call-end-call"]', 0))
                .then(() => {
                    callCount++;
                    updateCallCounter();
                });
        }
        return promise;
    }

    // Function to click a button
    function clickButton(selector, delay) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                var button = document.querySelector(selector);
                if (button) {
                    console.log(`Clicking button with selector: ${selector}`);
                    button.click();
                    resolve();
                } else {
                    console.error(`Button with selector ${selector} not found.`);
                    reject(`Button with selector ${selector} not found.`);
                }
            }, delay);
        });
    }

    // Function to click a sequence of buttons
    function clickSequence(sequence, delay) {
        let promise = Promise.resolve();
        const buttonSelectors = {
            '*': 'button[aria-label="*"]',
            '1': 'button[aria-label="\'1\'"]',
            '2': 'button[aria-label="\'2\' \'a\' \'b\' \'c\'"]',
            '3': 'button[aria-label="\'3\' \'d\' \'e\' \'f\'"]',
            '4': 'button[aria-label="\'4\' \'g\' \'h\' \'i\'"]',
            '5': 'button[aria-label="\'5\' \'j\' \'k\' \'l\'"]',
            '6': 'button[aria-label="\'6\' \'m\' \'n\' \'o\'"]',
            '7': 'button[aria-label="\'7\' \'p\' \'q\' \'r\' \'s\'"]',
            '8': 'button[aria-label="\'8\' \'t\' \'u\' \'v\'"]',
            '9': 'button[aria-label="\'9\' \'w\' \'x\' \'y\' \'z\'"]',
            '0': 'button[aria-label="\'0\'"]',
        };

        sequence.split('').forEach((digit, index) => {
            const selector = buttonSelectors[digit];
            if (selector) {
                promise = promise.then(() => {
                    console.log(`Typing digit: ${digit} with delay: ${delay * (index + 1)}ms`);
                    return clickButton(selector, delay * (index + 1));
                });
            }
        });

        return promise;
    }

    // Function to wait for a random delay between specified range (in seconds)
    function waitForDelay(minSeconds, maxSeconds) {
        const delay = Math.random() * (maxSeconds - minSeconds) + minSeconds;
        console.log(`Waiting for ${delay} seconds`);
        return new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    // Function to wait for a random delay between specified range for waitTime
    function waitForRandomDelay(baseDelay) {
        const delay = Math.random() * (3.7 - 2.45) + 2.45; // Random delay between 2.45-3.7 seconds
        console.log(`Waiting for ${delay} seconds`);
        return new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
})();
