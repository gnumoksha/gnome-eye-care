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

import GObject from "gi://GObject";
import Gio from "gi://Gio";

import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

import { ExtensionSettings, KEY_ENABLED } from "./settings.js";

/**
 * A quick settings indicator that shows whether the extension is running.
 *
 * References:
 *  - https://gjs.guide/extensions/topics/quick-settings.html
 */
export const EyeCareIndicator = GObject.registerClass(
    class EyeCareIndicator extends QuickSettings.SystemIndicator {
        /**
         * @param {ExtensionSettings} settings
         */
        _init(settings) {
            super._init();

            this._indicator = this._addIndicator();
            this._indicator.icon_name = "face-smile-symbolic";

            // Showing an indicator when the feature is enabled
            settings
                .getUserSettings()
                .bind(KEY_ENABLED, this._indicator, "visible", Gio.SettingsBindFlags.DEFAULT);
        }
    }
);

/**
 * Enable/disable the extension from the quick settings.
 */
export const EyeCareToggle = GObject.registerClass(
    class ExampleToggle extends QuickSettings.QuickToggle {
        /**
         * @param {ExtensionSettings} settings
         */
        _init(settings) {
            super._init({
                title: _("Eye Care"),
                subtitle: _("Take care of your eyes"),
                iconName: "face-smile-symbolic",
                toggleMode: true,
            });

            // Binding the toggle to a GSettings key
            settings
                .getUserSettings()
                .bind(KEY_ENABLED, this, "checked", Gio.SettingsBindFlags.DEFAULT);
        }
    }
);
