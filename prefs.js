/*
 * Gnome Eye Care
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

import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw";

import {
    ExtensionPreferences,
    gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import {
    KEY_SHOW_INDICATOR,
    KEY_SHOW_NOTIFICATION,
    KEY_NOTIFY_BEFORE,
    KEY_BREAK_TIMEOUT,
} from "./settings.js";

/**
 * References:
 *  - https://gjs.guide/extensions/overview/anatomy.html#prefs-js
 */
export default class ExamplePreferences extends ExtensionPreferences {
    /**
     * This class is constructed once when your extension preferences are
     * about to be opened. This is a good time to setup translations or anything
     * else you only do once.
     *
     * @param {ExtensionMeta} metadata - An extension meta object
     */
    constructor(metadata) {
        super(metadata);

        console.debug(`constructing ${this.metadata.name}`);
    }

    /**
     * This function is called when the preferences window is first created to
     * build and return a GTK4 widget.
     *
     * The preferences window will be a `Adw.PreferencesWindow`, and the widget
     * returned by this function will be added to an `Adw.PreferencesPage` or
     * `Adw.PreferencesGroup` if necessary.
     *
     * @returns {Gtk.Widget} the preferences widget
     */
    getPreferencesWidget() {
        return new Gtk.Label({
            label: this.metadata.name,
        });
    }

    /**
     * Fill the preferences window with preferences.
     *
     * If this method is overridden, `getPreferencesWidget()` will NOT be called.
     *
     * @param {Adw.PreferencesWindow} window - the preferences window
     */
    fillPreferencesWindow(window) {
        // Use the same GSettings schema as in `extension.js`
        const settings = this.getSettings("org.gnome.shell.extensions.healthy-eyes");

        // Create a preferences page and group
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup();
        page.add(group);

        this.firstRow(group, settings);
        this.secondRow(group, settings);
        this.thirdRow(group, settings);
        this.fourthRow(group, settings);

        // Add our page to the window
        window.add(page);
    }

    firstRow(group, settings) {
        // Create a new preferences row
        const row = new Adw.ActionRow({
            title: "Show extension indicator",
            subtitle: "Whether to show the indicator on the panel menu",
        });
        group.add(row);

        // Create the switch and bind its value to the `show-indicator` key
        const toggle = new Gtk.Switch({
            active: settings.get_boolean(KEY_SHOW_INDICATOR),
            valign: Gtk.Align.CENTER,
        });
        settings.bind(KEY_SHOW_INDICATOR, toggle, "active", Gio.SettingsBindFlags.DEFAULT);

        // Add the switch to the row
        row.add_suffix(toggle);
        row.activatable_widget = toggle;
    }

    secondRow(group, settings) {
        const row = new Adw.ActionRow({
            title: "Show notification",
            subtitle:
                "Whether to show a desktop notification when the time to take a break is approaching",
        });
        group.add(row);

        const toggle = new Gtk.Switch({
            active: settings.get_boolean(KEY_SHOW_NOTIFICATION),
            valign: Gtk.Align.CENTER,
        });
        settings.bind(KEY_SHOW_NOTIFICATION, toggle, "active", Gio.SettingsBindFlags.DEFAULT);

        row.add_suffix(toggle);
        row.activatable_widget = toggle;
    }

    thirdRow(group, settings) {
        const row = new Adw.ActionRow({
            title: "Notification interval",
            subtitle:
                'Show the desktop notification this amount of seconds before the "take a break" dialog',
        });
        group.add(row);

        const spinButton = new Gtk.SpinButton();
        spinButton.set_range(5, 60);
        spinButton.set_numeric(true);
        spinButton.set_increments(1, 5);
        spinButton.set_snap_to_ticks(true);
        spinButton.set_value(settings.get_int(KEY_NOTIFY_BEFORE));

        settings.bind(KEY_NOTIFY_BEFORE, spinButton, "value", Gio.SettingsBindFlags.DEFAULT);

        row.add_suffix(spinButton);
        row.activatable_widget = spinButton;
    }

    fourthRow(group, settings) {
        const row = new Adw.ActionRow({
            title: "Break timeout",
            subtitle: 'Timeout for the "take a break" dialog, in minutes',
        });
        group.add(row);

        const spinButton = new Gtk.SpinButton();
        spinButton.set_range(20, 60);
        spinButton.set_numeric(true);
        spinButton.set_increments(1, 5);
        spinButton.set_snap_to_ticks(true);
        spinButton.set_value(settings.get_int(KEY_BREAK_TIMEOUT));

        settings.bind(KEY_BREAK_TIMEOUT, spinButton, "value", Gio.SettingsBindFlags.DEFAULT);

        row.add_suffix(spinButton);
        row.activatable_widget = spinButton;
    }
}
