const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const QuickSettings = imports.ui.quickSettings;
// This is the live instance of the Quick Settings menu
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;

const FeatureToggle = GObject.registerClass(
class FeatureToggle extends QuickSettings.QuickToggle {
    _init(appSettings) {
        this._appSettings = appSettings;

        super._init({
            label: 'Eye care',
            iconName: 'selection-mode-symbolic',
            toggleMode: true,
        });

        this._appSettings.getUserSettings().bind(
            Settings.KEY_SHOW_INDICATOR,
            this, 'checked',
            Gio.SettingsBindFlags.DEFAULT
        );
    }
});

const FeatureMenuToggle = GObject.registerClass(
class FeatureMenuToggle extends QuickSettings.QuickMenuToggle {
    _init() {
        super._init({
            label: 'Eye Care',
            iconName: 'face-smile-symbolic',
            toggleMode: true,
        });

        // This function is unique to this class. It adds a nice header with an
        // icon, title and optional subtitle. It's recommended you do so for
        // consistency with other menus.
        this.menu.setHeader(
            'face-smile-symbolic',
            'Eye Care',
            'Take care of your eyes'
        );

        // You may also add sections of items to the menu
        // this._itemsSection = new PopupMenu.PopupMenuSection();
        // this._itemsSection.addAction('Option 1', () => log('activated'));
        // this._itemsSection.addAction('Option 2', () => log('activated'));
        // this.menu.addMenuItem(this._itemsSection);

        // this.menu.addMenuItem(new FeatureToggle(new Settings.ExtensionSettings()));

        // this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Add an entry-point for more settings
        const settingsItem = this.menu.addAction(
            'More Settings',
            () => ExtensionUtils.openPrefs()
        );

        // Ensure the settings are unavailable when the screen is locked
        settingsItem.visible = Main.sessionMode.allowSettings;
        this.menu._settingsActions[Me.uuid] = settingsItem;
    }
});

/**
 * Wrap around the extension's user settings and static settings.
 */
var MyQuickSettings = GObject.registerClass(
    class MyQuickSettings extends QuickSettings.SystemIndicator {
        _init(appSettings) {
            super._init();
            this._appSettings = appSettings;

            // Create the icon for the indicator
            this._indicator = this._addIndicator();
            this._indicator.icon_name = 'selection-mode-symbolic';

            // Create the toggle menu and associate it with the indicator, being
            // sure to destroy it along with the indicator
            this.quickSettingsItems.push(new FeatureMenuToggle());

            this.connect('destroy', () => {
                this.quickSettingsItems.forEach(item => item.destroy());
            });

            // Add the indicator to the panel and the toggle to the menu
            QuickSettingsMenu._indicators.add_child(this);
            QuickSettingsMenu._addItems(this.quickSettingsItems);
        }
    }
);
