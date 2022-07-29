import Client from '../workers/client'

const API_URL = 'https://www.ebi.ac.uk/pdbe/pdbe-kb/3dbeacons/api'

interface HackerNewsItem {
  type: string;
}

export function materializeItem(client: Client, itemId: number): HackerNewsItem {
  const url = `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`;
  const fetchOptions = {
    method: 'GET',
  };
  const item = client.getJSON<HackerNewsItem>({url, fetchOptions});
  console.log('materialized item:', item);

  return item;
}

export function materializeUser(client: Client, username: string): unknown {
  const url = `https://hacker-news.firebaseio.com/v0/user/${username}.json`;
  const fetchOptions = {
    method: 'GET',
  };
  const user = client.getJSON<any>({url, fetchOptions});
  console.log('materialized user:', user);

  return user;
}

export function* getTopItems(client: Client): Generator<HackerNewsItem> {
  const url = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  const fetchOptions = {
    method: 'GET',
    // "credentials": "omit",
  };

  const storyIds = client.getJSON<any[]>({url, fetchOptions})
  console.log('storyIds=', storyIds);

  for (const id of storyIds) {
    const item = materializeItem(client, id);
    const itemType = item['type'];

    // Ignore polls. They are very rarely made on HackerNews,
    // and they are not supported in our query schema.
    if (itemType === 'story' || itemType === 'job') {
      yield item;
    }
  }
}

export function* getLatestItems(client: Client): Generator<HackerNewsItem> {
  const url = 'https://hacker-news.firebaseio.com/v0/newstories.json';
  const fetchOptions = {
    method: 'GET',
    // "credentials": "omit",
  };

  const storyIds = client.getJSON<any[]>({url, fetchOptions});
  console.log('storyIds=', storyIds);

  for (const id of storyIds) {
    const item = materializeItem(client, id);
    const itemType = item['type'];

    // Ignore polls. They are very rarely made on HackerNews,
    // and they are not supported in our query schema.
    if (itemType === 'story' || itemType === 'job') {
      yield item;
    }
  }
}
