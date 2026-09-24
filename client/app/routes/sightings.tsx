import { useState, useEffect } from "react";
import type { SpeciesCategory, Region, Terrain } from '../types';
import { api } from '../lib/api';

const ALL_CATEGORY: SpeciesCategory = { id: 0, name: 'All' };
const ALL_REGION: Region = { region: 'All Regions' };

export default function Sightings() {
  const [sortBy, setSortBy] = useState('newest');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(0);
  const [categories, setCategories] = useState<SpeciesCategory[]>([ALL_CATEGORY]);
  const [regions, setRegions] = useState<Region[]>([ALL_REGION]);
  const [selectedRegion, setSelectedRegion] = useState<string>(ALL_REGION.region);
  const [placeSearch, setPlaceSearch] = useState('');
  const [terrain, setTerrain] = useState<Terrain[]>();
  const [selectedTerrain, setSelectedTerrain] = useState<number[]>([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api<SpeciesCategory[]>('/species/categories', { method: 'GET' })
      .then((categories) => setCategories([ALL_CATEGORY, ...categories]))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e);
      });

    api<Region[]>('/regions', { method: 'GET' })
      .then((regions) => setRegions([ALL_REGION, ...regions]))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e);
      });

    api<Terrain[]>('/terrain', { method: 'GET' })
      .then((terrain) => setTerrain(terrain))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e);
      });
  }, []);

  return (
    <div className="container">
      <section className="sightings-heading">
        <div className="heading-left">
          <h1>Sightings</h1>
          <p>Every sighting recorded by the community, newest first unless you choose otherwise.</p>
        </div>
        <div className="heading-right">
          <span>
            <p>Sort by</p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Newest sighting first</option>
              <option value="oldest">Oldest sighting first</option>
            </select>
          </span>
        </div>
      </section>
      <section className="sightings-body">
        <div className="filter-option-container">
          <div className="filter-option-heading">
            <h3>Filters</h3>
            <a style={{ textDecoration: 'underline', cursor: 'pointer' }}>Clear all</a> {/* onclick remove all filters */}
          </div>
          <span style={{ display: 'flex', gap: '0.5rem' }}>
            <input type='checkbox' name='mySightings' />
            <p>Only my sightings</p>
          </span>
          <h4>Species category</h4>
          <div className="species-options">
            <div className="filter-option">
              {categories.map((category) => {
                const isSelected = selectedSpeciesId === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedSpeciesId(category.id)}
                    className={isSelected ? "filter-category-btn selected" : "filter-category-btn"}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>
          <h4>Region</h4>

          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
          >
            {regions.map((region) => {
              return (
                <option key={region.region} value={region.region}>{region.region}</option>
              )
            })}
          </select>
          <h4>Place</h4>
          <input
            type="text"
            name="place-search"
            className="place-search"
            placeholder="Town, hut, track..."
            value={placeSearch}
            onChange={e => setPlaceSearch(e.target.value)}
          />
          <h4>Terrain feature</h4>
          <p>Show sightings at places with any selected features</p>
          <div className="terrain-options">
            {/* Change to a drop down multi select */}
            {terrain?.map((terrain) => {
              const isSelected = selectedTerrain.includes(terrain.id);

              const toggleTerrain = () => {
                setSelectedTerrain((prev) =>
                  prev.includes(terrain.id)
                    ? prev.filter((id) => id !== terrain.id)
                    : [...prev, terrain.id]
                );
              };

              return (
                <button
                  key={terrain.id}
                  onClick={toggleTerrain}
                  className={isSelected ? "filter-category-btn selected" : "filter-category-btn"}
                >
                  {terrain.name}
                </button>
              )
            })}
          </div>
        </div>
        <div className="sightings-content">
          <div className="sightings-count">
            <h4>0</h4> {/* need to dynamically count sights */}
            <p>sightings</p>
          </div>
          <div className="sightings-grid">
            {error && <div><h4>{error}</h4></div>}
            <div className="sightings-card">
              <div className="sightings-image"></div>
              <span className="sightings-category"></span>
              <div className="sightings-desc"></div>
              <span className="sightings-tags"></span>
              <div className="sightings-user"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
