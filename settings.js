// SPDX-FileCopyrightText: 2022-2026 Tobias Sette <tobiasette@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

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
                "org.gnome.shell.extensions.healthy-eyes",
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
