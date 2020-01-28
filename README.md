# jareth - validated db access for typescript

This is an experiment in wrapping [pg-promise](https://github.com/vitaly-t/pg-promise) with a Java-like "row mapper" for validation and typecasting. It is very early and probably doesn't work for a lot of use cases. It also will likely either start including more opinionated abstractions around pg-promise, or be turned into a pure validations library with a focus on row mapping (such as including utilities for splitting joined tables) that can be used with pg-promise directly.

Currently, it contains the ability to supply an arbitrary row-mapper with signature `(row: any) => T` to your queries. It also has built-in utilities for working with [io-ts codecs](https://github.com/gcanti/io-ts), which I've been using as my row-mapper.

### Usage

```ts
import * as t from 'io-ts';
import Jareth, { mapDecode } from '../src';

const UserCodec = t.type({
  id: t.number,
  name: t.string
});

// creates a pg-promise db client + connection pool
const jareth = new Jareth(DATABASE_URL);

// use withHandle() to bind to a connection and make a query
const result = await jareth.withHandle(async (handle) => {
  const query = handle.createQuery(
    'SELECT * FROM users WHERE id=${userId}',
  );

  return query.one(
    {userId: 1},
    mapDecode(UserCodec)
  );
});

// TypeScript will type "result" as typeof UserCodec
console.log(result);  // {id: 1, name: 'jeff'}
```

Available query functions:

* `none()` - Return nothing (throws an error if any result rows!)
* `one()` - Return one item or throw an error
* `oneOrNone()` - Return one item or `null`
* `many()` - Return many items or throw an error for zero
* `manyOrNone()` - Return 0 or more items (always an array)

## Why?

### Background

Using direct database access in TypeScript (or JavaScript, really) is a fraught process. A common mistake is want to do something like:

```ts
interface UserModel {
  id: number;
  name: string;
}

// findOne() "returns" an instance of the passed type
const user = await findOne<UserModel>('select * FROM users');
```

This will compile just fine, and run just fine, assuming your DB library output an object with `id` and `name` keys.

The mistake here is that there is no _runtime validation_ of this return type. If you happen to make a mistake when defining your static type - such as forgetting your table has a column called `username`, not `name` - _nothing in TypeScript_ will check this.

This may come as a surprise to anyone reading who hasn't used TypeScript, but I'm sure will get a "well, duh" response from anyone who has. TypeScript's entire design is built around being an [_erased types_ system](https://github.com/microsoft/TypeScript/wiki/FAQ#what-is-type-erasure). At runtime, the `UserModel` interface doesn't exist, and the result row is just... an object of who-knows-what. Hopefully, an `id` and `name`, but nothing _guarantees_ that. As someone who rarely gets my DB queries right the first time, I wasn't very happy with this.

### Possibilities

So, how do we solve this? Some people like _typed query-builders_ as one solution - basically, instead of using SQL strings, use something that generates the SQL _from_ a static type. A lot of ORMs can do this to make sure `User.findOne()` always returns a `User` class with the correct fields. This requires some kind of runtime analysis, of course, extracted using decorator and metadata magic that I always have a wary skepticism of.

The other common option is _code generation_ - basically, generate static types from your schema. In the simplest form, this would basically be having generating a `UserModel` interface from a `users` table. This is an interesting thing, but falls apart fast once you get into more complex queries - how do you represent the result set of something like:

```sql
SELECT users.*, phones.*
FROM users
JOIN phones ON users.phone_id = phones.id;
```

You can construct the type yourself with `type ResultsTable = UsersTable & PhonesTable` or whatever, but then you're back in the realm of _hoping_ your static types match up with query.

The only way to make code generation for queries _really_ work is... well, to tie them with a typed query builder! This is essentially what you get from [jOOQ](https://www.jooq.org/) for Java or [Diesel](http://diesel.rs/) for Rust. If your query builder constructs your queries using your schema-generated types, and is smart enough to know how these types can be joined and subqueried and whatnot, then you're golden.

As far as I know: no one has made a truly full-featured typed query builder for TypeScript. And it seems really, _really_ hard. The closest I've seen is [typed-knex](https://github.com/wwwouter/typed-knex), an impressive project that adds type safety to the popular [Knex.js](http://knexjs.org/) query builder. It does this through some advanced type logic that is well and truly beyond my grasp.

Unfortunately, while I found typed-knex covered a lot of basic cases very well, it didn't cover a lot of my usages. Being a library originally made by one person for their own use, it's impressive that it does as much as it does - it certainly covers its listed goal of being useful for 80% of use cases, and having untyped escape hatches for the other 20% - but I wanted something simpler to reason about.

### Row Mapping

I did some explorations of using other static typed backends - Go with [sqlx](https://github.com/jmoiron/sqlx), and Kotlin/JVM with [JDBI](https://jdbi.org/). Both of these libraries offer writing direct SQL queries with a concept of a _row mapper_ that casts the results into data types of a certain type.

This is, honestly, a really obvious abstraction - I had been manually serializing my incoming rows into types already - but what made it click was that this is the process by which one gets _runtime validation_ in these libraries, not just static typing. The point isn't just to get out a `User` Java class or Go struct, but to also, while deserializing into these concrete data structures (which exist at runtime!), to validate the incoming database rows.

And, thus, we come back to this library, Jareth, named for one [goblin king](https://en.wikipedia.org/wiki/Jareth). Jareth is, basically, an attempt to clone the featureset of JDBI in TypeScript. Turns out, [pg-promise](https://github.com/vitaly-t/pg-promise) handles many of the features of JDBI I wanted that you don't get from the `node-postgres` library - like named parameters and `WHERE IN (list)` bindings - and had a simple-to-wrap API. Arguably, I could have eschewed wrapping it at all, in favor of just validating its results, but I wanted to have a nice, semi-opinionated API to build against.

I've been using [io-ts](https://github.com/gcanti/io-ts) for ad-hoc validation of various objects in TypeScript, and it seemed like a good fit for runtime type validation here. It has its own [DSL for constructing types](https://github.com/gcanti/io-ts#implemented-types--combinators), but they map easily to TS types. I may end up adding some additional validators or type converters for other Postgres database types (JSON will likely end up being a whole thing...), but for now it works well with scalar fields and arrays (and dates using `import { Date as DateType } from 'io-ts-types/lib/Date'`).