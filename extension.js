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

// https://gjs-docs.gnome.org/glib20~2.66.1/
const GLib = imports.gi.GLib;

// St builds on Clutter to provide more complex widgets like buttons, icons,
// text entries and scrollable areas. It also adds support for CSS so the
// style of widgets can be changed programmatically or from a stylesheet.
// https://gjs-docs.gnome.org/st10~1.0_api/
const St = imports.gi.St;

// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/main.js
const Main = imports.ui.main;
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/panelMenu.js
const PanelMenu = imports.ui.panelMenu;

// https://gitlab.gnome.org/GNOME/gnome-shell/blob/main/js/misc/extensionUtils.js
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

class Extension {
    constructor() {
        this.indicator = null;
        this.minutesCounter = 20;

        this.windowInterval = 60 * 20;

        this.elapsedSeconds = 0;
        this.eventSourceId = 0;
    }

    enable() {
        log(`enabling ${Me.metadata.name}`);

        this.settings = ExtensionUtils.getSettings(
            "org.gnome.shell.extensions.healthy-eyes"
        );

        this.createMenuIndicator();

        this.setupTimer();

        this.text.set_text(`${this.minutesCounter} m`);

        log(`${Me.metadata.name} was enabled`);
    }

    createMenuIndicator() {
        let indicatorName = `${Me.metadata.name} Indicator`;

        // Create a panel button
        this.indicator = new PanelMenu.Button(0.0, indicatorName, false);

        // add text label for the countdown
        this.text = new St.Label({
            text: "loading...",
        });
        this.indicator.actor.add_actor(this.text);

        // `Main.panel` is the actual panel you see at the top of the screen,
        // not a class constructor.
        Main.panel.addToStatusArea(indicatorName, this.indicator);
    }

    setupTimer() {
        this.eventSourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this.elapsedSeconds += 1;

            if (this.elapsedSeconds % 60 == 0) {
                this.minutesCounter--;
                if (this.minutesCounter <= 0) {
                    this.minutesCounter = 20;
                }
                this.text.set_text(`${this.minutesCounter} m`);
            }

            let remainingSeconds = this.windowInterval - this.elapsedSeconds;
            if (remainingSeconds == 20) {
                this.showNotificationApproaching();
            }

            if (remainingSeconds <= 0) {
                this.elapsedSeconds = 0;
                this.showNotificationWindow();
            }

            return GLib.SOURCE_CONTINUE;
        });
    }

    showNotificationApproaching() {
        GLib.spawn_command_line_async(
            `${Me.path}/bin/approaching-notification.js`
        );
    }

    showNotificationWindow() {
        GLib.spawn_command_line_async(`${Me.path}/bin/window-notification.js`);
    }

    /**
     * REMINDER: It's required for extensions to clean up after themselves when
     * they are disabled. This is required for approval during review!
     */
    disable() {
        log(`disabling ${Me.metadata.name}`);

        this.indicator.destroy();
        this.indicator = null;

        if (this.eventSourceId > 0) {
            GLib.Source.remove(this.serviceSignalId);
        }
    }
}

function init() {
    log(`initializing ${Me.metadata.name}`);

    return new Extension();
}
