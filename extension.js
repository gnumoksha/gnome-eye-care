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
"use strict";

import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";
import St from "gi://St";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import * as Notifier from "./notifier.js";
import * as Dialog from "./dialog.js";
import { ExtensionSettings, KEY_SHOW_INDICATOR } from "./settings.js";
import * as MyQuickSettings from "./quickSettings.js";
import * as TimerState from "./timerState.js";

export default class EyeCareExtension extends Extension {
    /**
     * This class is constructed once when your extension is loaded, not
     * enabled. This is a good time to setup translations or anything else you
     * only do once.
     *
     * You MUST NOT make any changes to GNOME Shell, connect any signals or add
     * any event sources here.
     *
     * @param {ExtensionMeta} metadata - An extension meta object https://gjs.guide/extensions/topics/extension.html
     */
    constructor(metadata) {
        super(metadata);
        console.debug(`constructing ${this.metadata.name}`);

        /**
         * Holds the instance of the panel indicator.
         * @type {object}
         */
        this._panelMenuIndicator = null;

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
     * This function is called when your extension is enabled, which could be
     * done in GNOME Extensions, when you log in or when the screen is unlocked.
     *
     * This is when you should setup any UI for your extension, change existing
     * widgets, connect signals or modify GNOME Shell's behavior.
     */
    enable() {
        console.debug(`Enabling the extension ${this.metadata.name}`);

        this._settings = new ExtensionSettings(this);

        this._createMenuIndicator();

        this._timerState = new TimerState.TimerState(this._settings.getBreakInterval());
        this._setupTimer();

        this.timerLabel.set_text(`${this._settings.getBreakInterval()} m`);

        this._notifier = new Notifier.Notifier();

        // The quick settings indicator is not necessary yet
        // this._quickSettingsIndicator = new MyQuickSettings.EyeCareIndicator(this._settings);
        // this._quickSettingsIndicator.quickSettingsItems.push(
        //     new MyQuickSettings.EyeCareToggle(this._settings)
        // );
        // Main.panel.statusArea.quickSettings.addExternalIndicator(this._quickSettingsIndicator);

        console.debug(`The extension ${this.metadata.name} was enabled`);
    }

    /**
     * This function is called when your extension is uninstalled, disabled in
     * GNOME Extensions or when the screen locks.
     *
     * Anything you created, modified or setup in enable() MUST be undone here.
     */
    disable() {
        console.debug(`disabling ${this.metadata.name}`);

        this._panelMenuIndicator.destroy();
        this._panelMenuIndicator = null;

        // The quick settings indicator is not necessary yet
        // this._quickSettingsIndicator.quickSettingsItems.forEach((item) => item.destroy());
        // this._quickSettingsIndicator.destroy();
        // this._quickSettingsIndicator = null;

        if (this._mainEventId > 0) {
            GLib.Source.remove(this._mainEventId);
        }

        console.debug(`${this.metadata.name} was disabled`);
    }

    /**
     * Creates an indicator to show the remaining time and the extensions' action menus.
     * on-screen display (OSD)
     */
    _createMenuIndicator() {
        const indicatorName = `${this.metadata.name} Indicator`;

        this._panelMenuIndicator = new PanelMenu.Button(0.0, indicatorName, false);

        this.timerLabel = new St.Label({
            text: "loading...",
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "indicator-text",
        });
        this._panelMenuIndicator.add_child(this.timerLabel);

        // Bind our indicator visibility to the GSettings value
        //
        // NOTE: Binding properties only works with GProperties (properties
        // registered on a GObject class), not native JavaScript properties
        this._settings
            .getUserSettings()
            .bind(
                KEY_SHOW_INDICATOR,
                this._panelMenuIndicator,
                "visible",
                Gio.SettingsBindFlags.DEFAULT
            );

        /**
         * Add menu items.
         * References:
         *  - https://gjs.guide/extensions/topics/popup-menu.html
         */
        const pauseMenuItem = new PopupMenu.PopupMenuItem("Stop / Resume");
        this._panelMenuIndicator.menu.addMenuItem(pauseMenuItem);
        pauseMenuItem.connect("activate", this._onStopButtonPress.bind(this));
        //
        const resetMenuItem = new PopupMenu.PopupMenuItem("Reset");
        this._panelMenuIndicator.menu.addMenuItem(resetMenuItem);
        resetMenuItem.connect("activate", this._onResetButtonPress.bind(this));
        //
        const runNowMenuItem = new PopupMenu.PopupMenuItem("Run now");
        this._panelMenuIndicator.menu.addMenuItem(runNowMenuItem);
        runNowMenuItem.connect("activate", this._onRunNowButtonPress.bind(this));

        // `Main.panel` is the actual panel you see at the top of the screen,
        // not a class constructor.
        Main.panel.addToStatusArea(indicatorName, this._panelMenuIndicator);
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
            this.timerLabel.set_text(`${this._timerState.breakIntervalCounter} m`);
            actor.label = "Stop"; // #FIXME don't work log(Object.getOwnPropertyNames(actor));
        } else {
            this._timerState.stop();
            this.timerLabel.set_text(`${this._timerState.breakIntervalCounter} m ⏹️`);
            actor.label = "Resume"; // #FIXME don't work
        }
        this._panelMenuIndicator.menu.close();
    }

    /**
     * Executed when the user press the "Reset" button.
     */
    _onResetButtonPress(actor, event) {
        this._reset();
        this._panelMenuIndicator.menu.close();
    }

    /**
     * Executed when the user press the "Run now" button.
     */
    _onRunNowButtonPress(actor, event) {
        this._showNotificationDialog();
        this._reset();
        this._panelMenuIndicator.menu.close();
    }

    /**
     * Reset the timer state and the timer label.
     */
    _reset() {
        this._timerState.reset();
        this.timerLabel.set_text(`${this._settings.getBreakInterval()} m`);
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
                this.timerLabel.set_text(`${this._timerState.breakIntervalCounter} m`);
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
        // timer in order to not count the time the dialog was open
        this._timerState.reset();
    }
}
