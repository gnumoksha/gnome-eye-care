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
         * The "take a break" dialog will be shown after this amount of minutes.
         * @type {number}
         */
        this.breakInterval = 20;

        /**
         * The dialog interval, but in seconds instead of minutes.
         * @type {number}
         */
        this.breakIntervalSeconds = this.breakInterval * 60;

        /**
         * Holds the instance of the pannel indicator.
         * @type {object}
         */
        this.indicator = null;

        /**
         * The event id for the main loop of this extension.
         * @type {number}
         */
        this.mainEventId = 0;

        /**
         * @type {object}
         */
        this.notifier = null;
    }

    /**
     * Special method invoked when the extension has been enabled.
     */
    enable() {
        log(`enabling ${Me.metadata.name}`);

        this.settings = ExtensionUtils.getSettings(
            "org.gnome.shell.extensions.healthy-eyes"
        );

        this._createMenuIndicator();

        this._setupTimer();

        this.text.set_text(`${this.breakInterval} m`);

        this.notifier = new Notifier.Notifier();
        this.notifier.setup();

        log(`${Me.metadata.name} was enabled`);
    }

    /**
     * Special method invoked when the extension has been disabled.
     *
     * REMINDER: It's required for extensions to clean up after themselves when
     * they are disabled. This is required for approval during review!
     */
    disable() {
        log(`disabling ${Me.metadata.name}`);

        this.indicator.destroy();
        this.indicator = null;

        if (this.mainEventId > 0) {
            GLib.Source.remove(this.mainEventId);
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
        this.indicator = new PanelMenu.Button(0.0, indicatorName, false);

        // add text label for the countdown
        this.text = new St.Label({
            text: "loading...",
        });
        this.indicator.add_actor(this.text);

        // Bind our indicator visibility to the GSettings value
        //
        // NOTE: Binding properties only works with GProperties (properties
        // registered on a GObject class), not native JavaScript properties
        this.settings.bind(
            "show-indicator",
            this.indicator,
            "visible",
            Gio.SettingsBindFlags.DEFAULT
        );

        let item = new PopupMenu.PopupMenuItem("Reset timer");
        this.indicator.menu.addMenuItem(item);
        item.actor.connect(
            "button_press_event",
            this._onResetButtonPress.bind(this)
        );

        // `Main.panel` is the actual panel you see at the top of the screen,
        // not a class constructor.
        Main.panel.addToStatusArea(indicatorName, this.indicator);
    }

    /**
     * Executed when the user press the "Reset timer" button.
     */
    _onResetButtonPress(actor, event) {
        this.breakInterval = 20;
        this.text.set_text(`${this.breakInterval} m`);
        this.indicator.menu.close();
    }

    /**
     * Set up the main loop.
     */
    _setupTimer() {
        let elapsedSeconds = 0;
        let remainingSeconds = null;
        let breakIntervalCounter = this.breakInterval;

        this.mainEventId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            1,
            () => {
                elapsedSeconds += 1;

                if (elapsedSeconds % 60 == 0) {
                    // a minute has passed
                    breakIntervalCounter--;
                    if (breakIntervalCounter <= 0) {
                        breakIntervalCounter = this.breakInterval;
                    }
                    this.text.set_text(`${breakIntervalCounter} m`);

                    return GLib.SOURCE_CONTINUE;
                }

                remainingSeconds = this.breakIntervalSeconds - elapsedSeconds;
                if (
                    this.settings.get_boolean("show-notification") &&
                    remainingSeconds == this.settings.get_int("notify-before")
                ) {
                    this.notifier.notify(
                        "Time is approaching",
                        "The time to take a break is approaching"
                    );
                    return GLib.SOURCE_CONTINUE;
                }

                if (remainingSeconds <= 0) {
                    this._showNotificationWindow();
                    elapsedSeconds = 0;
                    remainingSeconds = null;
                    breakIntervalCounter = this.breakInterval;
                    return GLib.SOURCE_CONTINUE;
                }

                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _showNotificationWindow() {
        let breakTimeout = this.settings.get_int("break-timeout");
        let dialog = new Dialog.TakeBreakDialog(breakTimeout);
        dialog.open();
    }
}

function init() {
    log(`initializing ${Me.metadata.name}`);

    return new Extension();
}
