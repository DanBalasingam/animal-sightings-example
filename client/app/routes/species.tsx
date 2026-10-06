import { useState, useEffect } from "react";
import type { Specie, SpeciesCategory } from '../types';
import { api } from '../lib/api';

const ALL_CATEGORY: SpeciesCategory = { id: 0, name: 'All' };

type SortColumn = 'common_name' | 'maori_name' | 'scientific_name';
type Sort = { column: SortColumn; order: 'ASC' | 'DESC' };
const DEFAULT_SORT: Sort = { column: 'common_name', order: 'ASC' };

type SortableHeadingProps = {
  column: SortColumn;
  label: string;
  sort: Sort;
  onSort: (column: SortColumn) => void;
};

function SortableHeading({ column, label, sort, onSort }: SortableHeadingProps) {
  const active = sort.column === column;
  const ariaSort = active ? (sort.order === 'ASC' ? 'ascending' : 'descending') : 'none';

  return (
    <th aria-sort={ariaSort}>
      <button type="button" className={active ? 'sort-heading active' : 'sort-heading'} onClick={() => onSort(column)}>
        {label}
        <span className="sort-arrow" aria-hidden="true">
          {active ? (sort.order === 'ASC' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

export default function Species() {
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedId, setSelectedId] = useState(0);
  const [categories, setCategories] = useState<SpeciesCategory[]>([ALL_CATEGORY]);
  const [species, setSpecies] = useState<Specie[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);

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
      params.set('sort', sort.column);
      params.set('order', sort.order);
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
  }, [filterSearch, selectedId, categories, sort]);

  // Clicking the sorted column flips its direction, clicking another column sorts it A-Z
  function handleSort(column: SortColumn) {
    setSort((prev) =>
      prev.column === column
        ? { column, order: prev.order === 'ASC' ? 'DESC' : 'ASC' }
        : { column, order: 'ASC' }
    );
  }

  function clearFilters() {
    setFilterSearch('');
    setSelectedId(0);
    setSort(DEFAULT_SORT);
  }

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
          <a className="clear-filters" onClick={() => clearFilters()}>Clear all filters</a>
        </div>
        {error && <div><h4>{error.message}</h4></div>}
        <table>
          <thead>
            <tr>
              <SortableHeading column="common_name" label="Common name" sort={sort} onSort={handleSort} />
              <SortableHeading column="maori_name" label="Maori name" sort={sort} onSort={handleSort} />
              <SortableHeading column="scientific_name" label="Scientific name" sort={sort} onSort={handleSort} />
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
          </tbody>
        </table>
      </section>
    </div>
  );
}
