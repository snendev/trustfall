/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/adapter.ts":
/*!************************!*\
  !*** ./src/adapter.ts ***!
  \************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MyAdapter": () => (/* binding */ MyAdapter),
/* harmony export */   "schemaText": () => (/* binding */ schemaText)
/* harmony export */ });
/* harmony import */ var _hackernews__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./hackernews */ "./src/hackernews.ts");
/* harmony import */ var _worker_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./worker/client */ "./src/worker/client.ts");
/* harmony import */ var _worker_worker__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./worker/worker */ "./src/worker/worker.ts");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_worker_worker__WEBPACK_IMPORTED_MODULE_2__]);
_worker_worker__WEBPACK_IMPORTED_MODULE_2__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];


 // TODO: This is a copy of schema.graphql, find a better way to include it.

const schemaText = `
schema {
  query: RootSchemaQuery
}
directive @filter(op: String!, value: [String!]) on FIELD | INLINE_FRAGMENT
directive @tag(name: String) on FIELD
directive @output(name: String) on FIELD
directive @optional on FIELD
directive @recurse(depth: Int!) on FIELD
directive @fold on FIELD

type RootSchemaQuery {
  HackerNewsFrontPage: [HackerNewsItem!]!
  HackerNewsTop(max: Int): [HackerNewsItem!]!
  HackerNewsLatestStories(max: Int): [HackerNewsStory!]!
  HackerNewsUser(name: String!): HackerNewsUser
}

interface HackerNewsItem {
  id: Int!
  unixTime: Int!
  ownUrl: String!
}

type HackerNewsJob implements HackerNewsItem {
  # properties from HackerNewsItem
  id: Int!
  unixTime: Int!
  ownUrl: String!

  # own properties
  title: String!
  score: Int!
  url: String!

  # edges
  link: Webpage!
}

type HackerNewsStory implements HackerNewsItem {
  # properties from HackerNewsItem
  id: Int!
  unixTime: Int!
  ownUrl: String!

  # own properties
  byUsername: String!
  score: Int!
  text: String
  title: String!
  url: String
  commentsCount: Int!

  # edges
  byUser: HackerNewsUser!
  comment: [HackerNewsComment!]
  link: Webpage
}

type HackerNewsComment implements HackerNewsItem {
  # properties from HackerNewsItem
  id: Int!
  unixTime: Int!
  ownUrl: String!

  # own properties
  text: String!
  byUsername: String!

  # edges
  byUser: HackerNewsUser!
  reply: [HackerNewsComment!]
  parent: HackerNewsItem!  # either a parent comment or the story being commented on

  # not implemented yet
  # topmostAncestor: HackerNewsItem!  # the ultimate ancestor of this item: a story or job
}

type HackerNewsUser {
  id: String!
  karma: Int!
  about: String
  unixCreatedAt: Int!

  # The HackerNews API treats submissions of comments and stories the same way.
  # The way to get only a user's submitted stories is to use this edge then
  # apply a type coercion on the \`HackerNewsItem\` vertex on edge endpoint:
  # \`...on HackerNewsStory\`
  submitted: [HackerNewsItem!]
}

interface Webpage {
  url: String!
}
`;
console.log('Schema loaded.');
const HNItemFieldMappings = {
  id: 'id',
  unixTime: 'time',
  title: 'title',
  score: 'score',
  url: 'url',
  byUsername: 'by',
  text: 'text',
  commentsCount: 'descendants'
};
const HNUserFieldMappings = {
  id: 'id',
  karma: 'karma',
  about: 'about',
  unixCreatedAt: 'created'
};

function* limitIterator(iter, limit) {
  let count = 0;

  for (const item of iter) {
    yield item;
    count += 1;

    if (count == limit) {
      break;
    }
  }
}

class MyAdapter {
  constructor(client) {
    this.client = client;
  }

  *getStartingTokens(edge, parameters) {
    if (edge === 'HackerNewsFrontPage') {
      return limitIterator((0,_hackernews__WEBPACK_IMPORTED_MODULE_0__.getTopItems)(this.client), 30);
    } else if (edge === 'HackerNewsTop') {
      const limit = parameters['max'];
      const iter = (0,_hackernews__WEBPACK_IMPORTED_MODULE_0__.getTopItems)(this.client);

      if (limit == undefined) {
        yield* iter;
      } else {
        yield* limitIterator(iter, limit);
      }
    } else if (edge === 'HackerNewsLatestStories') {
      const limit = parameters['max'];
      const iter = (0,_hackernews__WEBPACK_IMPORTED_MODULE_0__.getLatestItems)(this.client);

      if (limit == undefined) {
        yield* iter;
      } else {
        yield* limitIterator(iter, limit);
      }
    } else if (edge === 'HackerNewsUser') {
      const username = parameters['name'];

      if (username == undefined) {
        throw new Error(`No username given: ${edge} ${parameters}`);
      }

      const user = (0,_hackernews__WEBPACK_IMPORTED_MODULE_0__.materializeUser)(this.client, username);

      if (user != null) {
        yield user;
      }
    } else {
      throw new Error(`Unexpected edge ${edge} with params ${parameters}`);
    }
  }

  *projectProperty(data_contexts, current_type_name, field_name) {
    if (current_type_name === 'HackerNewsItem' || current_type_name === 'HackerNewsStory' || current_type_name === 'HackerNewsJob' || current_type_name === 'HackerNewsComment') {
      if (field_name == 'ownUrl') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          let value = null;

          if (vertex) {
            value = `https://news.ycombinator.com/item?id=${vertex.id}`;
          }

          yield {
            localId: ctx.localId,
            value: value
          };
        }
      } else {
        const fieldKey = HNItemFieldMappings[field_name];

        if (fieldKey == undefined) {
          throw new Error(`Unexpected property for type ${current_type_name}: ${field_name}`);
        }

        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          yield {
            localId: ctx.localId,
            value: vertex ? vertex[fieldKey] || null : null
          };
        }
      }
    } else if (current_type_name === 'HackerNewsUser') {
      const fieldKey = HNUserFieldMappings[field_name];

      if (fieldKey == undefined) {
        throw new Error(`Unexpected property for type ${current_type_name}: ${field_name}`);
      }

      for (const ctx of data_contexts) {
        const vertex = ctx.currentToken;
        yield {
          localId: ctx.localId,
          value: vertex ? vertex[fieldKey] || null : null
        };
      }
    } else if (current_type_name === 'Webpage') {
      if (field_name === 'url') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          yield {
            localId: ctx.localId,
            value: vertex?.url || null
          };
        }
      } else {
        throw new Error(`Unexpected property: ${current_type_name} ${field_name}`);
      }
    } else {
      throw new Error(`Unexpected type+property for type ${current_type_name}: ${field_name}`);
    }
  }

  *projectNeighbors(data_contexts, current_type_name, edge_name, parameters) {
    if (current_type_name === 'HackerNewsStory' || current_type_name === 'HackerNewsJob' || current_type_name === 'HackerNewsComment') {
      if (edge_name === 'link') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          let neighbors = [];

          if (vertex) {
            neighbors = [{
              url: vertex.url
            }];
          }

          yield {
            localId: ctx.localId,
            neighbors: neighbors[Symbol.iterator]()
          };
        }
      } else if (edge_name === 'byUser') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;

          if (vertex) {
            yield {
              localId: ctx.localId,
              neighbors: (0,_worker_client__WEBPACK_IMPORTED_MODULE_1__.lazyFetchMap)(this.client, [vertex.by], _hackernews__WEBPACK_IMPORTED_MODULE_0__.materializeUser)
            };
          } else {
            yield {
              localId: ctx.localId,
              neighbors: [][Symbol.iterator]()
            };
          }
        }
      } else if (edge_name === 'comment' || edge_name === 'reply') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          yield {
            localId: ctx.localId,
            neighbors: (0,_worker_client__WEBPACK_IMPORTED_MODULE_1__.lazyFetchMap)(this.client, vertex?.kids, _hackernews__WEBPACK_IMPORTED_MODULE_0__.materializeItem)
          };
        }
      } else if (edge_name === 'parent') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          const parent = vertex?.parent;

          if (parent) {
            yield {
              localId: ctx.localId,
              neighbors: (0,_worker_client__WEBPACK_IMPORTED_MODULE_1__.lazyFetchMap)(this.client, [parent], _hackernews__WEBPACK_IMPORTED_MODULE_0__.materializeItem)
            };
          } else {
            yield {
              localId: ctx.localId,
              neighbors: [][Symbol.iterator]()
            };
          }
        }
      } else {
        throw new Error(`Not implemented: ${current_type_name} ${edge_name} ${parameters}`);
      }
    } else if (current_type_name === 'HackerNewsUser') {
      if (edge_name === 'submitted') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          const submitted = vertex?.submitted;
          yield {
            localId: ctx.localId,
            neighbors: (0,_worker_client__WEBPACK_IMPORTED_MODULE_1__.lazyFetchMap)(this.client, submitted, _hackernews__WEBPACK_IMPORTED_MODULE_0__.materializeItem)
          };
        }
      } else {
        throw new Error(`Not implemented: ${current_type_name} ${edge_name} ${parameters}`);
      }
    } else {
      throw new Error(`Not implemented: ${current_type_name} ${edge_name} ${parameters}`);
    }
  }

  *canCoerceToType(data_contexts, current_type_name, coerce_to_type_name) {
    if (current_type_name === 'HackerNewsItem') {
      let targetType;

      if (coerce_to_type_name === 'HackerNewsStory') {
        targetType = 'story';
      } else if (coerce_to_type_name === 'HackerNewsJob') {
        targetType = 'job';
      } else if (coerce_to_type_name === 'HackerNewsComment') {
        targetType = 'comment';
      } else {
        throw new Error(`Unexpected coercion from ${current_type_name} to ${coerce_to_type_name}`);
      }

      for (const ctx of data_contexts) {
        const vertex = ctx.currentToken;
        yield {
          localId: ctx.localId,
          value: vertex?.type === targetType
        };
      }
    } else {
      throw new Error(`Unexpected coercion from ${current_type_name} to ${coerce_to_type_name}`);
    }
  }

}
const adapter = new MyAdapter(new _worker_client__WEBPACK_IMPORTED_MODULE_1__["default"]());
const queryWorker = new _worker_worker__WEBPACK_IMPORTED_MODULE_2__["default"](adapter, schemaText);
onmessage = queryWorker.dispatch;
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./src/hackernews.ts":
/*!***************************!*\
  !*** ./src/hackernews.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getLatestItems": () => (/* binding */ getLatestItems),
/* harmony export */   "getTopItems": () => (/* binding */ getTopItems),
/* harmony export */   "materializeItem": () => (/* binding */ materializeItem),
/* harmony export */   "materializeUser": () => (/* binding */ materializeUser)
/* harmony export */ });
function materializeItem(client, itemId) {
  const url = `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`;
  const fetchOptions = {
    method: 'GET'
  };
  const item = client.getJSON({
    url,
    fetchOptions
  });
  console.log('materialized item:', item);
  return item;
}
function materializeUser(client, username) {
  const url = `https://hacker-news.firebaseio.com/v0/user/${username}.json`;
  const fetchOptions = {
    method: 'GET'
  };
  const user = client.getJSON({
    url,
    fetchOptions
  });
  console.log('materialized user:', user);
  return user;
}
function* getTopItems(client) {
  const url = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  const fetchOptions = {
    method: 'GET' // "credentials": "omit",

  };
  const storyIds = client.getJSON({
    url,
    fetchOptions
  });
  console.log('storyIds=', storyIds);

  for (const id of storyIds) {
    const item = materializeItem(client, id);
    const itemType = item['type']; // Ignore polls. They are very rarely made on HackerNews,
    // and they are not supported in our query schema.

    if (itemType === 'story' || itemType === 'job') {
      yield item;
    }
  }
}
function* getLatestItems(client) {
  const url = 'https://hacker-news.firebaseio.com/v0/newstories.json';
  const fetchOptions = {
    method: 'GET' // "credentials": "omit",

  };
  const storyIds = client.getJSON({
    url,
    fetchOptions
  });
  console.log('storyIds=', storyIds);

  for (const id of storyIds) {
    const item = materializeItem(client, id);
    const itemType = item['type']; // Ignore polls. They are very rarely made on HackerNews,
    // and they are not supported in our query schema.

    if (itemType === 'story' || itemType === 'job') {
      yield item;
    }
  }
}

/***/ }),

/***/ "./src/worker/client.ts":
/*!******************************!*\
  !*** ./src/worker/client.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ FetcherWorkerClient),
/* harmony export */   "lazyFetchMap": () => (/* binding */ lazyFetchMap)
/* harmony export */ });
/* harmony import */ var _sync__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sync */ "./src/worker/sync.ts");

class FetcherWorkerClient {
  constructor() {
    this.worker = new Worker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u("src_worker_fetcher_ts"), __webpack_require__.b), {
      type: undefined
    });
  }

  get = message => {
    const sync = _sync__WEBPACK_IMPORTED_MODULE_0__.SyncContext.makeDefault();
    this.worker.postMessage({
      sync: sync.makeSendable(),
      input: message.url,
      init: message.fetchOptions
    });
    return new TextDecoder().decode(sync.receive());
  };
  getJSON = message => {
    const result = this.get(message);
    return JSON.parse(result);
  };
}
function* lazyFetchMap(client, inputs, func) {
  if (inputs) {
    for (const input of inputs) {
      const result = func(client, input);

      if (result != null) {
        yield result;
      }
    }
  }
}

/***/ }),

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

/***/ }),

/***/ "./src/worker/worker.ts":
/*!******************************!*\
  !*** ./src/worker/worker.ts ***!
  \******************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ QueryWorker)
/* harmony export */ });
/* harmony import */ var _www2_trustfall_wasm_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../www2/trustfall_wasm.js */ "./www2/trustfall_wasm.js");

console.log('running wasm init...');
await (0,_www2_trustfall_wasm_js__WEBPACK_IMPORTED_MODULE_0__["default"])();
console.log('wasm init complete');
console.log('Query system init...');
(0,_www2_trustfall_wasm_js__WEBPACK_IMPORTED_MODULE_0__.initialize)();
console.log('Query system initialized');
postMessage('ready');
class QueryWorker {
  currentResultIter = undefined;

  constructor(adapter, schemaText) {
    this.adapter = adapter;
    this.schema = _www2_trustfall_wasm_js__WEBPACK_IMPORTED_MODULE_0__.Schema.parse(schemaText);
  }

  performQuery = (query, args) => {
    if (query == null || query == undefined) {
      throw new Error(`Cannot perform null/undef query.`);
    }

    if (args == null || args == undefined) {
      throw new Error(`Cannot perform query with null/undef args.`);
    } // TODO: figure out why the schema object gets set to null
    //       as part of the executeQuery() call.


    const resultIter = (0,_www2_trustfall_wasm_js__WEBPACK_IMPORTED_MODULE_0__.executeQuery)(this.schema, this.adapter, query, args);
    return resultIter;
  };
  dispatch = event => {
    const payload = event.data;
    console.log('Adapter received message:', payload);

    if (payload.op === 'query') {
      this.currentResultIter = this.performQuery(payload.query, payload.args);
      payload.op = 'next';
    }

    if (payload.op === 'next') {
      if (this.currentResultIter === undefined) {
        throw new Error('No query results to iterate');
      }

      const rawResult = this.currentResultIter.next();
      const result = {
        done: rawResult.done,
        value: rawResult.value
      };
      console.log('Adapter posting:', result);
      postMessage(result);
      return;
    }
  };
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ }),

/***/ "./www2/snippets/trustfall_wasm-7ec00372f6bf29da/inline0.js":
/*!******************************************************************!*\
  !*** ./www2/snippets/trustfall_wasm-7ec00372f6bf29da/inline0.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "iterify": () => (/* binding */ iterify)
/* harmony export */ });
function iterify(obj) {
  obj[Symbol.iterator] = function () {
    return this;
  };
}

/***/ }),

/***/ "./www2/trustfall_wasm.js":
/*!********************************!*\
  !*** ./www2/trustfall_wasm.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ContextIterator": () => (/* binding */ ContextIterator),
/* harmony export */   "ContextIteratorItem": () => (/* binding */ ContextIteratorItem),
/* harmony export */   "FrontendError": () => (/* binding */ FrontendError),
/* harmony export */   "InvalidIRQueryError": () => (/* binding */ InvalidIRQueryError),
/* harmony export */   "InvalidSchemaError": () => (/* binding */ InvalidSchemaError),
/* harmony export */   "JsContext": () => (/* binding */ JsContext),
/* harmony export */   "JsEdgeParameters": () => (/* binding */ JsEdgeParameters),
/* harmony export */   "ParseError": () => (/* binding */ ParseError),
/* harmony export */   "QueryArgumentsError": () => (/* binding */ QueryArgumentsError),
/* harmony export */   "QueryResultItem": () => (/* binding */ QueryResultItem),
/* harmony export */   "QueryResultIterator": () => (/* binding */ QueryResultIterator),
/* harmony export */   "Schema": () => (/* binding */ Schema),
/* harmony export */   "ValidationError": () => (/* binding */ ValidationError),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "executeQuery": () => (/* binding */ executeQuery),
/* harmony export */   "initSync": () => (/* binding */ initSync),
/* harmony export */   "initialize": () => (/* binding */ initialize)
/* harmony export */ });
/* harmony import */ var _snippets_trustfall_wasm_7ec00372f6bf29da_inline0_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./snippets/trustfall_wasm-7ec00372f6bf29da/inline0.js */ "./www2/snippets/trustfall_wasm-7ec00372f6bf29da/inline0.js");

let wasm;
const heap = new Array(32).fill(undefined);
heap.push(undefined, null, true, false);

function getObject(idx) {
  return heap[idx];
}

let heap_next = heap.length;

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];
  heap[idx] = obj;
  return idx;
}

function dropObject(idx) {
  if (idx < 36) return;
  heap[idx] = heap_next;
  heap_next = idx;
}

function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}

const cachedTextDecoder = new TextDecoder('utf-8', {
  ignoreBOM: true,
  fatal: true
});
cachedTextDecoder.decode();
let cachedUint8Memory0;

function getUint8Memory0() {
  if (cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }

  return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;
const cachedTextEncoder = new TextEncoder('utf-8');
const encodeString = typeof cachedTextEncoder.encodeInto === 'function' ? function (arg, view) {
  return cachedTextEncoder.encodeInto(arg, view);
} : function (arg, view) {
  const buf = cachedTextEncoder.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length);
    getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len);
  const mem = getUint8Memory0();
  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7F) break;
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }

    ptr = realloc(ptr, len, len = offset + arg.length * 3);
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);
    offset += ret.written;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

let cachedInt32Memory0;

function getInt32Memory0() {
  if (cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }

  return cachedInt32Memory0;
}

function isLikeNone(x) {
  return x === undefined || x === null;
}

let cachedFloat64Memory0;

function getFloat64Memory0() {
  if (cachedFloat64Memory0.byteLength === 0) {
    cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
  }

  return cachedFloat64Memory0;
}

function debugString(val) {
  // primitive types
  const type = typeof val;

  if (type == 'number' || type == 'boolean' || val == null) {
    return `${val}`;
  }

  if (type == 'string') {
    return `"${val}"`;
  }

  if (type == 'symbol') {
    const description = val.description;

    if (description == null) {
      return 'Symbol';
    } else {
      return `Symbol(${description})`;
    }
  }

  if (type == 'function') {
    const name = val.name;

    if (typeof name == 'string' && name.length > 0) {
      return `Function(${name})`;
    } else {
      return 'Function';
    }
  } // objects


  if (Array.isArray(val)) {
    const length = val.length;
    let debug = '[';

    if (length > 0) {
      debug += debugString(val[0]);
    }

    for (let i = 1; i < length; i++) {
      debug += ', ' + debugString(val[i]);
    }

    debug += ']';
    return debug;
  } // Test for built-in


  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;

  if (builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    // Failed to match the standard '[object ClassName]'
    return toString.call(val);
  }

  if (className == 'Object') {
    // we're a user defined class or Object
    // JSON.stringify avoids problems with cycles, and is generally much
    // easier than looping through ownProperties of `val`.
    try {
      return 'Object(' + JSON.stringify(val) + ')';
    } catch (_) {
      return 'Object';
    }
  } // errors


  if (val instanceof Error) {
    return `${val.name}: ${val.message}\n${val.stack}`;
  } // TODO we could test for more things here, like `Set`s and `Map`s.


  return className;
}

function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }

  return instance.ptr;
}
/**
* @param {Schema} schema
* @param {any} adapter
* @param {string} query
* @param {any} args
* @returns {QueryResultIterator}
*/


function executeQuery(schema, adapter, query, args) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);

    _assertClass(schema, Schema);

    var ptr0 = schema.ptr;
    schema.ptr = 0;
    const ptr1 = passStringToWasm0(query, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    wasm.executeQuery(retptr, ptr0, addHeapObject(adapter), ptr1, len1, addHeapObject(args));
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];

    if (r2) {
      throw takeObject(r1);
    }

    return QueryResultIterator.__wrap(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
/**
*/

function initialize() {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);

    wasm.initialize(retptr);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];

    if (r1) {
      throw takeObject(r0);
    }
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e));
  }
}
/**
*/


class ContextIterator {
  static __wrap(ptr) {
    const obj = Object.create(ContextIterator.prototype);
    obj.ptr = ptr;
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_contextiterator_free(ptr);
  }
  /**
  * @returns {ContextIteratorItem}
  */


  next() {
    const ret = wasm.contextiterator_next(this.ptr);
    return ContextIteratorItem.__wrap(ret);
  }

}
/**
*/

class ContextIteratorItem {
  static __wrap(ptr) {
    const obj = Object.create(ContextIteratorItem.prototype);
    obj.ptr = ptr;
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_contextiteratoritem_free(ptr);
  }
  /**
  */


  get done() {
    const ret = wasm.contextiteratoritem_done(this.ptr);
    return ret !== 0;
  }
  /**
  */


  get value() {
    const ret = wasm.contextiteratoritem_value(this.ptr);
    return ret === 0 ? undefined : JsContext.__wrap(ret);
  }

}
/**
*/

class FrontendError {
  toJSON() {
    return {};
  }

  toString() {
    return JSON.stringify(this);
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_frontenderror_free(ptr);
  }

}
/**
*/

class InvalidIRQueryError {
  toJSON() {
    return {};
  }

  toString() {
    return JSON.stringify(this);
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_invalidirqueryerror_free(ptr);
  }

}
/**
*/

class InvalidSchemaError {
  static __wrap(ptr) {
    const obj = Object.create(InvalidSchemaError.prototype);
    obj.ptr = ptr;
    return obj;
  }

  toJSON() {
    return {};
  }

  toString() {
    return JSON.stringify(this);
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_invalidschemaerror_free(ptr);
  }

}
/**
*/

class JsContext {
  static __wrap(ptr) {
    const obj = Object.create(JsContext.prototype);
    obj.ptr = ptr;
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_jscontext_free(ptr);
  }
  /**
  */


  get localId() {
    const ret = wasm.__wbg_get_jscontext_localId(this.ptr);

    return ret >>> 0;
  }
  /**
  */


  set localId(arg0) {
    wasm.__wbg_set_jscontext_localId(this.ptr, arg0);
  }
  /**
  */


  get currentToken() {
    const ret = wasm.jscontext_currentToken(this.ptr);
    return takeObject(ret);
  }

}
/**
*/

class JsEdgeParameters {
  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_jsedgeparameters_free(ptr);
  }
  /**
  * @param {string} name
  * @returns {any}
  */


  get(name) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.jsedgeparameters_get(this.ptr, ptr0, len0);
    return takeObject(ret);
  }
  /**
  * @returns {any}
  */


  into_js_dict() {
    const ret = wasm.jsedgeparameters_into_js_dict(this.ptr);
    return takeObject(ret);
  }

}
/**
*/

class ParseError {
  toJSON() {
    return {};
  }

  toString() {
    return JSON.stringify(this);
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_parseerror_free(ptr);
  }

}
/**
*/

class QueryArgumentsError {
  toJSON() {
    return {};
  }

  toString() {
    return JSON.stringify(this);
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_queryargumentserror_free(ptr);
  }

}
/**
*/

class QueryResultItem {
  static __wrap(ptr) {
    const obj = Object.create(QueryResultItem.prototype);
    obj.ptr = ptr;
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_queryresultitem_free(ptr);
  }
  /**
  */


  get done() {
    const ret = wasm.queryresultitem_done(this.ptr);
    return ret !== 0;
  }
  /**
  */


  get value() {
    const ret = wasm.queryresultitem_value(this.ptr);
    return takeObject(ret);
  }

}
/**
*/

class QueryResultIterator {
  static __wrap(ptr) {
    const obj = Object.create(QueryResultIterator.prototype);
    obj.ptr = ptr;
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_queryresultiterator_free(ptr);
  }
  /**
  * @returns {QueryResultItem}
  */


  next() {
    const ret = wasm.queryresultiterator_next(this.ptr);
    return QueryResultItem.__wrap(ret);
  }

}
/**
*/

class Schema {
  static __wrap(ptr) {
    const obj = Object.create(Schema.prototype);
    obj.ptr = ptr;
    return obj;
  }

  toJSON() {
    return {};
  }

  toString() {
    return JSON.stringify(this);
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_schema_free(ptr);
  }
  /**
  * @param {string} input
  * @returns {Schema}
  */


  static parse(input) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);

      const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len0 = WASM_VECTOR_LEN;
      wasm.schema_parse(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];

      if (r2) {
        throw takeObject(r1);
      }

      return Schema.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }

}
/**
*/

class ValidationError {
  toJSON() {
    return {};
  }

  toString() {
    return JSON.stringify(this);
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();

    wasm.__wbg_validationerror_free(ptr);
  }

}

async function load(module, imports) {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get('Content-Type') != 'application/wasm') {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);

    if (instance instanceof WebAssembly.Instance) {
      return {
        instance,
        module
      };
    } else {
      return instance;
    }
  }
}

function getImports() {
  const imports = {};
  imports.wbg = {};

  imports.wbg.__wbindgen_object_clone_ref = function (arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
  };

  imports.wbg.__wbindgen_object_drop_ref = function (arg0) {
    takeObject(arg0);
  };

  imports.wbg.__wbindgen_string_new = function (arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
  };

  imports.wbg.__wbindgen_json_parse = function (arg0, arg1) {
    const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
  };

  imports.wbg.__wbindgen_json_serialize = function (arg0, arg1) {
    const obj = getObject(arg1);
    const ret = JSON.stringify(obj === undefined ? null : obj);
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
  };

  imports.wbg.__wbg_contextiterator_new = function (arg0) {
    const ret = ContextIterator.__wrap(arg0);

    return addHeapObject(ret);
  };

  imports.wbg.__wbg_queryresultiterator_new = function (arg0) {
    const ret = QueryResultIterator.__wrap(arg0);

    return addHeapObject(ret);
  };

  imports.wbg.__wbg_invalidschemaerror_new = function (arg0) {
    const ret = InvalidSchemaError.__wrap(arg0);

    return addHeapObject(ret);
  };

  imports.wbg.__wbindgen_number_get = function (arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof obj === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
  };

  imports.wbg.__wbg_getStartingTokens_4311e8fbd98a7147 = function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).getStartingTokens(getStringFromWasm0(arg1, arg2), takeObject(arg3));
    return addHeapObject(ret);
  };

  imports.wbg.__wbg_projectProperty_34fe60840b971b0e = function (arg0, arg1, arg2, arg3, arg4, arg5) {
    const ret = getObject(arg0).projectProperty(ContextIterator.__wrap(arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5));
    return addHeapObject(ret);
  };

  imports.wbg.__wbg_projectNeighbors_0e7ab848b1eee864 = function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    const ret = getObject(arg0).projectNeighbors(ContextIterator.__wrap(arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), takeObject(arg6));
    return addHeapObject(ret);
  };

  imports.wbg.__wbg_canCoerceToType_2b6b6ecc7b0ef574 = function (arg0, arg1, arg2, arg3, arg4, arg5) {
    const ret = getObject(arg0).canCoerceToType(ContextIterator.__wrap(arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5));
    return addHeapObject(ret);
  };

  imports.wbg.__wbg_iterify_4e224c3222b26363 = function (arg0) {
    (0,_snippets_trustfall_wasm_7ec00372f6bf29da_inline0_js__WEBPACK_IMPORTED_MODULE_0__.iterify)(getObject(arg0));
  };

  imports.wbg.__wbg_new_693216e109162396 = function () {
    const ret = new Error();
    return addHeapObject(ret);
  };

  imports.wbg.__wbg_stack_0ddaca5d1abfb52f = function (arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
  };

  imports.wbg.__wbg_error_09919627ac0992f5 = function (arg0, arg1) {
    try {
      console.error(getStringFromWasm0(arg0, arg1));
    } finally {
      wasm.__wbindgen_free(arg0, arg1);
    }
  };

  imports.wbg.__wbindgen_is_function = function (arg0) {
    const ret = typeof getObject(arg0) === 'function';
    return ret;
  };

  imports.wbg.__wbindgen_is_object = function (arg0) {
    const val = getObject(arg0);
    const ret = typeof val === 'object' && val !== null;
    return ret;
  };

  imports.wbg.__wbg_next_0e1ee6203bc0f8ed = function (arg0) {
    const ret = getObject(arg0).next;
    return addHeapObject(ret);
  };

  imports.wbg.__wbg_next_9ef803116340cdc1 = function () {
    return handleError(function (arg0) {
      const ret = getObject(arg0).next();
      return addHeapObject(ret);
    }, arguments);
  };

  imports.wbg.__wbg_done_2a1e30464aae6a4d = function (arg0) {
    const ret = getObject(arg0).done;
    return ret;
  };

  imports.wbg.__wbg_value_a495c29471c31da6 = function (arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
  };

  imports.wbg.__wbg_iterator_6ac6eb1e020f18e3 = function () {
    const ret = Symbol.iterator;
    return addHeapObject(ret);
  };

  imports.wbg.__wbg_get_89247d3aeaa38cc5 = function () {
    return handleError(function (arg0, arg1) {
      const ret = Reflect.get(getObject(arg0), getObject(arg1));
      return addHeapObject(ret);
    }, arguments);
  };

  imports.wbg.__wbg_call_4573f605ca4b5f10 = function () {
    return handleError(function (arg0, arg1) {
      const ret = getObject(arg0).call(getObject(arg1));
      return addHeapObject(ret);
    }, arguments);
  };

  imports.wbg.__wbg_getPrototypeOf_61762819d7424c07 = function (arg0) {
    const ret = Object.getPrototypeOf(getObject(arg0));
    return addHeapObject(ret);
  };

  imports.wbg.__wbindgen_debug_string = function (arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
  };

  imports.wbg.__wbindgen_throw = function (arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  };

  return imports;
}

function initMemory(imports, maybe_memory) {}

function finalizeInit(instance, module) {
  wasm = instance.exports;
  init.__wbindgen_wasm_module = module;
  cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
  cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  return wasm;
}

function initSync(bytes) {
  const imports = getImports();
  initMemory(imports);
  const module = new WebAssembly.Module(bytes);
  const instance = new WebAssembly.Instance(module, imports);
  return finalizeInit(instance, module);
}

async function init(input) {
  if (typeof input === 'undefined') {
    input = new URL(/* asset import */ __webpack_require__(/*! trustfall_wasm_bg.wasm */ "./www2/trustfall_wasm_bg.wasm"), __webpack_require__.b);
  }

  const imports = getImports();

  if (typeof input === 'string' || typeof Request === 'function' && input instanceof Request || typeof URL === 'function' && input instanceof URL) {
    input = fetch(input);
  }

  initMemory(imports);
  const {
    instance,
    module
  } = await load(await input, imports);
  return finalizeInit(instance, module);
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (init);

/***/ }),

/***/ "./www2/trustfall_wasm_bg.wasm":
/*!*************************************!*\
  !*** ./www2/trustfall_wasm_bg.wasm ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "b35137c19feb8dab1116.wasm";

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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 		var resolveQueue = (queue) => {
/******/ 			if(queue && !queue.d) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					var queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					var obj = {};
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			var ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			var queue;
/******/ 			hasAwait && ((queue = []).d = 1);
/******/ 			if(queue) queue.moduleId = module.id;
/******/ 			var depQueues = new Set();
/******/ 			var exports = module.exports;
/******/ 			var currentDeps;
/******/ 			var outerResolve;
/******/ 			var reject;
/******/ 			var promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			promise.moduleId = module.id;
/******/ 			module.exports = promise;
/******/ 			body((deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				var fn;
/******/ 				var getResult = () => (currentDeps.map((d) => {
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				var promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 			queue && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/ 	
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
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
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
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = document.baseURI || self.location.href;
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"adapter": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// no jsonp function
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/adapter.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=adapter.js.map