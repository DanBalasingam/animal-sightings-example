-- this is a good reference when you get to issues in the
-- database or any errors that indicate something was wrong
--
-- (hint)
--   anything related to moving data from what a user
--   on your website submits to your database.
--   you may want to check what constraints and checks
--   need to be accounted for.

-- then we will repopulate them
DROP TABLE IF EXISTS image;
DROP TABLE IF EXISTS location;
DROP TABLE IF EXISTS location_terrain_feature;
DROP TABLE IF EXISTS species;
DROP TABLE IF EXISTS species_category;
DROP TABLE IF EXISTS threat_category;
DROP TABLE IF EXISTS terrain_feature;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS sighting;

CREATE TABLE species_category
(
    id   integer PRIMARY KEY,
    name varchar(100) UNIQUE NOT NULL -- bird, lizard, and so on...
);

CREATE TABLE threat_category
(
    id   integer PRIMARY KEY,
    name varchar(50) UNIQUE NOT NULL -- critical, endangered, ...
);

CREATE TABLE terrain_feature
(
    id   integer PRIMARY KEY,
    name varchar(100) UNIQUE NOT NULL -- mountain, valley, ...
);

CREATE TABLE location
(
    id        integer PRIMARY KEY,
    name      varchar(150) NOT NULL, -- "Christchurch"
    latitude  REAL         NOT NULL, -- 21.306944
    longitude REAL         NOT NULL, -- -157.858333
    region    varchar(150)           -- "Canterbury"
);

CREATE TABLE location_terrain_feature
(
    location_id integer NOT NULL,
    feature_id  integer NOT NULL,
    PRIMARY KEY (location_id, feature_id),

    -- the pair of location and feature must be unique
    -- i.e. Arthurs pass has mountains in it's terrain cannot be stated twice
    UNIQUE (location_id, feature_id),

    -- location_id must be a valid location in the database
    FOREIGN KEY (location_id)
        REFERENCES location (id),

    -- feature_id must be a terrain feature in the database
    FOREIGN KEY (feature_id)
        REFERENCES terrain_feature (id)
);

CREATE TABLE species
(
    id                  integer PRIMARY KEY,
    species_category_id integer             NOT NULL,
    threat_category_id  integer             NOT NULL,
    common_name         varchar(150)        NOT NULL, -- "Brown Spotted Kiwi"
    scientific_name     varchar(150) UNIQUE NOT NULL, -- "Papio anubis"
    maori_name          varchar(150),                 -- "Kiwii"
    population_estimate integer,
    year_assessed       integer,

    -- population_estimate must be 0, 1, 2, 3, ...
    CHECK (population_estimate >= 0),
    -- year_assessed must be between 1900 and the current year
    CHECK (year_assessed > 1900),
    -- year_assessed must be less than the current year
    CHECK (year_assessed <= strftime('%Y', current_date)),

    FOREIGN KEY (species_category_id)
        REFERENCES species_category (id),

    FOREIGN KEY (threat_category_id)
        REFERENCES threat_category (id)

);

CREATE TABLE user
(
    id            integer PRIMARY KEY,
    token         integer UNIQUE,
    email         varchar(100) UNIQUE NOT NULL,
    name          varchar(100)        NOT NULL,
    password_hash varchar(255)        NOT NULL,
    created_at    datetime            NOT NULL,
    updated_at    datetime            NOT NULL,

    -- updated_at must be after created_at
    CHECK (updated_at >= created_at),
    -- password_hash must be between 32 and 250 characters long (use BCrypt)
    --               and only contain letters and numbers
    CHECK (
        length(password_hash) >= 32 AND
        length(password_hash) <= 255 AND
        instr(password_hash, ' ') = 0
        ),
    -- email in form <any>@<any>.<any>
    --               andy@gmail.com
    --               stacy.chain@goo.co.nz
    CHECK (
        email LIKE '%_@_%._%' AND
        instr(email, ' ') = 0
        )
);

CREATE TABLE sighting
(
    id                   integer PRIMARY KEY,
    species_id           integer  NOT NULL,
    observer_user_id     integer,
    sighting_location_id integer  NOT NULL,
    individual_count     integer  NOT NULL DEFAULT 1,
    notes                text,
    sighting_datetime    datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    created_at           datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    sighting_image_id    integer,

    CHECK (individual_count >= 1),

    FOREIGN KEY (species_id)
        REFERENCES species (id),

    FOREIGN KEY (observer_user_id)
        REFERENCES user (id),

    FOREIGN KEY (sighting_location_id)
        REFERENCES location (id),

    FOREIGN KEY (sighting_image_id)
        REFERENCES image (id)
);

CREATE TABLE image
(
    id          integer PRIMARY KEY,
    filename    varchar(255) UNIQUE NOT NULL,
    uploaded_at datetime            NOT NULL
);
