/*
 * Gnome Eye Care
 * Copyright (C) 2022, 2023 me@tobias.ws
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
"use strict";

var TimerState = class TimerState {
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
}
