/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/worker/sync.ts":
/*!****************************!*\
  !*** ./src/worker/sync.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SyncContext": () => (/* binding */ SyncContext)
/* harmony export */ });
class SyncContext {
  static CTRL_BUFFER_LENGTH = 12;
  static CONTENT_BUFFER_LENGTH = 4096;
  static CTRL_OFFSET_STATE = 0;
  static CTRL_OFFSET_CURRENT_WRITE_SIZE = 1;
  static CTRL_OFFSET_TOTAL_SIZE = 2;
  static STATE_WAITING_FOR_DATA = 128;
  static STATE_DONE = 1;
  static STATE_BUFFER_FULL = 2;
  static STATE_TERMINATED_ERROR = 3;

  constructor({
    ctrlBuffer,
    contentBuffer
  }) {
    this.ctrlBuffer = ctrlBuffer;
    this.contentBuffer = contentBuffer;
    this.ctrl = new Int32Array(this.ctrlBuffer);
    Atomics.store(this.ctrl, SyncContext.CTRL_OFFSET_STATE, SyncContext.STATE_WAITING_FOR_DATA);
  }

  static makeDefault() {
    const ctrlBuffer = new SharedArrayBuffer(SyncContext.CTRL_BUFFER_LENGTH);
    const contentBuffer = new SharedArrayBuffer(SyncContext.CONTENT_BUFFER_LENGTH);
    return new SyncContext({
      ctrlBuffer,
      contentBuffer
    });
  }

  makeSendable() {
    return {
      ctrlBuffer: this.ctrlBuffer,
      contentBuffer: this.contentBuffer
    };
  }

  sendError(reason) {
    const array = new TextEncoder().encode(reason);
    this.sendInner(array, true);
  }

  send(array) {
    this.sendInner(array, false);
  }

  sendInner(array, isError) {
    let position = 0;
    let remainingBytes = array.byteLength;
    Atomics.store(this.ctrl, SyncContext.CTRL_OFFSET_TOTAL_SIZE, remainingBytes);
    const writeBuffer = new Uint8Array(this.contentBuffer);

    while (remainingBytes > this.contentBuffer.byteLength) {
      // Write a portion of the data, since the remaining size is larger than our buffer.
      const temp = array.slice(position, position + writeBuffer.byteLength);
      writeBuffer.set(temp);
      position += writeBuffer.byteLength;
      remainingBytes -= writeBuffer.byteLength;
      Atomics.store(this.ctrl, SyncContext.CTRL_OFFSET_CURRENT_WRITE_SIZE, writeBuffer.byteLength);
      Atomics.store(this.ctrl, SyncContext.CTRL_OFFSET_STATE, SyncContext.STATE_BUFFER_FULL);
      Atomics.notify(this.ctrl, SyncContext.CTRL_OFFSET_STATE);
      Atomics.wait(this.ctrl, SyncContext.CTRL_OFFSET_STATE, SyncContext.STATE_BUFFER_FULL);
    } // Write the remaining data, which will completely fit in our buffer.


    const temp = array.slice(position);
    writeBuffer.set(temp);
    Atomics.store(this.ctrl, SyncContext.CTRL_OFFSET_CURRENT_WRITE_SIZE, remainingBytes);

    if (isError) {
      Atomics.store(this.ctrl, SyncContext.CTRL_OFFSET_STATE, SyncContext.STATE_TERMINATED_ERROR);
    } else {
      Atomics.store(this.ctrl, SyncContext.CTRL_OFFSET_STATE, SyncContext.STATE_DONE);
    }

    Atomics.notify(this.ctrl, SyncContext.CTRL_OFFSET_STATE);
  }

  receive() {
    Atomics.wait(this.ctrl, SyncContext.CTRL_OFFSET_STATE, SyncContext.STATE_WAITING_FOR_DATA);
    const totalLength = Atomics.load(this.ctrl, SyncContext.CTRL_OFFSET_TOTAL_SIZE);
    const output = new Uint8Array(totalLength);
    const content = new Uint8Array(this.contentBuffer);
    let writePosition = 0;
    let currentState = Atomics.load(this.ctrl, SyncContext.CTRL_OFFSET_STATE);

    while (currentState == SyncContext.STATE_BUFFER_FULL) {
      // Receiving a portion of the full output.
      const readLength = Atomics.load(this.ctrl, SyncContext.CTRL_OFFSET_CURRENT_WRITE_SIZE);
      const temp = this.contentBuffer.slice(0, readLength);
      output.set(new Uint8Array(temp), writePosition);
      writePosition += readLength;
      Atomics.store(this.ctrl, SyncContext.CTRL_OFFSET_STATE, SyncContext.STATE_WAITING_FOR_DATA);
      Atomics.notify(this.ctrl, SyncContext.CTRL_OFFSET_STATE);
      Atomics.wait(this.ctrl, SyncContext.CTRL_OFFSET_STATE, SyncContext.STATE_WAITING_FOR_DATA);
      currentState = Atomics.load(this.ctrl, SyncContext.CTRL_OFFSET_STATE);
    } // Receiving the last of the output data.


    const readLength = Atomics.load(this.ctrl, SyncContext.CTRL_OFFSET_CURRENT_WRITE_SIZE);
    const temp = this.contentBuffer.slice(0, readLength);
    output.set(new Uint8Array(temp), writePosition); // Return the state to its initial value.

    Atomics.store(this.ctrl, SyncContext.CTRL_OFFSET_STATE, SyncContext.STATE_WAITING_FOR_DATA);

    if (currentState === SyncContext.STATE_DONE) {
      return output;
    } else if (currentState === SyncContext.STATE_TERMINATED_ERROR) {
      throw new Error(new TextDecoder().decode(output));
    } else {
      throw new Error(`SyncContext: unexpected final state ${currentState}`);
    }
  }

}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./src/worker/fetcher.ts ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _sync__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sync */ "./src/worker/sync.ts");


onmessage = function fetchHandler(e) {
  const data = e.data;
  console.log('Fetcher received channel data:', data);
  const sync = new _sync__WEBPACK_IMPORTED_MODULE_0__.SyncContext(data.sync);
  fetch(data.input, data.init).then(response => {
    console.log('worker fetch complete:', response.ok, response.status);

    if (!response.ok) {
      console.log('non-ok response:', response.status);
      sync.sendError(`non-ok response: ${response.status}`);
    } else {
      response.blob().then(blob => blob.arrayBuffer()).then(buffer => {
        sync.send(new Uint8Array(buffer));
      }).catch(reason => {
        console.log('blob error:', response.status);
        sync.sendError(`blob error: ${reason}`);
      });
    }
  }).catch(reason => {
    console.log('fetch error:', reason);
    sync.sendError(`fetch error: ${reason}`);
  });
};
})();

/******/ })()
;
//# sourceMappingURL=fetcher.js.map