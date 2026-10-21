import { useEffect, useState } from 'preact/hooks';
import { GAME_NAME } from '../config.ts';
import { loadGameData, type GameData } from '../data/load.ts';
import { configKey } from '../game/modes.ts';
import { loadSettings, saveSettings, type Settings } from '../game/storage.ts';
import type { GameConfig } from '../game/types.ts';
import { Game } from './Game.tsx';
import { Home } from './Home.tsx';
import { Help, SettingsPage, StatsPage } from './Pages.tsx';

type Screen = { name: 'home' } | { name: 'game'; config: GameConfig; nonce: number } | { name: 'stats' } | { name: 'help' } | { name: 'settings' };

export function App() {
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>(() => (loadSettings().seenIntro ? { name: 'home' } : { name: 'help' }));
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    loadGameData().then(setData, (e) => setError(String(e?.message ?? e)));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme === 'auto' ? '' : settings.theme;
    if (!settings.theme || settings.theme === 'auto') delete document.documentElement.dataset.theme;
  }, [settings.theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = screen.name === 'game' ? `${GAME_NAME} · playing` : GAME_NAME;
  }, [screen]);

  const goHome = () => setScreen({ name: 'home' });
  const play = (config: GameConfig) => setScreen({ name: 'game', config, nonce: Date.now() });

  if (error) {
    return (
      <div class="screen center">
        <h1>{GAME_NAME}</h1>
        <p>Something went wrong loading the game: {error}</p>
        <button onClick={() => location.reload()}>Try again</button>
      </div>
    );
  }
  if (!data) {
    return (
      <div class="screen center loading-screen">
        <h1 class="logo">{GAME_NAME}</h1>
        <div class="spinner" aria-label="Loading" />
      </div>
    );
  }

  switch (screen.name) {
    case 'game':
      return <Game key={configKey(screen.config) + screen.nonce} data={data} config={screen.config} settings={settings} onExit={goHome} onPlay={play} />;
    case 'stats':
      return <StatsPage data={data} onBack={goHome} />;
    case 'help':
      return (
        <Help
          onBack={() => {
            if (!settings.seenIntro) {
              const s = { ...settings, seenIntro: true };
              saveSettings(s);
              setSettings(s);
            }
            goHome();
          }}
        />
      );
    case 'settings':
      return <SettingsPage settings={settings} onChange={setSettings} onBack={goHome} />;
    default:
      return <Home data={data} onPlay={play} onNav={(n) => setScreen({ name: n } as Screen)} />;
  }
}
