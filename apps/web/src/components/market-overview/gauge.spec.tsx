import { render, screen } from '@testing-library/react';
import { Gauge } from './gauge';

describe('Gauge', () => {
  it('positions the marker proportionally within the range', () => {
    render(
      <Gauge
        value={75}
        min={0}
        max={100}
        direction="green-high"
        minLabel="Fear"
        maxLabel="Greed"
      />,
    );

    expect(screen.getByTestId('gauge-marker')).toHaveStyle({ left: '75%' });
  });

  it('clamps the marker position when the value is outside the range', () => {
    render(
      <Gauge
        value={999}
        min={0}
        max={100}
        direction="red-high"
        minLabel="Calm"
        maxLabel="Fearful"
      />,
    );

    expect(screen.getByTestId('gauge-marker')).toHaveStyle({ left: '100%' });
  });

  it('renders the min/max labels', () => {
    render(
      <Gauge
        value={50}
        min={0}
        max={100}
        direction="green-high"
        minLabel="Fear"
        maxLabel="Greed"
      />,
    );

    expect(screen.getByText('Fear')).toBeInTheDocument();
    expect(screen.getByText('Greed')).toBeInTheDocument();
  });
});
