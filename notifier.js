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

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as MessageTray from "resource:///org/gnome/shell/ui/messageTray.js";

let notificationSource = null;

/**
 * References:
 *  - https://gjs.guide/extensions/topics/notifications.html
 */
function getNotificationSource() {
    if (!notificationSource) {
        const notificationPolicy = new MessageTray.NotificationGenericPolicy();

        notificationSource = new MessageTray.Source({
            title: _("Gnome Eye Care"),
            iconName: "face-smile-symbolic",
            policy: notificationPolicy,
        });

        // Reset the notification source if it's destroyed
        notificationSource.connect("destroy", (_source) => {
            notificationSource = null;
        });
        Main.messageTray.add(notificationSource);
    }

    return notificationSource;
}

export const Notifier = class Notifier {
    /**
     * Shows a transient notification that will last 4 seconds.
     *
     * @param {string} title: The title
     * @param {string} body: The message
     */
    notify(title, body) {
        const source = getNotificationSource();

        const notification = new MessageTray.Notification({
            source: source,
            title: title,
            body: body,
        });

        source.addNotification(notification);
    }
};
