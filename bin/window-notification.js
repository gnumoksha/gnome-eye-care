#!/usr/bin/env gjs

imports.gi.versions.Gtk = '3.0';
const {GLib, Gtk, GSound} = imports.gi;

class HealthyEyes {
    constructor() {
        this.timeout = 25;

        // https://gjs-docs.gnome.org/gtk30~3.24.22/gtk.application
        this.application = new Gtk.Application();

        // The ::startup signal is emitted on the primary instance immediately
        // after registration.
        // https://gjs-docs.gnome.org/gio20/gio.application#signal-startup
        this.application.connect('startup', this._onStartup.bind(this));

        // The ::activate signal is emitted on the primary instance when an
        // activation occurs.
        // https://gjs-docs.gnome.org/gio20/gio.application#signal-activate
        this.application.connect('activate', this._onActivate.bind(this));

        this.application.connect('shutdown', this._onShutdown.bind(this));
    }

    // Callback function for 'startup' signal builds the UI
    _onStartup() {
        this._buildUI();
    }

    // Callback function for 'activate' signal presents windows when active
    _onActivate() {
        this._window.present();
        this._runTimer();
        if (this._window !== null) {
            this._playSound();
        }
        this.application.quit();
    }

    // Application has terminated
    _onShutdown() {
        log("Done.");
    }

    /**
     * https://gjs-docs.gnome.org/gtk30~3.24.23/gtk.widget#signal-destroy
     */
    _onWindowDestroy() {
        this._window = null;
    }

    // Build the application's UI
    _buildUI() {
        this._window = new Gtk.ApplicationWindow({
            application: this.application,
            window_position: Gtk.WindowPosition.CENTER,
            border_width: 30,
            title: "Give your eyes a break"});

        // Create the Grid
        this._grid = new Gtk.Grid ({
            // column_homogeneous: true,
            // column_spacing: 20,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            row_spacing: 20 });

        // Create an image
        this._image = new Gtk.Image ({ file: "/usr/share/icons/hicolor/scalable/apps/org.gnome.clocks.svg" });

        // Create a label
        // https://gjs-docs.gnome.org/gtk30~3.24.22/gtk.label
        this._label = new Gtk.Label({
            "use-markup": true,
            wrap: false,
            label: "<span size='20000'>Focus your eyes on something\nat least 20 feet (6 meters) away</span>",
        });

        // Create a second label
        this._labelTwo = new Gtk.Label ({
            "use-markup": true,
            wrap: false,
            label: "" + this.timeout,
            "margin-top": 10
        });

        // Attach the images and button to the grid
        this._grid.attach (this._image,  0, 0, 2, 1);
        // this._grid.attach (this._icon,   0, 1, 1, 1);
        this._grid.attach (this._label,  1, 1, 1, 1);

        // this._grid.attach (this._label, 0, 1, 1, 1);
        this._grid.attach (this._labelTwo, 1, 2, 1, 1);

        // Add the grid to the window
        this._window.add (this._grid);

        // Show the window and all child widgets
        this._window.show_all();

        // stays on top to avoid missing an alert
        this._window.set_keep_above(true);

        this._window.connect('destroy', this._onWindowDestroy.bind(this));
    }

    _runTimer() {
        let loop = GLib.MainLoop.new(null, false);

        let i = this.timeout;
        // https://gjs-docs.gnome.org/glib20~2.66.1/glib.timeout_add
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            i--;

            if (this._window !== null && i >= 1) {
                this._labelTwo.set_label("" + i);
                return GLib.SOURCE_CONTINUE;
            }

            loop.quit();
            return GLib.SOURCE_REMOVE;
        });

        loop.run();
    }

    _playSound() {
        this._window.hide();
        this._window.close();
        this._window.destroy();
        // this.application.quit();

        // https://wiki.gnome.org/Projects/GSound
        // https://developer.gnome.org/gsound/stable/GSoundContext.html
        // https://gitlab.freedesktop.org/xdg/xdg-sound-theme/-/tree/master/stereo
        let ctx = new GSound.Context();
        ctx.init(null);
        ctx.play_simple(
            {
                "event.id": "complete",
                "event.description": "done",
                //"canberra.volume": "1"
            },
            null
        );
        GLib.usleep(2000000);
    }
};

let app = new HealthyEyes();
app.application.run(ARGV);
