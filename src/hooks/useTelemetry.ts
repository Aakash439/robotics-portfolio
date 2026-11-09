import { useEffect, useState } from 'react';

export interface SystemTelemetry {
  resolution: string;
  language: string;
  timestamp: string;
  status: 'ONLINE' | 'STANDBY';
}

export const useTelemetry = (): SystemTelemetry => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    resolution: '1920x1080',
    language: 'en-US',
    timestamp: new Date().toISOString(),
    status: 'ONLINE',
  });

  useEffect(() => {
    setTelemetry({
      resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || 'en-US',
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
    });
  }, []);

  return telemetry;
};
