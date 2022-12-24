const ExtensionUtils = imports.misc.extensionUtils;

var KEY_SHOW_INDICATOR = 'show-indicator';
var KEY_SHOW_NOTIFICATION = 'show-notification';
var KEY_NOTIFY_BEFORE = 'notify-before';
var KEY_BREAK_TIMEOUT = 'break-timeout';

/**
 * Wrap around the extension's user settings and static settings.
 */
var ExtensionSettings = class ExtensionSettings {
    constructor() {
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
            this._extensionSettings = ExtensionUtils.getSettings(
                "org.gnome.shell.extensions.healthy-eyes"
            );
        }

        return this._extensionSettings;
    }

    /**
     * @return {bool}
     */
    canShowNotification() {
        return this.getUserSettings().get_boolean("show-notification");
    }

    /**
     * @return {number}
     */
    getNotificationBefore() {
        return this.getUserSettings().get_int("notify-before");
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
        return this.getUserSettings().get_int("break-timeout");
    }
}
