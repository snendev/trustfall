import { SendableSyncContext, SyncContext } from './sync';

interface ChannelData {
  input: string;
  init: {
    method: 'GET';
  };
  sync: SendableSyncContext;
}

onmessage = function fetchHandler(e: MessageEvent<ChannelData>): void {
  const data = e.data;
  console.log('Fetcher received channel data:', data);

  const sync = new SyncContext(data.sync);

  fetch(data.input, data.init)
    .then((response) => {
      console.log('worker fetch complete:', response.ok, response.status);
      if (!response.ok) {
        console.log('non-ok response:', response.status);
        sync.sendError(`non-ok response: ${response.status}`);
      } else {
        response
          .blob()
          .then((blob) => blob.arrayBuffer())
          .then((buffer) => {
            sync.send(new Uint8Array(buffer));
          })
          .catch((reason) => {
            console.log('blob error:', response.status);
            sync.sendError(`blob error: ${reason}`);
          });
      }
    })
    .catch((reason) => {
      console.log('fetch error:', reason);
      sync.sendError(`fetch error: ${reason}`);
    });
}
