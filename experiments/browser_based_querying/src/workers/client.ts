import { SyncContext } from './sync';

interface RequestMessage {
  url: URL | string,
  fetchOptions: RequestInit,
}

export default class FetcherWorkerClient {
  worker: Worker

  constructor() {
    this.worker = new Worker(new URL('./fetcher', import.meta.url), { type: 'module' }); 
  }

  get = (
    message: RequestMessage,
  ): string => {
    const sync = SyncContext.makeDefault();
    this.worker.postMessage({
      sync: sync.makeSendable(),
      input: message.url,
      init: message.fetchOptions,
    });
    return new TextDecoder().decode(sync.receive());
  }

  getJSON = <T = unknown>(
    message: RequestMessage,
  ): T => {
    const result = this.get(message)
    return JSON.parse(result)
  }
}

export function* lazyFetchMap<InT, OutT>(
  client: FetcherWorkerClient,
  inputs: Array<InT> | null,
  func: (client: FetcherWorkerClient, arg: InT) => OutT
): IterableIterator<OutT> {
  if (inputs) {
    for (const input of inputs) {
      const result = func(client, input);
      if (result != null) {
        yield result;
      }
    }
  }
}
