# jareth - validated db access for typescript

This is an experiment in wrapping [pg-promise](https://github.com/vitaly-t/pg-promise) with a Java-like "row mapper" for validation and typecasting. It is stil very early and probably doesn't work for a lot of use cases. It also will likely either start including more opinionated abstractions around pg-promise, or be turned into a pure validations library with a focus on row mapping (such as including utilities for splitting joined tables) that can be used with pg-promise directly.

Currently, it contains both the ability to supply an arbitrary row-mapper with signature `(row: any) => T` to your queries. It also has built-in utilities for working with [io-ts codecs](https://github.com/gcanti/io-ts), which I've been using as my row-mapper.

### Usage

```ts
import * as t from 'io-ts';
import Jareth, { mapDecode } from '../src';

const UserCodec = t.type({
  id: t.number,
  name: t.string
});

const result = await jareth.withHandle(async (handle) => {
  const query = handle.createQuery(
    'SELECT * FROM users WHERE id=${userId}',
    {userId: 1},
    mapDecode(UserCodec)
  );
  return query.one();
});

// TypeScript will type "result" as typeof UserCodec
console.log(result);  // {id: 1, name: 'jeff'}
```
