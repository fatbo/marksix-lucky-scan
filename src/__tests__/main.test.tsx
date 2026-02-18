import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('main entry routing', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    window.history.pushState({}, '', '/');
  });

  it('configures BrowserRouter with the Vite base path for GitHub Pages', async () => {
    const render = vi.fn();
    const createRoot = vi.fn(() => ({ render }));
    const browserRouter = vi.fn();

    vi.doMock('react-dom/client', () => ({ createRoot }));
    vi.doMock('react-router-dom', () => ({ BrowserRouter: browserRouter }));
    vi.doMock('../App', () => ({ default: () => null }));

    await import('../main');

    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(render).toHaveBeenCalledTimes(1);
    const strictModeElement = render.mock.calls[0][0];
    const browserRouterElement = strictModeElement.props.children;
    expect(browserRouterElement.type).toBe(browserRouter);
    expect(browserRouterElement.props.basename).toBe(import.meta.env.BASE_URL);
  });
});
