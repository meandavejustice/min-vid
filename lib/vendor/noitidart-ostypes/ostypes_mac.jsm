
Components.utils.import('resource://gre/modules/ctypes.jsm');
Components.utils.import('chrome://minvid-ostypes/content/cutils.jsm');
var EXPORTED_SYMBOLS = ['ostypes'];

// no need to define core or import cutils as all the globals of the worker who importScripts'ed it are availble here

if (ctypes.voidptr_t.size == 4 /* 32-bit */) {
	var is64bit = false;
} else if (ctypes.voidptr_t.size == 8 /* 64-bit */) {
	var is64bit = true;
} else {
	throw new Error('huh??? not 32 or 64 bit?!?!');
}

var osname;
if (this.DedicatedWorkerGlobalScope) {
	osname = OS.Constants.Sys.Name.toLowerCase();
} else {
	importServicesJsm();
	if (typeof(Services) == 'undefined') {
		// failed to import, so just set to `linux`
		osname = 'linux';
	} else {
		osname = Services.appinfo.OS.toLowerCase();
	}

	importOsConstsJsm(); // needed for access OS.Constants.libc
}

var macTypes = function() {

	// ABIs
	this.CALLBACK_ABI = ctypes.default_abi;
	this.ABI = ctypes.default_abi;

	////// C TYPES
	// SIMPLE TYPES
	this.bool = ctypes.bool;
	this.char = ctypes.char;
	this.float = ctypes.float;
	this.int = ctypes.int;
	this.int16_t = ctypes.int16_t;
	this.int32_t = ctypes.int32_t;
	this.int64_t = ctypes.int64_t;
	this.intptr_t = ctypes.intptr_t;
	this.long = ctypes.long;
	this.off_t = ctypes.off_t;
	this.pid_t = ctypes.int32_t;
	this.short = ctypes.short;
	this.size_t = ctypes.size_t;
	this.ssize_t = ctypes.ssize_t;
	this.uint16_t = ctypes.uint16_t;
	this.uint32_t = ctypes.uint32_t;
	this.uintptr_t = ctypes.uintptr_t;
	this.uint64_t = ctypes.uint64_t;
	this.unsigned_char = ctypes.unsigned_char;
	this.unsigned_int = ctypes.unsigned_int;
	this.unsigned_long = ctypes.unsigned_long;
	this.unsigned_long_long = ctypes.unsigned_long_long;
	this.void = ctypes.void_t;

	// ADV C TYPES
	this.time_t = this.long; // https://github.com/j4cbo/chiral/blob/3c66a8bb64e541c0f63b04b78ec2d0ffdf5b473c/chiral/os/kqueue.py#L34 AND also based on this github search https://github.com/search?utf8=%E2%9C%93&q=time_t+ctypes&type=Code&ref=searchresults AND based on this answer here: http://stackoverflow.com/a/471287/1828637
	this.useconds_t = this.unsigned_int; // http://opensource.apple.com/source/cvs/cvs-39/cvs/windows-NT/sys/types.h

	// GUESS C TYPES
	this.FILE = ctypes.void_t; // not really a guess, i just dont have a need to fill it

	// C SIMPLE STRUCTS
	var flockHollowStruct = new cutils.HollowStructure('flock', OS.Constants.libc.OSFILE_SIZEOF_FLOCK);
	flockHollowStruct.add_field_at(OS.Constants.libc.OSFILE_OFFSETOF_FLOCK_L_WHENCE, 'l_whence', this.short);
	flockHollowStruct.add_field_at(OS.Constants.libc.OSFILE_OFFSETOF_FLOCK_L_TYPE, 'l_type', this.short);
	flockHollowStruct.add_field_at(OS.Constants.libc.OSFILE_OFFSETOF_FLOCK_L_START, 'l_start', this.off_t);
	flockHollowStruct.add_field_at(OS.Constants.libc.OSFILE_OFFSETOF_FLOCK_L_PID, 'l_pid', this.pid_t);
	flockHollowStruct.add_field_at(OS.Constants.libc.OSFILE_OFFSETOF_FLOCK_L_LEN, 'l_len', this.off_t);
	this.flock = flockHollowStruct.getType().implementation;


	////// CoreFoundation TYPES
	// SIMPLE TYPES // based on ctypes.BLAH
	this.Boolean = ctypes.unsigned_char;
	this.ByteCount = ctypes.unsigned_long;
	this.CFIndex = ctypes.long;
	this.CFOptionFlags = ctypes.unsigned_long;
	this.CFTimeInterval = ctypes.double;
	this.CFTypeRef = ctypes.voidptr_t;
	this.CGDirectDisplayID = ctypes.uint32_t;
	this.CGError = ctypes.int32_t;
	this.CGEventField = ctypes.uint32_t;
	this.CGEventMask = ctypes.uint64_t;
	this.CGEventTapLocation = ctypes.uint32_t;
	this.CGEventTapOptions = ctypes.uint32_t;
	this.CGEventTapPlacement = ctypes.uint32_t;
	this.CGEventType = ctypes.uint32_t;
	this.CGFloat = is64bit ? ctypes.double : ctypes.float; // ctypes.float is 32bit deosntw ork as of May 10th 2015 see this bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1163406 this would cause crash on CGDisplayGetBounds http://stackoverflow.com/questions/28216681/how-can-i-get-screenshot-from-all-displays-on-mac#comment48414568_28247749
	this.CGSConnection = ctypes.int;
	this.CGSTransitionOption = ctypes.int; // type is enum so i guess int - https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L162
	this.CGSTransitionType = ctypes.int; // type is enum so i guess int - https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L148
	this.CGSWindow = ctypes.int;
	this.CGSWindowOrderingMode = ctypes.int; // type is enum so i guess int - https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L66
	this.CGSWorkspace = ctypes.int;
	this.CGSValue = ctypes.int;
	this.CGWindowID = ctypes.uint32_t;
	this.CGWindowLevel = ctypes.int32_t;
	this.CGWindowLevelKey = ctypes.int32_t;
	this.CGWindowListOption = ctypes.uint32_t;
	this.ConstStr255Param = ctypes.unsigned_char.ptr;
	this.ConstStringPtr = ctypes.unsigned_char.ptr;
	this.EventTime = ctypes.double;
	this.ItemCount = ctypes.unsigned_long;
	this.UInt8 = ctypes.uint8_t; // osxtypes says ctypes.unsigned_char
	this.SInt16 = ctypes.short;
	this.SInt32 = ctypes.long;
	this.UInt16 = ctypes.unsigned_short;
	this.UInt32 = ctypes.uint32_t; // i was using ctypes.unsigned long but it is NOT 32bit. which caused problem on 64bit mac with RegisterEventHotKey i would keep getting invalid args error of -50
	this.UInt64 = ctypes.unsigned_long_long;
	this.UniChar = ctypes.jschar;
	this.VOID = ctypes.void_t;

	// ADVANCED TYPES // as per how it was defined in WinNT.h // defined by "simple types"
	this.AlertType = this.SInt16;
	this.CFAbsoluteTime = this.CFTimeInterval;
	this.DialogItemIndex = this.SInt16;
	this.EventKind = this.UInt16;
	this.EventMask = this.UInt16;
	this.EventTimeout = this.EventTime;
	this.FourCharCode = this.UInt32;
	this.FSEventStreamCreateFlags = this.UInt32;
	this.FSEventStreamEventFlags = this.UInt32;
	this.FSEventStreamEventId = this.UInt64;
	this.EventModifiers = this.UInt16;
	this.OptionBits = this.UInt32;
	this.OSErr = this.SInt16;
	this.OSStatus = this.SInt32;

	// SUPER ADVANCED TYPES // defined by "advanced types"
	this.LSRolesMask = this.OptionBits;
	this.OSType = this.FourCharCode;

	// SUPER DUPER ADVANCED TYPES // defined by "super advanced types"
	this.EventParamName = this.OSType;
    this.EventParamType = this.OSType;

	// GUESS TYPES - i know these are something else but setting them to voidptr_t or something just works and all the extra work isnt needed

	// STRUCTURES
	// consts for structures
	var struct_const = {

	};

	// SIMPLE STRUCTS // based on any of the types above
	this.__CFAllocator = ctypes.StructType('__CFAllocator');
	this.__CFArray = ctypes.StructType('__CFArray');
	this.__CFDictionary = ctypes.StructType('__CFDictionary');
	this.__CFError = ctypes.StructType('__CFError');
	this.__CFMachPort = ctypes.StructType('__CFMachPort');
	this.__CFRunLoop = ctypes.StructType('__CFRunLoop');
	this.__CFRunLoopSource = ctypes.StructType('__CFRunLoopSource');
	this.__CFRunLoopTimer = ctypes.StructType('__CFRunLoopTimer');
	this.__CFString = ctypes.StructType('__CFString');
	this.__CFURL = ctypes.StructType('__CFURL');
	this.__CGEvent = ctypes.StructType('__CGEvent');
	this.__CGEventTapProxy = ctypes.StructType('__CGEventTapProxy');
	this.__FSEventStream = ctypes.StructType("__FSEventStream");
	this.CGImage = ctypes.StructType('CGImage');
	this.CGContext = ctypes.StructType('CGContext');
	this.CGPoint = ctypes.StructType('CGPoint', [
		{ x: this.CGFloat },
		{ y: this.CGFloat }
	]);
	this.CGSize = ctypes.StructType('CGSize', [
		{ width: this.CGFloat },
		{ height: this.CGFloat }
	]);
	this.EventHotKeyID = ctypes.StructType('EventHotKeyID', [
		{ signature: this.OSType },
		{ id: this.UInt32 }
	]);
	this.EventTypeSpec = ctypes.StructType('EventTypeSpec', [
		{ eventClass: this.OSType },
		{ eventKind: this.UInt32 }
	]);
	this.FSRef = ctypes.StructType('FSRef', [
		{ hidden: this.UInt8.array(80) }
	]);
	this.OpaqueDialogPtr = ctypes.StructType('OpaqueDialogPtr');
	this.OpaqueEventHandlerCallRef = ctypes.StructType('OpaqueEventHandlerCallRef');
	this.OpaqueEventHandlerRef = ctypes.StructType('OpaqueEventHandlerRef');
	this.OpaqueEventHotKeyRef = ctypes.StructType('OpaqueEventHotKeyRef');
	this.OpaqueEventRef = ctypes.StructType('OpaqueEventRef');
	this.OpaqueEventTargetRef = ctypes.StructType('OpaqueEventTargetRef');
	this.OpaqueRgnHandle = ctypes.StructType('OpaqueRgnHandle');
	this.Point = ctypes.StructType('Point', [
		{ v: this.short },
		{ h: this.short }
	]);
	this.ProcessSerialNumber = ctypes.StructType('ProcessSerialNumber', [
		{ highLongOfPSN: this.UInt32 },
		{ lowLongOfPSN: this.UInt32 }
	]);
	this.timespec = ctypes.StructType('timespec', [ // http://www.opensource.apple.com/source/text_cmds/text_cmds-69/sort/timespec.h
		{ tv_sec: this.time_t },
		{ tv_nsec: this.long }
	]);

	// ADVANCED STRUCTS // based on "simple structs" to be defined first
	this.CFAllocatorRef = this.__CFAllocator.ptr;
	this.CFArrayRef = this.__CFArray.ptr;
	this.CFDictionaryRef = this.__CFDictionary.ptr;
	this.CFErrorRef = this.__CFError.ptr;
	this.CFMachPortRef = this.__CFMachPort.ptr;
	this.CFRunLoopRef = this.__CFRunLoop.ptr;
	this.CFRunLoopSourceRef = this.__CFRunLoopSource.ptr;
	this.CFRunLoopTimerRef = this.__CFRunLoopTimer.ptr
	this.CFStringRef = this.__CFString.ptr;
	this.CFURLRef = this.__CFURL.ptr;
	this.CGImageRef = this.CGImage.ptr;
	this.CGContextRef = this.CGContext.ptr;
	this.CGEventRef = this.__CGEvent.ptr;
	this.CGEventTapProxy = this.__CGEventTapProxy.ptr;
	this.CGRect = ctypes.StructType('CGRect', [
		{ origin: this.CGPoint },
		{ size: this.CGSize }
	]);
	this.ConstFSEventStreamRef = this.__FSEventStream.ptr;
	this.DialogPtr = this.OpaqueDialogPtr.ptr;
	this.EventHandlerCallRef = this.OpaqueEventHandlerCallRef.ptr;
	this.EventHandlerRef = this.OpaqueEventHandlerRef.ptr;
	this.EventHotKeyRef = this.OpaqueEventHotKeyRef.ptr;
	this.EventRecord = ctypes.StructType('EventRecord', [
		{ what: this.EventKind },
		{ message: this.unsigned_long },
		{ when: this.UInt32 },
		{ where: this.Point },
		{ modifiers: this.EventModifiers }
	]);
	this.EventRef = this.OpaqueEventRef.ptr;
	this.EventTargetRef = this.OpaqueEventTargetRef.ptr;
	this.FSEventStreamRef = this.__FSEventStream.ptr;
	this.RgnHandle = this.OpaqueRgnHandle.ptr;

	// FURTHER ADVANCED STRUCTS
	this.DialogRef = this.DialogPtr;

	// FURTHER ADV STRUCTS

	// FUNCTION TYPES
	this.CFAllocatorCopyDescriptionCallBack = ctypes.FunctionType(this.CALLBACK_ABI, this.CFStringRef, [this.void.ptr]).ptr; // https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFAllocatorRef/index.html#//apple_ref/doc/c_ref/CFAllocatorCopyDescriptionCallBack
	this.CFAllocatorRetainCallBack = ctypes.FunctionType(this.CALLBACK_ABI, this.void.ptr, [this.void.ptr]).ptr; // https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFAllocatorRef/index.html#//apple_ref/doc/c_ref/CFAllocatorRetainCallBack //  typedef const void *(*CFAllocatorRetainCallBack) ( const void *info );
	this.CFAllocatorReleaseCallBack = ctypes.FunctionType(this.CALLBACK_ABI, this.void, [this.void.ptr]).ptr; // https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFAllocatorRef/index.html#//apple_ref/doc/c_ref/CFAllocatorReleaseCallBack //  typedef void (*CFAllocatorReleaseCallBack) ( const void *info );
	this.CFArrayCopyDescriptionCallBack = ctypes.FunctionType(this.CALLBACK_ABI, this.CFStringRef, [this.void.ptr]).ptr;
	this.CFArrayEqualCallBack = ctypes.FunctionType(this.CALLBACK_ABI, this.Boolean, [this.void.ptr, this.void.ptr]).ptr;
	this.CFArrayReleaseCallBack = ctypes.FunctionType(this.CALLBACK_ABI, this.void, [this.CFAllocatorRef, this.void.ptr]).ptr;
	this.CFArrayRetainCallBack = ctypes.FunctionType(this.CALLBACK_ABI, this.void.ptr, [this.CFAllocatorRef, this.void.ptr]).ptr;
	this.CFRunLoopTimerCallBack = ctypes.FunctionType(this.CALLBACK_ABI, this.void, [this.CFRunLoopTimerRef, this.void.ptr]).ptr; // https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopTimerRef/index.html#//apple_ref/doc/c_ref/CFRunLoopTimerCallBack
	this.EventHandlerProcPtr = ctypes.FunctionType(this.CALLBACK_ABI, this.OSStatus, [this.EventHandlerCallRef, this.EventRef, this.void.ptr]).ptr;
	this.FSEventStreamCallback = ctypes.FunctionType(this.CALLBACK_ABI, this.void, [this.ConstFSEventStreamRef, this.void.ptr, this.size_t, this.void.ptr, this.FSEventStreamEventFlags.ptr, this.FSEventStreamEventId.ptr]).ptr;
	this.ModalFilterProcPtr = ctypes.FunctionType(this.CALLBACK_ABI, this.Boolean, [this.DialogRef, this.EventRecord.ptr, this.DialogItemIndex.ptr]).ptr;
	this.CGEventTapCallBack = ctypes.FunctionType(this.CALLBACK_ABI, this.CGEventRef, [this.CGEventTapProxy, this.CGEventType, this.CGEventRef, this.VOID.ptr]).ptr;

	// ADVANCED FUNCTION TYPES
	this.EventHandlerUPP = this.EventHandlerProcPtr;
	this.ModalFilterUPP = this.ModalFilterProcPtr;

	// STRUCTS USING FUNC TYPES
	this.AlertStdAlertParamRec = ctypes.StructType('AlertStdAlertParamRec', [
		{ movable: this.Boolean },
		{ helpButton: this.Boolean },
		{ filterProc: this.ModalFilterUPP },
		{ defaultText: this.ConstStringPtr },
		{ cancelText: this.ConstStringPtr },
		{ otherText: this.ConstStringPtr },
		{ defaultButton: this.SInt16 },
		{ cancelButton: this.SInt16 },
		{ position: this.UInt16 }
	]);
	this.CFArrayCallBacks = ctypes.StructType('CFArrayCallBacks', [
		{ version: this.CFIndex },
		{ retain: this.CFArrayRetainCallBack },
		{ release: this.CFArrayReleaseCallBack },
		{ copyDescription: this.CFArrayCopyDescriptionCallBack },
		{ equal: this.CFArrayEqualCallBack }
	]);
	this.CFRunLoopTimerContext = ctypes.StructType('CFRunLoopTimerContext', [ // https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopTimerRef/index.html#//apple_ref/c/tdef/CFRunLoopTimerContext
		{ version: this.CFIndex },
		{ info: this.void.ptr },
		{ retain: this.CFAllocatorRetainCallBack },
		{ release: this.CFAllocatorReleaseCallBack },
		{ copyDescription: this.CFAllocatorCopyDescriptionCallBack }
	]);
	this.FSEventStreamContext = ctypes.StructType('FSEventStreamContext', [
		{version: this.CFIndex},
		{info: this.void.ptr},
		{retain: this.CFAllocatorRetainCallBack},
		{release: this.CFAllocatorReleaseCallBack},
		{copyDescription: this.CFAllocatorCopyDescriptionCallBack}
	]);


	///// OBJC

	// SIMPLE OBJC TYPES
	this.BOOL = ctypes.signed_char;
	this.NSInteger = is64bit ? ctypes.long: ctypes.int;
	this.NSUInteger = is64bit ? ctypes.unsigned_long : ctypes.unsigned_int;
	this.NSTimeInterval = ctypes.double;

	// ADV OBJC TYPES
	this.NSBitmapFormat = this.NSUInteger;
	this.NSEventType = this.NSUInteger;
	this.NSEventMask = this.NSUInteger;
	this.NSURLBookmarkCreationOptions = this.NSUInteger;
	this.NSEventModifierFlags = this.NSUInteger; // guess

	// GUESS TYPES OBJC - they work though
	this.id = ctypes.voidptr_t;
	this.IMP = ctypes.voidptr_t;
	this.SEL = ctypes.voidptr_t;
	this.Class = ctypes.voidptr_t;
	this.NSEvent = ctypes.voidptr_t;
	this.NSWindow = ctypes.voidptr_t;

	// NULL CONSTs that i use for vaiadic args

	// SIMPLE OBJC STRUCTS
	this.Block_descriptor_1 = ctypes.StructType('Block_descriptor_1', [
		{ reserved: this.unsigned_long_long },
		{ size: this.unsigned_long_long }
	]);
	this.NSPoint = ctypes.StructType('_NSPoint', [
		{ 'x': this.CGFloat },
		{ 'y': this.CGFloat }
	]);
	this.NSSize = ctypes.StructType('_NSSize', [
		{ 'width': this.CGFloat },
		{ 'height': this.CGFloat }
	]);

	// ADV OBJC STRUCTS
	this.Block_literal_1 = ctypes.StructType('Block_literal_1', [
		{ isa: this.void.ptr },
		{ flags: this.int32_t },
		{ reserved: this.int32_t },
		{ invoke: this.void.ptr },
		{ descriptor: this.Block_descriptor_1.ptr }
	]);
	this.NSRect = ctypes.StructType('_NSRect', [
		{ 'origin': this.NSPoint },
		{ 'size': this.NSSize }
	]);

	// FUNC OBJC TYPES
	this.IMP_for_EventMonitorCallback = ctypes.FunctionType(this.CALLBACK_ABI, this.NSEvent.ptr, [this.id, this.NSEvent.ptr]);

	// LIBDISPATCH STUFF
	this.dispatch_block_t = ctypes.FunctionType(this.CALLBACK_ABI, this.void, []).ptr;
	this.dispatch_queue_t = ctypes.voidptr_t; // guess
}

var macInit = function() {
	var self = this;

	this.IS64BIT = is64bit;

	this.TYPE = new macTypes();

	// CONSTANTS
	var _const = {}; // lazy load consts
	this.CONST = {
		// C
		EINTR: 4,

		// CoreFoundation
		get CGRectNull () { if (!('CGRectNull' in _const)) { _const['CGRectNull'] = lib('CoreGraphics').declare('CGRectNull', self.TYPE.CGRect); } return _const['CGRectNull']; },
		get _NSConcreteGlobalBlock () { if (!('_NSConcreteGlobalBlock' in _const)) { _const['_NSConcreteGlobalBlock'] = lib('objc').declare('_NSConcreteGlobalBlock', self.TYPE.void.ptr); } return _const['_NSConcreteGlobalBlock']; },
		get kCFAllocatorDefault () { if (!('kCFAllocatorDefault' in _const)) { _const['kCFAllocatorDefault'] = lib('CoreFoundation').declare('kCFAllocatorDefault', self.TYPE.CFAllocatorRef); } return _const['kCFAllocatorDefault']; },
		get kCFAllocatorSystemDefault () { if (!('kCFAllocatorSystemDefault' in _const)) { _const['kCFAllocatorSystemDefault'] = lib('CoreFoundation').declare('kCFAllocatorSystemDefault', self.TYPE.CFAllocatorRef); } return _const['kCFAllocatorSystemDefault']; },
		get kCFRunLoopDefaultMode () { if (!('kCFRunLoopDefaultMode' in _const)) { _const['kCFRunLoopDefaultMode'] = lib('CoreFoundation').declare('kCFRunLoopDefaultMode', self.TYPE.CFStringRef); } return _const['kCFRunLoopDefaultMode']; },
		get kCFRunLoopCommonModes () { if (!('kCFRunLoopCommonModes' in _const)) { _const['kCFRunLoopCommonModes'] = lib('CoreFoundation').declare('kCFRunLoopCommonModes', self.TYPE.CFStringRef); } return _const['kCFRunLoopCommonModes']; },
		get kCFTypeArrayCallBacks () { if (!('kCFTypeArrayCallBacks' in _const)) { _const['kCFTypeArrayCallBacks'] = lib('CoreFoundation').declare('kCFTypeArrayCallBacks', self.TYPE.CFArrayCallBacks); } return _const['kCFTypeArrayCallBacks']; },
		get CGSDefaultConnection () { if (!('CGSDefaultConnection' in _const)) { _const['CGSDefaultConnection'] = self.API('_CGSDefaultConnection')(); } return _const['CGSDefaultConnection']; }, // https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L39
		kCGErrorSuccess: 0,
		kCGNullDirectDisplay: 0,
		kCGBaseWindowLevelKey: 0,
		kCGMinimumWindowLevelKey: 1,
		kCGDesktopWindowLevelKey: 2,
		kCGBackstopMenuLevelKey: 3,
		kCGNormalWindowLevelKey: 4,
		kCGFloatingWindowLevelKey: 5,
		kCGTornOffMenuWindowLevelKey: 6,
		kCGDockWindowLevelKey: 7,
		kCGMainMenuWindowLevelKey: 8,
		kCGStatusWindowLevelKey: 9,
		kCGModalPanelWindowLevelKey: 10,
		kCGPopUpMenuWindowLevelKey: 11,
		kCGDraggingWindowLevelKey: 12,
		kCGScreenSaverWindowLevelKey: 13,
		kCGMaximumWindowLevelKey: 14,
		kCGOverlayWindowLevelKey: 15,
		kCGHelpWindowLevelKey: 16,
		kCGUtilityWindowLevelKey: 17,
		kCGDesktopIconWindowLevelKey: 18,
		kCGCursorWindowLevelKey: 19,
		kCGAssistiveTechHighWindowLevelKey: 20,
		kCGNumberOfWindowLevelKeys: 21,
		kCGNullWindowID: 0,
		kCGWindowListOptionAll: 0,
		kCGWindowListOptionOnScreenOnly: 1,
		kCGWindowListOptionOnScreenAboveWindow: 2,
		kCGWindowListOptionOnScreenBelowWindow: 4,
		kCGWindowListOptionIncludingWindow: 8,
		kCGWindowListExcludeDesktopElements: 16,

		kCGHIDEventTap: 0,
	    kCGSessionEventTap: 1,
	    kCGAnnotatedSessionEventTap: 2,

		kCGHeadInsertEventTap: 0,
		kCGTailAppendEventTap: 1,

		kCGEventTapOptionDefault: 0,
		kCGEventTapOptionListenOnly: 1,

		cmdKey: 256, // https://github.com/artcompiler/artcompiler.github.com/blob/0137a9088614a287109fb1e6bdc4b132adfce312/demos/python2.7.4/lib/python2.7/plat-mac/Carbon/Events.py#L45
		shiftKey: 512,
		alphaLock: 1024,
		optionKey: 2048,
		controlKey: 4096,
		rightShiftKey: 8192,
		rightOptionKey: 16384,
		rightControlKey: 32768,

		kEventClassKeyboard: 0x6B657962, // OS_TYPE("keyb")
		kEventHotKeyPressed: 5,
		typeEventHotKeyID: 0x686b6964, // OS_TYPE("hkid")

		kCGEventNull: 0,
		kCGEventLeftMouseDown: 1,
		kCGEventLeftMouseUp: 2,
		kCGEventRightMouseDown: 3,
		kCGEventRightMouseUp: 4,
		kCGEventMouseMoved: 5,
		kCGEventLeftMouseDragged: 6,
		kCGEventRightMouseDragged: 7,
		kCGEventKeyDown: 10,
		kCGEventKeyUp: 11,
		kCGEventFlagsChanged: 12,
		kCGEventScrollWheel: 22,
		kCGEventTabletPointer: 23,
		kCGEventTabletProximity: 24,
		kCGEventOtherMouseDown: 25,
		kCGEventOtherMouseUp: 26,
		kCGEventOtherMouseDragged: 27,
		kCGEventTapDisabledByTimeout: 0xFFFFFFFE, // this.TYPE.CGEventType('0xFFFFFFFE'),
		kCGEventTapDisabledByUserInput: 0xFFFFFFFF, // this.TYPE.CGEventType('0xFFFFFFFF'),
		kCGEventMaskForAllEvents: ctypes.UInt64('0xffffffffffffffff'), // #define kCGEventMaskForAllEvents	(~(CGEventMask)0) // https://github.com/sschiesser/ASK_server/blob/a51e2fbdac894c37d97142fc72faa35f89057744/MacOSX10.6/System/Library/Frameworks/ApplicationServices.framework/Versions/A/Frameworks/CoreGraphics.framework/Versions/A/Headers/CGEventTypes.h#L380

		kCGMouseEventNumber: 0,
		kCGMouseEventClickState: 1,
		kCGMouseEventPressure: 2,
		kCGMouseEventButtonNumber: 3,
		kCGMouseEventDeltaX: 4,
		kCGMouseEventDeltaY: 5,
		kCGMouseEventInstantMouser: 6,
		kCGMouseEventSubtype: 7,

		kCGScrollWheelEventDeltaAxis1: 11,
		kCGScrollWheelEventDeltaAxis2: 12,
		kCGScrollWheelEventDeltaAxis3: 13,
		kCGScrollWheelEventFixedPtDeltaAxis1: 93,
		kCGScrollWheelEventFixedPtDeltaAxis2: 94,
		kCGScrollWheelEventFixedPtDeltaAxis3: 95,
		kCGScrollWheelEventPointDeltaAxis1: 96,
		kCGScrollWheelEventPointDeltaAxis2: 97,
		kCGScrollWheelEventPointDeltaAxis3: 98,
		kCGScrollWheelEventInstantMouser: 14,

		kCFRunLoopRunFinished: 1,
		kCFRunLoopRunStopped: 2,
		kCFRunLoopRunTimedOut: 3,
		kCFRunLoopRunHandledSource: 4,

		kCGSOrderAbove: 1,
		kCGSOrderBelow: -1,
		kCGSOrderOut: 0,

		NX_SYSDEFINED: 14,

		// http://opensource.apple.com//source/IOHIDFamily/IOHIDFamily-86.1/IOHIDSystem/IOKit/hidsystem/ev_keymap.h
		NX_NOSPECIALKEY: 0xFFFF,
		NX_KEYTYPE_SOUND_UP: 0,
        NX_KEYTYPE_SOUND_DOWN: 1,
        NX_KEYTYPE_BRIGHTNESS_UP: 2,
        NX_KEYTYPE_BRIGHTNESS_DOWN: 3,
        NX_KEYTYPE_CAPS_LOCK: 4,
        NX_KEYTYPE_HELP: 5,
        NX_KEYTYPE_POWER_KEY: 6,
        NX_KEYTYPE_MUTE: 7,
        NX_KEYTYPE_UP_ARROW_KEY: 8,
        NX_KEYTYPE_DOWN_ARROW_KEY: 9,
        NX_KEYTYPE_NUM_LOCK: 10,
        NX_KEYTYPE_CONTRAST_UP: 11,
        NX_KEYTYPE_CONTRAST_DOWN: 12,
        NX_KEYTYPE_LAUNCH_PANEL: 13,
        NX_KEYTYPE_EJECT: 14,
        NX_KEYTYPE_VIDMIRROR: 15,
        NX_KEYTYPE_PLAY: 16,
        NX_KEYTYPE_NEXT: 17,
        NX_KEYTYPE_PREVIOUS: 18,
        NX_KEYTYPE_FAST: 19,
        NX_KEYTYPE_REWIND: 20,
        NX_KEYTYPE_ILLUMINATION_UP: 21,
        NX_KEYTYPE_ILLUMINATION_DOWN: 22,
		NX_KEYTYPE_ILLUMINATION_TOGGLE: 23,

		NX_MODIFIERKEY_ALPHALOCK: 0,
		NX_MODIFIERKEY_SHIFT: 1,
		NX_MODIFIERKEY_CONTROL: 2,
		NX_MODIFIERKEY_ALTERNATE: 3,
		NX_MODIFIERKEY_COMMAND: 4,
		NX_MODIFIERKEY_NUMERICPAD: 5,
		NX_MODIFIERKEY_HELP: 6,
		NX_MODIFIERKEY_SECONDARYFN: 7,
		NX_MODIFIERKEY_NUMLOCK: 8,

		NX_MODIFIERKEY_RSHIFT: 9,
		NX_MODIFIERKEY_RCONTROL: 0,
		NX_MODIFIERKEY_RALTERNATE: 1,
		NX_MODIFIERKEY_RCOMMAND: 2,

		NSAlphaShiftKeyMask: 1 << 16,
		NSShiftKeyMask: 1 << 17,
		NSControlKeyMask: 1 << 18,
		NSAlternateKeyMask: 1 << 19,
		NSCommandKeyMask: 1 << 20,
		NSNumericPadKeyMask: 1 << 21,
		NSHelpKeyMask: 1 << 22,
		NSFunctionKeyMask: 1 << 23,
		NSDeviceIndependentModifierFlagsMask: 0xffff0000, // 0xffff0000UL // #if MAC_OS_X_VERSION_MAX_ALLOWED >= MAC_OS_X_VERSION_10_4

		kLSRolesNone: 1,
	    kLSRolesViewer: 2,
	    kLSRolesEditor: 4,
	    kLSRolesShell: 8,
	    kLSRolesAll: 0xffffffff, // sources show this as -1 but type is uint32 so this should be 0xffffffff

		kFSEventStreamCreateFlagFileEvents: 16, // https://github.com/bizonix/DropBoxLibrarySRC/blob/2e4a151caa88b48653f31a22cb207fff851b75f8/pyc_decrypted/latest/pymac/constants.py#L165
		kFSEventStreamCreateFlagNoDefer: 2,
		kFSEventStreamCreateFlagWatchRoot: 4,
		kFSEventStreamEventFlagNone: 0x00000000,
		kFSEventStreamEventFlagMustScanSubDirs: 0x00000001,
		kFSEventStreamEventFlagUserDropped: 0x00000002,
		kFSEventStreamEventFlagKernelDropped: 0x00000004,
		kFSEventStreamEventFlagEventIdsWrapped: 0x00000008,
		kFSEventStreamEventFlagHistoryDone: 0x00000010,
		kFSEventStreamEventFlagRootChanged: 0x00000020,
		kFSEventStreamEventFlagMount: 0x00000040,
		kFSEventStreamEventFlagUnmount: 0x00000080,
		kFSEventStreamEventFlagItemCreated: 0x00000100,
		kFSEventStreamEventFlagItemRemoved: 0x00000200,
		kFSEventStreamEventFlagItemInodeMetaMod: 0x00000400,
		kFSEventStreamEventFlagItemRenamed: 0x00000800,
		kFSEventStreamEventFlagItemModified: 0x00001000,
		kFSEventStreamEventFlagItemFinderInfoMod: 0x00002000,
		kFSEventStreamEventFlagItemChangeOwner: 0x00004000,
		kFSEventStreamEventFlagItemXattrMod: 0x00008000,
		kFSEventStreamEventFlagItemIsFile: 0x00010000,
		kFSEventStreamEventFlagItemIsDir: 0x00020000,
		kFSEventStreamEventFlagItemIsSymlink: 0x00040000,
		kFSEventStreamEventIdSinceNow: '0xFFFFFFFFFFFFFFFF', // must use wrapped in `self.TYPE.UInt64`

		///////// OBJC - all consts are wrapped in a type as if its passed to variadic it needs to have type defind, see jsctypes chat with arai on 051015 357p
		NO: self.TYPE.BOOL(0),
		NSPNGFileType: self.TYPE.NSUInteger(4),
		YES: self.TYPE.BOOL(1), // i do this instead of 1 becuase for varidic types we need to expclicitly define it
		NIL: self.TYPE.void.ptr(ctypes.UInt64('0x0')), // needed for varidic args, as i cant pass null there

		NSFileWriteFileExistsError: 516, // i dont use this a variadic, just for compare so i dont wrap this in a type, but the type is  NSInteger. I figured this because NSError says its code value is NSInteger. The types for NSFileWriteFileExistsError says its enum - but by looking up code i can see that enum is type NSInteger - sources: https://developer.apple.com/library/ios/documentation/Cocoa/Reference/Foundation/Classes/NSError_Class/index.html#//apple_ref/occ/instp/NSError/code && https://developer.apple.com/library/ios/documentation/Cocoa/Reference/Foundation/Miscellaneous/Foundation_Constants/index.html#//apple_ref/doc/constant_group/NSError_Codes
		NSURLBookmarkCreationSuitableForBookmarkFile: self.TYPE.NSURLBookmarkCreationOptions(1 << 10),

		NSApplicationActivateAllWindows: self.TYPE.NSUInteger(1 << 0),
		NSApplicationActivateIgnoringOtherApps: self.TYPE.NSUInteger(1 << 1),

		NSLeftMouseDown: 1,				// TYPES.NSEventType
		NSLeftMouseUp: 2,				// TYPES.NSEventType
		NSRightMouseDown: 3,			// TYPES.NSEventType
		NSRightMouseUp: 4,				// TYPES.NSEventType
		NSMouseMoved: 5,				// TYPES.NSEventType
		NSLeftMouseDragged: 6,			// TYPES.NSEventType
		NSRightMouseDragged: 7,			// TYPES.NSEventType
		NSMouseEntered: 8,				// TYPES.NSEventType
		NSMouseExited: 9,				// TYPES.NSEventType
		NSKeyDown: 10,					// TYPES.NSEventType
		NSKeyUp: 11,					// TYPES.NSEventType
		NSFlagsChanged: 12,				// TYPES.NSEventType
		NSAppKitDefined: 13,			// TYPES.NSEventType
		NSSystemDefined: 14,			// TYPES.NSEventType
		NSApplicationDefined: 15,		// TYPES.NSEventType
		NSPeriodic: 16,					// TYPES.NSEventType
		NSCursorUpdate: 17,				// TYPES.NSEventType
		NSScrollWheel: 22,				// TYPES.NSEventType
		NSTabletPoint: 23,				// TYPES.NSEventType
		NSTabletProximity: 24,			// TYPES.NSEventType
		NSOtherMouseDown: 25,			// TYPES.NSEventType
		NSOtherMouseUp: 26,				// TYPES.NSEventType
		NSOtherMouseDragged: 27,		// TYPES.NSEventType
		NSEventTypeGesture: 29,			// TYPES.NSEventType
		NSEventTypeMagnify: 30,			// TYPES.NSEventType
		NSEventTypeSwipe: 31,			// TYPES.NSEventType
		NSEventTypeRotate: 18,			// TYPES.NSEventType
		NSEventTypeBeginGesture: 19,	// TYPES.NSEventType
		NSEventTypeEndGesture: 20,		// TYPES.NSEventType
		NSEventTypeSmartMagnify: 32,	// TYPES.NSEventType
		NSEventTypeQuickLook: 33,		// TYPES.NSEventType
		NSEventTypePressure: 34,		// TYPES.NSEventType
		NSUIntegerMax: this.TYPE.NSUInteger(is64bit ? '0xffffffff' : '0xffff'),		// TYPES.NSUInteger

		BLOCK_HAS_COPY_DISPOSE: 1 << 25,
		BLOCK_HAS_CTOR: 1 << 26,
		BLOCK_IS_GLOBAL: 1 << 28,
		BLOCK_HAS_STRET: 1 << 29,
		BLOCK_HAS_SIGNATURE: 1 << 30,

		kVK_ANSI_A: 0,
		kVK_ANSI_S: 1,
		kVK_ANSI_D: 2,
		kVK_ANSI_F: 3,
		kVK_ANSI_H: 4,
		kVK_ANSI_G: 5,
		kVK_ANSI_Z: 6,
		kVK_ANSI_X: 7,
		kVK_ANSI_C: 8,
		kVK_ANSI_V: 9,
		kVK_ANSI_B: 11,
		kVK_ANSI_Q: 12,
		kVK_ANSI_W: 13,
		kVK_ANSI_E: 14,
		kVK_ANSI_R: 15,
		kVK_ANSI_Y: 16,
		kVK_ANSI_T: 17,
		kVK_ANSI_1: 18,
		kVK_ANSI_2: 19,
		kVK_ANSI_3: 20,
		kVK_ANSI_4: 21,
		kVK_ANSI_6: 22,
		kVK_ANSI_5: 23,
		kVK_ANSI_Equal: 24,
		kVK_ANSI_9: 25,
		kVK_ANSI_7: 26,
		kVK_ANSI_Minus: 27,
		kVK_ANSI_8: 28,
		kVK_ANSI_0: 29,
		kVK_ANSI_RightBracket: 30,
		kVK_ANSI_O: 31,
		kVK_ANSI_U: 32,
		kVK_ANSI_LeftBracket: 33,
		kVK_ANSI_I: 34,
		kVK_ANSI_P: 35,
		kVK_ANSI_L: 37,
		kVK_ANSI_J: 38,
		kVK_ANSI_Quote: 39,
		kVK_ANSI_K: 40,
		kVK_ANSI_Semicolon: 41,
		kVK_ANSI_Backslash: 42,
		kVK_ANSI_Comma: 43,
		kVK_ANSI_Slash: 44,
		kVK_ANSI_N: 45,
		kVK_ANSI_M: 46,
		kVK_ANSI_Period: 47,
		kVK_ANSI_Grave: 50,
		kVK_ANSI_KeypadDecimal: 65,
		kVK_ANSI_KeypadMultiply: 67,
		kVK_ANSI_KeypadPlus: 69,
		kVK_ANSI_KeypadClear: 71,
		kVK_ANSI_KeypadDivide: 75,
		kVK_ANSI_KeypadEnter: 76,
		kVK_ANSI_KeypadMinus: 78,
		kVK_ANSI_KeypadEquals: 81,
		kVK_ANSI_Keypad0: 82,
		kVK_ANSI_Keypad1: 83,
		kVK_ANSI_Keypad2: 84,
		kVK_ANSI_Keypad3: 85,
		kVK_ANSI_Keypad4: 86,
		kVK_ANSI_Keypad5: 87,
		kVK_ANSI_Keypad6: 88,
		kVK_ANSI_Keypad7: 89,
		kVK_ANSI_Keypad8: 91,
		kVK_ANSI_Keypad9: 92,
		kVK_Return: 36,
		kVK_Tab: 48,
		kVK_Space: 49,
		kVK_Delete: 51,
		kVK_Escape: 53,
		kVK_Command: 55,
		kVK_Shift: 56,
		kVK_CapsLock: 57,
		kVK_Option: 58,
		kVK_Control: 59,
		kVK_RightShift: 60,
		kVK_RightOption: 61,
		kVK_RightControl: 62,
		kVK_Function: 63,
		kVK_F17: 64,
		kVK_VolumeUp: 72,
		kVK_VolumeDown: 73,
		kVK_Mute: 74,
		kVK_F18: 79,
		kVK_F19: 80,
		kVK_F20: 90,
		kVK_F5: 96,
		kVK_F6: 97,
		kVK_F7: 98,
		kVK_F3: 99,
		kVK_F8: 100,
		kVK_F9: 101,
		kVK_F11: 103,
		kVK_F13: 105,
		kVK_F16: 106,
		kVK_F14: 107,
		kVK_F10: 109,
		kVK_F12: 111,
		kVK_F15: 113,
		kVK_Help: 114,
		kVK_Home: 115,
		kVK_PageUp: 116,
		kVK_ForwardDelete: 117,
		kVK_F4: 118,
		kVK_End: 119,
		kVK_F2: 120,
		kVK_PageDown: 121,
		kVK_F1: 122,
		kVK_LeftArrow: 123,
		kVK_RightArrow: 124,
		kVK_DownArrow: 125,
		kVK_UpArrow: 126,
		kVK_ISO_Section: 10,
		kVK_JIS_Yen: 93,
		kVK_JIS_Underscore: 94,
		kVK_JIS_KeypadComma: 95,
		kVK_JIS_Eisu: 102,
		kVK_JIS_Kana: 104,

		kEventParamDirectObject: 757935405,

		noErr: 0
	};

	// ADVANCED CONST
	this.CONST.NULL = this.CONST.NIL.address();

	this.CONST.NSLeftMouseDownMask = 1 << this.CONST.NSLeftMouseDown;
	this.CONST.NSLeftMouseUpMask = 1 << this.CONST.NSLeftMouseUp;
	this.CONST.NSRightMouseDownMask = 1 << this.CONST.NSRightMouseDown;
	this.CONST.NSRightMouseUpMask = 1 << this.CONST.NSRightMouseUp;
	this.CONST.NSMouseMovedMask = 1 << this.CONST.NSMouseMoved;
	this.CONST.NSLeftMouseDraggedMask = 1 << this.CONST.NSLeftMouseDragged;
	this.CONST.NSRightMouseDraggedMask = 1 << this.CONST.NSRightMouseDragged;
	this.CONST.NSMouseEnteredMask = 1 << this.CONST.NSMouseEntered;
	this.CONST.NSMouseExitedMask = 1 << this.CONST.NSMouseExited;
	this.CONST.NSKeyDownMask = 1 << this.CONST.NSKeyDown;
	this.CONST.NSKeyUpMask = 1 << this.CONST.NSKeyUp;
	this.CONST.NSFlagsChangedMask = 1 << this.CONST.NSFlagsChanged;
	this.CONST.NSAppKitDefinedMask = 1 << this.CONST.NSAppKitDefined;
	this.CONST.NSSystemDefinedMask = 1 << this.CONST.NSSystemDefined;
	this.CONST.NSApplicationDefinedMask = 1 << this.CONST.NSApplicationDefined;
	this.CONST.NSPeriodicMask = 1 << this.CONST.NSPeriodic;
	this.CONST.NSCursorUpdateMask = 1 << this.CONST.NSCursorUpdate;
	this.CONST.NSScrollWheelMask = 1 << this.CONST.NSScrollWheel;
	this.CONST.NSTabletPointMask = 1 << this.CONST.NSTabletPoint;
	this.CONST.NSTabletProximityMask = 1 << this.CONST.NSTabletProximity;
	this.CONST.NSOtherMouseDownMask = 1 << this.CONST.NSOtherMouseDown;
	this.CONST.NSOtherMouseUpMask = 1 << this.CONST.NSOtherMouseUp;
	this.CONST.NSOtherMouseDraggedMask = 1 << this.CONST.NSOtherMouseDragged;
	this.CONST.NSEventMaskGesture = 1 << this.CONST.NSEventTypeGesture;
	this.CONST.NSEventMaskMagnify = 1 << this.CONST.NSEventTypeMagnify;
	this.CONST.NSEventMaskSwipe = 1 << this.CONST.NSEventTypeSwipe;	// 1U << NSEventTypeSwipe
	this.CONST.NSEventMaskRotate = 1 << this.CONST.NSEventTypeRotate;
	this.CONST.NSEventMaskBeginGesture = 1 << this.CONST.NSEventTypeBeginGesture;
	this.CONST.NSEventMaskEndGesture = 1 << this.CONST.NSEventTypeEndGesture;
	this.CONST.NSEventMaskSmartMagnify = 1 << this.CONST.NSEventTypeSmartMagnify;	// 1ULL << NSEventTypeSmartMagnify;
	this.CONST.NSEventMaskPressure = 1 << this.CONST.NSEventTypePressure;	// 1ULL << NSEventTypePressure
	this.CONST.NSAnyEventMask = this.CONST.NSUIntegerMax; //0xffffffffU

	var _lib = {}; // cache for lib
	var lib = function(path) {
		//ensures path is in lib, if its in lib then its open, if its not then it adds it to lib and opens it. returns lib
		//path is path to open library
		//returns lib so can use straight away

		if (!(path in _lib)) {
			//need to open the library
			//default it opens the path, but some things are special like libc in mac is different then linux or like x11 needs to be located based on linux version
			switch (path) {
				case 'CarbonCore':

						_lib[path] = ctypes.open('/System/Library/Frameworks/CoreServices.framework/Frameworks/CarbonCore.framework/CarbonCore');

					break;
				case 'CoreFoundation':

						_lib[path] = ctypes.open('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation');

					break;
				case 'CoreGraphics':

						_lib[path] = ctypes.open('/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics');

					break;
				case 'FSEvents':

						try {
							// for osx 10.10
							_lib[path] = ctypes.open('/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/FSEvents.framework/Versions/A/FSEvents');
						} catch (ex) {
							if (ex.message.indexOf('couldn\'t open library') == -1) {
								throw ex; // failed due to some othe reason
							}
							// for osx < 10.10
							_lib[path] = lib('CarbonCore');
						}

					break;
				case 'libc':

						switch (osname) {
							case 'darwin':
								_lib[path] = ctypes.open('libc.dylib');
								break;
							case 'freebsd':
								_lib[path] = ctypes.open('libc.so.7');
								break;
							case 'openbsd':
								_lib[path] = ctypes.open('libc.so.61.0');
								break;
							case 'android':
							case 'sunos':
							case 'netbsd': // physically unverified
							case 'dragonfly': // physcially unverified
								_lib[path] = ctypes.open('libc.so');
								break;
							case 'linux':
								_lib[path] = ctypes.open('libc.so.6');
								break;
							case 'gnu/kfreebsd': // physically unverified
								lib = ctypes.open('libc.so.0.1');
								break;
							default:
								throw new Error({
									name: 'watcher-api-error',
									message: 'Path to libc on operating system of , "' + OS.Constants.Sys.Name + '" is not supported for kqueue'
								});
						}

					break;
				case 'objc':

						_lib[path] = ctypes.open(ctypes.libraryName('objc'));

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
		_CGSDefaultConnection: function () {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L39
			 * CGSConnection _CGSDefaultConnection(
			 *   void
			 * );
			 */
			return lib('CoreGraphics').declare('_CGSDefaultConnection', self.TYPE.ABI,
				self.TYPE.CGSConnection		// return
			);
		},
		CGSConnectionGetPID: function () {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L108
			 * CGError CGSConnectionGetPID(
			 *   const CGSConnection cid,
			 *   pid_t *pid,
			 *   const CGSConnection ownerCid
			 * );
			 */
			return lib('CoreGraphics').declare('CGSConnectionGetPID', self.TYPE.ABI,
				self.TYPE.CGError,			// return
				self.TYPE.CGSConnection,	// cid
				self.TYPE.pid_t.ptr,		// *pid
				self.TYPE.CGSConnection		// ownerCid
			);
		},
		CGSMoveWorkspaceWindowList: function() {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L96
			 * CGError CGSMoveWorkspaceWindowList(
			 *   const CGSConnection connection,
			 *   CGSWindow *wids,
			 *   int count,
			 *   CGSWorkspace toWorkspace
			 * );
			 */
			return lib('CoreGraphics').declare('CGSMoveWorkspaceWindowList', self.TYPE.ABI,
				self.TYPE.CGError,			// return
				self.TYPE.CGSConnection,	// cid
				self.TYPE.CGSWindow.ptr,	// *wids
				self.TYPE.CGSWorkspace		// toWorkspace
			);
		},
		CGSGetWindowCount: function() {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L48
			 * CGError CGSGetWindowCount(
			 *   const CGSConnection cid,
			 *   CGSConnection targetCID,
			 *   int* outCount
			 * );
			 */
			return lib('CoreGraphics').declare('CGSGetWindowCount', self.TYPE.ABI,
				self.TYPE.CGError,			// return
				self.TYPE.CGSConnection,	// cid
				self.TYPE.CGSConnection,	// targetCID
				self.TYPE.int.ptr			// outCount
			);
		},
		CGSGetWindowWorkspace: function() {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L196
			 * CGError CGSGetWindowWorkspace(
			 *   const CGSConnection cid,
			 *   const CGSWindow wid,
			 *   CGSWorkspace *workspace
			 * );
			 */
			return lib('CoreGraphics').declare('CGSGetWindowWorkspace', self.TYPE.ABI,
				self.TYPE.CGError,			// return
				self.TYPE.CGSConnection,	// cid
				self.TYPE.CGSWindow,		// wid
				self.TYPE.CGSWorkspace.ptr	// *workspace
			);
		},
		CGSGetWindowOwner: function() {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L107
			 * CGError CGSGetWindowOwner(
			 *   const CGSConnection cid,
			 *   const CGSWindow wid,
			 *   CGSConnection *ownerCid
			 * );
			 */
			return lib('CoreGraphics').declare('CGSGetWindowOwner', self.TYPE.ABI,
				self.TYPE.CGError,			// return
				self.TYPE.CGSConnection,	// cid
				self.TYPE.CGSWindow,		// wid
				self.TYPE.CGSConnection.ptr	// *ownerCid
			);
		},
		CGSGetWorkspace: function() {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L56
			 * CGSGetWorkspace(
			 *   const CGSConnection cid,
			 *   CGSWorkspace *workspace
			 * );
			 */
			return lib('CoreGraphics').declare('CGSGetWorkspace', self.TYPE.ABI,
				self.TYPE.CGError,			// return
				self.TYPE.CGSConnection,	// cid
				self.TYPE.CGSWorkspace.ptr	// *workspace
			);
		},
		CGSOrderWindow: function() {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L72
			 * CGError CGSOrderWindow(
			 *   const CGSConnection cid,
			 *   const CGSWindow wid,
			 *   CGSWindowOrderingMode place,
			 *   CGSWindow relativeToWindowID		// can be NULL
			 * );
			 */
			return lib('CoreGraphics').declare('CGSOrderWindow', self.TYPE.ABI,
				self.TYPE.CGError,					// return
				self.TYPE.CGSConnection,			// cid
				self.TYPE.CGSWindow,				// wid
				self.TYPE.CGSWindowOrderingMode,	// place
				self.TYPE.CGSWindow					// relativeToWindowID
			);
		},
		CGSSetWorkspace: function() {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L197
			 * CGError CGSSetWorkspace(
			 *   const CGSConnection cid,
			 *   CGSWorkspace workspace
			 * );
			 */
			return lib('CoreGraphics').declare('CGSSetWorkspace', self.TYPE.ABI,
				self.TYPE.CGError,			// return
				self.TYPE.CGSConnection,	// cid
				self.TYPE.CGSWorkspace		// workspace
			);
		},
		CGSSetWorkspaceWithTransition: function() {
			/* https://gist.github.com/Noitidart/3664c5c2059c9aa6779f#file-cgsprivate-h-L198
			 * CGError CGSSetWorkspaceWithTransition(
			 *   const CGSConnection cid,
			 *   CGSWorkspace workspace,
			 *   CGSTransitionType transition,
			 *   CGSTransitionOption subtype,
			 *   float time
			 * );
			 */
			return lib('CoreGraphics').declare('CGSSetWorkspaceWithTransition', self.TYPE.ABI,
				self.TYPE.CGError,				// return
				self.TYPE.CGSConnection,		// cid
				self.TYPE.CGSWorkspace,			// workspace
				self.TYPE.CGSTransitionType,	// transition
				self.TYPE.CGSTransitionOption,	// subtype
				self.TYPE.float					// time
			);
		},
		CFAbsoluteTimeGetCurrent: function() {
			/* https://developer.apple.com/library/mac/documentation/CoreFoundation/Reference/CFTimeUtils/index.html#//apple_ref/c/func/CFAbsoluteTimeGetCurrent
			 * CFAbsoluteTime CFAbsoluteTimeGetCurrent (
			 *   void
			 * );
			 */
			return lib('CoreFoundation').declare('CFAbsoluteTimeGetCurrent', self.TYPE.ABI,
				self.TYPE.CFAbsoluteTime	// return
			);
		},
		CFArrayCreate: function() {
			return lib('CoreFoundation').declare('CFArrayCreate', self.TYPE.ABI,
				self.TYPE.CFArrayRef,
				self.TYPE.CFAllocatorRef,
				self.TYPE.void.ptr.ptr,
				self.TYPE.CFIndex,
				self.TYPE.CFArrayCallBacks.ptr
			);
		},
		CFArrayGetCount: function() {
			return lib('CoreFoundation').declare('CFArrayGetCount', self.TYPE.ABI,
				self.TYPE.CFIndex,
				self.TYPE.CFArrayRef
			);
		},
		CFArrayGetValueAtIndex: function() {
			return lib('CoreFoundation').declare('CFArrayGetValueAtIndex', self.TYPE.ABI,
				self.TYPE.void.ptr,
				self.TYPE.CFArrayRef,
				self.TYPE.CFIndex
			);
		},
		CFMachPortCreateRunLoopSource: function() {
			return lib('CoreFoundation').declare('CFMachPortCreateRunLoopSource', self.TYPE.ABI,
				self.TYPE.CFRunLoopSourceRef,
				self.TYPE.CFAllocatorRef,
				self.TYPE.CFMachPortRef,
				self.TYPE.CFIndex
			);
		},
		CFRunLoopAddSource: function() {
			return lib('CoreFoundation').declare('CFRunLoopAddSource', self.TYPE.ABI,
				self.TYPE.VOID,
				self.TYPE.CFRunLoopRef,
				self.TYPE.CFRunLoopSourceRef,
				self.TYPE.CFStringRef
			);
		},
		CFRunLoopAddTimer: function() {
			/* https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopRef/index.html#//apple_ref/c/func/CFRunLoopAddTimer
			 * void CFRunLoopAddTimer (
			 *   CFRunLoopRef rl,
			 *   CFRunLoopTimerRef timer,
			 *   CFStringRef mode
			 * );
			 */
			return lib('CoreFoundation').declare('CFRunLoopAddTimer', self.TYPE.ABI,
				self.TYPE.void,					// return
				self.TYPE.CFRunLoopRef,			// rl
				self.TYPE.CFRunLoopTimerRef,	// timer
				self.TYPE.CFStringRef			// mode
			);
		},
		CFRunLoopGetCurrent: function() {
			return lib('CoreFoundation').declare('CFRunLoopGetCurrent', self.TYPE.ABI,
				self.TYPE.CFRunLoopRef
			);
		},
		CFRunLoopRemoveTimer: function() {
			/* https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopRef/index.html#//apple_ref/c/func/CFRunLoopRemoveTimer
			 * void CFRunLoopRemoveTimer (
			 *   CFRunLoopRef rl,
			 *   CFRunLoopTimerRef timer,
			 *   CFStringRef mode
			 * );
			 */
			return lib('CoreFoundation').declare('CFRunLoopRemoveTimer', self.TYPE.ABI,
				self.TYPE.void,					// return
				self.TYPE.CFRunLoopRef,			// rl
				self.TYPE.CFRunLoopTimerRef,	// timer
				self.TYPE.CFStringRef			// mode
			);
		},
		CFRunLoopRemoveSource: function() {
			lib('CoreFoundation').declare('CFRunLoopRemoveSource', self.TYPE.ABI,
				self.TYPE.VOID,
				self.TYPE.CFRunLoopRef,
				self.TYPE.CFRunLoopSourceRef,
				self.TYPE.CFStringRef
			);
		},
		CFRunLoopRun: function() {
			/* https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopRef/index.html#//apple_ref/c/func/CFRunLoopRun
			*/
			return lib('CoreFoundation').declare('CFRunLoopRun', self.TYPE.ABI,
				self.TYPE.VOID
			);
		},
		CFRunLoopRunInMode: function() {
			/* https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopRef/index.html#//apple_ref/c/func/CFRunLoopRunInMode
			*/
			return lib('CoreFoundation').declare("CFRunLoopRunInMode", self.TYPE.ABI,
				self.TYPE.SInt32,
				self.TYPE.CFStringRef,
				self.TYPE.CFTimeInterval,
				self.TYPE.Boolean
			);
		},
		CFRunLoopSourceInvalidate: function() {
			return lib('CoreFoundation').declare('CFRunLoopSourceInvalidate', self.TYPE.ABI,
				self.TYPE.VOID,
				self.TYPE.CFRunLoopSourceRef
			);
		},
		CFRunLoopStop: function() {
			/* https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopRef/index.html#//apple_ref/c/func/CFRunLoopStop
			*/
			return lib('CoreFoundation').declare('CFRunLoopStop', self.TYPE.ABI,
				self.TYPE.VOID,
				self.TYPE.CFRunLoopRef
			);
		},
		CFRunLoopTimerCreate: function() {
			/* https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopTimerRef/index.html#//apple_ref/c/func/CFRunLoopTimerCreate
			 * CFRunLoopTimerRef CFRunLoopTimerCreate (
			 *   CFAllocatorRef allocator,
			 *   CFAbsoluteTime fireDate,
			 *   CFTimeInterval interval,
			 *   CFOptionFlags flags,
			 *   CFIndex order,
			 *   CFRunLoopTimerCallBack callout,
			 *   CFRunLoopTimerContext *context
			 * );
			 */
			return lib('CoreFoundation').declare('CFRunLoopTimerCreate', self.TYPE.ABI,
				self.TYPE.CFRunLoopTimerRef,		// return
				self.TYPE.CFAllocatorRef,			// allocator
				self.TYPE.CFAbsoluteTime,			// fireDate
				self.TYPE.CFTimeInterval,			// interval
				self.TYPE.CFOptionFlags,			// flags
				self.TYPE.CFIndex,					// order
				self.TYPE.CFRunLoopTimerCallBack,	// callout
				self.TYPE.CFRunLoopTimerContext.ptr	// *context
			);
		},
		CFRunLoopTimerInvalidate: function() {
			/* https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopTimerRef/index.html#//apple_ref/c/func/CFRunLoopTimerInvalidate
			 * void CFRunLoopTimerInvalidate (
			 *   CFRunLoopTimerRef timer
			 * );
			 */
			return lib('CoreFoundation').declare('CFRunLoopTimerInvalidate', self.TYPE.ABI,
				self.TYPE.void,					// return
				self.TYPE.CFRunLoopTimerRef		// timer
			);
		},
		CFStringCreateWithCharacters: function() {
			/* https://developer.apple.com/library/mac/documentation/CoreFoundation/Reference/CFStringRef/#//apple_ref/c/func/CFStringCreateWithCharacters
			 * CFStringRef CFStringCreateWithCharacters (
			 *   CFAllocatorRef alloc,
			 *   const UniChar *chars,
			 *   CFIndex numChars
			 * );
			 */
			return lib('CoreFoundation').declare('CFStringCreateWithCharacters', self.TYPE.ABI,
				self.TYPE.CFStringRef,		// return
				self.TYPE.CFAllocatorRef,	// alloc
				self.TYPE.UniChar.ptr,		// *chars
				self.TYPE.CFIndex			// numChars
			);
		},
		CFRelease: function() {
			/* https://developer.apple.com/library/mac/documentation/CoreFoundation/Reference/CFTypeRef/#//apple_ref/c/func/CFRelease
			 * void CFRelease (
			 *   CFTypeRef cf
			 * );
			 */
			return lib('CoreFoundation').declare('CFRelease', self.TYPE.ABI,
				self.TYPE.void,		// return
				self.TYPE.CFTypeRef	// cf
			);
		},
		CFRunLoopRun: function() {
			/* https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopRef/index.html#//apple_ref/c/func/CFRunLoopRun
			*/
			return lib('CoreFoundation').declare('CFRunLoopRun', self.TYPE.ABI,
				self.TYPE.VOID
			);
		},
		CFRunLoopRunInMode: function() {
			/* https://developer.apple.com/library/ios/documentation/CoreFoundation/Reference/CFRunLoopRef/index.html#//apple_ref/c/func/CFRunLoopRunInMode
			*/
			return lib('CoreFoundation').declare("CFRunLoopRunInMode", self.TYPE.ABI,
				self.TYPE.SInt32,
				self.TYPE.CFStringRef,
				self.TYPE.CFTimeInterval,
				self.TYPE.Boolean
			);
		},
		CGContextClearRect: function() {
			return lib('CoreGraphics').declare('CGContextClearRect', self.TYPE.ABI,
				self.TYPE.void,
				self.TYPE.CGContextRef,
				self.TYPE.CGRect
			);
		},
		CGContextDrawImage: function() {
			/* https://developer.apple.com/library/mac/documentation/GraphicsImaging/Reference/CGContext/index.html#//apple_ref/c/func/CGContextDrawImage
			 * void CGContextDrawImage (
			 *   CGContextRef c,
			 *   CGRect rect,
			 *   CGImageRef image
			 * );
			 */
			return lib('CoreGraphics').declare('CGContextDrawImage', self.TYPE.ABI,
				self.TYPE.void,		// return
				self.TYPE.CGContextRef,	// c
				self.TYPE.CGRect,		// rect
				self.TYPE.CGImageRef		// image
			);
		},
		CGDisplayBounds: function() {
			return lib('CoreGraphics').declare('CGDisplayBounds', self.TYPE.ABI,
				self.TYPE.CGRect,
				self.TYPE.CGDirectDisplayID
			);
		},
		CGDisplayCreateImage: function() {
			return lib('CoreGraphics').declare('CGDisplayCreateImage', self.TYPE.ABI,
				self.TYPE.CGImageRef,
				self.TYPE.CGDirectDisplayID
			);
		},
		CGDisplayHideCursor: function() {
			return lib('CoreGraphics').declare('CGDisplayHideCursor', self.TYPE.ABI,
				self.TYPE.CGError,
				self.TYPE.CGDirectDisplayID
			);
		},
		CGDisplayMirrorsDisplay: function() {
			return lib('CoreGraphics').declare('CGDisplayMirrorsDisplay', self.TYPE.ABI,
				self.TYPE.CGDirectDisplayID,
				self.TYPE.CGDirectDisplayID
			);
		},
		CGDisplayShowCursor: function() {
			return lib('CoreGraphics').declare('CGDisplayShowCursor', self.TYPE.ABI,
				self.TYPE.CGError,
				self.TYPE.CGDirectDisplayID
			);
		},
		CGEventGetIntegerValueField: function() {
			/* https://developer.apple.com/library/mac/documentation/Carbon/Reference/QuartzEventServicesRef/index.html#//apple_ref/c/func/CGEventGetIntegerValueField
			 * int64_t CGEventGetIntegerValueField (
			 *   CGEventRef event,
			 *   CGEventField field
			 * );
			 */
			return lib('CoreGraphics').declare('CGEventGetIntegerValueField', self.TYPE.ABI,
				self.TYPE.int64_t,		// return
				self.TYPE.CGEventRef,	// event
				self.TYPE.CGEventField	// field
			);
		},
		CGEventMaskBit: function() {
			/* https://developer.apple.com/library/mac/documentation/Carbon/Reference/QuartzEventServicesRef/index.html#//apple_ref/c/macro/CGEventMaskBit
			 * CGEventMask CGEventMaskBit (
			 *   CGEventType eventType
			 * );
			 */
			// its inlined apparently: as this doesnt work
			  // return lib('CoreGraphics').declare('CGEventMaskBit', self.TYPE.ABI,
			  // 	self.TYPE.CGEventType
			  // );
			// inlined found here: https://github.com/sschiesser/ASK_server/blob/a51e2fbdac894c37d97142fc72faa35f89057744/MacOSX10.6/System/Library/Frameworks/ApplicationServices.framework/Versions/A/Frameworks/CoreGraphics.framework/Versions/A/Headers/CGEventTypes.h#L377
			  // #define CGEventMaskBit(eventType) ((CGEventMask)1 << (eventType))
			return function(eventType) {
				return self.TYPE.CGEventMask(1 << eventType);
			};
		},
		CGEventTapCreate: function() {
			/* https://developer.apple.com/library/mac/documentation/Carbon/Reference/QuartzEventServicesRef/index.html#//apple_ref/c/func/CGEventTapCreate
			 * CFMachPortRef CGEventTapCreate (
			 *   CGEventTapLocation tap
			 *   CGEventTapPlacement place
			 *   CGEventTapOptions options
			 *   CGEventMask eventsOfInterest
			 *   CGEventTapCallBack callback
			 *   void *userInfo
			 * );
			 */
			return lib('CoreGraphics').declare('CGEventTapCreate', self.TYPE.ABI,
				self.TYPE.CFMachPortRef,
				self.TYPE.CGEventTapLocation,
				self.TYPE.CGEventTapPlacement,
				self.TYPE.CGEventTapOptions,
				self.TYPE.CGEventMask,
				self.TYPE.CGEventTapCallBack,
				self.TYPE.VOID.ptr
			);
		},
		CGEventTapCreateForPSN: function() {
			/* https://developer.apple.com/library/mac/documentation/Carbon/Reference/QuartzEventServicesRef/index.html#//apple_ref/c/func/CGEventTapCreateForPSN
			 * CFMachPortRef CGEventTapCreateForPSN (
			 *   void *processSerialNumber,
			 *   CGEventTapPlacement place,
			 *   CGEventTapOptions options,
			 *   CGEventMask eventsOfInterest,
			 *   CGEventTapCallBack callback,
			 *   void *userInfo
			 * );
			 */
			// oxtypes uses libpath: '/System/Library/Frameworks/ApplicationServices.framework/Frameworks/CoreGraphics.framework/CoreGraphics' both work for me though,  tested on osx 10
			return lib('CoreGraphics').declare('CGEventTapCreateForPSN', self.TYPE.ABI,
				self.TYPE.CFMachPortRef,
				self.TYPE.VOID.ptr,
				self.TYPE.CGEventTapPlacement,
				self.TYPE.CGEventTapOptions,
				self.TYPE.CGEventMask,
				self.TYPE.CGEventTapCallBack,
				self.TYPE.VOID.ptr
			);
		},
		CGEventTapEnable: function() {
			return lib('CoreGraphics').declare('CGEventTapEnable', self.TYPE.ABI,
				self.TYPE.VOID,
				self.TYPE.CFMachPortRef,
				self.TYPE.bool
			);
		},
		CGGetActiveDisplayList: function() {
			/* https://developer.apple.com/library/mac/documentation/GraphicsImaging/Reference/Quartz_Services_Ref/index.html#//apple_ref/c/func/CGGetActiveDisplayList
			 * CGError CGGetActiveDisplayList (
			 *   uint32_t maxDisplays,
			 *   CGDirectDisplayID *activeDisplays,
			 *   uint32_t *displayCount
			 * );
			 */
			return lib('CoreGraphics').declare('CGGetActiveDisplayList', self.TYPE.ABI,
				self.TYPE.CGError,					// return
				self.TYPE.uint32_t,					// maxDisplays
				self.TYPE.CGDirectDisplayID.ptr,	// *activeDisplays
				self.TYPE.uint32_t.ptr				// *displayCount
			);
		},
		CGWindowLevelForKey: function() {
			return lib('CoreGraphics').declare('CGWindowLevelForKey', self.TYPE.ABI,
				self.TYPE.CGWindowLevel,
				self.TYPE.CGWindowLevelKey
			);
		},
		CGWindowListCopyWindowInfo: function() {
			/* https://developer.apple.com/library/mac/documentation/Carbon/Reference/CGWindow_Reference/Reference/Functions.html
			 * CFArrayRef CGWindowListCopyWindowInfo(
			 *   CGWindowListOption option,
			 *   CGWindowID relativeToWindow
			 * );
			 */
			return lib('CoreGraphics').declare('CGWindowListCopyWindowInfo', self.TYPE.ABI,
				self.TYPE.CFArrayRef,
				self.TYPE.CGWindowListOption,
				self.TYPE.CGWindowID
			);
		},
		CGImageRelease: function() {
			return lib('CoreGraphics').declare('CGImageRelease', self.TYPE.ABI,
				self.TYPE.void,
				self.TYPE.CGImageRef
			);
		},
		CGRectMake: function() {
			/* https://developer.apple.com/library/ios/documentation/GraphicsImaging/Reference/CGGeometry/index.html#//apple_ref/c/func/CGRectMake
			 *  CGRect CGRectMake (
			 *    CGFloat x,
			 *    CGFloat y,
			 *    CGFloat width,
			 *    CGFloat height
			 * );
			 */
			 /*
			 // its inlined, so this declare doesnt work, see: http://stackoverflow.com/questions/30158864/cgrectmake-symbol-not-found#comment48456276_30173759
			return lib('CGGeometry').declare('CGRectMake', self.TYPE.ABI,
				self.TYPE.CGRect,	// return
				self.TYPE.CGFloat,	// x
				self.TYPE.CGFloat,	// y
				self.TYPE.CGFloat,	// width
				self.TYPE.CGFloat	// height
			);
			*/
			return function(x, y, width, height) {
				return self.TYPE.CGRect(
					self.TYPE.CGPoint(x, y),
					self.TYPE.CGSize(width, height)
				);
			};
		},
		CGRectMakeWithDictionaryRepresentation: function() {
			/* https://developer.apple.com/library/ios/documentation/GraphicsImaging/Reference/CGGeometry/index.html#//apple_ref/c/func/CGRectMakeWithDictionaryRepresentation
			 * bool CGRectMakeWithDictionaryRepresentation (
			 *   CFDictionaryRef dict,
			 *   CGRect *rect
			 * );
			 */
			return lib('CoreGraphics').declare('CGRectMakeWithDictionaryRepresentation', self.TYPE.ABI,
				ctypes.bool,				// return
				self.TYPE.CFDictionaryRef,	// dict
				self.TYPE.CGRect.ptr		// *rect
			);
		},
		CGRectGetHeight: function() {
			return lib('CoreGraphics').declare('CGRectGetHeight', self.TYPE.ABI,
				self.TYPE.CGFloat,
				self.TYPE.CGRect
			);
		},
		CGRectGetMaxX: function() {
			return lib('CoreGraphics').declare('CGRectGetMaxX', ctypes.default_abi,
				self.TYPE.CGFloat,
				self.TYPE.CGRect
			);
		},
		CGRectGetMaxY: function() {
			return lib('CoreGraphics').declare('CGRectGetMaxY', ctypes.default_abi,
				self.TYPE.CGFloat,
				self.TYPE.CGRect
			);
		},
		CGRectGetWidth: function() {
			return lib('CoreGraphics').declare('CGRectGetWidth', self.TYPE.ABI,
				self.TYPE.CGFloat,
				self.TYPE.CGRect
			);
		},
		CGRectUnion: function() {
			return lib('CoreGraphics').declare('CGRectUnion', self.TYPE.ABI,
				self.TYPE.CGRect,
				self.TYPE.CGRect,
				self.TYPE.CGRect
			);
		},
		FSEventsGetCurrentEventId: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/FSEvents_Ref/#//apple_ref/c/func/FSEventsGetCurrentEventId
			 * extern FSEventStreamEventId FSEventsGetCurrentEventId( void);
			 */
			return lib('FSEvents').declare('FSEventsGetCurrentEventId', self.TYPE.ABI,
				self.TYPE.FSEventStreamEventId
			);
		},
		FSEventStreamCreate: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/FSEvents_Ref/#//apple_ref/c/func/FSEventStreamCreate
			 * extern FSEventStreamRef FSEventStreamCreate( CFAllocatorRef allocator, FSEventStreamCallback callback, FSEventStreamContext *context, CFArrayRef pathsToWatch, FSEventStreamEventId sinceWhen, CFTimeInterval latency, FSEventStreamCreateFlags flags);
			 */
			return lib('FSEvents').declare('FSEventStreamCreate', self.TYPE.ABI,
				self.TYPE.FSEventStreamRef,
				self.TYPE.CFAllocatorRef,
				self.TYPE.FSEventStreamCallback,
				self.TYPE.FSEventStreamContext.ptr,
				self.TYPE.CFArrayRef,
				self.TYPE.FSEventStreamEventId,
				self.TYPE.CFTimeInterval,
				self.TYPE.FSEventStreamCreateFlags
			);
		},
		FSEventStreamInvalidate: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/FSEvents_Ref/#//apple_ref/c/func/FSEventStreamInvalidate
			 * extern void FSEventStreamInvalidate( FSEventStreamRef streamRef);
			 */
			return lib('FSEvents').declare('FSEventStreamInvalidate', self.TYPE.ABI,
				self.TYPE.void,
				self.TYPE.FSEventStreamRef
			);
		},
		FSEventStreamRelease: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/FSEvents_Ref/#//apple_ref/c/func/FSEventStreamRelease
			 * extern void FSEventStreamRelease( FSEventStreamRef streamRef);
			 */
			return lib('FSEvents').declare('FSEventStreamRelease', self.TYPE.ABI,
				self.TYPE.void,
				self.TYPE.FSEventStreamRef
			);
		},
		FSEventStreamScheduleWithRunLoop: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/FSEvents_Ref/#//apple_ref/c/func/FSEventStreamScheduleWithRunLoop
			 * extern void FSEventStreamScheduleWithRunLoop( FSEventStreamRef streamRef, CFRunLoopRef runLoop, CFStringRef runLoopMode);
			 */
			return lib('FSEvents').declare('FSEventStreamScheduleWithRunLoop', self.TYPE.ABI,
				self.TYPE.void,
				self.TYPE.FSEventStreamRef,
				self.TYPE.CFRunLoopRef,
				self.TYPE.CFStringRef
			);
		},
		FSEventStreamStart: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/FSEvents_Ref/#//apple_ref/c/func/FSEventStreamStart
			 * extern Boolean FSEventStreamStart( FSEventStreamRef streamRef);
			 */
			return lib('FSEvents').declare('FSEventStreamStart', self.TYPE.ABI,
				self.TYPE.Boolean,
				self.TYPE.FSEventStreamRef
			);
		},
		FSEventStreamStop: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/FSEvents_Ref/#//apple_ref/c/func/FSEventStreamStop
			 * extern void FSEventStreamStop( FSEventStreamRef streamRef);
			 */
			return lib('FSEvents').declare('FSEventStreamStop', self.TYPE.ABI,
				self.TYPE.void,
				self.TYPE.FSEventStreamRef
			);
		},
		FSEventStreamUnscheduleFromRunLoop: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/FSEvents_Ref/#//apple_ref/c/func/FSEventStreamUnscheduleFromRunLoop
			 * extern void FSEventStreamUnscheduleFromRunLoop(
			 *   FSEventStreamRef streamRef,
			 *   CFRunLoopRef runLoop,
			 *   CFStringRef runLoopMode
		 	 * );
			 */
			return lib('FSEvents').declare('FSEventStreamUnscheduleFromRunLoop', self.TYPE.ABI,
				self.TYPE.void,					// return
				self.TYPE.FSEventStreamRef,		// streamRef
				self.TYPE.CFRunLoopRef,			// runLoop
				self.TYPE.CFStringRef			// runLoopMode
			);
		},
		GetApplicationEventTarget: function() {
			/* https://developer.apple.com/legacy/library/documentation/Carbon/Reference/Carbon_Event_Manager_Ref/index.html#//apple_ref/c/func/GetApplicationEventTarget
			 *  EventTargetRef GetApplicationEventTarget (
			 *    void
			 * );
			 */
			return lib('/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox').declare('GetApplicationEventTarget', self.TYPE.ABI,
				self.TYPE.EventTargetRef	// return
			);
		},
		GetCurrentProcess: function() {
			return lib('/System/Library/Frameworks/ApplicationServices.framework/Frameworks/HIServices.framework/HIServices').declare('GetCurrentProcess', self.TYPE.ABI,
				self.TYPE.OSErr,
				self.TYPE.ProcessSerialNumber.ptr
			);
		},
		GetEventDispatcherTarget: function() {
			/* https://developer.apple.com/legacy/library/documentation/Carbon/Reference/Carbon_Event_Manager_Ref/index.html#//apple_ref/c/func/GetApplicationEventTarget
			 *  EventTargetRef GetEventDispatcherTarget (
			 *    void
			 * );
			 */
			return lib('/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox').declare('GetEventDispatcherTarget', self.TYPE.ABI,
				self.TYPE.EventTargetRef	// return
			);
		},
		GetEventParameter: function() {
			/* https://developer.apple.com/legacy/library/documentation/Carbon/Reference/Carbon_Event_Manager_Ref/index.html#//apple_ref/c/func/GetEventParameter
			 * OSStatus GetEventParameter (
			 *   EventRef inEvent,
			 *   EventParamName inName,
			 *   EventParamType inDesiredType,
			 *   EventParamType *outActualType,
			 *   ByteCount inBufferSize,
			 *   ByteCount *outActualSize,
			 *   void *outData
		 	 * );
			 */
			 return lib('/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox').declare('GetEventParameter', self.TYPE.ABI,
 				self.TYPE.OSStatus,				// return
 				self.TYPE.EventRef,				// inEvent,
 				self.TYPE.EventParamName,		// inName,
 				self.TYPE.EventParamType,		// inDesiredType,
 				self.TYPE.EventParamType.ptr,	// *outActualType,
 				self.TYPE.ByteCount,			// inBufferSize,
 				self.TYPE.ByteCount.ptr,		// *outActualSize
				self.TYPE.void.ptr				// *outData
 			);
		},
		InstallEventHandler: function() {
			/* https://developer.apple.com/legacy/library/documentation/Carbon/Reference/Carbon_Event_Manager_Ref/index.html#//apple_ref/c/func/InstallEventHandler
			 * OSStatus InstallEventHandler (
			 *   EventTargetRef inTarget,
			 *   EventHandlerUPP inHandler,
			 *   ItemCount inNumTypes,
			 *   const EventTypeSpec *inList,
			 *   void *inUserData,
			 *   EventHandlerRef *outRef
			 * );
			 */
			return lib('/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox').declare('InstallEventHandler', self.TYPE.ABI,
				self.TYPE.OSStatus,				// return
				self.TYPE.EventTargetRef,		// inTarget,
				self.TYPE.EventHandlerUPP,		// inHandler,
				self.TYPE.ItemCount,			// inNumTypes,
				self.TYPE.EventTypeSpec.ptr,	// *inList,
				self.TYPE.void.ptr,				// *inUserData,
				self.TYPE.EventHandlerRef.ptr	// *outRef
			);
		},
		LSGetApplicationForURL: function() {
			// < 10.10
			/* https://developer.apple.com/library/mac/documentation/Carbon/Reference/LaunchServicesReference/#//apple_ref/c/func/LSGetApplicationForURL
			 * OSStatus LSGetApplicationForURL (
			 *   CFURLRef inURL,
			 *   LSRolesMask inRoleMask,
			 *   FSRef *outAppRef,
			 *   CFURLRef *outAppURL
		 	 * );
			 */
			return lib('/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/LaunchServices').declare('LSGetApplicationForURL', self.TYPE.ABI,
				ostypes.TYPE.OSStatus,			// return
				ostypes.TYPE.CFURLRef,			// inURL
				ostypes.TYPE.LSRolesMask,		// inRoleMask
				ostypes.TYPE.FSRef.ptr,			// *outAppRef
				ostypes.TYPE.CFURLRef.ptr		// *outAppURL
			);
		},
		LSCopyDefaultApplicationURLForURL: function() {
			// 10.10+
			/* https://developer.apple.com/library/mac/documentation/Carbon/Reference/LaunchServicesReference/#//apple_ref/c/func/LSCopyDefaultApplicationURLForURL
			 * CFURLRef LSCopyDefaultApplicationURLForURL (
			 *   CFURLRef inURL,
			 *   LSRolesMask inRoleMask,
			 *   CFErrorRef _Nullable *outError
		     * );
			 */
			 return lib('/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/LaunchServices').declare('LSCopyDefaultApplicationURLForURL', self.TYPE.ABI,
 				ostypes.TYPE.CFURLRef,			// return
 				ostypes.TYPE.CFURLRef,			// inURL
 				ostypes.TYPE.LSRolesMask,		// inRoleMask
 				ostypes.TYPE.CFErrorRef.ptr		// *outError
 			);
		},
		RegisterEventHotKey: function() {
			/* https://developer.apple.com/legacy/library/documentation/Carbon/Reference/Carbon_Event_Manager_Ref/index.html#//apple_ref/c/func/RegisterEventHotKey
			 * OSStatus RegisterEventHotKey (
			 *   UInt32 inHotKeyCode,
			 *   UInt32 inHotKeyModifiers,
			 *   EventHotKeyID inHotKeyID,
			 *   EventTargetRef inTarget,
			 *   OptionBits inOptions,
			 *   EventHotKeyRef *outRef
			 * );
			 */
			return lib('/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox').declare('RegisterEventHotKey', self.TYPE.ABI,
				self.TYPE.OSStatus,				// return
				self.TYPE.UInt32,				// inHotKeyCode
				self.TYPE.UInt32,				// inHotKeyModifiers
				self.TYPE.EventHotKeyID,		// inHotKeyID
				self.TYPE.EventTargetRef,		// inTarget
				self.TYPE.OptionBits,			// inOptions
				self.TYPE.EventHotKeyRef.ptr	// *outRef
			);
		},
		RemoveEventHandler: function() {
			/* https://developer.apple.com/legacy/library/documentation/Carbon/Reference/Carbon_Event_Manager_Ref/index.html#//apple_ref/c/func/RemoveEventHandler
			 * OSStatus RemoveEventHandler (
			 *   EventHandlerRef inHandlerRef
			 * );
			 */
			return lib('/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox').declare('RemoveEventHandler', self.TYPE.ABI,
				self.TYPE.OSStatus,			// return
				self.TYPE.EventHandlerRef	// inHandlerRef
			);
		},
		RunCurrentEventLoop: function() {
			/* https://developer.apple.com/legacy/library/documentation/Carbon/Reference/Carbon_Event_Manager_Ref/index.html#//apple_ref/c/func/RunCurrentEventLoop
			 * OSStatus RunCurrentEventLoop (
			 *   EventTimeout inTimeout
			 * );
			 */
			return lib('/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox').declare('RunCurrentEventLoop', self.TYPE.ABI,
				self.TYPE.OSStatus,		// return
				self.TYPE.EventTimeout	// inTimeout
			);
		},
		UnregisterEventHotKey: function() {
			/* https://developer.apple.com/legacy/library/documentation/Carbon/Reference/Carbon_Event_Manager_Ref/index.html#//apple_ref/c/func/UnregisterEventHotKey
			 * OSStatus UnregisterEventHotKey (
			 *   EventHotKeyRef inHotKey
			 * );
			 */
			return lib('/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox').declare('UnregisterEventHotKey', self.TYPE.ABI,
				self.TYPE.OSStatus,			// return
				self.TYPE.EventHotKeyRef	// inHotKey
			);
		},
		WaitNextEvent: function() {
			/*
			 *
			 */
			return lib('/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/HIToolbox').declare('WaitNextEvent', self.TYPE.ABI,
				self.TYPE.Boolean,
				self.TYPE.EventMask,
				self.TYPE.EventRecord.ptr,
				self.TYPE.UInt32,
				self.TYPE.RgnHandle
			);
		},
		//////////// OBJC
		objc_getClass: function() {
			/* https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html#//apple_ref/c/func/objc_getClass
			 * Class objc_getClass (
			 *   const char *name
			 * );
			 */
			return lib('objc').declare('objc_getClass', self.TYPE.ABI,
				self.TYPE.Class,		// return
				self.TYPE.char.ptr		// *name
			);
		},
		objc_msgSend: function() {
			/* https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html#//apple_ref/c/func/objc_getClass
			 * id objc_msgSend (
			 *   id self,
			 *   SEL op,
			 *   ...
			 * );
			 */
			return lib('objc').declare('objc_msgSend', self.TYPE.ABI,
				self.TYPE.id,		// return
				self.TYPE.id,		// self
				self.TYPE.SEL,		// op
				'...'				// variable arguments
			);
		},
		sel_registerName: function() {
			/* https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html#//apple_ref/c/func/objc_getClass
			 * SEL sel_registerName (
			 *   const char *str
			 * );
			 */
			return lib('objc').declare('sel_registerName', self.TYPE.ABI,
				self.TYPE.SEL,		// return
				self.TYPE.char.ptr	// *str
			);
		},
		objc_registerClassPair: function() {
			/* https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html#//apple_ref/c/func/objc_registerClassPair
			 * void objc_registerClassPair (
			 *   Class cls
			 * );
			 */
			return lib('objc').declare('objc_registerClassPair', self.TYPE.ABI,
				self.TYPE.void,	// return
				self.TYPE.Class	// cls
			);
		},
		objc_allocateClassPair: function() {
			/* https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html#//apple_ref/c/func/objc_allocateClassPair
			 *  Class objc_allocateClassPair (
			 *   Class superclass,
			 *   const char *name,
			 *   size_t extraBytes
			 * );
			 */
			return lib('objc').declare('objc_allocateClassPair', self.TYPE.ABI,
				self.TYPE.Class,		// return
				self.TYPE.Class,		// superclass
				self.TYPE.char.ptr,		// *name
				self.TYPE.size_t		// extraBytes
			);
		},
		class_addMethod: function() {
			/* https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html#//apple_ref/c/func/class_addMethod
			 * BOOL class_addMethod (
			 *   Class cls,
			 *   SEL name,
			 *   IMP imp,
			 *   const char *types
			 * );
			 */
			return lib('objc').declare('class_addMethod', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.Class,	// cls
				self.TYPE.SEL,		// name
				self.TYPE.IMP,		// imp
				self.TYPE.char.ptr	// *types
			);
		},
		objc_disposeClassPair: function() {
			/* https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html#//apple_ref/c/func/objc_disposeClassPair
			 * void objc_disposeClassPair (
			 *   Class cls
			 * );
			 */
			return lib('objc').declare('objc_disposeClassPair', self.TYPE.ABI,
				self.TYPE.void,	// return
				self.TYPE.Class	// cls
			);
		},
		///////////// LIBC
		close: function() {
			/* http://linux.die.net/man/2/close
			 * int close(int fd);
			 *
			 * https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man2/close.2.html#//apple_ref/doc/man/2/close
			 * int close(int fildes);
			 */
			return lib('libc').declare('close', self.TYPE.ABI,
				self.TYPE.int,	// return
				self.TYPE.int	// fd
			);
		},
		fcntl: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man2/fcntl.2.html
			 * http://linux.die.net/man/2/fcntl
			 * fcntl() can take an optional third argument. Whether or not this argument is required is determined by cmd.
			 * F_GETLK, F_SETLK and F_SETLKW are used to acquire, release, and test for the existence of record locks (also known as file-segment or file-region locks). The third argument, lock, is a pointer to a structure that has at least the following fields (in unspecified order).
			 * int fcntl(int fd, int cmd);
			 * int fcntl(int fd, int cmd, long arg);
			 * int fcntl(int fd, int cmd, struct flock *lock);
			 */
			return lib('libc').declare('fcntl', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.int,			// fd
				self.TYPE.int,			// cmd
				self.TYPE.flock.ptr		// *lock
			);
		},
		feof: function() {
			/* http://linux.die.net/man/3/feof
			 * https://developer.apple.com/library/ios/documentation/System/Conceptual/ManPages_iPhoneOS/man3/feof.3.html
			 * int feof(
			 *   FILE *stream
			 * );
			 */
			return lib('libc').declare('feof', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.FILE.ptr	// *stream
			);
		},
		fread: function() {
			/* http://linux.die.net/man/3/fread
			 * size_t fread (
			 *   void *ptr,
			 *   size_t size,
			 *   size_t nmemb,
			 *   FILE *stream
			 * );
			 */
			return lib('libc').declare('fread', self.TYPE.ABI,
				self.TYPE.size_t,		// return
				self.TYPE.void.ptr,		// *ptr
				self.TYPE.size_t, 		// size
				self.TYPE.size_t, 		// count
				self.TYPE.FILE.ptr		// *stream
			);
		},
		memcpy: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man3/memcpy.3.html#//apple_ref/doc/man/3/memcpy
			 * void *memcpy (
			 *   void *restrict dst,
			 *   const void *restrict src,
			 *   size_t n
			 * );
			 */
			return lib('libc').declare('memcpy', self.TYPE.ABI,
				self.TYPE.void,		// return
				self.TYPE.void.ptr,	// *dst
				self.TYPE.void.ptr,	// *src
				self.TYPE.size_t	// n
			);
		},
		open: function() {
			/* http://linux.die.net/man/2/open
			 * int open(const char *pathname, int flags);
			 * int open(const char *pathname, int flags, mode_t mode);
			 * int creat(const char *pathname, mode_t mode);
			 *
			 * https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man2/open.2.html#//apple_ref/doc/man/2/open
			 * int open(const char *path, int oflag, ...);
			 */
			return lib('libc').declare('open', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.char.ptr,	// *path
				self.TYPE.int		// flags
			);
		},
		popen: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man3/popen.3.html
			 * FILE *popen(
			 *   const char *command,
			 *   const char *mode
			 * );
			 */
			return lib('libc').declare('popen', self.TYPE.ABI,
				self.TYPE.FILE.ptr,		// return
				self.TYPE.char.ptr,		// *command
				self.TYPE.char.ptr		// *mode
			);
		},
		pclose: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man3/popen.3.html
			 * int pclose(
			 *   FILE *stream
			 * );
			 */
			return lib('libc').declare('pclose', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.FILE.ptr		// *stream
			);
		},
		readlink: function() {
			/* https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man2/readlink.2.html
			 * ssize_t readlink(
			 *   const char *restrict path,
			 *   char *restrict buf,
			 *   size_t bufsize
			 * );
			 */
			return lib('libc').declare('readlink', self.TYPE.ABI,
				self.TYPE.ssize_t,		// return
				self.TYPE.char.ptr,		// *restrict path
				self.TYPE.char.ptr,		// *restrict buf
				self.TYPE.size_t		// bufsize
			);
		},
		sleep: function() {
			/* https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man3/sleep.3.html
			 * unsigned int sleep(
			 *   unsigned int seconds
		 	 * );
			 */
			return lib('libc').declare('sleep', self.TYPE.ABI,
				self.TYPE.unsigned_int,		// return
				self.TYPE.unsigned_int		// seconds
			);
		},
		usleep: function() {
			/* https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man3/usleep.3.html
			 * int usleep(
			 *   useconds_t useconds
		 	 * );
			 */
			return lib('libc').declare('usleep', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.useconds_t	// useconds
			);
		},
		////////////// LIBDISPATCH
		dispatch_get_main_queue: function() {
			/* https://developer.apple.com/library/prerelease/mac/documentation/Performance/Reference/GCD_libdispatch_Ref/#//apple_ref/c/func/dispatch_get_main_queue
			 *  dispatch_queue_t dispatch_get_main_queue (
			 *   void
			 * );
			 */
			// return lib('/usr/lib/system/libdispatch.dylib').declare('_dispatch_main_q', self.TYPE.ABI,
			// 	self.TYPE.dispatch_queue_t	// return
			// );
			// do not do ostypes.API('dispatch_get_main_queue')() the () will give error not FuncitonType.ptr somhting like that, must just use ostypes.API('dispatch_get_main_queue')
			// http://stackoverflow.com/questions/31637321/standard-library-containing-dispatch-get-main-queue-gcd
			return lib('/usr/lib/system/libdispatch.dylib').declare('_dispatch_main_q', self.TYPE.dispatch_queue_t);
		},
		dispatch_sync: function() {
			/* https://developer.apple.com/library/prerelease/mac/documentation/Performance/Reference/GCD_libdispatch_Ref/#//apple_ref/c/func/dispatch_sync
			 * void dispatch_sync (
			 *   dispatch_queue_t queue,
			 *   dispatch_block_t block
			 * );
			 */
			return lib('/usr/lib/system/libdispatch.dylib').declare('dispatch_sync', self.TYPE.ABI,
				self.TYPE.void,					// return
				self.TYPE.dispatch_queue_t,		// queue
				self.TYPE.dispatch_block_t		// block
			);
		}
	};
	// end - predefine your declares here
	// end - function declares

	this.HELPER = {
		closeLibs: function() {
			for (var a_lib in _lib) {
				ctypes.close(a_lib);
			}
			_lib = {};
		},
		makeCFStr: function(jsStr) {
			// js str is just a string
			// returns a CFStr that must be released with CFRelease when done
			return self.API('CFStringCreateWithCharacters')(null, jsStr, jsStr.length);
		},
		Str255: function(str) {
			return String.fromCharCode(str.length) + str;
		},
		// OBJC HELPERS
		_selLC: {}, // LC = Lazy Cache
		sel: function(jsStrSEL) {
			if (!(jsStrSEL in self.HELPER._selLC)) {
				self.HELPER._selLC[jsStrSEL] = self.API('sel_registerName')(jsStrSEL);

			}
			return self.HELPER._selLC[jsStrSEL];
		},
		_classLC: {}, // LC = Lazy Cache
		class: function(jsStrCLASS) {
			if (!(jsStrCLASS in self.HELPER._classLC)) {
				self.HELPER._classLC[jsStrCLASS] = self.API('objc_getClass')(jsStrCLASS);

			}
			return self.HELPER._classLC[jsStrCLASS];
		},
		nsstringColl: function() { // collection of NSStrings with methods of .release to release all of them
			// creates a collection
			// if get and it doesnt exist then it makes and stores it
			// if get and already exists then it returns that lazy
			// can releaseAll on it

			this.coll = {};
			this.class = {};
			this.get = function(jsStr) {

				if (!(jsStr in this.coll)) {

					this.class[jsStr] = self.API('objc_msgSend')(self.HELPER.class('NSString'), self.HELPER.sel('alloc'));;


					var rez_initWithUTF8String = self.API('objc_msgSend')(this.class[jsStr], self.HELPER.sel('initWithUTF8String:'), self.TYPE.char.array()(jsStr));
					this.coll[jsStr] = rez_initWithUTF8String;

				} else {

				}
				return this.coll[jsStr];
			};

			this.releaseAll = function() {
				for (var nsstring in this.coll) {
					var rez_relNSS = self.API('objc_msgSend')(this.coll[nsstring], self.HELPER.sel('release'));
					var rez_relCLASS = self.API('objc_msgSend')(this.class[nsstring], self.HELPER.sel('release'));

				}
				this.coll = null;
			};
		},
		readNSString: function(aNSStringPtr) {
			var cUTF8Ptr = self.API('objc_msgSend')(aNSStringPtr, self.HELPER.sel('UTF8String'));
			var cCharPtr = ctypes.cast(cUTF8Ptr, ctypes.char.ptr);
			return cCharPtr.readStringReplaceMalformed();
		},
		createBlock: function(aFuncTypePtr) {
			// based on work from here: https://github.com/trueinteractions/tint2/blob/f6ce18b16ada165b98b07869314dad1d7bee0252/modules/Bridge/core.js#L370-L394
			var bl = self.TYPE.Block_literal_1();

			// Set the class of the instance
			bl.isa = self.CONST._NSConcreteGlobalBlock;

			// Global flags
			bl.flags = self.CONST.BLOCK_HAS_STRET;
			bl.reserved = 0;
			bl.invoke = aFuncTypePtr;

			// create descriptor
			var desc = self.TYPE.Block_descriptor_1();
			desc.reserved = 0;
			desc.size = self.TYPE.Block_literal_1.size;

			// set descriptor into block literal
			bl.descriptor = desc.address();

			return bl;
		},
		convertLongOSStatus: function(aJSInt) {
			// aJSInt can be string of int
			var daHex = '0x' + parseInt(aJSInt).toString(16);
			var daOSStatus = ctypes.cast(ctypes.long_long(aJSInt), ctypes.int).value; // this can be looked up here - https://developer.apple.com/library/mac/documentation/Security/Reference/keychainservices/index.html#//apple_ref/c/econst/errSecAllocate
			console.log(aJSInt, daHex, daOSStatus);
			return daOSStatus;
			// so like aJSInt of 4294967246 is hex 0xffffffce which is OSStatus of -50 which is errSecParam which means - One or more parameters passed to the function were not valid.
		},
		OS_TYPE: function(aFourCharString) {
			// http://stackoverflow.com/a/38939620/1828637
			if (aFourCharString.length !== 4) {
				throw new Error('aFourCharString must be 4 in length!');
			}

			return (aFourCharString.charCodeAt(0) << 24) +
				   (aFourCharString.charCodeAt(1) << 16) +
		           (aFourCharString.charCodeAt(2) << 8) +
		           aFourCharString.charCodeAt(3);
		}
	};
}

// helper function
function importServicesJsm() {
	if (!this.DedicatedWorkerGlobalScope && typeof(Services) == 'undefined') {
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
	if (!this.DedicatedWorkerGlobalScope && typeof(OS) == 'undefined') {
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

// init
var ostypes = new macInit();
