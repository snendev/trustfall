import QueryWorker from '../workers/worker';
import FetcherWorkerClient from '../workers/client';

import Adapter from './adapter';
// @ts-ignore VSCode is not understanding the webpack config
import schema from './schema.graphql';

const adapter = new Adapter(new FetcherWorkerClient())
const queryWorker = new QueryWorker(adapter, schema);

onmessage = queryWorker.dispatch;
