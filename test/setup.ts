// Vitest setup file
// Mock server-only module to prevent errors in tests
import { vi } from 'vitest';

// Mock the server-only module
vi.mock('server-only', () => ({}));
