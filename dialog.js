/*
 * Gnome Eye Care
 * Copyright (C) 2022 - 2026 Tobias me@tobias.ws
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

import Clutter from "gi://Clutter";
import St from "gi://St";
import GLib from "gi://GLib";
import GObject from "gi://GObject";

import * as ModalDialog from "resource:///org/gnome/shell/ui/modalDialog.js";
import * as Dialog from "resource:///org/gnome/shell/ui/dialog.js";

export const TakeBreakDialog = GObject.registerClass(
    class TakeBreakDialog extends ModalDialog.ModalDialog {
        _init(interval) {
            super._init({
                styleClass: "welcome-dialog",
            });

            this._interval = interval;
            this._timerId = 0;
            this._buildLayout();
        }

        _buildLayout() {
            const title = _("Focus your eyes on something\nat least 20 feet (6 meters) away.");
            const content = new Dialog.MessageDialogContent({
                title: title,
                description: this._interval + "s",
            });

            const icon = new St.Widget({ style_class: "welcome-dialog-image" });
            content.insert_child_at_index(icon, 0);

            this.contentLayout.add_child(content);

            /**
             * When the dialog opens, the "Close" button will get focus so,
             * if the user press "space" the dialog will close.
             * To avoid that, I set the focus to something else before adding
             * the button.
             */
            this.dialogLayout._setInitialKeyFocus(content);

            this.addButton({
                label: _("Close"),
                action: () => this.close(),
                key: Clutter.KEY_Escape,
            });

            let i = this._interval;
            this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
                i--;
                content.description = i + "s";

                if (i <= 0) {
                    let player = global.display.get_sound_player();
                    player.play_from_theme("complete", _("Done"), null);

                    this.close();
                    return GLib.SOURCE_REMOVE;
                }

                return GLib.SOURCE_CONTINUE;
            });
        }

        close() {
            if (this._timerId > 0) {
                GLib.Source.remove(this._timerId);
            }

            super.close();
        }
    },
);
