import init, {
  Adapter,
  Schema,
  initialize,
  executeQuery,
} from '../../www2/trustfall_wasm.js';

console.log('running wasm init...');
await init();
console.log('wasm init complete');

console.log('Query system init...');
initialize();
console.log('Query system initialized');

postMessage('ready');

export default class QueryWorker<V> {
  adapter: Adapter<V>
  schema: Schema
  currentResultIter: Iterator<any> | undefined = undefined

  constructor(adapter: Adapter<V>, schemaText: string) {
    this.adapter = adapter;
    this.schema = Schema.parse(schemaText);
  }

  performQuery = (query: string, args: any): any => {
    if (query == null || query == undefined) {
      throw new Error(`Cannot perform null/undef query.`);
    }
    if (args == null || args == undefined) {
      throw new Error(`Cannot perform query with null/undef args.`);
    }

    // TODO: figure out why the schema object gets set to null
    //       as part of the executeQuery() call.

    const resultIter = executeQuery(this.schema, this.adapter, query, args);

    return resultIter;
  }

  dispatch = (event: MessageEvent): void => {
    const payload = event.data;

    console.log('Adapter received message:', payload);
    if (payload.op === 'query') {
      this.currentResultIter = this.performQuery(payload.query, payload.args);
      payload.op = 'next';
    }

    if (payload.op === 'next') {
      if (this.currentResultIter === undefined) {
        throw new Error('No query results to iterate')
      }
      const rawResult = this.currentResultIter.next();
      const result = {
        done: rawResult.done,
        value: rawResult.value,
      };
      console.log('Adapter posting:', result);
      postMessage(result);
      return;
    }
  }
}
