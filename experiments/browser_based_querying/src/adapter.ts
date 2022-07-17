import {
  Adapter,
  JsEdgeParameters,
  JsContext,
  ContextAndValue,
  ContextAndNeighborsIterator,
  ContextAndBool,
} from '../www2/trustfall_wasm.js';

import { getTopItems, getLatestItems, materializeItem, materializeUser } from './hackernews';
import FetcherWorkerClient, { lazyFetchMap } from './workers/client';
import QueryWorker from './workers/worker';

// TODO: This is a copy of schema.graphql, find a better way to include it.
export const schemaText = `
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

type Vertex = any;

const HNItemFieldMappings: Record<string, string> = {
  id: 'id',
  unixTime: 'time',
  title: 'title',
  score: 'score',
  url: 'url',
  byUsername: 'by',
  text: 'text',
  commentsCount: 'descendants',
};

const HNUserFieldMappings: Record<string, string> = {
  id: 'id',
  karma: 'karma',
  about: 'about',
  unixCreatedAt: 'created',
};

function* limitIterator<T>(iter: IterableIterator<T>, limit: number): IterableIterator<T> {
  let count = 0;
  for (const item of iter) {
    yield item;
    count += 1;
    if (count == limit) {
      break;
    }
  }
}

export class MyAdapter implements Adapter<Vertex> {
  client: FetcherWorkerClient

  constructor(client: FetcherWorkerClient) {
    this.client = client;
  }

  *getStartingTokens(edge: string, parameters: JsEdgeParameters): IterableIterator<Vertex> {
    if (edge === 'HackerNewsFrontPage') {
      return limitIterator(getTopItems(this.client), 30);
    } else if (edge === 'HackerNewsTop') {
      const limit = parameters['max'];
      const iter = getTopItems(this.client);
      if (limit == undefined) {
        yield* iter;
      } else {
        yield* limitIterator(iter, limit as number);
      }
    } else if (edge === 'HackerNewsLatestStories') {
      const limit = parameters['max'];
      const iter = getLatestItems(this.client);
      if (limit == undefined) {
        yield* iter;
      } else {
        yield* limitIterator(iter, limit as number);
      }
    } else if (edge === 'HackerNewsUser') {
      const username = parameters['name'];
      if (username == undefined) {
        throw new Error(`No username given: ${edge} ${parameters}`);
      }

      const user = materializeUser(this.client, username as string);
      if (user != null) {
        yield user;
      }
    } else {
      throw new Error(`Unexpected edge ${edge} with params ${parameters}`);
    }
  }

  *projectProperty(
    data_contexts: IterableIterator<JsContext<Vertex>>,
    current_type_name: string,
    field_name: string
  ): IterableIterator<ContextAndValue> {
    if (
      current_type_name === 'HackerNewsItem' ||
      current_type_name === 'HackerNewsStory' ||
      current_type_name === 'HackerNewsJob' ||
      current_type_name === 'HackerNewsComment'
    ) {
      if (field_name == 'ownUrl') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;

          let value = null;
          if (vertex) {
            value = `https://news.ycombinator.com/item?id=${vertex.id}`;
          }

          yield {
            localId: ctx.localId,
            value: value,
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
            value: vertex ? vertex[fieldKey] || null : null,
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
          value: vertex ? vertex[fieldKey] || null : null,
        };
      }
    } else if (current_type_name === 'Webpage') {
      if (field_name === 'url') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          yield {
            localId: ctx.localId,
            value: vertex?.url || null,
          };
        }
      } else {
        throw new Error(`Unexpected property: ${current_type_name} ${field_name}`);
      }
    } else {
      throw new Error(`Unexpected type+property for type ${current_type_name}: ${field_name}`);
    }
  }

  *projectNeighbors(
    data_contexts: IterableIterator<JsContext<Vertex>>,
    current_type_name: string,
    edge_name: string,
    parameters: JsEdgeParameters
  ): IterableIterator<ContextAndNeighborsIterator<Vertex>> {
    if (
      current_type_name === 'HackerNewsStory' ||
      current_type_name === 'HackerNewsJob' ||
      current_type_name === 'HackerNewsComment'
    ) {
      if (edge_name === 'link') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          let neighbors: Vertex[] = [];
          if (vertex) {
            neighbors = [{ url: vertex.url }];
          }
          yield {
            localId: ctx.localId,
            neighbors: neighbors[Symbol.iterator](),
          };
        }
      } else if (edge_name === 'byUser') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          if (vertex) {
            yield {
              localId: ctx.localId,
              neighbors: lazyFetchMap(this.client, [vertex.by], materializeUser),
            };
          } else {
            yield {
              localId: ctx.localId,
              neighbors: [][Symbol.iterator](),
            };
          }
        }
      } else if (edge_name === 'comment' || edge_name === 'reply') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          yield {
            localId: ctx.localId,
            neighbors: lazyFetchMap(this.client, vertex?.kids, materializeItem),
          };
        }
      } else if (edge_name === 'parent') {
        for (const ctx of data_contexts) {
          const vertex = ctx.currentToken;
          const parent = vertex?.parent;
          if (parent) {
            yield {
              localId: ctx.localId,
              neighbors: lazyFetchMap(this.client, [parent], materializeItem),
            };
          } else {
            yield {
              localId: ctx.localId,
              neighbors: [][Symbol.iterator](),
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
            neighbors: lazyFetchMap(this.client, submitted, materializeItem),
          };
        }
      } else {
        throw new Error(`Not implemented: ${current_type_name} ${edge_name} ${parameters}`);
      }
    } else {
      throw new Error(`Not implemented: ${current_type_name} ${edge_name} ${parameters}`);
    }
  }

  *canCoerceToType(
    data_contexts: IterableIterator<JsContext<Vertex>>,
    current_type_name: string,
    coerce_to_type_name: string
  ): IterableIterator<ContextAndBool> {
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
          value: vertex?.type === targetType,
        };
      }
    } else {
      throw new Error(`Unexpected coercion from ${current_type_name} to ${coerce_to_type_name}`);
    }
  }
}

const adapter = new MyAdapter(new FetcherWorkerClient())
const queryWorker = new QueryWorker(adapter, schemaText);

onmessage = queryWorker.dispatch;
