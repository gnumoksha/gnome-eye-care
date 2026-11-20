// SPDX-FileCopyrightText: 2022-2026 Tobias Sette <tobiasette@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later
"use strict";

export const TimerState = class TimerState {
    /**
     * @param {number} breakInterval
     */
    constructor(breakInterval) {
        this._breakInterval = breakInterval;
        this.reset();
    }

    /**
     * Increments the timer in one second.
     *
     * @returns {void}
     */
    incrementOneSecond() {
        if (this._isStopped == false) {
            this.elapsedSeconds += 1;
        }
    }

    /**
     * Whether a minute has passed.
     *
     * @returns {boolean}
     */
    aMinuteHasPassed() {
        return this.elapsedSeconds % 60 == 0;
    }

    /**
     * Stops the timer.
     */
    stop() {
        this._isStopped = true;
    }

    /**
     * Whether the timer is stopped.
     *
     * @returns {boolean}
     */
    isStopped() {
        return this._isStopped;
    }

    /**
     * Resume the timer.
     */
    resume() {
        this._isStopped = false;
    }

    /**
     * Resets the timer.
     *
     * @return {void}
     */
    reset() {
        this._isStopped = false;
        this.elapsedSeconds = 0;
        this.remainingSeconds = null;
        this.breakIntervalCounter = this._breakInterval;
    }
};
