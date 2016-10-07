/*** CTypes Utilities ***
 * Stuff that I find useful in my CTypes work under all Operating Systems
 */

Components.utils.import('resource://gre/modules/ctypes.jsm');


var EXPORTED_SYMBOLS = ['cutils'];

if (ctypes.voidptr_t.size == 4 /* 32-bit */) {
	var is64bit = false;
} else if (ctypes.voidptr_t.size == 8 /* 64-bit */) {
	var is64bit = true;
} else {
	throw new Error('huh??? not 32 or 64 bit?!?!');
}

function utilsInit() {
	// start - comparison stuff
	// https://gist.github.com/Noitidart/1ae3ff204dbe5c46befa - rev1
	this.jscGetDeepest = function(obj, castVoidptrAsDecOrAsHex) {
		// set castVoidptrAsDecOrAsHex to 10 (AsDec) or 16 (AsHex). 10 is same as doing .toString() -- see link118489111
			// by default it will not. so if you do jscGetDeepest on ```ctypes.voidptr_t(ctypes.UInt64("0x1148"))``` it will give you ```ctypes.voidptr_t(ctypes.UInt64("0x1148")).toString``` which is "ctypes.voidptr_t(ctypes.UInt64("0x1148"))"
				// console.log results
				// hFile.toString()					--> ctypes.voidptr_t(ctypes.UInt64("0xffffffff"))
				// cutils.jscGetDeepest(hFile)		--> ctypes.voidptr_t(ctypes.UInt64("0xffffffff"))
				// cutils.jscGetDeepest(hFile, 10)	--> 4294967295
				// cutils.jscGetDeepest(hFile, 16)	--> ffffffff
			// this argument means if at deepest level, it finds it has .contents but cannot access .contents on it, then it will get the number that pointer is pointing to (of course if its a ctype [meaning a cdata], meaning if its just an object with a .contents it wont do it on that)
		/*
		if (obj !== null && obj !== undefined) {
			console.log('trying on:', obj.toString())
		}
		*/
		var lastTypeof = typeof(obj);
		while ((lastTypeof == 'function' || lastTypeof == 'object') && ('contents' in obj || 'value' in obj)) { // the first part tests if i can use `in obj`
			if ('contents' in obj) {
				if (obj.constructor.targetType && obj.constructor.targetType.size === undefined) {
					// this avoids the error of like ctypes.voidptr_t(ctypes.UInt64("0x204")).contents as this will throw "Error: cannot get contents of undefined size" ---- link118489111
					if (castVoidptrAsDecOrAsHex && obj instanceof ctypes.CData) { // because if it has a .contents it got there, so its something like ```ctypes.voidptr_t(ctypes.UInt64("0x1148"))```, so we want  that number so we do this. ```ctypes.cast(a, ctypes.uintptr_t).value.toString()``` gives us ```4424``` while ```ctypes.cast(a, ctypes.uintptr_t).value.toString(16)``` gives us the exact same hex number we see in a.toString() so it gives us ```1148``` (notice the no prefix of 0x). so by default it is toString(10)
						obj = ctypes.cast(obj, ctypes.uintptr_t).value.toString(castVoidptrAsDecOrAsHex);
					}
					break;
				} else {
					obj = obj.contents;
				}
			} else if ('value' in obj) {
				try {
					// this avoids the error of like ctypes.voidptr_t(ctypes.UInt64("0x204")).value as this will throw "TypeError: .value only works on character and numeric types, not `ctypes.voidptr_t`"
					obj = obj.value;
				} catch(ignore) {
					break;
				}
			}
			// this style assumes that if it has .contents (either undefined or not) it is impoosible that it has a .value
			lastTypeof = typeof(obj)
		}
		if (obj && obj.toString) {
			obj = obj.toString();
		}
		return obj;
	};

	this.jscEqual = function(obj1, obj2, castVoidptrAsDecOrAsHex) {
		// ctypes numbers equal
		// compares obj1 and obj2
		// if equal returns true, else returns false

		// check if equal first
		var str1 = obj1;
		var str2 = obj2;

		var str1 = this.jscGetDeepest(str1, castVoidptrAsDecOrAsHex); //cuz apparently its not passing by reference
		var str2 = this.jscGetDeepest(str2, castVoidptrAsDecOrAsHex); //cuz apparently its not passing by reference

		//console.info('comparing:', str1, str2);

		if (str1 == str2) {
			return true;
		} else {
			return false;
		}
	};
	// end - comparison stuff

	// start - mem stuff mimicking
	this.memset = function(array, val, size) {
		/* http://stackoverflow.com/questions/24466228/memset-has-no-dll-so-how-ctype-it
		 * https://gist.github.com/nmaier/ab4bfe59e8c8fcdc5b90
		 * https://gist.github.com/Noitidart/2d9b44b18493f9339629
		 * Note that size is the number of array elements to set, not the number of bytes.
		 * by @nmaier
		 */
		for (var i = 0; i < size; ++i) {
			array[i] = val;
		}
	};

	this.memcpy = function(dst, src, size) {
		/* https://gist.github.com/nmaier/ab4bfe59e8c8fcdc5b90
		 * This would be in theory good enough and is a reasonable memcpy implementation
		 * (although we could test if both arrays are the same and skip the copy in that case).
		 *
		 * But we want memmove, which makes sure that if the arrays overlap data will be still
		 * copied correctly. To do that, we need to compare the addresses and if src.address() < dst.address() then
		 * we'll need to copy back to front, else if src.address() < dst.address() then copy front to back, or
		 * if both are equal, it is actually the same array and we can skip the copy.
		 * by @nmaier
		 */
		if (!dst.constructor.elementType &&
			dst.constructor.elementType != src.constructor.elementType) {
				throw Error("Invalid CType: not an array, or array type mismatch");
		}
		for (var i = 0; i < size; ++i) {
			dst[i] = src[i];
		}
	};

	this.comparePointers = function(a, b) {
		/* https://gist.github.com/nmaier/ab4bfe59e8c8fcdc5b90
		 */
		return ctypes.UInt64.compare(
			ctypes.cast(a, ctypes.uintptr_t).value,
			ctypes.cast(b, ctypes.uintptr_t).value
		);
	};

	this.memmove = function(dst, src, size) {
		/* https://gist.github.com/nmaier/ab4bfe59e8c8fcdc5b90
		 * by @nmaier
		 */
		if (!dst.constructor.elementType &&
			dst.constructor.elementType != src.constructor.elementType) {
				throw Error("Invalid CType: not an array, or array type mismatch");
		}
		let cmp = comparePointers(src.address(), dst.address());
		if (cmp == 0) {
			// arrays point to the same memory location == are the same; skip
			return;
		}
		if (cmp < 0) { // src < dst -> back to front
			for (var i = size - 1; i >= 0; --i) {
				dst[i] = src[i];
			}
			return;
		}
		// else; src > dst -> front to back
		for (var i = 0; i < size; ++i) {
			dst[i] = src[i];
		}
	};
	// end - mem stuff mimicking

	// start - my alternative to .readStringReplaceMalformed
	this.readAsChar8ThenAsChar16 = function(stringPtr, known_len, jschar) {
		// when reading as jschar it assumes max length of 500

		// stringPtr is either char or jschar, if you know its jschar for sure, pass 3rd arg as true
		// if known_len is passed, then assumption is not made, at the known_len position in array we will see a null char
		// i tried getting known_len from stringPtr but its not possible, it has be known, i tried this:
			//"stringPtr.contents.toString()" "95"
			//"stringPtr.toString()" "ctypes.unsigned_char.ptr(ctypes.UInt64("0x7f73d5c87650"))"
			// so as we see neither of these is 77, this is for the example of "_scratchpad/EnTeHandle.js at master · Noitidart/_scratchpad - Mozilla Firefox"

		// tries to do read string on stringPtr, if it fails then it falls to read as jschar

		var readJSCharString = function() {
			var assumption_max_len = known_len ? known_len : 500;
			var ptrAsArr = ctypes.cast(stringPtr, ctypes.unsigned_char.array(assumption_max_len).ptr).contents; // MUST cast to unsigned char (not ctypes.jschar, or ctypes.char) as otherwise i dont get foreign characters, as they are got as negative values, and i should read till i find a 0 which is null terminator which will have unsigned_char code of 0 // can test this by reading a string like this: "_scratchpad/EnTeHandle.js at master · Noitidart/_scratchpad - Mozilla Firefox" at js array position 36 (so 37 if count from 1), we see 183, and at 77 we see char code of 0 IF casted to unsigned_char, if casted to char we see -73 at pos 36 but pos 77 still 0, if casted to jschar we see chineese characters in all spots expect spaces even null terminator is a chineese character
			//console.info('ptrAsArr.length:', ptrAsArr.length);
			//console.log('debug-msg :: dataCasted:', dataCasted, uneval(dataCasted), dataCasted.toString());
			var charCode = [];
			var fromCharCode = []
			for (var i=0; i<ptrAsArr.length; i++) { //if known_len is correct, then will not hit null terminator so like in example of "_scratchpad/EnTeHandle.js at master · Noitidart/_scratchpad - Mozilla Firefox" if you pass length of 77, then null term will not get hit by this loop as null term is at pos 77 and we go till `< known_len`
				var thisUnsignedCharCode = ptrAsArr.addressOfElement(i).contents;
				if (thisUnsignedCharCode == 0) {
					// reached null terminator, break
					//console.log('reached null terminator, at pos: ', i);
					break;
				}
				charCode.push(thisUnsignedCharCode);
				fromCharCode.push(String.fromCharCode(thisUnsignedCharCode));
			}
			//console.info('charCode:', charCode);
			//console.info('fromCharCode:', fromCharCode);
			var char16_val = fromCharCode.join('');
			//console.info('char16_val:', char16_val);
			return char16_val;
		}

		if (!jschar) {
			try {
				var char8_val = stringPtr.readString();
				//console.info('stringPtr.readString():', char8_val);
				return char8_val;
			} catch (ex if ex.message.indexOf('malformed UTF-8 character sequence at offset ') == 0) {
				//console.warn('ex of offset utf8 read error when trying to do readString so using alternative method, ex:', ex);
				return readJSCharString();
			}
		} else {
			return readJSCharString();
		}
	};
	// end - my alternative to .readStringReplaceMalformed

	this.strOfPtr = function(ptr) {
		// ptr must be something.address() something can be `ctypes.int.array(5)()` or `ctypes.int()` or anything like that
		// to read this later on do: `ctypes.int.ptr(ctypes.UInt64(RETURNED_PTRSTR_OF_THIS_FUNC)).contents`

		/* EXAMPLE 1 - shows you cant pass just a `ctypes.blah.array(10)()` here as its not auto converted to ptr. if you pass this (`ctypes.blah.array(10)()`) to argument of a ctypes declared function it gets converted to a ptr im pretty sure (maybe auto converted even if in field of struct)
		 *   var events_to_monitor = ctypes.int.array(10)();
		 *   events_to_monitor.toString(); // "ctypes.int.array(10)([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])"
		 *   events_to_monitor.address().toString(); // "ctypes.int.array(10).ptr(ctypes.UInt64("0x16aca8b0"))"
		 *   events_to_monitor.addressOfElement(3).contents = 3
		 *   events_to_monitor.toString(); // "ctypes.int.array(10)([0, 0, 0, 3, 0, 0, 0, 0, 0, 0])"
		 *   var readIntArrPtr = ctypes.int.array(10).ptr(ctypes.UInt64('0x16aca8b0'));
		 *   readIntArrPtr.contents // CData { length: 10 }
		 *   readIntArrPtr.contents.toString(); // "ctypes.int.array(10)([0, 0, 0, 3, 0, 0, 0, 0, 0, 0])"
		 */

		/* EXAMPLE 2
		 *   var i = ctypes.int(10);
		 *   i.value = 5; // this just shows how you can change the number contained inside without having to do `ctypes.int(NEW_NUM_HERE)` again
		 *   i.address().toString(); // "ctypes.int.ptr(ctypes.UInt64("0x14460454"))"
		 *   var ptrStr = cutils.stringOfPtr(i.address()); // "0x14460454"
		 *   var readIntPtr = ctypes.int.ptr(ctypes.UInt64(ptrStr));
		 *   readIntPtr // CData { contents: 5 }
		 */

		/* EXAMPLE 3 - with string
		 * var a = ctypes.char.array(100).ptr(ctypes.UInt64('0x1cf1e710')); // you must know the length, like i knew it was 100
		 * a.contents.readString(); //gives you value
		 * // modify it by doing:
		 * a.contents.addressOfElement(0).contents = 97
		 * // or use cutils.modifyCStr
		 */

		var ptrStr = ptr.toString().match(/.*"(.*?)"/); // can alternatively do `'0x' + ctypes.cast(num_files.address(), ctypes.uintptr_t).value.toString(16)`

		if (!ptrStr) {
			throw new Error('Could not find address string, make sure you passed a .address(), ptr.toString() was: ' + ptr.toString());
		}

		return ptrStr[1];
	};

	this.modifyCStr =  function(ctypesCharArr, newStr_js) {
		// changes contents of a c string without changing the .address() of it
		// ctypesCharArr must be at least newStr_js.length + 1 (+1 for null terminator)
		// returns nothing, this acts on the ctypesCharArr itself

		/* EXAMPLE
		var cstr = ctypes.char.array(100)('hi');
		cstr.address().toString(); // "ctypes.char.array(100).ptr(ctypes.UInt64("0x1440ad60"))"
		cstr.readString(); // "hi"

		cutils.modifyCStr(cstr, 'bye');
		cstr.address().toString(); // "ctypes.char.array(100).ptr(ctypes.UInt64("0x1440ad60"))"
		cstr.readString(); "bye"
		*/

		if (newStr_js.length+1 >= ctypesCharArr.length) {
			throw new Error('not enough room in ctypesCharArr for the newStr_js and its null terminator');
		}

		//console.info('pre mod readString():', ctypesCharArr.readString().toString());

		for (var i=0; i<ctypesCharArr.length; i++) {
			var charCodeAtCurrentPosition = ctypesCharArr.addressOfElement(i).contents;
			if (charCodeAtCurrentPosition != 0) {
				ctypesCharArr.addressOfElement(i).contents = 0;
			} else {
				// hit null terminator so break
				break;
			}
		}

		for (var i=0; i<newStr_js.length; i++) {
			ctypesCharArr.addressOfElement(i).contents = newStr_js.charCodeAt(i);
		}

		//console.info('post mod readString():', ctypesCharArr.readString().toString());
	};

	this.typeOfField = function(structDef, fieldName) {
		for (var i=0; i<structDef.fields.length; i++) {
			for (var f in structDef.fields[i]) {
				if (f == fieldName) {
					return structDef.fields[i][f];
				}
				break; // there is only one
			}
		}
	};

	// HollowStructure - taken from - https://dxr.mozilla.org/mozilla-central/source/toolkit/components/osfile/modules/osfile_shared_allthreads.jsm#812 - on 010816
	function osfile_shared_allthreads_Type(name, implementation) {
	  if (!(typeof name == "string")) {
		throw new TypeError("Type expects as first argument a name, got: "
							+ name);
	  }
	  if (!(implementation instanceof ctypes.CType)) {
		throw new TypeError("Type expects as second argument a ctypes.CType"+
							", got: " + implementation);
	  }
	  Object.defineProperty(this, "name", { value: name });
	  Object.defineProperty(this, "implementation", { value: implementation });
	}
	/**
	 * Utility class, used to build a |struct| type
	 * from a set of field names, types and offsets.
	 *
	 * @param {string} name The name of the |struct| type.
	 * @param {number} size The total size of the |struct| type in bytes.
	 */
	this.HollowStructure = function(name, size) {
	  if (!name) {
		throw new TypeError("HollowStructure expects a name");
	  }
	  if (!size || size < 0) {
		throw new TypeError("HollowStructure expects a (positive) size");
	  }

	  // A mapping from offsets in the struct to name/type pairs
	  // (or nothing if no field starts at that offset).
	  this.offset_to_field_info = [];

	  // The name of the struct
	  this.name = name;

	  // The size of the struct, in bytes
	  this.size = size;

	  // The number of paddings inserted so far.
	  // Used to give distinct names to padding fields.
	  this._paddings = 0;
	}
	this.HollowStructure.prototype = {
	  /**
	   * Add a field at a given offset.
	   *
	   * @param {number} offset The offset at which to insert the field.
	   * @param {string} name The name of the field.
	   * @param {CType|Type} type The type of the field.
	   */
	  add_field_at: function add_field_at(offset, name, type) {
		if (offset == null) {
		  throw new TypeError("add_field_at requires a non-null offset");
		}
		if (!name) {
		  throw new TypeError("add_field_at requires a non-null name");
		}
		if (!type) {
		  throw new TypeError("add_field_at requires a non-null type");
		}
		if (type instanceof osfile_shared_allthreads_Type) { // :note: noitidart i have to change this from `Type` to `osfile_shared_allthreads_Type` because i havent imported osfile_shared_allthreads.jsm so Type is undefined link73027490740
		  type = type.implementation;
		}
		if (this.offset_to_field_info[offset]) {
		  throw new Error("HollowStructure " + this.name +
						  " already has a field at offset " + offset);
		}
		if (offset + type.size > this.size) {
		  throw new Error("HollowStructure " + this.name +
						  " cannot place a value of type " + type +
						  " at offset " + offset +
						  " without exceeding its size of " + this.size);
		}
		let field = {name: name, type:type};
		this.offset_to_field_info[offset] = field;
	  },

	  /**
	   * Create a pseudo-field that will only serve as padding.
	   *
	   * @param {number} size The number of bytes in the field.
	   * @return {Object} An association field-name => field-type,
	   * as expected by |ctypes.StructType|.
	   */
	  _makePaddingField: function makePaddingField(size) {
		let field = ({});
		field["padding_" + this._paddings] =
		  ctypes.ArrayType(ctypes.uint8_t, size);
		this._paddings++;
		return field;
	  },

	  /**
	   * Convert this |HollowStructure| into a |Type|.
	   */
	  getType: function getType() {
		// Contents of the structure, in the format expected
		// by ctypes.StructType.
		let struct = [];

		let i = 0;
		while (i < this.size) {
		  let currentField = this.offset_to_field_info[i];
		  if (!currentField) {
			// No field was specified at this offset, we need to
			// introduce some padding.

			// Firstly, determine how many bytes of padding
			let padding_length = 1;
			while (i + padding_length < this.size
				&& !this.offset_to_field_info[i + padding_length]) {
			  ++padding_length;
			}

			// Then add the padding
			struct.push(this._makePaddingField(padding_length));

			// And proceed
			i += padding_length;
		  } else {
			// We have a field at this offset.

			// Firstly, ensure that we do not have two overlapping fields
			for (let j = 1; j < currentField.type.size; ++j) {
			  let candidateField = this.offset_to_field_info[i + j];
			  if (candidateField) {
				throw new Error("Fields " + currentField.name +
				  " and " + candidateField.name +
				  " overlap at position " + (i + j));
			  }
			}

			// Then add the field
			let field = ({});
			field[currentField.name] = currentField.type;
			struct.push(field);

			// And proceed
			i += currentField.type.size;
		  }
		}
		let result = new osfile_shared_allthreads_Type(this.name, ctypes.StructType(this.name, struct)); // :note: noitidart i have to change this from `Type` to `osfile_shared_allthreads_Type` because i havent imported osfile_shared_allthreads.jsm so Type is undefined link73027490740
		if (result.implementation.size != this.size) {
		  throw new Error("Wrong size for type " + this.name +
			  ": expected " + this.size +
			  ", found " + result.implementation.size +
			  " (" + result.implementation.toSource() + ")");
		}
		return result;
	  }
	};

	// var cutilsIter = (arr_c, actor) => { var arr = new Array(arr_c.length); arr.forEach( (_, i) => arr[i]=actor(arr_c[i]) ); return arr; } // wont work due to bug https://bugzilla.mozilla.org/show_bug.cgi?id=1287357
	this.map = function(arr_c, actor) {
		// returns a new array, with the arr_c iterated over in a way compatible with js-ctypes array (it musth ave a length, and each element must be accessible by a number) with actor
		// example: `cutils.map( [0,1,2], el=>el+10 )` will give you `Array [ 10, 11, 12 ]`
		// example with js-ctypes: `cutilsIter( ctypes.int.array()([1,2,3]), el=>el+10 )` gvies `Array [ 11, 12, 13 ]`
		var l = arr_c.length;
		var arr = new Array(l);
		for(var i=0; i<l; i++) {
			arr[i]=actor(arr_c[i]);
		}
		return arr;
	};
}

var cutils = new utilsInit();
