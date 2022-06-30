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

    // Add our page to the window
    window.add(page);
}

function firstRow(group, settings) {
    // Create a new preferences row
    const row = new Adw.ActionRow({ title: "Show extension indicator" });
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
    const row = new Adw.ActionRow({ title: "Show notification" });
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
    return;
    const row = new Adw.ActionRow({ title: "Notification interval" });
    group.add(row);

    // #FIXME this should be an input for an integer
    const toggle = new Gtk.Switch({
        active: settings.get_int("show-notification-before"),
        valign: Gtk.Align.CENTER,
    });
    settings.bind(
        "show-notification-before",
        toggle,
        "active",
        Gio.SettingsBindFlags.DEFAULT
    );

    row.add_suffix(toggle);
    row.activatable_widget = toggle;
}
