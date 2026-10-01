import { useState, useEffect } from "react";
import { api } from '../lib/api';
import type { Count } from '../types';
import keaImage from '../assets/kea_2d5851.jpg';
import hectorsDolphinImage from '../assets/hector_s_dolphin_c6e6f9.jpg';
import tuataraImage from '../assets/tuatara_0dbbfd.jpg';
import kiwiImage from '../assets/kiwi.jpg';

// always static, images in assets
const featuredAnimals = [
  { name: 'Kea', category: 'Bird', image: keaImage, blurb: 'A curious alpine parrot found only in the South Island.' },
  { name: 'Hector\'s Dolphin', category: 'Marine mammal', image: hectorsDolphinImage, blurb: 'The world\'s smallest and rarest marine dolphin.' },
  { name: 'Tuatara', category: 'Reptile', image: tuataraImage, blurb: 'A living fossil that predates the dinosaurs.' },
  { name: 'Kiwi', category: 'Bird', image: kiwiImage, blurb: 'New Zealand\'s flightless national icon.' },
];

export default function Home() {
  const [counts, setCounts] = useState<Count>();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api<Count>('/counts', { method: 'GET' })
      .then((data) => setCounts(data))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e)
      })
  }, []);

  const stats = [
    { label: 'Sightings logged', value: counts?.sightings_count },
    { label: 'Species tracked', value: counts?.species_count },
    { label: 'Regions covered', value: counts?.region_count },
    { label: 'Contributors', value: counts?.users_count },
  ];

  return (
    <div className="container">
      <section className="hero">
        <h1>Track New Zealand's wildlife, together</h1>
        <p>Log sightings, browse species, and help build a picture of where Aotearoa's animals are showing up.</p>
        <div className="hero-actions">
          <a className="btn-primary" href="/sightings">Browse sightings</a>
          <a className="btn-secondary" href="/species">Explore species</a>
        </div>
      </section>

      <section className="stats-row">
        {stats.map(stat => (
          <div className="stat-card" key={stat.label}>
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="featured-section">
        <div className="section-heading">
          <h2>Featured animals</h2>
          <a href="/species">View all species</a>
        </div>
        <div className="featured-grid">
          {featuredAnimals.map(animal => (
            <div className="featured-card" key={animal.name}>
              <div className="featured-image"><img src={animal.image} alt={animal.name} /></div>
              <span className="featured-category">{animal.category}</span>
              <h4>{animal.name}</h4>
              <p>{animal.blurb}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
