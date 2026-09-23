import { useState, useEffect } from "react";
import type { Specie } from '../types';
import { api, ApiError } from '../lib/api';

const categories = [
  {cat: 'All'},
  {cat: 'Bird'},
  {cat: 'Mammal'},
  {cat: 'Reptile'},
  {cat: 'Amphibian'},
  {cat: 'Fish'},
  {cat: 'Invertebrate'},
];

export default function Species() {
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedId, setSelectedId] = useState('all');
  const [species, setSpecies] = useState<Specie[]>();
  const [error, setError] = useState(null);

  useEffect(() => {
    api<Specie[]>('/species', { method: 'GET' })
      .then(setSpecies)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e);
      });
  }, []);

  return (
    <div className="container">
      <section className="species-heading">
        <h1>Species</h1>
        <p>Threat status from New Zealand Threat Classification System (NZCTS).</p>
      </section>
      <section className="species-filters">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            name="filter-search"
            placeholder="Any name"
            className="filter-search"
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Category</label>
          <div className="filter-option">
            {categories.map((category) => {
              const isSelected = selectedId === category.cat.toLowerCase();

              return (
                <button
                  key={category.cat.toLowerCase()}
                  onClick={() => setSelectedId(category.cat.toLowerCase())}
                  className={isSelected ? "filter-category-btn selected" : "filter-category-btn"}
                >
                  {category.cat}
                </button>
              )
            })}
          </div>
        </div>
      </section>
      <section className="species-body">
        <div className="species-count">
          <p>Showing {species?.length} species</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Common name</th>
              <th>Maori name</th>
              <th>Scientific name</th>
              <th>Category</th>
              <th>Threat level</th>
              <th>Population est.</th>
              <th>Sightings</th>
            </tr>
          </thead>
          <tbody>
            {species && species.map(specie => {
              return (
                <tr>
                  <td>{specie.common_name}</td>
                  <td>{specie.maori_name ?? "⎯"}</td>
                  <td>{specie.scientific_name}</td>
                  <td>{specie.species_category_id} fix</td>
                  <td>{specie.threat_category_id} fix</td>
                  <td>{specie.population_estimate}</td>
                  <td>not working lol</td>
                </tr>
              )
            })}
            {error && <div><h4>{error}</h4></div>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
