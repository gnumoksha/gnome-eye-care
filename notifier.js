// SPDX-FileCopyrightText: 2022-2026 Tobias Sette <tobiasette@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later
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
