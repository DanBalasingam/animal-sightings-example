import { useState } from "react";

export default function Sightings() {
  const [sortBy, setSortBy] = useState('newest');
  const [regions, setRegions] = useState('all');

  return (
    <div className="container">
      <div className="sightings-heading">
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
      </div>
      <div className="sightings-body">
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
            {/* think about how to create the selection buttons... */}
          </div>
          <h4>Region</h4>
          <select
            value={regions}
            onChange={e => setRegions(e.target.value)}
          > {/* probs need to fix this up to select multiple and create an array instead */}
            <option value='all'>All regions</option>
            {/* map to a list of regions from the api... */}
          </select>
          <h4>Terrain feature</h4>
          <p>Show sightings at places with any selected features</p>
          <div className="terrain-options">
            {/* think about how to create the selection buttons... */}
          </div>
        </div>
        <div className="sightings-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '5px', margin: '0px', padding: '0px' }}>
            <h4>0</h4> {/* need to dynamically count sights */}
            <p>sightings</p>
          </div>
          <div className="sightings-cards">
            <div className="sightings-card">
              <img />
              <div className="card-header">

              </div>
              <div className="card-name">

              </div>
              <div className="card-tags">

              </div>
              <div className="card-info">

              </div>
              <div className="card-footer">

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
