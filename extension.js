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

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Notifier = Me.imports.notifier;
const Dialog = Me.imports.dialog;
const Settings = Me.imports.settings;
const MyQuickSettings = Me.imports.quickSettings;

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

        this._settings = new Settings.ExtensionSettings();

        this._createMenuIndicator();

        this._timerState = new TimerState(this._settings.getBreakInterval());
        this._setupTimer();

        this.text.set_text(`${this._settings.getBreakInterval()} m`);

        this._notifier = new Notifier.Notifier();
        this._notifier.setup();

        this._myQuickSettings = new MyQuickSettings.MyQuickSettings(this._settings);

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

        this._myQuickSettings.destroy();

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
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'indicator-text'
        });
        this._indicator.add_actor(this.text);

        // Bind our indicator visibility to the GSettings value
        //
        // NOTE: Binding properties only works with GProperties (properties
        // registered on a GObject class), not native JavaScript properties
        this._settings
            .getUserSettings()
            .bind(Settings.KEY_SHOW_INDICATOR, this._indicator, "visible", Gio.SettingsBindFlags.DEFAULT);

        let pauseMenuItem = new PopupMenu.PopupMenuItem("Stop / Resume");
        this._indicator.menu.addMenuItem(pauseMenuItem);
        pauseMenuItem.actor.connect("button_press_event", this._onStopButtonPress.bind(this));

        let resetMenuItem = new PopupMenu.PopupMenuItem("Reset");
        this._indicator.menu.addMenuItem(resetMenuItem);
        resetMenuItem.actor.connect("button_press_event", this._onResetButtonPress.bind(this));

        let runNowMenuItem = new PopupMenu.PopupMenuItem("Run now");
        this._indicator.menu.addMenuItem(runNowMenuItem);
        runNowMenuItem.actor.connect("button_press_event", this._onRunNowButtonPress.bind(this));

        // `Main.panel` is the actual panel you see at the top of the screen,
        // not a class constructor.
        Main.panel.addToStatusArea(indicatorName, this._indicator);
    }

    /**
     * Executed when the user press the "Stop" button.
     *
     * @param {PopupMenu.PopupMenuItem} actor
     * @param {Gi.Clutter.Event} event
     */
    _onStopButtonPress(actor, event) {
        if (this._timerState.isStopped()) {
            this._timerState.resume();
            this.text.set_text(`${this._timerState.breakIntervalCounter} m`);
            actor.label = "Stop"; // #FIXME don't work log(Object.getOwnPropertyNames(actor));
        } else {
            this._timerState.stop();
            this.text.set_text(`${this._timerState.breakIntervalCounter} m ⏹️`);
            actor.label = "Resume"; // #FIXME don't work
        }
        this._indicator.menu.close();
    }

    /**
     * Executed when the user press the "Reset" button.
     */
    _onResetButtonPress(actor, event) {
        this._reset();
        this._indicator.menu.close();
    }

    /**
     * Executed when the user press the "Run now" button.
     */
    _onRunNowButtonPress(actor, event) {
        this._showNotificationDialog();
        this._reset();
        this._indicator.menu.close();
    }

    /**
     * Reset the timer state and the timer label.
     */
    _reset() {
        this._timerState.reset();
        this.text.set_text(`${this._settings.getBreakInterval()} m`);
    }

    /**
     * Set up the main loop.
     */
    _setupTimer() {
        this._mainEventId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            if (this._timerState.isStopped()) {
                return GLib.SOURCE_CONTINUE;
            }

            this._timerState.incrementOneSecond();

            if (this._timerState.aMinuteHasPassed()) {
                this._timerState.breakIntervalCounter--;
                if (this._timerState.breakIntervalCounter <= 0) {
                    this._timerState.breakIntervalCounter = this._settings.getBreakInterval();
                }
                this.text.set_text(`${this._timerState.breakIntervalCounter} m`);
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

/**
 * This function is called once when your extension is loaded, not enabled. This
 * is a good time to setup translations or anything else you only do once.
 *
 * You MUST NOT make any changes to GNOME Shell, connect any signals or add any
 * MainLoop sources here.
 *
 * @param {ExtensionMeta} meta - An extension meta object, described below.
 * @returns {Object} an object with enable() and disable() methods
 */
function init(meta) {
    log(`Initializing ${meta.metadata.name}`);

    return new Extension();
}
