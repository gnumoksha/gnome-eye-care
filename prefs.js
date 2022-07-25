"use strict";

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {}

function fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    const settings = ExtensionUtils.getSettings(
        "org.gnome.shell.extensions.healthy-eyes"
    );

    // Create a preferences page and group
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    firstRow(group, settings);
    secondRow(group, settings);
    thirdRow(group, settings);
    fourthRow(group, settings);

    // Add our page to the window
    window.add(page);
}

function firstRow(group, settings) {
    // Create a new preferences row
    const row = new Adw.ActionRow({
        title: "Show extension indicator",
        subtitle: "Whether to show the indicator on the panel menu"
    });
    group.add(row);

    // Create the switch and bind its value to the `show-indicator` key
    const toggle = new Gtk.Switch({
        active: settings.get_boolean("show-indicator"),
        valign: Gtk.Align.CENTER,
    });
    settings.bind(
        "show-indicator",
        toggle,
        "active",
        Gio.SettingsBindFlags.DEFAULT
    );

    // Add the switch to the row
    row.add_suffix(toggle);
    row.activatable_widget = toggle;
}

function secondRow(group, settings) {
    const row = new Adw.ActionRow({
        title: "Show notification",
        subtitle: "Whether to show a desktop notification when the time to take a break is approaching"
    });
    group.add(row);

    const toggle = new Gtk.Switch({
        active: settings.get_boolean("show-notification"),
        valign: Gtk.Align.CENTER,
    });
    settings.bind(
        "show-notification",
        toggle,
        "active",
        Gio.SettingsBindFlags.DEFAULT
    );

    row.add_suffix(toggle);
    row.activatable_widget = toggle;
}

function thirdRow(group, settings) {
    const row = new Adw.ActionRow({
        title: "Notification interval",
        subtitle: "Show the desktop notification this amount of seconds before the \"take a break\" dialog"
    });
    group.add(row);

    const spinButton = new Gtk.SpinButton();
    spinButton.set_range(5, 60);
    spinButton.set_numeric(true);
    spinButton.set_increments(1, 5);
    spinButton.set_snap_to_ticks(true);
    spinButton.set_value(settings.get_int("notify-before"));

    settings.bind(
        "notify-before",
        spinButton,
        "value",
        Gio.SettingsBindFlags.DEFAULT
    );

    row.add_suffix(spinButton);
    row.activatable_widget = spinButton;
}

function fourthRow(group, settings) {
    const row = new Adw.ActionRow({
        title: "Break timeout",
        subtitle: "Timeout for the \"take a break\" dialog, in minutes"
    });
    group.add(row);

    const spinButton = new Gtk.SpinButton();
    spinButton.set_range(20, 60);
    spinButton.set_numeric(true);
    spinButton.set_increments(1, 5);
    spinButton.set_snap_to_ticks(true);
    spinButton.set_value(settings.get_int("break-timeout"));

    settings.bind(
        "break-timeout",
        spinButton,
        "value",
        Gio.SettingsBindFlags.DEFAULT
    );

    row.add_suffix(spinButton);
    row.activatable_widget = spinButton;
}
