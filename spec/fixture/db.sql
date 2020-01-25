DROP SCHEMA public CASCADE;
CREATE SCHEMA public AUTHORIZATION postgres;

CREATE TABLE users (
  id SERIAL NOT NULL,
  name TEXT NOT NULL,
  maniaplanet_name TEXT
);

INSERT INTO users (name, maniaplanet_name) VALUES ('jeff', 'MonsterDunk');
INSERT INTO users (name) VALUES ('vinny');
INSERT INTO users (name) VALUES ('brad');