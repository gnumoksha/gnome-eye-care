/*
 * Gnome Eye Care
 * Copyright (C) 2022, 2023, 2024 me@tobias.ws
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

// If we import this, then prefs.js will not work because there the resource
// paths start with resource:///org/gnome/Shell/Extensions/js/
//import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

export const KEY_ENABLED = "enabled"; // unused. Must be added into the schema
export const KEY_SHOW_INDICATOR = "show-indicator";
export const KEY_SHOW_NOTIFICATION = "show-notification";
export const KEY_NOTIFY_BEFORE = "notify-before";
export const KEY_BREAK_TIMEOUT = "break-timeout";

/**
 * Wrap around the extension's user settings and static settings.
 */
export class ExtensionSettings {
    /**
     *
     * @param {Extension} extensionObject
     */
    constructor(extensionObject) {
        /**
         * @type {Extension}
         */
        this._extension = extensionObject;

        /**
         * The "take a break" dialog will be shown after this amount of minutes.
         * @type {number}
         */
        this._breakInterval = 20;

        /**
         * The dialog interval, but in seconds instead of minutes.
         * @type {number}
         */
        this._breakIntervalSeconds = this._breakInterval * 60;
    }

    /**
     * Returns the extension's settings that can be changed anytime on the
     * settings window {@link project://prefs.js}.
     *
     * @returns {object}
     */
    getUserSettings() {
        if (this._extensionSettings == null) {
            this._extensionSettings = this._extension.getSettings(
                "org.gnome.shell.extensions.healthy-eyes"
            );
        }

        return this._extensionSettings;
    }

    /**
     * @return {bool}
     */
    canShowNotification() {
        return this.getUserSettings().get_boolean(KEY_SHOW_NOTIFICATION);
    }

    /**
     * @return {number}
     */
    getNotificationBefore() {
        return this.getUserSettings().get_int(KEY_NOTIFY_BEFORE);
    }

    /**
     * @return {number}
     */
    getBreakInterval() {
        return this._breakInterval;
    }

    /**
     * @return {number}
     */
    getBreakIntervalSeconds() {
        return this._breakIntervalSeconds;
    }

    /**
     * @return {number}
     */
    getBreakTimeout() {
        return this.getUserSettings().get_int(KEY_BREAK_TIMEOUT);
    }
}
