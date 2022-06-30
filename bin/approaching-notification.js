#!/usr/bin/gjs

const Glib = imports.gi.GLib;

const Notify = imports.gi.Notify;
Notify.init("Time is approaching");

var notification = new Notify.Notification({
  summary: "Time is approaching",
  body: "The time to take a break is approaching",
  "icon-name": "dialog-information",
});

notification.set_timeout(3000); // The timeout in milliseconds.
notification.set_urgency(Notify.Urgency.NORMAL);

notification.show();

// timeout does not work so, wait and then close the notification
Glib.usleep(3000000);
notification.close();
