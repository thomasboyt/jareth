DROP SCHEMA public CASCADE;
CREATE SCHEMA public AUTHORIZATION postgres;

CREATE TABLE users (
  id SERIAL NOT NULL,
  name TEXT NOT NULL
);

INSERT INTO users (name) VALUES ('jeff');
INSERT INTO users (name) VALUES ('vinny');
INSERT INTO users (name) VALUES ('brad');