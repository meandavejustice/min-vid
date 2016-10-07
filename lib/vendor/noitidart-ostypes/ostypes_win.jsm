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

var ifdef_UNICODE = true;

if (this.DedicatedWorkerGlobalScope) {
	// osname = OS.Constants.Sys.Name.toLowerCase();
	// i dont use `osname` in ostypes_win.jsm
} else {
	importOsConstsJsm();
	// for access to OS.Constants.Win
}

var WIN32_ERROR_STR;

var winTypes = function() {

	// ABIs
	if (is64bit) {
	  this.CALLBACK_ABI = ctypes.default_abi;
	  this.ABI = ctypes.default_abi;
	} else {
	  this.CALLBACK_ABI = ctypes.stdcall_abi;
	  this.ABI = ctypes.winapi_abi;
	}

	// TYPEs - Level 0 - C TYPES
	this.char = ctypes.char;
	this.int = ctypes.int;
	this.size_t = ctypes.size_t;
	this.void = ctypes.void_t;

	// TYPEs - Level 1 - Simple
	this.AUDCLNT_SHAREMODE = ctypes.unsigned_int; // guess type as this is an enum
	this.BOOL = ctypes.bool;
	this.BYTE = ctypes.unsigned_char;
	this.CHAR = ctypes.char;
	this.DWORD = ctypes.uint32_t; // IntSafe.h defines it as: // typedef unsigned long DWORD; // so maybe can change this to ctypes.unsigned_long // i was always using `ctypes.uint32_t`
	this.EDataFlow = ctypes.unsigned_int; // guess as this is an enum
	this.ERole = ctypes.unsigned_int; // guess as this is an enum
	this.FILE_INFORMATION_CLASS = ctypes.int; // https://msdn.microsoft.com/en-us/library/windows/hardware/ff728840%28v=vs.85%29.aspx // this is an enum, im guessing enum is ctypes.int
	this.FXPT2DOT30 = ctypes.long; // http://stackoverflow.com/a/20864995/1828637 // https://github.com/wine-mirror/wine/blob/a7247df6ca54fd1209eff9f9199447643ebdaec5/include/wingdi.h#L150
	this.INT = ctypes.int;
	this.INT_PTR = is64bit ? ctypes.int64_t : ctypes.int;
	this.KPRIORITY = ctypes.long; // Definition at line 51 of file ntbasic.h.
	this.KWAIT_REASON = ctypes.int; // im guessing its int because its enum - https://github.com/wine-mirror/wine/blob/1d19eb15d4abfdd14dccc5ac05b83c0ee1a1ace1/include/ddk/wdm.h#L105-L133
	this.LONG = ctypes.long;
	this.LONGLONG = ctypes.long_long;
	this.LONG_PTR = is64bit ? ctypes.int64_t : ctypes.long; // i left it at what i copied pasted it as but i thought it would be `ctypes.intptr_t`
	this.LPCVOID = ctypes.voidptr_t;
	this.LPVOID = ctypes.voidptr_t;
	this.NTSTATUS = ctypes.long; // https://msdn.microsoft.com/en-us/library/cc230357.aspx // typedef long NTSTATUS;
	this.OBJECT_INFORMATION_CLASS = ctypes.int; // im guessing its in, it is an enum though for sure
	this.PIN_DIRECTION = ctypes.int; // im guessing as its enum https://msdn.microsoft.com/en-us/library/windows/desktop/dd377427(v=vs.85).aspx
	this.PVOID = ctypes.voidptr_t;
	this.REFERENCE_TIME = ctypes.long_long;
	this.RM_APP_TYPE = ctypes.unsigned_int; // i dont know im just guessing, i cant find a typedef that makes sense to me: https://msdn.microsoft.com/en-us/library/windows/desktop/aa373670%28v=vs.85%29.aspx
	this.SHORT = ctypes.short;
	this.UINT = ctypes.unsigned_int;
	this.UINT32 = ctypes.uint32_t;
	this.UINT64 = ctypes.uint64_t;
	this.UINT_PTR = is64bit ? ctypes.uint64_t : ctypes.unsigned_int;
	this.ULONG = ctypes.unsigned_long;
	this.ULONGLONG = ctypes.unsigned_long_long;
	this.ULONG_PTR = is64bit ? ctypes.uint64_t : ctypes.unsigned_long; // i left it at what i copied pasted it as, but i thought it was this: `ctypes.uintptr_t`
	this.USHORT = ctypes.unsigned_short;
	this.VARIANT_BOOL = ctypes.short;
	this.VARTYPE = ctypes.unsigned_short;
	this.VOID = ctypes.void_t;
	this.WCHAR = ctypes.jschar;
	this.WORD = ctypes.unsigned_short;

	// TYPES - Level 2
	this.ACCESS_MASK = this.DWORD; // https://msdn.microsoft.com/en-us/library/windows/desktop/aa374892%28v=vs.85%29.aspx
	this.ATOM = this.WORD;
	this.BOOLEAN = this.BYTE; // http://blogs.msdn.com/b/oldnewthing/archive/2004/12/22/329884.aspx
	this.COLORREF = this.DWORD; // when i copied/pasted there was this comment next to this: // 0x00bbggrr
	this.DWORD_PTR = this.ULONG_PTR;
	this.FILEOP_FLAGS = this.WORD;
	this.FOURCC = this.DWORD;
	this.HANDLE = this.PVOID;
	this.HRESULT = this.LONG;
	this.LPBYTE = this.BYTE.ptr;
	this.LPCSTR = this.CHAR.ptr; // typedef __nullterminated CONST CHAR *LPCSTR;
	this.LPCWSTR = this.WCHAR.ptr;
	this.LPARAM = this.LONG_PTR;
	this.LPDWORD = this.DWORD.ptr;
	this.LPSTR = this.CHAR.ptr;
	this.LPWSTR = this.WCHAR.ptr;
	this.LRESULT = this.LONG_PTR;
	this.MMRESULT = this.UINT;
	this.MMVERSION = this.UINT;
	this.OLECHAR = this.WCHAR; // typedef WCHAR OLECHAR; // https://github.com/wine-mirror/wine/blob/bdeb761357c87d41247e0960f71e20d3f05e40e6/include/wtypes.idl#L286
	this.PCZZSTR = ifdef_UNICODE ? this.WCHAR.ptr : this.CHAR.ptr; // EDUCATED GUESS BASED ON TYPEDEF FROM --> // ansi / unicode - https://github.com/wine-mirror/wine/blob/b1ee60f22fbd6b854c3810a89603458ec0585369/include/winnt.h#L483 ---
	this.PLONG = this.LONG.ptr;
	this.PULONG = this.ULONG.ptr;
	this.PULONG_PTR = this.ULONG.ptr;
	this.PUINT = this.UINT.ptr;
	this.PCWSTR = this.WCHAR.ptr;
	this.SIZE_T = this.ULONG_PTR;
	this.SYSTEM_INFORMATION_CLASS = this.INT; // i think due to this search: http://stackoverflow.com/questions/28858849/where-is-system-information-class-defined // as this is an enum so i guess ctypes.int
	this.TCHAR = ifdef_UNICODE ? this.WCHAR : ctypes.char; // when i copied pasted this it was just ctypes.char and had this comment: // Mozilla compiled with UNICODE/_UNICODE macros and wchar_t = jschar // in "advanced types" section even though second half is ctypes.char because it has something that is advanced, which is the first part, this.WCHAR
	this.WPARAM = this.UINT_PTR;

	// SUPER ADVANCED TYPES // defined by "advanced types"
	this.BSTR = this.OLECHAR.ptr;
	this.HBITMAP = this.HANDLE;
	this.HBRUSH = this.HANDLE;
	this.HDC = this.HANDLE;
	this.HDROP = this.HANDLE;
	this.HFONT = this.HANDLE;
	this.HGDIOBJ = this.HANDLE;
	this.HGLOBAL = this.HANDLE;
	this.HHOOK = this.HANDLE;
	this.HICON = this.HANDLE;
	this.HINSTANCE = this.HANDLE;
	this.HKEY = this.HANDLE;
	this.HMENU = this.HANDLE;
	this.HMONITOR = this.HANDLE;
	this.HRAWINPUT = this.HANDLE;
	this.HRSRC = this.HANDLE;
	this.HWAVEIN = this.HANDLE;
	this.HWND = this.HANDLE;
	this.LPCOLESTR = this.OLECHAR.ptr; // typedef [string] const OLECHAR *LPCOLESTR; // https://github.com/wine-mirror/wine/blob/bdeb761357c87d41247e0960f71e20d3f05e40e6/include/wtypes.idl#L288
	this.LPCTSTR = ifdef_UNICODE ? this.LPCWSTR : this.LPCSTR;
	this.LPHANDLE = this.HANDLE.ptr;
	this.LPOLESTR = this.OLECHAR.ptr; // typedef [string] OLECHAR *LPOLESTR; // https://github.com/wine-mirror/wine/blob/bdeb761357c87d41247e0960f71e20d3f05e40e6/include/wtypes.idl#L287 // http://stackoverflow.com/a/1607335/1828637 // LPOLESTR is usually to be allocated with CoTaskMemAlloc()
	this.LPTSTR = ifdef_UNICODE ? this.LPWSTR : this.LPSTR;
	this.PCTSTR = ifdef_UNICODE ? this.LPCWSTR : this.LPCSTR;
	this.PHANDLE = this.HANDLE.ptr;
	this.PCZZTSTR = this.PCZZSTR; // double null terminated from msdn docs // typedef from https://github.com/wine-mirror/wine/blob/b1ee60f22fbd6b854c3810a89603458ec0585369/include/winnt.h#L535
	this.PWSTR = this.LPWSTR; // PWSTR and LPWSTR are the same. The L in LPWSTR stands for "long/far pointer" and it is a leftover from 16 bit when pointers were "far" or "near". Such a distinction no longer exists on 32/64 bit, all pointers have the same size. SOURCE: https://social.msdn.microsoft.com/Forums/vstudio/en-US/52ab8d94-f8f8-427f-ad66-5b38db9a61c9/difference-between-lpwstr-and-pwstr?forum=vclanguage
	this.REGSAM = this.ACCESS_MASK; // https://github.com/wine-mirror/wine/blob/9bd963065b1fb7b445d010897d5f84967eadf75b/include/winreg.h#L53

	// SUPER DUPER ADVANCED TYPES // defined by "super advanced types"
	this.HCURSOR = this.HICON;
	this.HMODULE = this.HINSTANCE;
	this.LPHWAVEIN = this.HWAVEIN.ptr;
	this.PHKEY = this.HKEY.ptr;
	this.EnumWindowsProc = ctypes.FunctionType(this.CALLBACK_ABI, this.BOOL, [this.HWND, this.LPARAM]); // "super advanced type" because its highest type is `this.HWND` which is "advanced type"

	// SUPER DEE DUPER ADVANCED TYPES
	this.WNDENUMPROC = this.EnumWindowsProc.ptr;

	// inaccrurate types - i know these are something else but setting them to voidptr_t or something just works and all the extra work isnt needed
	this.LPUNKNOWN = ctypes.voidptr_t; // ctypes.StructType('LPUNKNOWN'); // public typedef IUnknown* LPUNKNOWN; // i dont use the full struct so just leave it like this, actually lets just make it voidptr_t
	this.MONITOR_DPI_TYPE = ctypes.unsigned_int;
	this.PCIDLIST_ABSOLUTE = ctypes.voidptr_t; // https://github.com/west-mt/ssbrowser/blob/452e21d728706945ad00f696f84c2f52e8638d08/chrome/content/modules/WindowsShortcutService.jsm#L115
	this.PIDLIST_ABSOLUTE = ctypes.voidptr_t;
	this.WIN32_FIND_DATA = ctypes.voidptr_t;
	this.WINOLEAPI = ctypes.voidptr_t; // i guessed on this one

	// STRUCTURES
	// consts for structures
	var struct_const = {
		CCHDEVICENAME: 32,
		CCHFORMNAME: 32,
		LF_FACESIZE: 32,
		LF_FULLFACESIZE: 64,
		MAXPNAMELEN: 32,
		MAX_PIN_NAME: 128
	};

	// SIMPLE STRUCTS // based on any of the types above
	this.AM_MEDIA_TYPE = ctypes.StructType('_AMMediaType'); // have left this opaque for now as i dont need it populated yet
	this.BITMAPINFOHEADER = ctypes.StructType('BITMAPINFOHEADER', [
		{ biSize: this.DWORD },
		{ biWidth: this.LONG },
		{ biHeight: this.LONG },
		{ biPlanes: this.WORD },
		{ biBitCount: this.WORD },
		{ biCompression: this.DWORD },
		{ biSizeImage: this.DWORD },
		{ biXPelsPerMeter: this.LONG },
		{ biYPelsPerMeter: this.LONG },
		{ biClrUsed: this.DWORD },
		{ biClrImportant: this.DWORD }
	]);
	this.CIEXYZ = ctypes.StructType('CIEXYZ', [
		{ ciexyzX: this.FXPT2DOT30 },
		{ ciexyzY: this.FXPT2DOT30 },
		{ ciexyzZ: this.FXPT2DOT30 }
	]);
	this.CLIENT_ID = ctypes.StructType('_CLIENT_ID', [ // http://processhacker.sourceforge.net/doc/struct___c_l_i_e_n_t___i_d.html
		{ UniqueProcess: this.HANDLE },
		{ UniqueThread: this.HANDLE }
	]);
	this.DECIMAL = ctypes.StructType('tagDEC', [
		{ wReserved: this.USHORT },
	    { scale: this.BYTE },
	    { sign: this.BYTE },
	    { Hi32: this.ULONG },
		{ Lo64: this.ULONGLONG }
	]);
	this.DISPLAY_DEVICE = ctypes.StructType('_DISPLAY_DEVICE', [
		{ cb:			this.DWORD },
		{ DeviceName:	this.TCHAR.array(32) },
		{ DeviceString:	this.TCHAR.array(128) },
		{ StateFlags:	this.DWORD },
		{ DeviceID:		this.TCHAR.array(128) },
		{ DeviceKey:	this.TCHAR.array(128) }
	]);
	this.FILE_NAME_INFORMATION = ctypes.StructType('_FILE_NAME_INFORMATION', [ // https://msdn.microsoft.com/en-us/library/windows/hardware/ff545817%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
		{ FileNameLength: this.ULONG },
		{ FileName: this.WCHAR.array(OS.Constants.Win.MAX_PATH) } // { FileName: this.WCHAR.array(1) }
	]);
	this.FILE_NOTIFY_INFORMATION = ctypes.StructType('FILE_NOTIFY_INFORMATION', [
		{ NextEntryOffset: this.DWORD },
		{ Action: this.DWORD },
		{ FileNameLength: this.DWORD },
		{ FileName: ctypes.ArrayType(this.WCHAR, 1) }, // not null terminated
	]);
	this.FILETIME = ctypes.StructType('_FILETIME', [ // http://msdn.microsoft.com/en-us/library/windows/desktop/ms724284%28v=vs.85%29.aspx
	  { 'dwLowDateTime': this.DWORD },
	  { 'dwHighDateTime': this.DWORD }
	]);
	this.GUID = ctypes.StructType('GUID', [
	  { 'Data1': this.ULONG },
	  { 'Data2': this.USHORT },
	  { 'Data3': this.USHORT },
	  { 'Data4': this.BYTE.array(8) }
	]);
	this.GROUPICON = ctypes.StructType('_GROUPICON', [ // http://stackoverflow.com/a/22597049/1828637
		{ Reserved1: this.WORD },		// reserved, must be 0
		{ ResourceType: this.WORD },	// type is 1 for icons
		{ ImageCount: this.WORD },		// number of icons in structure (1)
		{ Width: this.BYTE },			// icon width (32)
		{ Height: this.BYTE },			// icon height (32)
		{ Colors: this.BYTE },			// colors (0 means more than 8 bits per pixel)
		{ Reserved2: this.BYTE },		// reserved, must be 0
		{ Planes: this.WORD },			// color planes
		{ BitsPerPixel: this.WORD },	// bit depth
		{ ImageSize: this.DWORD },		// size of structure
		{ ResourceID: this.WORD }		// resource ID
	]);
	this.IO_STATUS_BLOCK = ctypes.StructType('_IO_STATUS_BLOCK', [ // https://msdn.microsoft.com/en-us/library/windows/hardware/ff550671%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
		{ Pointer: this.PVOID }, // union { NTSTATUS Status; PVOID Pointer; } // i just picked PVOID
		{ Information: this.ULONG_PTR }
	]);
	this.LARGE_INTEGER = ctypes.StructType('_LARGE_INTEGER', [ // its a union, so i picked the one that my use case needs // https://msdn.microsoft.com/en-us/library/windows/desktop/aa383713%28v=vs.85%29.aspx
		{ QuadPart: this.LONGLONG }
	]);
	this.LOGFONT = ctypes.StructType('tagLOGFONT', [
		{ lfHeight: this.LONG },
		{ lfWidth: this.LONG },
		{ lfEscapement: this.LONG },
		{ lfOrientation: this.LONG },
		{ lfWeight: this.LONG },
		{ lfItalic: this.BYTE },
		{ lfUnderline: this.BYTE },
		{ lfStrikeOut: this.BYTE },
		{ lfCharSet: this.BYTE },
		{ lfOutPrecision: this.BYTE },
		{ lfClipPrecision: this.BYTE },
		{ lfQuality: this.BYTE },
		{ lfPitchAndFamily: this.BYTE },
		{ lfFaceName: this.TCHAR.array(struct_const.LF_FACESIZE) }
	]);
	this.MOUSEINPUT = ctypes.StructType('tagMOUSEINPUT', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/ms646273%28v=vs.85%29.aspx
	        { 'dx': this.LONG },
	        { 'dy': this.LONG },
	        { 'mouseData': this.DWORD },
	        { 'dwFlags': this.DWORD },
	        { 'time': this.ULONG_PTR },
        	{ 'dwExtraInfo': this.DWORD }
	]);
	this.NEWTEXTMETRIC = ctypes.StructType('tagNEWTEXTMETRIC', [
		{ tmHeight: this.LONG },
		{ tmAscent: this.LONG },
		{ tmDescent: this.LONG },
		{ tmInternalLeading: this.LONG },
		{ tmExternalLeading: this.LONG },
		{ tmAveCharWidth: this.LONG },
		{ tmMaxCharWidth: this.LONG },
		{ tmWeight: this.LONG },
		{ tmOverhang: this.LONG },
		{ tmDigitizedAspectX: this.LONG },
		{ tmDigitizedAspectY: this.LONG },
		{ tmFirstChar: this.TCHAR },
		{ tmLastChar: this.TCHAR },
		{ tmDefaultChar: this.TCHAR },
		{ tmBreakChar: this.TCHAR },
		{ tmItalic: this.BYTE },
		{ tmUnderlined: this.BYTE },
		{ tmStruckOut: this.BYTE },
		{ tmPitchAndFamily: this.BYTE },
		{ tmCharSet: this.BYTE },
		{ ntmFlags: this.DWORD },
		{ ntmSizeEM: this.UINT },
		{ ntmCellHeight: this.UINT },
		{ ntmAvgWidth: this.UINT }
	]);
	this.OVERLAPPED = ctypes.StructType('_OVERLAPPED', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/ms684342%28v=vs.85%29.aspx
		{ Internal: this.ULONG_PTR },
		{ InternalHigh: this.ULONG_PTR },
		{ Pointer: this.PVOID }, //  union { struct { DWORD Offset; DWORD OffsetHigh; }; PVOID Pointer; };
		{ hEvent: this.HANDLE },
	]);
	this.POINT = ctypes.StructType('tagPOINT', [
		{ x: this.LONG },
		{ y: this.LONG }
	]);
	this.POINTL = ctypes.StructType('_POINTL', [ // https://github.com/wine-mirror/wine/blob/7eddb864b36d159fa6e6807f65e117ca0a81485c/include/windef.h#L368
		{ x: this.LONG },
		{ y: this.LONG }
	]);
	this.PROPVARIANT = ctypes.StructType('PROPVARIANT', [ // http://msdn.microsoft.com/en-us/library/windows/desktop/bb773381%28v=vs.85%29.aspx
		{ 'vt': this.VARTYPE }, // constants for this are available at MSDN: http://msdn.microsoft.com/en-us/library/windows/desktop/aa380072%28v=vs.85%29.aspx
		{ 'wReserved1': this.WORD },
		{ 'wReserved2': this.WORD },
		{ 'wReserved3': this.WORD },
		{ 'pwszVal': this.LPWSTR } // union, i just use pwszVal so I picked that one // for InitPropVariantFromString // when using this see notes on MSDN doc page chat of PROPVARIANT ( http://msdn.microsoft.com/en-us/library/windows/desktop/aa380072%28v=vs.85%29.aspx )this guy says: "VT_LPWSTR must be allocated with CoTaskMemAlloc :: (Presumably this also applies to VT_LPSTR) VT_LPWSTR is described as being a string pointer with no information on how it is allocated. You might then assume that the PROPVARIANT doesn't own the string and just has a pointer to it, but you'd be wrong. In fact, the string stored in a VT_LPWSTR PROPVARIANT must be allocated using CoTaskMemAlloc and be freed using CoTaskMemFree. Evidence for this: Look at what the inline InitPropVariantFromString function does: It sets a VT_LPWSTR using SHStrDupW, which in turn allocates the string using CoTaskMemAlloc. Knowing that, it's obvious that PropVariantClear is expected to free the string using CoTaskMemFree. I can't find this explicitly documented anywhere, which is a shame, but step through this code in a debugger and you can confirm that the string is freed by PropVariantClear: ```#include <Propvarutil.h>	int wmain(int argc, TCHAR *lpszArgv[])	{	PROPVARIANT pv;	InitPropVariantFromString(L"Moo", &pv);	::PropVariantClear(&pv);	}```  If  you put some other kind of string pointer into a VT_LPWSTR PROPVARIANT your program is probably going to crash."
	]);
	this.RGBQUAD = ctypes.StructType('RGBQUAD', [
		{ rgbBlue:		this.BYTE },
		{ rgbGreen:		this.BYTE },
		{ rgbRed:		this.BYTE },
		{ rgbReserved:	this.BYTE }
	]);
	this.RAWINPUTHEADER = ctypes.StructType('tagRAWINPUTHEADER', [
		{ dwType: this.DWORD },
		{ dwSize: this.DWORD },
		{ hDevice: this.HANDLE },
		{ wParam: this.WPARAM }
	]);
	this.RAWINPUTDEVICE = ctypes.StructType('tagRAWINPUTDEVICE', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/ms645565%28v=vs.85%29.aspx
		{ usUsagePage: this.USHORT },
		{ usUsage: this.USHORT },
		{ dwFlags: this.DWORD },
		{ hwndTarget: this.HWND }
	]);
	this.RAWMOUSE = ctypes.StructType('tagRAWMOUSE', [
		{ usFlags: this.USHORT },
		{ _padding0: this.USHORT },
		{ usButtonFlags: this.USHORT },
		{ usButtonData: this.USHORT },
		{ ulRawButtons: this.ULONG },
		{ lLastX: this.LONG },
		{ lLastY: this.LONG },
		{ ulExtraInformation: this.ULONG }
	]);
	this.RECT = ctypes.StructType('_RECT', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/dd162897%28v=vs.85%29.aspx
		{ left: this.LONG },
		{ top: this.LONG },
		{ right: this.LONG },
		{ bottom: this.LONG }
	]);
	this.SECURITY_ATTRIBUTES = ctypes.StructType('_SECURITY_ATTRIBUTES', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/aa379560%28v=vs.85%29.aspx
		{ 'nLength': this.DWORD },
		{ 'lpSecurityDescriptor': this.LPVOID },
		{ 'bInheritHandle': this.BOOL }
	]);
	this.SHELLEXECUTEINFO = ctypes.StructType('_SHELLEXECUTEINFO', [
		{ 'cbSize': this.DWORD },
		{ 'fMask': this.ULONG },
		{ 'hwnd': this.HWND },
		{ 'lpVerb': this.LPCTSTR },
		{ 'lpFile': this.LPCTSTR },
		{ 'lpParameters': this.LPCTSTR },
		{ 'lpDirectory': this.LPCTSTR },
		{ 'nShow': this.INT },
		{ 'hInstApp': this.HINSTANCE },
		{ 'lpIDList': this.LPVOID },
		{ 'lpClass': this.LPCTSTR },
		{ 'hkeyClass': this.HKEY },
		{ 'dwHotKey': this.DWORD },
		{ 'hIcon': this.HANDLE }, // union {HANDLE hIcon;  HANDLE hMonitor;} DUMMYUNIONNAME; // i picked hIcon because i might be able to get winxp to seperate its groups ia
		{ 'hProcess': this.HANDLE }
	]);
	this.SHFILEOPSTRUCT = ctypes.StructType('_SHFILEOPSTRUCT', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/bb759795%28v=vs.85%29.aspx
		{ hwnd: this.HWND },
		{ wFunc: this.UINT },
		{ pFrom: this.PCZZTSTR },
		{ pTo: this.PCZZTSTR },
		{ fFlags: this.FILEOP_FLAGS },
		{ fAnyOperationsAborted: this.BOOL },
		{ hNameMappings: this.LPVOID },
		{ lpszProgressTitle: this.PCTSTR }
	]);
	this.SYSTEM_HANDLE_TABLE_ENTRY_INFO_EX = ctypes.StructType('_SYSTEM_HANDLE_TABLE_ENTRY_INFO_EX', [ // http://processhacker.sourceforge.net/doc/struct___s_y_s_t_e_m___h_a_n_d_l_e___t_a_b_l_e___e_n_t_r_y___i_n_f_o___e_x.html // http://processhacker.sourceforge.net/doc/ntexapi_8h_source.html line 1864
		{ Object: this.PVOID },
		{ UniqueProcessId: this.ULONG_PTR  },
		{ HandleValue: this.ULONG_PTR  },
		{ GrantedAccess: this.ULONG },
		{ CreatorBackTraceIndex: this.USHORT },
		{ ObjectTypeIndex: this.USHORT },
		{ HandleAttributes: this.ULONG },
		{ Reserved: this.ULONG }
	]);
	this.UNICODE_STRING = ctypes.StructType('_LSA_UNICODE_STRING', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/aa380518%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
		{ 'Length': this.USHORT },
		{ 'MaximumLength': this.USHORT },
		{ 'Buffer': this.PWSTR }
	]);
	this.VARIANT = ctypes.StructType('tagVARIANT', [ // so i set it to DECIMAL which i think is the biggest this union can be // cant do this either - i get cannot construct from void_t - ctypes.void_t; // as only ptrs to this are used // ctypes.StructType('tagVARIANT'); // defined as opaque for now, as its a bunch of unions, i should .define it to be what I need // https://msdn.microsoft.com/en-us/library/windows/desktop/ms221627(v=vs.85).aspx
		{ decVal: this.DECIMAL }
	]);
	this.WAVEFORMATEX = ctypes.StructType('tWAVEFORMATEX', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/dd390970(v=vs.85).aspx
		{ wFormatTag: this.WORD },
		{ nChannels: this.WORD },
		{ nSamplesPerSec: this.DWORD },
		{ nAvgBytesPerSec: this.DWORD },
		{ nBlockAlign: this.WORD },
		{ wBitsPerSample: this.WORD },
		{ cbSize: this.WORD }
	]);
	this.WAVEHDR = ctypes.StructType('wavehdr_tag');
	this.WAVEHDR.define([ // https://msdn.microsoft.com/en-us/library/windows/desktop/dd743837(v=vs.85).aspx
		{ lpData: this.LPSTR },
	    { dwBufferLength: this.DWORD },
	    { dwBytesRecorded: this.DWORD },
	    { dwUser: this.DWORD_PTR },
	    { dwFlags: this.DWORD },
	    { dwLoops: this.DWORD },
	    { lpNext: this.WAVEHDR.ptr },
	    { reserved: this.DWORD_PTR }
	]);
	this.WAVEINCAPS = ctypes.StructType('tagWAVEINCAPS', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/dd743839(v=vs.85).aspx
		{ wMid: this.WORD },
	    { wPid: this.WORD },
	    { vDriverVersion: this.MMVERSION },
	    { szPname: this.TCHAR.array(struct_const.MAXPNAMELEN) },
	    { dwFormats: this.DWORD },
	    { wChannels: this.WORD },
	    { wReserved1: this.WORD }
	]);

	// ADVANCED STRUCTS // based on "simple structs" to be defined first
	this.BITMAPINFO = ctypes.StructType('BITMAPINFO', [
		{ bmiHeader: this.BITMAPINFOHEADER },
		{ bmiColors: this.RGBQUAD.array(1) }
	]);
	this.CIEXYZTRIPLE = ctypes.StructType('CIEXYZTRIPLE', [
		{ ciexyzRed: this.CIEXYZ },
		{ ciexyzGreen: this.CIEXYZ },
		{ ciexyzBlue: this.CIEXYZ }
	]);
	this.CLSID = this.GUID;
	this.DEVMODE = ctypes.StructType('_devicemode', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/dd183565%28v=vs.85%29.aspx // https://github.com/mdsitton/pyglwindow/blob/5aab9de8036938166c01caf26b220c43400aaadb/src/library/win32/wintypes.py#L150
		{ 'dmDeviceName': this.TCHAR.array(struct_const.CCHDEVICENAME) },
		{ 'dmSpecVersion': this.WORD },
		{ 'dmDriverVersion': this.WORD },
		{ 'dmSize': this.WORD },
		{ 'dmDriverExtra': this.WORD },
		{ 'dmFields': this.DWORD },
		{
			'u': ctypes.StructType('_U', [	// union1
				{ 'dmPosition': this.POINTL },
				{ 'dmDisplayOrientation': this.DWORD },
				{ 'dmDisplayFixedOutput': this.DWORD }
			])
		},
		{ 'dmColor': this.SHORT },
		{ 'dmDuplex': this.SHORT },
		{ 'dmYResolution': this.SHORT },
		{ 'dmTTOption': this.SHORT },
		{ 'dmCollate': this.SHORT },
		{ 'dmFormName': this.TCHAR.array(struct_const.CCHFORMNAME) },
		{ 'dmLogPixels': this.WORD },
		{ 'dmBitsPerPel': this.DWORD },
		{ 'dmPelsWidth': this.DWORD },
		{ 'dmPelsHeight': this.DWORD },
		{ 'dmDisplayFlags': this.DWORD  },	// union2
		{ 'dmDisplayFrequency': this.DWORD },
		{ 'dmICMMethod': this.DWORD },
		{ 'dmICMIntent': this.DWORD },
		{ 'dmMediaType': this.DWORD },
		{ 'dmDitherType': this.DWORD },
		{ 'dmReserved1': this.DWORD },
		{ 'dmReserved2': this.DWORD },
		{ 'dmPanningWidth': this.DWORD },
		{ 'dmPanningHeight': this.DWORD }
	]);
	this.ENUMLOGFONT = ctypes.StructType('tagENUMLOGFONT', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/dd162626%28v=vs.85%29.aspx
		{ elfLogFont: this.LOGFONT },
		{ elfFullName: this.TCHAR.array(struct_const.LF_FULLFACESIZE) },
		{ elfStyle: this.TCHAR.array(struct_const.LF_FACESIZE) }
	]);
	this.IID = this.GUID;
	this.INPUT = ctypes.StructType('tagINPUT', [
		{ 'type': this.DWORD },
		{ 'mi': this.MOUSEINPUT } // union, pick which one you want, i picked mouse
	]);
	this.KBDLLHOOKSTRUCT = ctypes.StructType('tagKBDLLHOOKSTRUCT', [
		{ vkCode: this.DWORD },
		{ scanCode: this.DWORD },
		{ flags: this.DWORD },
		{ time: this.DWORD },
		{ dwExtraInfo: this.ULONG_PTR }
	]);
	this.LPCWAVEFORMATEX = this.WAVEFORMATEX.ptr;
	this.LPCGUID = this.GUID.ptr;
	this.LPOVERLAPPED = this.OVERLAPPED.ptr;
	this.LPLOGFONT = this.LOGFONT.ptr;
	this.LPSECURITY_ATTRIBUTES = this.SECURITY_ATTRIBUTES.ptr;
	this.LPWAVEHDR = this.WAVEHDR.ptr;
	this.LPWAVEINCAPS = this.WAVEINCAPS.ptr;
	this.MONITORINFOEX = ctypes.StructType('tagMONITORINFOEX', [
		{ cbSize:		this.DWORD },
		{ rcMonitor:	this.RECT },
		{ rcWork:		this.RECT },
		{ dwFlags:		this.DWORD },
		{ szDevice:		this.TCHAR.array(struct_const.CCHDEVICENAME) }
	]);
	this.MSLLHOOKSTRUCT = ctypes.StructType('tagMSLLHOOKSTRUCT', [
		{ pt: this.POINT },
		{ mouseData: this.DWORD },
		{ flags: this.DWORD },
		{ time: this.DWORD },
		{ dwExtraInfo: this.ULONG_PTR }
	]);
	this.MSG = ctypes.StructType('tagMSG', [
		{ hwnd: this.HWND },
		{ message: this.UINT },
		{ wParam: this.WPARAM },
		{ lParam: this.LPARAM },
		{ time: this.DWORD },
		{ pt: this.POINT }
	]);
	this.OBJECT_NAME_INFORMATION = ctypes.StructType('_OBJECT_NAME_INFORMATION', [ // https://github.com/wine-mirror/wine/blob/80ea5a01ef42b0e9e0b6c872f8f5bbbf393c0ae7/include/winternl.h#L1107
		{ Name: this.UNICODE_STRING }
	]);
	this.PGUID = this.GUID.ptr;
	this.PIO_STATUS_BLOCK = this.IO_STATUS_BLOCK.ptr;
	this.PRECT = this.RECT.ptr;
	this.PROPERTYKEY = new ctypes.StructType('PROPERTYKEY', [
		{ 'fmtid': this.GUID },
		{ 'pid': this.DWORD }
	]);
    this.LPRECT = this.RECT.ptr;
    this.LPCRECT = this.RECT.ptr;
	this.LPPOINT = this.POINT.ptr;
	this.LPSHFILEOPSTRUCT = this.SHFILEOPSTRUCT.ptr;
	this.PBITMAPINFOHEADER = this.BITMAPINFOHEADER.ptr;
	this.PDISPLAY_DEVICE = this.DISPLAY_DEVICE.ptr;
	this.PCRAWINPUTDEVICE = this.RAWINPUTDEVICE.ptr;
	this.RAWINPUT = ctypes.StructType('tagRAWINPUT', [
		{ header: this.RAWINPUTHEADER },
		{ mouse: this.RAWMOUSE } // use this.RAWMOUSE instead of RAWHID or RAWKEYBOARD as RAWMOUSE struct is the biggest, the tutorial linked below also says this
	]);
	this.REFPROPVARIANT = this.PROPVARIANT.ptr;
	this.SYSTEM_HANDLE_INFORMATION_EX = ctypes.StructType('_SYSTEM_HANDLE_INFORMATION_EX', [ // http://processhacker.sourceforge.net/doc/ntexapi_8h_source.html#l01876 // http://processhacker.sourceforge.net/doc/struct___s_y_s_t_e_m___h_a_n_d_l_e___i_n_f_o_r_m_a_t_i_o_n___e_x.html#a207406a9486f1f35c2e9bf5214612e62
		{ NumberOfHandles: this.ULONG_PTR },
		{ Reserved: this.ULONG_PTR },
		{ Handles: this.SYSTEM_HANDLE_TABLE_ENTRY_INFO_EX.array(1) }
	])
	this.SYSTEM_THREAD_INFORMATION = ctypes.StructType('_SYSTEM_THREAD_INFORMATION', [ // http://processhacker.sourceforge.net/doc/struct___s_y_s_t_e_m___t_h_r_e_a_d___i_n_f_o_r_m_a_t_i_o_n.html
		{ KernelTime: this.LARGE_INTEGER },
		{ UserTime: this.LARGE_INTEGER },
		{ CreateTime: this.LARGE_INTEGER },
		{ WaitTime: this.ULONG },
		{ StartAddress: this.PVOID },
		{ ClientId: this.CLIENT_ID },
		{ Priority: this.KPRIORITY },
		{ BasePriority: this.LONG },
		{ ContextSwitches: this.ULONG },
		{ ThreadState: this.ULONG },
		{ WaitReason: this.KWAIT_REASON }
	]);
	this.VARIANTARG = this.VARIANT;
	this.LPVARIANT = this.VARIANT.ptr;
	this.LPVARIANTARG = this.VARIANT.ptr;
	this.WAVEFORMATEXTENSIBLE = ctypes.StructType('WAVEFORMATEXTENSIBLE', [
		{ Format: this.WAVEFORMATEX },
		{ wValidBitsPerSample: this.WORD }, // union { WORD wValidBitsPerSample; WORD wSamplesPerBlock; WORD wReserved; } Samples
		{ dwChannelMask: this.DWORD },
		{ SubFormat: this.GUID }
	]);
	this.WIN32_FIND_DATA = ctypes.StructType('_WIN32_FIND_DATA', [ // https://msdn.microsoft.com/en-us/library/windows/desktop/aa365740%28v=vs.85%29.aspx
		{ 'dwFileAttributes': this.DWORD },
		{ 'ftCreationTime': this.FILETIME },
		{ 'ftLastAccessTime': this.FILETIME },
		{ 'ftLastWriteTime': this.FILETIME },
		{ 'nFileSizeHigh': this.DWORD },
		{ 'nFileSizeLow': this.DWORD },
		{ 'dwReserved0': this.DWORD },
		{ 'dwReserved1': this.DWORD },
		{ 'cFileName': this.TCHAR.array(OS.Constants.Win.MAX_PATH) },
		{ 'cAlternateFileName': this.TCHAR.array(14) }
	]);

	// FURTHER ADVANCED STRUCTS
	this.BITMAPV5HEADER = ctypes.StructType('BITMAPV5HEADER', [
		{ bV5Size:		this.DWORD },
		{ bV5Width:		this.LONG },
		{ bV5Height:		this.LONG },
		{ bV5Planes:		this.WORD },
		{ bV5BitCount:		this.WORD },
		{ bV5Compression:	this.DWORD },
		{ bV5SizeImage:		this.DWORD },
		{ bV5XPelsPerMeter:	this.LONG },
		{ bV5YPelsPerMeter:	this.LONG },
		{ bV5ClrUsed:		this.DWORD },
		{ bV5ClrImportant:	this.DWORD },
		{ bV5RedMask:		this.DWORD },
		{ bV5GreenMask:		this.DWORD },
		{ bV5BlueMask:		this.DWORD },
		{ bV5AlphaMask:		this.DWORD },
		{ bV5CSType:		this.DWORD },
		{ bV5Endpoints:		this.CIEXYZTRIPLE },
		{ bV5GammaRed:		this.DWORD },
		{ bV5GammaGreen:	this.DWORD },
		{ bV5GammaBlue:		this.DWORD },
		{ bV5Intent:		this.DWORD },
		{ bV5ProfileData:	this.DWORD },
		{ bV5ProfileSize:	this.DWORD },
		{ bV5Reserved:		this.DWORD }
	]);
	this.LPINPUT = this.INPUT.ptr;
	this.LPMONITORINFOEX = this.MONITORINFOEX.ptr;
	this.LPMSG = this.MSG.ptr;
	this.PMSG = this.MSG.ptr;
	this.PWAVEFORMATEXTENSIBLE = this.WAVEFORMATEXTENSIBLE.ptr;
	this.REFCLSID = this.CLSID.ptr; // https://github.com/wine-mirror/wine/blob/bdeb761357c87d41247e0960f71e20d3f05e40e6/include/wtypes.idl#L288
	this.REFIID = this.IID.ptr;
	this.REFPROPERTYKEY = this.PROPERTYKEY.ptr; // note: if you use any REF... (like this.REFPROPERTYKEY) as an arg to a declare, that arg expects a ptr. this is basically like
	this.SYSTEM_PROCESS_INFORMATION = ctypes.StructType('_SYSTEM_PROCESS_INFORMATION', [ // http://processhacker.sourceforge.net/doc/struct___s_y_s_t_e_m___p_r_o_c_e_s_s___i_n_f_o_r_m_a_t_i_o_n.html
		{ NextEntryOffset: this.ULONG },
		{ NumberOfThreads: this.ULONG },
		{ WorkingSetPrivateSize: this.LARGE_INTEGER },		// since VISTA
		{ HardFaultCount: this.ULONG },						// since WIN7
		{ NumberOfThreadsHighWatermark: this.ULONG },		// since WIN7
		{ CycleTime: this.ULONGLONG },						// since WIN7
		{ CreateTime: this.LARGE_INTEGER },
		{ UserTime: this.LARGE_INTEGER },
		{ KernelTime: this.LARGE_INTEGER },
		{ ImageName: this.UNICODE_STRING },
		{ BasePriority: this.KPRIORITY },
		{ UniqueProcessId: this.HANDLE },
		{ InheritedFromUniqueProcessId: this.HANDLE },
		{ HandleCount: this.ULONG },
		{ SessionId: this.ULONG },
		{ UniqueProcessKey: this.ULONG_PTR },				// since VISTA (requires SystemExtendedProcessInformation)
		{ PeakVirtualSize: this.size_t },
		{ VirtualSize: this.size_t },
		{ PageFaultCount: this.ULONG },
		{ PeakWorkingSetSize: this.size_t },
		{ WorkingSetSize: this.size_t },
		{ QuotaPeakPagedPoolUsage: this.size_t },
		{ QuotaPagedPoolUsage: this.size_t },
		{ QuotaPeakNonPagedPoolUsage: this.size_t },
		{ QuotaNonPagedPoolUsage: this.size_t },
		{ PagefileUsage: this.size_t },
		{ PeakPagefileUsage: this.size_t },
		{ PrivatePageCount: this.size_t },
		{ ReadOperationCount: this.LARGE_INTEGER },
		{ WriteOperationCount: this.LARGE_INTEGER },
		{ OtherOperationCount: this.LARGE_INTEGER },
		{ ReadTransferCount: this.LARGE_INTEGER },
		{ WriteTransferCount: this.LARGE_INTEGER },
		{ OtherTransferCount: this.LARGE_INTEGER },
		{ Threads: this.SYSTEM_THREAD_INFORMATION.array(1) }
	]);

	// FURTHER ADV STRUCTS
	this.PBITMAPINFO = this.BITMAPINFO.ptr;

	// FUNCTION TYPES
	this.EnumFontFamProc = ctypes.FunctionType(this.CALLBACK_ABI, this.int, [this.ENUMLOGFONT.ptr, this.NEWTEXTMETRIC.ptr, this.DWORD, this.LPARAM]); // https://msdn.microsoft.com/en-us/library/windows/desktop/dd162621%28v=vs.85%29.aspx
	this.FileIOCompletionRoutine = ctypes.FunctionType(this.CALLBACK_ABI, this.VOID, [this.DWORD, this.DWORD, this.LPOVERLAPPED]);
	this.MONITORENUMPROC = ctypes.FunctionType(this.CALLBACK_ABI, this.BOOL, [this.HMONITOR, this.HDC, this.LPRECT, this.LPARAM]);
	this.LowLevelMouseProc = ctypes.FunctionType(this.CALLBACK_ABI, this.LRESULT, [this.INT, this.WPARAM, this.LPARAM]);
	this.LowLevelKeyboardProc = ctypes.FunctionType(this.CALLBACK_ABI, this.LRESULT, [this.INT, this.WPARAM, this.LPARAM]);
	this.WNDPROC = ctypes.FunctionType(this.CALLBACK_ABI, this.LRESULT, [
		this.HWND,		// hwnd,
		this.UINT,		// uMsg,
		this.WPARAM,	// wParam,
		this.LPARAM	// lParam
	]);
	this.TIMERPROC = ctypes.FunctionType(this.CALLBACK_ABI, this.VOID, [this.HWND, this.UINT, this.UINT_PTR, this.DWORD]);
	this.WAITORTIMERCALLBACK = ctypes.FunctionType(this.CALLBACK_ABI, this.VOID, [
		this.PVOID,			// lpParameter,
		this.BOOLEAN		// TimerOrWaitFired
	]);
	this.OVERLAPPED_COMPLETION_ROUTINE = ctypes.FunctionType(this.CALLBACK_ABI, this.VOID, [
		this.DWORD,            // _In_    DWORD        dwErrorCode,
		this.DWORD,            // _In_    DWORD        dwNumberOfBytesTransfered,
		this.OVERLAPPED.ptr    // _Inout_ LPOVERLAPPED lpOverlapped
	]);
	this.LPOVERLAPPED_COMPLETION_ROUTINE = this.OVERLAPPED_COMPLETION_ROUTINE.ptr;

	// ADV FUNC TYPES
	this.FONTENUMPROC = this.EnumFontFamProc.ptr;
	this.LPOVERLAPPED_COMPLETION_ROUTINE = this.FileIOCompletionRoutine.ptr;

	// INACCURATE TYPES
	this.HOOKPROC = ctypes.voidptr_t; // note really a guess type. just slightly inaccurate because i made voidptr_t because sometimes i need it as `this.LowLevelMouseProc.ptr` and others as `this.LowLevelKeyboardProc.ptr` // not a guess really, as this is the hook type i use, so yeah it has to be a pointer to it

	// STRUCTS USING FUNC TYPES
	this.WNDCLASS = ctypes.StructType('tagWNDCLASS', [
		{ style: this.UINT },
		{ lpfnWndProc: this.WNDPROC.ptr },
		{ cbClsExtra: this.INT },
		{ cbWndExtra: this.INT },
		{ hInstance: this.HINSTANCE },
		{ hIcon: this.HICON },
		{ hCursor: this.HCURSOR },
		{ hbrBackground: this.HBRUSH },
		{ lpszMenuName: this.LPCTSTR },
		{ lpszClassName: this.LPCTSTR }
	]);

	// VTABLEs - Level 1
	// IAudioCaptureClient - https://msdn.microsoft.com/en-us/library/windows/desktop/dd370858%28v=vs.85%29.aspx
	// order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/wineoss.drv/mmdevdrv.c#L2112
	var IAudioCaptureClientVtbl = ctypes.StructType('IAudioCaptureClientVtbl');
	this.IAudioCaptureClient = ctypes.StructType('IAudioCaptureClient', [
		{ 'lpVtbl': IAudioCaptureClientVtbl.ptr }
	]);
	IAudioCaptureClientVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioCaptureClient.ptr,
					this.REFIID,		// riid
					this.VOID.ptr.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IAudioCaptureClient.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IAudioCaptureClient.ptr
				]).ptr
		}, { //end inherit from IUnknown // start IAudioCaptureClient
			'GetBuffer': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioCaptureClient.ptr,
					this.BYTE.ptr.ptr,		// **ppData
					this.UINT32.ptr,		// *pNumFramesToRead
					this.DWORD.ptr,			// *pdwFlags
					this.UINT64.ptr,		// *pu64DevicePosition
					this.UINT64.ptr,		// *pu64QPCPosition
				]).ptr
		}, {
			'ReleaseBuffer': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioCaptureClient.ptr,
					this.UINT32		// NumFramesRead
				]).ptr
		}, {
			'GetNextPacketSize': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioCaptureClient.ptr,
					this.UINT32.ptr			// *pNumFramesInNextPacket
				]).ptr
		}
	]);

	// IAudioClient - https://msdn.microsoft.com/en-us/library/windows/desktop/dd370865%28v=vs.85%29.aspx
	// order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/wineoss.drv/mmdevdrv.c#L1766
	var IAudioClientVtbl = ctypes.StructType('IAudioClientVtbl');
	this.IAudioClient = ctypes.StructType('IAudioClient', [
		{ 'lpVtbl': IAudioClientVtbl.ptr }
	]);
	IAudioClientVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioClient.ptr,
					this.REFIID,		// riid
					this.VOID.ptr.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IAudioClient.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IAudioClient.ptr
				]).ptr
		}, { //end inherit from IUnknown // start IAudioClient
			'Initialize': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioClient.ptr,
					this.AUDCLNT_SHAREMODE,		// ShareMode
					this.DWORD,			// StreamFlags
					this.REFERENCE_TIME,		// hnsBufferDuration
					this.REFERENCE_TIME,		// hnsPeriodicity
					this.WAVEFORMATEX.ptr,		// *pFormat
					this.LPCGUID			// AudioSessionGuid
				]).ptr
		}, {
			'GetBufferSize': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioClient.ptr,
					this.UINT32.ptr		// *pNumBufferFrames
				]).ptr
		}, {
			'GetStreamLatency': ctypes.voidptr_t
		}, {
			'GetCurrentPadding': ctypes.voidptr_t
		}, {
			'IsFormatSupported': ctypes.voidptr_t
		}, {
			'GetMixFormat': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioClient.ptr,
					this.WAVEFORMATEX.ptr.ptr	// **ppDeviceFormat
				]).ptr
		}, {
			'GetDevicePeriod': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioClient.ptr,
					this.REFERENCE_TIME.ptr,	// *phnsDefaultDevicePeriod
					this.REFERENCE_TIME.ptr		// *phnsMinimumDevicePeriod
				]).ptr
		}, {
			'Start': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioClient.ptr
				]).ptr
		}, {
			'Stop': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioClient.ptr
				]).ptr
		}, {
			'Reset': ctypes.voidptr_t
		}, {
			'SetEventHandle': ctypes.voidptr_t
		}, {
			'GetService': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioClient.ptr,
					this.REFIID,		// riid
					this.void.ptr		// **ppv
				]).ptr
		}
	]);

	// IAudioRenderClient - https://msdn.microsoft.com/en-us/library/windows/desktop/dd368242%28v=vs.85%29.aspx
	// order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/wineoss.drv/mmdevdrv.c#L1943
	var IAudioRenderClientVtbl = ctypes.StructType('IAudioRenderClientVtbl');
	this.IAudioRenderClient = ctypes.StructType('IAudioRenderClient', [
		{ 'lpVtbl': IAudioRenderClientVtbl.ptr }
	]);
	IAudioRenderClientVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioRenderClient.ptr,
					this.REFIID,		// riid
					this.VOID.ptr.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IAudioRenderClient.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IAudioRenderClient.ptr
				]).ptr
		}, { //end inherit from IUnknown // start IAudioRenderClient
			'GetBuffer': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioRenderClient.ptr,
					this.UINT32,			// NumFramesRequested
					this.BYTE.ptr.ptr		// **ppData
				]).ptr
		}, {
			'ReleaseBuffer': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IAudioRenderClient.ptr,
					this.UINT32,		// NumFramesWritten
					this.DWORD		// dwFlags
				]).ptr
		}
	]);

	// IBindCtx - https://msdn.microsoft.com/en-us/library/windows/desktop/ms693755(v=vs.85).aspx
	var IBindCtxVtbl = ctypes.StructType('IBindCtxVtbl');
	this.IBindCtx = ctypes.StructType('IBindCtx', [
		{ 'lpVtbl': IBindCtxVtbl.ptr }
	]);

	// IErrorLog - http://r.search.yahoo.com/_ylt=A86.J7olkUVXvRIAruAnnIlQ;_ylu=X3oDMTByb2lvbXVuBGNvbG8DZ3ExBHBvcwMxBHZ0aWQDBHNlYwNzcg--/RV=2/RE=1464205734/RO=10/RU=https%3a%2f%2fmsdn.microsoft.com%2fen-us%2flibrary%2faa768231%28v%3dvs.85%29.aspx/RK=0/RS=_VJfXBUFoV2nfguAS0bULeeeDrk-
	var IErrorLogVtbl = ctypes.StructType('IErrorLogVtbl');
	this.IErrorLog = ctypes.StructType('IErrorLog', [
		{ 'lpVtbl': IErrorLogVtbl.ptr }
	]);

	// IMediaControl - https://msdn.microsoft.com/en-us/library/windows/desktop/dd390170(v=vs.85).aspx
	// vtable order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/quartz/filtergraph.c#L2211
	var IMediaControlVtbl = ctypes.StructType('IMediaControlVtbl');
	this.IMediaControl = ctypes.StructType('IMediaControl', [
		{ 'lpVtbl': IMediaControlVtbl.ptr }
	]);
	IMediaControlVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMediaControl.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IMediaControl.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IMediaControl.ptr
				]).ptr
		}, { // end inherit from IUnknown // start inherit from IDispatch
			'GetTypeInfoCount': ctypes.voidptr_t
		}, {
			'GetTypeInfo': ctypes.voidptr_t
		}, {
			'GetIDsOfNames': ctypes.voidptr_t
		}, {
			'Invoke': ctypes.voidptr_t
		}, { // end inherit from IDispatch // start IMediaControl
			'Run': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMediaControl.ptr
				]).ptr
		}, {
			'Pause': ctypes.voidptr_t
		}, {
			'Stop': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMediaControl.ptr
				]).ptr
		}, {
			'GetState': ctypes.voidptr_t
		}, {
			'RenderFile': ctypes.voidptr_t
		}, {
			'AddSourceFilter': ctypes.voidptr_t
		}, {
			'get_FilterCollection': ctypes.voidptr_t
		}, {
			'get_RegFilterCollection': ctypes.voidptr_t
		}, {
			'StopWhenReady': ctypes.voidptr_t
		}
	]);

	// IMMDevice - https://msdn.microsoft.com/en-us/library/windows/desktop/dd371395%28v=vs.85%29.aspx
	// order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/mmdevapi/devenum.c#L716
	var IMMDeviceVtbl = ctypes.StructType('IMMDeviceVtbl');
	this.IMMDevice = ctypes.StructType('IMMDevice', [
		{ 'lpVtbl': IMMDeviceVtbl.ptr }
	]);
	IMMDeviceVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMMDevice.ptr,
					this.REFIID,		// riid
					this.VOID.ptr.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IMMDevice.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IMMDevice.ptr
				]).ptr
		}, { //end inherit from IUnknown // start IMMDevice
			'Activate': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMMDevice.ptr,
					this.REFIID,		// riid
					this.DWORD,		// clsctx
					this.PROPVARIANT.ptr,	// *params
					this.void.ptr		// **ppv
				]).ptr
		}, {
			'OpenPropertyStore': ctypes.voidptr_t
		}, {
			'GetId': ctypes.voidptr_t
		}, {
			'GetState': ctypes.voidptr_t
		}
	]);

	// IMMDeviceEnumerator - https://msdn.microsoft.com/en-us/library/windows/desktop/dd371399%28v=vs.85%29.aspx
	// order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/mmdevapi/devenum.c#L1308
	var IMMDeviceEnumeratorVtbl = ctypes.StructType('IMMDeviceEnumeratorVtbl');
	this.IMMDeviceEnumerator = ctypes.StructType('IMMDeviceEnumerator', [
		{ 'lpVtbl': IMMDeviceEnumeratorVtbl.ptr }
	]);
	IMMDeviceEnumeratorVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMMDeviceEnumerator.ptr,
					this.REFIID,		// riid
					this.VOID.ptr.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IMMDeviceEnumerator.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IMMDeviceEnumerator.ptr
				]).ptr
		}, { //end inherit from IUnknown // start IMMDeviceEnumerator
			'EnumAudioEndpoints': ctypes.voidptr_t
		}, {
			'GetDefaultAudioEndpoint': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMMDeviceEnumerator.ptr,
					this.EDataFlow,		// dataFlow
					this.ERole,		// role
					this.IMMDevice.ptr.ptr	// **ppDevice
				]).ptr
		}, {
			'GetDevice': ctypes.voidptr_t
		}, {
			'RegisterEndpointNotificationCallback': ctypes.voidptr_t
		}, {
			'UnregisterEndpointNotificationCallback': ctypes.voidptr_t
		}
	]);

	// IPersistFile - https://msdn.microsoft.com/en-us/library/windows/desktop/ms687223(v=vs.85).aspx
	var IPersistFileVtbl = ctypes.StructType('IPersistFileVtbl');
	this.IPersistFile = ctypes.StructType('IPersistFile', [
		{ 'lpVtbl': IPersistFileVtbl.ptr }
	]);
	IPersistFileVtbl.define([
		{ // start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPersistFile.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IPersistFile.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IPersistFile.ptr
				]).ptr
		}, { // end inherit from IUnknown // start inherit from IPersist
			'GetClassID': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPersistFile.ptr,
					this.CLSID.ptr	// *pClassID
				]).ptr
		}, { // end inherit from IPersist // start IPersistFile
			'IsDirty': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPersistFile.ptr,
				]).ptr
		}, {
			'Load': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPersistFile.ptr,
					this.LPCOLESTR,	// pszFileName
					this.DWORD		// dwMode
				]).ptr
		}, {
			'Save': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPersistFile.ptr,
					this.LPCOLESTR,	// pszFileName
					this.BOOL		// fRemember
				]).ptr
		}, {
			'SaveCompleted': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPersistFile.ptr,
					this.LPCOLESTR	// pszFileName
				]).ptr
		}, {
			'GetCurFile': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPersistFile.ptr,
					this.LPOLESTR.ptr	// *ppszFileName
				]).ptr
		}
	]);

	// IPin - https://msdn.microsoft.com/en-us/library/windows/desktop/dd390397(v=vs.85).aspx
	// vtable order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/strmbase/transform.c#L563
	var IPinVtbl = ctypes.StructType('IPinVtbl');
	this.IPin = ctypes.StructType('IPin', [
		{ 'lpVtbl': IPinVtbl.ptr }
	]);
	IPinVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPin.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IPin.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IPin.ptr
				]).ptr
		}, { // end inherit from IUnknown // start IPin
			'Connect': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPin.ptr,
					this.IPin.ptr,			// *pReceivePin
					this.AM_MEDIA_TYPE.ptr	// *pmt
				]).ptr
		}, {
			'ReceiveConnection': ctypes.voidptr_t
		}, {
			'Disconnect': ctypes.voidptr_t
		}, {
			'ConnectedTo': ctypes.voidptr_t
		}, {
			'ConnectionMediaType': ctypes.voidptr_t
		}, {
			'QueryPinInfo': ctypes.voidptr_t
			// 'QueryPinInfo': ctypes.FunctionType(this.CALLBACK_ABI,
			// 	this.HRESULT, [
			// 		this.IPin.ptr,
			// 		this.PIN_INFO.ptr		// *pInfo
			// 	]).ptr
		}, {
			'QueryDirection': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPin.ptr,
					this.PIN_DIRECTION.ptr		// *pPinDir
				]).ptr
		}, {
			'QueryId': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPin.ptr,
					this.LPWSTR.ptr		// *Id
				]).ptr
		}, {
			'QueryAccept': ctypes.voidptr_t
		}, {
			'EnumMediaTypes': ctypes.voidptr_t
		}, {
			'QueryInternalConnections': ctypes.voidptr_t
		}, {
			'EndOfStream': ctypes.voidptr_t
		}, {
			'BeginFlush': ctypes.voidptr_t
		}, {
			'EndFlush': ctypes.voidptr_t
		}, {
			'NewSegment': ctypes.voidptr_t
		}
	]);

	// IPropertyStore - https://msdn.microsoft.com/en-us/library/windows/desktop/bb761474(v=vs.85).aspx
	var IPropertyStoreVtbl = ctypes.StructType('IPropertyStoreVtbl');
	this.IPropertyStore = ctypes.StructType('IPropertyStore', [
		{ 'lpVtbl': IPropertyStoreVtbl.ptr }
	]);
	IPropertyStoreVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPropertyStore.ptr,
					this.REFIID,		// riid
					this.VOID.ptr.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IPropertyStore.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IPropertyStore.ptr
				]).ptr
		}, { //end inherit from IUnknown // start IPropertyStore
			'GetCount': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPropertyStore.ptr,
					this.DWORD.ptr	// *cProps
				]).ptr
		}, {
			'GetAt': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPropertyStore.ptr,
					this.DWORD,				// iProp
					this.PROPERTYKEY.ptr	// *pkey
				]).ptr
		}, {
			'GetValue': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPropertyStore.ptr,
					this.REFPROPERTYKEY,	// key
					this.PROPVARIANT.ptr	// *pv
				]).ptr
		}, {
			'SetValue': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPropertyStore.ptr,
					this.REFPROPERTYKEY,	// key
					this.REFPROPVARIANT		// propvar
				]).ptr
		}, {
			'Commit': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPropertyStore.ptr
				]).ptr
		}
	]);

	// IShellLinkW - https://msdn.microsoft.com/en-us/library/windows/desktop/bb774950(v=vs.85).aspx
	var IShellLinkWVtbl = ctypes.StructType('IShellLinkWVtbl');
	this.IShellLinkW = ctypes.StructType('IShellLinkW', [
		{ 'lpVtbl': IShellLinkWVtbl.ptr }
	]);
	//this.IShellLinkWPtr = new ctypes.PointerType(IShellLinkW);
	IShellLinkWVtbl.define(
		[{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IShellLinkW.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IShellLinkW.ptr
				]).ptr
		}, { //end inherit from IUnknown //start IShellLinkW
			'GetPath': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPTSTR,				// pszFile
					this.INT,					// cchMaxPath
					this.WIN32_FIND_DATA.ptr,	// *pfd
					this.DWORD					// fFlags
				]).ptr
		}, {
			'GetIDList': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.PIDLIST_ABSOLUTE.ptr	// *ppidl
				]).ptr
		}, {
			'SetIDList': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.PCIDLIST_ABSOLUTE	// pidl
				]).ptr
		}, {
			'GetDescription': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPTSTR,	// pszName
					this.INT		// cchMaxName
				]).ptr
		}, {
			'SetDescription': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPCTSTR		// pszName
				]).ptr
		}, {
			'GetWorkingDirectory': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPTSTR,		// pszDir
					this.INT			// cchMaxPath
				]).ptr
		}, {
			'SetWorkingDirectory': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPCTSTR
				]).ptr
		}, {
			'GetArguments': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPTSTR,	// pszArgs
					this.INT		// cchMaxPath
				]).ptr
		}, {
			'SetArguments': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPCTSTR		// pszArgs
				]).ptr
		}, {
			'GetHotKey': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.WORD.ptr	// *pwHotkey
				]).ptr
		}, {
			'SetHotKey': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.WORD	// wHotkey
				]).ptr
		}, {
			'GetShowCmd': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.INT.ptr		// *piShowCmd
				]).ptr
		}, {
			'SetShowCmd': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.INT		// iShowCmd
				]).ptr
		}, {
			'GetIconLocation': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPTSTR,	// pszIconPath
					this.INT,		// cchIconPath
					this.INT.ptr	// *piIcon
				]).ptr
		}, {
			'SetIconLocation': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPCTSTR,	// pszIconPath
					this.INT		// iIcon
				]).ptr
		}, {
			'SetRelativePath': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPCTSTR,	// pszPathRel
					this.DWORD		// dwReserved
				]).ptr
		}, {
			'Resolve': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.HWND,	// hwnd
					this.DWORD	// fFlags
				]).ptr
		}, {
			'SetPath': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IShellLinkW.ptr,
					this.LPCTSTR	// pszFile
				]).ptr
		}
	]);

	// ITaskbarList - https://msdn.microsoft.com/en-us/library/windows/desktop/bb774652(v=vs.85).aspx
	var ITaskbarListVtbl = ctypes.StructType('ITaskbarListVtbl');
	this.ITaskbarList = ctypes.StructType('ITaskbarList', [
		{ 'lpVtbl': ITaskbarListVtbl.ptr }
	]);
	ITaskbarListVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.ITaskbarList.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.ITaskbarList.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.ITaskbarList.ptr
				]).ptr
		}, { //end inherit from IUnknown // start ITaskbarList
			'HrInit': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.ITaskbarList.ptr
				]).ptr
		}, {
			'AddTab': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.ITaskbarList.ptr,
					this.HWND				// hWnd
				]).ptr
		}, {
			'DeleteTab': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.ITaskbarList.ptr,
					this.HWND				// hWnd
				]).ptr
		}, {
			'ActivateTab': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.ITaskbarList.ptr,
					this.HWND				// hWnd
				]).ptr
		}, {
			'SetActiveAlt': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.ITaskbarList.ptr,
					this.HWND				// hWnd
				]).ptr
		}
	]);

	// VTABLE's - ADVANCED
	// IEnumPins - https://msdn.microsoft.com/en-us/library/windows/desktop/dd376610(v=vs.85).aspx
	// vtable order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/strmbase/enumpins.c#L206
	var IEnumPinsVtbl = ctypes.StructType('IEnumPinsVtbl');
	this.IEnumPins = ctypes.StructType('IEnumPins', [
		{ 'lpVtbl': IEnumPinsVtbl.ptr }
	]);
	IEnumPinsVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IEnumPins.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IEnumPins.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IEnumPins.ptr
				]).ptr
		}, { // end inherit from IUnknown // start IEnumPins
			'Next': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IEnumPins.ptr,
					this.ULONG,				// cPins
					this.IPin.ptr.ptr,		// **ppPins
					this.ULONG.ptr			// *pcFetched
				]).ptr
		}, {
			'Skip': ctypes.voidptr_t
		}, {
			'Reset': ctypes.voidptr_t
		}, {
			'Clone': ctypes.voidptr_t
		}
	]);

	// IMoniker - https://msdn.microsoft.com/en-us/library/windows/desktop/ms679705(v=vs.85).aspx
	// Vtbl order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/itss/moniker.c#L324
	var IMonikerVtbl = ctypes.StructType('IMonikerVtbl');
	this.IMoniker = ctypes.StructType('IMoniker', [
		{ 'lpVtbl': IMonikerVtbl.ptr }
	]);
	IMonikerVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMoniker.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IMoniker.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IMoniker.ptr
				]).ptr
		}, { // end inherit from IUnknown // start inherit from IPersist
			'GetClassID': ctypes.voidptr_t
		}, { // end inherit from IPersist // start inherit from IPersistStream
			'IsDirty': ctypes.voidptr_t
		}, {
			'Load': ctypes.voidptr_t
		}, {
			'Save': ctypes.voidptr_t
		}, {
			'GetSizeMax': ctypes.voidptr_t
		}, { // end inherit from IPersistStream // start IMoniker
			'BindToObject':  ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMoniker.ptr,
					this.IBindCtx.ptr,	// *pbc
					this.IMoniker.ptr,	// *pmkToLeft
					this.REFIID,		// riid
					this.VOID.ptr		// **ppvObj
				]).ptr
		}, {
			'BindToStorage':  ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IMoniker.ptr,
					this.IBindCtx.ptr,	// *pbc
					this.IMoniker.ptr,	// *pmkToLeft
					this.REFIID,		// riid
					this.VOID.ptr		// **ppvObj
				]).ptr
		}, {
			'Reduce': ctypes.voidptr_t
		}, {
			'ComposeWith': ctypes.voidptr_t
		}, {
			'Enum': ctypes.voidptr_t
		}, {
			'IsEqual': ctypes.voidptr_t
		}, {
			'Hash': ctypes.voidptr_t
		}, {
			'IsRunning': ctypes.voidptr_t
		}, {
			'GetTimeOfLastChange': ctypes.voidptr_t
		}, {
			'Inverse': ctypes.voidptr_t
		}, {
			'CommonPrefixWith': ctypes.voidptr_t
		}, {
			'RelativePathTo': ctypes.voidptr_t
		}, {
			'GetDisplayName': ctypes.voidptr_t
		}, {
			'ParseDisplayName': ctypes.voidptr_t
		}, {
			'IsSystemMoniker': ctypes.voidptr_t
		}
	]);

	// IPropertyBag - https://msdn.microsoft.com/en-us/library/windows/desktop/aa768196(v=vs.85).aspx
	// Vtbl order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/mshtml/propbag.c#L191
	var IPropertyBagVtbl = ctypes.StructType('IPropertyBagVtbl');
	this.IPropertyBag = ctypes.StructType('IPropertyBag', [
		{ 'lpVtbl': IPropertyBagVtbl.ptr }
	]);
	IPropertyBagVtbl.define([
		{ // start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPropertyBag.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IPropertyBag.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IPropertyBag.ptr
				]).ptr
		}, { // end inherit from IUnknown // start IPropertyBag
			'Read': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IPropertyBag.ptr,
					this.LPCOLESTR,		// pszPropName
					this.VARIANT.ptr,	// *pVar
					this.IErrorLog.ptr	// *pErrorLog
				]).ptr
		}, {
			'Write': ctypes.voidptr_t
		}
	]);

	// VTABLE's - SUPER ADVANCED
	// IBaseFilter - https://msdn.microsoft.com/en-us/library/windows/desktop/dd389526(v=vs.85).aspx
	// method order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/qcap/tests/qcap.c#L480
	var IBaseFilterVtbl = ctypes.StructType('IBaseFilterVtbl');
	this.IBaseFilter = ctypes.StructType('IBaseFilter', [
		{ 'lpVtbl': IBaseFilterVtbl.ptr }
	]);
	IBaseFilterVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IBaseFilter.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IBaseFilter.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IBaseFilter.ptr
				]).ptr
		}, { // end inherit from IUnknown // start inherit from IPersist
			'GetClassID': ctypes.voidptr_t
		}, { // end inherit from IPersist // start inherit from IMediaFilter
			'Stop': ctypes.voidptr_t
		}, {
			'Pause': ctypes.voidptr_t
		}, {
			'Run': ctypes.voidptr_t
		}, {
			'GetState': ctypes.voidptr_t
		}, {
			'SetSyncSource': ctypes.voidptr_t
		}, {
			'GetSyncSource': ctypes.voidptr_t
		}, { // end inherit from IMediaFilter // start IBaseFilter
			'EnumPins': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IBaseFilter.ptr,
					this.IEnumPins.ptr.ptr	// **ppEnum
				]).ptr
		}, {
			'FindPin': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IBaseFilter.ptr,
					this.LPCWSTR,		// Id
					this.IPin.ptr.ptr	// **ppPin
				]).ptr
		}, {
			'QueryFilterInfo': ctypes.voidptr_t
		}, {
			'JoinFilterGraph': ctypes.voidptr_t
		}, {
			'QueryVendorInfo': ctypes.voidptr_t
		}
	]);

	// IEnumMoniker - https://msdn.microsoft.com/en-us/library/windows/desktop/ms692852(v=vs.85).aspx
	// Vtbl order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/quartz/enummoniker.c#L204-L207
	var IEnumMonikerVtbl = ctypes.StructType('IEnumMonikerVtbl');
	this.IEnumMoniker = ctypes.StructType('IEnumMoniker', [
		{ 'lpVtbl': IEnumMonikerVtbl.ptr }
	]);
	IEnumMonikerVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IEnumMoniker.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IEnumMoniker.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IEnumMoniker.ptr
				]).ptr
		}, { //end inherit from IUnknown // start IEnumMoniker
			'Next': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IEnumMoniker.ptr,
					this.ULONG,					// celt
					this.IMoniker.ptr.ptr,		// **rgelt
					this.ULONG.ptr				// *pceltFetched
				]).ptr
		}, {
			'Skip': ctypes.voidptr_t
		}, {
			'Reset': ctypes.voidptr_t
		}, {
			'Clone': ctypes.voidptr_t
		}
	]);

	// IGraphBuilder - https://msdn.microsoft.com/en-us/library/windows/desktop/dd390016(v=vs.85).aspx
	// vtbl order - https://github.com/wine-mirror/wine/blob/47cf3fe36d4f5a2f83c0d48ee763c256cd6010c5/dlls/qcap/tests/qcap.c#L328
	var IGraphBuilderVtbl = ctypes.StructType('IGraphBuilderVtbl');
	this.IGraphBuilder = ctypes.StructType('IGraphBuilder', [
		{ 'lpVtbl': IGraphBuilderVtbl.ptr }
	]);
	IGraphBuilderVtbl.define([
		{ // start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IGraphBuilder.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IGraphBuilder.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.IGraphBuilder.ptr
				]).ptr
		}, { // end inherit from IUnknown // start inherit from IFilterGraph
			'AddFilter': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IGraphBuilder.ptr,
					this.IBaseFilter.ptr,			// *pFilter
					this.LPCWSTR					// pName
				]).ptr
		}, {
			'RemoveFilter': ctypes.voidptr_t
		}, {
			'EnumFilters': ctypes.voidptr_t
		}, {
			'FindFilterByName': ctypes.voidptr_t
		}, {
			'ConnectDirect': ctypes.voidptr_t
		}, {
			'Reconnect': ctypes.voidptr_t
		}, {
			'Disconnect': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.IGraphBuilder.ptr,
					this.IPin.ptr				// *ppin
				]).ptr
		}, {
			'SetDefaultSyncSource': ctypes.voidptr_t
		}, { // end inherit from IFilterGraph // start IGraphBuilder
			'Connect': ctypes.voidptr_t
		}, {
			'Render': ctypes.voidptr_t
		}, {
			'RenderFile': ctypes.voidptr_t
		}, {
			'AddSourceFilter': ctypes.voidptr_t
		}, {
			'SetLogFile': ctypes.voidptr_t
		}, {
			'Abort': ctypes.voidptr_t
		}, {
			'ShouldOperationContinue': ctypes.voidptr_t
		}

	]);

	// VTABLE's - SUPER DUPER ADVANCED
	// ICreateDevEnum - https://msdn.microsoft.com/en-us/library/windows/desktop/dd406743(v=vs.85).aspx
	var ICreateDevEnumVtbl = ctypes.StructType('ICreateDevEnumVtbl');
	this.ICreateDevEnum = ctypes.StructType('ICreateDevEnum',[
		{ 'lpVtbl': ICreateDevEnumVtbl.ptr }
	]);
	ICreateDevEnumVtbl.define([
		{ //start inherit from IUnknown
			'QueryInterface': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.ICreateDevEnum.ptr,
					this.REFIID,	// riid
					this.VOID.ptr	// **ppvObject
				]).ptr
		}, {
			'AddRef': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.ICreateDevEnum.ptr
				]).ptr
		}, {
			'Release': ctypes.FunctionType(this.CALLBACK_ABI,
				this.ULONG, [
					this.ICreateDevEnum.ptr
				]).ptr
		}, { //end inherit from IUnknown // start ICreateDevEnum
			'CreateClassEnumerator': ctypes.FunctionType(this.CALLBACK_ABI,
				this.HRESULT, [
					this.ICreateDevEnum.ptr,
					this.REFCLSID,				// clsidDeviceClass
					this.IEnumMoniker.ptr.ptr,	// **ppEnumMoniker
					this.DWORD					// dwFlags
				]).ptr
		}
	]);

	// STRUCTS USING VTABLES
	this.PIN_INFO = ctypes.StructType('_PinInfo', [
		{ pFilter: this.IBaseFilter.ptr },
		{ dir: this.PIN_DIRECTION },
		{ achName: this.WCHAR.array(struct_const.MAX_PIN_NAME) }
	]);

	// VTABLE'S - WITH STRUCTS THAT USE VTABLES
	// IPin needs to be here, but then this would push the "advanced" ones over IPin to "advanced" groups below here
}

var winInit = function() {
	var self = this;

	this.IS64BIT = is64bit;

	this.TYPE = new winTypes();

	// CONSTANTS
	this.CONST = {
		BI_BITFIELDS: 3,
		BI_RGB: 0,
		BITSPIXEL: 12,
		CCHDEVICENAME: 32,
		DIB_RGB_COLORS: 0,
		DISPLAY_DEVICE_ATTACHED_TO_DESKTOP: 1, // same as DISPLAY_DEVICE_ACTIVE
		DISPLAY_DEVICE_PRIMARY_DEVICE: 4,
		DISPLAY_DEVICE_MIRRORING_DRIVER: 8,
		DM_BITSPERPEL: 0x00040000,
		DM_DISPLAYFREQUENCY: 0x00400000,
		DM_PELSHEIGHT: 0x00100000,
		DM_PELSWIDTH: 0x00080000,
		ENUM_CURRENT_SETTINGS: self.TYPE.DWORD.size == 4 ? /*use 8 letters for size 4*/ self.TYPE.DWORD('0xFFFFFFFF') : /*size is 8 so use 16 letters*/ self.TYPE.DWORD('0xFFFFFFFFFFFFFFFF'),
		ENUM_REGISTRY_SETTINGS: self.TYPE.DWORD.size == 4 ? self.TYPE.DWORD('0xFFFFFFFE') : self.TYPE.DWORD('0xFFFFFFFFFFFFFFFE'),
		HORZRES: 8,
		HWND_MESSAGE: -3,
		LOGPIXELSX: 88,
		LOGPIXELSY: 90,
		MONITOR_DEFAULTTONEAREST: 2,
		PM_NOREMOVE: 0,
		PM_REMOVE: 1,
		S_OK: 0,
		S_FALSE: 1,
		SRCCOPY: self.TYPE.DWORD('0x00CC0020'),
		VERTRES: 10,
		HWND_TOPMOST: self.TYPE.HWND(-1), // toString: "ctypes.voidptr_t(ctypes.UInt64("0xffffffff"))" cannot do self.TYPE.HWND('-1') as that puts out `TypeError: can't convert the string "-1" to the type ctypes.voidptr_t`
		HWND_NOTOPMOST: self.TYPE.HWND(-2),
		SWP_NOSIZE: 1,
		SWP_NOMOVE: 2,
		SWP_NOREDRAW: 8,
		MDT_Effective_DPI: 0,
		MDT_Angular_DPI: 1,
		MDT_Raw_DPI: 2,
		MDT_Default: 0, // MDT_Effective_DPI
		WS_VISIBLE: 0x10000000,
		GWL_STYLE: -16,
		GWL_EXSTYLE: -20,
		WS_EX_TOPMOST: 0x00000008,
		FO_DELETE: 3,
		FOF_ALLOWUNDO: 64,
		FOF_SILENT: 4,
		FOF_NOCONFIRMATION: 16,
		FOF_NOERRORUI: 1024,
		// FOF_NOCONFIRMMKDIR: ,
		// FOF_WANTNUKEWARNING:

		// enum KeyFlags
		MOD_NONE: 0x0000,
		MOD_ALT: 0x1,
		MOD_CONTROL: 0x2,
		MOD_SHIFT: 0x4,
		MOD_WIN: 0x8,
		MOD_NOREPEAT: 0x4000,

		PM_REMOVE: 1,
		WM_HOTKEY: 0x0312,

		WM_KEYDOWN: 0x0100,
		WM_KEYUP: 0x0101,
		WM_SYSKEYDOWN: 0x0104,
		WM_SYSKEYUP: 0x0105,

		WM_MOUSEMOVE: 0x200,
		WM_LBUTTONDOWN: 0x201,
		WM_LBUTTONUP: 0x202,
		WM_LBUTTONDBLCLK: 0x203,
		WM_RBUTTONDOWN: 0x204,
		WM_RBUTTONUP: 0x205,
		WM_RBUTTONDBLCLK: 0x206,
		WM_MBUTTONDOWN: 0x207,
		WM_MBUTTONUP: 0x208,
		WM_MBUTTONDBLCLK: 0x209,
		WM_MOUSEWHEEL: 0x20A,
		WM_XBUTTONDOWN: 0x20B,
		WM_XBUTTONUP: 0x20C,
		WM_XBUTTONDBLCLK: 0x20D,
		WM_MOUSEHWHEEL: 0x20E,
		WM_NCXBUTTONDOWN: 0x00AB,
		WM_NCXBUTTONUP: 0x00AC,
		WM_NCXBUTTONDBLCLK: 0x00AD,
		WH_KEYBOARD_LL: 13,
		WH_MOUSE_LL: 14,
		RIDEV_INPUTSINK: 0x00000100,
		RID_INPUT: 0x10000003,
		WM_CREATE: 0x0001,
		WM_INPUT: 0x00FF,
		RI_MOUSE_LEFT_BUTTON_DOWN: 0x0001,
		RI_MOUSE_LEFT_BUTTON_UP: 0x0002,
		RI_MOUSE_MIDDLE_BUTTON_DOWN: 0x0010,
		RI_MOUSE_MIDDLE_BUTTON_UP: 0x0020,
		RI_MOUSE_RIGHT_BUTTON_DOWN: 0x0004,
		RI_MOUSE_RIGHT_BUTTON_UP: 0x0008,
		RI_MOUSE_BUTTON_1_DOWN: 0x0001,
		RI_MOUSE_BUTTON_1_UP: 0x0002,
		RI_MOUSE_BUTTON_2_DOWN: 0x0004,
		RI_MOUSE_BUTTON_2_UP: 0x0008,
		RI_MOUSE_BUTTON_3_DOWN: 0x0010,
		RI_MOUSE_BUTTON_3_UP: 0x0020,
		RI_MOUSE_BUTTON_4_DOWN: 0x0040,
		RI_MOUSE_BUTTON_4_UP: 0x0080,
		RI_MOUSE_BUTTON_5_DOWN: 0x100,
		RI_MOUSE_BUTTON_5_UP: 0x0200,
		RI_MOUSE_WHEEL: 0x0400,
		RI_MOUSE_HORIZONTAL_WHEEL: 0x0800,
		XBUTTON1: 0x0001,
		XBUTTON2: 0x0002,

		COINIT_MULTITHREADED: 0x0,
		COINIT_APARTMENTTHREADED: 0x2,

		CLSCTX_INPROC_SERVER: 0x1,
		CLSCTX_INPROC_HANDLER: 0x2,
		CLSCTX_LOCAL_SERVER: 0x4,
		CLSCTX_REMOTE_SERVER: 0x10,

		VARIANT_FALSE: 0, // http://blogs.msdn.com/b/oldnewthing/archive/2004/12/22/329884.aspx
		VARIANT_TRUE: -1, // http://blogs.msdn.com/b/oldnewthing/archive/2004/12/22/329884.aspx
		VT_EMPTY: 0,
		VT_BSTR: 8,
		VT_LPWSTR: 0x001F, // 31
		VT_BYREF: 0x4000,

		SW_SHOWNORMAL: 1,

		STATUS_SUCCESS: 0x00000000,
		STATUS_BUFFER_TOO_SMALL: 0xC0000023 >> 0, // link847456312312132 - need the >> 0
		STATUS_INFO_LENGTH_MISMATCH: 0xC0000004 >> 0, // link847456312312132 - need the >> 0 otherwise cutils.jscGetDeepest of return of NtQuerySystemInformation is -1073741820 and jscGetDeepest of CONST.STATUS_INFO_LENGTH_MISMATCH is 3221225476

		SystemProcessInformation: 5, // https://github.com/wine-mirror/wine/blob/80ea5a01ef42b0e9e0b6c872f8f5bbbf393c0ae7/include/winternl.h#L771-L847
		SystemHandleInformation: 16,
		SystemExtendedHandleInformation: 64, // http://processhacker.sourceforge.net/doc/ntexapi_8h.html#ad5d815b48e8f4da1ef2eb7a2f18a54e0a6b30a1ad494061a4d95fd1d0b2c2e9b5 - as the wine repo shows it as unknown. process hacker has them listed out in order of enum which is just from ntextapi.h - http://processhacker.sourceforge.net/doc/ntexapi_8h_source.html --- and note that SystemBasicInformation is 0 so 64 lines below that is this, cool stuff

		SW_RESTORE: 9,

		SLGP_RAWPATH: 0x4,

		FileNameInformation: 9, // https://msdn.microsoft.com/en-us/library/windows/hardware/ff728840%28v=vs.85%29.aspx

		PROCESS_DUP_HANDLE: 0x0040,
		PROCESS_QUERY_INFORMATION: 0x0400,
		MAXIMUM_ALLOWED: 0x02000000,
		DUPLICATE_SAME_ACCESS: 0x00000002,

		ObjectNameInformation: 1,

		// wrap it in self.TYPE.HKEY before use
		HKEY_CLASSES_ROOT: 0x80000000,
		HKEY_CURRENT_USER: 0x80000001, // https://github.com/wine-mirror/wine/blob/9bd963065b1fb7b445d010897d5f84967eadf75b/include/winreg.h#L29
		HKEY_LOCAL_MACHINE: 0x80000002, // https://github.com/wine-mirror/wine/blob/9bd963065b1fb7b445d010897d5f84967eadf75b/include/winreg.h#L30
		HKEY_USERS: 0x80000003,
		HKEY_PERFORMANCE_DATA: 0x80000004,
		HKEY_CURRENT_CONFIG: 0x80000005,
		HKEY_DYN_DATA: 0x80000006,
		KEY_QUERY_VALUE: 0x00000001,

		ERROR_SUCCESS: 0x00000000,
		ERROR_FILE_NOT_FOUND: 0x00000002,

		RT_ICON: '3', // https://github.com/wine-mirror/wine/blob/c266d373deb417abef4883f59daa5d517b77e76c/include/winuser.h#L761
		RT_GROUP_ICON: '14', // https://github.com/wine-mirror/wine/blob/c266d373deb417abef4883f59daa5d517b77e76c/include/winuser.h#L771

		LANG_ENGLISH: 0x0C09,
		SUBLANG_DEFAULT: 0x01,

		CP_ACP: 0,

		GCLP_HICON: -14,
		GCLP_HICONSM: -34,

		IMAGE_ICON: 1,
		LR_DEFAULTSIZE: 0x00000040,
		LR_LOADFROMFILE: 16,

		QS_ALLEVENTS: 0x04BF,
		QS_ALLINPUT: 0x04FF,
		WAIT_ABANDONED_0: 0x00000080, // 128
		WAIT_FAILED: 0xFFFFFFFF,
		WAIT_IO_COMPLETION: 0x000000C0, // 192
		WAIT_OBJECT_0: 0,
		WAIT_TIMEOUT: 0x00000102, // 258

		GENERIC_READ: 0x80000000,
		GENERIC_WRITE: 0x40000000,
		CREATE_NEW: 1,
		CREATE_ALWAYS: 2,
		OPEN_EXISTING: 3,
		OPEN_ALWAYS: 4,
		TRUNCATE_EXISTING: 5,
		FILE_ATTRIBUTE_NORMAL: 0x80, //128
		FILE_FLAG_OVERLAPPED: 0x40000000,
		FILE_SHARE_READ: 0x00000001,
		FILE_SHARE_WRITE: 0x00000002,
		FILE_SHARE_DELETE: 0x00000004,
		INVALID_HANDLE_VALUE: -1,
		FSCTL_SET_SPARSE: 0x900c4,
		FSCTL_SET_ZERO_DATA: 0x980c8,
		FILE_BEGIN: 0,

		WT_EXECUTEDEFAULT: 0x00000000,

		ERROR_BROKEN_PIPE: 0x6D,
		ERROR_OPERATION_ABORTED: 0x3E3,

		WM_TIMER: 0x0113,
		WM_APP: 0x8000,

		INPUT_MOUSE: 0,
		MOUSEEVENTF_ABSOLUTE: 0x8000,
		MOUSEEVENTF_LEFTDOWN: 0x0002,
		MOUSEEVENTF_LEFTUP: 0x0004,
		MOUSEEVENTF_MIDDLEDOWN: 0x0020,
		MOUSEEVENTF_MIDDLEUP: 0x0040,
		MOUSEEVENTF_MOVE: 0x0001,
		MOUSEEVENTF_RIGHTDOWN: 0x0008,
		MOUSEEVENTF_RIGHTUP: 0x0010,
		MOUSEEVENTF_WHEEL: 0x0800,
		MOUSEEVENTF_XDOWN: 0x0080,
		MOUSEEVENTF_XUP: 0x0100,
		MOUSEEVENTF_WHEEL: 0x0800,
		MOUSEEVENTF_HWHEEL: 0x01000,

		SYMBOLIC_LINK_FLAG_FILE: 0x0,
		SYMBOLIC_LINK_FLAG_DIRECTORY: 0x1,

		DEFAULT_CHARSET: 1,

		SW_HIDE: 0,
		SW_SHOW: 5,

		GW_HWNDFIRST: 0,
		GW_HWNDLAST: 1,
		GW_HWNDNEXT: 2,
		GW_HWNDPREV: 3,
		GW_OWNER: 4,
		GW_CHILD: 5,
		GW_ENABLEDPOPUP: 6,

		GA_PARENT: 1,
		GA_ROOT: 2,
		GA_ROOTOWNER: 3,

		MMSYSERR_NOERROR: 0,

		PINDIR_INPUT: 0,
		PINDIR_OUTPUT: 1,
		MAX_PIN_NAME: 128,

		// enum _AUDCLNT_BUFFERFLAGS
		AUDCLNT_BUFFERFLAGS_DATA_DISCONTINUITY: 0x1,
		AUDCLNT_BUFFERFLAGS_SILENT: 0x2,
		AUDCLNT_BUFFERFLAGS_TIMESTAMP_ERROR: 0x4,

		// AUDCLNT_STREAMFLAGS_XXX
		AUDCLNT_STREAMFLAGS_CROSSPROCESS: 0x00010000,
		AUDCLNT_STREAMFLAGS_LOOPBACK: 0x00020000,
		AUDCLNT_STREAMFLAGS_EVENTCALLBACK: 0x00040000,
		AUDCLNT_STREAMFLAGS_NOPERSIST: 0x00080000,
		AUDCLNT_STREAMFLAGS_RATEADJUST: 0x00100000,
		AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM: 0x80000000,
		AUDCLT_STREAMFLAGS_SRC_DEFAULT_QUALITY: 0x08000000,

		// enum _AUDCLNT_SHAREMODE
		AUDCLNT_SHAREMODE_SHARED: 0,
		AUDCLNT_SHAREMODE_EXCLUSIVE: 1,

		WAVE_FORMAT_IEEE_FLOAT: 0x0003,
		WAVE_FORMAT_EXTENSIBLE: 65534,

		// enum ERole
		eConsole: 0,
		eMultimedia: 1,
		eCommunications: 2,
		ERole_enum_count: 3,

		// enum EDataFlow
		eRender: 0,
		eCapture: 1,
		eAll: 2,
		EDataFlow_enum_count: 3,

		//
		PIPE_ACCESS_DUPLEX: 0x00000003,
		PIPE_ACCESS_INBOUND: 0x00000001,
		PIPE_ACCESS_OUTBOUND: 0x00000002,
		FILE_FLAG_FIRST_PIPE_INSTANCE: 0x00080000,
		FILE_FLAG_WRITE_THROUGH: 0x80000000,
		FILE_FLAG_OVERLAPPED: 0x40000000,
		PIPE_TYPE_BYTE: 0x00000000,
		PIPE_TYPE_MESSAGE: 0x00000004,
		PIPE_READMODE_BYTE: 0x00000000,
		PIPE_READMODE_MESSAGE: 0x00000002,
		PIPE_WAIT: 0x00000000,
		PIPE_NOWAIT: 0x00000001,

		INFINITE: 0xFFFFFFFF,

		FILE_NOTIFY_CHANGE_FILE_NAME: 0x00000001,
		FILE_NOTIFY_CHANGE_DIR_NAME: 0x00000002,
		FILE_NOTIFY_CHANGE_ATTRIBUTES: 0x00000004,
		FILE_NOTIFY_CHANGE_SIZE: 0x00000008,
		FILE_NOTIFY_CHANGE_LAST_WRITE: 0x00000010,
		FILE_NOTIFY_CHANGE_LAST_ACCESS: 0x00000020,
		FILE_NOTIFY_CHANGE_CREATION: 0x00000040,
		FILE_NOTIFY_CHANGE_SECURITY: 0x00000100,

		FILE_ACTION_ADDED: 0x00000001,
		FILE_ACTION_REMOVED: 0x00000002,
		FILE_ACTION_MODIFIED: 0x00000003,
		FILE_ACTION_RENAMED_OLD_NAME: 0x00000004,
		FILE_ACTION_RENAMED_NEW_NAME: 0x00000005,

		FILE_FLAG_BACKUP_SEMANTICS: 0x02000000, // 33554432
		FILE_LIST_DIRECTORY: 0x0001,

		// these are VK constants, the ones that start with lower case "vk_" are not really named that, i just named it like that per - https://msdn.microsoft.com/en-us/library/windows/desktop/dd375731%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
		VK_LBUTTON: 0x01,
		VK_RBUTTON: 0x02,
		VK_CANCEL: 0x03,
		VK_MBUTTON: 0x04,
		VK_XBUTTON1: 0x05,
		VK_XBUTTON2: 0x06,
		VK_BACK: 0x08,
		VK_TAB: 0x09,
		VK_CLEAR: 0x0C,
		VK_RETURN: 0x0D,
		VK_SHIFT: 0x10,
		VK_CONTROL: 0x11,
		VK_MENU: 0x12,
		VK_PAUSE: 0x13,
		VK_CAPITAL: 0x14,
		VK_KANA: 0x15,
		VK_HANGUEL: 0x15,
		VK_HANGUL: 0x15,
		VK_JUNJA: 0x17,
		VK_FINAL: 0x18,
		VK_HANJA: 0x19,
		VK_KANJI: 0x19,
		VK_ESCAPE: 0x1B,
		VK_CONVERT: 0x1C,
		VK_NONCONVERT: 0x1D,
		VK_ACCEPT: 0x1E,
		VK_MODECHANGE: 0x1F,
		VK_SPACE: 0x20,
		VK_PRIOR: 0x21,
		VK_NEXT: 0x22,
		VK_END: 0x23,
		VK_HOME: 0x24,
		VK_LEFT: 0x25,
		VK_UP: 0x26,
		VK_RIGHT: 0x27,
		VK_DOWN: 0x28,
		VK_SELECT: 0x29,
		VK_PRINT: 0x2A,
		VK_EXECUTE: 0x2B,
		VK_SNAPSHOT: 0x2C,
		VK_INSERT: 0x2D,
		VK_DELETE: 0x2E,
		VK_HELP: 0x2F,
		vk_0: 0x30,
		vk_1: 0x31,
		vk_2: 0x32,
		vk_3: 0x33,
		vk_4: 0x34,
		vk_5: 0x35,
		vk_6: 0x36,
		vk_7: 0x37,
		vk_8: 0x38,
		vk_9: 0x39,
		vk_A: 0x41,
		vk_B: 0x42,
		vk_C: 0x43,
		vk_D: 0x44,
		vk_E: 0x45,
		vk_F: 0x46,
		vk_G: 0x47,
		vk_H: 0x48,
		vk_I: 0x49,
		vk_J: 0x4A,
		vk_K: 0x4B,
		vk_L: 0x4C,
		vk_M: 0x4D,
		vk_N: 0x4E,
		vk_O: 0x4F,
		vk_P: 0x50,
		vk_Q: 0x51,
		vk_R: 0x52,
		vk_S: 0x53,
		vk_T: 0x54,
		vk_U: 0x55,
		vk_V: 0x56,
		vk_W: 0x57,
		vk_X: 0x58,
		vk_Y: 0x59,
		vk_Z: 0x5A,
		VK_LWIN: 0x5B,
		VK_RWIN: 0x5C,
		VK_APPS: 0x5D,
		VK_SLEEP: 0x5F,
		VK_NUMPAD0: 0x60,
		VK_NUMPAD1: 0x61,
		VK_NUMPAD2: 0x62,
		VK_NUMPAD3: 0x63,
		VK_NUMPAD4: 0x64,
		VK_NUMPAD5: 0x65,
		VK_NUMPAD6: 0x66,
		VK_NUMPAD7: 0x67,
		VK_NUMPAD8: 0x68,
		VK_NUMPAD9: 0x69,
		VK_MULTIPLY: 0x6A,
		VK_ADD: 0x6B,
		VK_SEPARATOR: 0x6C,
		VK_SUBTRACT: 0x6D,
		VK_DECIMAL: 0x6E,
		VK_DIVIDE: 0x6F,
		VK_F1: 0x70,
		VK_F2: 0x71,
		VK_F3: 0x72,
		VK_F4: 0x73,
		VK_F5: 0x74,
		VK_F6: 0x75,
		VK_F7: 0x76,
		VK_F8: 0x77,
		VK_F9: 0x78,
		VK_F10: 0x79,
		VK_F11: 0x7A,
		VK_F12: 0x7B,
		VK_F13: 0x7C,
		VK_F14: 0x7D,
		VK_F15: 0x7E,
		VK_F16: 0x7F,
		VK_F17: 0x80,
		VK_F18: 0x81,
		VK_F19: 0x82,
		VK_F20: 0x83,
		VK_F21: 0x84,
		VK_F22: 0x85,
		VK_F23: 0x86,
		VK_F24: 0x87,
		VK_NUMLOCK: 0x90,
		VK_SCROLL: 0x91,
		VK_LSHIFT: 0xA0,
		VK_RSHIFT: 0xA1,
		VK_LCONTROL: 0xA2,
		VK_RCONTROL: 0xA3,
		VK_LMENU: 0xA4,
		VK_RMENU: 0xA5,
		VK_BROWSER_BACK: 0xA6,
		VK_BROWSER_FORWARD: 0xA7,
		VK_BROWSER_REFRESH: 0xA8,
		VK_BROWSER_STOP: 0xA9,
		VK_BROWSER_SEARCH: 0xAA,
		VK_BROWSER_FAVORITES: 0xAB,
		VK_BROWSER_HOME: 0xAC,
		VK_VOLUME_MUTE: 0xAD,
		VK_VOLUME_DOWN: 0xAE,
		VK_VOLUME_UP: 0xAF,
		VK_MEDIA_NEXT_TRACK: 0xB0,
		VK_MEDIA_PREV_TRACK: 0xB1,
		VK_MEDIA_STOP: 0xB2,
		VK_MEDIA_PLAY_PAUSE: 0xB3,
		VK_LAUNCH_MAIL: 0xB4,
		VK_LAUNCH_MEDIA_SELECT: 0xB5,
		VK_LAUNCH_APP1: 0xB6,
		VK_LAUNCH_APP2: 0xB7,
		VK_OEM_1: 0xBA,
		VK_OEM_PLUS: 0xBB,
		VK_OEM_COMMA: 0xBC,
		VK_OEM_MINUS: 0xBD,
		VK_OEM_PERIOD: 0xBE,
		VK_OEM_2: 0xBF,
		VK_OEM_3: 0xC0,
		VK_OEM_4: 0xDB,
		VK_OEM_5: 0xDC,
		VK_OEM_6: 0xDD,
		VK_OEM_7: 0xDE,
		VK_OEM_8: 0xDF,
		VK_OEM_102: 0xE2,
		VK_PROCESSKEY: 0xE5,
		VK_PACKET: 0xE7,
		VK_ATTN: 0xF6,
		VK_CRSEL: 0xF7,
		VK_EXSEL: 0xF8,
		VK_EREOF: 0xF9,
		VK_PLAY: 0xFA,
		VK_ZOOM: 0xFB,
		VK_NONAME: 0xFC,
		VK_PA1: 0xFD,
		VK_OEM_CLEAR: 0xFE,

		SPI_SETFOREGROUNDLOCKTIMEOUT: 0x2001,
		SPIF_UPDATEINIFILE: 1,
		SPIF_SENDWININICHANGE: 2
	};

	var _lib = {}; // cache for lib
	var lib = function(path) {
		//ensures path is in lib, if its in lib then its open, if its not then it adds it to lib and opens it. returns lib
		//path is path to open library
		//returns lib so can use straight away

		if (!(path in _lib)) {
			//need to open the library
			//default it opens the path, but some things are special like libc in mac is different then linux or like x11 needs to be located based on linux version
			switch (path) {
				/* for libc which is unix
				case 'libc':

					if (core.os.name == 'darwin') {
						_lib[path] = ctypes.open('libc.dylib');
					} else if (core.os.name == 'freebsd') {
						_lib[path] = ctypes.open('libc.so.7');
					} else if (core.os.name == 'openbsd') {
						_lib[path] = ctypes.open('libc.so.61.0');
					} else if (core.os.name == 'sunos') {
						_lib[path] = ctypes.open('libc.so');
					} else {
						throw new Error({
							name: 'watcher-api-error',
							message: 'Path to libc on operating system of , "' + OS.Constants.Sys.Name + '" is not supported for kqueue'
						});
					}

					break;
				*/
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
		_swab: function() {
			return lib('msvcrt').declare('_swab', self.TYPE.ABI,
				self.TYPE.void,
				self.TYPE.char.ptr,
				self.TYPE.char.ptr,
				self.TYPE.int
			);
		},
		AttachThreadInput: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms681956%28v=vs.85%29.aspx
			 * BOOL WINAPI AttachThreadInput(
			 *   __in_ DWORD idAttach,
			 *   __in_ DWORD idAttachTo,
			 *   __in_ BOOL  fAttach
			 * );
			 */
			return lib('user32').declare('AttachThreadInput', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.DWORD,	// idAttach
				self.TYPE.DWORD,	// idAttachTo
				self.TYPE.BOOL		// fAttach
			);
		},
		BeginUpdateResource: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648030%28v=vs.85%29.aspx
			 * HANDLE WINAPI BeginUpdateResource(
			 *   __in_ LPCTSTR pFileName,
			 *   __in_ BOOL    bDeleteExistingResources
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'BeginUpdateResourceW' : 'BeginUpdateResourceA', self.TYPE.ABI,
				self.TYPE.HANDLE,		// return
				self.TYPE.LPCTSTR,		// pFileName
				self.TYPE.BOOL			// bDeleteExistingResources
			);
		},
		BitBlt: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd183370%28v=vs.85%29.aspx
			 * BOOL BitBlt(
			 *   __in_  HDC hdcDest,
			 *   __in_  int nXDest,
			 *   __in_  int nYDest,
			 *   __in_  int nWidth,
			 *   __in_  int nHeight,
			 *   __in_  HDC hdcSrc,
			 *   __in_  int nXSrc,
			 *   __in_  int nYSrc,
			 *   __in_  DWORD dwRop
			 * );
			 */
			return lib('gdi32').declare('BitBlt', self.TYPE.ABI,
				self.TYPE.BOOL, //return
				self.TYPE.HDC, // hdcDest
				self.TYPE.INT, // nXDest
				self.TYPE.INT, // nYDest
				self.TYPE.INT, // nWidth
				self.TYPE.INT, // nHeight
				self.TYPE.HDC, // hdcSrc
				self.TYPE.INT, // nXSrc
				self.TYPE.INT, // nYSrc
				self.TYPE.DWORD // dwRop
			);
		},
		CallNextHookEx: function() {
			/* LRESULT WINAPI CallNextHookEx(
			 *   __in_opt_ HHOOK  hhk,
			 *   __in_     int    nCode,
			 *   __in_     WPARAM wParam,
			 *   __in_     LPARAM lParam
			 * );
			 */
			return lib('user32').declare('CallNextHookEx', self.TYPE.ABI,
				self.TYPE.LRESULT,
				self.TYPE.HHOOK,
				self.TYPE.INT,
				self.TYPE.WPARAM,
				self.TYPE.LPARAM
			);
		},
		CancelIo: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa363791%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
			 * BOOL WINAPI CancelIo(
			 *	_In_ HANDLE hFile
			 * );
			 */
			return lib('kernel32').declare('CancelIo', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HANDLE	// hFile
			);
		},
		CancelIoEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa363792%28v=vs.85%29.aspx
			 * BOOL WINAPI CancelIoEx(
			 *   _in_     HANDLE       hFile,
			 *   _in_opt_ LPOVERLAPPED lpOverlapped
			 * );
			 */
			return lib('kernel32').declare('CancelIoEx', self.TYPE.ABI,
				self.TYPE.BOOL,			// return
				self.TYPE.HANDLE,		// hFile
				self.TYPE.LPOVERLAPPED	// lpOverlapped
			);
		},
		CloseClipboard: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms649035(v=vs.85).aspx
			 * BOOL WINAPI CloseClipboard(
			 *   void
			 * );
			 */
			return lib('user32').declare('CloseClipboard', self.TYPE.ABI,
				self.TYPE.BOOL		// return
			);
		},
		CloseHandle: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms724211%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
			 * BOOL WINAPI CloseHandle(
			 *   __in_ HANDLE hObject
			 * );
			 */
			return lib('kernel32').declare('CloseHandle', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HANDLE	// hObject
			);
		},
		CoCreateInstance: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms686615%28v=vs.85%29.aspx
			 * HRESULT CoCreateInstance(
			 *   __in_   REFCLSID rclsid,
			 *   __in_   LPUNKNOWN pUnkOuter,
			 *   __in_   DWORD dwClsContext,
			 *   __in_   REFIID riid,
			 *   __out_  LPVOID *ppv
			 * );
			 */
			return lib('ole32').declare('CoCreateInstance', self.TYPE.ABI,
				self.TYPE.HRESULT,		// return
				self.TYPE.REFCLSID,		// rclsid
				self.TYPE.LPUNKNOWN,	// pUnkOuter
				self.TYPE.DWORD,		// dwClsContext
				self.TYPE.REFIID,		// riid
				self.TYPE.LPVOID		// *ppv
			);
		},
		CoInitializeEx: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms695279%28v=vs.85%29.aspx
			 * HRESULT CoInitializeEx(
			 *   __in_opt_  LPVOID pvReserved,
			 *   __in_      DWORD dwCoInit
			 * );
			 */
			return lib('ole32').declare('CoInitializeEx', self.TYPE.ABI,
				self.TYPE.HRESULT,	// result
				self.TYPE.LPVOID,	// pvReserved
				self.TYPE.DWORD		// dwCoInit
			);
		},
		CoTaskMemFree: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms680722(v=vs.85).aspx
			 * void CoTaskMemFree(
			 *   _In_opt_ LPVOID pv
			 * );
			 */
			return lib('ole32').declare('CoTaskMemFree', self.TYPE.ABI,
				self.TYPE.void,		// return
				self.TYPE.LPVOID	// pv
			);
		},
		CountClipboardFormats: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms649036(v=vs.85).aspx
			 * int WINAPI CountClipboardFormats(
			 *   void
			 * );
			 */
			return lib('user32').declare('CountClipboardFormats', self.TYPE.ABI,
				self.TYPE.int
			);
		},
		CoUninitialize: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms688715%28v=vs.85%29.aspx
			 * void CoUninitialize(void);
			 */
			return lib('ole32').declare('CoUninitialize', self.TYPE.ABI,
				self.TYPE.VOID	// return
			);
		},
		CreateCompatibleBitmap: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd183488%28v=vs.85%29.aspx
			 * HBITMAP CreateCompatibleBitmap(
			 *   __in_  HDC hdc,
			 *   __in_  int nWidth,
			 *   __in_  int nHeight
			 * );
			 */
			return lib('gdi32').declare('CreateCompatibleBitmap', self.TYPE.ABI,
				self.TYPE.HBITMAP, //return
				self.TYPE.HDC, // hdc
				self.TYPE.INT, // nWidth
				self.TYPE.INT // nHeight
			);
		},
		CreateCompatibleDC: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd183489%28v=vs.85%29.aspx
			 * HDC CreateCompatibleDC(
			 *   __in_  HDC hdc
			 * );
			 */
			return lib('gdi32').declare('CreateCompatibleDC', self.TYPE.ABI,
				self.TYPE.HDC, //return
				self.TYPE.HDC // hdc
			);
		},
		CreateDC: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd183490%28v=vs.85%29.aspx
			 * HDC CreateDC(
			 *  __in_  LPCTSTR lpszDriver,
			 *  __in_  LPCTSTR lpszDevice,
			 *  __in_  LPCTSTR lpszOutput,
			 *  __in_  const DEVMODE *lpInitData
			 * );
			 */
			return lib('gdi32').declare(ifdef_UNICODE ? 'CreateDCW' : 'CreateDCA', self.TYPE.ABI,
				self.TYPE.HDC, //return
				self.TYPE.LPCTSTR,		// lpszDriver
				self.TYPE.LPCTSTR, 		// lpszDevice
				self.TYPE.LPCTSTR, 		// lpszOutput
				self.TYPE.DEVMODE.ptr	// *lpInitData
			);
		},
		CreateDIBSection: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd183494%28v=vs.85%29.aspx
			 * HBITMAP CreateDIBSection(
			 *   __in_   HDC        hdc,
			 *   __in_   const BITMAPINFO *pbmi,
			 *   __in_   UINT       iUsage,
			 *   __out_  VOID       **ppvBits,
			 *   __in_   HANDLE     hSection,
			 *   __in_   DWORD      dwOffset
			 * );
			 */
			return lib('gdi32').declare('CreateDIBSection', self.TYPE.ABI,
				self.TYPE.HBITMAP,			//return
				self.TYPE.HDC,				// hdc
				self.TYPE.BITMAPINFO.ptr,	// *pbmi
				self.TYPE.UINT,				// iUsage
				self.TYPE.BYTE.ptr.ptr,		// **ppvBits
				self.TYPE.HANDLE,			// hSection
				self.TYPE.DWORD				// dwOffset
			);
		},
		CreateEvent: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms682396(v=vs.85).aspx
			 * HANDLE WINAPI CreateEvent(
			 *   __in_opt_ LPSECURITY_ATTRIBUTES lpEventAttributes,
			 *   __in_     BOOL                  bManualReset,
			 *   __in_     BOOL                  bInitialState,
			 *   __in_opt_ LPCTSTR               lpName
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'CreateEventW' : 'CreateEventA', self.TYPE.ABI,
				self.TYPE.HANDLE,					// return
				self.TYPE.LPSECURITY_ATTRIBUTES,	// lpEventAttributes
				self.TYPE.BOOL,						// bManualReset
				self.TYPE.BOOL,						// bInitialState
				self.TYPE.LPCTSTR					// lpName
			);
		},
		CreateFile: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa363858%28v=vs.85%29.aspx
			 * HANDLE WINAPI CreateFile(
			 *   __in_     LPCTSTR               lpFileName,
			 *   __in_     DWORD                 dwDesiredAccess,
			 *   __in_     DWORD                 dwShareMode,
			 *   __in_opt_ LPSECURITY_ATTRIBUTES lpSecurityAttributes,
			 *   __in_     DWORD                 dwCreationDisposition,
			 *   __in_     DWORD                 dwFlagsAndAttributes,
			 *   __in_opt_ HANDLE                hTemplateFile
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'CreateFileW' : 'CreateFileA', self.TYPE.ABI,
				self.TYPE.HANDLE,					// return
				self.TYPE.LPCTSTR,					// lpFileName
				self.TYPE.DWORD,					// dwDesiredAccess
				self.TYPE.DWORD,					// dwShareMode
				self.TYPE.LPSECURITY_ATTRIBUTES,	// lpSecurityAttributes
				self.TYPE.DWORD,					// dwCreationDisposition
				self.TYPE.DWORD,					// dwFlagsAndAttributes
				self.TYPE.HANDLE					// hTemplateFile
			);
		},
		CreateNamedPipe: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa365150(v=vs.85).aspx
			 * HANDLE WINAPI CreateNamedPipe(
			 *   __in_     LPCTSTR               lpName,
			 *   __in_     DWORD                 dwOpenMode,
			 *   __in_     DWORD                 dwPipeMode,
			 *   __in_     DWORD                 nMaxInstances,
			 *   __in_     DWORD                 nOutBufferSize,
			 *   __in_     DWORD                 nInBufferSize,
			 *   __in_     DWORD                 nDefaultTimeOut,
			 *   __in_opt_ LPSECURITY_ATTRIBUTES lpSecurityAttributes
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'CreateNamedPipeW' : 'CreateNamedPipeA', self.TYPE.ABI,
				self.TYPE.HANDLE,					// return
				self.TYPE.LPCTSTR,					// lpName
				self.TYPE.DWORD,					// dwOpenMode
				self.TYPE.DWORD,					// dwPipeMode
				self.TYPE.DWORD,					// nMaxInstances
				self.TYPE.DWORD,					// nOutBufferSize
				self.TYPE.DWORD,					// nInBufferSize
				self.TYPE.DWORD,					// nDefaultTimeOut
				self.TYPE.LPSECURITY_ATTRIBUTES		// lpSecurityAttributes
			);
		},
		CreateHardLink: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa363860%28v=vs.85%29.aspx
			 * BOOL WINAPI CreateHardLink(
			 *   __in_        LPCTSTR lpFileName,
			 *   __in_        LPCTSTR lpExistingFileName,
			 *   __reserved_  LPSECURITY_ATTRIBUTES lpSecurityAttributes
			 * );
			 */
			return lib('kernel32').declare('CreateHardLinkW', self.TYPE.ABI,
				self.TYPE.BOOL,					// return
				self.TYPE.LPCTSTR,				// lpFileName
				self.TYPE.LPCTSTR,				// lpExistingFileName
				self.TYPE.LPSECURITY_ATTRIBUTES	// lpSecurityAttributes
			);
		},
		CreateSymbolicLink: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa363866%28v=vs.85%29.aspx
			 * BOOLEAN WINAPI CreateSymbolicLink(
			 *   __in_ LPTSTR lpSymlinkFileName,
			 *   __in_ LPTSTR lpTargetFileName,
			 *   __in_ DWORD  dwFlags
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'CreateSymbolicLinkW' : 'CreateSymbolicLinkA', self.TYPE.ABI,
				self.TYPE.BOOLEAN,	// return
				self.TYPE.LPTSTR,	// lpSymlinkFileName
				self.TYPE.LPTSTR,	// lpTargetFileName
				self.TYPE.DWORD		// dwFlags
			);
		},
		CreateTimerQueueTimer: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms682485(v=vs.85).aspx
				 BOOL WINAPI CreateTimerQueueTimer(
				  _Out_    PHANDLE             phNewTimer,
				  _In_opt_ HANDLE              TimerQueue,
				  _In_     WAITORTIMERCALLBACK Callback,
				  _In_opt_ PVOID               Parameter,
				  _In_     DWORD               DueTime,
				  _In_     DWORD               Period,
				  _In_     ULONG               Flags
				);
			*/
			return lib('kernel32').declare("CreateTimerQueueTimer", self.TYPE.ABI,
				self.TYPE.BOOL,												// return
				self.TYPE.PHANDLE,											// phNewTimer
				self.TYPE.HANDLE,											// TimerQueue
				self.TYPE.WAITORTIMERCALLBACK.ptr,							// Callback,
				self.TYPE.PVOID,											// Parameter,
				self.TYPE.DWORD,											// DueTime,
				self.TYPE.DWORD,											// Period,
				self.TYPE.ULONG												// Flags
			);
		},
		CreateWindowEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms632680%28v=vs.85%29.aspx
			 * HWND WINAPI CreateWindowEx(
			 *   __in_     DWORD     dwExStyle,
			 *   __in_opt_ LPCTSTR   lpClassName,
			 *   __in_opt_ LPCTSTR   lpWindowName,
			 *   __in_     DWORD     dwStyle,
			 *   __in_     int       x,
			 *   __in_     int       y,
			 *   __in_     int       nWidth,
			 *   __in_     int       nHeight,
			 *   __in_opt_ HWND      hWndParent,
			 *   __in_opt_ HMENU     hMenu,
			 *   __in_opt_ HINSTANCE hInstance,
			 *   __in_opt_ LPVOID    lpParam
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'CreateWindowExW' : 'CreateWindowExA', self.TYPE.ABI,
				self.TYPE.HWND,			// return
				self.TYPE.DWORD,		// dwExStyle
				self.TYPE.LPCTSTR,		// lpClassName
				self.TYPE.LPCTSTR,		// lpWindowName
				self.TYPE.DWORD,		// dwStyle
				self.TYPE.INT,			// x
				self.TYPE.INT,			// y
				self.TYPE.INT,			// nWidth
				self.TYPE.INT,			// nHeight
				self.TYPE.HWND,			// hWndParent
				self.TYPE.HMENU,		// hMenu
				self.TYPE.HINSTANCE,	// hInstance
				self.TYPE.LPVOID		// lpParam
			);
		},
		DefWindowProc: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633572%28v=vs.85%29.aspx
			 * LRESULT WINAPI DefWindowProc(
			 *   __in_ HWND   hWnd,
			 *   __in_ UINT   Msg,
			 *   __in_ WPARAM wParam,
			 *   __in_ LPARAM lParam
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'DefWindowProcW' : 'DefWindowProcA', self.TYPE.ABI,
				self.TYPE.LRESULT,	// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.UINT,		// Msg
				self.TYPE.WPARAM,	// wParam
				self.TYPE.LPARAM	// lParam
			);
		},
		DeleteDC: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd183489%28v=vs.85%29.aspx
			 * BOOL DeleteDC(
			 *   __in_  HDC hdc
			 * );
			 */
			return lib('gdi32').declare('DeleteDC', self.TYPE.ABI,
				self.TYPE.BOOL, //return
				self.TYPE.HDC // hdc
			);
		},
		DeleteObject: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd183539%28v=vs.85%29.aspx
			 * BOOL DeleteObject(
			 *   _in_  HGDIOBJ hObject
			 * );
			 */
			return lib('gdi32').declare('DeleteObject', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HGDIOBJ	// hObject
			);
		},
		DeleteTimerQueueTimer: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms682569%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
			 * BOOL WINAPI DeleteTimerQueueTimer(
			 *  __in_opt_ HANDLE TimerQueue,
			 *  __in_     HANDLE Timer,
			 *  __in_opt_ HANDLE CompletionEvent
			 * );
			 */
			return lib('kernel32').declare('DeleteTimerQueueTimer', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HANDLE,	// TimerQueue
				self.TYPE.HANDLE,	// Timer
				self.TYPE.HANDLE	// CompletionEvent
			);
		},
		DestroyIcon: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648063%28v=vs.85%29.aspx
			 * BOOL WINAPI DestroyIcon(
			 *   _In_  HICON hIcon
			 * );
			 */
			return lib('user32').declare('DestroyIcon', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HICON		// hIcon
			);
		},
		DestroyWindow: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms632682%28v=vs.85%29.aspx
			 * BOOL WINAPI DestroyWindow(
			 *   __in_ HWND hWnd
			 * );
			 */
			return lib('user32').declare('DestroyWindow', self.TYPE.ABI,
				self.TYPE.BOOL,	// return
				self.TYPE.HWND	// hWnd
			);
		},
		DispatchMessage: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms644934%28v=vs.85%29.aspx
			 * LRESULT WINAPI DispatchMessage(
			 *   __in_ const MSG *lpmsg
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'DispatchMessageW' : 'DispatchMessageA', self.TYPE.ABI,
				self.TYPE.LRESULT,	// return
				self.TYPE.MSG.ptr	// *lpmsg
			);
		},
		DragQueryFile: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/bb776408(v=vs.85).aspx
			 * UINT DragQueryFile(
			 *   _In_  HDROP  hDrop,
			 *   _In_  UINT   iFile,
			 *   _Out_ LPTSTR lpszFile,
			 *   UINT   cch
			 * );
			 */
			return lib('shell32').declare(ifdef_UNICODE ? 'DragQueryFileW' : 'DragQueryFileA', self.TYPE.ABI,
				self.TYPE.UINT,		// return
				self.TYPE.HDROP,	// hDrop
				self.TYPE.UINT,		// iFile
				self.TYPE.LPTSTR,	// lpszFile
				self.TYPE.UINT		// cch
			);
		},
		DuplicateHandle: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms724251%28v=vs.85%29.aspx
			 * BOOL WINAPI DuplicateHandle(
			 *   __in_  HANDLE   hSourceProcessHandle,
			 *   __in_  HANDLE   hSourceHandle,
			 *   __in_  HANDLE   hTargetProcessHandle,
			 *   __out_ LPHANDLE lpTargetHandle,
			 *   __in_  DWORD    dwDesiredAccess,
			 *   __in_  BOOL     bInheritHandle,
			 *   __in_  DWORD    dwOptions
			 * );
			 */
			return lib('kernel32').declare('DuplicateHandle', self.TYPE.ABI,
				self.TYPE.BOOL,			// return
				self.TYPE.HANDLE,		// hSourceProcessHandle
				self.TYPE.HANDLE,		// hSourceHandle
				self.TYPE.HANDLE,		// hTargetProcessHandle
				self.TYPE.LPHANDLE,		// lpTargetHandle
				self.TYPE.DWORD,		// dwDesiredAccess
				self.TYPE.BOOL,			// bInheritHandle
				self.TYPE.DWORD			// dwOptions
			);
		},
		EmptyClipboard: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms649037(v=vs.85).aspx
			 * BOOL WINAPI EmptyClipboard(
			 *   void
			 * );
			 */
			return lib('user32').declare('EmptyClipboard', self.TYPE.ABI,
				self.TYPE.BOOL		// return
			);
		},
		EndUpdateResource: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648032%28v=vs.85%29.aspx
			 * BOOL WINAPI EndUpdateResource(
			 *   __in_ HANDLE hUpdate,
			 *   __in_ BOOL   fDiscard
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'EndUpdateResourceW' : 'EndUpdateResourceA', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HANDLE,	// hUpdate
				self.TYPE.BOOL		// fDiscard
			);
		},
		EnumClipboardFormats: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms649038(v=vs.85).aspx
			 * UINT WINAPI EnumClipboardFormats(
			 *   _In_ UINT format
			 * );
			 */
			return lib('user32').declare('EnumClipboardFormats', self.TYPE.ABI,
				self.TYPE.UINT,		// return
				self.TYPE.UINT		// format
			);
		},
		EnumDisplayDevices: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd162609%28v=vs.85%29.aspx
			 * BOOL EnumDisplayDevices(
			 *   _In_   LPCTSTR         lpDevice,
			 *   _In_   DWORD           iDevNum,
			 *   _Out_  PDISPLAY_DEVICE lpDisplayDevice,
			 *   _In_   DWORD           dwFlags
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'EnumDisplayDevicesW' : 'EnumDisplayDevicesA', self.TYPE.ABI,
				self.TYPE.BOOL,				// return
				self.TYPE.LPCTSTR,			// lpDevice
				self.TYPE.DWORD,			// iDevNum
				self.TYPE.PDISPLAY_DEVICE,	// lpDisplayDevice
				self.TYPE.DWORD				// dwFlags
			);
		},
		EnumDisplayMonitors: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd183489%28v=vs.85%29.aspx
			 * BOOL EnumDisplayMonitors(
			 *   __in_  HDC             hdc,
			 *   __in_  LPCRECT         lprcClip,
			 *   __in_  MONITORENUMPROC *lpfnEnum,
			 *   __in_  LPARAM          dwData
			 * );
			 */
			return lib('user32').declare('EnumDisplayMonitors', self.TYPE.ABI,
				self.TYPE.BOOL,					// return
				self.TYPE.HDC,					// hdc,
				self.TYPE.LPCRECT,				// lprcClip,
				self.TYPE.MONITORENUMPROC.ptr,	// lpfnEnum,
				self.TYPE.LPARAM				// dwData
			);
		},
		EnumDisplaySettings: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd162611%28v=vs.85%29.aspx
			 * BOOL EnumDisplaySettings(
			 *   _In_   LPCTSTR lpszDeviceName,
			 *   _In_   DWORD   iModeNum,
			 *   _Out_  DEVMODE *lpDevMode
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'EnumDisplaySettingsW' : 'EnumDisplaySettingsA', self.TYPE.ABI,
				self.TYPE.BOOL,			// return
				self.TYPE.LPCTSTR,		// lpszDeviceName
			    self.TYPE.DWORD,		// iModeNum
			    self.TYPE.DEVMODE.ptr	// *lpDevMode
			);
		},
		EnumFontFamiliesEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd162620%28v=vs.85%29.aspx
			 * int EnumFontFamiliesEx(
			 *   __in_ HDC          hdc,
			 *   __in_ LPLOGFONT    lpLogfont,
			 *   __in_ FONTENUMPROC lpEnumFontFamExProc,
			 *   __in_ LPARAM       lParam,
			 *   __in_ DWORD        dwFlags
			 * );
			 */
			return lib('gdi32').declare(ifdef_UNICODE ? 'EnumFontFamiliesExW' : 'EnumFontFamiliesExA', self.TYPE.ABI,
				self.TYPE.int,			// return
				self.TYPE.HDC,			// hdc
				self.TYPE.LPLOGFONT,	// lpLogfont
				self.TYPE.FONTENUMPROC,	// lpEnumFontFamExProc
				self.TYPE.LPARAM,		// lParam
				self.TYPE.DWORD			// dwFlags
			);
		},
		EnumThreadWindows: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633495(v=vs.85).aspx
			 * BOOL WINAPI EnumThreadWindows(
			 *   __in_ DWORD       dwThreadId,
			 *   __in_ WNDENUMPROC lpfn,
			 *   __in_ LPARAM      lParam
			 * );
			 */
			return lib('user32').declare('EnumThreadWindows', self.TYPE.ABI,
				self.TYPE.BOOL,			// return
				self.TYPE.DWORD,		// dwThreadId
				self.TYPE.WNDENUMPROC,	// lpfn
				self.TYPE.LPARAM		// lParam
			);
		},
		EnumWindows: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633497%28v=vs.85%29.aspx
			 * BOOL WINAPI EnumWindows(
			 *   __in_  WNDENUMPROC lpEnumFunc,
			 *   __in_  LPARAM lParam
			 * );
			 */
			return lib('user32').declare('EnumWindows', self.TYPE.ABI,
				self.TYPE.BOOL,			// return
				self.TYPE.WNDENUMPROC,	// lpEnumFunc
				self.TYPE.LPARAM		// lParam
			);
		},
		FindWindow: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633499(v=vs.85).aspx
			 * HWND WINAPI FindWindow(
			 *   __in_opt_ LPCTSTR lpClassName,
			 *   __in_opt_ LPCTSTR lpWindowName
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'FindWindowW' : 'FindWindowA', self.TYPE.ABI,
				self.TYPE.HWND,		// return
				self.TYPE.LPCTSTR,	// lpClassName
				self.TYPE.LPCTSTR	// lpWindowName
			);
		},
		FindResource: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648042%28v=vs.85%29.aspx
			 * HRSRC WINAPI FindResource(
			 *   _in_opt_ HMODULE hModule,
			 *   _in_     LPCTSTR lpName,
			 *   _in_     LPCTSTR lpType
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'FindResourceW' : 'FindResourceA', self.TYPE.ABI,
				self.TYPE.HRSRC,		// return
				self.TYPE.HMODULE,		// hModule
				self.TYPE.LPCTSTR,		// lpName
				self.TYPE.LPCTSTR		// lpType
			);
		},
		FindResourceEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648043%28v=vs.85%29.aspx
			 * HRSRC WINAPI FindResourceEx(
			 *   __in_opt_ HMODULE hModule,
			 *   __in_     LPCTSTR lpType,
			 *   __in_     LPCTSTR lpName,
			 *   __in_     WORD    wLanguage
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'FindResourceExW' : 'FindResourceExA', self.TYPE.ABI,
				self.TYPE.HRSRC,		// return
				self.TYPE.HMODULE,		// hModule
				self.TYPE.LPCTSTR,		// lpType
				self.TYPE.LPCTSTR,		// lpName
				self.TYPE.WORD			// wLanguage
			);
		},
		FlushFileBuffers: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa364439%28v=vs.85%29.aspx
			 * BOOL WINAPI FlushFileBuffers(
			 *   __in_ HANDLE hFile
			 * );
			 */
			return lib('kernel32').declare('FlushFileBuffers', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HANDLE	// hFile
			);
		},
		FreeLibrary: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms683152%28v=vs.85%29.aspx
			 * BOOL WINAPI FreeLibrary(
			 *   __in_ HMODULE hModule
			 * );
			 */
			return lib('kernel32').declare('FreeLibrary', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HMODULE	// hModule
			);
		},
		GetActiveWindow: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms646292%28v=vs.85%29.aspx
			 * HWND WINAPI GetActiveWindow(void);
			 */
			return lib('user32').declare('GetActiveWindow', self.TYPE.ABI,
				self.TYPE.HWND	// return
			);
		},
		GetAncestor: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633502(v=vs.85).aspx
			 * HWND WINAPI GetAncestor(
			 *   __in_ HWND hwnd,
			 *   __in_ UINT gaFlags
			 * );
			 */
			return lib('user32').declare('GetAncestor', self.TYPE.ABI,
				self.TYPE.HWND,		// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.UINT 		// gaFlags
			);
		},
		GetClientRect: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms633503%28v=vs.85%29.aspx
			 * BOOL WINAPI GetClientRect(
			 *   __in_   HWND hWnd,
			 *   __out_  LPRECT lpRect
			 * );
			 */
			return lib('user32').declare('GetClientRect', self.TYPE.ABI,
				self.TYPE.BOOL, //return
				self.TYPE.HWND, // hWnd
				self.TYPE.LPRECT // lpRec
			);
		},
		GetClipboardData: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms649039(v=vs.85).aspx
			 * HANDLE WINAPI GetClipboardData(
			 *   _In_ UINT uFormat
			 * );
			 */
			return lib('user32').declare('GetClipboardData', self.TYPE.ABI,
				self.TYPE.HANDLE,		// return
				self.TYPE.UINT			// uFormat
			);
		},
		GetClipboardFormatName: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms649040(v=vs.85).aspx
			 * int WINAPI GetClipboardFormatName(
			 *   _In_  UINT   format,
			 *   _Out_ LPTSTR lpszFormatName,
			 *   _In_  int    cchMaxCount
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'GetClipboardFormatNameW' : 'GetClipboardFormatNameA', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.UINT,		// format
				self.TYPE.LPTSTR,	// lpszFormatName
				self.TYPE.int		// cchMaxCount
			);
		},
		GetCurrentProcess: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms683179%28v=vs.85%29.aspx
			 * HANDLE WINAPI GetCurrentProcess(
			 *   void
			 * );
			 */
			return lib('kernel32').declare('GetCurrentProcess', self.TYPE.ABI,
				self.TYPE.HANDLE	// return
			);
		},
		GetCurrentThreadId: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms683183%28v=vs.85%29.aspx
			 * DWORD WINAPI GetCurrentThreadId(
			 *   void
			 * );
			 */
			return lib('kernel32').declare('GetCurrentThreadId', self.TYPE.ABI,
				self.TYPE.DWORD	// return
			);
		},
		GetCursorPos: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648390%28v=vs.85%29.aspx
			 * BOOL WINAPI GetCursorPos(
			 *   __out_ LPPOINT lpPoint
			 * );
			 */
			return lib('user32').declare('GetCursorPos', self.TYPE.ABI,
				self.TYPE.BOOL,		//return
				self.TYPE.LPPOINT	// hWnd
			);
		},
		GetDC: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd144871%28v=vs.85%29.aspx
			 * HDC GetDC(
			 *   __in_ HWND hWnd
			 * );
			 */
			return lib('user32').declare('GetDC', self.TYPE.ABI,
				self.TYPE.HDC,	//return
				self.TYPE.HWND	// hWnd
			);
		},
		GetDesktopWindow: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms633504%28v=vs.85%29.aspx
			 * HWND WINAPI GetDesktopWindow(void);
			 */
			return lib('user32').declare('GetDesktopWindow', self.TYPE.ABI,
				self.TYPE.HWND	//return
			);
		},
		GetDeviceCaps: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd144877%28v=vs.85%29.aspx
			 * int GetDeviceCaps(
			 *   __in_  HDC hdc,
			 *   __in_  int nIndex
			 * );
			 */
			return lib('gdi32').declare('GetDeviceCaps', self.TYPE.ABI,
				self.TYPE.INT,	//return
				self.TYPE.HDC,	// hdc
				self.TYPE.INT	// nIndex
			);
		},
		GetDpiForMonitor: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dn280510%28v=vs.85%29.aspx
			 * HRESULT WINAPI GetDpiForMonitor(
			 *   __in_  HMONITOR         hmonitor,
			 *   __in_  MONITOR_DPI_TYPE dpiType,
			 *   __out_ UINT             *dpiX,
			 *   __out_ UINT             *dpiY
			 * );
			 */
			return lib('shcore').declare('GetDpiForMonitor', self.TYPE.ABI,
				self.TYPE.HRESULT,			// return
				self.TYPE.HMONITOR,			// hmonitor
				self.TYPE.MONITOR_DPI_TYPE,	// dpiType
				self.TYPE.UINT.ptr,			// *dpiX
				self.TYPE.UINT.ptr			// *dpiY
			);
		},
		GetForegroundWindow: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633505%28v=vs.85%29.aspx
			 * HWND WINAPI GetForegroundWindow(
			 *   void
			 * );
			 */
			return lib('user32').declare('GetForegroundWindow', self.TYPE.ABI,
				self.TYPE.HWND		// return
			)
		},
		GetLogicalDriveStrings: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa364975%28v=vs.85%29.aspx
			 * DWORD WINAPI GetLogicalDriveStrings(
			 *   __in_  DWORD  nBufferLength,
			 *   __out_ LPTSTR lpBuffer
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'GetLogicalDriveStringsW' : 'GetLogicalDriveStringsA', self.TYPE.ABI,
				self.TYPE.DWORD,	// return
				self.TYPE.DWORD,	// nBufferLength
				self.TYPE.LPTSTR	// lpBuffer
			);
		},
		GetMessage: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms644936%28v=vs.85%29.aspx
			 * BOOL WINAPI GetMessage(
			 *   __out_    LPMSG lpMsg,
			 *   __in_opt_ HWND  hWnd,
			 *   __in_     UINT  wMsgFilterMin,
			 *   __in_     UINT  wMsgFilterMax
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'GetMessageW' : 'GetMessageA', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.LPMSG,	// lpMsg
				self.TYPE.HWND, 	// hWnd
				self.TYPE.UINT, 	// wMsgFilterMin
				self.TYPE.UINT		// wMsgFilterMax
			);
		},
		GetModuleHandle: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms683199%28v=vs.85%29.aspx
			 * HMODULE WINAPI GetModuleHandle(
			 *   _In_opt_ LPCTSTR lpModuleName
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'GetModuleHandleW' : 'GetModuleHandleA', self.TYPE.ABI,
				self.TYPE.HMODULE,		// return
				self.TYPE.LPCTSTR		// lpModuleName
			);
		},
		GetMonitorInfo: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd144901%28v=vs.85%29.aspx
			 * BOOL GetMonitorInfo(
			 *   __in_   HMONITOR      hMonitor,
			 *   __out_  LPMONITORINFO lpmi
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'GetMonitorInfoW' : 'GetMonitorInfoA', self.TYPE.ABI,
				self.TYPE.BOOL,				//return
				self.TYPE.HMONITOR,			// hMonitor
				self.TYPE.LPMONITORINFOEX	// lpmi
			);
		},
		GetOverlappedResult: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms683209(v=vs.85).aspx
			 * BOOL WINAPI GetOverlappedResult(
			 *	  _In_  HANDLE       hFile,
			 *	  _In_  LPOVERLAPPED lpOverlapped,
			 *	  _Out_ LPDWORD      lpNumberOfBytesTransferred,
			 *	  _In_  BOOL         bWait
			 *	);
			 */
			 return lib('kernel32').declare('GetOverlappedResult', self.TYPE.ABI,
				 self.TYPE.BOOL,				// return
				 self.TYPE.HANDLE,				// hFile
				 self.TYPE.LPOVERLAPPED,		// lpOverlapped
				 self.TYPE.LPDWORD,				// lpNumberOfBytesTransferred
				 self.TYPE.BOOL					// bWait
			 );
		},
		GetParent: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633510(v=vs.85).aspx
			 * HWND WINAPI GetParent(
			 *   __in_ HWND hWnd
			 * );
			 */
			return lib('user32').declare('GetParent', self.TYPE.ABI,
				self.TYPE.HWND,		// return
				self.TYPE.HWND		// hWnd
			);
		},
		GetPixel: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd144909%28v=vs.85%29.aspx
			 * COLORREF GetPixel(
			 *   __in_  HDC hdc,
			 *   __in_  int nXPos,
			 *   __in_  int nYPos
			 * );
			 */
			return lib('gdi32').declare('GetPixel', self.TYPE.ABI,
				self.TYPE.COLORREF, //return
				self.TYPE.HDC, // hWnd
				self.TYPE.INT, // nXPos
				self.TYPE.INT // nYPos
			);
		},
		GetRawInputData: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms645596%28v=vs.85%29.aspx
			 *  UINT WINAPI GetRawInputData(
			 *    __in_      HRAWINPUT hRawInput,
			 *    __in_      UINT      uiCommand,
			 *    __out_opt_ LPVOID    pData,
			 *    __inout_   PUINT     pcbSize,
			 *    __in_      UINT      cbSizeHeader
			 *  );
			 */
			return lib('user32').declare('GetRawInputData', self.TYPE.ABI,
				self.TYPE.UINT,			// return
				self.TYPE.HRAWINPUT,	// hRawInput
				self.TYPE.UINT,			// uiCommand
				self.TYPE.LPVOID,		// pData
				self.TYPE.PUINT,		// pcbSize
				self.TYPE.UINT			// cbSizeHeader
			);
		},
		GetWindow: function() {
			/* GetWindow
			 * HWND WINAPI GetWindow(
			 *   __in_ HWND hWnd,
			 *   __in_ UINT uCmd
			 * );
			 */
			return lib('user32').declare('GetWindow', self.TYPE.ABI,
				self.TYPE.HWND,		// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.UINT		// uCmd
			);
		},
		GetWindowLongPtr: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms633585%28v=vs.85%29.aspx
			 *	LONG_PTR WINAPI GetWindowLongPtr(
			 *	  __in_  HWND hWnd,
			 *	  __in_  int nIndex
			 *	);
			 */
			return lib('user32').declare(is64bit ? (ifdef_UNICODE ? 'GetWindowLongPtrW' : 'GetWindowLongPtrA') : (ifdef_UNICODE ? 'GetWindowLongW' : 'GetWindowLongA'), self.TYPE.ABI,
				is64bit ? self.TYPE.LONG_PTR : self.TYPE.LONG,	// return
				self.TYPE.HWND,									// hWnd
				self.TYPE.INT									// nIndex
			);
		},
		GetWindowText: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633520%28v=vs.85%29.aspx
			 * int WINAPI GetWindowText(
			 *   _In_  HWND   hWnd,
			 *   _Out_ LPTSTR lpString,
			 *   _In_  int    nMaxCount
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'GetWindowTextW' : 'GetWindowTextA', self.TYPE.ABI,
				self.TYPE.INT,		// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.LPTSTR,	// lpString
				self.TYPE.INT		// nMaxCount
			);
		},
		GetWindowThreadProcessId: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633522%28v=vs.85%29.aspx
			 * DWORD WINAPI GetWindowThreadProcessId(
			 *   __in_      HWND    hWnd,
			 *   __out_opt_ LPDWORD lpdwProcessId
			 * );
			 */
			return lib('user32').declare('GetWindowThreadProcessId', self.TYPE.ABI,
				self.TYPE.DWORD,		// return
				self.TYPE.HWND,			// hWnd
				self.TYPE.LPDWORD		// lpdwProcessId
			);
		},
		GetWindowRect: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633519.aspx
			 * BOOL WINAPI GetWindowRect(
			 *   _In_  HWND   hWnd,
			 *   _Out_ LPRECT lpRect
			 * );
			 */
			return lib('user32').declare('GetWindowRect', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.LPRECT	// lpRect
			);
		},
		GetWindowThreadProcessId: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms633522%28v=vs.85%29.aspx
			 * DWORD WINAPI GetWindowThreadProcessId(
			 *   __in_		HWND hWnd,
			 *   __out_opt_	LPDWORD lpdwProcessId
			 * );
			 */
			return lib('user32').declare('GetWindowThreadProcessId', self.TYPE.ABI,
				self.TYPE.DWORD,	// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.LPDWORD	// lpdwProcessId
			);
		},
		IsClipboardFormatAvailable: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms649047(v=vs.85).aspx
			 * BOOL WINAPI IsClipboardFormatAvailable(
			 *   _In_ UINT format
			 * );
			 */
			return lib('user32').declare('IsClipboardFormatAvailable', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.UINT		// format
			);
		},
		IsIconic: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms633507%28v=vs.85%29.aspx
			 * BOOL WINAPI IsIconic(
			 *   __in_ HWND hWnd
			 * );
			 */
			return lib('user32').declare('IsIconic', self.TYPE.ABI,
				self.TYPE.BOOL,	// return
				self.TYPE.HWND	// hWnd
			);
		},
		KillTimer: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms633522%28v=vs.85%29.aspx
			 * BOOL WINAPI KillTimer(
			 *   _in_opt_ HWND     hWnd,
			 *   _in_     UINT_PTR uIDEvent
			 * );
			 */
			return lib('user32').declare('KillTimer', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.UINT_PTR	// uIDEvent
			);
		},
		LoadImage: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/ms648045%28v=vs.85%29.aspx
			 * HANDLE WINAPI LoadImage(
			 *   __in_opt_  HINSTANCE hinst,
			 *   __in_      LPCTSTR lpszName,
			 *   __in_      UINT uType,
			 *   __in_      int cxDesired,
			 *   __in_      int cyDesired,
			 *   __in_      UINT fuLoad
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'LoadImageW' : 'LoadImageA', self.TYPE.ABI,
				self.TYPE.HANDLE,		// return
				self.TYPE.HINSTANCE,	// hinst
				self.TYPE.LPCTSTR,		// lpszName
				self.TYPE.UINT,			// uType
				self.TYPE.int,			// cxDesired
				self.TYPE.int,			// cyDesired
				self.TYPE.UINT			// fuLoad
			);
		},
		LoadLibrary: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms684175%28v=vs.85%29.aspx
			 * HMODULE WINAPI LoadLibrary(
			 *   _In_ LPCTSTR lpFileName
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'LoadLibraryW' : 'LoadLibraryA', self.TYPE.ABI,
				self.TYPE.HMODULE,	// return
				self.TYPE.LPCTSTR	// lpFileName
			);
		},
		LoadLibraryEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms684179%28v=vs.85%29.aspx
			 * HMODULE WINAPI LoadLibraryEx(
			 *   _in_       LPCTSTR lpFileName,
			 *   _reserved_ HANDLE  hFile,
			 *   _in_       DWORD   dwFlags
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'LoadLibraryExW': 'LoadLibraryExA', self.TYPE.ABI,
				self.TYPE.HMODULE,		// return
				self.TYPE.LPCTSTR,		// lpFileName
				self.TYPE.HANDLE,		// hFile
				self.TYPE.DWORD			// dwFlags
			);
		},
		LoadResource: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648046%28v=vs.85%29.aspx
			 * HGLOBAL WINAPI LoadResource(
			 *   _In_opt_ HMODULE hModule,
			 *   _In_     HRSRC   hResInfo
			 * );
			 */
			return lib('kernel32').declare('LoadResource', self.TYPE.ABI,
				self.TYPE.HGLOBAL,		// return
				self.TYPE.HMODULE,		// hModule
				self.TYPE.HRSRC			// hResInfo
			);
		},
		LockResource: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648047%28v=vs.85%29.aspx
			 * LPVOID WINAPI LockResource(
			 *   __in_ HGLOBAL hResData
			 * );
			 */
			return lib('kernel32').declare('LockResource', self.TYPE.ABI,
				self.TYPE.LPVOID,	// return
				self.TYPE.HGLOBAL	// hResData
			);
		},
		OpenClipboard: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms649048(v=vs.85).aspx
			 * BOOL WINAPI OpenClipboard(
			 * _In_opt_ HWND hWndNewOwner
			 * );
			 */
			return lib('user32').declare('OpenClipboard', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HWND		// hWndNewOwner
			);
		},
		OpenProcess: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms684320%28v=vs.85%29.aspx
			 * HANDLE WINAPI OpenProcess(
			 *   __in_ DWORD dwDesiredAccess,
			 *   __in_ BOOL  bInheritHandle,
			 *   __in_ DWORD dwProcessId
			 * );
			 */
			return lib('kernel32').declare('OpenProcess', self.TYPE.ABI,
				self.TYPE.HANDLE,	// return
				self.TYPE.DWORD,	// dwDesiredAccess
				self.TYPE.BOOL,		// bInheritHandle
				self.TYPE.DWORD		// dwProcessId
			);
		},
		MessageBox: function() {
			/*	https://msdn.microsoft.com/en-us/library/windows/desktop/ms645505(v=vs.85).aspx
				int WINAPI MessageBox(
				  _In_opt_ HWND    hWnd,
				  _In_opt_ LPCTSTR lpText,
				  _In_opt_ LPCTSTR lpCaption,
				  _In_     UINT    uType
				);
			*/
			return lib('user32').declare(ifdef_UNICODE ? 'MessageBoxW' : 'MessageBoxA', self.TYPE.ABI,
				self.TYPE.INT,			// return
				self.TYPE.HWND, 		// hWnd
				self.TYPE.LPCTSTR,		// lpText
				self.TYPE.LPCTSTR,		// lpCaption
				self.TYPE.UINT			// uType
			);
		},
		PostMessage: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms644944%28v=vs.85%29.aspx
			 * BOOL WINAPI PostMessage(
			 *   __in_opt_ HWND   hWnd,
			 *   __in_     UINT   Msg,
			 *   __in_     WPARAM wParam,
			 *   __in_     LPARAM lParam
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'PostMessageW' : 'PostMessageA', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HWND, 	// hWnd
				self.TYPE.UINT,		// Msg
				self.TYPE.WPARAM, 	// wParam
				self.TYPE.LPARAM	// lParam
			);
		},
		PostThreadMessage: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms644946%28v=vs.85%29.aspx
			 * BOOL WINAPI PostThreadMessage(
			 *   __in_ DWORD  idThread,
			 *   __in_ UINT   Msg,
			 *   __in_ WPARAM wParam,
			 *   __in_ LPARAM lParam
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'PostThreadMessageW' : 'PostThreadMessageA', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.DWORD, 	// idThread
				self.TYPE.UINT,		// Msg
				self.TYPE.WPARAM, 	// wParam
				self.TYPE.LPARAM	// lParam
			);
		},
		memcpy: function() {
			/* https://msdn.microsoft.com/en-us/library/dswaw1wk.aspx
			 * void *memcpy(
			 *    void *dest,
			 *    const void *src,
			 *    size_t count
			 * );
			 */
			return lib('msvcrt').declare('memcpy', self.TYPE.ABI,
				self.TYPE.void,		// return
				self.TYPE.void.ptr,	// *dest
				self.TYPE.void.ptr,	// *src
				self.TYPE.size_t	// count
			);
		},
		MonitorFromPoint: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd145062%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
			 * HMONITOR MonitorFromPoint(
			 *   __in_  POINT pt,
			 *   __in_  DWORD dwFlags
			 * );
			 */
			return lib('user32').declare('MonitorFromPoint', self.TYPE.ABI,
				self.TYPE.HMONITOR,	// HMONITOR
				self.TYPE.POINT,	// pt
				self.TYPE.DWORD		// dwFlags
			);
		},
		MsgWaitForMultipleObjects: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms684242%28v=vs.85%29.aspx
			 * DWORD WINAPI MsgWaitForMultipleObjects(
			 *   __in_       DWORD  nCount,
			 *   __in_ const HANDLE *pHandles,
			 *   __in_       BOOL   bWaitAll,
			 *   __in_       DWORD  dwMilliseconds,
			 *   __in_       DWORD  dwWakeMask
			 * );
			 */
			return lib('user32').declare('MsgWaitForMultipleObjects', self.TYPE.ABI,
				self.TYPE.DWORD,		// return
				self.TYPE.DWORD,		// nCount
				self.TYPE.HANDLE.ptr,	// *pHandles
				self.TYPE.BOOL,			// bWaitAll
				self.TYPE.DWORD,		// dwMilliseconds
				self.TYPE.DWORD			// dwWakeMask
			);
		},
		MultiByteToWideChar: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd319072%28v=vs.85%29.aspx
			 * int MultiByteToWideChar(
			 *   __in_      UINT   CodePage,
			 *   __in_      DWORD  dwFlags,
			 *   __in_      LPCSTR lpMultiByteStr,
			 *   __in_      int    cbMultiByte,
			 *   __out_opt_ LPWSTR lpWideCharStr,
			 *   __in_      int    cchWideChar
			 * );
			 */
			return lib('kernel32').declare('MultiByteToWideChar', self.TYPE.ABI,
				self.TYPE.int,		// return
				self.TYPE.UINT,		// CodePage
				self.TYPE.DWORD,	// dwFlags
				self.TYPE.LPCSTR,	// lpMultiByteStr
				self.TYPE.int,		// cbMultiByte
				self.TYPE.LPWSTR,	// lpWideCharStr
				self.TYPE.int		// cchWideChar
			);
		},
		NtQueryInformationFile: function() {
			/* https://github.com/wine-mirror/wine/blob/80ea5a01ef42b0e9e0b6c872f8f5bbbf393c0ae7/dlls/ntdll/file.c#L2272
			 * https://msdn.microsoft.com/en-us/library/windows/hardware/ff556646%28v=vs.85%29.aspx --> https://msdn.microsoft.com/en-us/library/windows/hardware/ff567052%28v=vs.85%29.aspx --- they have it wrong though, they say ULONG
			 * NTSTATUS WINAPI NtQueryInformationFile(
			 *   __in_ HANDLE hFile,
			 *   __out_ PIO_STATUS_BLOCK io,
			 *   __out_ PVOID ptr,
			 *   __in_ LONG len,
			 *   __in_ FILE_INFORMATION_CLASS class
			 * );
			 */
			return lib('ntdll').declare('NtQueryInformationFile', self.TYPE.ABI,
				self.TYPE.NTSTATUS,					// return
				self.TYPE.HANDLE,					// hFile
				self.TYPE.PIO_STATUS_BLOCK,			// io
				self.TYPE.PVOID,					// ptr
				self.TYPE.LONG,						// len
				self.TYPE.FILE_INFORMATION_CLASS	// class
			);
		},
		NtQueryObject: function() {
			/* https://msdn.microsoft.com/en-us/library/bb432383%28v=vs.85%29.aspx
			 * NTSTATUS NtQueryObject(
			 *   __in_opt_  HANDLE Handle,
			 *   __in_      OBJECT_INFORMATION_CLASS ObjectInformationClass,
			 *   __out_opt_ PVOID ObjectInformation,
			 *   __in_      ULONG ObjectInformationLength,
			 *   __out_opt_ PULONG ReturnLength
			 * );
			 */
			return lib('ntdll').declare('NtQueryObject', self.TYPE.ABI,
				self.TYPE.NTSTATUS,						// return
				self.TYPE.HANDLE,						// Handle
				self.TYPE.OBJECT_INFORMATION_CLASS,		// ObjectInformationClass
				self.TYPE.PVOID,						// ObjectInformation
				self.TYPE.ULONG,						// ObjectInformationLength
				self.TYPE.PULONG						// ReturnLength
			);
		},
		NtQuerySystemInformation: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms724509%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
			 * NTSTATUS WINAPI NtQuerySystemInformation(
			 *  __in_      SYSTEM_INFORMATION_CLASS SystemInformationClass,
			 *  __inout_   PVOID                    SystemInformation,
			 *  __in_      ULONG                    SystemInformationLength,
			 *  __out_opt_ PULONG                   ReturnLength
			 * );
			 */
			return lib('ntdll').declare('NtQuerySystemInformation', self.TYPE.ABI,
				self.TYPE.NTSTATUS,					// return
				self.TYPE.SYSTEM_INFORMATION_CLASS,	// SystemInformationClass
				self.TYPE.PVOID,					// SystemInformation
				self.TYPE.ULONG,					// SystemInformationLength
				self.TYPE.PULONG					// ReturnLength
			);
		},
		PeekMessage: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms644943%28v=vs.85%29.aspx
			 * BOOL WINAPI PeekMessage(
			 *   __out_    LPMSG lpMsg,
			 *   __in_opt_ HWND  hWnd,
			 *   __in_     UINT  wMsgFilterMin,
			 *   __in_     UINT  wMsgFilterMax,
			 *   __in_     UINT  wRemoveMsg
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'PeekMessageW' : 'PeekMessageA', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.LPMSG,	// lpMsg
				self.TYPE.HWND, 	// hWnd
				self.TYPE.UINT, 	// wMsgFilterMin
				self.TYPE.UINT,		// wMsgFilterMax
				self.TYPE.UINT		// wRemoveMsg
			);
		},
		PropVariantClear: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/aa380073%28v=vs.85%29.aspx
			 * WINOLEAPI PropVariantClear(
			 * __in_ PROPVARIANT *pvar
			 * );
			 */
			return lib('ole32').declare('PropVariantClear', self.TYPE.ABI,
				self.TYPE.WINOLEAPI,			// return
				self.TYPE.PROPVARIANT.ptr		// *pvar
			);
		},
		PulseEvent: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms684914(v=vs.85).aspx
			 * BOOL WINAPI PulseEvent(
			 *   __in_ HANDLE hEvent
			 * );
			 */
			return lib('kernel32').declare('PulseEvent', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HANDLE	// hEvent
			);
		},
		QueryDosDevice: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa365461%28v=vs.85%29.aspx
			 * DWORD WINAPI QueryDosDevice(
			 *   _in_opt_ LPCTSTR lpDeviceName,
			 *   _out_    LPTSTR  lpTargetPath,
			 *   _in_     DWORD   ucchMax
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'QueryDosDeviceW' : 'QueryDosDeviceA', self.TYPE.ABI,
				self.TYPE.DWORD,		// return
				self.TYPE.LPCTSTR,		// lpDeviceName
				self.TYPE.LPTSTR,		// lpTargetPath
				self.TYPE.DWORD			// ucchMax
			);
		},
		ReadDirectoryChanges: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa365465%28v=vs.85%29.aspx
			 * BOOL WINAPI ReadDirectoryChangesW(
			 *   __in_         HANDLE hDirectory,
			 *   __out_        LPVOID lpBuffer,
			 *   __in_         DWORD nBufferLength,
			 *   __in_         BOOL bWatchSubtree,
			 *   __in_         DWORD dwNotifyFilter,
			 *   __out_opt_    LPDWORD lpBytesReturned,
			 *   __inout_opt_  LPOVERLAPPED lpOverlapped,
			 *   __in_opt_     LPOVERLAPPED_COMPLETION_ROUTINE lpCompletionRoutine
			 * );
			 */
			return lib('kernel32').declare('ReadDirectoryChangesW', self.TYPE.ABI,
				self.TYPE.BOOL,								// return
				self.TYPE.HANDLE,							// hDirectory,
				self.TYPE.LPVOID,							// lpBuffer,
				self.TYPE.DWORD,							// nBufferLength,
				self.TYPE.BOOL,								// bWatchSubtree,
				self.TYPE.DWORD,							// dwNotifyFilter,
				self.TYPE.LPDWORD,							// lpBytesReturned,
				self.TYPE.LPOVERLAPPED,						// lpOverlapped,
				self.TYPE.LPOVERLAPPED_COMPLETION_ROUTINE	// lpCompletionRoutine
			);
		},
		ReadFile: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa365467%28v=vs.85%29.aspx
			 * BOOL WINAPI ReadFile(
			 *   __in_        HANDLE       hFile,
			 *   __out_       LPVOID       lpBuffer,
			 *   __in_        DWORD        nNumberOfBytesToRead,
			 *   __out_opt_   LPDWORD      lpNumberOfBytesRead,
			 *   __inout_opt_ LPOVERLAPPED lpOverlapped
			 * );
			 */
			return lib('kernel32').declare('ReadFile', self.TYPE.ABI,
				self.TYPE.BOOL,			// return
				self.TYPE.HANDLE,		// hFile
				self.TYPE.LPVOID,		// lpBuffer
				self.TYPE.DWORD,		// nNumberOfBytesToRead
				self.TYPE.LPDWORD,		// lpNumberOfBytesWritten
				self.TYPE.LPOVERLAPPED	// lpOverlapped
			);
		},
    	ReadFileEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa365468(v=vs.85).aspx
			 * BOOL WINAPI ReadFileEx(
			 *   _In_      HANDLE                          hFile,
			 *   _Out_opt_ LPVOID                          lpBuffer,
			 *   _In_      DWORD                           nNumberOfBytesToRead,
			 *   _Inout_   LPOVERLAPPED                    lpOverlapped,
			 *   _In_      LPOVERLAPPED_COMPLETION_ROUTINE lpCompletionRoutine
			 * );
			 */
			return lib('kernel32').declare('ReadFileEx', self.TYPE.ABI,
				self.TYPE.BOOL,                             // return
				self.TYPE.HANDLE,                           // hFile
			  self.TYPE.LPVOID,                           // lpBuffer
				self.TYPE.DWORD,                            // nNumberOfBytesToRead
				self.TYPE.LPOVERLAPPED,		                  // lpNumberOfBytesWritten
				self.TYPE.LPOVERLAPPED_COMPLETION_ROUTINE	  // lpOverlapped
			);
		},
		RegisterClass: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633586%28v=vs.85%29.aspx
			 * ATOM WINAPI RegisterClass(
			 *   __in_ const WNDCLASS *lpWndClass
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'RegisterClassW' : 'RegisterClassA', self.TYPE.ABI,
				self.TYPE.ATOM,			// return
				self.TYPE.WNDCLASS.ptr	// *lpWndClass
			);
		},
		RegCloseKey: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms724837%28v=vs.85%29.aspx
			 * LONG WINAPI RegCloseKey(
			 *   __in_ HKEY hKey
			 * );
			 */
			return lib('advapi32').declare('RegCloseKey', self.TYPE.ABI,
				self.TYPE.LONG,		// return
				self.TYPE.HKEY		// hKey
			);
		},
    	RegisterHotKey: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms646309%28v=vs.85%29.aspx
			 * BOOL WINAPI RegisterHotKey(
			 *   __in_opt_ HWND hWnd,
			 *   __in_     int  id,
			 *   __in_     UINT fsModifiers,
			 *   __in_     UINT vk
			 * );
			 */
			return lib('user32').declare('RegisterHotKey', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.int,		// id
				self.TYPE.UINT,		// fsModifiers
				self.TYPE.UINT		// vk
			);
		},
		RegOpenKeyEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms724897%28v=vs.85%29.aspx
			 * LONG WINAPI RegOpenKeyEx(
			 *   __in_     HKEY    hKey,
			 *   __in_opt_ LPCTSTR lpSubKey,
			 *   __in_     DWORD   ulOptions,
			 *   __in_     REGSAM  samDesired,
			 *   __out_    PHKEY   phkResult
			 * );
			 */
			return lib('advapi32').declare(ifdef_UNICODE ? 'RegOpenKeyExW' : 'RegOpenKeyExA', self.TYPE.ABI,
				self.TYPE.LONG,		// return
				self.TYPE.HKEY,		// hKey
				self.TYPE.LPCTSTR,	// lpSubKey
				self.TYPE.DWORD,	// ulOptions
				self.TYPE.REGSAM,	// samDesired
				self.TYPE.PHKEY		// phkResult
			);
		},
		RegQueryValueEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms724911%28v=vs.85%29.aspx
			 * LONG WINAPI RegQueryValueEx(
			 *   __in_        HKEY    hKey,
			 *   __in_opt_    LPCTSTR lpValueName,
			 *   __reserved_  LPDWORD lpReserved,
			 *   __out_opt_   LPDWORD lpType,
			 *   __out_opt_   LPBYTE  lpData,
			 *   __inout_opt_ LPDWORD lpcbData
			 * );
			 */
			return lib('advapi32').declare(ifdef_UNICODE ? 'RegQueryValueExW' : 'RegQueryValueExA', self.TYPE.ABI,
				self.TYPE.LONG,		// return
				self.TYPE.HKEY,		// hKey
				self.TYPE.LPCTSTR,	// lpValueName
				self.TYPE.LPDWORD,	// lpReserved
				self.TYPE.LPDWORD,	// lpType
				self.TYPE.LPBYTE,	// lpData
				self.TYPE.LPDWORD	// lpcbData
			);
		},
		RegisterRawInputDevices: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms645600%28v=vs.85%29.aspx
			 * BOOL WINAPI RegisterRawInputDevices(
			 *  __in_ PCRAWINPUTDEVICE pRawInputDevices,
			 *  __in_ UINT             uiNumDevices,
			 *  __in_ UINT             cbSize
			 * );
			 */
			return lib('user32').declare('RegisterRawInputDevices', self.TYPE.ABI,
				self.TYPE.BOOL,					// return
				self.TYPE.PCRAWINPUTDEVICE,		// pRawInputDevices
				self.TYPE.UINT,					// uiNumDevices
				self.TYPE.UINT					// cbSize
			);
		},
		ReleaseDC: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd162920%28v=vs.85%29.aspx
			 * int ReleaseDC(
			 *   __in_  HWND hWnd,
			 *   __in_  HDC hDC
			 * );
			 */
			return lib('user32').declare('ReleaseDC', self.TYPE.ABI,
				self.TYPE.INT, //return
				self.TYPE.HWND, // hWnd
				self.TYPE.HDC // hDc
			);
		},
		ResetEvent: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms685081(v=vs.85).aspx
			 * BOOL WINAPI ResetEvent(
			 *   _In_ HANDLE hEvent
			 * );
			 */
			return lib('kernel32').declare('ResetEvent', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HANDLE	// hEvent
			);
		},
		SelectObject: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd183489%28v=vs.85%29.aspx
			 * HGDIOBJ SelectObject(
			 *   __in_  HDC hdc,
			 *   __in_  HGDIOBJ hgdiobj
			 * );
			 */
			return lib('gdi32').declare('SelectObject', self.TYPE.ABI,
				self.TYPE.HGDIOBJ, //return
				self.TYPE.HDC, // hdc
				self.TYPE.HGDIOBJ // hgdiobj
			);
		},
		SendInput: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms646310(v=vs.85).aspx
			 * UINT WINAPI SendInput(
			 *   __in_ UINT    nInputs,
			 *   __in_ LPINPUT pInputs,
			 *   __in_ int     cbSize
			 * );
			 */
			return lib('user32').declare('SendInput', self.TYPE.ABI,
				self.TYPE.UINT,			// return
				self.TYPE.UINT,			// nInputs
				self.TYPE.LPINPUT,		// pInputs
				self.TYPE.int			// cbSize
			);
		},
		SetClassLong: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633589%28v=vs.85%29.aspx
			 * I tried SetClassLongW on 32bit, and it gave me the symbol not found error
			 * ULONG_PTR WINAPI SetClassLongPtr(
			 *   __in_  HWND hWnd,
			 *   __in_  int nIndex,
			 *   __in_  LONG_PTR dwNewLong
			 * );
			 */
			 /* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633588%28v=vs.85%29.aspx
			 * I tried SetClassLongW on 32bit, and it gave me the symbol not found error
			 * DWORD WINAPI SetClassLong(
			 *   __in_  HWND hWnd,
			 *   __in_  int nIndex,
			 *   __in_  LONG dwNewLong
			 * );
			 */
			return lib('user32').declare(is64bit ? (ifdef_UNICODE ? 'SetClassLongPtrW' : 'SetClassLongPtrA') : (ifdef_UNICODE ? 'SetClassLongW' : 'SetClassLongA'), self.TYPE.ABI,
				is64bit ? self.TYPE.ULONG_PTR : self.TYPE.DWORD,	// return
				self.TYPE.HWND,										// hWnd
				self.TYPE.INT,										// nIndex
				is64bit ? self.TYPE.LONG_PTR : self.TYPE.LONG		// dwNewLong
			);
		},
		SetEvent: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms686211(v=vs.85).aspx
			 * BOOL WINAPI SetEvent(
			 *   _In_ HANDLE hEvent
			 * );
			 */
			return lib('kernel32').declare('SetEvent', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HANDLE	// hEvent
			);
		},
		SetForegroundWindow: function() {
			/* http://msdn.microsoft.com/en-us/library/ms633539%28v=vs.85%29.aspx
			 * BOOL WINAPI SetForegroundWindow(
			 *   __in_ HWND hWnd
			 * );
			 */
			return lib('user32').declare('SetForegroundWindow', self.TYPE.ABI,
				self.TYPE.BOOL,	// return
				self.TYPE.HWND	// hWnd
			);
		},
		SetTimer: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms644906%28v=vs.85%29.aspx
			 * UINT_PTR WINAPI SetTimer(
			 *   _in_opt_ HWND      hWnd,
			 *   _in_     UINT_PTR  nIDEvent,
			 *   _in_     UINT      uElapse,
			 *   _in_opt_ TIMERPROC lpTimerFunc
			 * );
			 */
			return lib('user32').declare('SetTimer', self.TYPE.ABI,
				self.TYPE.UINT_PTR,		//return
				self.TYPE.HWND,			// hWnd
				self.TYPE.UINT_PTR,		// nIDEvent
				self.TYPE.UINT,			// uElapse
				self.TYPE.TIMERPROC.ptr	// lpTimerFunc
			);
		},
		SetWindowsHookEx: function() {
			/* HHOOK WINAPI SetWindowsHookEx(
			 *   __in_ int       idHook,
			 *   __in_ HOOKPROC  lpfn,
			 *   __in_ HINSTANCE hMod,
			 *   __in_ DWORD     dwThreadId
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'SetWindowsHookExW' : 'SetWindowsHookExA', self.TYPE.ABI,
				self.TYPE.HHOOK,
				self.TYPE.INT,
				self.TYPE.HOOKPROC,
				self.TYPE.HINSTANCE,
				self.TYPE.DWORD
			);
		},
		SetWindowPos: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633545%28v=vs.85%29.aspx
			 * BOOL WINAPI SetWindowPos(
			 *   __in_     HWND hWnd,
			 *   __in_opt_ HWND hWndInsertAfter,
			 *   __in_     int  X,
			 *   __in_     int  Y,
			 *   __in_     int  cx,
			 *   __in_     int  cy,
			 *   __in_     UINT uFlags
			 *);
			 */
			return lib('user32').declare('SetWindowPos', self.TYPE.ABI,
				self.TYPE.BOOL,				// return
				self.TYPE.HWND,				// hWnd
				self.TYPE.HWND,				// hWndInsertAfter
				self.TYPE.INT,				// X
				self.TYPE.INT,				// Y
				self.TYPE.INT,				// cx
				self.TYPE.INT,				// cy
				self.TYPE.UINT				// uFlags
			);
		},
		SetWindowLongPtr: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms644898%28v=vs.85%29.aspx
			 * LONG_PTR WINAPI SetWindowLongPtr(
			 *   _In_ HWND     hWnd,
			 *   _In_ int      nIndex,
			 *   _In_ LONG_PTR dwNewLong
			 * );
			 */
			return lib('user32').declare(is64bit ? (ifdef_UNICODE ? 'SetWindowLongPtrW' : 'SetWindowLongPtrA') : (ifdef_UNICODE ? 'SetWindowLongW' : 'SetWindowLongA'), self.TYPE.ABI,
				is64bit ? self.TYPE.LONG_PTR : self.TYPE.LONG,	// return
				self.TYPE.HWND,									// hWnd
				self.TYPE.int,									// nIndex
				is64bit ? self.TYPE.LONG_PTR : self.TYPE.LONG	// dwNewLong
			);
		},
		ShellExecuteEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/bb762154%28v=vs.85%29.aspx
			 * BOOL ShellExecuteEx(
			 *   __inout_  SHELLEXECUTEINFO *pExecInfo
			 * );
			 */
			return lib('shell32.dll').declare('ShellExecuteExW', self.TYPE.ABI,
				self.TYPE.BOOL,					// return
				self.TYPE.SHELLEXECUTEINFO.ptr	// *pExecInfo
			);
		},
		SHFileOperation: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/bb762164%28v=vs.85%29.aspx
			 * int SHFileOperation(
			 *   __inout_ LPSHFILEOPSTRUCT lpFileOp
			 * );
			 */
			return lib('shell32').declare(ifdef_UNICODE ? 'SHFileOperationW' : 'SHFileOperationA', self.TYPE.ABI,
				self.TYPE.INT,				// return
				self.TYPE.LPSHFILEOPSTRUCT	// lpFileOp
			);
		},
		SHGetPropertyStoreForWindow: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/dd378430%28v=vs.85%29.aspx
			 * HRESULT SHGetPropertyStoreForWindow(
			 * __in_ HWND hwnd,
			 * __in_ REFIID riid,
			 * __out_ void **ppv
			 * );
			 */
			return lib('shell32').declare('SHGetPropertyStoreForWindow', self.TYPE.ABI,
				self.TYPE.HRESULT,		// return
				self.TYPE.HWND,			// hwnd
				self.TYPE.REFIID,		// riid
				ctypes.voidptr_t		// **ppv // i can set this to `self.TYPE.IPropertyStore.ptr.ptr` // however i cannot set this to ctypes.void_t.ptr.ptr i have no iea why, and i thouh `void **ppv` is either void_t.ptr.ptr or ctypes.voidptr_t.ptr // ctypes.voidptr_t as was one here: `void**` the `QueryInterface` also has out argument `void**` and he used `ctypes.voidptr_t` (https://github.com/west-mt/ssbrowser/blob/452e21d728706945ad00f696f84c2f52e8638d08/chrome/content/modules/WindowsShortcutService.jsm#L74)
			);
		},
		ShowWindow: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms633548(v=vs.85).aspx
			 * BOOL WINAPI ShowWindow(
			 *   __in_ HWND hWnd,
			 *   __in_ int  nCmdShow
			 * );
			 */
			return lib('user32').declare('ShowWindow', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.int		// nCmdShow
			);
		},
		SHStrDup: function() {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/bb759924%28v=vs.85%29.aspx
			* HRESULT SHStrDup(
			* __in_ LPCTSTR pszSource,
			* __out_ LPTSTR *ppwsz
			* );
			*/
			return lib('shlwapi').declare('SHStrDupW', self.TYPE.ABI,
				self.TYPE.HRESULT,		// return
				self.TYPE.LPCTSTR,		// pszSource
				self.TYPE.LPTSTR.ptr	// *ppwsz
			);
		},
		SizeofResource: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648048%28v=vs.85%29.aspx
			 * DWORD WINAPI SizeofResource(
			 *   __in_opt_ HMODULE hModule,
			 *   __in_     HRSRC   hResInfo
			 * );
			 */
			return lib('kernel32').declare('SizeofResource', self.TYPE.ABI,
				self.TYPE.DWORD,		// return
				self.TYPE.HMODULE,		// hModule
				self.TYPE.HRSRC			// hResInfo
			);
		},
		SleepEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms686307(v=vs.85).aspx
			 * DWORD WINAPI SleepEx(
  	 		 *   _In_ DWORD dwMilliseconds,
  	 		 *   _In_ BOOL  bAlertable
		 	 * );
			 */
			return lib('kernel32').declare('SleepEx', self.TYPE.ABI,
				self.TYPE.DWORD,	// return
				self.TYPE.DWORD,	// dwMilliseconds
				self.TYPE.BOOL		// bAlertable
			);
		},
		SysAllocString: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms221458(v=vs.85).aspx
			 * BSTR SysAllocString(
			 *   _In_opt_ const OLECHAR *psz
			 * );
			 */
			return lib('oleaut32').declare('SysAllocString', self.TYPE.ABI,
				self.TYPE.BSTR,		// return
				self.TYPE.OLECHAR	// *psz
			);
		},
		SystemParametersInfo: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms724947(v=vs.85).aspx
			 * BOOL WINAPI SystemParametersInfo(
			 *   _In_    UINT  uiAction,
			 *   _In_    UINT  uiParam,
			 *   _Inout_ PVOID pvParam,
			 *   _In_    UINT  fWinIni
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'SystemParametersInfoW' : 'SystemParametersInfoA', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.UINT,		// uiAction
				self.TYPE.UINT,		// uiParam
				self.TYPE.PVOID,	// pvParam
				self.TYPE.UINT		// fWinIni
			);
		},
		UpdateResource: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms648049%28v=vs.85%29.aspx
			 * BOOL WINAPI UpdateResource(
			 *   __in_     HANDLE  hUpdate,
			 *   __in_     LPCTSTR lpType,
			 *   __in_     LPCTSTR lpName,
			 *   __in_     WORD    wLanguage,
			 *   __in_opt_ LPVOID  lpData,
			 *   __in_     DWORD   cbData
			 * );
			 */
			return lib('kernel32').declare(ifdef_UNICODE ? 'UpdateResourceW' : 'UpdateResourceA', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HANDLE,	// hUpdate
				self.TYPE.LPCTSTR,	// lpType
				self.TYPE.LPCTSTR,	// lpName
				self.TYPE.WORD,		// wLanguage
				self.TYPE.LPVOID,	// lpData
				self.TYPE.DWORD		// cbData
			);
		},
		UnhookWindowsHookEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms644993%28v=vs.85%29.aspx
			 * BOOL WINAPI UnhookWindowsHookEx(
			 *   _in_ HHOOK hhk
			 * );
			 */
			return lib('user32').declare('UnhookWindowsHookEx', self.TYPE.ABI,
				self.TYPE.BOOL,
				self.TYPE.HHOOK
			);
		},
		UnregisterClass: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms644899%28v=vs.85%29.aspx
			 * BOOL WINAPI UnregisterClass(
			 *   __in_     LPCTSTR   lpClassName,
			 *   __in_opt_ HINSTANCE hInstance
			 * );
			 */
			return lib('user32').declare(ifdef_UNICODE ? 'UnregisterClassW' : 'UnregisterClassA', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.LPCTSTR,	// lpClassName
				self.TYPE.HINSTANCE	// hInstance
			);
		},
		UnregisterHotKey: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms646327%28v=vs.85%29.aspx
			 * BOOL WINAPI UnregisterHotKey(
			 *   __in_opt_ HWND hWnd,
			 *   __in_     int  id
			 * );
			 */
			return lib('user32').declare('UnregisterHotKey', self.TYPE.ABI,
				self.TYPE.BOOL,		// return
				self.TYPE.HWND,		// hWnd
				self.TYPE.int		// id
			);
		},
		VariantClear: function(variantPtr) {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms221165(v=vs.85).aspx
			 * HRESULT VariantClear(
			 *   _Inout_ VARIANTARG *pvarg
			 * );
			 */
			return lib('oleaut32').declare('VariantClear', self.TYPE.ABI,
				self.TYPE.HRESULT,			// return
				self.TYPE.VARIANTARG.ptr	// *pvarg
			);
		},
		VariantInit: function(variantPtr) {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms221402(v=vs.85).aspx
			 * void VariantInit(
			 *   _Out_ VARIANTARG *pvarg
			 * );
			 */
			return lib('oleaut32').declare('VariantInit', self.TYPE.ABI,
				self.TYPE.void,				// return
				self.TYPE.VARIANTARG.ptr	// *pvarg
			);
		},
		WaitForMultipleObjectsEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms687028%28v=vs.85%29.aspx
			 * DWORD WINAPI WaitForMultipleObjectsEx(
			 *   __in_  DWORD nCount,
			 *   __in_  const HANDLE *lpHandles,
			 *   __in_  BOOL bWaitAll,
			 *   __in_  DWORD dwMilliseconds,
			 *   __in_  BOOL bAlertable
			 * );
			 */
			return lib('kernel32').declare('WaitForMultipleObjectsEx', self.TYPE.ABI,
				self.TYPE.DWORD,		// return
				self.TYPE.DWORD,		// nCount
				self.TYPE.HANDLE.ptr,	// *lpHandles
				self.TYPE.BOOL,			// bWaitAll
				self.TYPE.DWORD,		// dwMilliseconds
				self.TYPE.BOOL			// bAlertable
			);
		},
		WaitForSingleObjectEx: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/ms687036(v=vs.85).aspx
			 * DWORD WINAPI WaitForSingleObjectEx(
			 *   _In_ HANDLE hHandle,
			 *    _In_ DWORD  dwMilliseconds,
			 *   _In_ BOOL   bAlertable
			 * );
			 */
			return lib('kernel32').declare('WaitForSingleObjectEx', self.TYPE.ABI,
				self.TYPE.DWORD,	// return
				self.TYPE.HANDLE,	// hHandle
				self.TYPE.DWORD,	// dwMilliseconds
				self.TYPE.BOOL		// bAlertable
			);
		},
		waveInAddBuffer: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743838(v=vs.85).aspx
			 * MMRESULT waveInAddBuffer(
			 *    HWAVEIN   hwi,
			 *    LPWAVEHDR pwh,
			 *    UINT      cbwh
			 * );
			 */
			return lib('winmm').declare('waveInAddBuffer', self.TYPE.ABI,
				self.TYPE.MMRESULT,		// return
				self.TYPE.HWAVEIN,		// hwi
				self.TYPE.LPWAVEHDR,	// pwh
				self.TYPE.UINT			// cbwh
			);
		},
		waveInClose: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743840(v=vs.85).aspx
			 * MMRESULT waveInClose(
			 *    HWAVEIN hwi
			 * );
			 */
			return lib('winmm').declare('waveInClose', self.TYPE.ABI,
				self.TYPE.MMRESULT,		// return
				self.TYPE.HWAVEIN		// hwi
			);
		},
		waveInGetDevCaps: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743841(v=vs.85).aspx
			 * MMRESULT waveInGetDevCaps(
			 *    UINT_PTR     uDeviceID,
			 *    LPWAVEINCAPS pwic,
			 *    UINT         cbwic
			 * );
			 */
			return lib('winmm').declare(ifdef_UNICODE ? 'waveInGetDevCapsW' : 'waveInGetDevCapsA', self.TYPE.ABI,
				self.TYPE.MMRESULT,		// return
				self.TYPE.UINT_PTR,		// uDeviceID
				self.TYPE.LPWAVEINCAPS,	// pwic
				self.TYPE.UINT_PTR		// cbwic
			);
		},
		waveInGetErrorText: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743842(v=vs.85).aspx
			 * MMRESULT waveInGetErrorText(
			 *    MMRESULT mmrError,
			 *    LPTSTR   pszText,
			 *    UINT     cchText
			 * );
			*/
			return lib('winmm').declare(ifdef_UNICODE ? 'waveInGetErrorTextW' : 'waveInGetErrorTextA', self.TYPE.ABI,
				self.TYPE.MMRESULT,		// return
				self.TYPE.MMRESULT,		// mmrError
				self.TYPE.LPTSTR,		// pszText
				self.TYPE.UINT			// cchText
			);
		},
		waveInGetNumDevs: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743844(v=vs.85).aspx
			 * UINT waveInGetNumDevs(void);
			 */
			return lib('winmm').declare('waveInGetNumDevs', self.TYPE.ABI,
				self.TYPE.UINT		// return
			);
		},
		waveInOpen: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743847(v=vs.85).aspx
			 * MMRESULT waveInOpen(
			 *    LPHWAVEIN       phwi,
			 *    UINT            uDeviceID,
			 *    LPCWAVEFORMATEX pwfx,
			 *    DWORD_PTR       dwCallback,
			 *    DWORD_PTR       dwCallbackInstance,
			 *    DWORD           fdwOpen
			 * );
			 */
			return lib('winmm').declare('waveInOpen', self.TYPE.ABI,
				self.TYPE.MMRESULT,			// return
				self.TYPE.LPHWAVEIN,		// phwi
				self.TYPE.UINT,				// uDeviceID
				self.TYPE.LPCWAVEFORMATEX,	// pwfx
				self.TYPE.DWORD_PTR,		// dwCallback
				self.TYPE.DWORD_PTR,		// dwCallbackInstance
				self.TYPE.DWORD				// fdwOpen
			);
		},
		waveInPrepareHeader: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743848(v=vs.85).aspx
			 * MMRESULT waveInPrepareHeader(
			 *    HWAVEIN   hwi,
			 *    LPWAVEHDR pwh,
			 *    UINT      cbwh
			 * );
			 */
			return lib('winmm').declare('waveInPrepareHeader', self.TYPE.ABI,
				self.TYPE.MMRESULT,		// return
				self.TYPE.HWAVEIN,		// hwi
				self.TYPE.LPWAVEHDR,	// pwh
				self.TYPE.UINT			// cbwh
			);
		},
		waveInStart: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743851(v=vs.85).aspx
			 * MMRESULT waveInStart(
			 *    HWAVEIN hwi
			 * );
			 */
			return lib('winmm').declare('waveInStart', self.TYPE.ABI,
				self.TYPE.MMRESULT,		// return
				self.TYPE.HWAVEIN		// hwi
			);
		},
		waveInStop: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743852(v=vs.85).aspx
			 * MMRESULT waveInStop(
			 *    HWAVEIN hwi
			 * );
			 */
			return lib('winmm').declare('waveInStop', self.TYPE.ABI,
				self.TYPE.MMRESULT,		// return
				self.TYPE.HWAVEIN		// hwi
			);
		},
		waveInUnprepareHeader: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/dd743853(v=vs.85).aspx
			 * MMRESULT waveInUnprepareHeader(
			 *    HWAVEIN   hwi,
			 *    LPWAVEHDR pwh,
			 *    UINT      cbwh
			 * );
			 */
			return lib('winmm').declare('waveInUnprepareHeader', self.TYPE.ABI,
				self.TYPE.MMRESULT,		// return
				self.TYPE.HWAVEIN,		// hwi
				self.TYPE.LPWAVEHDR,	// pwh
				self.TYPE.UINT			// cbwh
		 	);
		},
		WriteFile: function() {
			/* https://msdn.microsoft.com/en-us/library/windows/desktop/aa365747%28v=vs.85%29.aspx
			 * BOOL WINAPI WriteFile(
			 *   __in_        HANDLE       hFile,
			 *   __in_        LPCVOID      lpBuffer,
			 *   __in_        DWORD        nNumberOfBytesToWrite,
			 *   __out_opt_   LPDWORD      lpNumberOfBytesWritten,
			 *   __inout_opt_ LPOVERLAPPED lpOverlapped
			 * );
			 */
			return lib('kernel32').declare('WriteFile', self.TYPE.ABI,
				self.TYPE.BOOL,			// return
				self.TYPE.HANDLE,		// hFile
				self.TYPE.LPCVOID,		// lpBuffer
				self.TYPE.DWORD,		// nNumberOfBytesToWrite
				self.TYPE.LPDWORD,		// lpNumberOfBytesWritten
				self.TYPE.LPOVERLAPPED	// lpOverlapped
			);
		},
    	WriteFileEx: function() {
	      /* https://msdn.microsoft.com/en-us/library/windows/desktop/aa365748(v=vs.85).aspx
	       * BOOL WINAPI WriteFileEx(
	       *   _In_      HANDLE                          hFile,
	       *   _In_opt_  LPVOID                          lpBuffer,
	       *   _In_      DWORD                           nNumberOfBytesToWrite,
	       *   _Inout_   LPOVERLAPPED                    lpOverlapped,
	       *   _In_      LPOVERLAPPED_COMPLETION_ROUTINE lpCompletionRoutine
	       * );
	       */
	      return lib('kernel32').declare('WriteFileEx', self.TYPE.ABI,
	        self.TYPE.BOOL,                             // return
	        self.TYPE.HANDLE,                           // hFile
	        self.TYPE.LPVOID,                           // lpBuffer
	        self.TYPE.DWORD,                            // nNumberOfBytesToRead
	        self.TYPE.LPOVERLAPPED,		                  // lpNumberOfBytesWritten
	        self.TYPE.LPOVERLAPPED_COMPLETION_ROUTINE	  // lpOverlapped
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
		checkHRESULT: function(hr /*HRESULT*/, funcName /*jsStr*/) {
			// https://msdn.microsoft.com/en-us/library/windows/desktop/ff485842%28v=vs.85%29.aspx
			// throws if bad hresult
			var primitiveHR = parseInt(cutils.jscGetDeepest(hr))
			if (cutils.jscEqual(primitiveHR, ostypes.CONST.S_FALSE)) {
				console.error('SPECIAL HRESULT FAIL RESULT!!!', 'HRESULT is 1!!! hr:', hr, 'funcName:', funcName);
			} else if (primitiveHR < 0) {
				// FAILED macro does this, linked from the msdn page at top of this func
				console.error('HRESULT', hr, 'returned from function', funcName, 'getStrOfResult:', self.HELPER.getStrOfResult(primitiveHR));
				throw new Error('HRESULT ' + hr + ' returned from function ' + funcName + ' getStrOfResult:' + JSON.stringify(self.HELPER.getStrOfResult(primitiveHR)));
			} // else then it was success
		},
		checkHR: function(hr, str) {
			// does not throw, just returns 1 if success, if success but not fail it returns -1, else 0
			var primitiveHR = parseInt(cutils.jscGetDeepest(hr))
			if (primitiveHR === ostypes.CONST.S_OK) {
				if (str) { console.log('HR SUCCEEDED ::' , str + ':', 'S_OK'); }
				return 1;
			} else if (primitiveHR === ostypes.CONST.S_FALSE) {
				// special fail result - meaning success possibly
				if (str) { console.warn('WARN - didnt succeed BUT didnt fail:', str + ':', hr, hr.toString(), self.HELPER.getStrOfResult(primitiveHR)); }
				return -1;
			} else if (primitiveHR < 0) {
				if (str) { console.error('HR FAILED :: ', str + ':', hr, hr.toString(), self.HELPER.getStrOfResult(primitiveHR)); }
				return 0;
			}
		},
		getStrOfResult: function(PrimitiveJS_RESULT) {
			var rezObj = {}
			PrimitiveJS_RESULT = PrimitiveJS_RESULT >>> 0;
			rezObj.strPrim = '0x' + PrimitiveJS_RESULT.toString(16);
			// dear amo-reviewer: this is in dev mode only, so it is sync xhr, it is not used in production mode
			if (!WIN32_ERROR_STR) {
				WIN32_ERROR_STR = JSON.parse(ostypesSyncXhrText('https://gist.githubusercontent.com/Noitidart/92752ec9c415dd20ab7e28fba1ce00e0/raw/'));
			}
			for (var group in WIN32_ERROR_STR) {
				for (var str in WIN32_ERROR_STR[group]) {
					//console.error(WIN32_ERROR_STR[group][str], PrimativeJS_RESULT, str);
					if (WIN32_ERROR_STR[group][str] == PrimitiveJS_RESULT) {
						rezObj[group] = str;
						break;
					}
				}
			}
			return rezObj;
		},
		CLSIDFromString: function(lpsz /*jsStr*/) {
			// lpsz should look like: "886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99" no quotes
			var GUID_or_IID = self.TYPE.GUID();

			var pieces = lpsz.split('-');

			GUID_or_IID.Data1 = parseInt(pieces[0], 16);
			GUID_or_IID.Data2 = parseInt(pieces[1], 16);
			GUID_or_IID.Data3 = parseInt(pieces[2], 16);

			var piece34 = pieces[3] + '' + pieces[4];

			for (var i=0; i<8; i++) {
			  GUID_or_IID.Data4[i] = parseInt(piece34.substr(i*2,2), 16);
			};

			return GUID_or_IID;
		},
		CLSIDFromArr: function(aArr) {
			// aArr should be like this:
			// [0x56fdf344,0xfd6d,0x11d0,[0x95,0x8a,0x0,0x60,0x97,0xc9,0xa0,0x90]]
			var GUID_or_IID = self.TYPE.GUID();
			GUID_or_IID.Data1 = aArr[0];
			GUID_or_IID.Data2 = aArr[1];
			GUID_or_IID.Data3 = aArr[2];
			GUID_or_IID.Data4 = self.TYPE.BYTE.array()(aArr[3]);

			return GUID_or_IID;
		},
		IPropertyStore_SetValue: function(vtblPpsPtr, pps/*IPropertyStore*/, pkey/*REFPROPERTYKEY*/, pszValue/*PCWSTR*/) {
			// from: http://blogs.msdn.com/b/oldnewthing/archive/2011/06/01/10170113.aspx
			// for strings!! InitPropVariantFromString
			// returns hr of SetValue, but if hr of it failed it will throw, so i dont have to check the return value

			var ppropvar = self.TYPE.PROPVARIANT();

			var hr_InitPropVariantFromString = self.HELPER.InitPropVariantFromString(pszValue, ppropvar.address());
			self.HELPER.checkHRESULT(hr_InitPropVariantFromString, 'failed InitPropVariantFromString'); //this will throw if HRESULT is bad

			var hr_SetValue = pps.SetValue(vtblPpsPtr, pkey, ppropvar.address());
			self.HELPER.checkHRESULT(hr_SetValue, 'IPropertyStore_SetValue');

			var rez_PropVariantClear = self.API('PropVariantClear')(ppropvar.address());
			// console.info('rez_PropVariantClear:', rez_PropVariantClear, rez_PropVariantClear.toString(), uneval(rez_PropVariantClear));

			return hr_SetValue;
		},
		IPropertyStore_GetValue: function(vtblPpsPtr, pps/*IPropertyStore*/, pkey/*REFPROPERTYKEY*/, ppropvar /*PROPVARIANT*/ /* or null if you want jsstr returned */) {
			// currently setup for String propvariants only, meaning  key pwszVal is populated
			// returns hr of GetValue if a ostypes.PROPVARIANT() is supplied as ppropvar arg
			// returns jsstr if ppropvar arg is not supplied (creates a temp propvariant and clears it for function use)

			var ret_js = false;
			if (!ppropvar) {
				ppropvar = self.TYPE.PROPVARIANT();
				ret_js = true;
			}

			//console.info('pps.GetValue', pps.GetValue);
			var hr_GetValue = pps.GetValue(vtblPpsPtr, pkey, ppropvar.address());
			self.HELPER.checkHRESULT(hr_GetValue, 'IPropertyStore_GetValue');

			//console.info('ppropvar:', ppropvar.toString(), uneval(ppropvar));

			if (ret_js) {
				//console.info('ppropvar.pwszVal:', ppropvar.pwszVal.toString(), uneval(ppropvar.pwszVal));
				var jsstr;
				if (ppropvar.pwszVal.isNull()) {
					console.log('ppropvar.pwszVal is NULL so blank string was found');
					jsstr = '';
				} else {
					jsstr = ppropvar.pwszVal.readStringReplaceMalformed();
				}

				var rez_PropVariantClear = self.API('PropVariantClear')(ppropvar.address());
				//console.info('rez_PropVariantClear:', rez_PropVariantClear.toString(), uneval(rez_PropVariantClear));

				return jsstr;
			} else {
				// console.warn('remember to clear the PROPVARIANT yourself then');
				return hr_GetValue;
			}
		},
		InitPropVariantFromString: function(psz/*PCWSTR*/, ppropvar/*PROPVARIANT.ptr*/) {
			/* http://msdn.microsoft.com/en-us/library/windows/desktop/bb762305%28v=vs.85%29.aspx
			 * NOTE1: I have to write my own InitPropVariantFromString because its not in a dll its defined in a header
			 * NOTE2: When using this see notes on MSDN doc page chat of PROPVARIANT ( http://msdn.microsoft.com/en-us/library/windows/desktop/aa380072%28v=vs.85%29.aspx )this guy says: "VT_LPWSTR must be allocated with CoTaskMemAlloc :: (Presumably this also applies to VT_LPSTR) VT_LPWSTR is described as being a string pointer with no information on how it is allocated. You might then assume that the PROPVARIANT doesn't own the string and just has a pointer to it, but you'd be wrong. In fact, the string stored in a VT_LPWSTR PROPVARIANT must be allocated using CoTaskMemAlloc and be freed using CoTaskMemFree. Evidence for this: Look at what the inline InitPropVariantFromString function does: It sets a VT_LPWSTR using SHStrDupW, which in turn allocates the string using CoTaskMemAlloc. Knowing that, it's obvious that PropVariantClear is expected to free the string using CoTaskMemFree. I can't find this explicitly documented anywhere, which is a shame, but step through this code in a debugger and you can confirm that the string is freed by PropVariantClear: ```#include <Propvarutil.h>	int wmain(int argc, TCHAR *lpszArgv[])	{	PROPVARIANT pv;	InitPropVariantFromString(L"Moo", &pv);	::PropVariantClear(&pv);	}```  If  you put some other kind of string pointer into a VT_LPWSTR PROPVARIANT your program is probably going to crash."
			 * HRESULT InitPropVariantFromString(
			 *   __in_   PCWSTR psz,
			 *   __out_  PROPVARIANT *ppropvar
			 * );
			 */
			// SHStrDup uses CoTaskMemAlloc to allocate the strin so is true to the noe from MSDN
			var hr_SHStrDup = self.API('SHStrDup')(psz, ppropvar.contents.pwszVal.address()); //note in PROPVARIANT defintion `pwszVal` is defined as `LPWSTR` and `SHStrDup` expects second arg as `LPTSTR.ptr` but both `LPTSTR` and `LPWSTR` are defined the same with `ctypes.jschar` so this should be no problem // after learnin that LPTSTR is wchar when ifdef_UNICODE and i have ifdef_UNICODE set to true so they are the same
			// console.info('hr_SHStrDup:', hr_SHStrDup.toString(), uneval(hr_SHStrDup));

			// console.log('propvarPtr.contents.pwszVal', propvarPtr.contents.pwszVal);
			self.HELPER.checkHRESULT(hr_SHStrDup, 'InitPropVariantFromString -> hr_SHStrDup'); // this will throw if HRESULT is bad

			ppropvar.contents.vt = self.CONST.VT_LPWSTR;

			return hr_SHStrDup;
		},
		MAKELANGID: function(p, s) {
			// MACRO: https://github.com/wine-mirror/wine/blob/b1ee60f22fbd6b854c3810a89603458ec0585369/include/winnt.h#L2180
			// #define MAKELANGID(p, s) ((((WORD)(s))<<10) | (WORD)(p))

			// p is js int
			// s is js int
			return ((((s))<<10) | (p));
		},
		SafeRelease: function(ppT, varName) {
			// https://msdn.microsoft.com/en-us/library/windows/desktop/dd940435(v=vs.85).aspx
			// this is my version, i nullify the ctypes pointer so i can future test it - as doing .Release does not nullify the pointer, which can cause me to think its alive and .Release on it again, which will cause it to crash
			// the msdn version is just to avoid dangling pointer. but for me, because i do try-finally blocks i ensure not to double .Release to avoid crash, and its nice to know that it really is no longer there
			// ppt is an inst. so like inst = ostypes.TYPE.ITaskbarList.ptr() so this means it has inst.contents.lpVtbl.contents
			// varName is my added argument, msdn doesnt, i do it for console.log purposes
			if (ppT && !ppT.isNull()) { // make sure it is not undefined
				var ref_cnt = ppT.contents.lpVtbl.contents.Release(ppT);
				console.log(varName + '->Release:', cutils.jscGetDeepest(ref_cnt));
				ppT.address().contents = ppT.constructor(0);
			}
			if (ppT && ppT.isNull()) { console.warn(varName + '->Release will not be done as it is isNull() - it was probably already released'); } // dev line, remove on production
		},
		IsEqualGUID: function(guid1, guid2) {
			// args can be either CData GUID or a js arr like [1,2,3,[1,2,3,4,5,6,7,8]]
			// returns true if both match, uses cutils.jscEqual for equality
			var jsguid1;
			if (Array.isArray(guid1)) {
				jsguid1 = guid1;
			} else {
				jsguid1 = [guid1.Data1, guid1.Data2, guid1.Data3, [guid1.Data4[0], guid1.Data4[1], guid1.Data4[2], guid1.Data4[3], guid1.Data4[4], guid1.Data4[5], guid1.Data4[6], guid1.Data4[7]]];
			}
			var jsguid2;
			if (Array.isArray(guid2)) {
				jsguid2 = guid2;
			} else {
				jsguid2 = [guid2.Data1, guid2.Data2, guid2.Data3, [guid2.Data4[0], guid2.Data4[1], guid2.Data4[2], guid2.Data4[3], guid2.Data4[4], guid2.Data4[5], guid2.Data4[6], guid2.Data4[7]]];
			}

			for (var i=0; i<11; i++) {
				if (i < 3) {
					if (!cutils.jscEqual(jsguid1[i], jsguid2[i])) {
						return false;
					}
				} else {
					if (!cutils.jscEqual(jsguid1[3][i - 3], jsguid2[3][i - 3])) {
						return false;
					}
				}
			}
			return true;
		}
	};

	// ADVANCED HELPER CONST - constants that are defined by using HELPER functions and also SIMPLE constants

	this.CONST.CLSID_SHELLLINK = this.HELPER.CLSIDFromString('00021401-0000-0000-C000-000000000046');
	this.CONST.IID_ISHELLLINK = this.HELPER.CLSIDFromString('000214F9-0000-0000-C000-000000000046');
	this.CONST.IID_IPERSISTFILE = this.HELPER.CLSIDFromString('0000010b-0000-0000-C000-000000000046');
	this.CONST.IID_IPROPERTYSTORE = this.HELPER.CLSIDFromString('886d8eeb-8cf2-4446-8d02-cdba1dbdcf99');

	// formatID and propID are from https://msdn.microsoft.com/en-us/library/dd391569%28v=vs.85%29.aspx
	this.CONST.FORMAT_ID_APPUSERMODEL = this.HELPER.CLSIDFromString('9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3');

	this.CONST.PKEY_APPUSERMODEL_ID = this.TYPE.PROPERTYKEY(this.CONST.FORMAT_ID_APPUSERMODEL, 5);
	this.CONST.PKEY_APPUSERMODEL_RELAUNCHCOMMAND = this.TYPE.PROPERTYKEY(this.CONST.FORMAT_ID_APPUSERMODEL, 2);
	this.CONST.PKEY_APPUSERMODEL_RELAUNCHDISPLAYNAMERESOURCE = this.TYPE.PROPERTYKEY(this.CONST.FORMAT_ID_APPUSERMODEL, 4);
	this.CONST.PKEY_APPUSERMODEL_RELAUNCHICONRESOURCE = this.TYPE.PROPERTYKEY(this.CONST.FORMAT_ID_APPUSERMODEL, 3);
}

var ostypes = new winInit();

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

function ostypesSyncXhrText(url) {
	// xhr's the url and returns the text response
	if (this.DedicatedWorkerGlobalScope) {
		var req = new XMLHttpRequest();
	} else {
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
		var req = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
	}
	req.open('GET', url, false); // 3rd arg is false for synchronus
	req.send();
	return req.response;
}
