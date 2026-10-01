import { useState, useEffect } from "react";
import type { SpeciesCategory, Region, Terrain, Sighting } from '../types';
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
  const [terrains, setTerrains] = useState<Terrain[]>();
  const [selectedTerrain, setSelectedTerrain] = useState<number[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [error, setError] = useState<Error | null>(null);

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
      .then((terrain) => setTerrains(terrain))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e);
      });

    api<Sighting[]>('/sightings', { method: 'GET' })
      .then((sighting) => {
        setSightings(sighting);
      })
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
            {terrains?.map((terrain) => {
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
            <h4>{sightings?.length}</h4>
            <p>sightings</p>
          </div>
          <div className="sightings-grid">
            {error && <div><h4>{error.message}</h4></div>}
            {sightings && sightings.map(sighting => {

              const sighting_date = new Date(sighting.sighting_datetime);
              const humanReadableSD = new Intl.DateTimeFormat('en-NZ', {
                dateStyle: 'medium',
                timeStyle: 'short'
              }).format(sighting_date);

              const threatClass = sighting.threat_category?.toLowerCase().replace(/\s+/g, '-');
              const terrainFeatures = (sighting.terrain_features ?? '')
                .split(',')
                .map((feature) => feature.trim())
                .filter(Boolean);

              return (
                <div key={sighting.id} className="sightings-card">
                  <div className="card-image">

                  </div>
                  <div className="card-body">
                    <div className="card-header">
                      <span className={`tag threat-tag ${threatClass}`}>
                        {sighting.threat_category}
                      </span>
                      <p className="card-category">
                        {sighting.species_category}
                      </p>
                    </div>
                    <div className="card-desc">
                      <h4>{sighting.common_name}</h4>
                      <p>{sighting.maori_name ?? "⎯"}</p>
                      <p className="italics">{sighting.scientific_name}</p>
                      <span className="location"><p>&#x2316; {sighting.location_name}, {sighting.region}</p></span>
                    </div>
                    <div className="card-tags">
                      {terrainFeatures.map((feature) => (
                        <span key={feature} className="tag terrain-tag">{feature}</span>
                      ))}
                    </div>
                    <div className="card-info">
                      <p>{sighting.num_seen} individuals</p>
                      <p>Pop. est. {sighting.population_estimate}</p>
                    </div>
                    <div className="card-footer">
                      <b>{sighting.observer_name}</b>
                      <p>{humanReadableSD}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
