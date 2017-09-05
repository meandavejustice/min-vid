Components.utils.import('resource://gre/modules/ctypes.jsm');
Components.utils.import('chrome://minvid-ostypes/content/cutils.jsm');
Components.utils.import('resource://gre/modules/Console.jsm');

// below this line is ostypes_x11.jsm as of commit cba5d9f

/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

var EXPORTED_SYMBOLS = ['ostypes'];

// no need to define core or import cutils as all the globals of the worker who importScripts'ed it are availble here

var global = this;
if (!global.DedicatedWorkerGlobalScope) {
	importOsConstsJsm(); // needed for access OS.Constants.libc
	importServicesJsm();
}

const APP_64BIT = ctypes.voidptr_t.size === 4 ? false : true;
const OS_NAME = global.DedicatedWorkerGlobalScope ? OS.Constants.Sys.Name.toLowerCase() : Services.appinfo.OS.toLowerCase(); // lower case platform name
const FIREFOX_VERSION = global.DedicatedWorkerGlobalScope ? parseFloat(/Firefox\/(\d+\.\d+)/.exec(navigator.userAgent)[1]) : Services.appinfo.version; // not used for anything right now
Object.defineProperty(global, 'GTK_VERSION', { get: function() { return getGtkVersion() } }); // make this a getter, so that ostyeps can be loaded without needing to have first got `TOOLKIT` from mainthread if this is a worker

var xlibTypes = function() {
	// ABIs
	this.CALLBACK_ABI = ctypes.default_abi;
	this.ABI = ctypes.default_abi;

	var struct_const = {};
	////////// C
	///// TYPES
	// TYPEs - Level 0
	this.char = ctypes.char;
	this.fd_set = ctypes.uint8_t; // This is supposed to be fd_set*, but on Linux at least fd_set is just an array of bitfields that we handle manually. this is for my fd_set_set helper functions link4765403
	this.int = ctypes.int;
	this.int16_t = ctypes.int16_t;
	this.long = ctypes.long;
	this.nfds_t = ctypes.unsigned_int; // https://dxr.mozilla.org/mozilla-central/source/addon-sdk/source/lib/sdk/system/child_process/subprocess_worker_unix.js#99
	this.short = ctypes.short;
	this.size_t = ctypes.size_t;
	this.ssize_t = ctypes.ssize_t;
	this.unsigned_char = ctypes.unsigned_char;
	this.unsigned_int = ctypes.unsigned_int;
	this.unsigned_long = ctypes.unsigned_long;
	this.uint16_t = ctypes.uint16_t;
	this.uint32_t = ctypes.uint32_t;
	this.uint8_t = ctypes.uint8_t;
	this.void = ctypes.void_t;

	// TYPEs - Level 1
	this.useconds_t = this.unsigned_int;

	///// STRUCTS
	struct_const.NAME_MAX = 255;

	// STRUCTs - Level 0
	this.inotify_event = ctypes.StructType('inotify_event', [ // http://man7.org/linux/man-pages/man7/inotify.7.html
		{ wd: this.int },													// Watch descriptor
		{ mask: this.uint32_t },											// Mask describing event
		{ cookie: this.uint32_t },											// Unique cookie associating related events (for rename(2))
		{ len: this.uint32_t },												// Size of name field
		{ name: this.char.array(struct_const.NAME_MAX + 1) } // + 1 for the null termination // Optional null-terminated name // Within a ufs filesystem the maximum length from http://www.unix.com/unix-for-dummies-questions-and-answers/4260-maximum-file-name-length.htmlof a filename is 255 and i do 256 becuause i wnant it null terminated
	]);
	this.pollfd = ctypes.StructType('pollfd', [ // http://linux.die.net/man/2/poll
		{ fd: this.int },
		{ events: this.short },
		{ revents: this.short }
	]);
	this.timeval = ctypes.StructType('timeval', [
		{ 'tv_sec': this.long },
		{ 'tv_usec': this.long }
	]);

	///// X11 TYPES
	// SIMPLE TYPES // http://refspecs.linuxfoundation.org/LSB_1.3.0/gLSB/gLSB/libx11-ddefs.html
	this.Atom = ctypes.unsigned_long;
	this.Bool = ctypes.int;
	this.KeyCode = ctypes.unsigned_char;
	this.Status = ctypes.int;
	this.Time = ctypes.unsigned_long;
	this.VisualID = ctypes.unsigned_long;
	this.XID = ctypes.unsigned_long;
	this.XPointer = ctypes.char.ptr;
	this.CARD32 = !APP_64BIT ? this.unsigned_int : this.unsigned_long; // /^(Alpha|hppa|ia64|ppc64|s390|x86_64)-/.test(core.os.xpcomabi) ? this.unsigned_int : this.unsigned_long; // https://github.com/foudfou/FireTray/blob/a0c0061cd680a3a92b820969b093cc4780dfb10c/src/modules/ctypes/linux/x11.jsm#L45 // // http://mxr.mozilla.org/mozilla-central/source/configure.in
	this.RROutput = this.XID;
	this.Connection = ctypes.uint16_t; // not exactly sure about this one but its working
	this.SubpixelOrder = ctypes.uint16_t; // not exactly sure about this one but its working
	this.RRCrtc = this.XID;
	this.RRMode = this.XID;
	this.XRRModeFlags = ctypes.unsigned_long;
	this.Rotation = ctypes.uint16_t; // not exactly sure about this one but its working

	// ADVANCED TYPES
	this.Colormap = this.XID;
	this.Cursor = this.XID;
	this.Drawable = this.XID;
	this.Font = this.XID;
	this.GContext = this.XID;
	this.KeySym = this.XID;
	this.Pixmap = this.XID;
	this.Window = this.XID;

	// OPAQE STRUCTS
	this.Screen = ctypes.StructType('Screen');
	this.Display = ctypes.StructType('Display');
	this.Visual = ctypes.StructType('Visual');
	this.Depth = ctypes.StructType('Depth');

	// Inaccurate STRUCTS
	this.XComposeStatus = ctypes.StructType('XComposeStatus'); // i didnt bother looking this up as i didnt need its internals

	// SIMPLE STRUCTS
	this.XAnyEvent = ctypes.StructType('XAnyEvent', [ // https://tronche.com/gui/x/xlib/events/structures.html
		{ type: this.int },
		{ serial: this.unsigned_long },
		{ send_event: this.Bool },
		{ display: this.Display.ptr },
		{ window: this.Window }
	]);
	this.XButtonEvent = ctypes.StructType('XButtonEvent', [ // http://tronche.com/gui/x/xlib/events/keyboard-pointer/keyboard-pointer.html#XButtonEvent
		{ type: this.int },
		{ serial: this.unsigned_long },
		{ send_event: this.Bool },
		{ display: this.Display.ptr },
		{ window: this.Window },
		{ root: this.Window },
		{ subwindow: this.Window },
		{ time: this.Time },
		{ x: this.int },
		{ y: this.int },
		{ x_root: this.int },
		{ y_root: this.int },
		{ state: this.unsigned_int },
		{ button: this.unsigned_int },
		{ same_screen: this.Bool }
	]);
	this.XClientMessageEvent = ctypes.StructType('XClientMessageEvent', [ // http://www.man-online.org/page/3-XClientMessageEvent/
		{ type: this.int },				// ClientMessage
		{ serial: this.unsigned_long },	// # of last request processed by server
		{ send_event: this.Bool },		// true if this came from a SendEvent request
		{ display: this.Display.ptr },	// Display the event was read from
		{ window: this.Window },
		{ message_type: this.Atom },
		{ format: this.int },
		{ data: this.long.array(5) }	// union of either this.char.array(20), this.short.array(10), or this.long.array(5) // if go with long format must be set to 32, if short then 16 else if char then 8
	]);
	this.XImage = ctypes.StructType('_XImage', [	// https://github.com/pombreda/rpythonic/blob/23857bbeda30a4574b7ae3a3c47e88b87080ef3f/examples/xlib/__init__.py#L1593
		{ width: this.int },
		{ height: this.int },						// size of image
		{ xoffset: this.int },						// number of pixels offset in X direction
		{ format: this.int },						// XYBitmap, XYPixmap, ZPixmap
		{ data: this.char.ptr },					// pointer to image data
		{ byte_order: this.int },					// data byte order, LSBFirst, MSBFirst
		{ bitmap_unit: this.int },					// quant. of scanline 8, 16, 32
		{ bitmap_bit_order: this.int },				// LSBFirst, MSBFirst
		{ bitmap_pad: this.int },					// 8, 16, 32 either XY or ZPixmap
		{ depth: this.int },						// depth of image
		{ bytes_per_line: this.int },				// accelerator to next scanline
		{ bits_per_pixel: this.int },				// bits per pixel (ZPixmap)
		{ red_mask: this.unsigned_long },			// bits in z arrangement
		{ green_mask: this.unsigned_long },
		{ blue_mask: this.unsigned_long },
		{ obdata: this.XPointer },					// hook for the object routines to hang on
		{
			f: ctypes.StructType('funcs', [			// image manipulation routines
				{ create_image: ctypes.voidptr_t },
				{ destroy_image: ctypes.voidptr_t },
				{ get_pixel: ctypes.voidptr_t },
				{ put_pixel: ctypes.voidptr_t },
				{ sub_image: ctypes.voidptr_t },
				{ add_pixel: ctypes.voidptr_t }
			])
		}
	]);
	this.XKeyEvent = ctypes.StructType('XKeyEvent', [ // https://tronche.com/gui/x/xlib/events/keyboard-pointer/keyboard-pointer.html#XKeyEvent
		{ type: this.int },
		{ serial: this.unsigned_long },
		{ send_event: this.Bool },
		{ display: this.Display.ptr },
		{ window: this.Window },
		{ root: this.Window },
		{ subwindow: this.Window },
		{ time: this.Time },
		{ x: this.int },
		{ y: this.int },
		{ x_root: this.int },
		{ y_root: this.int },
		{ state: this.unsigned_int },
		{ keycode: this.unsigned_int },
		{ same_screen: this.Bool }
	]);
	this.XTextProperty = ctypes.StructType('XTextProperty', [
		{ value: this.unsigned_char.ptr },	// *value
		{ encoding: this.Atom },			// encoding
		{ format: this.int },				// format
		{ nitems: this.unsigned_long }		// nitems
	]);
	this.XWindowAttributes = ctypes.StructType('XWindowAttributes', [
		{ x: this.int },
		{ y: this.int },							// location of window
		{ width: this.int },
		{ height: this.int },						// width and height of window
		{ border_width: this.int },					// border width of window
		{ depth: this.int },						// depth of window
		{ visual: this.Visual.ptr },				// the associated visual structure
		{ root: this.Window },						// root of screen containing window
		{ class: this.int },						// InputOutput, InputOnl
		{ bit_gravity: this.int },					// one of bit gravity values
		{ win_gravity: this.int },					// one of the window gravity values
		{ backing_store: this.int },				// NotUseful, WhenMapped, Always
		{ backing_planes: this.unsigned_long },		// planes to be preserved if possible
		{ backing_pixel: this.unsigned_long },		// value to be used when restoring planes
		{ save_under: this.Bool },					// boolean, should bits under be saved?
		{ colormap: this.Colormap },				// color map to be associated with window
		{ map_installed: this.Bool },				// boolean, is color map currently installe
		{ map_state: this.int },					// IsUnmapped, IsUnviewable, IsViewable
		{ all_event_masks: this.long },				// set of events all people have interest i
		{ your_event_mask: this.long },				// my event mask
		{ do_not_propagate_mask: this.long },		// set of events that should not propagate
		{ override_redirect: this.Bool },			// boolean value for override-redirect
		{ screen: this.Screen.ptr }					// back pointer to correct screen
	]);

	// ADVANCED STRUCTS
	// XEvent is one huge union, js-ctypes doesnt have union so i just set it to what I use for my addon
	this.XEvent = ctypes.StructType('_XEvent', [ // http://tronche.com/gui/x/xlib/events/structures.html
		// { bytes: ctypes.uint64_t.array(100) }
		{ xany: this.XAnyEvent }
		// { xclient: this.XClientMessageEvent }
		// { xbutton: this.XButtonEvent }
		// { xkey: this.XKeyEvent }
	]);

	// start - xrandr stuff
		// resources:
		// http://cgit.freedesktop.org/xorg/proto/randrproto/tree/randrproto.txt
		// http://www.xfree86.org/current/Xrandr.3.html
	this.XRRModeInfo = ctypes.StructType('_XRRModeInfo', [
		{ id: this.RRMode },
		{ width: this.unsigned_int },
		{ height: this.unsigned_int },
		{ dotClock: this.unsigned_long },
		{ hSyncStart: this.unsigned_int },
		{ hSyncEnd: this.unsigned_int },
		{ hTotal: this.unsigned_int },
		{ hSkew: this.unsigned_int },
		{ vSyncStart: this.unsigned_int },
		{ vSyncEnd: this.unsigned_int },
		{ vTotal: this.unsigned_int },
		{ name: this.char.ptr },
		{ nameLength: this.unsigned_int },
		{ modeFlags: this.XRRModeFlags }
	]);

	this.XRRScreenResources = ctypes.StructType('_XRRScreenResources', [
		{ timestamp: this.Time },
		{ configTimestamp: this.Time },
		{ ncrtc: this.int },
		{ crtcs: this.RRCrtc.ptr },
		{ noutput: this.int },
		{ outputs: this.RROutput.ptr },
		{ nmode: this.int },
		{ modes: this.XRRModeInfo.ptr }
	]);

	this.XRROutputInfo = ctypes.StructType('_XRROutputInfo', [
		{ timestamp: this.Time },
		{ crtc: this.RRCrtc },
		{ name: this.char.ptr },
		{ nameLen: this.int },
		{ mm_width: this.unsigned_long },
		{ mm_height: this.unsigned_long },
		{ connection: this.Connection },
		{ subpixel_order: this.SubpixelOrder },
		{ ncrtc: this.int },
		{ crtcs: this.RRCrtc.ptr },
		{ nclone: this.int },
		{ clones: this.RROutput.ptr },
		{ nmode: this.int },
		{ npreferred: this.int },
		{ modes: this.RRMode.ptr }
	]);

	this.XRRCrtcInfo = ctypes.StructType('_XRRCrtcInfo', [
		{ timestamp: this.Time },
		{ x: this.int },
		{ y: this.int },
		{ width: this.unsigned_int },
		{ height: this.unsigned_int },
		{ mode: this.RRMode },
		{ rotation: this.Rotation },
		{ noutput: this.int },
		{ outputs: this.RROutput.ptr },
		{ rotations: this.Rotation },
		{ npossible: this.int },
		{ possible: this.RROutput.ptr }
	]);

	//////// GTK
	//// TYPES
	// TYPEs - Level 0
	this.gchar = ctypes.char;
	this.GAppInfo = ctypes.StructType('GAppInfo');
	this.GAppLaunchContext = ctypes.StructType('GAppLaunchContext');
	this.GBytes = ctypes.StructType('_GBytes');
	this.GCallback = this.void.ptr; // https://developer.gnome.org/gobject/stable/gobject-Closures.html#GCallback
	this.GCancellable = ctypes.StructType('_GCancellable');
	this.GConnectFlags = ctypes.unsigned_int; // guess as its enum
	this.GdkColormap = ctypes.StructType('GdkColormap');
	this.GDesktopAppInfo = ctypes.StructType('GDesktopAppInfo');
	this.GdkDevice = ctypes.StructType('GdkDevice');
	this.GdkDeviceManager = ctypes.StructType('GdkDeviceManager');
	this.GdkDisplay = ctypes.StructType('GdkDisplay');
	this.GdkDisplayManager = ctypes.StructType('GdkDisplayManager');
	this.GdkDrawable = ctypes.StructType('GdkDrawable');
	this.GdkEventMask = ctypes.int; // enum, guessing enum is int
	this.GdkEventType = ctypes.int; // enum // https://developer.gnome.org/gdk3/stable/gdk3-Events.html#GdkEventType
	this.GdkFilterReturn = ctypes.int; // enum, guessing enum is int
	this.GdkFullscreenMode = ctypes.int;
	this.GdkGravity = ctypes.int;
	this.GdkModifierType = ctypes.int; // enum, guess
	this.GdkPixbuf = ctypes.StructType('GdkPixbuf');
	this.GdkScreen = ctypes.StructType('GdkScreen');
	this.GdkSeat = ctypes.StructType('GdkSeat');
	this.GdkWindow = ctypes.StructType('GdkWindow');
	this.GdkWindowHints = ctypes.int;
	this.GdkWindowTypeHint = ctypes.int;
	this.gdouble = ctypes.double;
	this.GFile = ctypes.StructType('_GFile');
	this.GFileInfo = ctypes.StructType('GFileInfo');
	this.GFileMonitor = ctypes.StructType('_GFileMonitor');
	this.GFileMonitorEvent = ctypes.unsigned_int; // guess as its enum
	this.GFileMonitorFlags = ctypes.unsigned_int; // guess as its enum
	this.GFileQueryInfoFlags = ctypes.unsigned_int; // guess as its enum
	this.gint = ctypes.int;
	this.gint8 = ctypes.int8_t;
	this.gpointer = ctypes.void_t.ptr;
	this.GtkWidget = ctypes.StructType('GtkWidget');
	this.GtkWindow = ctypes.StructType('GtkWindow');
	this.GtkWindowPosition = ctypes.int;
	this.guchar = ctypes.unsigned_char;
	this.guint = ctypes.unsigned_int;
	this.guint32 = ctypes.uint32_t;
	this.guint64 = ctypes.uint64_t;
	this.gulong = ctypes.unsigned_long;

	// TYPEs - Level 2
	this.gboolean = this.gint;
	this.GQuark = this.guint32;

	//// STRUCTS
	// STRUCTs - Level GUESS
	this.GdkXEvent = this.XEvent;
	//this.GdkEvent = ctypes.StructType('GdkEvent', [

	//]);
	this.GdkEvent = ctypes.void_t;

	// https://developer.gnome.org/gdk3/stable/gdk3-Event-Structures.html#GdkEventButton
	this.GdkEventButton = ctypes.StructType('GdkEventType', [
		{ 'type': this.GdkEventType },
	    { 'window': this.GdkWindow.ptr },
	    { 'send_event': this.gint8 },
	    { 'time': this.guint32 },
	    { 'x': this.gdouble },
	    { 'y': this.gdouble },
	    { 'axes': this.gdouble.ptr },
	    { 'state': this.guint },
	    { 'button': this.guint },
	    { 'device': this.GdkDevice.ptr },
	    { 'x_root': this.gdouble },
	    { 'y_root': this.gdouble }
	]);
	// STRUCTs - Level 1
	this.GClosure = ctypes.StructType('GClosure');
	this.GError = ctypes.StructType('GError', [
		{'domain': this.GQuark},
		{'code': ctypes.int},
		{'message': ctypes.char.ptr}
	]);
	this.GList = ctypes.StructType('GList', [
		{'data': ctypes.voidptr_t},
		{'next': ctypes.voidptr_t},
		{'prev': ctypes.voidptr_t}
	]);

	//// FUNCTYPES
	// FUNCTTYPEs - Level 1
	this.GdkFilterFunc = ctypes.FunctionType(this.CALLBACK_ABI, this.GdkFilterReturn, [this.GdkXEvent.ptr, this.GdkEvent.ptr, this.gpointer]).ptr; // https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#GdkFilterFunc
	this.GClosureNotify = ctypes.FunctionType(this.CALLBACK_ABI, this.void, [this.gpointer, this.GClosure.ptr]).ptr; // https://developer.gnome.org/gobject/stable/gobject-Closures.html#GClosureNotify
	this.GFileMonitor_changed_signal = ctypes.FunctionType(this.CALLBACK_ABI, this.void, [this.GFileMonitor.ptr, this.GFile.ptr, this.GFile.ptr, this.GFileMonitorEvent, this.gpointer]).ptr; // void user_function (GFileMonitor *monitor, GFile *file, GFile *other_file, GFileMonitorEvent event_type, gpointer user_data) // the `GFileMonitor_changed_signal` name is my made up name
	this.GtkWidget_button_press_callback = ctypes.FunctionType(this.CALLBACK_ABI, this.gboolean, [this.GtkWidget.ptr, this.GdkEventButton.ptr, this.gpointer]).ptr; // https://developer.gnome.org/gtk3/stable/GtkWidget.html#GtkWidget-button-press-event // gboolean user_function (GtkWidget *widget, GdkEvent *event, gpointer user_data)
	// end - gtk

	/////////////// XCB stuff
	// SIMPLE TYPES
	// lots of types i cant find out there are found here file:///C:/Users/Vayeate/Downloads/xcb%20types/libxcb-1.9/doc/tutorial/index.html BUT this i am realizing is just from xproto.h - https://github.com/netzbasis/openbsd-xenocara/blob/e6500f41b55e38013ac9b489f66fe49df6b8b68c/lib/libxcb/src/xproto.h#L453
	this.iovec_count_t = this.unsigned_int;
	this.iovec_size_t = this.unsigned_int;
	this.xcb_atom_t = this.uint32_t;
	this.xcb_colormap_t = this.uint32_t;
	this.xcb_drawable_t = this.uint32_t;
	this.xcb_keycode_t = this.uint8_t;
	this.xcb_keysym_t = this.uint32_t; // https://github.com/netzbasis/openbsd-xenocara/blob/e6500f41b55e38013ac9b489f66fe49df6b8b68c/lib/libxcb/src/xproto.h#L159
	this.xcb_randr_crtc_t = this.uint32_t;
	this.xcb_randr_mode_t = this.uint32_t;
	this.xcb_randr_output_t = this.uint32_t;
	this.xcb_timestamp_t = this.uint32_t;
	this.xcb_visualid_t = this.uint32_t;
	this.xcb_window_t = this.uint32_t;

	///// STRUCTS
	// STRUCTs - Level -1
	this.xcb_extension_t = ctypes.StructType('xcb_extension_t', [
		{ name: this.char.ptr },
		{ global_id: this.int }
	]);

	// STRUCTs - Level 0
	this.iovec = ctypes.StructType('iovec', [
		{ data: this.void.ptr },
		{ len: this.iovec_size_t }
	]);
	this.xcb_client_message_data_t = ctypes.StructType('xcb_client_message_data_t', [ // union - https://xcb.freedesktop.org/manual/xproto_8h_source.html#l01151
		// { data8: this.uint8_t.array(20) }
		// { data32: this.uint16_t.array(10) }
		{ data32: this.uint32_t.array(5) }
	]);
	this.xcb_connection_t = ctypes.StructType('xcb_connection_t');
	this.xcb_generic_error_t = ctypes.StructType('xcb_generic_error_t', [
		{ response_type: this.uint8_t },
		{ error_code: this.uint8_t },
		{ sequence: this.uint16_t },
		{ resource_id: this.uint32_t },
		{ minor_code: this.uint16_t },
		{ major_code: this.uint8_t },
		{ pad0: this.uint8_t },
		{ pad: this.uint32_t.array(5) },
		{ full_sequence: this.uint32_t }
	]);
	this.xcb_generic_event_t = ctypes.StructType('xcb_generic_event_t', [
		{ response_type: this.uint8_t },
		{ pad0: this.uint8_t },
		{ sequence: this.uint16_t },
		{ pad: this.uint32_t.array(7) },
		{ full_sequence: this.uint32_t }
	]);
	this.xcb_get_geometry_reply_t = ctypes.StructType('xcb_get_geometry_reply_t', [
		{ response_type: this.uint8_t },
		{ depth: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ root: this.xcb_window_t },
		{ x: this.int16_t },
		{ y: this.int16_t },
		{ width: this.uint16_t },
		{ height: this.uint16_t },
		{ border_width: this.uint16_t },
		{ pad0: this.uint8_t.array(2) }
	]);
	this.xcb_get_image_reply_t = ctypes.StructType('xcb_get_image_reply_t', [
		{ response_type: this.uint8_t },
		{ depth: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ visual: this.xcb_visualid_t },
		{ pad0: this.uint8_t.array(20) }
	]);
	this.xcb_get_input_focus_reply_t = ctypes.StructType('xcb_get_input_focus_reply_t', [
		{ response_type: this.uint8_t },
		{ revert_to: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ focus: this.xcb_window_t }
	]);
	this.xcb_get_property_reply_t = ctypes.StructType('xcb_get_property_reply_t', [
		{ response_type: this.uint8_t },
		{ format: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ type: this.xcb_atom_t },
		{ bytes_after: this.uint32_t },
		{ value_len: this.uint32_t },
		{ pad0: this.uint8_t.array(12) }
	]);
	this.xcb_get_selection_owner_reply_t = ctypes.StructType('xcb_get_selection_owner_reply_t', [
		{ response_type: this.uint8_t },
		{ pad0: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ owner: this.xcb_window_t }
	]);
	this.xcb_get_window_attributes_reply_t = ctypes.StructType('xcb_get_window_attributes_reply_t', [ // http://www.linuxhowtos.org/manpages/3/xcb_get_window_attributes_unchecked.htm
		{ response_type: this.uint8_t },
		{ backing_store: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ visual: this.xcb_visualid_t },
		{ _class: this.uint16_t },
		{ bit_gravity: this.uint8_t },
		{ win_gravity: this.uint8_t },
		{ backing_planes: this.uint32_t },
		{ backing_pixel: this.uint32_t },
		{ save_under: this.uint8_t },
		{ map_is_installed: this.uint8_t },
		{ map_state: this.uint8_t },
		{ override_redirect: this.uint8_t },
		{ colormap: this.xcb_colormap_t },
		{ all_event_masks: this.uint32_t },
		{ your_event_mask: this.uint32_t },
		{ do_not_propagate_mask: this.uint16_t },
		{ pad0: this.uint8_t.array(2) }
	]);
	this.xcb_grab_keyboard_reply_t = ctypes.StructType('xcb_grab_keyboard_reply_t', [
		{ response_type: this.uint8_t },
		{ status: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t }
	]);
	this.xcb_intern_atom_reply_t = ctypes.StructType('xcb_intern_atom_reply_t', [
		{ response_type: this.uint8_t },
		{ pad0: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ atom: this.xcb_atom_t }
	]);
	this.xcb_key_press_event_t = ctypes.StructType('xcb_key_press_event_t', [ // https://github.com/netzbasis/openbsd-xenocara/blob/e6500f41b55e38013ac9b489f66fe49df6b8b68c/lib/libxcb/src/xproto.h#L523
		{ response_type: this.uint8_t },
		{ detail: this.xcb_keycode_t },
		{ sequence: this.uint16_t },
		{ time: this.xcb_timestamp_t },
		{ root: this.xcb_window_t },
		{ event: this.xcb_window_t },
		{ child: this.xcb_window_t },
		{ root_x: this.int16_t },
		{ root_y: this.int16_t },
		{ event_x: this.int16_t },
		{ event_y: this.int16_t },
		{ state: this.uint16_t },
		{ same_screen: this.uint8_t },
		{ pad0: this.uint8_t }
	]);
	this.xcb_key_symbols_t = ctypes.StructType('_XCBKeySymbols');
	this.xcb_protocol_request_t = ctypes.StructType('xcb_protocol_request_t', [
		{ count: this.size_t },
        { ext: this.xcb_extension_t.ptr },
        { opcode: this.uint8_t },
        { isvoid: this.uint8_t }
	]);
	this.xcb_query_tree_reply_t = ctypes.StructType('xcb_query_tree_reply_t', [
		{ response_type: this.uint8_t },
		{ pad0: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ root: this.xcb_window_t },
		{ parent: this.xcb_window_t },
		{ children_len: this.uint16_t },
		{ pad1: this.uint8_t.array(14) }
	]);
	this.xcb_randr_get_crtc_info_reply_t = ctypes.StructType('xcb_randr_get_crtc_info_reply_t', [ // http://www.linuxhowtos.org/manpages/3/xcb_randr_get_crtc_info_reply.htm
		{ response_type: this.uint8_t },
		{ status: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ timestamp: this.xcb_timestamp_t },
		{ x: this.int16_t },
		{ y: this.int16_t },
		{ width: this.uint16_t },
		{ height: this.uint16_t },
		{ mode: this.xcb_randr_mode_t },
		{ rotation: this.uint16_t },
		{ rotations: this.uint16_t },
		{ num_outputs: this.uint16_t },
		{ num_possible_outputs: this.uint16_t }
	]);
	this.xcb_randr_get_screen_resources_current_reply_t = ctypes.StructType('xcb_randr_get_screen_resources_current_reply_t', [ // http://www.linuxhowtos.org/manpages/3/xcb_randr_get_screen_resources_current_outputs_length.htm
		{ response_type: this.uint8_t },
		{ pad0: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ timestamp: this.xcb_timestamp_t },
		{ config_timestamp: this.xcb_timestamp_t },
		{ num_crtcs: this.uint16_t },
		{ num_outputs: this.uint16_t },
		{ num_modes: this.uint16_t },
		{ names_len: this.uint16_t },
		{ pad1: this.uint8_t.array(8) }
	]);
	this.xcb_randr_get_output_info_reply_t = ctypes.StructType('xcb_randr_get_screen_resources_current_reply_t', [ // http://www.linuxhowtos.org/manpages/3/xcb_randr_get_output_info_reply.htm
		{ response_type: this.uint8_t },
		{ status: this.uint8_t },
		{ sequence: this.uint16_t },
		{ length: this.uint32_t },
		{ timestamp: this.xcb_timestamp_t },
		{ crtc: this.xcb_randr_crtc_t },
		{ mm_width: this.uint32_t },
		{ mm_height: this.uint32_t },
		{ connection: this.uint8_t },
		{ subpixel_order: this.uint8_t },
		{ num_crtcs: this.uint16_t },
		{ num_modes: this.uint16_t },
		{ num_preferred: this.uint16_t },
		{ num_clones: this.uint16_t },
		{ name_len: this.uint16_t }
	]);

	this.xcb_screen_t = ctypes.StructType('xcb_screen_t', [
		{ root: this.xcb_window_t },
		{ default_colormap: this.xcb_colormap_t },
		{ white_pixel: this.uint32_t },
		{ black_pixel: this.uint32_t },
		{ current_input_masks: this.uint32_t },
		{ width_in_pixels: this.uint16_t },
		{ height_in_pixels: this.uint16_t },
		{ width_in_millimeters: this.uint16_t },
		{ height_in_millimeters: this.uint16_t },
		{ min_installed_maps: this.uint16_t },
		{ max_installed_maps: this.uint16_t },
		{ root_visual: this.xcb_visualid_t },
		{ backing_stores: this.uint8_t },
		{ save_unders: this.uint8_t },
		{ root_depth: this.uint8_t },
		{ allowed_depths_len: this.uint8_t }
	]);

	this.xcb_send_event_request_t = ctypes.StructType('xcb_send_event_request_t', [
		{ major_opcode: this.uint8_t },
		{ propagate: this.uint8_t },
		{ length: this.uint16_t },
		{ destination: this.xcb_window_t },
		{ event_mask: this.uint32_t },
		{ event: this.char.array(32) }
	]);

	this.xcb_setup_t = ctypes.StructType('xcb_setup_t', [ // https://github.com/netzbasis/openbsd-xenocara/blob/e6500f41b55e38013ac9b489f66fe49df6b8b68c/lib/libxcb/src/xproto.h#L453
		{ status: this.uint8_t },
		{ pad0: this.uint8_t },
		{ protocol_major_version: this.uint16_t },
		{ protocol_minor_version: this.uint16_t },
		{ length: this.uint16_t },
		{ release_number: this.uint32_t },
		{ resource_id_base: this.uint32_t },
		{ resource_id_mask: this.uint32_t },
		{ motion_buffer_size: this.uint32_t },
		{ vendor_len: this.uint16_t },
		{ maximum_request_length: this.uint16_t },
		{ roots_len: this.uint8_t },
		{ pixmap_formats_len: this.uint8_t },
		{ image_byte_order: this.uint8_t },
		{ bitmap_format_bit_order: this.uint8_t },
		{ bitmap_format_scanline_unit: this.uint8_t },
		{ bitmap_format_scanline_pad: this.uint8_t },
		{ min_keycode: this.xcb_keycode_t },
		{ max_keycode: this.xcb_keycode_t },
		{ pad1: this.uint8_t.array(4) }
	]);

	this.xcb_screen_iterator_t = ctypes.StructType('xcb_screen_iterator_t', [
		{ data: this.xcb_screen_t.ptr },
		{ rem: this.int },
		{ index: this.int }
	]);

	this.xcb_void_cookie_t = ctypes.StructType('xcb_void_cookie_t', [
		{ sequence: this.unsigned_int }
	]);

	// cookies
	/*
	this.xcb_get_image_cookie_t = ctypes.StructType('xcb_get_image_cookie_t', [
		{ sequence: this.unsigned_int }
	]);
	this.xcb_get_window_attributes_cookie_t = ctypes.StructType('xcb_get_window_attributes_cookie_t', [
		{ sequence: this.unsigned_int }
	]);
	this.xcb_randr_get_crtc_info_cookie_t = ctypes.StructType('xcb_randr_get_crtc_info_cookie_t',
		{ sequence: this.unsigned_int }
	);
	this.xcb_randr_get_output_info_cookie_t = ctypes.StructType('xcb_randr_get_output_info_cookie_t',
		{ sequence: this.unsigned_int }
	);
	this.xcb_randr_get_screen_resources_current_cookie_t = ctypes.StructType('xcb_randr_get_screen_resources_current_cookie_t',
		{ sequence: this.unsigned_int }
	);
	*/
	// i should do cookies like in the commented out section, however its just the same, so im just setting them equal to xcb_void_cookie_t
	this.xcb_get_geometry_cookie_t = this.xcb_void_cookie_t;
	this.xcb_get_image_cookie_t = this.xcb_void_cookie_t;
	this.xcb_get_input_focus_cookie_t = this.xcb_void_cookie_t;
	this.xcb_get_property_cookie_t = this.xcb_void_cookie_t;
	this.xcb_get_selection_owner_cookie_t = this.xcb_void_cookie_t;
	this.xcb_get_window_attributes_cookie_t = this.xcb_void_cookie_t;
	this.xcb_grab_keyboard_cookie_t = this.xcb_void_cookie_t;
	this.xcb_intern_atom_cookie_t = this.xcb_void_cookie_t;
	this.xcb_query_tree_cookie_t = this.xcb_void_cookie_t;
	this.xcb_randr_get_crtc_info_cookie_t = this.xcb_void_cookie_t;
	this.xcb_randr_get_output_info_cookie_t = this.xcb_void_cookie_t;
	this.xcb_randr_get_screen_resources_current_cookie_t = this.xcb_void_cookie_t;

	// STRUCTs - Level 2
	this.xcb_client_message_event_t = ctypes.StructType('xcb_client_message_event_t', [// http://www.linuxhowtos.org/manpages/3/xcb_client_message_event_t.htm // ftp://www.x.org/pub/X11R7.7/doc/man/man3/xcb_client_message_event_t.3.xhtml
		{ response_type: this.uint8_t },
		{ format: this.uint8_t },
		{ sequence: this.uint16_t },
		{ window: this.xcb_window_t },
		{ type: this.xcb_atom_t },
		{ data: this.xcb_client_message_data_t }
	]);
	this.xcb_icccm_get_text_property_reply_t = ctypes.StructType('xcb_icccm_get_text_property_reply_t', [
		{ _reply: this.xcb_get_property_reply_t.ptr },
		{ encoding: this.xcb_atom_t  },				/** Encoding used */
		{ name_len: this.unsigned_int  },				/** Length of the name field above */
		{ name: this.char.ptr },				/** Property value */
		{ format: this.unsigned_char  },				/** Format, may be 8, 16 or 32 */
	]);

	// end - xcb
};

var x11Init = function() {
	var self = this;

	this.IS64BIT = APP_64BIT;

	this.TYPE = new xlibTypes();

	// CONSTANTS
	// XAtom.h - https://github.com/simonkwong/Shamoov/blob/64aa8d3d0f69710db48691f69440ce23eeb41ad0/SeniorTeamProject/Bullet/btgui/OpenGLWindow/optionalX11/X11/Xatom.h
	// xlib.py - https://github.com/hazelnusse/sympy-old/blob/65f802573e5963731a3e7e643676131b6a2500b8/sympy/thirdparty/pyglet/pyglet/window/xlib/xlib.py#L88
	this.CONST = {
		//// C
		EINTR: 4,
		POLLIN: 0x0001,
		POLLOUT: 0x0004,
		POLLERR: 0x0008,
		POLLHUP: 0x0010,
		POLLNVAL: 0x0020,
		NAME_MAX: 255,
		/// inotify
		// from https://github.com/dsoprea/PyInotify/blob/980610f91d4c3819dce54988cfec8f138599cedf/inotify/constants.py
		// had to use https://github.com/D-Programming-Language/druntime/blob/61ba4b8d3c0052065c17ffc8eef4f11496f3db3e/src/core/sys/linux/sys/inotify.d#L53
			// cuz otherwise it would throw SyntaxError: octal literals and octal escape sequences are deprecated
	    // inotify_init1 flags.
	    IN_CLOEXEC: 0x80000, // octal!2000000
	    IN_NONBLOCK: 0x800, // octal!4000

	    // Supported events suitable for MASK parameter of INOTIFY_ADD_WATCH.
	    IN_ACCESS: 0x00000001,
	    IN_MODIFY: 0x00000002,
	    IN_ATTRIB: 0x00000004,
	    IN_CLOSE_WRITE: 0x00000008,
	    IN_CLOSE_NOWRITE: 0x00000010,
	    IN_OPEN: 0x00000020,
	    IN_MOVED_FROM: 0x00000040,
	    IN_MOVED_TO: 0x00000080,
	    IN_CREATE: 0x00000100,
	    IN_DELETE: 0x00000200,
	    IN_DELETE_SELF: 0x00000400,
	    IN_MOVE_SELF: 0x00000800,

	    // Events sent by kernel.
	    IN_UNMOUNT: 0x00002000, // Backing fs was unmounted.
	    IN_Q_OVERFLOW: 0x00004000, // Event queued overflowed.
	    IN_IGNORED: 0x00008000, // File was ignored.

	    // Special flags.
	    IN_ONLYDIR: 0x01000000, // Only watch the path if it is a directory.
	    IN_DONT_FOLLOW: 0x02000000, // Do not follow a sym link.
	    IN_MASK_ADD: 0x20000000, // Add to the mask of an already existing watch.
	    IN_ISDIR: 0x40000000, // Event occurred against dir.
	    IN_ONESHOT: 0x80000000, // Only send event once.
	    /// inotify

		//// GIO
		// GFileMonitorFlags
		G_FILE_MONITOR_NONE: 0,
		G_FILE_MONITOR_WATCH_MOUNTS: 1,
		G_FILE_MONITOR_SEND_MOVED: 2,
		G_FILE_MONITOR_WATCH_HARD_LINKS: 4,
		G_FILE_MONITOR_WATCH_MOVES: 8,

		// GFileMonitorEvent
		G_FILE_MONITOR_EVENT_CHANGED: 0,
		G_FILE_MONITOR_EVENT_CHANGES_DONE_HINT: 1,
		G_FILE_MONITOR_EVENT_DELETED: 2,
		G_FILE_MONITOR_EVENT_CREATED: 3,
		G_FILE_MONITOR_EVENT_ATTRIBUTE_CHANGED: 4,
		G_FILE_MONITOR_EVENT_PRE_UNMOUNT: 5,
		G_FILE_MONITOR_EVENT_UNMOUNTED: 6,
		G_FILE_MONITOR_EVENT_MOVED: 7,
		G_FILE_MONITOR_EVENT_RENAMED: 8,
		G_FILE_MONITOR_EVENT_MOVED_IN: 9,
		G_FILE_MONITOR_EVENT_MOVED_OUT: 10,

		// GConnectFlags
		G_CONNECT_AFTER: 1,
		G_CONNECT_SWAPPED: 2,

		//// X11
		AnyPropertyType: 0,
		BadAtom: 5,
		BadValue: 2,
		BadWindow: 3,
		False: 0,
		IsUnmapped: 0,
		IsUnviewable: 1,
		IsViewable: 2,
		None: 0,
		Success: 0,
		True: 1,
		XA_ATOM: 4,
		XA_CARDINAL: 6,
		XA_WINDOW: 33,
		RR_CONNECTED: 0,
		PropModeReplace: 0,
		PropModePrepend: 1,
		PropModeAppend: 2,
		ClientMessage: 33,
		_NET_WM_STATE_REMOVE: 0,
		_NET_WM_STATE_ADD: 1,
		_NET_WM_STATE_TOGGLE: 2,
		SubstructureRedirectMask: 1048576,
		SubstructureNotifyMask: 524288,
		ButtonPressMask: 4,
		ButtonReleaseMask: 8,
		ButtonPress: 4,
		ButtonRelease: 5,
		CurrentTime: 0,

		GrabModeSync: 0,
		GrabModeAsync: 1,
		GrabSuccess: 0,
		AlreadyGrabbed: 1,
		GrabInvalidTime: 2,
		GrabNotViewable: 3,
		GrabFrozen: 4,

		AsyncPointer: 0,
		SyncPointer: 1,
		ReplayPointer: 2,
		AsyncKeyboard: 3,
		SyncKeyboard: 4,
		ReplayKeyboard: 5,
		AsyncBoth: 6,
		SyncBoth: 7,

		NoEventMask: 0,
		KeyPressMask: 1,
		KeyReleaseMask: 2,
		ButtonPressMask: 4,
		ButtonReleaseMask: 8,
		EnterWindowMask: 16,
		LeaveWindowMask: 32,
		PointerMotionMask: 64,

		KeyPress: 2,
		KeyRelease: 3,
		AsyncKeyboard: 3,
		SyncKeyboard: 4,

		// GTK CONSTS
		GDK_FILTER_CONTINUE: 0,
		GDK_FILTER_TRANSLATE: 1,
		GDK_FILTER_REMOVE: 2,

		G_FILE_ATTRIBUTE_UNIX_INODE: 'unix::inode',
		G_FILE_QUERY_INFO_NONE: 0,
		G_FILE_QUERY_INFO_NOFOLLOW_SYMLINKS: 1,

		GDK_CURRENT_TIME: 0,

		// needs verification
		GDK_EXPOSURE_MASK: 1 << 1,
		GDK_POINTER_MOTION_MASK: 1 << 2,
		GDK_POINTER_MOTION_HINT_MASK: 1 << 3,
		GDK_BUTTON_MOTION_MASK: 1 << 4,
		GDK_BUTTON1_MOTION_MASK: 1 << 5,
		GDK_BUTTON2_MOTION_MASK: 1 << 6,
		GDK_BUTTON3_MOTION_MASK: 1 << 7,
		GDK_BUTTON_PRESS_MASK: 1 << 8, // verified
		GDK_BUTTON_RELEASE_MASK: 1 << 9,
		GDK_KEY_PRESS_MASK: 1 << 10,
		GDK_KEY_RELEASE_MASK: 1 << 11,
		GDK_ENTER_NOTIFY_MASK: 1 << 12,
		GDK_LEAVE_NOTIFY_MASK: 1 << 13,
		GDK_FOCUS_CHANGE_MASK: 1 << 14,
		GDK_STRUCTURE_MASK: 1 << 15,
		GDK_PROPERTY_CHANGE_MASK: 1 << 16,
		GDK_VISIBILITY_NOTIFY_MASK: 1 << 17,
		GDK_PROXIMITY_IN_MASK: 1 << 18,
		GDK_PROXIMITY_OUT_MASK: 1 << 19,
		GDK_SUBSTRUCTURE_MASK: 1 << 20,
		GDK_SCROLL_MASK: 1 << 21,
		GDK_ALL_EVENTS_MASK: 0x3FFFFE,

		// enum GdkModifierType
		GDK_SHIFT_MASK: 1 << 0,
		GDK_LOCK_MASK: 1 << 1,
		GDK_CONTROL_MASK: 1 << 2,
		GDK_MOD1_MASK: 1 << 3,
		GDK_MOD2_MASK: 1 << 4,
		GDK_MOD3_MASK: 1 << 5,
		GDK_MOD4_MASK: 1 << 6,
		GDK_MOD5_MASK: 1 << 7,
		GDK_BUTTON1_MASK: 1 << 8,
		GDK_BUTTON2_MASK: 1 << 9,
		GDK_BUTTON3_MASK: 1 << 10,
		GDK_BUTTON4_MASK: 1 << 11,
		GDK_BUTTON5_MASK: 1 << 12,
		GDK_SUPER_MASK: 1 << 26,
		GDK_HYPER_MASK: 1 << 27,
		GDK_META_MASK: 1 << 28,
		GDK_RELEASE_MASK: 1 << 30,
		GDK_MODIFIER_MASK: 0x5c001fff,

		// XCB CONSTS
		XCB_COPY_FROM_PARENT: 0,
		XCB_ALL_PLANES: 0xffffffff, // define XCB_ALL_PLANES ~0 i know its a ctypes.uint32_t so instead of doing ctypes.cast(ctypes.int(-1), ctypes.uint32_t).value.toString(16) i just type in the value

		// enum xcb_window_class_t {
		XCB_WINDOW_CLASS_COPY_FROM_PARENT: 0,
    	XCB_WINDOW_CLASS_INPUT_OUTPUT: 1,
		XCB_WINDOW_CLASS_INPUT_ONLY: 2,

		XCB_NONE: 0,
		XCB_CURRENT_TIME: 0,
		XCB_NO_SYMBOL: 0, // C:\Users\Mercurius\Downloads\libxcb-1.11.1\src\xcb.h line 206 ```#define XCB_NO_SYMBOL 0L```

		XCB_MOD_MASK_SHIFT: 1,
		XCB_MOD_MASK_LOCK: 2,
		XCB_MOD_MASK_CONTROL: 4,
		XCB_MOD_MASK_1: 8,
		XCB_MOD_MASK_2: 16,
		XCB_MOD_MASK_3: 32,
		XCB_MOD_MASK_4: 64,
		XCB_MOD_MASK_5: 128,
		XCB_MOD_MASK_ANY: 32768,

		XCB_GRAB_MODE_SYNC: 0,
		XCB_GRAB_MODE_ASYNC: 1,

		XCB_GRAB_STATUS_SUCCESS: 0,
		XCB_GRAB_STATUS_ALREADY_GRABBED: 1,
		XCB_GRAB_STATUS_INVALID_TIME: 2,
		XCB_GRAB_STATUS_NOT_VIEWABLE: 3,
		XCB_GRAB_STATUS_FROZEN: 4,

		XCB_ALLOW_ASYNC_POINTER: 0,
		XCB_ALLOW_SYNC_POINTER: 1,
		XCB_ALLOW_REPLAY_POINTER: 2,
		XCB_ALLOW_ASYNC_KEYBOARD: 3,
		XCB_ALLOW_SYNC_KEYBOARD: 4,
		XCB_ALLOW_REPLAY_KEYBOARD: 5,
		XCB_ALLOW_ASYNC_BOTH: 6,
		XCB_ALLOW_SYNC_BOTH: 7,

		XCB_KEY_PRESS: 2,
		XCB_KEY_RELEASE: 3,
		XCB_BUTTON_PRESS: 4,
		XCB_BUTTON_RELEASE: 5,
		XCB_MOTION_NOTIFY: 6,
		XCB_ENTER_NOTIFY: 7,
		XCB_LEAVE_NOTIFY: 8,
		XCB_FOCUS_IN: 9,
		XCB_FOCUS_OUT: 10,
		XCB_KEYMAP_NOTIFY: 11,
		XCB_EXPOSE: 12,
		XCB_GRAPHICS_EXPOSURE: 13,
		XCB_NO_EXPOSURE: 14,
		XCB_VISIBILITY_NOTIFY: 15,
		XCB_CREATE_NOTIFY: 16,
		XCB_DESTROY_NOTIFY: 17,
		XCB_UNMAP_NOTIFY: 18,
		XCB_MAP_NOTIFY: 19,
		XCB_MAP_REQUEST: 20,
		XCB_REPARENT_NOTIFY: 21,
		XCB_CONFIGURE_NOTIFY: 22,
		XCB_CONFIGURE_REQUEST: 23,
		XCB_GRAVITY_NOTIFY: 24,

		// enum xcb_input_focus_t
		XCB_INPUT_FOCUS_NONE: 0,
		XCB_INPUT_FOCUS_POINTER_ROOT: 1,
		XCB_INPUT_FOCUS_PARENT: 2,
		XCB_INPUT_FOCUS_FOLLOW_KEYBOARD: 3,

		// enum xcb_prop_mode_t {
		XCB_PROP_MODE_REPLACE: 0,
    	XCB_PROP_MODE_PREPEND: 1,
		XCB_PROP_MODE_APPEND: 2,

		// enum xcb_atom_enum_t // https://github.com/luminousone/dmedia/blob/2adad68fb72e86855176382a34d0fea671a7f68e/platforms/linux_x11/xcb/xcb.d#L438
		XCB_ATOM_NONE: 0,
		XCB_ATOM_ANY: 0,
		XCB_GET_PROPERTY_TYPE_ANY: 0,
		XCB_ATOM_ATOM: 4,
        XCB_ATOM_STRING: 31,
		XCB_ATOM_WINDOW: 33,
        XCB_ATOM_WM_NAME: 39,
		XCB_ATOM_WM_ICON_NAME: 37,

		XCB_EVENT_MASK_NO_EVENT: 0,
		XCB_EVENT_MASK_KEY_PRESS: 1,
		XCB_EVENT_MASK_KEY_RELEASE: 2,
		XCB_EVENT_MASK_BUTTON_PRESS: 4,
		XCB_EVENT_MASK_BUTTON_RELEASE: 8,
		XCB_EVENT_MASK_ENTER_WINDOW: 16,
		XCB_EVENT_MASK_LEAVE_WINDOW: 32,
		XCB_EVENT_MASK_POINTER_MOTION: 64,
		XCB_EVENT_MASK_POINTER_MOTION_HINT: 128,
		XCB_EVENT_MASK_BUTTON_1_MOTION: 256,
		XCB_EVENT_MASK_BUTTON_2_MOTION: 512,
		XCB_EVENT_MASK_BUTTON_3_MOTION: 1024,
		XCB_EVENT_MASK_BUTTON_4_MOTION: 2048,
		XCB_EVENT_MASK_BUTTON_5_MOTION: 4096,
		XCB_EVENT_MASK_BUTTON_MOTION: 8192,
		XCB_EVENT_MASK_KEYMAP_STATE: 16384,
		XCB_EVENT_MASK_EXPOSURE: 32768,
		XCB_EVENT_MASK_VISIBILITY_CHANGE: 65536,
		XCB_EVENT_MASK_STRUCTURE_NOTIFY: 131072,
		XCB_EVENT_MASK_RESIZE_REDIRECT: 262144,
		XCB_EVENT_MASK_SUBSTRUCTURE_NOTIFY: 524288,
		XCB_EVENT_MASK_SUBSTRUCTURE_REDIRECT: 1048576,
		XCB_EVENT_MASK_FOCUS_CHANGE: 2097152,
		XCB_EVENT_MASK_PROPERTY_CHANGE: 4194304,
		XCB_EVENT_MASK_COLOR_MAP_CHANGE: 8388608,
		XCB_EVENT_MASK_OWNER_GRAB_BUTTON: 16777216,

		// typedef enum xcb_map_state_t
		XCB_MAP_STATE_UNMAPPED: 0, // is ctypes.uint8_t because this is return value of map_state field in xcb_get_window_attributes_reply_t struct // https://xcb.freedesktop.org/manual/xproto_8h_source.html#l01489
		XCB_MAP_STATE_UNVIEWABLE: 1,
		XCB_MAP_STATE_VIEWABLE: 2,

		// is ctypes.uint8_t. so xcb_gravity_t is uint8_t as return value of bit_gravity in struct of xcb_get_window_attributes_reply_t
		// typedef enum xcb_gravity_t
		XCB_GRAVITY_BIT_FORGET: 0,
		XCB_GRAVITY_WIN_UNMAP: 0,
		XCB_GRAVITY_NORTH_WEST: 1,
		XCB_GRAVITY_NORTH: 2,
		XCB_GRAVITY_NORTH_EAST: 3,
		XCB_GRAVITY_WEST: 4,
		XCB_GRAVITY_CENTER: 5,
		XCB_GRAVITY_EAST: 6,
		XCB_GRAVITY_SOUTH_WEST: 7,
		XCB_GRAVITY_SOUTH: 8,
		XCB_GRAVITY_SOUTH_EAST: 9,
		XCB_GRAVITY_STATIC: 10,

		// enum xcb_config_window_t
	    XCB_CONFIG_WINDOW_X: 1,
	    XCB_CONFIG_WINDOW_Y: 2,
	    XCB_CONFIG_WINDOW_WIDTH: 4,
	    XCB_CONFIG_WINDOW_HEIGHT: 8,
	    XCB_CONFIG_WINDOW_BORDER_WIDTH: 16,
	    XCB_CONFIG_WINDOW_SIBLING: 32,
		XCB_CONFIG_WINDOW_STACK_MODE: 64,

		// enum xcb_stack_mode_t
		XCB_STACK_MODE_ABOVE: 0,
		XCB_STACK_MODE_BELOW: 1,
		XCB_STACK_MODE_TOP_IF: 2,
		XCB_STACK_MODE_BOTTOM_IF: 3,
		XCB_STACK_MODE_OPPOSITE: 4,

		// enum xcb_cw_t
	    XCB_CW_BACK_PIXMAP: 1,
	    XCB_CW_BACK_PIXEL: 2,
	    XCB_CW_BORDER_PIXMAP: 4,
	    XCB_CW_BORDER_PIXEL: 8,
	    XCB_CW_BIT_GRAVITY: 16,
	    XCB_CW_WIN_GRAVITY: 32,
	    XCB_CW_BACKING_STORE: 64,
	    XCB_CW_BACKING_PLANES: 128,
	    XCB_CW_BACKING_PIXEL: 256,
	    XCB_CW_OVERRIDE_REDIRECT: 512,
	    XCB_CW_SAVE_UNDER: 1024,
	    XCB_CW_EVENT_MASK: 2048,
	    XCB_CW_DONT_PROPAGATE: 4096,
	    XCB_CW_COLORMAP: 8192,
		XCB_CW_CURSOR: 16384,

		// xcbrandr
		XCB_RANDR_CONNECTION_CONNECTED: 0,
		XCB_RANDR_CONNECTION_DISCONNECTED: 1,
		XCB_RANDR_CONNECTION_UNKNOWN: 2,

		// enum xcb_image_format_t
		XCB_IMAGE_FORMAT_XY_BITMAP: 0,
		XCB_IMAGE_FORMAT_XY_PIXMAP: 1,
		XCB_IMAGE_FORMAT_Z_PIXMAP: 2,

		// enum xcb_send_request_flags_t
		XCB_REQUEST_CHECKED: 1 << 0,
		XCB_REQUEST_RAW: 1 << 1,
		XCB_REQUEST_DISCARD_REPLY: 1 << 2,

		// opcode's
		XCB_SEND_EVENT: 25,
		XCB_SELECTION_NOTIFY: 31,
		XCB_CLIENT_MESSAGE: 33,

		// enum xcb_send_event_dest_t
		XCB_SEND_EVENT_DEST_POINTER_WINDOW: 0,
 		XCB_SEND_EVENT_DEST_ITEM_FOCUS: 1,

		// GTK CONST
		EXPOSURE_MASK: 1 << 1,
		POINTER_MOTION_MASK: 1 << 2,
		POINTER_MOTION_HINT_MASK: 1 << 3,
		BUTTON_MOTION_MASK: 1 << 4,
		BUTTON1_MOTION_MASK: 1 << 5,
		BUTTON2_MOTION_MASK: 1 << 6,
		BUTTON3_MOTION_MASK: 1 << 7,
		BUTTON_PRESS_MASK: 1 << 8,
		BUTTON_RELEASE_MASK: 1 << 9,
		KEY_PRESS_MASK: 1 << 10,
		KEY_RELEASE_MASK: 1 << 11,
		ENTER_NOTIFY_MASK: 1 << 12,
		LEAVE_NOTIFY_MASK: 1 << 13,
		FOCUS_CHANGE_MASK: 1 << 14,
		STRUCTURE_MASK: 1 << 15,
		PROPERTY_CHANGE_MASK: 1 << 16,
		VISIBILITY_NOTIFY_MASK: 1 << 17,
		PROXIMITY_IN_MASK: 1 << 18,
		PROXIMITY_OUT_MASK: 1 << 19,
		SUBSTRUCTURE_MASK: 1 << 20,
		SCROLL_MASK: 1 << 21,
		ALL_EVENTS_MASK: 0x3FFFFE,

		// key codes - https://github.com/semonalbertyeah/noVNC_custom/blob/60daa01208a7e25712d17f67282497626de5704d/include/keysym.js#L216
		XK_VoidSymbol: 0xffffff,

		XK_BackSpace: 0xff08,
		XK_Tab: 0xff09,
		XK_Linefeed: 0xff0a,
		XK_Clear: 0xff0b,
		XK_Return: 0xff0d,
		XK_Pause: 0xff13,
		XK_Scroll_Lock: 0xff14,
		XK_Sys_Req: 0xff15,
		XK_Escape: 0xff1b,
		XK_Delete: 0xffff,

		// Cursor control & motion

		XK_Home: 0xff50,
		XK_Left: 0xff51,
		XK_Up: 0xff52,
		XK_Right: 0xff53,
		XK_Down: 0xff54,
		XK_Prior: 0xff55,
		XK_Page_Up: 0xff55,
		XK_Next: 0xff56,
		XK_Page_Down: 0xff56,
		XK_End: 0xff57,
		XK_Begin: 0xff58,


		// Misc functions

		XK_Select: 0xff60,
		XK_Print: 0xff61,
		XK_Execute: 0xff62,
		XK_Insert: 0xff63,
		XK_Undo: 0xff65,
		XK_Redo: 0xff66,
		XK_Menu: 0xff67,
		XK_Find: 0xff68,
		XK_Cancel: 0xff69,
		XK_Help: 0xff6a,
		XK_Break: 0xff6b,
		XK_Mode_switch: 0xff7e,
		XK_script_switch: 0xff7e,
		XK_Num_Lock: 0xff7f,

		// Keypad functions, keypad numbers cleverly chosen to map to ASCII

		XK_KP_Space: 0xff80,
		XK_KP_Tab: 0xff89,
		XK_KP_Enter: 0xff8d,
		XK_KP_F1: 0xff91,
		XK_KP_F2: 0xff92,
		XK_KP_F3: 0xff93,
		XK_KP_F4: 0xff94,
		XK_KP_Home: 0xff95,
		XK_KP_Left: 0xff96,
		XK_KP_Up: 0xff97,
		XK_KP_Right: 0xff98,
		XK_KP_Down: 0xff99,
		XK_KP_Prior: 0xff9a,
		XK_KP_Page_Up: 0xff9a,
		XK_KP_Next: 0xff9b,
		XK_KP_Page_Down: 0xff9b,
		XK_KP_End: 0xff9c,
		XK_KP_Begin: 0xff9d,
		XK_KP_Insert: 0xff9e,
		XK_KP_Delete: 0xff9f,
		XK_KP_Equal: 0xffbd,
		XK_KP_Multiply: 0xffaa,
		XK_KP_Add: 0xffab,
		XK_KP_Separator: 0xffac,
		XK_KP_Subtract: 0xffad,
		XK_KP_Decimal: 0xffae,
		XK_KP_Divide: 0xffaf,

		XK_KP_0: 0xffb0,
		XK_KP_1: 0xffb1,
		XK_KP_2: 0xffb2,
		XK_KP_3: 0xffb3,
		XK_KP_4: 0xffb4,
		XK_KP_5: 0xffb5,
		XK_KP_6: 0xffb6,
		XK_KP_7: 0xffb7,
		XK_KP_8: 0xffb8,
		XK_KP_9: 0xffb9,

		// Auxiliary functions; note the duplicate definitions for left and right
		// function keys;  Sun keyboards and a few other manufacturers have such
		// function key groups on the left and/or right sides of the keyboard.
		// We've not found a keyboard with more than 35 function keys total.

		XK_F1: 0xffbe,
		XK_F2: 0xffbf,
		XK_F3: 0xffc0,
		XK_F4: 0xffc1,
		XK_F5: 0xffc2,
		XK_F6: 0xffc3,
		XK_F7: 0xffc4,
		XK_F8: 0xffc5,
		XK_F9: 0xffc6,
		XK_F10: 0xffc7,
		XK_F11: 0xffc8,
		XK_L1: 0xffc8,
		XK_F12: 0xffc9,
		XK_L2: 0xffc9,
		XK_F13: 0xffca,
		XK_L3: 0xffca,
		XK_F14: 0xffcb,
		XK_L4: 0xffcb,
		XK_F15: 0xffcc,
		XK_L5: 0xffcc,
		XK_F16: 0xffcd,
		XK_L6: 0xffcd,
		XK_F17: 0xffce,
		XK_L7: 0xffce,
		XK_F18: 0xffcf,
		XK_L8: 0xffcf,
		XK_F19: 0xffd0,
		XK_L9: 0xffd0,
		XK_F20: 0xffd1,
		XK_L10: 0xffd1,
		XK_F21: 0xffd2,
		XK_R1: 0xffd2,
		XK_F22: 0xffd3,
		XK_R2: 0xffd3,
		XK_F23: 0xffd4,
		XK_R3: 0xffd4,
		XK_F24: 0xffd5,
		XK_R4: 0xffd5,
		XK_F25: 0xffd6,
		XK_R5: 0xffd6,
		XK_F26: 0xffd7,
		XK_R6: 0xffd7,
		XK_F27: 0xffd8,
		XK_R7: 0xffd8,
		XK_F28: 0xffd9,
		XK_R8: 0xffd9,
		XK_F29: 0xffda,
		XK_R9: 0xffda,
		XK_F30: 0xffdb,
		XK_R10: 0xffdb,
		XK_F31: 0xffdc,
		XK_R11: 0xffdc,
		XK_F32: 0xffdd,
		XK_R12: 0xffdd,
		XK_F33: 0xffde,
		XK_R13: 0xffde,
		XK_F34: 0xffdf,
		XK_R14: 0xffdf,
		XK_F35: 0xffe0,
		XK_R15: 0xffe0,

		// Modifiers

		XK_Shift_L: 0xffe1,
		XK_Shift_R: 0xffe2,
		XK_Control_L: 0xffe3,
		XK_Control_R: 0xffe4,
		XK_Caps_Lock: 0xffe5,
		XK_Shift_Lock: 0xffe6,

		XK_Meta_L: 0xffe7,
		XK_Meta_R: 0xffe8,
		XK_Alt_L: 0xffe9,
		XK_Alt_R: 0xffea,
		XK_Super_L: 0xffeb,
		XK_Super_R: 0xffec,
		XK_Hyper_L: 0xffed,
		XK_Hyper_R: 0xffee,

		XK_ISO_Level3_Shift: 0xfe03,

		// Latin 1
		// (ISO/IEC 8859-1: Unicode U+0020..U+00FF)
		// Byte 3: 0

		XK_space: 0x0020,
		XK_exclam: 0x0021,
		XK_quotedbl: 0x0022,
		XK_numbersign: 0x0023,
		XK_dollar: 0x0024,
		XK_percent: 0x0025,
		XK_ampersand: 0x0026,
		XK_apostrophe: 0x0027,
		XK_quoteright: 0x0027,
		XK_parenleft: 0x0028,
		XK_parenright: 0x0029,
		XK_asterisk: 0x002a,
		XK_plus: 0x002b,
		XK_comma: 0x002c,
		XK_minus: 0x002d,
		XK_period: 0x002e,
		XK_slash: 0x002f,
		XK_0: 0x0030,
		XK_1: 0x0031,
		XK_2: 0x0032,
		XK_3: 0x0033,
		XK_4: 0x0034,
		XK_5: 0x0035,
		XK_6: 0x0036,
		XK_7: 0x0037,
		XK_8: 0x0038,
		XK_9: 0x0039,
		XK_colon: 0x003a,
		XK_semicolon: 0x003b,
		XK_less: 0x003c,
		XK_equal: 0x003d,
		XK_greater: 0x003e,
		XK_question: 0x003f,
		XK_at: 0x0040,
		XK_A: 0x0041,
		XK_B: 0x0042,
		XK_C: 0x0043,
		XK_D: 0x0044,
		XK_E: 0x0045,
		XK_F: 0x0046,
		XK_G: 0x0047,
		XK_H: 0x0048,
		XK_I: 0x0049,
		XK_J: 0x004a,
		XK_K: 0x004b,
		XK_L: 0x004c,
		XK_M: 0x004d,
		XK_N: 0x004e,
		XK_O: 0x004f,
		XK_P: 0x0050,
		XK_Q: 0x0051,
		XK_R: 0x0052,
		XK_S: 0x0053,
		XK_T: 0x0054,
		XK_U: 0x0055,
		XK_V: 0x0056,
		XK_W: 0x0057,
		XK_X: 0x0058,
		XK_Y: 0x0059,
		XK_Z: 0x005a,
		XK_bracketleft: 0x005b,
		XK_backslash: 0x005c,
		XK_bracketright: 0x005d,
		XK_asciicircum: 0x005e,
		XK_underscore: 0x005f,
		XK_grave: 0x0060,
		XK_quoteleft: 0x0060,
		XK_a: 0x0061,
		XK_b: 0x0062,
		XK_c: 0x0063,
		XK_d: 0x0064,
		XK_e: 0x0065,
		XK_f: 0x0066,
		XK_g: 0x0067,
		XK_h: 0x0068,
		XK_i: 0x0069,
		XK_j: 0x006a,
		XK_k: 0x006b,
		XK_l: 0x006c,
		XK_m: 0x006d,
		XK_n: 0x006e,
		XK_o: 0x006f,
		XK_p: 0x0070,
		XK_q: 0x0071,
		XK_r: 0x0072,
		XK_s: 0x0073,
		XK_t: 0x0074,
		XK_u: 0x0075,
		XK_v: 0x0076,
		XK_w: 0x0077,
		XK_x: 0x0078,
		XK_y: 0x0079,
		XK_z: 0x007a,
		XK_braceleft: 0x007b,
		XK_bar: 0x007c,
		XK_braceright: 0x007d,
		XK_asciitilde: 0x007e,

		XF86ModeLock: 0x1008FF01,
		XF86MonBrightnessUp: 0x1008FF02,
		XF86MonBrightnessDown: 0x1008FF03,
		XF86KbdLightOnOff: 0x1008FF04,
		XF86KbdBrightnessUp: 0x1008FF05,
		XF86KbdBrightnessDown: 0x1008FF06,
		XF86Standby: 0x1008FF10,
		XF86AudioLowerVolume: 0x1008FF11,
		XF86AudioMute: 0x1008FF12,
		XF86AudioRaiseVolume: 0x1008FF13,
		XF86AudioPlay: 0x1008FF14,
		XF86AudioStop: 0x1008FF15,
		XF86AudioPrev: 0x1008FF16,
		XF86AudioNext: 0x1008FF17,
		XF86HomePage: 0x1008FF18,
		XF86Mail: 0x1008FF19,
		XF86Start: 0x1008FF1A,
		XF86Search: 0x1008FF1B,
		XF86AudioRecord: 0x1008FF1C,
		XF86Calculator: 0x1008FF1D,
		XF86Memo: 0x1008FF1E,
		XF86ToDoList: 0x1008FF1F,
		XF86Calendar: 0x1008FF20,
		XF86PowerDown: 0x1008FF21,
		XF86ContrastAdjust: 0x1008FF22,
		XF86RockerUp: 0x1008FF23,
		XF86RockerDown: 0x1008FF24,
		XF86RockerEnter: 0x1008FF25,
		XF86Back: 0x1008FF26,
		XF86Forward: 0x1008FF27,
		XF86Stop: 0x1008FF28,
		XF86Refresh: 0x1008FF29,
		XF86PowerOff: 0x1008FF2A,
		XF86WakeUp: 0x1008FF2B,
		XF86Eject: 0x1008FF2C,
		XF86ScreenSaver: 0x1008FF2D,
		XF86WWW: 0x1008FF2E,
		XF86Sleep: 0x1008FF2F,
		XF86Favorites: 0x1008FF30,
		XF86AudioPause: 0x1008FF31,
		XF86AudioMedia: 0x1008FF32,
		XF86MyComputer: 0x1008FF33,
		XF86VendorHome: 0x1008FF34,
		XF86LightBulb: 0x1008FF35,
		XF86Shop: 0x1008FF36,
		XF86History: 0x1008FF37,
		XF86OpenURL: 0x1008FF38,
		XF86AddFavorite: 0x1008FF39,
		XF86HotLinks: 0x1008FF3A,
		XF86BrightnessAdjust: 0x1008FF3B,
		XF86Finance: 0x1008FF3C,
		XF86Community: 0x1008FF3D,
		XF86AudioRewind: 0x1008FF3E,
		XF86BackForward: 0x1008FF3F,
		XF86Launch0: 0x1008FF40,
		XF86Launch1: 0x1008FF41,
		XF86Launch2: 0x1008FF42,
		XF86Launch3: 0x1008FF43,
		XF86Launch4: 0x1008FF44,
		XF86Launch5: 0x1008FF45,
		XF86Launch6: 0x1008FF46,
		XF86Launch7: 0x1008FF47,
		XF86Launch8: 0x1008FF48,
		XF86Launch9: 0x1008FF49,
		XF86LaunchA: 0x1008FF4A,
		XF86LaunchB: 0x1008FF4B,
		XF86LaunchC: 0x1008FF4C,
		XF86LaunchD: 0x1008FF4D,
		XF86LaunchE: 0x1008FF4E,
		XF86LaunchF: 0x1008FF4F,
		XF86ApplicationLeft: 0x1008FF50,
		XF86ApplicationRight: 0x1008FF51,
		XF86Book: 0x1008FF52,
		XF86CD: 0x1008FF53,
		XF86Calculater: 0x1008FF54,
		XF86Clear: 0x1008FF55,
		XF86Close: 0x1008FF56,
		XF86Copy: 0x1008FF57,
		XF86Cut: 0x1008FF58,
		XF86Display: 0x1008FF59,
		XF86DOS: 0x1008FF5A,
		XF86Documents: 0x1008FF5B,
		XF86Excel: 0x1008FF5C,
		XF86Explorer: 0x1008FF5D,
		XF86Game: 0x1008FF5E,
		XF86Go: 0x1008FF5F,
		XF86iTouch: 0x1008FF60,
		XF86LogOff: 0x1008FF61,
		XF86Market: 0x1008FF62,
		XF86Meeting: 0x1008FF63,
		XF86MenuKB: 0x1008FF65,
		XF86MenuPB: 0x1008FF66,
		XF86MySites: 0x1008FF67,
		XF86New: 0x1008FF68,
		XF86News: 0x1008FF69,
		XF86OfficeHome: 0x1008FF6A,
		XF86Open: 0x1008FF6B,
		XF86Option: 0x1008FF6C,
		XF86Paste: 0x1008FF6D,
		XF86Phone: 0x1008FF6E,
		XF86Q: 0x1008FF70,
		XF86Reply: 0x1008FF72,
		XF86Reload: 0x1008FF73,
		XF86RotateWindows: 0x1008FF74,
		XF86RotationPB: 0x1008FF75,
		XF86RotationKB: 0x1008FF76,
		XF86Save: 0x1008FF77,
		XF86ScrollUp: 0x1008FF78,
		XF86ScrollDown: 0x1008FF79,
		XF86ScrollClick: 0x1008FF7A,
		XF86Send: 0x1008FF7B,
		XF86Spell: 0x1008FF7C,
		XF86SplitScreen: 0x1008FF7D,
		XF86Support: 0x1008FF7E,
		XF86TaskPane: 0x1008FF7F,
		XF86Terminal: 0x1008FF80,
		XF86Tools: 0x1008FF81,
		XF86Travel: 0x1008FF82,
		XF86UserPB: 0x1008FF84,
		XF86User1KB: 0x1008FF85,
		XF86User2KB: 0x1008FF86,
		XF86Video: 0x1008FF87,
		XF86WheelButton: 0x1008FF88,
		XF86Word: 0x1008FF89,
		XF86Xfer: 0x1008FF8A,
		XF86ZoomIn: 0x1008FF8B,
		XF86ZoomOut: 0x1008FF8C,
		XF86Away: 0x1008FF8D,
		XF86Messenger: 0x1008FF8E,
		XF86WebCam: 0x1008FF8F,
		XF86MailForward: 0x1008FF90,
		XF86Pictures: 0x1008FF91,
		XF86Music: 0x1008FF92,
		XF86Battery: 0x1008FF93,
		XF86Bluetooth: 0x1008FF94,
		XF86WLAN: 0x1008FF95,
		XF86UWB: 0x1008FF96,
		XF86AudioForward: 0x1008FF97,
		XF86AudioRepeat: 0x1008FF98,
		XF86AudioRandomPlay: 0x1008FF99,
		XF86Subtitle: 0x1008FF9A,
		XF86AudioCycleTrack: 0x1008FF9B,
		XF86CycleAngle: 0x1008FF9C,
		XF86FrameBack: 0x1008FF9D,
		XF86FrameForward: 0x1008FF9E,
		XF86Time: 0x1008FF9F,
		XF86Select: 0x1008FFA0,
		XF86View: 0x1008FFA1,
		XF86TopMenu: 0x1008FFA2,
		XF86Red: 0x1008FFA3,
		XF86Green: 0x1008FFA4,
		XF86Yellow: 0x1008FFA5,
		XF86Blue: 0x1008FFA6,
		XF86Suspend: 0x1008FFA7,
		XF86Hibernate: 0x1008FFA8,
		XF86TouchpadToggle: 0x1008FFA9,
		XF86TouchpadOn: 0x1008FFB0,
		XF86TouchpadOff: 0x1008FFB1,
		XF86AudioMicMute: 0x1008FFB2,
		XF86Switch_VT_1: 0x1008FE01,
		XF86Switch_VT_2: 0x1008FE02,
		XF86Switch_VT_3: 0x1008FE03,
		XF86Switch_VT_4: 0x1008FE04,
		XF86Switch_VT_5: 0x1008FE05,
		XF86Switch_VT_6: 0x1008FE06,
		XF86Switch_VT_7: 0x1008FE07,
		XF86Switch_VT_8: 0x1008FE08,
		XF86Switch_VT_9: 0x1008FE09,
		XF86Switch_VT_10: 0x1008FE0A,
		XF86Switch_VT_11: 0x1008FE0B,
		XF86Switch_VT_12: 0x1008FE0C,
		XF86Ungrab: 0x1008FE20,
		XF86ClearGrab: 0x1008FE21,
		XF86Next_VMode: 0x1008FE22,
		XF86Prev_VMode: 0x1008FE23,
		XF86LogWindowTree: 0x1008FE24,
		XF86LogGrabInfo: 0x1008FE25
	};

	//////// ADVANCED CONST
	//// C
	this.CONST.IN_CLOSE = this.CONST.IN_CLOSE_WRITE | this.CONST.IN_CLOSE_NOWRITE;
	this.CONST.IN_MOVE = this.CONST.IN_MOVED_FROM | this.CONST.IN_MOVED_TO;
	this.CONST.IN_ALL_EVENTS = this.CONST.IN_ACCESS | this.CONST.IN_MODIFY | this.CONST.IN_ATTRIB | this.CONST.IN_CLOSE_WRITE | this.CONST.IN_CLOSE_NOWRITE | this.CONST.IN_OPEN | this.CONST.IN_MOVED_FROM | this.CONST.IN_MOVED_TO | this.CONST.IN_CREATE | this.CONST.IN_DELETE | this.CONST.IN_DELETE_SELF | this.CONST.IN_MOVE_SELF; // All events which a program can wait on.

	var _lib = {}; // cache for lib
	var libAttempter = function(aPath, aPrefered, aPossibles) {
		// place aPrefered at front of aPossibles
		if (aPrefered) {
			aPossibles.splice(aPossibles.indexOf(aPrefered), 1); // link123543939
			aPossibles.splice(0, 0, aPrefered);
		}

		for (var i=0; i<aPossibles.length; i++) {
			try {
				_lib[aPath] = ctypes.open(aPossibles[i]);
				break;
			} catch (ignore) {
				// on windows ignore.message == "couldn't open library rawr: error 126"
				// on ubuntu ignore.message == ""couldn't open library rawr: rawr: cannot open shared object file: No such file or directory""
			}
		}
		if (!_lib[aPath]) {
			throw new Error('Path to ' + aPath + ' on operating system of , "' + OS.Constants.Sys.Name + '" was not found. This does not mean it is not supported, it means that the author of this addon did not specify the proper name. Report this to author.');
		}
	};
	var lib = function(path) {
		//ensures path is in lib, if its in lib then its open, if its not then it adds it to lib and opens it. returns lib
		//path is path to open library
		//returns lib so can use straight away

		if (!(path in _lib)) {
			//need to open the library
			//default it opens the path, but some things are special like libc in mac is different then linux or like x11 needs to be located based on linux version
			switch (path) {
				case 'gdk2':

						var possibles = ['libgdk-x11-2.0.so.0'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'linux':
								preferred = 'libgdk-x11-2.0.so.0';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'gdk3':

						var possibles = ['libgdk-3.so.0'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'linux':
								preferred = 'libgdk-3.so.0';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'gdk32':

						// TODO: figure out some `possibles` for gdk3.2, firefox doesnt use 3.2 yet so low priority
						var possibles = ['I DONT KNOW ANY YET'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'gio':

						var possibles = ['libgio-2.0.so.0'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'linux':
								preferred = 'libgio-2.0.so.0';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'gtk2':

						var possibles = ['libgtk-x11-2.0.so.0'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'linux':
								preferred = 'libgtk-x11-2.0.so.0';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'gtk3':

						var possibles = ['libgtk-3.so.0'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'linux':
								preferred = 'libgtk-3.so.0';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'xcb':

						var possibles = ['libxcb.so', 'libxcb.so.1'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'freebsd': // physically unverified
							case 'openbsd': // physically unverified
							case 'android': // physically unverified
							case 'sunos': // physically unverified
							case 'netbsd': // physically unverified
							case 'dragonfly': // physcially unverified
							case 'gnu/kfreebsd': // physically unverified
							case 'linux':
								preferred = 'libxcb.so';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'xcbkey':

						var possibles = ['libxcb-keysyms.so', 'libxcb-keysyms.so.1'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'freebsd': // physically unverified
							case 'openbsd': // physically unverified
							case 'android': // physically unverified
							case 'sunos': // physically unverified
							case 'netbsd': // physically unverified
							case 'dragonfly': // physcially unverified
							case 'gnu/kfreebsd': // physically unverified
							case 'linux':
								preferred = 'libxcb-keysyms.so';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'xcbkey':

						var possibles = ['libxcb-keysyms.so', 'libxcb-keysyms.so.1'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'freebsd': // physically unverified
							case 'openbsd': // physically unverified
							case 'android': // physically unverified
							case 'sunos': // physically unverified
							case 'netbsd': // physically unverified
							case 'dragonfly': // physcially unverified
							case 'gnu/kfreebsd': // physically unverified
							case 'linux':
								preferred = 'libxcb-keysyms.so';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'xcbicccm':

						var possibles = ['libxcb-icccm.so', 'libxcb-icccm.so.4'];

						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'freebsd': // physically unverified
							case 'openbsd': // physically unverified
							case 'android': // physically unverified
							case 'sunos': // physically unverified
							case 'netbsd': // physically unverified
							case 'dragonfly': // physcially unverified
							case 'gnu/kfreebsd': // physically unverified
							case 'linux':
								preferred = 'libxcb-icccm.so.4';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'libc':

						var possibles = ['libc.dylib', 'libc.so.7', 'libc.so.61.0', 'libc.so', 'libc.so.6', 'libc.so.0.1'];
						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'darwin':
								preferred = 'libc.dylib';
								break;
							case 'freebsd':
								preferred = 'libc.so.7';
								break;
							case 'openbsd':
								preferred = 'libc.so.61.0';
								break;
							case 'android':
							case 'sunos':
							case 'netbsd': // physically unverified
							case 'dragonfly': // physcially unverified
								preferred = 'libc.so';
								break;
							case 'linux':
								preferred = 'libc.so.6';
								break;
							case 'gnu/kfreebsd': // physically unverified
								preferred = 'libc.so.0.1';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'x11':

						var possibles = ['libX11.dylib', 'libX11.so.7', 'libX11.so.61.0', 'libX11.so', 'libX11.so.6', 'libX11.so.0.1'];
						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'darwin': // physically unverified
								preferred = 'libX11.dylib';
								break;
							case 'freebsd': // physically unverified
								preferred = 'libX11.so.7';
								break;
							case 'openbsd': // physically unverified
								preferred = 'libX11.so.61.0';
								break;
							case 'sunos': // physically unverified
							case 'netbsd': // physically unverified
							case 'dragonfly': // physcially unverified
								preferred = 'libX11.so';
								break;
							case 'linux':
								preferred = 'libX11.so.6';
								break;
							case 'gnu/kfreebsd': // physically unverified
								preferred = 'libX11.so.0.1';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'xrandr':

						var possibles = ['libXrandr.so.2'];
						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'freebsd': // physically unverified
							case 'openbsd': // physically unverified
							case 'sunos': // physically unverified
							case 'netbsd': // physically unverified
							case 'dragonfly': // physcially unverified
							case 'linux':
							case 'gnu/kfreebsd': // physically unverified
								preferred = 'libXrandr.so.2';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				case 'xcbrandr':

						var possibles = ['libxcb-randr.so.0'];
						var preferred;
						// all values of preferred MUST exist in possibles reason is link123543939
						switch (OS_NAME) {
							case 'freebsd': // physically unverified
							case 'openbsd': // physically unverified
							case 'sunos': // physically unverified
							case 'netbsd': // physically unverified
							case 'dragonfly': // physcially unverified
							case 'linux':
							case 'gnu/kfreebsd': // physically unverified
								preferred = 'libxcb-randr.so.0';
								break;
							default:
								// do nothing
						}

						libAttempter(path, preferred, possibles);

					break;
				default:
					try {
						_lib[path] = ctypes.open(path);
					} catch (ex) {
						throw new Error({
							name: 'addon-error',
							message: 'Could not open ctypes library path of "' + path + '"',
							ex_msg: ex.message
						});
					}
			}
		}
		return _lib[path];
	};

	// start - function declares
	var _api = {};
	this.API = function(declaration) { // it means ensureDeclared and return declare. if its not declared it declares it. else it returns the previously declared.
		if (!(declaration in _api)) {
			_api[declaration] = preDec[declaration](); //if declaration is not in preDec then dev messed up
		}
		return _api[declaration];
	};

	// start - predefine your declares here
	var preDec = { //stands for pre-declare (so its just lazy stuff) //this must be pre-populated by dev // do it alphabateized by key so its ez to look through
		XAllPlanes: function() {
			/* http://tronche.com/gui/x/xlib/display/display-macros.html
			 * unsigned long XAllPlanes()
			 */
			return lib('x11').declare('XAllPlanes', self.TYPE.ABI,
				self.TYPE.unsigned_long	// return
			);
		},
		XAllowEvents: function() {
			/* http://www.x.org/releases/X11R7.6/doc/man/man3/XAllowEvents.3.xhtml
			 * int XAllowEvents(
			 *   Display *display,
			 *   int event_mode,
			 *   Time time
			 * );
			 */
			return lib('x11').declare('XAllowEvents', self.TYPE.ABI,
				self.TYPE.int,				// return
				self.TYPE.Display.ptr,		// *display
				self.TYPE.int,				// event_mode
				self.TYPE.Time				// time
			);
		},
		XBlackPixel: function() {
			/* http://tronche.com/gui/x/xlib/display/display-macros.html
			 * unsigned long XBlackPixel(
			 *   Display *display;
			 *   int screen_number;
			 * );
			 */
			return lib('x11').declare('XBlackPixel', self.TYPE.ABI,
				self.TYPE.unsigned_long,	// return
				self.TYPE.Display.ptr,		// *display
				self.TYPE.int				// screen_number
			);
		},
		XChangeActivePointerGrab: function() {
			/* http://www.x.org/releases/current/doc/man/man3/XGrabPointer.3.xhtml
			 * int XChangeActivePointerGrab (
			 *   Display *display,
			 *   unsigned_int event_mask,
			 *   Cursor cursor,
			 *   Time time
			 * );
			*/
			return lib('x11').declare('XChangeActivePointerGrab', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.unsigned_int,	// event_mask
				self.TYPE.Cursor,		// cursor
				self.TYPE.Time 			// time
			);
		},
		XChangeProperty: function() {
			/* http://www.xfree86.org/4.4.0/XChangeProperty.3.html
			 * int XChangeProperty(
			 *   Display *display,
			 *   Window w,
			 *   Atom property,
			 *   Atom type,
			 *   int format,
			 *   int mode,
			 *   unsigned char *data,
			 *   int nelements
			 * );
			 */
			return lib('x11').declare('XChangeProperty', self.TYPE.ABI,
				self.TYPE.int,				// return
				self.TYPE.Display.ptr,		// *display
				self.TYPE.Window,				// w
				self.TYPE.Atom,				// property
				self.TYPE.Atom,				// type
				self.TYPE.int,				// format
				self.TYPE.int,				// mode
				self.TYPE.unsigned_char.ptr,	// *data
				self.TYPE.int					// nelements
			);
		},
		XCheckMaskEvent: function() {
			/* https://tronche.com/gui/x/xlib/event-handling/manipulating-event-queue/XCheckMaskEvent.html
			 * Bool XCheckMaskEvent(
			 *   Display *display,
			 *   long event_mask,
			 *   XEvent *event_return
			 * );
			 */
			return lib('x11').declare('XCheckMaskEvent', self.TYPE.ABI,
				self.TYPE.Bool,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.long,			// event_mask
				self.TYPE.XEvent.ptr	// *event_return
			);
		},
		XCloseDisplay: function() {
			/* http://www.xfree86.org/4.4.0/XCloseDisplay.3.html
			 * int XCloseDisplay(
			 *   Display	*display
			 * );
			 */
			return lib('x11').declare('XCloseDisplay', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.Display.ptr	// *display
			);
		},
		XConnectionNumber: function() {
			/* http://tronche.com/gui/x/xlib/display/display-macros.html
			 * int XConnectionNumber(
			 *   Display *display;
			 * );
			 */
			return lib('x11').declare('XConnectionNumber', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr	// *display
			);
		},
		XCreateSimpleWindow: function() {
			/* http://tronche.com/gui/x/xlib/window/XCreateWindow.html
			 * Window XCreateSimpleWindow(
			 *   Display *display,
			 *   Window parent,
			 *   int x,
			 *   int y,
			 *   unsigned_int width, height,
			 *   unsigned_int border_width,
			 *   unsigned_long border,
			 *   unsigned_long background
			 * );
			 */
			return lib('x11').declare('XCreateSimpleWindow', self.TYPE.ABI,
				self.TYPE.Window,			// return
				self.TYPE.Display.ptr,		// *display
				self.TYPE.Window,			// parent
				self.TYPE.int,				// x
				self.TYPE.int,				// y
				self.TYPE.unsigned_int,		// width
				self.TYPE.unsigned_int,		// height
				self.TYPE.unsigned_int,		// border_width
				self.TYPE.unsigned_long,	// border
				self.TYPE.unsigned_long		// background
			);
		},
		XDefaultRootWindow: function() {
			/* http://www.xfree86.org/4.4.0/DefaultRootWindow.3.html
			 * Window DefaultRootWindow(
			 *   Display	*display
			 * );
			 */
			return lib('x11').declare('XDefaultRootWindow', self.TYPE.ABI,
				self.TYPE.Window,		// return
				self.TYPE.Display.ptr	// *display
			);
		},
		XDefaultScreen: function() {
			/* int XDefaultScreen(
			 *   Display *display;
			 * )
			 */
			return lib('x11').declare('XDefaultScreen', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr	// *display
			);
		},
		XDefaultScreenOfDisplay: function() {
			/* http://www.xfree86.org/4.4.0/DefaultScreenOfDisplay.3.html
			 * Screen *XDefaultScreenOfDisplay(
			 *   Display *display;
			 * )
			 */
			return lib('x11').declare('XDefaultScreenOfDisplay', self.TYPE.ABI,
				self.TYPE.Screen.ptr,		// return
				self.TYPE.Display.ptr		// *display
			);
		},
		XFlush: function() {
			/* http://www.xfree86.org/4.4.0/XFlush.3.html
			 * int XFlush(
			 *   Display	*display
			 * );
			 */
			return lib('x11').declare('XFlush', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.Display.ptr	// *display
			);
		},
		XFree: function() {
			/* http://www.xfree86.org/4.4.0/XFree.3.html
			 * int XFree(
			 *   void	*data
			 * );
			 */
			return lib('x11').declare('XFree', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.void.ptr	// *data
			);
		},
		XFreeStringList: function() {
			/* http://www.xfree86.org/4.4.0/XFreeStringList.3.html
			 * void XFreeStringList (
			 *   char **list
			 * );
			 */
			return lib('x11').declare('XFreeStringList', self.TYPE.ABI,
				self.TYPE.void,			// return
				self.TYPE.char.ptr.ptr	// **list
			);
		},
		XGetAtomNames: function() {
			/* NOTE: XGetAtomNames() is more efficient, but doesn't exist in X11R5. Source: https://github.com/JohnArchieMckown/nedit/blob/b4560954930d28113086b5471ffcda27a3d28e77/source/server_common.c#L130
			 * http://www.x.org/releases/X11R7.5/doc/man/man3/XGetAtomNames.3.html
			 * Status XGetAtomNames (
			 *   Display *display,
			 *   Atom *atoms,
			 *   int count,
			 *   char **names_return
			 * );
			 */
			return lib('x11').declare('XGetAtomNames', self.TYPE.ABI,
				self.TYPE.Status,		// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.Atom.ptr,		// *atoms
				self.TYPE.int,			// count
				self.TYPE.char.ptr.ptr	// **names_return
			);
		},
		XGetGeometry: function() {
			/* http://www.xfree86.org/4.4.0/XGetGeometry.3.html
			 * Status XGetGeometry(
			 *   Display 		*display,
			 *   Drawable		d,	// It is legal to pass an InputOnly window as a drawable to this request.
			 *   Window			*root_return,
			 *   int			*x_return,
			 *   int			*y_return,
			 *   unsigned int	*width_return,
			 *   unsigned int	*height_return,
			 *   unsigned int	*border_width_return,
			 *   unsigned int	*depth_return
			 * );
			 */
			return lib('x11').declare('XGetGeometry', self.TYPE.ABI,
				self.TYPE.Status,			// return
				self.TYPE.Display.ptr,		// *display
				self.TYPE.Drawable,			// d
				self.TYPE.Window.ptr,		// *root_return
				self.TYPE.int.ptr,			// *x_return
				self.TYPE.int.ptr,			// *y_return
				self.TYPE.unsigned_int.ptr,	// *width_return
				self.TYPE.unsigned_int.ptr,	// *height_return
				self.TYPE.unsigned_int.ptr,	// *border_width_return
				self.TYPE.unsigned_int.ptr	// *depth_return
			);
		},
		XGetImage: function() {
			/* http://www.xfree86.org/4.4.0/XGetImage.3.html
			 * XImage *XGetImage (
			 *   Display *display,
			 *   Drawable d,
			 *   int x,
			 *   int y,
			 *   unsigned int width,
			 *   unsigned int height,
			 *   unsigned long plane_mask,
			 *   int format
			 * );
			 */
			return lib('x11').declare('XGetImage', self.TYPE.ABI,
				self.TYPE.XImage.ptr,		// return
				self.TYPE.Display.ptr,		// *display,
				self.TYPE.Drawable,			// d,
				self.TYPE.int,				// x,
				self.TYPE.int,				// y,
				self.TYPE.unsigned_int,		// width,
				self.TYPE.unsigned_int,		// height,
				self.TYPE.unsigned_long,	// plane_mask,
				self.TYPE.int				// format
			);
		},
		XGetInputFocus: function() {
			/* http://www.x.org/releases/X11R7.6/doc/man/man3/XGetInputFocus.3.xhtml
			 * int XGetInputFocus(
			 *   Display *display,
			 *   Window *focus_return,
			 *   int *revert_to_return
			 * );
			 */
			return lib('x11').declare('XGetInputFocus', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.Window.ptr,	// *focus_return
				self.TYPE.int.ptr		// *revert_to_return
			);
		},
		XGetWindowAttributes: function() {
			/* http://www.xfree86.org/4.4.0/XGetWindowAttributes.3.html
			 * Status XGetWindowAttributes(
			 *   Display			*display,
			 *   Window 			w,
			 *   XWindowAttributes	*window_attributes_return
			 * );
			 */
			return lib('x11').declare('XGetWindowAttributes', self.TYPE.ABI,
				self.TYPE.Status,				// return
				self.TYPE.Display.ptr,			// *display
				self.TYPE.Window,				// w
				self.TYPE.XWindowAttributes.ptr	// *window_attributes_return
			);
		},
		XGetWindowProperty: function() {
			/* http://www.xfree86.org/4.4.0/XGetWindowProperty.3.html
			 * int XGetWindowProperty(
			 *   Display		*display,
			 *   Window			w,
			 *   Atom			property,
			 *   long			long_offset,
			 *   long			long_length,
			 *   Bool			delete,
			 *   Atom			req_type,
			 *   Atom			*actual_type_return,
			 *   int			*actual_format_return,
			 *   unsigned long	*nitems_return,
			 *   unsigned long	*bytes_after_return,
			 *   unsigned char	**prop_return
			 * );
			 */
			return lib('x11').declare('XGetWindowProperty', self.TYPE.ABI,
				self.TYPE.int,					// return
				self.TYPE.Display.ptr,			// *display
				self.TYPE.Window,				// w
				self.TYPE.Atom,					// property
				self.TYPE.long,					// long_offset
				self.TYPE.long,					// long_length
				self.TYPE.Bool,					// delete
				self.TYPE.Atom,					// req_type
				self.TYPE.Atom.ptr,				// *actual_type_return
				self.TYPE.int.ptr,				// *actual_format_return
				self.TYPE.unsigned_long.ptr,	// *nitems_return
				self.TYPE.unsigned_long.ptr,	// *bytes_after_return
				self.TYPE.unsigned_char.ptr.ptr	// **prop_return
			);
		},
		XGetWMName: function() {
			/* http://www.xfree86.org/4.4.0/XGetWMName.3.html
			 * Status XGetWMName(
			 *   Display		*display,
			 *   Window			w,
			 *   XTextProperty	*text_prop_return
			 * );
			 */
			 return lib('x11').declare('XGetWMName', self.TYPE.ABI,
				self.TYPE.Status,				// return
				self.TYPE.Display.ptr,			// *display
				self.TYPE.Window,				// w
				self.TYPE.XTextProperty.ptr		// *text_prop_return
			);
		},
		XGrabKey: function() {
			/* http://www.x.org/releases/current/doc/man/man3/XGrabKey.3.xhtml
			 * https://tronche.com/gui/x/xlib/input/XGrabKey.html
			 * int XGrabKey(
			 * Display *display,
			 * int keycode,
			 * unsigned int modifiers,
			 * Window grab_window,
			 * Bool owner_events,
			 * int pointer_mode,
			 * int keyboard_mode
			 * )
			 */
			return lib('x11').declare('XGrabKey', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.int,			// keycode
				self.TYPE.unsigned_int,	// modifiers
				self.TYPE.Window,		// grab_window
				self.TYPE.Bool,			// owner_events
				self.TYPE.int,			// pointer_mode
				self.TYPE.int			// keyboard_mode
			);
		},
		XLookupString: function() {
			/* https://tronche.com/gui/x/xlib/utilities/XLookupString.html
			 * int XLookupString(
			 *   XKeyEvent *event_struct;
			 *   char *buffer_return;
			 *   int bytes_buffer;
			 *   KeySym *keysym_return;
			 *   XComposeStatus *status_in_out;
			 * );
			 */
			return lib('x11').declare('XLookupString', self.TYPE.ABI,
				self.TYPE.int,					// return
				self.TYPE.XKeyEvent.ptr,		// *event_struct
				self.TYPE.char.ptr,				// *buffer_return
				self.TYPE.int,					// bytes_buffer
				self.TYPE.KeySym.ptr,			// *keysym_return
				self.TYPE.XComposeStatus.ptr	// *status_in_out
			);
		},
		XGrabPointer: function() {
			/* http://www.x.org/releases/current/doc/man/man3/XGrabPointer.3.xhtml
			 * int XGrabPointer(
			 *   Display *display,
			 *   Window grab_window,
			 *   Bool owner_events,
			 *   unsigned int event_mask,
			 *   int pointer_mode,
			 *   int keyboard_mode,
			 *   Window confine_to,
			 *   Cursor cursor,
			 *   Time time
			 * );
			*/
			return lib('x11').declare('XGrabPointer', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.Window, 		// grab_window
				self.TYPE.Bool, 		// owner_events
				self.TYPE.unsigned_int,	// event_mask
				self.TYPE.int, 			// pointer_mode
				self.TYPE.int, 			// keyboard_mode
				self.TYPE.Window, 		// confine_to
				self.TYPE.Cursor, 		// cursor
				self.TYPE.Time 			// time
			);
		},
		XHeightOfScreen: function() {
			/* http://www.xfree86.org/4.4.0/HeightOfScreen.3.html
			 * int HeightOfScreen(
			 *   Screen	*screen
			 * );
			 */
			return lib('x11').declare('XHeightOfScreen', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.Screen.ptr	// *screen
			);
		},
		XInitThreads: function() {
			/* http://www.x.org/archive/X11R6.8.1/doc/XInitThreads.3.html
			 * Status XInitThreads (
			 *   void
			 * )
			 */
			return lib('x11').declare('XInitThreads', self.TYPE.ABI,
				self.TYPE.Status
			);
		},
		XInternAtom: function() {
			/* http://www.xfree86.org/4.4.0/XInternAtom.3.html
			 * Atom XInternAtom(
			 *   Display	*display,
			 *   char		*atom_name,
			 *   Bool		only_if_exists
			 * );
			 */
			 return lib('x11').declare('XInternAtom', self.TYPE.ABI,
				self.TYPE.Atom,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.char.ptr,		// *atom_name
				self.TYPE.Bool			// only_if_exists
			);
		},
		XKeysymToKeycode: function() {
			/* http://domesjo.se/xlib/utilities/keyboard/XKeysymToKeycode.html
			 * KeyCode XKeysymToKeycode(
			 *   Display *display,
			 *   KeySym keysym
			 * )
			 */
			return lib('x11').declare('XKeysymToKeycode', self.TYPE.ABI,
				self.TYPE.KeyCode,		// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.KeySym		// keysym
			);
		},
		XListProperties: function() {
			/* http://tronche.com/gui/x/xlib/window-information/XListProperties.html
			 * Atom *XListProperties(
			 *   Display *display,
			 *   Window w,
			 *   int *num_prop_return
			 * )
			 */
			return lib('x11').declare('XListProperties', self.TYPE.ABI,
				self.TYPE.Atom.ptr,			// return
				self.TYPE.Display.ptr,		// *display
				self.TYPE.Window,			// w
				self.TYPE.int.ptr			// *num_prop_return
			);
		},
		XMapWindow: function() {
			/* http://www.x.org/releases/current/doc/man/man3/XMapWindow.3.xhtml
			 * int XMapWindow (
			 *   Display *display,
			 *   Window w
			 * );
			 */
			return lib('x11').declare('XMapWindow', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.Window		// w
			);
		},
		XMapRaised: function() {
			/* http://www.x.org/archive/X11R7.5/doc/man/man3/XMapRaised.3.html
			 * int XMapRaised (
			 *   Display *display,
			 *   Window w
			 * );
			 */
			return lib('x11').declare('XMapRaised', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.Window		// w
			);
		},
		XMaskEvent: function() {
			/* https://tronche.com/gui/x/xlib/event-handling/manipulating-event-queue/XMaskEvent.html
			 * int XMaskEvent(
			 *   Display *display,
			 *   long event_mask,
			 *   XEvent *event_return
			 * );
			 */
			return lib('x11').declare('XMaskEvent', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.long,			// event_mask
				self.TYPE.XEvent.ptr	// *event_return
			);
		},
		XNextEvent: function() {
			/* http://www.x.org/releases/current/doc/man/man3/XNextEvent.3.xhtml
			 * int XNextEvent (
			 *   Display *display,
			 *   XEvent *event_return
			 * );
			 */
			return lib('x11').declare('XNextEvent', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.XEvent.ptr	// *event_return
			);
		},
		XOpenDisplay: function() {
			/* http://www.xfree86.org/4.4.0/XOpenDisplay.3.html
			 * Display *XOpenDisplay(
			 *   char	*display_name
			 * );
			 */
			return lib('x11').declare('XOpenDisplay', self.TYPE.ABI,
				self.TYPE.Display.ptr,	// return
				self.TYPE.char.ptr		// *display_name
			);
		},
		XPending: function() {
			/* http://tronche.com/gui/x/xlib/event-handling/XPending.html
			 * int XPending (
			 *   Display *display
			 * );
			 */
			return lib('x11').declare('XPending', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr	// *display
			);
		},
		XPutBackEvent: function() {
			/* www.xfree86.org/4.4.0/XPutBackEvent.3.html
			 * XPutBackEvent(
			 *   Display *display,
			 *   XEvent *event
			 * );
			 */
			return lib('x11').declare('XPutBackEvent', self.TYPE.ABI,
				self.TYPE.void,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.XEvent.ptr	// *event
			);
		},
		XQueryTree: function() {
			/* http://tronche.com/gui/x/xlib/window-information/XQueryTree.html
			 * Status XQueryTree (
			 *   Display *display,
			 *   Window w,
			 *   Window *root_return,
			 *   Window *parent_return,
			 *   Window **children_return,
			 *   unsigned int *nchildren_return
			 * )
			 */
			return lib('x11').declare('XQueryTree', self.TYPE.ABI,
				self.TYPE.Status,			// return
				self.TYPE.Display.ptr,		// *display
				self.TYPE.Window,			// w
				self.TYPE.Window.ptr,		// *root_return
				self.TYPE.Window.ptr,		// *parent_return
				self.TYPE.Window.ptr.ptr,	// **children_return
				self.TYPE.unsigned_int.ptr	// *nchildren_return
			);
		},
		XRootWindow: function() {
			/* http://tronche.com/gui/x/xlib/display/display-macros.html
			 * Window XRootWindow (
			 *   Display *display,
			 *   int screen_number
			 * );
			 */
			return lib('x11').declare('XRootWindow', self.TYPE.ABI,
				self.TYPE.Window,			// return
				self.TYPE.Display.ptr,		// *display
				self.TYPE.int				// screen_number
			);
		},
		XSelectInput: function() {
			/* http://www.x.org/releases/X11R7.6/doc/man/man3/XSelectInput.3.xhtml
			 * int XSelectInput(
			 *   Display *display;
			 *   Window w;
			 *   long event_mask;
			 * );
			 */
			return lib('x11').declare('XSelectInput', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.Window,		// w
				self.TYPE.long			// event_mask
			);
		},
		XSendEvent: function() {
			/* http://www.xfree86.org/4.4.0/XSendEvent.3.html
			 * Status XSendEvent(
			 *   Display *display,
			 *   Window w,
			 *   Bool propagate,
			 *   long event_mask,
			 *   XEvent *event_send
			 * );
			 */
			return lib('x11').declare('XSendEvent', self.TYPE.ABI,
				self.TYPE.Status,		// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.Window,		// w
				self.TYPE.Bool,			// propagate
				self.TYPE.long,			// event_mask
				self.TYPE.XEvent.ptr	// *event_sent
			);
		},
		XSync: function() {
			/* http://linux.die.net/man/3/xsync
			 * int XSync(Display *display, Bool discard);
			 */
			return lib('x11').declare('XSync', self.TYPE.ABI,
				self.TYPE.int,				// return
				self.TYPE.Display.ptr,		// *display
				self.TYPE.Bool				// discard
			);
		},
		XTranslateCoordinates: function() {
			/* http://www.xfree86.org/4.4.0/XTranslateCoordinates.3.html
			 * Bool XTranslateCoordinates(
			 *   Display	*display,
			 *   Window		src_w,
			 *   Window		dest_w,
			 *   int		src_x,
			 *   int		src_y,
			 *   int		*dest_x_return,
			 *   int		*dest_y_return,
			 *   Window		*child_return
			 * );
			 */
			return lib('x11').declare('XTranslateCoordinates', self.TYPE.ABI,
				self.TYPE.Bool,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.Window,			// src_w
				self.TYPE.Window,			// dest_w
				self.TYPE.int,			// src_x
				self.TYPE.int,			// src_y
				self.TYPE.int.ptr,		// *dest_x_return
				self.TYPE.int.ptr,		// *dest_y_return
				self.TYPE.Window.ptr		// *child_return
			);
		},
		XUngrabKey: function() {
			/* http://www.x.org/releases/current/doc/man/man3/XGrabKey.3.xhtml
			 * int XUngrabKey(
			 *   Display *display,
			 *   int keycode,
			 *   unsigned int modifiers,
			 *   Window grab_window
			 * );
			 */
			return lib('x11').declare('XUngrabKey', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.int,			// keycode
				self.TYPE.unsigned_int,	// modifiers
				self.TYPE.Window		// grab_window
			);
		},
		XUngrabPointer: function() {
			/* http://www.x.org/releases/current/doc/man/man3/XUngrabPointer.3.xhtml
			 * int XUngrabPointer(
			 *   Display *display,
			 *   Time time
			 * );
			*/
			return lib('x11').declare('XUngrabPointer', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.Display.ptr,	// *display
				self.TYPE.Time 			// time
			);
		},
		XWidthOfScreen: function() {
			/* http://www.xfree86.org/4.4.0/WidthOfScreen.3.html
			 * int WidthOfScreen(
			 *   Screen	*screen
			 * );
			 */
			return lib('x11').declare('XWidthOfScreen', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.Screen.ptr	// *screen
			);
		},
		// start - XRANDR
		XRRGetScreenResources: function() {
			/* http://cgit.freedesktop.org/xorg/lib/libXrandr/tree/src/XrrScreen.c
			 * XRRScreenResources *XRRGetScreenResources(
			 *   Display *dpy,
			 *   Window window
			 * )
			 */
			return lib('xrandr').declare('XRRGetScreenResources', self.TYPE.ABI,
				self.TYPE.XRRScreenResources.ptr,		// return
				self.TYPE.Display.ptr,					// *dpy
				self.TYPE.Window						// window
			);
		},
		XRRGetOutputInfo: function() {
			/* http://cgit.freedesktop.org/xorg/lib/libXrandr/tree/src/XrrOutput.c
			 * XRROutputInfo *XRRGetOutputInfo (
			 *   Display *dpy,
			 *   XRRScreenResources *resources,
			 *   RROutput output
			 * )
			 */
			return lib('xrandr').declare('XRRGetOutputInfo', self.TYPE.ABI,
				self.TYPE.XRROutputInfo.ptr,		// return
				self.TYPE.Display.ptr,				// *dpy
				self.TYPE.XRRScreenResources.ptr,	// *resources
				self.TYPE.RROutput					// output
			);
		},
		XRRGetCrtcInfo: function() {
			/* http://cgit.freedesktop.org/xorg/lib/libXrandr/tree/src/XrrCrtc.c
			 * XRRCrtcInfo *XRRGetCrtcInfo (
			 *   Display *dpy,
			 *   XRRScreenResources *resources,
			 *   RRCrtc crtc
			 * )
			 */
			return lib('xrandr').declare('XRRGetCrtcInfo', self.TYPE.ABI,
				self.TYPE.XRRCrtcInfo.ptr,		// return
				self.TYPE.Display.ptr,					// *dpy
				self.TYPE.XRRScreenResources.ptr,		// *resources
				self.TYPE.RRCrtc						// crtc
			);
		},
		XRRFreeCrtcInfo: function() {
			/* http://cgit.freedesktop.org/xorg/lib/libXrandr/tree/src/XrrCrtc.c
			 * void XRRFreeCrtcInfo (
			 *   XRRCrtcInfo *crtcInfo
			 * )
			 */
			return lib('xrandr').declare('XRRFreeCrtcInfo', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.XRRCrtcInfo.ptr	// *crtcInfo
			);
		},
		XRRFreeOutputInfo: function() {
			/* http://cgit.freedesktop.org/xorg/lib/libXrandr/tree/src/XrrOutput.c
			 * void XRRFreeOutputInfo (
			 *   XRROutputInfo *outputInfo
			 * )
			 */
			return lib('xrandr').declare('XRRFreeOutputInfo', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.XRROutputInfo.ptr	// *outputInfo
			);
		},
		XRRFreeScreenResources: function() {
			/* http://cgit.freedesktop.org/xorg/lib/libXrandr/tree/src/XrrScreen.c
			 * void XRRFreeScreenResources (
			 *   XRRScreenResources *resources
			 * )
			 */
			return lib('xrandr').declare('XRRFreeScreenResources', self.TYPE.ABI,
				self.TYPE.void,						// return
				self.TYPE.XRRScreenResources.ptr	// *resources
			);
		},
		// end - XRANDR
		// start - gtk
		g_app_info_get_commandline: function() {
			/* https://developer.gnome.org/gio/stable/GAppInfo.html#g-app-info-get-commandline
			 * const char *g_app_info_get_commandline (
			 *   GAppInfo *appinfo
			 * );
			 */
			return lib('gio').declare('g_app_info_get_commandline', self.TYPE.ABI,
				self.TYPE.char.ptr,		// return
				self.TYPE.GAppInfo.ptr	// *appinfo
			);
		},
		g_app_info_get_default_for_uri_scheme: function() {
			/* https://developer.gnome.org/gio/stable/GAppInfo.html#g-app-info-get-default-for-uri-scheme
			 * GAppInfo * g_app_info_get_default_for_uri_scheme (
			 *   const char *uri_scheme
			 * );
			 */
			return lib('gio').declare('g_app_info_get_default_for_uri_scheme', self.TYPE.ABI,
				self.TYPE.GAppInfo.ptr,		// return
				self.TYPE.char.ptr			// *uri_scheme
			);
		},
		g_app_info_get_executable: function() {
			/* https://developer.gnome.org/gio/stable/GAppInfo.html#g-app-info-get-executable
			 * const char *g_app_info_get_executable (
			 *   GAppInfo *appinfo
			 * );
			 */
			return lib('gio').declare('g_app_info_get_executable', self.TYPE.ABI,
				self.TYPE.char.ptr,		// return
				self.TYPE.GAppInfo.ptr	// *appinfo
			);
		},
		g_app_info_launch_uris: function() {
			/* https://developer.gnome.org/gio/unstable/GAppInfo.html#g-app-info-launch-uris
			 * gboolean g_app_info_launch_uris (
			 *   GAppInfo *appinfo,
			 *   GList *uris,
			 *   GAppLaunchContext *launch_context,
			 *   GError **error
			 * );
			 */
			return lib('gio').declare('g_app_info_launch_uris', self.TYPE.ABI,
				self.TYPE.gboolean,					// return
				self.TYPE.GAppInfo.ptr,				// *appinfo
				self.TYPE.GList.ptr,				// *uris
				self.TYPE.GAppLaunchContext.ptr,	// *launch_context
				self.TYPE.GError.ptr.ptr			// **error
			);
		},
		g_desktop_app_info_get_filename: function() {
			/* https://developer.gnome.org/gio/stable/gio-Desktop-file-based-GAppInfo.html#g-desktop-app-info-get-filename
			 * const char *g_desktop_app_info_get_filename (
			 *   GDesktopAppInfo *info
			 * );
			 */
			return lib('gio').declare('g_desktop_app_info_get_filename', self.TYPE.ABI,
				self.TYPE.char.ptr,				// return
				self.TYPE.GDesktopAppInfo.ptr	// *info
			);
		},
		g_desktop_app_info_new_from_filename: function() {
			/* https://developer.gnome.org/gio/unstable/gio-Desktop-file-based-GAppInfo.html#g-desktop-app-info-new-from-filename
			 * GDesktopAppInfo * g_desktop_app_info_new_from_filename(
			 *   const char *filename
			 * );
			 */
			return lib('gio').declare('g_desktop_app_info_new_from_filename', self.TYPE.ABI,
				self.TYPE.GDesktopAppInfo.ptr,	// return
				self.TYPE.gchar.ptr				// *filename
			);
		},
		g_file_get_path: function() {
			/* https://developer.gnome.org/gio/stable/GFile.html#g-file-get-path
			 * char *g_file_get_path (
			 *   GFile *file
		 	 * );
			 */
			return lib('gio').declare('g_file_get_path', self.TYPE.ABI,
				self.TYPE.char.ptr,		// return
				self.TYPE.GFile.ptr		// *file
			);
		},
		g_file_get_uri: function() {
			/* https://developer.gnome.org/gio/stable/GFile.html#g-file-get-uri
			 * char * g_file_get_uri (
			 *   GFile *file
		 	 * );
			 */
			return lib('gio').declare('g_file_get_uri', self.TYPE.ABI,
 				self.TYPE.char.ptr,		// return
 				self.TYPE.GFile.ptr		// *file
 			);
		},
		g_file_info_get_attribute_uint64: function() {
			/* https://developer.gnome.org/gio/stable/GFileInfo.html#g-file-info-get-attribute-uint64
			guint64
			g_file_info_get_attribute_uint64 (GFileInfo *info,
			                                  const char *attribute);
			 */
			return lib('gio').declare('g_file_info_get_attribute_uint64', self.TYPE.ABI,
				self.TYPE.guint64,			// return
				self.TYPE.GFileInfo.ptr,	// *info
				self.TYPE.char.ptr			// *attribute
			);
		},
		g_file_monitor_directory: function() {
			/* https://developer.gnome.org/gio/stable/GFile.html#g-file-monitor-directory
			 * GFileMonitor *g_file_monitor_directory (
			 *   GFile *file,
			 *   GFileMonitorFlags flags,
			 *   GCancellable *cancellable,
			 *   GError **error
		 	 * );
			 */
			return lib('gio').declare('g_file_monitor_directory', self.TYPE.ABI,
				self.TYPE.GFileMonitor.ptr,		// return
				self.TYPE.GFile.ptr,			// *file
				self.TYPE.GFileMonitorFlags,	// flags
				self.TYPE.GCancellable.ptr,		// *cancellable
				self.TYPE.GError.ptr.ptr		// **error
			);
		},
		g_file_new_for_path: function() {
			/* https://developer.gnome.org/gio/stable/GFile.html#g-file-new-for-path
			 * GFile *g_file_new_for_path (
			 *   const char *path
			 * );
			 */
			return lib('gio').declare('g_file_new_for_path', self.TYPE.ABI,
				self.TYPE.GFile.ptr,	// return
				self.TYPE.char.ptr		// *char
			);
		},
		g_file_query_info: function() {
			/* https://developer.gnome.org/gio/stable/GFile.html#g-file-query-info
			GFileInfo *
			g_file_query_info (GFile *file,
			                   const char *attributes,
			                   GFileQueryInfoFlags flags,
			                   GCancellable *cancellable,
			                   GError **error);
			 */
			return lib('gio').declare('g_file_query_info', self.TYPE.ABI,
				self.TYPE.GFileInfo.ptr,		// return
				self.TYPE.GFile.ptr,			// *file
				self.TYPE.char.ptr,				// *attributes
				self.TYPE.GFileQueryInfoFlags,	// flags
				self.TYPE.GCancellable.ptr,		// *cancellable
				self.TYPE.GError.ptr.ptr		// **error
			);
		},
		g_file_trash: function() {
			/* https://developer.gnome.org/gio/stable/GFile.html#g-file-trash
			 * gboolean g_file_trash (
			 *   GFile *file,
			 *   GCancellable *cancellable,
			 *   GError **error
			 * );
			 */
			return lib('gio').declare('g_file_trash', self.TYPE.ABI,
				self.TYPE.gboolean,				// return
				self.TYPE.GFile.ptr,			// *file
				self.TYPE.GCancellable.ptr,		// *cancellable
				self.TYPE.GError.ptr.ptr		// **error
			);
		},
		g_free: function() {
			/* https://developer.gnome.org/glib/stable/glib-Memory-Allocation.html#g-free
			 * void g_free (
			 *   gpointer mem
		 	 * );
			 */
			return lib('gio').declare('g_free', self.TYPE.ABI,
				self.TYPE.void,			// return
				self.TYPE.gpointer		// mem
			);
		},
		g_object_unref: function() {
			/* https://developer.gnome.org/gobject/stable/gobject-The-Base-Object-Type.html#g-object-unref
			 * void g_object_unref (
			 *   gpointer object
		 	 * );
			 */
			return lib('gio').declare('g_object_unref', self.TYPE.ABI,
				self.TYPE.void,		// return
				self.TYPE.gpointer	// object
			);
		},
		g_signal_connect_data: function() {
			/* https://developer.gnome.org/gobject/stable/gobject-Signals.html#g-signal-connect-data
			 * gulong g_signal_connect_data (
			 *   gpointer instance,
			 *   gchar *detailed_signal,
			 *   GCallback c_handler,
			 *   gpointer data,
			 *   GClosureNotify destroy_data,
			 *   GConnectFlags connect_flags
			 * );
			 */
			return lib('gio').declare('g_signal_connect_data', self.TYPE.ABI,
				self.TYPE.gulong,			// return
				self.TYPE.gpointer,			// instance
				self.TYPE.gchar.ptr,		// *detailed_signal
				self.TYPE.GCallback,		// c_handler
				self.TYPE.gpointer,			// data
				self.TYPE.GClosureNotify,	// destroy_data
				self.TYPE.GConnectFlags		// connect_flags
		 	);
		},
		g_signal_connect_object: function() {
			/* https://developer.gnome.org/gobject/stable/gobject-Signals.html#g-signal-connect-data
			 * gulong
				g_signal_connect_object (gpointer instance,
				                         const gchar *detailed_signal,
				                         GCallback c_handler,
				                         gpointer gobject,
				                         GConnectFlags connect_flags);
			 * );
			 */
			return lib('gio').declare('g_signal_connect_object', self.TYPE.ABI,
				self.TYPE.gulong,			// return
				self.TYPE.gpointer,			// instance
				self.TYPE.gchar.ptr,		// *detailed_signal
				self.TYPE.GCallback,		// c_handler
				self.TYPE.gpointer,			// gobject
				self.TYPE.GConnectFlags		// connect_flags
		 	);
		},
		g_signal_handler_disconnect: function() {
			/* https://developer.gnome.org/gobject/stable/gobject-Signals.html#g-signal-handler-disconnect
			 * void g_signal_handler_disconnect (
			 *   gpointer instance,
			 *   gulong handler_id
		 	 * );
			 */
			return lib('gio').declare('g_signal_handler_disconnect', self.TYPE.ABI,
				self.TYPE.void,		// return
				self.TYPE.gpointer,	// instance
   				self.TYPE.gulong	// handler_id
			);
		},
		gdk_device_get_position: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkDevice.html#gdk-device-get-position
			void
			gdk_device_get_position (GdkDevice *device,
			                         GdkScreen **screen,
			                         gint *x,
			                         gint *y);
			 */
			 if (GTK_VERSION < 3) throw new Error('Requires GTK3!');

			 return lib('gdk3').declare('gdk_device_get_position', self.TYPE.ABI,
 				self.TYPE.void,					// return
				self.TYPE.GdkDevice.ptr,		// *device
				self.TYPE.GdkScreen.ptr.ptr,	// **screen
				self.TYPE.gint.ptr,				// *x
				self.TYPE.gint.ptr				// *y
 			);
		},
		gdk_device_get_state: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkDevice.html#gdk-device-get-state
			void
			gdk_device_get_state (GdkDevice *device,
			                      GdkWindow *window,
			                      gdouble *axes,
			                      GdkModifierType *mask);
			 */

			 return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_device_get_state', self.TYPE.ABI,
 				self.TYPE.void,					// return
				self.TYPE.GdkDevice.ptr,		// *device
				self.TYPE.GdkWindow.ptr,		// *window
				self.TYPE.gdouble.ptr,			// *axes
				self.TYPE.GdkModifierType.ptr	// *mask
 			);
		},
		gdk_device_manager_get_client_pointer: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkDeviceManager.html#gdk-device-manager-get-client-pointer
			GdkDevice *
			gdk_device_manager_get_client_pointer (GdkDeviceManager *device_manager);
			 */
			if (GTK_VERSION < 3) throw new Error('Requires GTK3!');
			if (GTK_VERSION >= 3.2) throw new Error('Requires GTK3! Deprecated in GTK3.2');
			return lib('gdk3').declare('gdk_device_manager_get_client_pointer', self.TYPE.ABI,
 				self.TYPE.GdkDevice.ptr,		// return
				self.TYPE.GdkDeviceManager.ptr	// *device_manager
 			);
		},
		gdk_get_default_root_window: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-get-default-root-window
			 * GdkWindow *gdk_get_default_root_window (void);
			 */
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_get_default_root_window', self.TYPE.ABI,
				self.TYPE.GdkWindow.ptr	// return
			);
		},
		gdk_display_get_default: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkDisplay.html#gdk-display-get-default
			GdkDisplay *
			gdk_display_get_default (void);
			*/
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_display_get_default', self.TYPE.ABI,
				self.TYPE.GdkDisplay.ptr	// return
			);
		},
		gdk_display_get_device_manager: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkDisplay.html#gdk-display-get-device-manager
			GdkDeviceManager *
			gdk_display_get_device_manager (GdkDisplay *display);
			*/
			if (GTK_VERSION < 3) throw new Error('Requires GTK3!');
			if (GTK_VERSION > 3.2) throw new Error('Requires GTK3! Deprecated in GTK3.2');
			return lib('gdk3').declare('gdk_display_get_device_manager', self.TYPE.ABI,
				self.TYPE.GdkDeviceManager.ptr,		// return
				self.TYPE.GdkDisplay.ptr			// *display
			);
		},
		gdk_display_get_default_seat: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkDisplay.html#gdk-display-get-default-seat
			GdkSeat *
			gdk_display_get_default_seat (GdkDisplay *display);
			*/
			if (GTK_VERSION < 3.2) throw new Error('Requires GTK3.2!');
			return lib('gdk32').declare('gdk_display_get_default_seat', self.TYPE.ABI,
				self.TYPE.GdkSeat.ptr,		// return
				self.TYPE.GdkDisplay.ptr	// *display
			);
		},
		gdk_screen_get_active_window: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkScreen.html#gdk-screen-get-active-window
			 * GdkWindow *gdk_screen_get_active_window (
			 *   GdkScreen *screen
			 * );
			 */
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_screen_get_active_window', self.TYPE.ABI,
				self.TYPE.GdkWindow.ptr,	// return
				self.TYPE.GdkScreen.ptr		// *screen
			);
		},
		gdk_screen_get_default: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkScreen.html#gdk-screen-get-default
			 * GdkScreen *gdk_screen_get_default (void);
			 */
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_screen_get_default', self.TYPE.ABI,
				self.TYPE.GdkScreen.ptr	// return
			);
		},
		gdk_screen_get_root_window: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkScreen.html#gdk-screen-get-root-window
			 * GdkWindow *gdk_screen_get_root_window (
			 *   GdkScreen *screen
			 * );
			 */
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_screen_get_root_window', self.TYPE.ABI,
				self.TYPE.GdkWindow.ptr,	// return
				self.TYPE.GdkScreen.ptr		// *screen
			);
		},
		gdk_seat_get_pointer: function() {
			/* https://developer.gnome.org/gdk3/stable/GdkSeat.html#gdk-seat-get-pointer
			GdkDevice *
			gdk_seat_get_pointer (GdkSeat *seat);
			*/
			if (GTK_VERSION < 3.2) throw new Error('Requires GTK3.2!');
			return lib('gdk32').declare('gdk_seat_get_pointer', self.TYPE.ABI,
				self.TYPE.GdkDevice.ptr,	// return
				self.TYPE.GdkSeat.ptr		// *seat
			);
		},
		gdk_window_add_filter: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-add-filter
			 * void gdk_window_add_filter (
			 *   GdkWindow *window,
			 *   GdkFilterFunc function,
			 *   gpointer data
			 * );
			 */
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_window_add_filter', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GdkWindow.ptr,	// *window
				self.TYPE.GdkFilterFunc,	// function
				self.TYPE.gpointer			// data
			);
		},
		gdk_window_begin_move_drag: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-begin-move-drag
			void
			gdk_window_begin_move_drag (GdkWindow *window,
			                            gint button,
			                            gint root_x,
			                            gint root_y,
			                            guint32 timestamp);
			*/
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_window_begin_move_drag', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GdkWindow.ptr,	// *window
				self.TYPE.gint,				// button
				self.TYPE.gint,				// root_x
				self.TYPE.gint,				// root_y
				self.TYPE.guint32			// timestamp
			);
		},
		gdk_window_get_geometry: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-get-geometry
			void
			gdk_window_get_geometry (GdkWindow *window,
									 gint *x,
									 gint *y,
									 gint *width,
									 gint *height);
			*/
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_window_get_geometry', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GdkWindow.ptr,	// *window
				self.TYPE.gint.ptr,			// *x
				self.TYPE.gint.ptr,			// *y
				self.TYPE.gint.ptr,			// *width
				self.TYPE.gint.ptr			// *height
			);
		},
		gdk_window_get_pointer: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-get-pointer
			GdkWindow *
			gdk_window_get_pointer (GdkWindow *window,
			                        gint *x,
			                        gint *y,
			                        GdkModifierType *mask);
			*/
			if (GTK_VERSION > 2) throw new Error('Requires GTK2! Deprecated after GTK2');
			return lib('gdk2').declare('gdk_window_get_pointer', self.TYPE.ABI,
				self.TYPE.GdkWindow.ptr,		// return
				self.TYPE.GdkWindow.ptr,		// *window
				self.TYPE.gint.ptr,				// *x
				self.TYPE.gint.ptr,				// *y
				self.TYPE.GdkModifierType.ptr	// *mask
			);
		},
		gdk_window_get_position: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-get-position
			void
			gdk_window_get_position (GdkWindow *window,
			                         gint *x,
			                         gint *y);
			*/
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_window_get_position', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GdkWindow.ptr,	// *window
				self.TYPE.gint.ptr,			// *x
				self.TYPE.gint.ptr			// *y
			);
		},
		gdk_window_get_root_origin: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-get-root-origin
			void
			gdk_window_get_root_origin (GdkWindow *window,
			                            gint *x,
			                            gint *y);
			*/
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_window_get_root_origin', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GdkWindow.ptr,	// *window
				self.TYPE.gint.ptr,			// *x
				self.TYPE.gint.ptr			// *y
			);
		},
		gdk_window_get_toplevel: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-get-toplevel
			GdkWindow *
			gdk_window_get_toplevel (GdkWindow *window);
			*/
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_window_get_toplevel', self.TYPE.ABI,
				self.TYPE.GdkWindow.ptr,	// return
				self.TYPE.GdkWindow.ptr		// *window
			);
		},
		gdk_window_get_user_data: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-get-user-data
			 * void gdk_window_get_user_data (
			 *   GdkWindow *window,
			 *   gpointer *data
			 * );
			 */
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_window_get_user_data', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GdkWindow.ptr,	// *window
				self.TYPE.gpointer.ptr		// *data
			);
		},
		gdk_window_remove_filter: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-remove-filter
			 * void gdk_window_add_filter (
			 *   GdkWindow *window,
			 *   GdkFilterFunc function,
			 *   gpointer data
			 * );
			 */
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_window_remove_filter', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GdkWindow.ptr,	// *window
				self.TYPE.GdkFilterFunc,	// function
				self.TYPE.gpointer			// data
			);
		},
		gdk_window_set_events: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-Windows.html#gdk-window-set-events
			 * void gdk_window_set_events (
			 *   GdkWindow *window,
			 *   GdkEventMask event_mask
			 * );
			 */
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_window_set_events', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GdkWindow.ptr,	// *window
				self.TYPE.GdkEventMask		// event_mask
			);
		},
		gdk_x11_drawable_get_xid: function() {
			/* https://developer.gnome.org/gdk2/stable/gdk2-X-Window-System-Interaction.html#gdk-x11-drawable-get-xid
			 * XID gdk_x11_drawable_get_xid (
			 *   GdkDrawable *drawable
			 * );
			 */
			if (GTK_VERSION === 2) {
				// can use gdk2 ok good
			} else {
				console.error('not available in gdk3 and this version of firefox cant use gdk2')
				throw new Error('not available in gdk3 and this version of firefox cant use gdk2')
			}
			// return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_x11_drawable_get_xid', self.TYPE.ABI,
			// this is only available in gdk2
			return lib('gdk2').declare('gdk_x11_drawable_get_xid', self.TYPE.ABI,
				self.TYPE.XID,				// return
				self.TYPE.GdkDrawable.ptr	// *drawable
			);
		},
		gdk_x11_window_get_xid: function() {
			/* https://developer.gnome.org/gdk3/stable/gdk3-X-Window-System-Interaction.html#gdk-x11-window-get-xid
			 * Window gdk_x11_window_get_xid (
			 *   GdkWindow *window
			 * );
			 */
			if (GTK_VERSION === 2) {
				console.error('not available in gdk2 and this version of firefox cant use gdk3')
				throw new Error('not available in gdk2 and this version of firefox cant use gdk3')
			} else {
				// can use gdk3 ok good
			}
			// return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_x11_drawable_get_xid', self.TYPE.ABI,
			// this is only available in gdk2
			return lib('gdk3').declare('gdk_x11_window_get_xid', self.TYPE.ABI,
				self.TYPE.Window,			// return
				self.TYPE.GdkWindow.ptr		// *window
			);
		},
		gdk_x11_window_lookup_for_display: function() {
			/* https://developer.gnome.org/gdk2/stable/gdk2-X-Window-System-Interaction.html#gdk-x11-window-lookup-for-display
			 * GdkWindow *gdk_x11_window_lookup_for_display (
			 *   GdkDisplay *display,
			 *   Window window
			 * );
			 */
			return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_x11_window_lookup_for_display', self.TYPE.ABI,
				self.TYPE.GdkWindow.ptr,	// *return
				self.TYPE.GdkDisplay.ptr,	// *display
				self.TYPE.Window			// window
			);
		},
		gdk_xid_table_lookup: function() {
			/* https://developer.gnome.org/gdk2/stable/gdk2-X-Window-System-Interaction.html#gdk-xid-table-lookup
			 * gpointer gdk_xid_table_lookup (XID xid);
			 */
			// return lib(GTK_VERSION === 2 ? 'gdk2' : 'gdk3').declare('gdk_xid_table_lookup', self.TYPE.ABI,
			// not available in gdk3
			return lib('gdk2').declare('gdk_xid_table_lookup', self.TYPE.ABI,
				self.TYPE.gpointer,		// return
				self.TYPE.XID			// xid
			);
		},
		gtk_widget_add_events: function() {
			/* https://developer.gnome.org/gtk3/stable/GtkWidget.html#gtk-widget-add-events
			void
			gtk_widget_add_events (GtkWidget *widget,
			                       gint events);
			*/
			return lib(GTK_VERSION === 2 ? 'gtk2' : 'gtk3').declare('gtk_widget_add_events', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GtkWidget.ptr,	// *widget
				self.TYPE.gint				// events
			);
		},
		gtk_widget_get_window: function() {
			/* https://developer.gnome.org/gtk3/stable/GtkWidget.html#gtk-widget-get-window
			 * GdkWindow *gtk_widget_get_window (
			 *   GtkWidget *widget
			 * );
			 */
			return lib(GTK_VERSION === 2 ? 'gtk2' : 'gtk3').declare('gtk_widget_get_window', self.TYPE.ABI,
				self.TYPE.GdkWindow.ptr,	// *return
				self.TYPE.GtkWidget.ptr		// *widget
			);
		},
		gtk_window_set_keep_above: function() {
			/* https://developer.gnome.org/gtk3/stable/GtkWindow.html#gtk-window-set-keep-above
			 * void gtk_window_set_keep_above (
			 *   GtkWindow *window,
			 *   gboolean setting
			 * );
			 */
			return lib(GTK_VERSION === 2 ? 'gtk2' : 'gtk3').declare('gtk_window_set_keep_above', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.GtkWindow.ptr,	// *window
				self.TYPE.gboolean			// setting
			);
		},
		// end - gtk
		// start - libc
		close: function() {
		   /* http://linux.die.net/man/2/close
			*  int close(
			*    int fd
			*  );
			*/
			return lib('libc').declare('close', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.int		// fd
			);
		},
		inotify_add_watch: function() {
			/* http://linux.die.net/man/2/inotify_add_watch
			 * int inotify_add_watch(
			 *   int fd,
			 *   const char *pathname,
			 *   uint32_t mask
			 * );
			 */
			 return lib('libc').declare('inotify_add_watch', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.int,			// fd
				self.TYPE.char.ptr,	// *pathname
				self.TYPE.uint32_t		// mask
			);
		},
		inotify_init: function() {
			/* http://linux.die.net/man/2/inotify_init
			 * int inotify_init(
			 *   void
			 * );
			 */
			return lib('libc').declare('inotify_init', self.TYPE.ABI,
				self.TYPE.int		// return
			);
		},
		inotify_init1: function() {
			/* http://linux.die.net/man/2/inotify_init
			 * Notes: Pass 0 as flags if you want inotify_init1 to behave as `int inotify_init(void);`
			 * int inotify_init1(
			 *   int flags
			 * );
			 */
			return lib('libc').declare('inotify_init1', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.int		// flags
			);
		},
		inotify_rm_watch: function() {
			/* http://linux.die.net/man/2/inotify_rm_watch
			 * int inotify_rm_watch(
			 *   int fd,
			 *   int wd
			 * );
			 */
			return lib('libc').declare('inotify_rm_watch', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.int,		// fd
				self.TYPE.int		// wd
			);
		},
		memcpy: function() {
			/* http://linux.die.net/man/3/memcpy
			 * void *memcpy (
			 *   void *dest,
			 *   const void *src,
			 *   size_t n
			 * );
			 */
			return lib('libc').declare('memcpy', self.TYPE.ABI,
				self.TYPE.void,		// return
				self.TYPE.void.ptr,	// *dest
				self.TYPE.void.ptr,	// *src
				self.TYPE.size_t	// count
			);
		},
		pipe: function() {
			/* http://linux.die.net/man/2/pipe
			 * int pipe(
			 *   int pipefd[2]
		 	 * );
			 */
			return lib('libc').declare('pipe', self.TYPE.ABI,
				self.TYPE.int,				// return
				self.TYPE.int.array(2)		// pipefd[2]
			);
		},
		poll: function() {
			/* http://linux.die.net/man/2/poll
			 * int poll(
			 *   struct pollfd *fds
			 *   nfds_t nfds
			 *   int timeout
		 	 * );
			 */
			return lib('libc').declare('poll', self.TYPE.ABI,
				self.TYPE.int,				// return
				self.TYPE.pollfd.ptr,		// *fds
				self.TYPE.nfds_t,			// nfds
				self.TYPE.int				// timeout
			);
		},
		read: function() {
			/* http://linux.die.net/man/2/read
			 *  ssize_t read(
			 *    int fd,
			 *    void *buf,
			 *    size_t count;
			 *  );
			 */
			return lib('libc').declare('read', self.TYPE.ABI,
				self.TYPE.ssize_t,		// return
				self.TYPE.int,			// fd
				self.TYPE.void.ptr, 	// *buf
				self.TYPE.size_t		// count
			);
		},
		select: function() {
			/* http://linux.die.net/man/2/select
			 * int select (
			 *   int nfds,
			 *   fd_set *readfds,
			 *   fd_set *writefds,
			 *   fd_set *exceptfds,
			 *   struct timeval *timeout
			 * );
			 */
			return lib('libc').declare('select', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.int,			// nfds
				self.TYPE.fd_set.ptr,	// *readfds  // This is supposed to be fd_set*, but on Linux at least fd_set is just an array of bitfields that we handle manually. link4765403
				self.TYPE.fd_set.ptr,	// *writefds // This is supposed to be fd_set*, but on Linux at least fd_set is just an array of bitfields that we handle manually. link4765403
				self.TYPE.fd_set.ptr,	// *exceptfds // This is supposed to be fd_set*, but on Linux at least fd_set is just an array of bitfields that we handle manually. link4765403
				self.TYPE.timeval.ptr	// *timeout
			);
		},
		sleep: function() {
			/* http://linux.die.net/man/3/sleep
			 * unsigned int sleep(unsigned int seconds);
			 */
			return lib('libc').declare('sleep', self.TYPE.ABI,
				self.TYPE.unsigned_int,		// return
				self.TYPE.unsigned_int		// seconds
			);
		},
		usleep: function() {
			/* http://linux.die.net/man/3/usleep
			 * int usleep(useconds_t usec);
			 */
			return lib('libc').declare('sleep', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.useconds_t	// seconds
			);
		},
		write: function() {
			/* http://linux.die.net/man/2/write
			 * ssize_t write(
			 *   int fd,
			 *   const void *buf,
			 *   size_t count
		 	 * );
			 */
			return lib('libc').declare('write', self.TYPE.ABI,
				self.TYPE.ssize_t,		// return
				self.TYPE.int,			// fd
				self.TYPE.void.ptr,		// *buf
				self.TYPE.size_t		// count
			);
		},
		// end - libc
		// start - xcb
		free: function() {
			// ???
			return lib('xcb').declare('free', self.TYPE.ABI,
				self.TYPE.void,		// return
				self.TYPE.void.ptr	// total guess, i cant find this guy declared anywhere
			);
		},
		xcb_allow_events: function() {
			/* http://www.x.org/releases/X11R7.7/doc/man/man3/xcb_allow_events.3.xhtml
			 * xcb_void_cookie_t xcb_allow_events(
			 *   xcb_connection_t *conn,
			 *   uint8_t mode,
			 *   xcb_timestamp_t time
			 * );
			 */
			return lib('xcb').declare('xcb_allow_events', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.uint8_t,					// mode
				self.TYPE.xcb_timestamp_t			// time
			);
		},
		xcb_aux_sync: function() {
			/* http://www.x.org/archive/X11R7.5/doc/libxcb/tutorial/index.html
			 * int xcb_aux_sync (
			 *   xcb_connection_t *c
			 * );
			 */
			return lib('xcbutil').declare('xcb_aux_sync', self.TYPE.ABI,
				self.TYPE.int,					// return
				self.TYPE.xcb_connection_t.ptr	// *c
			);
		},
		xcb_change_property: function() {
			/* http://www.x.org/archive/X11R7.7/doc/man/man3/xcb_change_property.3.xhtml
			 * xcb_void_cookie_t xcb_change_property(
			 *   xcb_connection_t *conn,
			 *   uint8_t mode,
			 *   xcb_window_t window,
			 *   xcb_atom_t property,
			 *   xcb_atom_t type,
			 *   uint8_t format,
			 *   uint32_t data_len,
			 *   const void *data
			 * );
			 */
			return lib('xcb').declare('xcb_change_property', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,	// *c
				self.TYPE.uint8_t,				// mode
				self.TYPE.xcb_window_t,			// window
				self.TYPE.xcb_atom_t,			// property
				self.TYPE.xcb_atom_t,			// type
				self.TYPE.uint8_t,				// format
				self.TYPE.uint32_t,				// data_len
				self.TYPE.void.ptr				// *data
			);
		},
		xcb_change_property_checked: function() {
			/* https://xcb.freedesktop.org/manual/xproto_8h_source.html#l06364
			 * same as xcb_change_property
			 */
			return lib('xcb').declare('xcb_change_property_checked', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,	// *c
				self.TYPE.uint8_t,				// mode
				self.TYPE.xcb_window_t,			// window
				self.TYPE.xcb_atom_t,			// type
				self.TYPE.uint8_t,				// format
				self.TYPE.uint32_t,				// data_len
				self.TYPE.void.ptr				// *data
			);
		},
		xcb_change_window_attributes: function() {
			/* https://xcb.freedesktop.org/manual/group__XCB____API.html#ga3724f4ccfdfa063439258831b75f6224
			 * xcb_void_cookie_t xcb_change_window_attributes (
			 *   xcb_connection_t 	*c,
			 *   xcb_window_t		window,
			 *   uint32_t			value_mask,
			 *   const uint32_t		*value_list
			 * )
			 */
			return lib('xcb').declare('xcb_change_window_attributes', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,			// return
				self.TYPE.xcb_connection_t.ptr,			// *c
				self.TYPE.xcb_window_t,					// window
				self.TYPE.uint32_t,						// value_mask
				self.TYPE.uint32_t.ptr					// *value_list
			);
		},
		xcb_configure_window: function() {
			/* https://www.x.org/releases/X11R7.7/doc/man/man3/xcb_configure_window.3.xhtml
			 * xcb_void_cookie_t xcb_configure_window(
			 *   xcb_connection_t *conn,
			 *   xcb_window_t window,
			 *   uint16_t value_mask,
			 *   const uint32_t *value_list
			 * );
			 */
			return lib('xcb').declare('xcb_configure_window', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.xcb_window_t,				// window
				self.TYPE.uint16_t,					// value_mask
				self.TYPE.uint32_t.ptr				// *value_list
			);
		},
		xcb_connect: function() {
			// http://xcb.freedesktop.org/PublicApi/#index2h2
			return lib('xcb').declare('xcb_connect', self.TYPE.ABI,
				self.TYPE.xcb_connection_t.ptr,	// return
				self.TYPE.char.ptr,				// *display
				self.TYPE.int.ptr				// *screen
			);
		},
		xcb_connection_has_error: function() {
			/* https://xcb.freedesktop.org/manual/group__XCB__Core__API.html#ga70a6bade94bd2824db552abcf5fbdbe3
			 * int xcb_connection_has_error 	( 	xcb_connection_t *  	c	)
			 */
			return lib('xcb').declare('xcb_connection_has_error', self.TYPE.ABI,
				self.TYPE.int,					// return
				self.TYPE.xcb_connection_t.ptr	// *c
			);
		},
		xcb_create_window: function() {
			// http://damnsmallbsd.org/man/?query=xcb_create_window&sektion=3&manpath=OSF1+V5.1%2Falpha
			return lib('xcb').declare('xcb_create_window', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,	// *conn
				self.TYPE.uint8_t,				// depth
				self.TYPE.xcb_window_t,			// wid
				self.TYPE.xcb_window_t,			// parent
				self.TYPE.int16_t,				// x
				self.TYPE.int16_t,				// y
				self.TYPE.uint16_t,				// width
				self.TYPE.uint16_t,				// height
				self.TYPE.uint16_t,				// border_width
				self.TYPE.uint16_t,				// _class
				self.TYPE.xcb_visualid_t,		// visual
				self.TYPE.uint32_t,				// value_mask
				self.TYPE.uint32_t.ptr			// *value_list
			);
		},
		xcb_disconnect: function() {
			// http://xcb.freedesktop.org/PublicApi/#index5h2
			return lib('xcb').declare('xcb_disconnect', self.TYPE.ABI,
				self.TYPE.void,					// return
				self.TYPE.xcb_connection_t.ptr	// *c
			);
		},
		xcb_flush: function() {
			// http://xcb.freedesktop.org/PublicApi/#index13h2
			return lib('xcb').declare('xcb_flush', self.TYPE.ABI,
				self.TYPE.int,					// return
				self.TYPE.xcb_connection_t.ptr	// *c
			);
		},
		xcb_generate_id: function() {
			// http://xcb.freedesktop.org/PublicApi/#index16h2
			return lib('xcb').declare('xcb_generate_id', self.TYPE.ABI,
				self.TYPE.uint32_t,				// return
				self.TYPE.xcb_connection_t.ptr	// *c
			);
		},
		xcb_get_geometry: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_gca34d15705234d06d09f16513d640dfe.html#gca34d15705234d06d09f16513d640dfe
			 * http://www.linuxhowtos.org/manpages/3/xcb_get_geometry.htm
			 * xcb_get_geometry_cookie_t xcb_get_geometry(
			 *   xcb_connection_t *conn,
			 *   xcb_drawable_t drawable
			 * );
			 */
			return lib('xcb').declare('xcb_get_geometry', self.TYPE.ABI,
				self.TYPE.xcb_get_geometry_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,				// *conn
				self.TYPE.xcb_drawable_t					// drawable
			);
		},
		xcb_get_geometry_reply: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g6727f2bfb24769655e52d1f1c50f58fe.html#g6727f2bfb24769655e52d1f1c50f58fe
			 * http://www.linuxhowtos.org/manpages/3/xcb_get_geometry.htm
			 * xcb_get_geometry_reply_t *xcb_get_geometry_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_get_geometry_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcb').declare('xcb_get_geometry_reply', self.TYPE.ABI,
				self.TYPE.xcb_get_geometry_reply_t.ptr,		// return
				self.TYPE.xcb_connection_t.ptr,				// *conn
				self.TYPE.xcb_get_geometry_cookie_t,		// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr		// **e
			);
		},
		xcb_get_image: function() {
			/* http://www.unix.com/man-page/centos/3/xcb_get_image/
			 * xcb_get_image_cookie_t xcb_get_image(
			 *   xcb_connection_t *conn,
			 *   uint8_t format,
			 *   xcb_drawable_t drawable,
			 *   int16_t x,
			 *   int16_t y,
			 *   uint16_t width,
			 *   uint16_t height,
			 *   uint32_t plane_mask
			 * );
			 */
			return lib('xcb').declare('xcb_get_image', self.TYPE.ABI,
				self.TYPE.xcb_get_image_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,			// *conn
				self.TYPE.uint8_t,						// format
				self.TYPE.xcb_drawable_t,				// drawable
				self.TYPE.int16_t,						// x
				self.TYPE.int16_t,						// y
				self.TYPE.uint16_t,						// width
				self.TYPE.uint16_t,						// height
				self.TYPE.uint32_t						// plane_mask
			);
		},
		xcb_get_image_data: function() {
			/* http://www.unix.com/man-page/centos/3/xcb_get_image_data/// documentation error - http://stackoverflow.com/a/37097747/1828637
			 * https://xcb.freedesktop.org/manual/xproto_8h_source.html#l09587
			 * uint8_t *xcb_get_image_data(
			 *   const xcb_get_image_reply_t *reply
			 * );
			 */
			return lib('xcb').declare('xcb_get_image_data', self.TYPE.ABI,
				self.TYPE.uint8_t.ptr,						// return
				// self.TYPE.xcb_get_image_request_t.ptr	// *reply // documentation error - http://stackoverflow.com/a/37097747/1828637
				self.TYPE.xcb_get_image_reply_t.ptr			// *reply
			);
		},
		xcb_get_image_reply: function() {
			/* http://www.unix.com/man-page/centos/3/xcb_get_image_reply/
			 * xcb_get_image_reply_t *xcb_get_image_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_get_image_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcb').declare('xcb_get_image_reply', self.TYPE.ABI,
				self.TYPE.xcb_get_image_reply_t.ptr,		// return
				self.TYPE.xcb_connection_t.ptr,				// *conn
				self.TYPE.xcb_get_image_cookie_t,			// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr		// **e
			);
		},
		xcb_get_input_focus: function() {
			/*
			 * xcb_get_input_focus_cookie_t xcb_get_input_focus ( xcb_connection_t *c )
			 */
			return lib('xcb').declare('xcb_get_input_focus', self.TYPE.ABI,
				self.TYPE.xcb_get_input_focus_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr			// *conn
			);
		},
		xcb_get_input_focus_reply: function() {
			/*
			 * xcb_get_input_focus_reply_t* xcb_get_input_focus_reply 	(
			 *   xcb_connection_t *  	c,
			 *   xcb_get_input_focus_cookie_t cookie,
			 *   xcb_generic_error_t **e
		 	 * )
			 */
			return lib('xcb').declare('xcb_get_input_focus_reply', self.TYPE.ABI,
				self.TYPE.xcb_get_input_focus_reply_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr,				// *conn
				self.TYPE.xcb_get_input_focus_cookie_t,		// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr		// **e
			);
		},
		xcb_get_property: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g86312758f2d011c375ae23ac2c063b7d.html#g86312758f2d011c375ae23ac2c063b7d
			 * http://www.linuxhowtos.org/manpages/3/xcb_get_property.htm
			 * xcb_get_property_cookie_t xcb_get_property(
			 *   xcb_connection_t *conn,
			 *   uint8_t _delete,
			 *   xcb_window_t window,
			 *   xcb_atom_t property,
			 *   xcb_atom_t type,
			 *   uint32_t long_offset,
			 *   uint32_t long_length
			 * );
			 */
			return lib('xcb').declare('xcb_get_property', self.TYPE.ABI,
				self.TYPE.xcb_get_property_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,				// *conn
				self.TYPE.uint8_t,							// _delete
				self.TYPE.xcb_window_t,						// window
				self.TYPE.xcb_atom_t,						// property
				self.TYPE.xcb_atom_t,						// type
				self.TYPE.uint32_t,							// long_offset
				self.TYPE.uint32_t							// long_length
			);
		},
		xcb_get_property_reply: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g86312758f2d011c375ae23ac2c063b7d.html#g86312758f2d011c375ae23ac2c063b7d
			 * http://www.linuxhowtos.org/manpages/3/xcb_get_property.htm
			 * xcb_get_property_reply_t *xcb_get_property_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_get_property_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcb').declare('xcb_get_property_reply', self.TYPE.ABI,
				self.TYPE.xcb_get_property_reply_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr,			// *conn
				self.TYPE.xcb_get_property_cookie_t,	// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr	// **e
			);
		},
		xcb_get_property_value: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g86312758f2d011c375ae23ac2c063b7d.html#g86312758f2d011c375ae23ac2c063b7d
			 * void * 	xcb_get_property_value (const xcb_get_property_reply_t *R)
			 */
			return lib('xcb').declare('xcb_get_property_value', self.TYPE.ABI,
				self.TYPE.void.ptr,						// return
				self.TYPE.xcb_get_property_reply_t.ptr	// *R
			);
		},
		xcb_get_property_value_length: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g86312758f2d011c375ae23ac2c063b7d.html#g86312758f2d011c375ae23ac2c063b7d
			 * int 	xcb_get_property_value_length (const xcb_get_property_reply_t *R)
			 */
			return lib('xcb').declare('xcb_get_property_value_length', self.TYPE.ABI,
				self.TYPE.int,							// return
				self.TYPE.xcb_get_property_reply_t.ptr	// *R
			);
		},

		xcb_get_property_unchecked: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g86312758f2d011c375ae23ac2c063b7d.html#g86312758f2d011c375ae23ac2c063b7d
			 * http://www.linuxhowtos.org/manpages/3/xcb_get_property.htm
			 * xcb_get_property_cookie_t xcb_get_property_unchecked(
			 *   im guessing same as xcb_get_property
			 * );
			 */
			return lib('xcb').declare('xcb_get_property_unchecked', self.TYPE.ABI,
				self.TYPE.xcb_get_property_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,				// *conn
				self.TYPE.uint8_t,							// _delete
				self.TYPE.xcb_window_t,						// window
				self.TYPE.xcb_atom_t,						// property
				self.TYPE.xcb_atom_t,						// type
				self.TYPE.uint32_t,							// long_offset
				self.TYPE.uint32_t							// long_length
			);
		},
		xcb_get_selection_owner: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_get_selection_owner.htm
			 * xcb_get_selection_owner_cookie_t xcb_get_selection_owner(xcb_connection_t *conn, xcb_atom_t selection);
			 */
			return lib('xcb').declare('xcb_get_selection_owner', self.TYPE.ABI,
				self.TYPE.xcb_get_selection_owner_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,				// *conn
				self.TYPE.xcb_atom_t						// selection
			);
		},
		xcb_get_selection_owner_reply: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_get_selection_owner.htm
			 * xcb_get_selection_owner_reply_t *xcb_get_selection_owner_reply(xcb_connection_t *conn, xcb_get_selection_owner_cookie_t cookie, xcb_generic_error_t **e);
			 */
			return lib('xcb').declare('xcb_get_selection_owner_reply', self.TYPE.ABI,
				self.TYPE.xcb_get_selection_owner_reply_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr,					// *conn
				self.TYPE.xcb_get_selection_owner_cookie_t,		// selection
				self.TYPE.xcb_generic_error_t.ptr.ptr			// **e
			);
		},
		xcb_get_setup: function() {
			// http://xcb.freedesktop.org/PublicApi/#index7h2
			return lib('xcb').declare('xcb_get_setup', self.TYPE.ABI,
				self.TYPE.xcb_setup_t.ptr,		// return
				self.TYPE.xcb_connection_t.ptr	// *c
			);
		},
		xcb_get_window_attributes: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_get_window_attributes_unchecked.htm
			 * xcb_get_window_attributes_cookie_t xcb_get_window_attributes(
			 *   xcb_connection_t *conn,
			 *   xcb_window_t window
			 * );
			 */
			return lib('xcb').declare('xcb_get_window_attributes', self.TYPE.ABI,
				self.TYPE.xcb_get_window_attributes_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,					// *conn
				self.TYPE.xcb_window_t							// window
			);
		},
		xcb_get_window_attributes_reply: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_get_window_attributes_unchecked.htm
			 * xcb_get_window_attributes_reply_t* xcb_get_window_attributes_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_get_window_attributes_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcb').declare('xcb_get_window_attributes_reply', self.TYPE.ABI,
				self.TYPE.xcb_get_window_attributes_reply_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr,						// *conn
				self.TYPE.xcb_get_window_attributes_cookie_t,		// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr				// **e
			);
		},
		xcb_grab_key: function() {
			// https://github.com/emmanueldenloye/firefox-pentadactyl/blob/52bcaf3a49f81350110210a90552690b2db332a0/unused_plugins/fix-focus.js#L240
			/* http://www.x.org/releases/X11R7.7/doc/man/man3/xcb_grab_key.3.xhtml
			 * xcb_void_cookie_t xcb_grab_key(
			 *   xcb_connection_t *conn,
			 *   uint8_t owner_events,
			 *   xcb_window_t grab_window,
			 *   uint16_t modifiers,
			 *   xcb_keycode_t key,
			 *   uint8_t pointer_mode,
			 *   uint8_t keyboard_mode
			 * );
			 */
			return lib('xcb').declare('xcb_grab_key', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.uint8_t,					// owner_events
				self.TYPE.xcb_window_t,				// grab_window
				self.TYPE.uint16_t,					// modifiers
				self.TYPE.xcb_keycode_t,			// key
				self.TYPE.uint8_t,					// pointer_mode
				self.TYPE.uint8_t					// keyboard_mode
			);
		},
		xcb_grab_keyboard: function() {
			/* http://www.unix.com/man-page/centos/3/xcb_grab_keyboard/
			 * xcb_grab_keyboard_cookie_t xcb_grab_keyboard(
			 *   xcb_connection_t *conn,
			 *   uint8_t owner_events,
			 *   xcb_window_t grab_window,
			 *   xcb_timestamp_t time,
			 *   uint8_t pointer_mode,
			 *   uint8_t keyboard_mode
			 * );
			 */
			return lib('xcb').declare('xcb_grab_keyboard', self.TYPE.ABI,
				self.TYPE.xcb_grab_keyboard_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.uint8_t,					// owner_events
				self.TYPE.xcb_window_t,				// grab_window
				self.TYPE.xcb_timestamp_t,			// time
				self.TYPE.uint8_t,					// pointer_mode
				self.TYPE.uint8_t					// keyboard_mode
			);
		},
		xcb_grab_keyboard_reply: function() {
			/* http://www.unix.com/man-page/centos/3/xcb_grab_keyboard/
			 * xcb_grab_keyboard_reply_t *xcb_grab_keyboard_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_grab_keyboard_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcb').declare('xcb_grab_keyboard_reply', self.TYPE.ABI,
				self.TYPE.xcb_grab_keyboard_reply_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr,				// *conn
				self.TYPE.xcb_grab_keyboard_cookie_t,		// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr	// **e
			);
		},
		xcb_grab_key_checked: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_gc0b5bb243475091e33be64bd2db95f14.html#gc0b5bb243475091e33be64bd2db95f14
			 * xcb_void_cookie_t xcb_grab_key(
			 *   xcb_connection_t *conn,
			 *   uint8_t owner_events,
			 *   xcb_window_t grab_window,
			 *   uint16_t modifiers,
			 *   xcb_keycode_t key,
			 *   uint8_t pointer_mode,
			 *   uint8_t keyboard_mode
			 * );
			 */
			return lib('xcbkey').declare('xcb_grab_key_checked', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.uint8_t,					// owner_events
				self.TYPE.xcb_window_t,				// grab_window
				self.TYPE.uint16_t,					// modifiers
				self.TYPE.xcb_keycode_t,			// key
				self.TYPE.uint8_t,					// pointer_mode
				self.TYPE.uint8_t					// keyboard_mode
			);
		},
		xcb_icccm_get_text_property: function() {
			/* https://github.com/rtbo/xcb-util-wm-d/blob/c025b35735f4e2c00cded2ba9e93ffdc669b57c9/source/xcb/xcb_icccm.d#L60
			 * xcb_get_property_cookie_t xcb_icccm_get_text_property(
			 *   xcb_connection_t *c,
			 *   xcb_window_t window,
			 *   xcb_atom_t property
		 	 * );
			 */
			return lib('xcbicccm').declare('xcb_icccm_get_text_property', self.TYPE.ABI,
				self.TYPE.xcb_get_property_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,			// *c
				self.TYPE.xcb_window_t,					// window
				self.TYPE.xcb_atom_t					// property
			);
		},
		xcb_icccm_get_text_property_reply: function() {
			/* https://github.com/rtbo/xcb-util-wm-d/blob/c025b35735f4e2c00cded2ba9e93ffdc669b57c9/source/xcb/xcb_icccm.d#L96
			 * ubyte xcb_icccm_get_text_property_reply(xcb_connection_t *c,
                                            xcb_get_property_cookie_t cookie,
                                            xcb_icccm_get_text_property_reply_t *prop,
											xcb_generic_error_t **e);
			 */
			return lib('xcbicccm').declare('xcb_icccm_get_text_property_reply', self.TYPE.ABI,
				self.TYPE.unsigned_char,							// return
				self.TYPE.xcb_connection_t.ptr,						// *c
				self.TYPE.xcb_get_property_cookie_t,				// cookie
				self.TYPE.xcb_icccm_get_text_property_reply_t.ptr,	// *prop
				self.TYPE.xcb_generic_error_t.ptr.ptr				// **e
			);
		},
		xcb_icccm_get_text_property_reply_wipe: function() {
			/* https://github.com/rtbo/xcb-util-wm-d/blob/c025b35735f4e2c00cded2ba9e93ffdc669b57c9/source/xcb/xcb_icccm.d#L106
			 * void xcb_icccm_get_text_property_reply_wipe(xcb_icccm_get_text_property_reply_t *prop);
			 */
			return lib('xcbicccm').declare('xcb_icccm_get_text_property_reply_wipe', self.TYPE.ABI,
				self.TYPE.void,										// return
				self.TYPE.xcb_icccm_get_text_property_reply_t.ptr	// *prop
			);
		},
		xcb_icccm_get_text_property_unchecked: function() {
			/* https://github.com/rtbo/xcb-util-wm-d/blob/c025b35735f4e2c00cded2ba9e93ffdc669b57c9/source/xcb/xcb_icccm.d#L74
			 * xcb_get_property_cookie_t xcb_icccm_get_text_property_unchecked(
			 *   xcb_connection_t *c,
			 *   xcb_window_t window,
			 *   xcb_atom_t property
		 	 * );
			 */
			return lib('xcbicccm').declare('xcb_icccm_get_text_property_unchecked', self.TYPE.ABI,
				self.TYPE.xcb_get_property_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,			// *c
				self.TYPE.xcb_window_t,					// window
				self.TYPE.xcb_atom_t					// property
			);
		},
		xcb_intern_atom: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g5c9806a2cfa188c38ed35bff51c60410.html#g5c9806a2cfa188c38ed35bff51c60410
			 * http://www.linuxhowtos.org/manpages/3/xcb_intern_atom.htm
			 * xcb_intern_atom_cookie_t xcb_intern_atom(
			 *   xcb_connection_t *conn,
			 *   uint8_t only_if_exists,
			 *   uint16_t name_len,
			 *   const char *name
			 * );
			 */
			return lib('xcb').declare('xcb_intern_atom', self.TYPE.ABI,
				self.TYPE.xcb_intern_atom_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,			// *conn
				self.TYPE.uint8_t,						// only_if_exists
				self.TYPE.uint16_t,						// name_len
				self.TYPE.char.ptr						// *name
			);
		},
		xcb_intern_atom_reply: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g235521be24c5a1c5f267150cfe175cca.html#g235521be24c5a1c5f267150cfe175cca
			 * http://www.linuxhowtos.org/manpages/3/xcb_intern_atom.htm
			 * xcb_intern_atom_reply_t *xcb_intern_atom_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_intern_atom_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcb').declare('xcb_intern_atom_reply', self.TYPE.ABI,
				self.TYPE.xcb_intern_atom_reply_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr,			// *conn
				self.TYPE.xcb_intern_atom_cookie_t,		// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr	// **e
			);
		},
		xcb_key_press_lookup_keysym: function() {
			/* http://opensource.apple.com//source/X11libs/X11libs-60/xcb-util/xcb-util-0.3.6/keysyms/xcb_keysyms.h
			 * xcb_keysym_t xcb_key_press_lookup_keysym(
			 *   xcb_key_symbols_t *syms,
			 *   xcb_key_press_event_t *event,
			 *   int col
		 	 * );
			 */
			return lib('xcbkey').declare('xcb_key_press_lookup_keysym', self.TYPE.ABI,
				self.TYPE.xcb_keysym_t,					// return
				self.TYPE.xcb_key_symbols_t.ptr,		// *syms
				self.TYPE.xcb_key_press_event_t.ptr,	// *event
				self.TYPE.int							// col
			);
		},
		xcb_key_symbols_alloc: function() {
			/* http://www.opensource.apple.com/source/X11libs/X11libs-60/xcb-util/xcb-util-0.3.6/keysyms/xcb_keysyms.h
			 * xcb_key_symbols_t *xcb_key_symbols_alloc        (xcb_connection_t         *c);
			 */
			return lib('xcbkey').declare('xcb_key_symbols_alloc', self.TYPE.ABI,
				self.TYPE.xcb_key_symbols_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr		// *c
			);
		},
		xcb_key_symbols_free: function() {
			/* http://www.opensource.apple.com/source/X11libs/X11libs-60/xcb-util/xcb-util-0.3.6/keysyms/xcb_keysyms.h
			 * void           xcb_key_symbols_free         (xcb_key_symbols_t         *syms);
			 */
			return lib('xcbkey').declare('xcb_key_symbols_free', self.TYPE.ABI,
				self.TYPE.void,					// return
				self.TYPE.xcb_key_symbols_t.ptr	// *syms
			);
		},
		xcb_key_symbols_get_keycode: function() {
			/* http://www.opensource.apple.com/source/X11libs/X11libs-60/xcb-util/xcb-util-0.3.6/keysyms/xcb_keysyms.h
			 * xcb_keycode_t * xcb_key_symbols_get_keycode(xcb_key_symbols_t *syms, xcb_keysym_t keysym);
			 */
			return lib('xcbkey').declare('xcb_key_symbols_get_keycode', self.TYPE.ABI,
				self.TYPE.xcb_keycode_t.ptr,		// return
				self.TYPE.xcb_key_symbols_t.ptr,	// *syms
				self.TYPE.xcb_keysym_t				// keysym
			);
		},
		xcb_map_window: function() {
			// http://damnsmallbsd.org/man?query=xcb_map_window&apropos=0&sektion=3&manpath=OSF1+V5.1%2Falpha&arch=default&format=html
			return lib('xcb').declare('xcb_map_window', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.xcb_window_t				// window
			);
		},
		xcb_map_window_checked: function() {
			// im guessing declare is same as non-checked
			return lib('xcb').declare('xcb_map_window_checked', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.xcb_window_t				// window
			);
		},
		xcb_poll_for_event: function() {
			/* https://xcb.freedesktop.org/PublicApi/#index11h2
			 * xcb_generic_event_t *xcb_poll_for_event (xcb_connection_t *c);
			 */
			return lib('xcb').declare('xcb_poll_for_event', self.TYPE.ABI,
				self.TYPE.xcb_generic_event_t.ptr,		// return
				self.TYPE.xcb_connection_t.ptr			// *c
			);
		},
		xcb_query_tree: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g4d0136b27bbab9642aa65d2a3edbc03c.html#g4d0136b27bbab9642aa65d2a3edbc03c
			 * http://www.linuxhowtos.org/manpages/3/xcb_query_tree.htm
			 * xcb_query_tree_cookie_t xcb_query_tree(
			 *   xcb_connection_t *conn,
			 *   xcb_window_t window
			 * );
			 */
			return lib('xcb').declare('xcb_query_tree', self.TYPE.ABI,
				self.TYPE.xcb_query_tree_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,			// *conn
				self.TYPE.xcb_window_t					// window
			);
		},
		xcb_query_tree_children: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_query_tree.htm // documentation error - http://stackoverflow.com/a/37097747/1828637
			 * https://xcb.freedesktop.org/manual/xproto_8h_source.html#l06177
			 * xcb_window_t *xcb_query_tree_children(
			 *   const xcb_query_tree_reply_t *reply
			 * );
			 */
			return lib('xcb').declare('xcb_query_tree_children', self.TYPE.ABI,
				self.TYPE.xcb_window_t.ptr,				// return
				// self.TYPE.xcb_query_tree_request_t.ptr	// *reply // documentation error - http://stackoverflow.com/a/37097747/1828637
				self.TYPE.xcb_query_tree_reply_t.ptr	// *reply
			);
		},
		xcb_query_tree_children_length: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_query_tree.htm
			 * int xcb_query_tree_children_length(
			 *   const xcb_query_tree_reply_t *reply
			 * );
			 */
			return lib('xcb').declare('xcb_query_tree_children_length', self.TYPE.ABI,
				self.TYPE.int,							// return
				self.TYPE.xcb_query_tree_reply_t.ptr	// *reply
			);
		},
		xcb_query_tree_reply: function() {
			/*
			 * http://www.linuxhowtos.org/manpages/3/xcb_query_tree.htm
			 * xcb_query_tree_reply_t *xcb_query_tree_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_query_tree_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcb').declare('xcb_query_tree_reply', self.TYPE.ABI,
				self.TYPE.xcb_query_tree_reply_t.ptr,		// return
				self.TYPE.xcb_connection_t.ptr,				// *conn
				self.TYPE.xcb_query_tree_cookie_t,			// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr		// **e
			);
		},
		xcb_randr_get_crtc_info: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_randr_get_crtc_info.htm
			 * xcb_randr_get_crtc_info_cookie_t  xcb_randr_get_crtc_info(
			 *   xcb_connection_t *conn,
			 *   xcb_randr_crtc_t crtc,
			 *   xcb_timestamp_t config_timestamp
			 * );
			 */
			return lib('xcbrandr').declare('xcb_randr_get_crtc_info', self.TYPE.ABI,
				self.TYPE.xcb_randr_get_crtc_info_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,					// *conn
				self.TYPE.xcb_randr_crtc_t,						// crtc
				self.TYPE.xcb_timestamp_t						// config_timestamp
			);
		},
		xcb_randr_get_crtc_info_reply: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_randr_get_crtc_info.htm
			 * xcb_randr_get_crtc_info_reply_t *xcb_randr_get_crtc_info_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_randr_get_crtc_info_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcbrandr').declare('xcb_randr_get_crtc_info_reply', self.TYPE.ABI,
				self.TYPE.xcb_randr_get_crtc_info_reply_t.ptr,		// return
				self.TYPE.xcb_connection_t.ptr,						// *conn
				self.TYPE.xcb_randr_get_crtc_info_cookie_t,			// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr				// **e
			);
		},
		xcb_randr_get_output_info: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_randr_get_output_info.htm
			 * xcb_randr_get_output_info_cookie_t xcb_randr_get_output_info(
			 *   xcb_connection_t *conn,
			 *   xcb_randr_output_t output,
			 *   xcb_timestamp_t config_timestamp
			 * );
			 */
			return lib('xcbrandr').declare('xcb_randr_get_output_info', self.TYPE.ABI,
				self.TYPE.xcb_randr_get_output_info_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,						// *conn
				self.TYPE.xcb_randr_output_t,						// output
				self.TYPE.xcb_timestamp_t							// config_timestamp
			);
		},
		xcb_randr_get_output_info_reply: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_randr_get_output_info.htm
			 * xcb_randr_get_output_info_reply_t *xcb_randr_get_output_info_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_randr_get_output_info_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcbrandr').declare('xcb_randr_get_output_info_reply', self.TYPE.ABI,
				self.TYPE.xcb_randr_get_output_info_reply_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr,						// *conn
				self.TYPE.xcb_randr_get_output_info_cookie_t,		// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr				// **e
			);
		},
		xcb_randr_get_screen_resources_current: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_randr_get_screen_resources_current.htm
			 * xcb_randr_get_screen_resources_current_cookie_t xcb_randr_get_screen_resources_current(
			 *    xcb_connection_t *conn,
			 *    xcb_window_t window
			 * );
			 */
			return lib('xcbrandr').declare('xcb_randr_get_screen_resources_current', self.TYPE.ABI,
				self.TYPE.xcb_randr_get_screen_resources_current_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,								// *conn
				self.TYPE.xcb_window_t										// window
			);
		},
		xcb_randr_get_screen_resources_current_reply: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_randr_get_screen_resources_current.htm
			 * xcb_randr_get_screen_resources_current_reply_t *xcb_randr_get_screen_resources_current_reply(
			 *   xcb_connection_t *conn,
			 *   xcb_randr_get_screen_resources_current_cookie_t cookie,
			 *   xcb_generic_error_t **e
			 * );
			 */
			return lib('xcbrandr').declare('xcb_randr_get_screen_resources_current_reply', self.TYPE.ABI,
				self.TYPE.xcb_randr_get_screen_resources_current_reply_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr,									// *conn
				self.TYPE.xcb_randr_get_screen_resources_current_cookie_t,		// cookie
				self.TYPE.xcb_generic_error_t.ptr.ptr							// **e
			);
		},
		xcb_randr_get_screen_resources_current_outputs: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_randr_get_screen_resources_current_outputs.htm // documentation error - http://stackoverflow.com/a/37097747/1828637
			 * https://xcb.freedesktop.org/manual/randr_8h_source.html#l02972
			 * xcb_randr_output_t *xcb_randr_get_screen_resources_current_outputs(
			 *   const xcb_randr_get_screen_resources_current_reply_t *reply
			 * );
			 */
			return lib('xcbrandr').declare('xcb_randr_get_screen_resources_current_outputs', self.TYPE.ABI,
				self.TYPE.xcb_randr_output_t.ptr,									// return
				// self.TYPE.xcb_randr_get_screen_resources_current_request_t.ptr	// *reply // documentation error - http://stackoverflow.com/a/37097747/1828637
				self.TYPE.xcb_randr_get_screen_resources_current_reply_t.ptr		// *reply
			);
		},
		xcb_randr_get_screen_resources_current_outputs_length: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_randr_get_screen_resources_current_outputs_length.htm
			 * int xcb_randr_get_screen_resources_current_outputs_length(
			 *   const xcb_randr_get_screen_resources_current_reply_t *reply
			 * );
			 */
			return lib('xcbrandr').declare('xcb_randr_get_screen_resources_current_outputs_length', self.TYPE.ABI,
				self.TYPE.int,													// return
				self.TYPE.xcb_randr_get_screen_resources_current_reply_t.ptr	// *reply
			);
		},
		xcb_request_check: function() {
			/* https://xcb.freedesktop.org/manual/group__XCB__Core__API.html#ga3ee7f1ad9cf0a9f1716d5c22405598fc
			 * xcb_generic_error_t* xcb_request_check 	( 	xcb_connection_t *  	c, xcb_void_cookie_t  	cookie );
			 */
			return lib('xcb').declare('xcb_request_check', self.TYPE.ABI,
				self.TYPE.xcb_generic_error_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr,		// *c
				self.TYPE.xcb_void_cookie_t			// cookie
			);
		},
		xcb_screen_next: function() {
			// https://github.com/emmanueldenloye/firefox-pentadactyl/blob/52bcaf3a49f81350110210a90552690b2db332a0/unused_plugins/fix-focus.js#L244
			return lib('xcb').declare('xcb_screen_next', self.TYPE.ABI,
				self.TYPE.void,							// return
				self.TYPE.xcb_screen_iterator_t.ptr
			);
		},
		xcb_send_event: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_g8f8291858b47fd9c88f07d96720fbd7c.html#g8f8291858b47fd9c88f07d96720fbd7c
			 * xcb_void_cookie_t xcb_send_event(
			 xcb_connection_t *conn,
			 uint8_t propagate,
			 xcb_window_t destination,
			 uint32_t event_mask,
			 const char *event
			 );
			 */
			return lib('xcb').declare('xcb_send_event', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,	// *conn
				self.TYPE.uint8_t,				// propagate
				self.TYPE.xcb_window_t,			// destination
				self.TYPE.uint32_t,				// event_mask
				self.TYPE.char.ptr				// *event
			);
		},
		xcb_send_event_checked: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_gb052d5d58e37346d947e03eeac64c071.html#gb052d5d58e37346d947e03eeac64c071
			 * xcb_void_cookie_t xcb_send_event_checked(
			 *   xcb_connection_t *conn,
			 *   uint8_t propagate,
			 *   xcb_window_t destination,
			 *   uint32_t event_mask,
			 *   const char *event
			 * );
			 */
			return lib('xcb').declare('xcb_send_event_checked', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,	// *conn
				self.TYPE.uint8_t,				// propagate
				self.TYPE.xcb_window_t,			// destination
				self.TYPE.uint32_t,				// event_mask
				self.TYPE.char.ptr				// *event
			);
		},
		xcb_send_request: function() {
			/* https://xcb.freedesktop.org/ProtocolExtensionApi/
			 * int xcb_send_request (
			 *   xcb_connection *c,
			 *   int flags, // a combination of the flags `XCB_REQUEST_CHECKED`, `XCB_REQUEST_RAW`, and `XCB_REQUEST_DISCARD_REPLY`
			 *   unsigned int *sequence,
			 *   struct iovec *vector,
			 *   const xcb_protocol_request_t *request
			 * );
			 */
			return lib('xcb').declare('xcb_send_request', self.TYPE.ABI,
				self.TYPE.xcb_connection.ptr,			// *c
				self.TYPE.int,							// flags
				self.TYPE.unsigned_int.ptr,				// *sequence
				self.TYPE.iovec.ptr,					// *vector
				self.TYPE.xcb_protocol_request_t.ptr	// *request
			);
		},
		xcb_set_input_focus: function() {
			/* https://www.x.org/releases/current/doc/man/man3/xcb_set_input_focus.3.xhtml
			 * xcb_void_cookie_t xcb_set_input_focus(
			 *   xcb_connection_t *conn,
			 *   uint8_t revert_to,
			 *   xcb_window_t focus,
			 *   xcb_timestamp_t time
			 * );
			 */
			return lib('xcb').declare('xcb_set_input_focus', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.uint8_t,					// revert_to
				self.TYPE.xcb_window_t,				// focus
				self.TYPE.xcb_timestamp_t			// time
			);
		},
		xcb_send_event: function() {
			/* http://www.linuxhowtos.org/manpages/3/xcb_send_event.htm
			 * xcb_void_cookie_t xcb_send_event(
			 *   xcb_connection_t *conn,
			 *   uint8_t propagate,
			 *   xcb_window_t destination,
			 *   uint32_t event_mask,
			 *   const char *event
		 	 * );
			 */
			return lib('xcb').declare('xcb_send_event', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,	// *conn
				self.TYPE.uint8_t,				// propagate
				self.TYPE.xcb_window_t,			// destination
				self.TYPE.uint32_t,				// event_mask
				self.TYPE.char.ptr				// *event
		 	);
		},
		xcb_send_event_checked: function() {
			/* http://libxcb.sourcearchive.com/documentation/1.1/group__XCB____API_gb052d5d58e37346d947e03eeac64c071.html#gb052d5d58e37346d947e03eeac64c071
			 * xcb_void_cookie_t xcb_send_event(
			 *   xcb_connection_t *conn,
			 *   uint8_t propagate,
			 *   xcb_window_t destination,
			 *   uint32_t event_mask,
			 *   const char *event
		 	 * );
			 */
			 return lib('xcb').declare('xcb_send_event_checked', self.TYPE.ABI,
 				self.TYPE.xcb_void_cookie_t,	// return
 				self.TYPE.xcb_connection_t.ptr,	// *conn
 				self.TYPE.uint8_t,				// propagate
 				self.TYPE.xcb_window_t,			// destination
 				self.TYPE.uint32_t,				// event_mask
 				self.TYPE.char.ptr				// *event
 		 	);
		},
		xcb_setup_roots_iterator: function() {
			// https://github.com/netzbasis/openbsd-xenocara/blob/e6500f41b55e38013ac9b489f66fe49df6b8b68c/lib/libxcb/src/xproto.h#L5409
			// xcb_screen_iterator_t xcb_setup_roots_iterator (xcb_setup_t *R);
			return lib('xcb').declare('xcb_setup_roots_iterator', self.TYPE.ABI,
				self.TYPE.xcb_screen_iterator_t,	// return
				self.TYPE.xcb_setup_t.ptr			// *R
			);
		},
		xcb_ungrab_key: function() {
			/* http://www.x.org/archive/current/doc/man/man3/xcb_ungrab_key.3.xhtml
			 * xcb_void_cookie_t xcb_ungrab_key(
			 *   xcb_connection_t *conn,
			 *   xcb_keycode_t key,
			 *   xcb_window_t grab_window,
			 *   uint16_t modifiers
			 * );
			 */
			return lib('xcb').declare('xcb_ungrab_key', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,	// return
				self.TYPE.xcb_connection_t.ptr,	// *conn
				self.TYPE.xcb_keycode_t,		// key
				self.TYPE.xcb_window_t,			// xcb_window_t
				self.TYPE.uint16_t				// modifiers
			);
		},
		xcb_unmap_window: function() {
			/* https://www.x.org/archive/current/doc/man/man3/xcb_unmap_window.3.xhtml
			 * xcb_void_cookie_t xcb_unmap_window(
			 *   xcb_connection_t *conn,
			 *   xcb_window_t window
			 * );
			 */
			return lib('xcb').declare('xcb_unmap_window', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.xcb_window_t				// window
			);
		},
		xcb_unmap_window_checked: function() {
			// im guessing declare is same as non-checked
			return lib('xcb').declare('xcb_unmap_window_checked', self.TYPE.ABI,
				self.TYPE.xcb_void_cookie_t,		// return
				self.TYPE.xcb_connection_t.ptr,		// *conn
				self.TYPE.xcb_window_t				// window
			);
		},
		xcb_wait_for_event: function() {
			// http://xcb.freedesktop.org/PublicApi/#index10h2
			return lib('xcb').declare('xcb_wait_for_event', self.TYPE.ABI,
				self.TYPE.xcb_generic_event_t.ptr,	// return
				self.TYPE.xcb_connection_t.ptr		// *c
			);
		}
		// end - xcb
	};
	// end - predefine your declares here
	// end - function declares

	this.MACRO = { // http://tronche.com/gui/x/xlib/display/display-macros.html
		ConnectionNumber: function(display) {
			/* The ConnectionNumber macro returns a connection number for the specified display.
			 * http://tronche.com/gui/x/xlib/display/display-macros.html
			 * int ConnectionNumber(
			 *   Display *display
			 * );
			 */
			return self.API('XConnectionNumber')(display);
		},
		BlackPixel: function() {
			/*
			 * BlackPixel(
			 *   display,
			 *   screen_number
			 * )
			 */
			return self.API('XBlackPixel');
		},
		DefaultRootWindow: function() {
			/* The DefaultRootWindow macro returns the root window for the default screen.
			 * Argument `display` specifies the connection to the X server.
			 * Returns the root window for the default screen.
			 * http://www.xfree86.org/4.4.0/DefaultRootWindow.3.html
			 * Window DefaultRootWindow(
			 *   Display	*display
			 * );
			 */
			return self.API('XDefaultRootWindow');
		},
		DefaultScreenOfDisplay: function() {
			/* http://www.xfree86.org/4.4.0/DefaultScreenOfDisplay.3.html
			 * Screen *DefaultScreenOfDisplay(
			 *   Display	*display
			 * );
			 */
			return self.API('XDefaultScreenOfDisplay');
		},
		DefaultScreen: function() {
			/* The DefaultScreen macro returns the default screen number referenced in the XOpenDisplay routine.
			 * Argument `display` specifies the connection to the X server.
			 * Return the default screen number referenced by the XOpenDisplay() function. This macro or function should be used to retrieve the screen number in applications that will use only a single screen.
			 * http://www.xfree86.org/4.4.0/DefaultScreen.3.html
			 * int DefaultScreen(
			 *   Display *display
			 * );
			 */
			return self.API('XDefaultScreen');
		},
		HeightOfScreen: function() {
			/* http://www.xfree86.org/4.4.0/HeightOfScreen.3.html
			 * int HeightOfScreen(
			 *   Screen	*screen
			 * );
			 */
			return self.API('XHeightOfScreen');
		},
		WidthOfScreen: function() {
			/* http://www.xfree86.org/4.4.0/WidthOfScreen.3.html
			 * int WidthOfScreen(
			 *   Screen	*screen
			 * );
			 */
			return self.API('XWidthOfScreen');
		}
	};

	this._cache = {};
	this._cacheAtoms = {};
	this._cacheXCBAtoms = {};

	this.HELPER = {
		closeLibs: function() {
			for (var a_lib in _lib) {
				ctypes.close(a_lib);
			}
			_lib = {};
		},
		gdkWinPtrToXID: function(aGDKWindowPtr) {
			var xidOfWin;
			if (GTK_VERSION === 2) {
				// use gdk2
				var GdkDrawPtr = ctypes.cast(aGDKWindowPtr, self.TYPE.GdkDrawable.ptr);
				xidOfWin = self.API('gdk_x11_drawable_get_xid')(GdkDrawPtr);
			} else {
				// use gdk3
				xidOfWin = self.API('gdk_x11_window_get_xid')(aGDKWindowPtr);
			}
			return xidOfWin;
		},
		gdkWinPtrToGtkWinPtr: function(aGDKWindowPtr) {
			var gptr = self.TYPE.gpointer();
			self.API('gdk_window_get_user_data')(aGDKWindowPtr, gptr.address());
			var GtkWinPtr = ctypes.cast(gptr, self.TYPE.GtkWindow.ptr);
			return GtkWinPtr;
		},
		gtkWinPtrToXID: function(aGTKWinPtr) {
			var aGDKWinPtr = self.HELPER.gtkWinPtrToGdkWinPtr(aGTKWinPtr);
			var aXID = self.HELPER.gdkWinPtrToXID(null, aGDKWinPtr);
			return aXID;
		},
		gtkWinPtrToGdkWinPtr: function(aGTKWinPtr) {
			var gtkWidgetPtr = ctypes.cast(aGTKWinPtr, self.TYPE.GtkWidget.ptr);
			var backTo_gdkWinPtr = self.API('gtk_widget_get_window')(gtkWidgetPtr);
			return backTo_gdkWinPtr;
		},
		xidToGdkWinPtr: function(aXID) {
			// todo: figure out how to use gdk_x11_window_lookup_for_display and switch to that, as apparently gdk_xid_table_lookup was deprecated since 2.24
			var aGpointer = self.API('gdk_xid_table_lookup')(aXID);
			var aGDKWinPtr = ctypes.cast(aGpointer, self.TYPE.GdkWindow.ptr);
			return aGDKWinPtr;
		},
		xidToGtkWinPtr: function(aXID) {
			var aGDKWinPtr = self.HELPER.xidToGdkWinPtr(aXID);
			var aGTKWinPtr = self.HELPER.gdkWinPtrToGtkWinPtr(aGDKWinPtr);
			return aGTKWinPtr;
		},
		mozNativeHandlToGdkWinPtr: function(aMozNativeHandlePtrStr) {
			var GdkWinPtr = self.TYPE.GdkWindow.ptr(ctypes.UInt64(aMozNativeHandlePtrStr));
			return GdkWinPtr;
		},
		mozNativeHandlToGtkWinPtr: function(aMozNativeHandlePtrStr) {
			GdkWinPtr = self.HELPER.mozNativeHandlToGdkWinPtr(aMozNativeHandlePtrStr);
			var GtkWinPtr = self.HELPER.gdkWinPtrToGtkWinPtr(GdkWinPtr);
			/*
			var gptr = self.TYPE.gpointer();
			self.API('gdk_window_get_user_data')(GdkWinPtr, gptr.address());
			var GtkWinPtr = ctypes.cast(gptr, self.TYPE.GtkWindow.ptr);
			*/
			return GtkWinPtr;
		},
		mozNativeHandlToXID: function(aMozNativeHandlePtrStr) {
			GdkWinPtr = self.TYPE.mozNativeHandlToGdkWinPtr(aMozNativeHandlePtrStr);
			var xid = self.HELPER.gdkWinPtrToXID(GdkWinPtr);
			return GtkWinPtr;
		},
		cachedXCBConn: function(refreshCache) {
			if (refreshCache || !self._cache.XCBConn)  {
				self._cache.XCBConn = ostypes.API('xcb_connect')(null, null);
			}
			return self._cache.XCBConn;
		},
		cachedXCBRootWindow: function(refreshCache) {
			if (refreshCache || !self._cache.XCBRootWindow)  {
				var setup = ostypes.API('xcb_get_setup')(ostypes.HELPER.cachedXCBConn());
				var screens = ostypes.API('xcb_setup_roots_iterator')(setup);
				var root = screens.data.contents.root;
				self._cache.XCBRootWindow = root;
			}
			return self._cache.XCBRootWindow;
		},
		cachedDefaultRootWindow: function(refreshCache/*, disp*/) {
			if (refreshCache || !self._cache.DefaultRootWindow)  {
				self._cache.DefaultRootWindow = self.MACRO.DefaultRootWindow()(/*disp*/self.HELPER.cachedXOpenDisplay());
			}
			return self._cache.DefaultRootWindow;
		},
		cachedDefaultScreen: function(refreshCache/*, disp*/) {
			if (refreshCache || !self._cache.DefaultScreen)  {
				self._cache.DefaultScreen = self.MACRO.DefaultScreen()(/*disp*/self.HELPER.cachedXOpenDisplay());
			}
			return self._cache.DefaultScreen;
		},
		cachedDefaultScreenOfDisplay: function(refreshCache/*, disp*/) {
			if (refreshCache || !self._cache.DefaultScreenOfDisplay)  {
				self._cache.DefaultScreenOfDisplay = self.MACRO.DefaultScreenOfDisplay()(/*disp*/self.HELPER.cachedXOpenDisplay());
			}
			return self._cache.DefaultScreenOfDisplay;
		},
		cachedXOpenDisplay: function(refreshCache) {
			if (refreshCache || !self._cache.XOpenDisplay)  {
				self._cache.XOpenDisplay = self.API('XOpenDisplay')(null);
			}
			return self._cache.XOpenDisplay;
		},
		ifOpenedXCloseDisplay: function() {
			if (self._cache.XOpenDisplay) {
				console.log('yes it was open, terminiating it');
				self.API('XCloseDisplay')(self._cache.XOpenDisplay);
				delete self._cache.XOpenDisplay;
			}
		},
		ifOpenedXCBConnClose: function() {
			if (self._cache.XCBConn) {
				self.API('xcb_disconnect')(self._cache.XCBConn);
				delete self._cache.XCBConn;
			}
		},
		cachedAtom: function(aAtomName, createAtomIfDne, refreshCache) {
			// createAtomIfDne is jsBool, true or false. if set to true/1 then the atom is creatd if it doesnt exist. if set to false/0, then an error is thrown when atom does not exist
			// default behavior is throw when atom doesnt exist

			// aAtomName is self.TYPE.char.ptr but im pretty sure you can just pass in a jsStr
			// returns self.TYPE.Atom

			if (!(aAtomName in self._cacheAtoms) || refreshCache) {
				var atom = self.API('XInternAtom')(self.HELPER.cachedXOpenDisplay(), aAtomName, createAtomIfDne ? self.CONST.False : self.CONST.True); //passing 3rd arg of false, means even if atom doesnt exist it returns a created atom, this can be used with GetProperty to see if its supported etc, this is how Chromium does it
				if (!createAtomIfDne) {
					if (atom == self.CONST.None) { // if i pass 3rd arg as False, it will will never equal self.CONST.None it gets creatd if it didnt exist on line before
						console.warn('No atom with name:', aAtomName, 'return val of atom:', atom.toString());
						throw new Error('No atom with name "' + aAtomName + '"), return val of atom:"' +  atom.toString() + '"');
					}
				}
				self._cacheAtoms[aAtomName] = atom;
			}
			return self._cacheAtoms[aAtomName];
		},
		cachedXCBAtom: function(aAtomName, aOptions={}) {
			// default behavior is throw when atom doesnt exist
			var default_options = {
				create: false, // createAtomIfDne is jsBool, true or false. if set to true/1 then the atom is creatd if it doesnt exist. if set to false/0, then an error is thrown when atom does not exist actually see options.throw
				refresh: false, // refreshCache
				throw: true // only if `create` is `false` this option matters. it will throw. else it will return null
			};

			var options = Object.assign(default_options, aOptions);

			// aAtomName is self.TYPE.char.ptr but im pretty sure you can just pass in a jsStr
			// returns self.TYPE.Atom

			if (!(aAtomName in self._cacheXCBAtoms) || options.refresh) {
				var req_atom = self.API('xcb_intern_atom')(self.HELPER.cachedXCBConn(), options.create ? 0 : 1, aAtomName.length, aAtomName);

				var rez_atom = self.API('xcb_intern_atom_reply')(self.HELPER.cachedXCBConn(), req_atom, null);
				console.log('rez_atom:', rez_atom);

				console.log('rez_atom.contents:', rez_atom.contents);
				var atom = rez_atom.contents.atom;
				console.log('atom:', atom, 'name:', aAtomName);
				if (cutils.jscEqual(atom, self.CONST.XCB_ATOM_NONE)) { // if options.create true, it will will never equal self.CONST.XCB_ATOM_NONE it gets creatd if it didnt exist on line before
					// obviusly `options.create` was false, otherwise it wouldnt get here, as it would have created an atom
					console.error('No atom with name:', aAtomName, 'return val of atom:', atom, rez_atom);
					if (options.throw) {
						throw new Error('No atom with name "' + aAtomName + '"), return val of atom:"' +  atom.toString() + '"');
					} else {
						return null;
					}
				}

				self._cacheXCBAtoms[aAtomName] = atom;

				self.API('free')(rez_atom);
			}
			return self._cacheXCBAtoms[aAtomName];
		},
		getWinProp_ReturnStatus: function(devUserRequestedType, funcReturnedType, funcReturnedFormat, funcBytesAfterReturned, dontThrowOnDevTypeMismatch) {
			// devUserRequestedType is req_type arg passed to XGetWindowProperty
			// this tells us what the return of XGetWindowProperty means and if it needs XFree'ing
			// returns < 0 if nitems_return is empty and no need for XFree. > 0 if needs XFree as there are items. 0 if no items but needs XFree, i have never seen this situation and so have not set up this to return 0 // actually scratch this xfree thing it seems i have to xfree it everytime: // XGetWindowProperty() always allocates one extra byte in prop_return (even if the property is zero length) and sets it to zero so that simple properties consisting of characters do not have to be copied into yet another string before use.  // wait tested it, and i was getting some weird errors so only XFree when not empty, interesting
				// -1 - console.log('The specified property does not exist for the specified window. The delete argument was ignored. The nitems_return argument will be empty.');
				// -2 - must set dontThrowOnDevTypeMismatch to true else it throws - console.log('Specified property/atom exists on window but here because returns actual type does not match the specified type (the xgwpArg.req_type) you supplied to function. The delete argument was ignored. The nitems_return argument will be empty.');
				// 1 - console.log('The specified property exists and either you assigned AnyPropertyType to the req_type argument or the specified type matched the actual property type of the returned data.');

			if (cutils.jscEqual(funcReturnedType, self.CONST.None) && cutils.jscEqual(funcReturnedFormat, 0) && cutils.jscEqual(funcBytesAfterReturned, 0)) {
				// console.log('The specified property does not exist for the specified window. The delete argument was ignored. The nitems_return argument will be empty.');
				return -1;
			} else if (!cutils.jscEqual(devUserRequestedType, self.CONST.AnyPropertyType) && !cutils.jscEqual(devUserRequestedType, funcReturnedType)) {
				// console.log('Specified property/atom exists on window but here because returns actual type does not match the specified type (the xgwpArg.req_type) you supplied to function. The delete argument was ignored. The nitems_return argument will be empty.');
				console.info('devUserRequestedType:', cutils.jscGetDeepest(devUserRequestedType));
				console.info('funcReturnedType:', cutils.jscGetDeepest(funcReturnedType));
				if (!dontThrowOnDevTypeMismatch) {
					throw new Error('devuser supplied wrong type for title, fix it stupid, or maybe not a throw? maybe intentionally wrong? to just check if it exists on the window but dont want any data returend as dont want to XFree?');
				}
				return -2;
			} else if (cutils.jscEqual(devUserRequestedType, self.CONST.AnyPropertyType) || cutils.jscEqual(devUserRequestedType, funcReturnedType)) {
				// console.log('The specified property exists and either you assigned AnyPropertyType to the req_type argument or the specified type matched the actual property type of the returned data.');
				return 1;
			}  else {
				throw new Error('should never get here')
			}
		},
		// link4765403
		fd_set_get_idx: function(fd) {
			// https://github.com/pioneers/tenshi/blob/9b3273298c34b9615e02ac8f021550b8e8291b69/angel-player/src/chrome/content/common/serport_posix.js#L497
			if (OS_NAME == 'darwin' /*is_mac*/) {
				// We have an array of int32. This should hopefully work on Darwin
				// 32 and 64 bit.
				let elem32 = Math.floor(fd / 32);
				let bitpos32 = fd % 32;
				let elem8 = elem32 * 8;
				let bitpos8 = bitpos32;
				if (bitpos8 >= 8) {     // 8
					bitpos8 -= 8;
					elem8++;
				}
				if (bitpos8 >= 8) {     // 16
					bitpos8 -= 8;
					elem8++;
				}
				if (bitpos8 >= 8) {     // 24
					bitpos8 -= 8;
					elem8++;
				}

				return {'elem8': elem8, 'bitpos8': bitpos8};
			} else { // else if (OS_NAME == 'linux' /*is_linux*/) { // removed the else if so this supports bsd and solaris now
				// :todo: add 32bit support
				// Unfortunately, we actually have an array of long ints, which is
				// a) platform dependent and b) not handled by typed arrays. We manually
				// figure out which byte we should be in. We assume a 64-bit platform
				// that is little endian (aka x86_64 linux).
				let elem64 = Math.floor(fd / 64);
				let bitpos64 = fd % 64;
				let elem8 = elem64 * 8;
				let bitpos8 = bitpos64;
				if (bitpos8 >= 8) {     // 8
					bitpos8 -= 8;
					elem8++;
				}
				if (bitpos8 >= 8) {     // 16
					bitpos8 -= 8;
					elem8++;
				}
				if (bitpos8 >= 8) {     // 24
					bitpos8 -= 8;
					elem8++;
				}
				if (bitpos8 >= 8) {     // 32
					bitpos8 -= 8;
					elem8++;
				}
				if (bitpos8 >= 8) {     // 40
					bitpos8 -= 8;
					elem8++;
				}
				if (bitpos8 >= 8) {     // 48
					bitpos8 -= 8;
					elem8++;
				}
				if (bitpos8 >= 8) {     // 56
					bitpos8 -= 8;
					elem8++;
				}

				return {'elem8': elem8, 'bitpos8': bitpos8};
			}
		},
		fd_set_set: function(fdset, fd) {
			// https://github.com/pioneers/tenshi/blob/9b3273298c34b9615e02ac8f021550b8e8291b69/angel-player/src/chrome/content/common/serport_posix.js#L497
			let { elem8, bitpos8 } = self.HELPER.fd_set_get_idx(fd);
			console.info('elem8:', elem8.toString());
			console.info('bitpos8:', bitpos8.toString());
			fdset[elem8] = 1 << bitpos8;
		},
		fd_set_isset: function(fdset, fd) {
			// https://github.com/pioneers/tenshi/blob/9b3273298c34b9615e02ac8f021550b8e8291b69/angel-player/src/chrome/content/common/serport_posix.js#L497
			let { elem8, bitpos8 } = self.HELPER.fd_set_get_idx(fd);
			console.info('elem8:', elem8.toString());
			console.info('bitpos8:', bitpos8.toString());
			return !!(fdset[elem8] & (1 << bitpos8));
		}
	};
};

// helper function
function importServicesJsm() {
	if (!global.DedicatedWorkerGlobalScope && typeof(Services) == 'undefined') {
		if (typeof(Cu) == 'undefined') {
			if (typeof(Components) != 'undefined') {
				// Bootstrap
				var { utils:Cu } = Components;
			} else if (typeof(require) != 'undefined') {
				// Addon SDK
				var { Cu } = require('chrome');
			} else {
				console.warn('cannot import Services.jsm');
			}
		}
		if (typeof(Cu) != 'undefined') {
			Cu.import('resource://gre/modules/Services.jsm');
		}
	}
}

function importOsConstsJsm() {
	if (!global.DedicatedWorkerGlobalScope && typeof(OS) == 'undefined') {
		if (typeof(Cu) == 'undefined') {
			if (typeof(Components) != 'undefined') {
				// Bootstrap
				var { utils:Cu } = Components;
			} else if (typeof(require) != 'undefined') {
				// Addon SDK
				var { Cu } = require('chrome');
			} else {
				console.warn('cannot import Services.jsm');
			}
		}
		if (typeof(Cu) != 'undefined') {
			Cu.import('resource://gre/modules/osfile.jsm');
		}
	}
}

var getGtkVersion_cache;
function getGtkVersion() {
	// FIREFOX_VERSION must be set before this is called

	if (!getGtkVersion_cache) {
		var c_toolkit;

		if (!global.DedicatedWorkerGlobalScope) {
			c_toolkit = Services.appinfo.widgetToolkit.toLowerCase();
		} else {
			// its a worker
			// try `TOOLKIT`, `core.os.toolkit`, `toolkit`
			try {
				c_toolkit = TOOLKIT;
			} catch(ignore) {
				try {
					c_toolkit = core.os.toolkit;
				} catch(ignore) {
					try {
						c_toolkit = toolkit;
					} catch(ignore) {
						// anything else to try?
					}
				}
			}
		}

		if (c_toolkit) {
			getGtkVersion_cache = c_toolkit.toLowerCase() == 'gtk2' ? 2 : 3;
		} else {
			// DO NOT FALL BACK throw, this is critical to get right
			throw new Error('could not determine gtk version!');
			// // fallback to guess work based on FIREFOX_VERSION - which is very bad
			// // guess fall back. this is horrible guess though, as on OpenSuse Firefox 47 is still Gtk2 (TWO) it is NOT gtk THREE
			// return = FIREFOX_VERSION < 46 ? 2 : 3;
		}
	}

	return getGtkVersion_cache;

}

// init
var ostypes = new x11Init();
