import { useState, useEffect } from "react";
import type { Specie, SpeciesCategory } from '../types';
import { api } from '../lib/api';

const ALL_CATEGORY: SpeciesCategory = { id: 0, name: 'All' };

export default function Species() {
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedId, setSelectedId] = useState(0);
  const [categories, setCategories] = useState<SpeciesCategory[]>([ALL_CATEGORY]);
  const [species, setSpecies] = useState<Specie[]>([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api<SpeciesCategory[]>('/species/categories', { method: 'GET' })
      .then((data) => setCategories([ALL_CATEGORY, ...data]))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    // debounce timeout, 300ms
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (filterSearch.trim() !== '') params.set('search', filterSearch.trim());
      if (selectedId !== 0) {
        const category = categories.find((c) => c.id === selectedId);
        if (category) params.set('category', category.name);
      }
      const query = params.toString();

      api<Specie[]>(`/species${query ? `?${query}` : ''}`, { method: 'GET' })
        .then((data) => {
          if (!cancelled) setSpecies(data);
        })
        .catch((e) => {
          if (!cancelled && e.name !== 'AbortError') setError(e);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [filterSearch, selectedId, categories]);

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
              const isSelected = selectedId === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedId(category.id)}
                  className={isSelected ? "filter-category-btn selected" : "filter-category-btn"}
                >
                  {category.name}
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
                  <td>{specie.species_category}</td>
                  <td>{specie.threat_category}</td>
                  <td>{specie.population_estimate}</td>
                  <td>{specie.sightings}</td>
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
