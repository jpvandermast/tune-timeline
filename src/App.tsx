import { lazy, Suspense, useEffect, useState } from 'react';
import { Logo } from './ui/components';
import { handleCallback } from './spotify/auth';

// Tv en telefoon zijn aparte stukken code: de telefoon laadt nooit de tv-code of songs.json.
const TvApp = lazy(() => import('./tv/TvApp'));
const PhoneApp = lazy(() => import('./phone/PhoneApp'));

function Home() {
  return (
    <div className="home">
      <div className="logo">
        <Logo size={80} />
        TUNE·TIMELINE
      </div>
      <p>Het muziektijdlijn-feestspel. De tv speelt de muziek, jij speelt op je telefoon.</p>
      <a className="p" href="/speel">
        Ik doe mee
      </a>
      <a className="s" href="/tv">
        Dit is de tv (host)
      </a>
    </div>
  );
}

function Callback() {
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    handleCallback()
      .then((to) => window.location.replace(to))
      .catch((e: Error) => setErr(e.message));
  }, []);
  return (
    <div className="home">
      <div className="logo">
        <Logo size={80} />
        TUNE·TIMELINE
      </div>
      {err ? (
        <>
          <p>Inloggen bij Spotify lukte niet: {err}</p>
          <a className="p" href="/tv">
            Terug naar de tv
          </a>
        </>
      ) : (
        <p>Spotify koppelen…</p>
      )}
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  let page;
  if (path === '/tv' || path.startsWith('/tv/')) page = <TvApp />;
  else if (path === '/speel' || path.startsWith('/speel/')) page = <PhoneApp />;
  else if (path === '/callback') page = <Callback />;
  else page = <Home />;
  return <Suspense fallback={<div className="home">Laden…</div>}>{page}</Suspense>;
}
