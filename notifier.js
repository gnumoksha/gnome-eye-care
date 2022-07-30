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

const MessageTray = imports.ui.messageTray;

var Notifier = class Notifier
{
    constructor() {
        /**
         * Holds the instance of message tray.
         * @type {object}
         */
        this._messageTray = null;
    }

    /**
     * Set up the objects needed for system tray notifications.
     */
    setup() {
        this._messageTray = new MessageTray.MessageTray();

        const source = new MessageTray.SystemNotificationSource();
        this._messageTray.add(source);
    }

    /**
     * Shows a transient notification that will last 4 seconds.
     *
     * @param {string} title: A title
     * @param {string} banner: A message
     */
    notify(title, banner) {
        let source = new MessageTray.SystemNotificationSource();
        this._messageTray.add(source);

        let notification = new MessageTray.Notification(source, title, banner);
        notification.setTransient(true);
        notification.setUrgency(MessageTray.Urgency.NORMAL);

        source.showNotification(notification);
    }
}
