/*
 * Healthy eyes
 * Copyright (C) 2022  me@tobias.ws
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

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Notifier = Me.imports.notifier;
const Dialog = Me.imports.dialog;

class Extension {
    constructor() {
        /**
         * Holds the instance of the panel indicator.
         * @type {object}
         */
        this._indicator = null;

        /**
         * The event id for the main loop of this extension.
         * @type {number}
         */
        this._mainEventId = 0;

        /**
         * @type {object}
         */
        this._notifier = null;
    }

    /**
     * Special method invoked when the extension has been enabled.
     */
    enable() {
        log(`Enabling the extension ${Me.metadata.name}`);

        this._settings = new Settings();

        this._createMenuIndicator();

        this._timerState = new TimerState(this._settings.getBreakInterval());
        this._setupTimer();

        this.text.set_text(`${this._settings.getBreakInterval()} m`);

        this._notifier = new Notifier.Notifier();
        this._notifier.setup();

        log(`The extension ${Me.metadata.name} was enabled`);
    }

    /**
     * Special method invoked when the extension has been disabled.
     *
     * REMINDER: It's required for extensions to clean up after themselves when
     * they are disabled. This is required for approval during review!
     */
    disable() {
        log(`disabling ${Me.metadata.name}`);

        this._indicator.destroy();
        this._indicator = null;

        if (this._mainEventId > 0) {
            GLib.Source.remove(this._mainEventId);
        }

        log(`${Me.metadata.name} was disabled`);
    }

    /**
     * Creates an indicator to show the remaining time and the extensions' action menus.
     * on-screen display (OSD)
     */
    _createMenuIndicator() {
        let indicatorName = `${Me.metadata.name} Indicator`;

        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, indicatorName, false);

        // add text label for the countdown
        this.text = new St.Label({
            text: "loading...",
        });
        this._indicator.add_actor(this.text);

        // Bind our indicator visibility to the GSettings value
        //
        // NOTE: Binding properties only works with GProperties (properties
        // registered on a GObject class), not native JavaScript properties
        this._settings
            .getUserSettings()
            .bind("show-indicator", this._indicator, "visible", Gio.SettingsBindFlags.DEFAULT);

        let item = new PopupMenu.PopupMenuItem("Reset timer");
        this._indicator.menu.addMenuItem(item);
        item.actor.connect("button_press_event", this._onResetButtonPress.bind(this));

        // `Main.panel` is the actual panel you see at the top of the screen,
        // not a class constructor.
        Main.panel.addToStatusArea(indicatorName, this._indicator);
    }

    /**
     * Executed when the user press the "Reset timer" button.
     */
    _onResetButtonPress(actor, event) {
        this._timerState.reset();
        this.text.set_text(`${this._settings.getBreakInterval()} m`);
        this._indicator.menu.close();
    }

    /**
     * Set up the main loop.
     */
    _setupTimer() {
        this._mainEventId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._timerState.elapsedSeconds += 1;

            if (this._timerState.elapsedSeconds % 60 == 0) {
                // a minute has passed
                this._timerState.breakIntervalCounter--;
                if (this._timerState.breakIntervalCounter <= 0) {
                    this._timerState.breakIntervalCounter = this._settings.getBreakInterval();
                }
                this.text.set_text(`${this._timerState.breakIntervalCounter} m`);

                // return GLib.SOURCE_CONTINUE;
            }

            this._timerState.remainingSeconds =
                this._settings.getBreakIntervalSeconds() - this._timerState.elapsedSeconds;

            if (
                this._settings.canShowNotification() &&
                this._timerState.remainingSeconds == this._settings.getNotificationBefore()
            ) {
                this._notifier.notify(
                    _("Time is approaching"),
                    _("The time to take a break is approaching")
                );
                return GLib.SOURCE_CONTINUE;
            }

            if (this._timerState.remainingSeconds <= 0) {
                this._showNotificationDialog();
                this._timerState.reset();
            }

            return GLib.SOURCE_CONTINUE;
        });
    }

    _showNotificationDialog() {
        /**
        dialogLayout,
        contentLayout,
        buttonLayout,
        */
        let dialog = new Dialog.TakeBreakDialog(this._settings.getBreakTimeout());
        dialog.connect("closed", this._onDialogClosed.bind(this));
        dialog.open();
    }

    _onDialogClosed() {
        // the dialog will run for >= 20 seconds so, we need to restart the
        // timer in order to not count the time the dialog is open
        this._timerState.reset();
    }
}

class TimerState {
    /**
     * @param {number} breakInterval
     */
    constructor(breakInterval) {
        this._breakInterval = breakInterval;
        this.reset();
    }

    /**
     * @return {void}
     */
    reset() {
        this.elapsedSeconds = 0;
        this.remainingSeconds = null;
        this.breakIntervalCounter = this._breakInterval;
    }
}

/**
 * Wrap around the extension's user settings and static settings.
 */
class Settings {
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

function init() {
    return new Extension();
}
