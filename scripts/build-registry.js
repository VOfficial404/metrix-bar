#!/usr/bin/env node
/*! Bundled dependencies: saxes 6.0.0 (ISC; https://github.com/lddubeau/saxes), xmlchars 2.2.0 (MIT; https://github.com/lddubeau/xmlchars)
The ISC License

Copyright (c) Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

====

The following license is the one that governed sax, from which saxes
was forked. Isaac Schlueter is not *directly* involved with saxes so
don't go bugging him for saxes issues.

The ISC License

Copyright (c) Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

====

`String.fromCodePoint` by Mathias Bynens is no longer used, but it can
still be found in old commits. It was once used according to terms of
MIT License, as follows:

    Copyright Mathias Bynens <https://mathiasbynens.be/>

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Copyright Louis-Dominique Dubeau and contributors to xmlchars

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
(async () => {
const { createRequire } = await import("node:module");
const require = createRequire(process.argv[1]);
// \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
let node_util = require("node:util");
let node_crypto = require("node:crypto");
let node_fs_promises = require("node:fs/promises");
let node_path = require("node:path");
node_path = __toESM(node_path, 1);
// node_modules/.pnpm/xmlchars@2.2.0/node_modules/xmlchars/xml/1.0/ed5.js
var require_ed5 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Character classes and associated utilities for the 5th edition of XML 1.0.
	*
	* @author Louis-Dominique Dubeau
	* @license MIT
	* @copyright Louis-Dominique Dubeau
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CHAR = "	\n\r -퟿-�𐀀-􏿿";
	exports.S = " 	\r\n";
	exports.NAME_START_CHAR = ":A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿";
	exports.NAME_CHAR = "-" + exports.NAME_START_CHAR + ".0-9·̀-ͯ‿-⁀";
	exports.CHAR_RE = new RegExp("^[" + exports.CHAR + "]$", "u");
	exports.S_RE = new RegExp("^[" + exports.S + "]+$", "u");
	exports.NAME_START_CHAR_RE = new RegExp("^[" + exports.NAME_START_CHAR + "]$", "u");
	exports.NAME_CHAR_RE = new RegExp("^[" + exports.NAME_CHAR + "]$", "u");
	exports.NAME_RE = new RegExp("^[" + exports.NAME_START_CHAR + "][" + exports.NAME_CHAR + "]*$", "u");
	exports.NMTOKEN_RE = new RegExp("^[" + exports.NAME_CHAR + "]+$", "u");
	var TAB = 9;
	var NL = 10;
	var CR = 13;
	var SPACE = 32;
	/** All characters in the ``S`` production. */
	exports.S_LIST = [
		SPACE,
		NL,
		CR,
		TAB
	];
	/**
	* Determines whether a codepoint matches the ``CHAR`` production.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``CHAR``.
	*/
	function isChar(c) {
		return c >= SPACE && c <= 55295 || c === NL || c === CR || c === TAB || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
	}
	exports.isChar = isChar;
	/**
	* Determines whether a codepoint matches the ``S`` (space) production.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``S``.
	*/
	function isS(c) {
		return c === SPACE || c === NL || c === CR || c === TAB;
	}
	exports.isS = isS;
	/**
	* Determines whether a codepoint matches the ``NAME_START_CHAR`` production.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``NAME_START_CHAR``.
	*/
	function isNameStartChar(c) {
		return c >= 65 && c <= 90 || c >= 97 && c <= 122 || c === 58 || c === 95 || c === 8204 || c === 8205 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 767 || c >= 880 && c <= 893 || c >= 895 && c <= 8191 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
	}
	exports.isNameStartChar = isNameStartChar;
	/**
	* Determines whether a codepoint matches the ``NAME_CHAR`` production.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``NAME_CHAR``.
	*/
	function isNameChar(c) {
		return isNameStartChar(c) || c >= 48 && c <= 57 || c === 45 || c === 46 || c === 183 || c >= 768 && c <= 879 || c >= 8255 && c <= 8256;
	}
	exports.isNameChar = isNameChar;
}));
// node_modules/.pnpm/xmlchars@2.2.0/node_modules/xmlchars/xml/1.1/ed2.js
var require_ed2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Character classes and associated utilities for the 2nd edition of XML 1.1.
	*
	* @author Louis-Dominique Dubeau
	* @license MIT
	* @copyright Louis-Dominique Dubeau
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CHAR = "-퟿-�𐀀-􏿿";
	exports.RESTRICTED_CHAR = "-\b\v\f---";
	exports.S = " 	\r\n";
	exports.NAME_START_CHAR = ":A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿";
	exports.NAME_CHAR = "-" + exports.NAME_START_CHAR + ".0-9·̀-ͯ‿-⁀";
	exports.CHAR_RE = new RegExp("^[" + exports.CHAR + "]$", "u");
	exports.RESTRICTED_CHAR_RE = new RegExp("^[" + exports.RESTRICTED_CHAR + "]$", "u");
	exports.S_RE = new RegExp("^[" + exports.S + "]+$", "u");
	exports.NAME_START_CHAR_RE = new RegExp("^[" + exports.NAME_START_CHAR + "]$", "u");
	exports.NAME_CHAR_RE = new RegExp("^[" + exports.NAME_CHAR + "]$", "u");
	exports.NAME_RE = new RegExp("^[" + exports.NAME_START_CHAR + "][" + exports.NAME_CHAR + "]*$", "u");
	exports.NMTOKEN_RE = new RegExp("^[" + exports.NAME_CHAR + "]+$", "u");
	var TAB = 9;
	var NL = 10;
	var CR = 13;
	var SPACE = 32;
	/** All characters in the ``S`` production. */
	exports.S_LIST = [
		SPACE,
		NL,
		CR,
		TAB
	];
	/**
	* Determines whether a codepoint matches the ``CHAR`` production.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``CHAR``.
	*/
	function isChar(c) {
		return c >= 1 && c <= 55295 || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
	}
	exports.isChar = isChar;
	/**
	* Determines whether a codepoint matches the ``RESTRICTED_CHAR`` production.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``RESTRICTED_CHAR``.
	*/
	function isRestrictedChar(c) {
		return c >= 1 && c <= 8 || c === 11 || c === 12 || c >= 14 && c <= 31 || c >= 127 && c <= 132 || c >= 134 && c <= 159;
	}
	exports.isRestrictedChar = isRestrictedChar;
	/**
	* Determines whether a codepoint matches the ``CHAR`` production and does not
	* match the ``RESTRICTED_CHAR`` production. ``isCharAndNotRestricted(x)`` is
	* equivalent to ``isChar(x) && !isRestrictedChar(x)``. This function is faster
	* than running the two-call equivalent.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``CHAR`` and does not match
	* ``RESTRICTED_CHAR``.
	*/
	function isCharAndNotRestricted(c) {
		return c === 9 || c === 10 || c === 13 || c > 31 && c < 127 || c === 133 || c > 159 && c <= 55295 || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
	}
	exports.isCharAndNotRestricted = isCharAndNotRestricted;
	/**
	* Determines whether a codepoint matches the ``S`` (space) production.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``S``.
	*/
	function isS(c) {
		return c === SPACE || c === NL || c === CR || c === TAB;
	}
	exports.isS = isS;
	/**
	* Determines whether a codepoint matches the ``NAME_START_CHAR`` production.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``NAME_START_CHAR``.
	*/
	function isNameStartChar(c) {
		return c >= 65 && c <= 90 || c >= 97 && c <= 122 || c === 58 || c === 95 || c === 8204 || c === 8205 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 767 || c >= 880 && c <= 893 || c >= 895 && c <= 8191 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
	}
	exports.isNameStartChar = isNameStartChar;
	/**
	* Determines whether a codepoint matches the ``NAME_CHAR`` production.
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches ``NAME_CHAR``.
	*/
	function isNameChar(c) {
		return isNameStartChar(c) || c >= 48 && c <= 57 || c === 45 || c === 46 || c === 183 || c >= 768 && c <= 879 || c >= 8255 && c <= 8256;
	}
	exports.isNameChar = isNameChar;
}));
// node_modules/.pnpm/xmlchars@2.2.0/node_modules/xmlchars/xmlns/1.0/ed3.js
var require_ed3 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Character class utilities for XML NS 1.0 edition 3.
	*
	* @author Louis-Dominique Dubeau
	* @license MIT
	* @copyright Louis-Dominique Dubeau
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NC_NAME_START_CHAR = "A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿";
	exports.NC_NAME_CHAR = "-" + exports.NC_NAME_START_CHAR + ".0-9·̀-ͯ‿-⁀";
	exports.NC_NAME_START_CHAR_RE = new RegExp("^[" + exports.NC_NAME_START_CHAR + "]$", "u");
	exports.NC_NAME_CHAR_RE = new RegExp("^[" + exports.NC_NAME_CHAR + "]$", "u");
	exports.NC_NAME_RE = new RegExp("^[" + exports.NC_NAME_START_CHAR + "][" + exports.NC_NAME_CHAR + "]*$", "u");
	/**
	* Determines whether a codepoint matches [[NC_NAME_START_CHAR]].
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches.
	*/
	function isNCNameStartChar(c) {
		return c >= 65 && c <= 90 || c === 95 || c >= 97 && c <= 122 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 767 || c >= 880 && c <= 893 || c >= 895 && c <= 8191 || c >= 8204 && c <= 8205 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
	}
	exports.isNCNameStartChar = isNCNameStartChar;
	/**
	* Determines whether a codepoint matches [[NC_NAME_CHAR]].
	*
	* @param c The code point.
	*
	* @returns ``true`` if the codepoint matches.
	*/
	function isNCNameChar(c) {
		return isNCNameStartChar(c) || c === 45 || c === 46 || c >= 48 && c <= 57 || c === 183 || c >= 768 && c <= 879 || c >= 8255 && c <= 8256;
	}
	exports.isNCNameChar = isNCNameChar;
}));
// scripts/dashboard-registry.mjs
var import_saxes = (/* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SaxesParser = exports.EVENTS = void 0;
	const ed5 = require_ed5();
	const ed2 = require_ed2();
	const NSed3 = require_ed3();
	var isS = ed5.isS;
	var isChar10 = ed5.isChar;
	var isNameStartChar = ed5.isNameStartChar;
	var isNameChar = ed5.isNameChar;
	var S_LIST = ed5.S_LIST;
	var NAME_RE = ed5.NAME_RE;
	var isChar11 = ed2.isChar;
	var isNCNameStartChar = NSed3.isNCNameStartChar;
	var isNCNameChar = NSed3.isNCNameChar;
	var NC_NAME_RE = NSed3.NC_NAME_RE;
	const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
	const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
	const rootNS = {
		__proto__: null,
		xml: XML_NAMESPACE,
		xmlns: XMLNS_NAMESPACE
	};
	const XML_ENTITIES = {
		__proto__: null,
		amp: "&",
		gt: ">",
		lt: "<",
		quot: "\"",
		apos: "'"
	};
	const EOC = -1;
	const NL_LIKE = -2;
	const S_BEGIN = 0;
	const S_BEGIN_WHITESPACE = 1;
	const S_DOCTYPE = 2;
	const S_DOCTYPE_QUOTE = 3;
	const S_DTD = 4;
	const S_DTD_QUOTED = 5;
	const S_DTD_OPEN_WAKA = 6;
	const S_DTD_OPEN_WAKA_BANG = 7;
	const S_DTD_COMMENT = 8;
	const S_DTD_COMMENT_ENDING = 9;
	const S_DTD_COMMENT_ENDED = 10;
	const S_DTD_PI = 11;
	const S_DTD_PI_ENDING = 12;
	const S_TEXT = 13;
	const S_ENTITY = 14;
	const S_OPEN_WAKA = 15;
	const S_OPEN_WAKA_BANG = 16;
	const S_COMMENT = 17;
	const S_COMMENT_ENDING = 18;
	const S_COMMENT_ENDED = 19;
	const S_CDATA = 20;
	const S_CDATA_ENDING = 21;
	const S_CDATA_ENDING_2 = 22;
	const S_PI_FIRST_CHAR = 23;
	const S_PI_REST = 24;
	const S_PI_BODY = 25;
	const S_PI_ENDING = 26;
	const S_XML_DECL_NAME_START = 27;
	const S_XML_DECL_NAME = 28;
	const S_XML_DECL_EQ = 29;
	const S_XML_DECL_VALUE_START = 30;
	const S_XML_DECL_VALUE = 31;
	const S_XML_DECL_SEPARATOR = 32;
	const S_XML_DECL_ENDING = 33;
	const S_OPEN_TAG = 34;
	const S_OPEN_TAG_SLASH = 35;
	const S_ATTRIB = 36;
	const S_ATTRIB_NAME = 37;
	const S_ATTRIB_NAME_SAW_WHITE = 38;
	const S_ATTRIB_VALUE = 39;
	const S_ATTRIB_VALUE_QUOTED = 40;
	const S_ATTRIB_VALUE_CLOSED = 41;
	const S_ATTRIB_VALUE_UNQUOTED = 42;
	const S_CLOSE_TAG = 43;
	const S_CLOSE_TAG_SAW_WHITE = 44;
	const TAB = 9;
	const NL = 10;
	const CR = 13;
	const SPACE = 32;
	const BANG = 33;
	const DQUOTE = 34;
	const AMP = 38;
	const SQUOTE = 39;
	const MINUS = 45;
	const FORWARD_SLASH = 47;
	const SEMICOLON = 59;
	const LESS = 60;
	const EQUAL = 61;
	const GREATER = 62;
	const QUESTION = 63;
	const OPEN_BRACKET = 91;
	const CLOSE_BRACKET = 93;
	const NEL = 133;
	const LS = 8232;
	const isQuote = (c) => c === DQUOTE || c === SQUOTE;
	const QUOTES = [DQUOTE, SQUOTE];
	const DOCTYPE_TERMINATOR = [
		...QUOTES,
		OPEN_BRACKET,
		GREATER
	];
	const DTD_TERMINATOR = [
		...QUOTES,
		LESS,
		CLOSE_BRACKET
	];
	const XML_DECL_NAME_TERMINATOR = [
		EQUAL,
		QUESTION,
		...S_LIST
	];
	const ATTRIB_VALUE_UNQUOTED_TERMINATOR = [
		...S_LIST,
		GREATER,
		AMP,
		LESS
	];
	function nsPairCheck(parser, prefix, uri) {
		switch (prefix) {
			case "xml":
				if (uri !== XML_NAMESPACE) parser.fail(`xml prefix must be bound to ${XML_NAMESPACE}.`);
				break;
			case "xmlns": if (uri !== XMLNS_NAMESPACE) parser.fail(`xmlns prefix must be bound to ${XMLNS_NAMESPACE}.`);
		}
		switch (uri) {
			case XMLNS_NAMESPACE:
				parser.fail(prefix === "" ? `the default namespace may not be set to ${uri}.` : `may not assign a prefix (even "xmlns") to the URI \
${XMLNS_NAMESPACE}.`);
				break;
			case XML_NAMESPACE: switch (prefix) {
				case "xml": break;
				case "":
					parser.fail(`the default namespace may not be set to ${uri}.`);
					break;
				default: parser.fail("may not assign the xml namespace to another prefix.");
			}
		}
	}
	function nsMappingCheck(parser, mapping) {
		for (const local of Object.keys(mapping)) nsPairCheck(parser, local, mapping[local]);
	}
	const isNCName = (name) => NC_NAME_RE.test(name);
	const isName = (name) => NAME_RE.test(name);
	const FORBIDDEN_START = 0;
	const FORBIDDEN_BRACKET = 1;
	const FORBIDDEN_BRACKET_BRACKET = 2;
	/**
	* The list of supported events.
	*/
	exports.EVENTS = [
		"xmldecl",
		"text",
		"processinginstruction",
		"doctype",
		"comment",
		"opentagstart",
		"attribute",
		"opentag",
		"closetag",
		"cdata",
		"error",
		"end",
		"ready"
	];
	const EVENT_NAME_TO_HANDLER_NAME = {
		xmldecl: "xmldeclHandler",
		text: "textHandler",
		processinginstruction: "piHandler",
		doctype: "doctypeHandler",
		comment: "commentHandler",
		opentagstart: "openTagStartHandler",
		attribute: "attributeHandler",
		opentag: "openTagHandler",
		closetag: "closeTagHandler",
		cdata: "cdataHandler",
		error: "errorHandler",
		end: "endHandler",
		ready: "readyHandler"
	};
	var SaxesParser = class {
		/**
		* @param opt The parser options.
		*/
		constructor(opt) {
			this.opt = opt !== null && opt !== void 0 ? opt : {};
			this.fragmentOpt = !!this.opt.fragment;
			const xmlnsOpt = this.xmlnsOpt = !!this.opt.xmlns;
			this.trackPosition = this.opt.position !== false;
			this.fileName = this.opt.fileName;
			if (xmlnsOpt) {
				this.nameStartCheck = isNCNameStartChar;
				this.nameCheck = isNCNameChar;
				this.isName = isNCName;
				this.processAttribs = this.processAttribsNS;
				this.pushAttrib = this.pushAttribNS;
				this.ns = Object.assign({ __proto__: null }, rootNS);
				const additional = this.opt.additionalNamespaces;
				if (additional != null) {
					nsMappingCheck(this, additional);
					Object.assign(this.ns, additional);
				}
			} else {
				this.nameStartCheck = isNameStartChar;
				this.nameCheck = isNameChar;
				this.isName = isName;
				this.processAttribs = this.processAttribsPlain;
				this.pushAttrib = this.pushAttribPlain;
			}
			this.stateTable = [
				this.sBegin,
				this.sBeginWhitespace,
				this.sDoctype,
				this.sDoctypeQuote,
				this.sDTD,
				this.sDTDQuoted,
				this.sDTDOpenWaka,
				this.sDTDOpenWakaBang,
				this.sDTDComment,
				this.sDTDCommentEnding,
				this.sDTDCommentEnded,
				this.sDTDPI,
				this.sDTDPIEnding,
				this.sText,
				this.sEntity,
				this.sOpenWaka,
				this.sOpenWakaBang,
				this.sComment,
				this.sCommentEnding,
				this.sCommentEnded,
				this.sCData,
				this.sCDataEnding,
				this.sCDataEnding2,
				this.sPIFirstChar,
				this.sPIRest,
				this.sPIBody,
				this.sPIEnding,
				this.sXMLDeclNameStart,
				this.sXMLDeclName,
				this.sXMLDeclEq,
				this.sXMLDeclValueStart,
				this.sXMLDeclValue,
				this.sXMLDeclSeparator,
				this.sXMLDeclEnding,
				this.sOpenTag,
				this.sOpenTagSlash,
				this.sAttrib,
				this.sAttribName,
				this.sAttribNameSawWhite,
				this.sAttribValue,
				this.sAttribValueQuoted,
				this.sAttribValueClosed,
				this.sAttribValueUnquoted,
				this.sCloseTag,
				this.sCloseTagSawWhite
			];
			this._init();
		}
		/**
		* Indicates whether or not the parser is closed. If ``true``, wait for
		* the ``ready`` event to write again.
		*/
		get closed() {
			return this._closed;
		}
		_init() {
			var _a;
			this.openWakaBang = "";
			this.text = "";
			this.name = "";
			this.piTarget = "";
			this.entity = "";
			this.q = null;
			this.tags = [];
			this.tag = null;
			this.topNS = null;
			this.chunk = "";
			this.chunkPosition = 0;
			this.i = 0;
			this.prevI = 0;
			this.carriedFromPrevious = void 0;
			this.forbiddenState = FORBIDDEN_START;
			this.attribList = [];
			const { fragmentOpt } = this;
			this.state = fragmentOpt ? S_TEXT : S_BEGIN;
			this.reportedTextBeforeRoot = this.reportedTextAfterRoot = this.closedRoot = this.sawRoot = fragmentOpt;
			this.xmlDeclPossible = !fragmentOpt;
			this.xmlDeclExpects = ["version"];
			this.entityReturnState = void 0;
			let { defaultXMLVersion } = this.opt;
			if (defaultXMLVersion === void 0) {
				if (this.opt.forceXMLVersion === true) throw new Error("forceXMLVersion set but defaultXMLVersion is not set");
				defaultXMLVersion = "1.0";
			}
			this.setXMLVersion(defaultXMLVersion);
			this.positionAtNewLine = 0;
			this.doctype = false;
			this._closed = false;
			this.xmlDecl = {
				version: void 0,
				encoding: void 0,
				standalone: void 0
			};
			this.line = 1;
			this.column = 0;
			this.ENTITIES = Object.create(XML_ENTITIES);
			(_a = this.readyHandler) === null || _a === void 0 || _a.call(this);
		}
		/**
		* The stream position the parser is currently looking at. This field is
		* zero-based.
		*
		* This field is not based on counting Unicode characters but is to be
		* interpreted as a plain index into a JavaScript string.
		*/
		get position() {
			return this.chunkPosition + this.i;
		}
		/**
		* The column number of the next character to be read by the parser.  *
		* This field is zero-based. (The first column in a line is 0.)
		*
		* This field reports the index at which the next character would be in the
		* line if the line were represented as a JavaScript string.  Note that this
		* *can* be different to a count based on the number of *Unicode characters*
		* due to how JavaScript handles astral plane characters.
		*
		* See [[column]] for a number that corresponds to a count of Unicode
		* characters.
		*/
		get columnIndex() {
			return this.position - this.positionAtNewLine;
		}
		/**
		* Set an event listener on an event. The parser supports one handler per
		* event type. If you try to set an event handler over an existing handler,
		* the old handler is silently overwritten.
		*
		* @param name The event to listen to.
		*
		* @param handler The handler to set.
		*/
		on(name, handler) {
			this[EVENT_NAME_TO_HANDLER_NAME[name]] = handler;
		}
		/**
		* Unset an event handler.
		*
		* @parma name The event to stop listening to.
		*/
		off(name) {
			this[EVENT_NAME_TO_HANDLER_NAME[name]] = void 0;
		}
		/**
		* Make an error object. The error object will have a message that contains
		* the ``fileName`` option passed at the creation of the parser. If position
		* tracking was turned on, it will also have line and column number
		* information.
		*
		* @param message The message describing the error to report.
		*
		* @returns An error object with a properly formatted message.
		*/
		makeError(message) {
			var _a;
			let msg = (_a = this.fileName) !== null && _a !== void 0 ? _a : "";
			if (this.trackPosition) {
				if (msg.length > 0) msg += ":";
				msg += `${this.line}:${this.column}`;
			}
			if (msg.length > 0) msg += ": ";
			return new Error(msg + message);
		}
		/**
		* Report a parsing error. This method is made public so that client code may
		* check for issues that are outside the scope of this project and can report
		* errors.
		*
		* @param message The error to report.
		*
		* @returns this
		*/
		fail(message) {
			const err = this.makeError(message);
			const handler = this.errorHandler;
			if (handler === void 0) throw err;
			else handler(err);
			return this;
		}
		/**
		* Write a XML data to the parser.
		*
		* @param chunk The XML data to write.
		*
		* @returns this
		*/
		write(chunk) {
			if (this.closed) return this.fail("cannot write after close; assign an onready handler.");
			let end = false;
			if (chunk === null) {
				end = true;
				chunk = "";
			} else if (typeof chunk === "object") chunk = chunk.toString();
			if (this.carriedFromPrevious !== void 0) {
				chunk = `${this.carriedFromPrevious}${chunk}`;
				this.carriedFromPrevious = void 0;
			}
			let limit = chunk.length;
			const lastCode = chunk.charCodeAt(limit - 1);
			if (!end && (lastCode === CR || lastCode >= 55296 && lastCode <= 56319)) {
				this.carriedFromPrevious = chunk[limit - 1];
				limit--;
				chunk = chunk.slice(0, limit);
			}
			const { stateTable } = this;
			this.chunk = chunk;
			this.i = 0;
			while (this.i < limit) stateTable[this.state].call(this);
			this.chunkPosition += limit;
			return end ? this.end() : this;
		}
		/**
		* Close the current stream. Perform final well-formedness checks and reset
		* the parser tstate.
		*
		* @returns this
		*/
		close() {
			return this.write(null);
		}
		/**
		* Get a single code point out of the current chunk. This updates the current
		* position if we do position tracking.
		*
		* This is the algorithm to use for XML 1.0.
		*
		* @returns The character read.
		*/
		getCode10() {
			const { chunk, i } = this;
			this.prevI = i;
			this.i = i + 1;
			if (i >= chunk.length) return EOC;
			const code = chunk.charCodeAt(i);
			this.column++;
			if (code < 55296) {
				if (code >= SPACE || code === TAB) return code;
				switch (code) {
					case NL:
						this.line++;
						this.column = 0;
						this.positionAtNewLine = this.position;
						return NL;
					case CR:
						if (chunk.charCodeAt(i + 1) === NL) this.i = i + 2;
						this.line++;
						this.column = 0;
						this.positionAtNewLine = this.position;
						return NL_LIKE;
					default:
						this.fail("disallowed character.");
						return code;
				}
			}
			if (code > 56319) {
				if (!(code >= 57344 && code <= 65533)) this.fail("disallowed character.");
				return code;
			}
			const final = 65536 + (code - 55296) * 1024 + (chunk.charCodeAt(i + 1) - 56320);
			this.i = i + 2;
			if (final > 1114111) this.fail("disallowed character.");
			return final;
		}
		/**
		* Get a single code point out of the current chunk. This updates the current
		* position if we do position tracking.
		*
		* This is the algorithm to use for XML 1.1.
		*
		* @returns {number} The character read.
		*/
		getCode11() {
			const { chunk, i } = this;
			this.prevI = i;
			this.i = i + 1;
			if (i >= chunk.length) return EOC;
			const code = chunk.charCodeAt(i);
			this.column++;
			if (code < 55296) {
				if (code > 31 && code < 127 || code > 159 && code !== LS || code === TAB) return code;
				switch (code) {
					case NL:
						this.line++;
						this.column = 0;
						this.positionAtNewLine = this.position;
						return NL;
					case CR: {
						const next = chunk.charCodeAt(i + 1);
						if (next === NL || next === NEL) this.i = i + 2;
					}
					case NEL:
					case LS:
						this.line++;
						this.column = 0;
						this.positionAtNewLine = this.position;
						return NL_LIKE;
					default:
						this.fail("disallowed character.");
						return code;
				}
			}
			if (code > 56319) {
				if (!(code >= 57344 && code <= 65533)) this.fail("disallowed character.");
				return code;
			}
			const final = 65536 + (code - 55296) * 1024 + (chunk.charCodeAt(i + 1) - 56320);
			this.i = i + 2;
			if (final > 1114111) this.fail("disallowed character.");
			return final;
		}
		/**
		* Like ``getCode`` but with the return value normalized so that ``NL`` is
		* returned for ``NL_LIKE``.
		*/
		getCodeNorm() {
			const c = this.getCode();
			return c === NL_LIKE ? NL : c;
		}
		unget() {
			this.i = this.prevI;
			this.column--;
		}
		/**
		* Capture characters into a buffer until encountering one of a set of
		* characters.
		*
		* @param chars An array of codepoints. Encountering a character in the array
		* ends the capture. (``chars`` may safely contain ``NL``.)
		*
		* @return The character code that made the capture end, or ``EOC`` if we hit
		* the end of the chunk. The return value cannot be NL_LIKE: NL is returned
		* instead.
		*/
		captureTo(chars) {
			let { i: start } = this;
			const { chunk } = this;
			while (true) {
				const c = this.getCode();
				const isNLLike = c === NL_LIKE;
				const final = isNLLike ? NL : c;
				if (final === EOC || chars.includes(final)) {
					this.text += chunk.slice(start, this.prevI);
					return final;
				}
				if (isNLLike) {
					this.text += `${chunk.slice(start, this.prevI)}\n`;
					start = this.i;
				}
			}
		}
		/**
		* Capture characters into a buffer until encountering a character.
		*
		* @param char The codepoint that ends the capture. **NOTE ``char`` MAY NOT
		* CONTAIN ``NL``.** Passing ``NL`` will result in buggy behavior.
		*
		* @return ``true`` if we ran into the character. Otherwise, we ran into the
		* end of the current chunk.
		*/
		captureToChar(char) {
			let { i: start } = this;
			const { chunk } = this;
			while (true) {
				let c = this.getCode();
				switch (c) {
					case NL_LIKE:
						this.text += `${chunk.slice(start, this.prevI)}\n`;
						start = this.i;
						c = NL;
						break;
					case EOC:
						this.text += chunk.slice(start);
						return false;
				}
				if (c === char) {
					this.text += chunk.slice(start, this.prevI);
					return true;
				}
			}
		}
		/**
		* Capture characters that satisfy ``isNameChar`` into the ``name`` field of
		* this parser.
		*
		* @return The character code that made the test fail, or ``EOC`` if we hit
		* the end of the chunk. The return value cannot be NL_LIKE: NL is returned
		* instead.
		*/
		captureNameChars() {
			const { chunk, i: start } = this;
			while (true) {
				const c = this.getCode();
				if (c === EOC) {
					this.name += chunk.slice(start);
					return EOC;
				}
				if (!isNameChar(c)) {
					this.name += chunk.slice(start, this.prevI);
					return c === NL_LIKE ? NL : c;
				}
			}
		}
		/**
		* Skip white spaces.
		*
		* @return The character that ended the skip, or ``EOC`` if we hit
		* the end of the chunk. The return value cannot be NL_LIKE: NL is returned
		* instead.
		*/
		skipSpaces() {
			while (true) {
				const c = this.getCodeNorm();
				if (c === EOC || !isS(c)) return c;
			}
		}
		setXMLVersion(version) {
			this.currentXMLVersion = version;
			if (version === "1.0") {
				this.isChar = isChar10;
				this.getCode = this.getCode10;
			} else {
				this.isChar = isChar11;
				this.getCode = this.getCode11;
			}
		}
		sBegin() {
			if (this.chunk.charCodeAt(0) === 65279) {
				this.i++;
				this.column++;
			}
			this.state = S_BEGIN_WHITESPACE;
		}
		sBeginWhitespace() {
			const iBefore = this.i;
			const c = this.skipSpaces();
			if (this.prevI !== iBefore) this.xmlDeclPossible = false;
			switch (c) {
				case LESS:
					this.state = S_OPEN_WAKA;
					if (this.text.length !== 0) throw new Error("no-empty text at start");
					break;
				case EOC: break;
				default:
					this.unget();
					this.state = S_TEXT;
					this.xmlDeclPossible = false;
			}
		}
		sDoctype() {
			var _a;
			const c = this.captureTo(DOCTYPE_TERMINATOR);
			switch (c) {
				case GREATER:
					(_a = this.doctypeHandler) === null || _a === void 0 || _a.call(this, this.text);
					this.text = "";
					this.state = S_TEXT;
					this.doctype = true;
					break;
				case EOC: break;
				default:
					this.text += String.fromCodePoint(c);
					if (c === OPEN_BRACKET) this.state = S_DTD;
					else if (isQuote(c)) {
						this.state = S_DOCTYPE_QUOTE;
						this.q = c;
					}
			}
		}
		sDoctypeQuote() {
			const q = this.q;
			if (this.captureToChar(q)) {
				this.text += String.fromCodePoint(q);
				this.q = null;
				this.state = S_DOCTYPE;
			}
		}
		sDTD() {
			const c = this.captureTo(DTD_TERMINATOR);
			if (c === EOC) return;
			this.text += String.fromCodePoint(c);
			if (c === CLOSE_BRACKET) this.state = S_DOCTYPE;
			else if (c === LESS) this.state = S_DTD_OPEN_WAKA;
			else if (isQuote(c)) {
				this.state = S_DTD_QUOTED;
				this.q = c;
			}
		}
		sDTDQuoted() {
			const q = this.q;
			if (this.captureToChar(q)) {
				this.text += String.fromCodePoint(q);
				this.state = S_DTD;
				this.q = null;
			}
		}
		sDTDOpenWaka() {
			const c = this.getCodeNorm();
			this.text += String.fromCodePoint(c);
			switch (c) {
				case BANG:
					this.state = S_DTD_OPEN_WAKA_BANG;
					this.openWakaBang = "";
					break;
				case QUESTION:
					this.state = S_DTD_PI;
					break;
				default: this.state = S_DTD;
			}
		}
		sDTDOpenWakaBang() {
			const char = String.fromCodePoint(this.getCodeNorm());
			const owb = this.openWakaBang += char;
			this.text += char;
			if (owb !== "-") {
				this.state = owb === "--" ? S_DTD_COMMENT : S_DTD;
				this.openWakaBang = "";
			}
		}
		sDTDComment() {
			if (this.captureToChar(MINUS)) {
				this.text += "-";
				this.state = S_DTD_COMMENT_ENDING;
			}
		}
		sDTDCommentEnding() {
			const c = this.getCodeNorm();
			this.text += String.fromCodePoint(c);
			this.state = c === MINUS ? S_DTD_COMMENT_ENDED : S_DTD_COMMENT;
		}
		sDTDCommentEnded() {
			const c = this.getCodeNorm();
			this.text += String.fromCodePoint(c);
			if (c === GREATER) this.state = S_DTD;
			else {
				this.fail("malformed comment.");
				this.state = S_DTD_COMMENT;
			}
		}
		sDTDPI() {
			if (this.captureToChar(QUESTION)) {
				this.text += "?";
				this.state = S_DTD_PI_ENDING;
			}
		}
		sDTDPIEnding() {
			const c = this.getCodeNorm();
			this.text += String.fromCodePoint(c);
			if (c === GREATER) this.state = S_DTD;
		}
		sText() {
			if (this.tags.length !== 0) this.handleTextInRoot();
			else this.handleTextOutsideRoot();
		}
		sEntity() {
			let { i: start } = this;
			const { chunk } = this;
			loop: while (true) switch (this.getCode()) {
				case NL_LIKE:
					this.entity += `${chunk.slice(start, this.prevI)}\n`;
					start = this.i;
					break;
				case SEMICOLON: {
					const { entityReturnState } = this;
					const entity = this.entity + chunk.slice(start, this.prevI);
					this.state = entityReturnState;
					let parsed;
					if (entity === "") {
						this.fail("empty entity name.");
						parsed = "&;";
					} else {
						parsed = this.parseEntity(entity);
						this.entity = "";
					}
					if (entityReturnState !== S_TEXT || this.textHandler !== void 0) this.text += parsed;
					break loop;
				}
				case EOC:
					this.entity += chunk.slice(start);
					break loop;
			}
		}
		sOpenWaka() {
			const c = this.getCode();
			if (isNameStartChar(c)) {
				this.state = S_OPEN_TAG;
				this.unget();
				this.xmlDeclPossible = false;
			} else switch (c) {
				case FORWARD_SLASH:
					this.state = S_CLOSE_TAG;
					this.xmlDeclPossible = false;
					break;
				case BANG:
					this.state = S_OPEN_WAKA_BANG;
					this.openWakaBang = "";
					this.xmlDeclPossible = false;
					break;
				case QUESTION:
					this.state = S_PI_FIRST_CHAR;
					break;
				default:
					this.fail("disallowed character in tag name");
					this.state = S_TEXT;
					this.xmlDeclPossible = false;
			}
		}
		sOpenWakaBang() {
			this.openWakaBang += String.fromCodePoint(this.getCodeNorm());
			switch (this.openWakaBang) {
				case "[CDATA[":
					if (!this.sawRoot && !this.reportedTextBeforeRoot) {
						this.fail("text data outside of root node.");
						this.reportedTextBeforeRoot = true;
					}
					if (this.closedRoot && !this.reportedTextAfterRoot) {
						this.fail("text data outside of root node.");
						this.reportedTextAfterRoot = true;
					}
					this.state = S_CDATA;
					this.openWakaBang = "";
					break;
				case "--":
					this.state = S_COMMENT;
					this.openWakaBang = "";
					break;
				case "DOCTYPE":
					this.state = S_DOCTYPE;
					if (this.doctype || this.sawRoot) this.fail("inappropriately located doctype declaration.");
					this.openWakaBang = "";
					break;
				default: if (this.openWakaBang.length >= 7) this.fail("incorrect syntax.");
			}
		}
		sComment() {
			if (this.captureToChar(MINUS)) this.state = S_COMMENT_ENDING;
		}
		sCommentEnding() {
			var _a;
			const c = this.getCodeNorm();
			if (c === MINUS) {
				this.state = S_COMMENT_ENDED;
				(_a = this.commentHandler) === null || _a === void 0 || _a.call(this, this.text);
				this.text = "";
			} else {
				this.text += `-${String.fromCodePoint(c)}`;
				this.state = S_COMMENT;
			}
		}
		sCommentEnded() {
			const c = this.getCodeNorm();
			if (c !== GREATER) {
				this.fail("malformed comment.");
				this.text += `--${String.fromCodePoint(c)}`;
				this.state = S_COMMENT;
			} else this.state = S_TEXT;
		}
		sCData() {
			if (this.captureToChar(CLOSE_BRACKET)) this.state = S_CDATA_ENDING;
		}
		sCDataEnding() {
			const c = this.getCodeNorm();
			if (c === CLOSE_BRACKET) this.state = S_CDATA_ENDING_2;
			else {
				this.text += `]${String.fromCodePoint(c)}`;
				this.state = S_CDATA;
			}
		}
		sCDataEnding2() {
			var _a;
			const c = this.getCodeNorm();
			switch (c) {
				case GREATER:
					(_a = this.cdataHandler) === null || _a === void 0 || _a.call(this, this.text);
					this.text = "";
					this.state = S_TEXT;
					break;
				case CLOSE_BRACKET:
					this.text += "]";
					break;
				default:
					this.text += `]]${String.fromCodePoint(c)}`;
					this.state = S_CDATA;
			}
		}
		sPIFirstChar() {
			const c = this.getCodeNorm();
			if (this.nameStartCheck(c)) {
				this.piTarget += String.fromCodePoint(c);
				this.state = S_PI_REST;
			} else if (c === QUESTION || isS(c)) {
				this.fail("processing instruction without a target.");
				this.state = c === QUESTION ? S_PI_ENDING : S_PI_BODY;
			} else {
				this.fail("disallowed character in processing instruction name.");
				this.piTarget += String.fromCodePoint(c);
				this.state = S_PI_REST;
			}
		}
		sPIRest() {
			const { chunk, i: start } = this;
			while (true) {
				const c = this.getCodeNorm();
				if (c === EOC) {
					this.piTarget += chunk.slice(start);
					return;
				}
				if (!this.nameCheck(c)) {
					this.piTarget += chunk.slice(start, this.prevI);
					const isQuestion = c === QUESTION;
					if (isQuestion || isS(c)) {
						if (this.piTarget === "xml") {
							if (!this.xmlDeclPossible) this.fail("an XML declaration must be at the start of the document.");
							this.state = isQuestion ? S_XML_DECL_ENDING : S_XML_DECL_NAME_START;
						} else this.state = isQuestion ? S_PI_ENDING : S_PI_BODY;
					} else {
						this.fail("disallowed character in processing instruction name.");
						this.piTarget += String.fromCodePoint(c);
					}
					break;
				}
			}
		}
		sPIBody() {
			if (this.text.length === 0) {
				const c = this.getCodeNorm();
				if (c === QUESTION) this.state = S_PI_ENDING;
				else if (!isS(c)) this.text = String.fromCodePoint(c);
			} else if (this.captureToChar(QUESTION)) this.state = S_PI_ENDING;
		}
		sPIEnding() {
			var _a;
			const c = this.getCodeNorm();
			if (c === GREATER) {
				const { piTarget } = this;
				if (piTarget.toLowerCase() === "xml") this.fail("the XML declaration must appear at the start of the document.");
				(_a = this.piHandler) === null || _a === void 0 || _a.call(this, {
					target: piTarget,
					body: this.text
				});
				this.piTarget = this.text = "";
				this.state = S_TEXT;
			} else if (c === QUESTION) this.text += "?";
			else {
				this.text += `?${String.fromCodePoint(c)}`;
				this.state = S_PI_BODY;
			}
			this.xmlDeclPossible = false;
		}
		sXMLDeclNameStart() {
			const c = this.skipSpaces();
			if (c === QUESTION) {
				this.state = S_XML_DECL_ENDING;
				return;
			}
			if (c !== EOC) {
				this.state = S_XML_DECL_NAME;
				this.name = String.fromCodePoint(c);
			}
		}
		sXMLDeclName() {
			const c = this.captureTo(XML_DECL_NAME_TERMINATOR);
			if (c === QUESTION) {
				this.state = S_XML_DECL_ENDING;
				this.name += this.text;
				this.text = "";
				this.fail("XML declaration is incomplete.");
				return;
			}
			if (!(isS(c) || c === EQUAL)) return;
			this.name += this.text;
			this.text = "";
			if (!this.xmlDeclExpects.includes(this.name)) switch (this.name.length) {
				case 0:
					this.fail("did not expect any more name/value pairs.");
					break;
				case 1:
					this.fail(`expected the name ${this.xmlDeclExpects[0]}.`);
					break;
				default: this.fail(`expected one of ${this.xmlDeclExpects.join(", ")}`);
			}
			this.state = c === EQUAL ? S_XML_DECL_VALUE_START : S_XML_DECL_EQ;
		}
		sXMLDeclEq() {
			const c = this.getCodeNorm();
			if (c === QUESTION) {
				this.state = S_XML_DECL_ENDING;
				this.fail("XML declaration is incomplete.");
				return;
			}
			if (isS(c)) return;
			if (c !== EQUAL) this.fail("value required.");
			this.state = S_XML_DECL_VALUE_START;
		}
		sXMLDeclValueStart() {
			const c = this.getCodeNorm();
			if (c === QUESTION) {
				this.state = S_XML_DECL_ENDING;
				this.fail("XML declaration is incomplete.");
				return;
			}
			if (isS(c)) return;
			if (!isQuote(c)) {
				this.fail("value must be quoted.");
				this.q = SPACE;
			} else this.q = c;
			this.state = S_XML_DECL_VALUE;
		}
		sXMLDeclValue() {
			const c = this.captureTo([this.q, QUESTION]);
			if (c === QUESTION) {
				this.state = S_XML_DECL_ENDING;
				this.text = "";
				this.fail("XML declaration is incomplete.");
				return;
			}
			if (c === EOC) return;
			const value = this.text;
			this.text = "";
			switch (this.name) {
				case "version": {
					this.xmlDeclExpects = ["encoding", "standalone"];
					const version = value;
					this.xmlDecl.version = version;
					if (!/^1\.[0-9]+$/.test(version)) this.fail("version number must match /^1\\.[0-9]+$/.");
					else if (!this.opt.forceXMLVersion) this.setXMLVersion(version);
					break;
				}
				case "encoding":
					if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(value)) this.fail("encoding value must match /^[A-Za-z0-9][A-Za-z0-9._-]*$/.");
					this.xmlDeclExpects = ["standalone"];
					this.xmlDecl.encoding = value;
					break;
				case "standalone":
					if (value !== "yes" && value !== "no") this.fail("standalone value must match \"yes\" or \"no\".");
					this.xmlDeclExpects = [];
					this.xmlDecl.standalone = value;
			}
			this.name = "";
			this.state = S_XML_DECL_SEPARATOR;
		}
		sXMLDeclSeparator() {
			const c = this.getCodeNorm();
			if (c === QUESTION) {
				this.state = S_XML_DECL_ENDING;
				return;
			}
			if (!isS(c)) {
				this.fail("whitespace required.");
				this.unget();
			}
			this.state = S_XML_DECL_NAME_START;
		}
		sXMLDeclEnding() {
			var _a;
			if (this.getCodeNorm() === GREATER) {
				if (this.piTarget !== "xml") this.fail("processing instructions are not allowed before root.");
				else if (this.name !== "version" && this.xmlDeclExpects.includes("version")) this.fail("XML declaration must contain a version.");
				(_a = this.xmldeclHandler) === null || _a === void 0 || _a.call(this, this.xmlDecl);
				this.name = "";
				this.piTarget = this.text = "";
				this.state = S_TEXT;
			} else this.fail("The character ? is disallowed anywhere in XML declarations.");
			this.xmlDeclPossible = false;
		}
		sOpenTag() {
			var _a;
			const c = this.captureNameChars();
			if (c === EOC) return;
			const tag = this.tag = {
				name: this.name,
				attributes: Object.create(null)
			};
			this.name = "";
			if (this.xmlnsOpt) this.topNS = tag.ns = Object.create(null);
			(_a = this.openTagStartHandler) === null || _a === void 0 || _a.call(this, tag);
			this.sawRoot = true;
			if (!this.fragmentOpt && this.closedRoot) this.fail("documents may contain only one root.");
			switch (c) {
				case GREATER:
					this.openTag();
					break;
				case FORWARD_SLASH:
					this.state = S_OPEN_TAG_SLASH;
					break;
				default:
					if (!isS(c)) this.fail("disallowed character in tag name.");
					this.state = S_ATTRIB;
			}
		}
		sOpenTagSlash() {
			if (this.getCode() === GREATER) this.openSelfClosingTag();
			else {
				this.fail("forward-slash in opening tag not followed by >.");
				this.state = S_ATTRIB;
			}
		}
		sAttrib() {
			const c = this.skipSpaces();
			if (c === EOC) return;
			if (isNameStartChar(c)) {
				this.unget();
				this.state = S_ATTRIB_NAME;
			} else if (c === GREATER) this.openTag();
			else if (c === FORWARD_SLASH) this.state = S_OPEN_TAG_SLASH;
			else this.fail("disallowed character in attribute name.");
		}
		sAttribName() {
			const c = this.captureNameChars();
			if (c === EQUAL) this.state = S_ATTRIB_VALUE;
			else if (isS(c)) this.state = S_ATTRIB_NAME_SAW_WHITE;
			else if (c === GREATER) {
				this.fail("attribute without value.");
				this.pushAttrib(this.name, this.name);
				this.name = this.text = "";
				this.openTag();
			} else if (c !== EOC) this.fail("disallowed character in attribute name.");
		}
		sAttribNameSawWhite() {
			const c = this.skipSpaces();
			switch (c) {
				case EOC: return;
				case EQUAL:
					this.state = S_ATTRIB_VALUE;
					break;
				default:
					this.fail("attribute without value.");
					this.text = "";
					this.name = "";
					if (c === GREATER) this.openTag();
					else if (isNameStartChar(c)) {
						this.unget();
						this.state = S_ATTRIB_NAME;
					} else {
						this.fail("disallowed character in attribute name.");
						this.state = S_ATTRIB;
					}
			}
		}
		sAttribValue() {
			const c = this.getCodeNorm();
			if (isQuote(c)) {
				this.q = c;
				this.state = S_ATTRIB_VALUE_QUOTED;
			} else if (!isS(c)) {
				this.fail("unquoted attribute value.");
				this.state = S_ATTRIB_VALUE_UNQUOTED;
				this.unget();
			}
		}
		sAttribValueQuoted() {
			const { q, chunk } = this;
			let { i: start } = this;
			while (true) switch (this.getCode()) {
				case q:
					this.pushAttrib(this.name, this.text + chunk.slice(start, this.prevI));
					this.name = this.text = "";
					this.q = null;
					this.state = S_ATTRIB_VALUE_CLOSED;
					return;
				case AMP:
					this.text += chunk.slice(start, this.prevI);
					this.state = S_ENTITY;
					this.entityReturnState = S_ATTRIB_VALUE_QUOTED;
					return;
				case NL:
				case NL_LIKE:
				case TAB:
					this.text += `${chunk.slice(start, this.prevI)} `;
					start = this.i;
					break;
				case LESS:
					this.text += chunk.slice(start, this.prevI);
					this.fail("disallowed character.");
					return;
				case EOC:
					this.text += chunk.slice(start);
					return;
			}
		}
		sAttribValueClosed() {
			const c = this.getCodeNorm();
			if (isS(c)) this.state = S_ATTRIB;
			else if (c === GREATER) this.openTag();
			else if (c === FORWARD_SLASH) this.state = S_OPEN_TAG_SLASH;
			else if (isNameStartChar(c)) {
				this.fail("no whitespace between attributes.");
				this.unget();
				this.state = S_ATTRIB_NAME;
			} else this.fail("disallowed character in attribute name.");
		}
		sAttribValueUnquoted() {
			const c = this.captureTo(ATTRIB_VALUE_UNQUOTED_TERMINATOR);
			switch (c) {
				case AMP:
					this.state = S_ENTITY;
					this.entityReturnState = S_ATTRIB_VALUE_UNQUOTED;
					break;
				case LESS:
					this.fail("disallowed character.");
					break;
				case EOC: break;
				default:
					if (this.text.includes("]]>")) this.fail("the string \"]]>\" is disallowed in char data.");
					this.pushAttrib(this.name, this.text);
					this.name = this.text = "";
					if (c === GREATER) this.openTag();
					else this.state = S_ATTRIB;
			}
		}
		sCloseTag() {
			const c = this.captureNameChars();
			if (c === GREATER) this.closeTag();
			else if (isS(c)) this.state = S_CLOSE_TAG_SAW_WHITE;
			else if (c !== EOC) this.fail("disallowed character in closing tag.");
		}
		sCloseTagSawWhite() {
			switch (this.skipSpaces()) {
				case GREATER:
					this.closeTag();
					break;
				case EOC: break;
				default: this.fail("disallowed character in closing tag.");
			}
		}
		handleTextInRoot() {
			let { i: start, forbiddenState } = this;
			const { chunk, textHandler: handler } = this;
			scanLoop: while (true) switch (this.getCode()) {
				case LESS:
					this.state = S_OPEN_WAKA;
					if (handler !== void 0) {
						const { text } = this;
						const slice = chunk.slice(start, this.prevI);
						if (text.length !== 0) {
							handler(text + slice);
							this.text = "";
						} else if (slice.length !== 0) handler(slice);
					}
					forbiddenState = FORBIDDEN_START;
					break scanLoop;
				case AMP:
					this.state = S_ENTITY;
					this.entityReturnState = S_TEXT;
					if (handler !== void 0) this.text += chunk.slice(start, this.prevI);
					forbiddenState = FORBIDDEN_START;
					break scanLoop;
				case CLOSE_BRACKET:
					switch (forbiddenState) {
						case FORBIDDEN_START:
							forbiddenState = FORBIDDEN_BRACKET;
							break;
						case FORBIDDEN_BRACKET:
							forbiddenState = FORBIDDEN_BRACKET_BRACKET;
							break;
						case FORBIDDEN_BRACKET_BRACKET: break;
						default: throw new Error("impossible state");
					}
					break;
				case GREATER:
					if (forbiddenState === FORBIDDEN_BRACKET_BRACKET) this.fail("the string \"]]>\" is disallowed in char data.");
					forbiddenState = FORBIDDEN_START;
					break;
				case NL_LIKE:
					if (handler !== void 0) this.text += `${chunk.slice(start, this.prevI)}\n`;
					start = this.i;
					forbiddenState = FORBIDDEN_START;
					break;
				case EOC:
					if (handler !== void 0) this.text += chunk.slice(start);
					break scanLoop;
				default: forbiddenState = FORBIDDEN_START;
			}
			this.forbiddenState = forbiddenState;
		}
		handleTextOutsideRoot() {
			let { i: start } = this;
			const { chunk, textHandler: handler } = this;
			let nonSpace = false;
			outRootLoop: while (true) {
				const code = this.getCode();
				switch (code) {
					case LESS:
						this.state = S_OPEN_WAKA;
						if (handler !== void 0) {
							const { text } = this;
							const slice = chunk.slice(start, this.prevI);
							if (text.length !== 0) {
								handler(text + slice);
								this.text = "";
							} else if (slice.length !== 0) handler(slice);
						}
						break outRootLoop;
					case AMP:
						this.state = S_ENTITY;
						this.entityReturnState = S_TEXT;
						if (handler !== void 0) this.text += chunk.slice(start, this.prevI);
						nonSpace = true;
						break outRootLoop;
					case NL_LIKE:
						if (handler !== void 0) this.text += `${chunk.slice(start, this.prevI)}\n`;
						start = this.i;
						break;
					case EOC:
						if (handler !== void 0) this.text += chunk.slice(start);
						break outRootLoop;
					default: if (!isS(code)) nonSpace = true;
				}
			}
			if (!nonSpace) return;
			if (!this.sawRoot && !this.reportedTextBeforeRoot) {
				this.fail("text data outside of root node.");
				this.reportedTextBeforeRoot = true;
			}
			if (this.closedRoot && !this.reportedTextAfterRoot) {
				this.fail("text data outside of root node.");
				this.reportedTextAfterRoot = true;
			}
		}
		pushAttribNS(name, value) {
			var _a;
			const { prefix, local } = this.qname(name);
			const attr = {
				name,
				prefix,
				local,
				value
			};
			this.attribList.push(attr);
			(_a = this.attributeHandler) === null || _a === void 0 || _a.call(this, attr);
			if (prefix === "xmlns") {
				const trimmed = value.trim();
				if (this.currentXMLVersion === "1.0" && trimmed === "") this.fail("invalid attempt to undefine prefix in XML 1.0");
				this.topNS[local] = trimmed;
				nsPairCheck(this, local, trimmed);
			} else if (name === "xmlns") {
				const trimmed = value.trim();
				this.topNS[""] = trimmed;
				nsPairCheck(this, "", trimmed);
			}
		}
		pushAttribPlain(name, value) {
			var _a;
			const attr = {
				name,
				value
			};
			this.attribList.push(attr);
			(_a = this.attributeHandler) === null || _a === void 0 || _a.call(this, attr);
		}
		/**
		* End parsing. This performs final well-formedness checks and resets the
		* parser to a clean state.
		*
		* @returns this
		*/
		end() {
			var _a, _b;
			if (!this.sawRoot) this.fail("document must contain a root element.");
			const { tags } = this;
			while (tags.length > 0) {
				const tag = tags.pop();
				this.fail(`unclosed tag: ${tag.name}`);
			}
			if (this.state !== S_BEGIN && this.state !== S_TEXT) this.fail("unexpected end.");
			const { text } = this;
			if (text.length !== 0) {
				(_a = this.textHandler) === null || _a === void 0 || _a.call(this, text);
				this.text = "";
			}
			this._closed = true;
			(_b = this.endHandler) === null || _b === void 0 || _b.call(this);
			this._init();
			return this;
		}
		/**
		* Resolve a namespace prefix.
		*
		* @param prefix The prefix to resolve.
		*
		* @returns The namespace URI or ``undefined`` if the prefix is not defined.
		*/
		resolve(prefix) {
			var _a, _b;
			let uri = this.topNS[prefix];
			if (uri !== void 0) return uri;
			const { tags } = this;
			for (let index = tags.length - 1; index >= 0; index--) {
				uri = tags[index].ns[prefix];
				if (uri !== void 0) return uri;
			}
			uri = this.ns[prefix];
			if (uri !== void 0) return uri;
			return (_b = (_a = this.opt).resolvePrefix) === null || _b === void 0 ? void 0 : _b.call(_a, prefix);
		}
		/**
		* Parse a qname into its prefix and local name parts.
		*
		* @param name The name to parse
		*
		* @returns
		*/
		qname(name) {
			const colon = name.indexOf(":");
			if (colon === -1) return {
				prefix: "",
				local: name
			};
			const local = name.slice(colon + 1);
			const prefix = name.slice(0, colon);
			if (prefix === "" || local === "" || local.includes(":")) this.fail(`malformed name: ${name}.`);
			return {
				prefix,
				local
			};
		}
		processAttribsNS() {
			var _a;
			const { attribList } = this;
			const tag = this.tag;
			{
				const { prefix, local } = this.qname(tag.name);
				tag.prefix = prefix;
				tag.local = local;
				const uri = tag.uri = (_a = this.resolve(prefix)) !== null && _a !== void 0 ? _a : "";
				if (prefix !== "") {
					if (prefix === "xmlns") this.fail("tags may not have \"xmlns\" as prefix.");
					if (uri === "") {
						this.fail(`unbound namespace prefix: ${JSON.stringify(prefix)}.`);
						tag.uri = prefix;
					}
				}
			}
			if (attribList.length === 0) return;
			const { attributes } = tag;
			const seen = /* @__PURE__ */ new Set();
			for (const attr of attribList) {
				const { name, prefix, local } = attr;
				let uri;
				let eqname;
				if (prefix === "") {
					uri = name === "xmlns" ? XMLNS_NAMESPACE : "";
					eqname = name;
				} else {
					uri = this.resolve(prefix);
					if (uri === void 0) {
						this.fail(`unbound namespace prefix: ${JSON.stringify(prefix)}.`);
						uri = prefix;
					}
					eqname = `{${uri}}${local}`;
				}
				if (seen.has(eqname)) this.fail(`duplicate attribute: ${eqname}.`);
				seen.add(eqname);
				attr.uri = uri;
				attributes[name] = attr;
			}
			this.attribList = [];
		}
		processAttribsPlain() {
			const { attribList } = this;
			const attributes = this.tag.attributes;
			for (const { name, value } of attribList) {
				if (attributes[name] !== void 0) this.fail(`duplicate attribute: ${name}.`);
				attributes[name] = value;
			}
			this.attribList = [];
		}
		/**
		* Handle a complete open tag. This parser code calls this once it has seen
		* the whole tag. This method checks for well-formeness and then emits
		* ``onopentag``.
		*/
		openTag() {
			var _a;
			this.processAttribs();
			const { tags } = this;
			const tag = this.tag;
			tag.isSelfClosing = false;
			(_a = this.openTagHandler) === null || _a === void 0 || _a.call(this, tag);
			tags.push(tag);
			this.state = S_TEXT;
			this.name = "";
		}
		/**
		* Handle a complete self-closing tag. This parser code calls this once it has
		* seen the whole tag. This method checks for well-formeness and then emits
		* ``onopentag`` and ``onclosetag``.
		*/
		openSelfClosingTag() {
			var _a, _b, _c;
			this.processAttribs();
			const { tags } = this;
			const tag = this.tag;
			tag.isSelfClosing = true;
			(_a = this.openTagHandler) === null || _a === void 0 || _a.call(this, tag);
			(_b = this.closeTagHandler) === null || _b === void 0 || _b.call(this, tag);
			if ((this.tag = (_c = tags[tags.length - 1]) !== null && _c !== void 0 ? _c : null) === null) this.closedRoot = true;
			this.state = S_TEXT;
			this.name = "";
		}
		/**
		* Handle a complete close tag. This parser code calls this once it has seen
		* the whole tag. This method checks for well-formeness and then emits
		* ``onclosetag``.
		*/
		closeTag() {
			const { tags, name } = this;
			this.state = S_TEXT;
			this.name = "";
			if (name === "") {
				this.fail("weird empty close tag.");
				this.text += "</>";
				return;
			}
			const handler = this.closeTagHandler;
			let l = tags.length;
			while (l-- > 0) {
				const tag = this.tag = tags.pop();
				this.topNS = tag.ns;
				handler === null || handler === void 0 || handler(tag);
				if (tag.name === name) break;
				this.fail("unexpected close tag.");
			}
			if (l === 0) this.closedRoot = true;
			else if (l < 0) {
				this.fail(`unmatched closing tag: ${name}.`);
				this.text += `</${name}>`;
			}
		}
		/**
		* Resolves an entity. Makes any necessary well-formedness checks.
		*
		* @param entity The entity to resolve.
		*
		* @returns The parsed entity.
		*/
		parseEntity(entity) {
			if (entity[0] !== "#") {
				const defined = this.ENTITIES[entity];
				if (defined !== void 0) return defined;
				this.fail(this.isName(entity) ? "undefined entity." : "disallowed character in entity name.");
				return `&${entity};`;
			}
			let num = NaN;
			if (entity[1] === "x" && /^#x[0-9a-f]+$/i.test(entity)) num = parseInt(entity.slice(2), 16);
			else if (/^#[0-9]+$/.test(entity)) num = parseInt(entity.slice(1), 10);
			if (!this.isChar(num)) {
				this.fail("malformed character entity.");
				return `&${entity};`;
			}
			return String.fromCodePoint(num);
		}
	};
	exports.SaxesParser = SaxesParser;
})))();
const REGISTRY_SCHEMA = "https://metrix.bar/dashboards/schema.json";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const ROOT_ATTRS = /* @__PURE__ */ new Set([
	"protocol-version",
	"id",
	"title",
	"version",
	"category",
	"description",
	"icon",
	"license",
	"homepage",
	"refresh",
	"material",
	"placements",
	"open-mode",
	"window-style"
]);
const BLOCKS = /* @__PURE__ */ new Set([
	"permissions",
	"inputs",
	"docs",
	"script"
]);
const HOMEPAGE = /^[hH][tT][tT][pP][sS]:\/\/(?:\[[^\]\s/?#@]+\]|[^\s/?#@:%]+)(?::[0-9]*)?(?:[/?#]|$)/;
function parseDashboard(raw) {
	const parser = new import_saxes.SaxesParser();
	const stack = [];
	const blocks = /* @__PURE__ */ new Set();
	/** @type {{ attrs?: import("saxes").SaxesTagPlain["attributes"] }} */
	const root = {};
	let docs = "";
	parser.on("opentag", (tag) => {
		if (stack.length === 0) {
			if (tag.name !== "bar") throw new Error("Root element must be <bar>");
			root.attrs = tag.attributes;
			for (const name of Object.keys(tag.attributes)) if (!ROOT_ATTRS.has(name)) throw new Error(`Unknown bar attribute ${name}`);
		} else if (stack.length === 1) {
			if (!BLOCKS.has(tag.name)) throw new Error(`Unknown block ${tag.name}`);
			if (blocks.has(tag.name)) throw new Error(`Duplicate ${tag.name} block`);
			blocks.add(tag.name);
			if (tag.name === "docs" && Object.keys(tag.attributes).length) throw new Error("docs must not have attributes");
		} else if (stack[1] === "docs") throw new Error("docs must contain plain text, not nested elements");
		stack.push(tag.name);
	});
	parser.on("closetag", () => stack.pop());
	const text = (value) => {
		if (stack[1] === "docs") docs += value;
		else if (stack.length === 1 && value.trim()) throw new Error("Unexpected text inside bar");
	};
	parser.on("text", text);
	parser.on("cdata", text);
	parser.write(new TextDecoder("utf-8", { fatal: true }).decode(raw)).close();
	const { attrs } = root;
	if (!attrs) throw new Error("Missing bar root");
	if (!SLUG.test(attrs.id ?? "")) throw new Error("Invalid dashboard id");
	if (!attrs.title?.trim()) throw new Error("Missing required title");
	if (attrs["protocol-version"] !== "0") throw new Error("Unsupported protocol-version (expected \"0\")");
	if (!SEMVER.test(attrs.version ?? "")) throw new Error("Invalid SemVer version");
	const category = attrs.category ?? "other";
	if (!SLUG.test(category)) throw new Error("Invalid category slug");
	if (attrs.homepage !== void 0) {
		let url;
		try {
			url = new URL(attrs.homepage);
		} catch {}
		if (!HOMEPAGE.test(attrs.homepage) || !url?.hostname || url.protocol !== "https:" || url.username || url.password) throw new Error("homepage must be an absolute HTTPS URL without credentials");
	}
	const placements = attrs.placements === void 0 ? ["menubar"] : attrs.placements.match(/[^\p{White_Space}]+/gu) ?? [];
	const seenPlacements = /* @__PURE__ */ new Set();
	for (const placement of placements) {
		if (![
			"menubar",
			"sidebar-left",
			"sidebar-right",
			"sidebar-bottom"
		].includes(placement)) throw new Error(`Unknown placement ${placement}`);
		if (seenPlacements.has(placement)) throw new Error(`Duplicate placement ${placement}`);
		seenPlacements.add(placement);
	}
	const openMode = attrs["open-mode"] ?? "flyout";
	if (![
		"flyout",
		"dialog",
		"window"
	].includes(openMode)) throw new Error(`Invalid open mode ${openMode} (expected flyout, dialog or window)`);
	const windowStyle = attrs["window-style"] ?? "standard";
	if (!["standard", "immersive"].includes(windowStyle)) throw new Error(`Invalid window style ${windowStyle} (expected standard or immersive)`);
	const entry = {
		id: attrs.id,
		name: attrs.title,
		protocol_version: "0",
		version: attrs.version,
		category,
		placements,
		open_mode: openMode,
		window_style: windowStyle
	};
	for (const key of [
		"description",
		"icon",
		"license",
		"homepage"
	]) if (attrs[key] !== void 0) entry[key] = attrs[key];
	if (docs.trim()) entry.docs = docs.trim();
	return entry;
}
const contains = (parent, child) => {
	const rel = node_path.default.relative(parent, child);
	return rel === "" || !rel.startsWith(`..${node_path.default.sep}`) && rel !== ".." && !node_path.default.isAbsolute(rel);
};
async function resolvedLocation(location) {
	try {
		return await (0, node_fs_promises.realpath)(location);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
		return node_path.default.join(await resolvedLocation(node_path.default.dirname(location)), node_path.default.basename(location));
	}
}
async function collectRegistry({ input, output, id, name }) {
	if (!SLUG.test(id ?? "")) throw new Error("Invalid registry id");
	if (typeof name !== "string" || !name.trim()) throw new Error("Registry name is required");
	input = node_path.default.resolve(input);
	output = node_path.default.resolve(output);
	if (!(await (0, node_fs_promises.lstat)(input)).isDirectory()) throw new Error("Input must be a directory, not a symlink");
	input = await (0, node_fs_promises.realpath)(input);
	const requestedOutput = output;
	output = await resolvedLocation(output);
	if (contains(output, input)) throw new Error("Output must not equal input or be an ancestor of input");
	let outputPart = requestedOutput;
	while (outputPart !== node_path.default.dirname(outputPart)) {
		try {
			if ((await (0, node_fs_promises.lstat)(outputPart)).isSymbolicLink()) throw new Error(`Output must not follow symlink: ${outputPart}`);
			if ((await (0, node_fs_promises.lstat)(outputPart)).isDirectory()) break;
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		outputPart = node_path.default.dirname(outputPart);
	}
	const files = [];
	async function walk(dir) {
		for (const entry of await (0, node_fs_promises.readdir)(dir, { withFileTypes: true })) {
			const src = node_path.default.join(dir, entry.name);
			if (src === output || entry.isSymbolicLink()) continue;
			if (entry.isDirectory()) await walk(src);
			else if (entry.isFile() && entry.name.endsWith(".bar")) files.push(node_path.default.relative(input, src));
		}
	}
	await walk(input);
	files.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
	const seen = /* @__PURE__ */ new Set();
	const assets = [];
	for (const file of files) try {
		// Filesystem separators are not part of a registry's portable relative URL.
		const registryFile = file.split(node_path.default.sep).join("/");
		if (/[\\?#\x00-\x1f\x7f]/.test(registryFile) || registryFile.split("/")[0].includes(":")) throw new Error("Invalid registry file path");
		const raw = await (0, node_fs_promises.readFile)(node_path.default.join(input, file));
		const entry = parseDashboard(raw);
		if (seen.has(entry.id)) throw new Error(`Duplicate dashboard id ${entry.id}`);
		seen.add(entry.id);
		entry.sha256 = (0, node_crypto.createHash)("sha256").update(raw).digest("hex");
		// Keep cached indexes valid: a URL must never serve different bytes.
		const assetFile = registryFile.slice(0, -4) + "." + entry.sha256 + ".bar";
		entry.file = assetFile.split("/").map(encodeURIComponent).join("/");
		assets.push({
			file: assetFile,
			raw,
			entry
		});
	} catch (error) {
		throw new Error(`${file}: ${error.message}`, { cause: error });
	}
	return {
		output,
		assets,
		index: {
			$schema: REGISTRY_SCHEMA,
			schema_version: 1,
			id,
			name,
			dashboards: assets.map(({ entry }) => entry)
		}
	};
}
async function rejectSymlinks(location) {
	const parent = node_path.default.dirname(location);
	if (parent !== location) await rejectSymlinks(parent);
	try {
		if ((await (0, node_fs_promises.lstat)(location)).isSymbolicLink()) throw new Error(`Output must not follow symlink: ${location}`);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
}
async function writeRegistry(collection) {
	const { output, assets, index } = collection;
	for (const file of [...assets.map(({ file }) => file), "index.json"]) await rejectSymlinks(node_path.default.join(output, file));
	for (const { file, raw } of assets) {
		const dest = node_path.default.join(output, file);
		await (0, node_fs_promises.mkdir)(node_path.default.dirname(dest), { recursive: true });
		await (0, node_fs_promises.writeFile)(dest, raw);
	}
	await (0, node_fs_promises.mkdir)(output, { recursive: true });
	await (0, node_fs_promises.writeFile)(node_path.default.join(output, "index.json"), JSON.stringify(index, null, 2) + "\n");
	return index;
}
async function buildRegistry(options) {
	return writeRegistry(await collectRegistry(options));
}
// scripts/build-dashboard-registry.mjs
async function main() {
	const { values } = (0, node_util.parseArgs)({ options: {
		input: { type: "string" },
		output: { type: "string" },
		id: { type: "string" },
		name: { type: "string" },
		help: { type: "boolean" }
	} });
	if (values.help) {
		console.log("Usage: node build.js --input ./dashboards --output ./dist/dashboards --id my-team --name \"My Team\"\nStatic registry build: validates XML and metadata without executing scripts. Use the App API or metrixbar check for full validation.");
		return;
	}
	if (![
		"input",
		"output",
		"id",
		"name"
	].every((key) => values[key])) throw new Error("Required options: --input --output --id --name (see --help)");
	const index = await buildRegistry(values);
	console.log(`Built ${index.dashboards.length} dashboards. Static build only; scripts were not executed. Use the App API or metrixbar check for full validation.`);
}
main().catch((error) => {
	console.error(`build: ${error.message}`);
	process.exitCode = 1;
});

})();