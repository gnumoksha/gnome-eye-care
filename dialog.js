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
'use strict';

const { Clutter, GObject, St } = imports.gi;
const GLib = imports.gi.GLib;

const ModalDialog = imports.ui.modalDialog;
const Dialog = imports.ui.dialog;

var TakeBreakDialog = GObject.registerClass(
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
    }
);
